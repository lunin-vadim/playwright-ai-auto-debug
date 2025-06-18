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
        if (module.ai_conf) {
          console.log(JSON.stringify(module.ai_conf));
        } else {
          console.error('ai_conf not found in module');
          process.exit(1);
        }
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
          const cleanOutput = output.trim();
          if (!cleanOutput) {
            reject(new Error('Empty output from TypeScript config'));
            return;
          }
          const config = JSON.parse(cleanOutput);
          resolve(config);
        } catch (parseError) {
          reject(new Error(`Failed to parse TypeScript config: ${parseError.message}. Output: "${output.trim()}"`));
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
 * @param {Object} domSnapshot - optional DOM snapshot from MCP
 * @returns {Array} - array of messages for API
 */
function buildMessages(promptContent, config, domSnapshot = null) {
  const messages = [...(config.messages || [])];
  
  let userContent = `Here's an error from a Playwright test:\n\n${promptContent}`;
  
  // Add DOM snapshot if available
  if (domSnapshot && domSnapshot.elements) {
    userContent += `\n\n## 📸 DOM Snapshot (${domSnapshot.elements.length} elements)\n\n`;
    userContent += `The current page structure:\n`;
    
    // Add structured DOM information
    domSnapshot.elements.forEach((element, index) => {
      if (index < 20) { // Limit to first 20 elements to save tokens
        userContent += `- **Element ${element.ref || index}**: `;
        if (element.role) userContent += `role="${element.role}" `;
        if (element.name) userContent += `name="${element.name}" `;
        if (element.text) userContent += `text="${element.text.substring(0, 50)}${element.text.length > 50 ? '...' : ''}" `;
        if (element.selector) userContent += `selector="${element.selector}" `;
        userContent += `\n`;
      }
    });
    
    if (domSnapshot.elements.length > 20) {
      userContent += `... and ${domSnapshot.elements.length - 20} more elements\n`;
    }
    
    userContent += `\n**Note:** Use the exact element references (ref) from the snapshot when suggesting fixes. This ensures the actions can be validated through MCP.`;
  }
  
  userContent += `\n\nPlease suggest a specific solution to this problem.`;
  
  // Add enhanced instructions for MCP mode
  if (domSnapshot) {
    userContent += ` Focus on using the exact selectors and element references from the DOM snapshot. Provide Playwright code that can be validated through MCP browser automation.`;
  }
  
  // Add user message with error and optional DOM snapshot
  messages.push({
    role: 'user',
    content: userContent
  });
  
  return messages;
}

export { loadAiConfig, buildMessages }; 