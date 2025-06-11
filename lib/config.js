import { readFile, access } from 'fs/promises';
import { join } from 'path';
import { pathToFileURL } from 'url';
import { spawn } from 'child_process';
import { promisify } from 'util';

/**
 * Checks if tsx is available
 * @returns {Promise<boolean>} - true if tsx is available
 */
async function isTsxAvailable() {
  try {
    const { execSync } = await import('child_process');
    execSync('npx tsx --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Loads TypeScript configuration using tsx
 * @param {string} configPath - path to TypeScript config file
 * @returns {Promise<Object>} - configuration object
 */
async function loadTypeScriptConfig(configPath) {
  // Check if tsx is available
  const tsxAvailable = await isTsxAvailable();
  
  if (!tsxAvailable) {
    throw new Error(`Cannot load TypeScript config file. tsx is not available. Please either:
1. Install tsx: npm install tsx
2. Or rename playwright.config.ts to playwright.config.js and convert to JavaScript`);
  }
  
  try {
    const { execSync } = await import('child_process');
    
    // Convert to absolute path and file URL for proper import
    const absolutePath = pathToFileURL(configPath).href;
    
    // Use tsx to execute the config file directly with proper async handling
    const result = execSync(`npx tsx -e "
      (async () => {
        try {
          const config = await import('${absolutePath}');
          const configData = config.default || config;
          console.log(JSON.stringify(configData, null, 2));
        } catch (error) {
          console.error('Import error:', error.message);
          process.exit(1);
        }
      })();
    "`, { 
      encoding: 'utf8',
      cwd: process.cwd(),
      timeout: 10000 // 10 second timeout
    });
    
    const configData = result.trim();
    if (!configData) {
      throw new Error('Empty configuration returned from TypeScript file');
    }
    
    return JSON.parse(configData);
  } catch (error) {
    if (error.message.includes('JSON')) {
      throw new Error(`Invalid configuration format in TypeScript file: ${error.message}`);
    }
    
    throw new Error(`Failed to load TypeScript config: ${error.message}`);
  }
}

/**
 * Loads AI configuration from playwright.config.js or playwright.config.ts
 * @param {string} projectRoot - project root folder (defaults to current)
 * @returns {Promise<Object>} - AI configuration
 */
async function loadAiConfig(projectRoot = process.cwd()) {
  // Try both .ts and .js config files
  const configPaths = [
    join(projectRoot, 'playwright.config.ts'),
    join(projectRoot, 'playwright.config.js')
  ];
  
  let configPath = null;
  let configExists = false;
  
  // Find existing config file
  for (const path of configPaths) {
    try {
      await access(path);
      configPath = path;
      configExists = true;
      break;
    } catch {
      // File doesn't exist, try next
    }
  }
  
  if (!configExists) {
    throw new Error(`playwright.config.js or playwright.config.ts not found in ${projectRoot}`);
  }
  
  try {
    let config;
    
    // Handle TypeScript configuration files
    if (configPath.endsWith('.ts')) {
      console.log('📋 Loading TypeScript configuration...');
      config = await loadTypeScriptConfig(configPath);
    } else {
      console.log('📋 Loading JavaScript configuration...');
      // Import configuration as ES module for JS files
      const configUrl = pathToFileURL(configPath).href;
      const configModule = await import(configUrl);
      config = configModule.default || configModule;
    }
    
    if (!config.ai_conf) {
      throw new Error('ai_conf section not found in playwright config file');
    }
    
    // Validate required fields
    const aiConfig = config.ai_conf;
    
    if (!aiConfig.api_key) {
      throw new Error('api_key is required in ai_conf');
    }
    
    // Set default values
    const defaultConfig = {
      ai_server: 'https://api.mistral.ai',
      model: 'mistral-medium',
      results_dir: 'test-results',
      report_dir: 'playwright-report',
      max_prompt_length: 2000,
      request_delay: 2000,
      error_file_patterns: [
        'copy-prompt.txt',      // Standard Playwright file
        'error-context.md',     // Alternative format
        'error.txt',            // Simple text file
        'test-error.md',        // Markdown with error
        '*-error.txt',          // Files ending with -error.txt
        '*-error.md'            // Files ending with -error.md
      ],
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant for debugging Playwright tests. Analyze errors and suggest specific solutions in English. Be concise and to the point.'
        }
      ]
    };
    
    // Merge with user configuration
    const finalConfig = {
      ...defaultConfig,
      ...aiConfig
    };
    
    const configFileName = configPath.endsWith('.ts') ? 'playwright.config.ts' : 'playwright.config.js';
    console.log(`✅ AI configuration loaded from ${configFileName}`);
    return finalConfig;
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`playwright.config.js or playwright.config.ts not found in ${projectRoot}`);
    }
    
    if (error.message.includes('ai_conf') || error.message.includes('api_key')) {
      throw error;
    }
    
    // Handle TypeScript specific errors
    if (error.message.includes('Cannot load TypeScript config file')) {
      throw error;
    }
    
    if (error.message.includes('Unknown file extension ".ts"')) {
      throw new Error(`TypeScript configuration detected but tsx is not available. Please either:
1. Install tsx: npm install tsx
2. Or rename playwright.config.ts to playwright.config.js and convert to JavaScript
Original error: ${error.message}`);
    }
    
    throw new Error(`Configuration loading error: ${error.message}`);
  }
}

/**
 * Creates messages for AI API based on configuration
 * @param {Object} config - AI configuration
 * @param {string} promptContent - error content
 * @returns {Array} - array of messages for API
 */
function buildMessages(config, promptContent) {
  const messages = [...config.messages];
  
  // Add user message with error
  messages.push({
    role: 'user',
    content: `Here's an error from a Playwright test:\n\n${promptContent}\n\nPlease suggest a specific solution to this problem.`
  });
  
  return messages;
}

export { loadAiConfig, buildMessages }; 