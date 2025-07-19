// lib/configWizard.js

import fs from 'fs';
import path from 'path';
import { createInterface } from 'readline';

/**
 * CLI Setup Wizard for initial configuration
 */
export class ConfigWizard {
  constructor() {
    this.rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * Start interactive setup wizard
   */
  async startWizard() {
    console.log('🧙‍♂️ Welcome to Playwright AI Auto-Debug Setup Wizard!');
    console.log('═'.repeat(60));
    console.log('This wizard will help you create the perfect configuration.');
    console.log('');

    try {
      const config = await this.collectConfigData();
      const filePath = await this.createConfigFile(config);
      await this.showCompletionMessage(filePath);
    } catch (error) {
      console.log('\n❌ Setup cancelled:', error.message);
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }

  /**
   * Collect configuration data from user
   */
  async collectConfigData() {
    console.log('📋 Step 1: Basic Configuration');
    console.log('─'.repeat(30));

    // API Provider selection
    const provider = await this.selectProvider();
    const apiConfig = await this.configureProvider(provider);

    console.log('\n📁 Step 2: Project Settings');
    console.log('─'.repeat(30));

    const projectConfig = await this.configureProject();

    console.log('\n🔧 Step 3: Advanced Options');
    console.log('─'.repeat(30));

    const advancedConfig = await this.configureAdvanced();

    console.log('\n⚡ Step 4: Performance & MCP');
    console.log('─'.repeat(30));

    const performanceConfig = await this.configurePerformance();

    return {
      ...apiConfig,
      ...projectConfig,
      ...advancedConfig,
      ...performanceConfig
    };
  }

  /**
   * Select AI provider
   */
  async selectProvider() {
    console.log('🤖 Choose your AI provider:');
    console.log('1. Mistral AI (recommended)');
    console.log('2. OpenAI ChatGPT');
    console.log('3. Anthropic Claude');
    console.log('4. Custom provider');

    const choice = await this.question('Enter your choice (1-4): ');
    
    const providers = {
      '1': 'mistral',
      '2': 'openai', 
      '3': 'anthropic',
      '4': 'custom'
    };

    return providers[choice] || 'mistral';
  }

  /**
   * Configure selected provider
   */
  async configureProvider(provider) {
    const configs = {
      mistral: {
        ai_server: 'https://api.mistral.ai',
        model: 'mistral-medium',
        name: 'Mistral AI'
      },
      openai: {
        ai_server: 'https://api.openai.com',
        model: 'gpt-4',
        name: 'OpenAI'
      },
      anthropic: {
        ai_server: 'https://api.anthropic.com',
        model: 'claude-3-sonnet',
        name: 'Anthropic'
      }
    };

    const config = configs[provider];
    if (config) {
      console.log(`✅ Selected: ${config.name}`);
      console.log(`🔗 Server: ${config.ai_server}`);
      console.log(`🧠 Model: ${config.model}`);
    }

    if (provider === 'custom') {
      config = {
        ai_server: await this.question('Enter API server URL: '),
        model: await this.question('Enter model name: '),
        name: 'Custom'
      };
    }

    console.log('\n🔑 API Key Configuration:');
    console.log('1. Use environment variable (recommended)');
    console.log('2. Enter API key directly');

    const keyChoice = await this.question('Choose API key method (1-2): ');
    
    if (keyChoice === '2') {
      const apiKey = await this.question('Enter your API key: ', true);
      config.api_key = apiKey;
      console.log('⚠️  Remember to add ai.conf.js to .gitignore!');
    } else {
      config.api_key = "process.env.API_KEY || 'your-api-key-here'";
      console.log('💡 Set your API key: export API_KEY=your-actual-key');
    }

    return config;
  }

  /**
   * Configure project settings  
   */
  async configureProject() {
    const resultsDir = await this.question('Test results directory [test-results]: ') || 'test-results';
    const reportDir = await this.question('HTML reports directory [playwright-report]: ') || 'playwright-report';
    
    const useAllure = await this.confirm('Enable Allure integration?');
    let allureConfig = {};
    
    if (useAllure) {
      allureConfig = {
        allure_integration: true,
        allure_results_dir: await this.question('Allure results directory [allure-results]: ') || 'allure-results'
      };
    }

    return {
      results_dir: resultsDir,
      report_dir: reportDir,
      ...allureConfig
    };
  }

  /**
   * Configure advanced options
   */
  async configureAdvanced() {
    const saveResponses = await this.confirm('Save AI responses to files?');
    let responseConfig = {};

    if (saveResponses) {
      responseConfig = {
        save_ai_responses: true,
        ai_responses_dir: await this.question('AI responses directory [ai-responses]: ') || 'ai-responses'
      };
    }

    const customPatterns = await this.confirm('Customize error file patterns?');
    let patternConfig = {};

    if (customPatterns) {
      console.log('💡 Enter patterns separated by commas (e.g., *.error, *-failed.txt)');
      const patterns = await this.question('Error file patterns: ');
      if (patterns.trim()) {
        patternConfig.error_file_patterns = patterns.split(',').map(p => p.trim());
      }
    }

    return {
      ...responseConfig,
      ...patternConfig
    };
  }

  /**
   * Configure performance and MCP
   */
  async configurePerformance() {
    const maxLength = await this.question('Max prompt length [2000]: ') || '2000';
    const delay = await this.question('Request delay in ms [1000]: ') || '1000';

    const enableMcp = await this.confirm('Enable MCP integration (DOM snapshots)?');
    let mcpConfig = {};

    if (enableMcp) {
      mcpConfig = {
        mcp_integration: false, // Controlled by --use-mcp flag
        mcp_ws_host: 'localhost',
        mcp_ws_port: parseInt(await this.question('MCP WebSocket port [3001]: ') || '3001'),
        mcp_timeout: 30000,
        mcp_retry_attempts: 3
      };
      console.log('💡 Use --use-mcp flag to enable MCP mode');
    }

    return {
      max_prompt_length: parseInt(maxLength),
      request_delay: parseInt(delay),
      ...mcpConfig
    };
  }

  /**
   * Create configuration file
   */
  async createConfigFile(config) {
    const useTypeScript = await this.confirm('Use TypeScript configuration?');
    const filename = useTypeScript ? 'ai.conf.ts' : 'ai.conf.js';
    const filePath = path.join(process.cwd(), filename);

    // Check if file exists
    if (fs.existsSync(filePath)) {
      const overwrite = await this.confirm(`${filename} already exists. Overwrite?`);
      if (!overwrite) {
        throw new Error('Configuration creation cancelled');
      }
    }

    let content;
    if (useTypeScript) {
      content = this.generateTypeScriptConfig(config);
    } else {
      content = this.generateJavaScriptConfig(config);
    }

    fs.writeFileSync(filePath, content, 'utf8');
    return filePath;
  }

  /**
   * Generate TypeScript configuration
   */
  generateTypeScriptConfig(config) {
    const apiKeyValue = typeof config.api_key === 'string' && config.api_key.includes('process.env') 
      ? config.api_key 
      : `'${config.api_key}'`;

    return `import type { AiConfig } from 'playwright-ai-auto-debug';

export const ai_conf: AiConfig = {
  // API Configuration
  api_key: ${apiKeyValue},
  ai_server: '${config.ai_server}',
  model: '${config.model}',
  
  // Project Settings
  results_dir: '${config.results_dir}',
  report_dir: '${config.report_dir}',
  
  // Performance Settings
  max_prompt_length: ${config.max_prompt_length},
  request_delay: ${config.request_delay},
  
  // Error File Patterns
  error_file_patterns: [
    'copy-prompt.txt',
    'error-context.md',
    'error.txt',
    'test-error.md',
    '*-error.txt',
    '*-error.md'${config.error_file_patterns ? ',\n    ' + config.error_file_patterns.map(p => `'${p}'`).join(',\n    ') : ''}
  ],
${config.save_ai_responses ? `
  // AI Response Saving
  save_ai_responses: true,
  ai_responses_dir: '${config.ai_responses_dir}',
  ai_response_filename_template: 'ai-response-{timestamp}-{index}.md',
  include_metadata: true,
` : ''}${config.allure_integration ? `
  // Allure Integration
  allure_integration: true,
  allure_results_dir: '${config.allure_results_dir}',
` : ''}${config.mcp_ws_port ? `
  // MCP Integration (use --use-mcp flag to enable)
  mcp_integration: false,
  mcp_ws_host: 'localhost',
  mcp_ws_port: ${config.mcp_ws_port},
  mcp_timeout: 30000,
  mcp_retry_attempts: 3,
  mcp_command: 'npx',
  mcp_args: ['@playwright/mcp@latest'],
` : ''}
  // AI Messages
  messages: [
    {
      role: 'system',
      content: 'Ты AI помощник по отладке Playwright тестов. Анализируй ошибки и предлагай конкретные решения на русском языке. Отвечай кратко и по делу с примерами кода.'
    }${config.mcp_ws_port ? `,
    {
      role: 'system', 
      content: 'При наличии MCP DOM snapshots используй точные ссылки на элементы (ref). Фокусируйся на надежных селекторах getByRole, getByTestId, getByText.'
    }` : ''}
  ]
};`;
  }

  /**
   * Generate JavaScript configuration
   */
  generateJavaScriptConfig(config) {
    const apiKeyValue = typeof config.api_key === 'string' && config.api_key.includes('process.env') 
      ? config.api_key 
      : `'${config.api_key}'`;

    return `// ai.conf.js
export const ai_conf = {
  // API Configuration
  api_key: ${apiKeyValue},
  ai_server: '${config.ai_server}',
  model: '${config.model}',
  
  // Project Settings
  results_dir: '${config.results_dir}',
  report_dir: '${config.report_dir}',
  
  // Performance Settings
  max_prompt_length: ${config.max_prompt_length},
  request_delay: ${config.request_delay},
  
  // Error File Patterns
  error_file_patterns: [
    'copy-prompt.txt',
    'error-context.md',
    'error.txt',
    'test-error.md',
    '*-error.txt',
    '*-error.md'${config.error_file_patterns ? ',\n    ' + config.error_file_patterns.map(p => `'${p}'`).join(',\n    ') : ''}
  ],
${config.save_ai_responses ? `
  // AI Response Saving
  save_ai_responses: true,
  ai_responses_dir: '${config.ai_responses_dir}',
  ai_response_filename_template: 'ai-response-{timestamp}-{index}.md',
  include_metadata: true,
` : ''}${config.allure_integration ? `
  // Allure Integration
  allure_integration: true,
  allure_results_dir: '${config.allure_results_dir}',
` : ''}${config.mcp_ws_port ? `
  // MCP Integration (use --use-mcp flag to enable)
  mcp_integration: false,
  mcp_ws_host: 'localhost',
  mcp_ws_port: ${config.mcp_ws_port},
  mcp_timeout: 30000,
  mcp_retry_attempts: 3,
  mcp_command: 'npx',
  mcp_args: ['@playwright/mcp@latest'],
` : ''}
  // AI Messages
  messages: [
    {
      role: 'system',
      content: 'Ты AI помощник по отладке Playwright тестов. Анализируй ошибки и предлагай конкретные решения на русском языке. Отвечай кратко и по делу с примерами кода.'
    }${config.mcp_ws_port ? `,
    {
      role: 'system', 
      content: 'При наличии MCP DOM snapshots используй точные ссылки на элементы (ref). Фокусируйся на надежных селекторах getByRole, getByTestId, getByText.'
    }` : ''}
  ]
};`;
  }

  /**
   * Show completion message with next steps
   */
  async showCompletionMessage(filePath) {
    console.log('\n🎉 Configuration created successfully!');
    console.log('═'.repeat(50));
    console.log(`📄 File: ${filePath}`);
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('1. Run your tests: npx playwright test');
    console.log('2. Run AI analysis: npx playwright-ai');
    console.log('3. For MCP mode: npx playwright-ai --use-mcp');
    console.log('');
    console.log('💡 Quick Tips:');
    console.log('• Add ai.conf.js to .gitignore if using direct API keys');
    console.log('• Set API_KEY environment variable for security');
    console.log('• Run "npx playwright-ai --help" for more options');
    console.log('');
    console.log('📚 Need help? Check the documentation:');
    console.log('   https://github.com/lunin-vadim/playwright-ai-auto-debug');
  }

  /**
   * Ask a question and wait for answer
   */
  question(prompt, sensitive = false) {
    return new Promise((resolve) => {
      if (sensitive) {
        // Hide input for sensitive data
        this.rl.question(prompt, (answer) => {
          resolve(answer);
        });
        this.rl.stdoutMuted = true;
      } else {
        this.rl.question(prompt, (answer) => {
          resolve(answer);
        });
      }
    });
  }

  /**
   * Ask yes/no question
   */
  async confirm(prompt) {
    const answer = await this.question(`${prompt} (y/N): `);
    return ['y', 'yes', 'да', 'д'].includes(answer.toLowerCase());
  }
}

/**
 * Start setup wizard
 */
export async function startSetupWizard() {
  const wizard = new ConfigWizard();
  await wizard.startWizard();
} 