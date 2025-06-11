import { readFile, access } from 'fs/promises';
import { join } from 'path';
import { pathToFileURL } from 'url';

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
    
    // Import configuration as ES module
    const configUrl = pathToFileURL(configPath).href;
    const configModule = await import(configUrl);
    const config = configModule.default || configModule;
    
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