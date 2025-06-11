import { existsSync } from 'fs';
import { pathToFileURL } from 'url';
import { spawn } from 'child_process';

/**
 * Loads TypeScript configuration using tsx
 * @param {string} configPath - path to TypeScript config file
 * @returns {Promise<Object>} - AI configuration
 */
async function loadTsConfig(configPath) {
  return new Promise((resolve, reject) => {
    const tsxProcess = spawn('npx', ['tsx', '--eval', `
      import('${pathToFileURL(configPath).href}').then(module => {
        console.log(JSON.stringify(module.ai_conf));
      }).catch(err => {
        console.error('Error:', err.message);
        process.exit(1);
      });
    `], { stdio: ['pipe', 'pipe', 'pipe'] });

    let output = '';
    let errorOutput = '';

    tsxProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    tsxProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    tsxProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const config = JSON.parse(output.trim());
          resolve(config);
        } catch (parseError) {
          reject(new Error(`Failed to parse TypeScript config: ${parseError.message}`));
        }
      } else {
        reject(new Error(`TypeScript config loading failed: ${errorOutput}`));
      }
    });
  });
}

/**
 * Loads JavaScript configuration using dynamic import
 * @param {string} configPath - path to JavaScript config file
 * @returns {Promise<Object>} - AI configuration
 */
async function loadJsConfig(configPath) {
  try {
    const module = await import(pathToFileURL(configPath).href);
    return module.ai_conf;
  } catch (error) {
    throw new Error(`Failed to load JavaScript config: ${error.message}`);
  }
}

/**
 * Loads AI configuration from ai.conf.js or ai.conf.ts
 * @returns {Promise<Object>} - AI configuration
 */
async function loadAiConfig() {
  try {
    let config;
    
    // Check for TypeScript config first
    if (existsSync('./ai.conf.ts')) {
      console.log('📝 Loading TypeScript configuration from ai.conf.ts');
      config = await loadTsConfig('./ai.conf.ts');
    } else if (existsSync('./ai.conf.js')) {
      // Fallback to JavaScript config
      console.log('📝 Loading JavaScript configuration from ai.conf.js');
      config = await loadJsConfig('./ai.conf.js');
    } else {
      throw new Error('Configuration file not found. Please create ai.conf.js or ai.conf.ts');
    }
    
    // Validate required fields
    if (!config.api_key) {
      throw new Error('api_key is required in ai_conf');
    }
    
    console.log('✅ AI configuration loaded successfully');
    return config;
    
  } catch (error) {
    throw new Error(`Configuration loading error: ${error.message}`);
  }
}

/**
 * Creates messages for AI API based on configuration
 * @param {string} promptContent - error content
 * @param {Object} config - AI configuration
 * @returns {Array} - array of messages for API
 */
function buildMessages(promptContent, config) {
  const messages = [...(config.messages || [])];
  
  // Add user message with error
  messages.push({
    role: 'user',
    content: `Here's an error from a Playwright test:\n\n${promptContent}\n\nPlease suggest a specific solution to this problem.`
  });
  
  return messages;
}

export { loadAiConfig, buildMessages }; 