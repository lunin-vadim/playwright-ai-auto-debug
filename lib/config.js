import { existsSync } from 'fs';
import { pathToFileURL } from 'url';
import { spawn } from 'child_process';
import { quickValidate } from './configValidator.js';

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
 * Loads AI configuration from ai.conf.js or ai.conf.ts with validation
 * @param {boolean} skipValidation - skip quick validation (default: false)
 * @returns {Promise<Object>} - AI configuration
 */
async function loadAiConfig(skipValidation = false) {
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
      throw new Error('Configuration file not found. Run "playwright-ai setup" to create configuration');
    }
    
    // Validate required fields
    if (!config.api_key) {
      throw new Error('api_key is required in ai_conf. Run "playwright-ai setup" to configure');
    }

    // Quick validation (unless skipped)
    if (!skipValidation) {
      const isValid = quickValidate(config);
      if (!isValid) {
        console.log('⚠️  Configuration has issues. Run "playwright-ai validate" for details');
      }
    }
    
    console.log('✅ AI configuration loaded successfully');
    return config;
    
  } catch (error) {
    throw new Error(`Configuration loading error: ${error.message}`);
  }
}

/**
 * Build messages array for AI with optional DOM snapshot
 * @param {string} promptContent - error content
 * @param {Object} config - AI configuration
 * @param {Object} domSnapshot - optional DOM snapshot from MCP
 * @returns {Array} - messages array for AI
 */
function buildMessages(promptContent, config, domSnapshot = null) {
  // Start with configured messages (system messages)
  let messages = [...(config.messages || [])];
  
  // If no messages configured, add default system message
  if (messages.length === 0) {
    messages.push({
      role: 'system',
      content: 'Ты AI помощник по отладке Playwright тестов. Анализируй ошибки и предлагай конкретные решения на русском языке. Отвечай кратко и по делу с примерами кода.'
    });
  }

  // Prepare error content
  let errorContent = `Ошибка в Playwright тесте:\n\n${promptContent}`;

  // Add DOM snapshot if available
  if (domSnapshot) {
    errorContent += `\n\n📸 DOM Snapshot (MCP):\n${JSON.stringify(domSnapshot, null, 2)}`;
    
    // Add MCP-specific instruction if not already present
    const hasMcpInstructions = messages.some(msg => 
      msg.content && msg.content.includes('MCP') || msg.content.includes('DOM snapshot')
    );
    
    if (!hasMcpInstructions) {
      messages.push({
        role: 'system',
        content: 'При наличии MCP DOM snapshots используй точные ссылки на элементы (ref). Фокусируйся на надежных селекторах getByRole, getByTestId, getByText. Предлагай проверяемый через браузерную автоматизацию код.'
      });
    }
  }

  // Add user message with error
  messages.push({
    role: 'user',
    content: errorContent
  });

  return messages;
}

/**
 * Get configuration with caching
 */
let cachedConfig = null;
let configLoadTime = null;

/**
 * Load configuration with optional caching
 * @param {boolean} forceReload - force reload even if cached
 * @param {boolean} skipValidation - skip validation 
 * @returns {Promise<Object>} - AI configuration
 */
async function loadAiConfigCached(forceReload = false, skipValidation = false) {
  const now = Date.now();
  
  // Use cache if available and less than 5 minutes old
  if (!forceReload && cachedConfig && configLoadTime && (now - configLoadTime < 5 * 60 * 1000)) {
    return cachedConfig;
  }
  
  // Load fresh config
  cachedConfig = await loadAiConfig(skipValidation);
  configLoadTime = now;
  
  return cachedConfig;
}

/**
 * Clear configuration cache
 */
function clearConfigCache() {
  cachedConfig = null;
  configLoadTime = null;
}

export { 
  loadAiConfig, 
  buildMessages, 
  loadAiConfigCached, 
  clearConfigCache 
}; 