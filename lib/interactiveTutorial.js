// lib/interactiveTutorial.js

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { createInterface } from 'readline';

/**
 * Interactive tutorial system for Playwright AI Auto-Debug
 */
export class InteractiveTutorial {
  constructor() {
    this.rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.currentStep = 0;
    this.tutorialData = {};
  }

  /**
   * Start interactive tutorial selection
   */
  async startTutorial() {
    console.log('📚 Playwright AI Auto-Debug - Interactive Tutorials');
    console.log('═'.repeat(60));
    console.log('Choose your learning path:');
    console.log('');
    console.log('1. 🚀 Quick Start Guide (5 min)');
    console.log('2. ⚙️  Advanced Configuration (10 min)');
    console.log('3. 🔗 MCP Integration Setup (15 min)');
    console.log('4. 📊 Allure Integration (10 min)');
    console.log('5. 🐛 Troubleshooting Common Issues (8 min)');
    console.log('6. 💡 Best Practices & Tips (12 min)');
    console.log('0. ❌ Exit');
    
    const choice = await this.question('\nSelect tutorial (0-6): ');
    
    const tutorials = {
      '1': 'quickStart',
      '2': 'advancedConfig', 
      '3': 'mcpIntegration',
      '4': 'allureIntegration',
      '5': 'troubleshooting',
      '6': 'bestPractices'
    };

    if (choice === '0') {
      console.log('👋 Goodbye! Come back anytime for more tutorials.');
      this.rl.close();
      return;
    }

    const tutorialMethod = tutorials[choice];
    if (tutorialMethod) {
      await this[tutorialMethod]();
    } else {
      console.log('❌ Invalid choice. Please select 0-6.');
      await this.startTutorial();
    }
  }

  /**
   * Quick Start Tutorial
   */
  async quickStart() {
    console.log('\n🚀 Quick Start Guide');
    console.log('═'.repeat(30));
    console.log('This tutorial will get you started with AI-powered test debugging in 5 minutes!');

    await this.pressEnterToContinue();

    // Step 1: Check prerequisites
    console.log('\n📋 Step 1: Prerequisites Check');
    console.log('─'.repeat(25));
    
    const hasPlaywright = await this.checkCommand('npx playwright --version');
    const hasNodeJs = await this.checkCommand('node --version');
    
    if (!hasNodeJs) {
      console.log('❌ Node.js not found. Please install Node.js 16+ first.');
      console.log('   Download: https://nodejs.org/');
      return;
    }
    
    if (!hasPlaywright) {
      console.log('⚠️  Playwright not detected. Let\'s install it!');
      const installPlaywright = await this.confirm('Install Playwright now?');
      if (installPlaywright) {
        console.log('📦 Installing Playwright...');
        try {
          execSync('npm init playwright@latest', { stdio: 'inherit' });
        } catch (error) {
          console.log('❌ Installation failed. Please install manually: npm init playwright@latest');
          return;
        }
      } else {
        console.log('ℹ️  Please install Playwright first: npm init playwright@latest');
        return;
      }
    }

    console.log('✅ Prerequisites check complete!');

    // Step 2: Install AI Auto-Debug
    console.log('\n📦 Step 2: Install AI Auto-Debug');
    console.log('─'.repeat(30));
    
    const hasPackage = fs.existsSync('node_modules/@playwright-ai/auto-debug');
    if (!hasPackage) {
      console.log('Installing @playwright-ai/auto-debug...');
      const install = await this.confirm('Proceed with installation?');
      if (install) {
        try {
          execSync('npm install @playwright-ai/auto-debug', { stdio: 'inherit' });
          console.log('✅ Package installed successfully!');
        } catch (error) {
          console.log('❌ Installation failed. Try manually: npm install @playwright-ai/auto-debug');
          return;
        }
      }
    } else {
      console.log('✅ Package already installed!');
    }

    // Step 3: Configuration
    console.log('\n⚙️  Step 3: Quick Configuration');
    console.log('─'.repeat(28));
    
    const hasConfig = fs.existsSync('ai.conf.js') || fs.existsSync('ai.conf.ts');
    if (!hasConfig) {
      console.log('No configuration file found. Let\'s create one!');
      const createConfig = await this.confirm('Create ai.conf.js now?');
      if (createConfig) {
        const apiKey = await this.question('Enter your API key (or press Enter to use environment variable): ');
        await this.createQuickConfig(apiKey);
        console.log('✅ Configuration created!');
      }
    } else {
      console.log('✅ Configuration file already exists!');
    }

    // Step 4: Run first test
    console.log('\n🧪 Step 4: Test the Setup');
    console.log('─'.repeat(22));
    
    console.log('Let\'s run a failing test to see AI analysis in action!');
    console.log('');
    console.log('1. First, run your tests: npx playwright test');
    console.log('2. Then analyze with AI: npx playwright-ai');
    console.log('');
    console.log('💡 Tip: The AI will analyze any failed tests and provide solutions!');

    // Step 5: Next steps
    console.log('\n🎯 Step 5: What\'s Next?');
    console.log('─'.repeat(20));
    console.log('✅ You\'re all set! Here are some next steps:');
    console.log('');
    console.log('🔧 Advanced features:');
    console.log('   • Try MCP mode: npx playwright-ai --use-mcp');
    console.log('   • Enable Allure integration for better reports');
    console.log('   • Customize error patterns and AI messages');
    console.log('');
    console.log('📚 Learn more:');
    console.log('   • Run tutorial 2 for advanced configuration');
    console.log('   • Check documentation at GitHub');

    await this.completeTutorial('Quick Start');
  }

  /**
   * Advanced Configuration Tutorial
   */
  async advancedConfig() {
    console.log('\n⚙️  Advanced Configuration');
    console.log('═'.repeat(35));
    console.log('Master all configuration options for optimal performance!');

    await this.pressEnterToContinue();

    // Configuration sections
    const sections = [
      { name: 'AI Provider Setup', handler: 'configProviders' },
      { name: 'Performance Tuning', handler: 'configPerformance' },
      { name: 'Error Pattern Customization', handler: 'configPatterns' },
      { name: 'Directory Structure', handler: 'configDirectories' },
      { name: 'Security Best Practices', handler: 'configSecurity' }
    ];

    for (const section of sections) {
      console.log(`\n📋 ${section.name}`);
      console.log('─'.repeat(section.name.length + 4));
      await this[section.handler]();
      
      const continueNext = await this.confirm('Continue to next section?');
      if (!continueNext) break;
    }

    await this.completeTutorial('Advanced Configuration');
  }

  /**
   * Configuration: AI Providers
   */
  async configProviders() {
    console.log('🤖 Supported AI Providers:');
    console.log('');
    console.log('1. Mistral AI (recommended for cost/quality)');
    console.log('   • Server: https://api.mistral.ai');  
    console.log('   • Models: mistral-tiny, mistral-small, mistral-medium');
    console.log('   • Rate limit: ~5 req/min on free tier');
    console.log('');
    console.log('2. OpenAI ChatGPT (highest quality)');
    console.log('   • Server: https://api.openai.com');
    console.log('   • Models: gpt-3.5-turbo, gpt-4, gpt-4-turbo');
    console.log('   • Rate limit: Varies by plan');
    console.log('');
    console.log('3. Anthropic Claude (balanced)');
    console.log('   • Server: https://api.anthropic.com');
    console.log('   • Models: claude-3-haiku, claude-3-sonnet');
    console.log('   • Rate limit: ~50 req/min');
    console.log('');
    console.log('💡 Configuration example:');
    console.log(`
export const ai_conf = {
  api_key: process.env.API_KEY,
  ai_server: 'https://api.mistral.ai',
  model: 'mistral-medium',
  request_delay: 1000  // Adjust based on rate limits
};`);
  }

  /**
   * Configuration: Performance
   */
  async configPerformance() {
    console.log('⚡ Performance Optimization:');
    console.log('');
    console.log('🎯 Key parameters:');
    console.log('• max_prompt_length: Balance detail vs API limits');
    console.log('  - Too low (500): Missing context');  
    console.log('  - Optimal (2000-4000): Good balance');
    console.log('  - Too high (8000+): API errors');
    console.log('');
    console.log('• request_delay: Avoid rate limiting');
    console.log('  - Mistral: 1000ms minimum');
    console.log('  - OpenAI: 500ms usually safe');
    console.log('  - High volume: 2000-5000ms');
    console.log('');
    console.log('💡 Example configuration:');
    console.log(`
// For high-volume projects
export const ai_conf = {
  max_prompt_length: 3000,
  request_delay: 2000,
  // Batch processing
  error_file_patterns: ['*-critical-error.txt'] // Focus on critical errors
};`);
  }

  /**
   * MCP Integration Tutorial  
   */
  async mcpIntegration() {
    console.log('\n🔗 MCP Integration Setup');
    console.log('═'.repeat(30));
    console.log('Learn how to enable DOM snapshot analysis for better AI debugging!');

    await this.pressEnterToContinue();

    console.log('📋 What is MCP Integration?');
    console.log('─'.repeat(28));
    console.log('MCP (Model Context Protocol) provides:');
    console.log('• 📸 Real-time DOM snapshots');
    console.log('• 🎯 Exact element references');
    console.log('• 🧪 Action validation through browser automation');
    console.log('• 💎 Higher quality AI recommendations');
    console.log('');

    console.log('⚙️  Setup Steps:');
    console.log('─'.repeat(15));
    console.log('1. Configure MCP in ai.conf.js:');
    console.log(`
export const ai_conf = {
  // ... other settings
  mcp_integration: false,  // Controlled by --use-mcp flag
  mcp_ws_host: 'localhost',
  mcp_ws_port: 3001,
  mcp_timeout: 30000
};`);

    console.log('2. Run with MCP flag:');
    console.log('   npx playwright-ai --use-mcp');
    console.log('');
    console.log('3. MCP server starts automatically');
    console.log('4. AI gets DOM snapshots with exact selectors');

    console.log('\n🔧 Advanced MCP Configuration:');
    console.log('─'.repeat(32));
    console.log('• Custom port: Change mcp_ws_port');
    console.log('• Timeout tuning: Adjust mcp_timeout for slow pages');  
    console.log('• Retry logic: mcp_retry_attempts for unstable connections');
    console.log('');

    console.log('💡 When to use MCP:');
    console.log('✅ Complex DOM structures');
    console.log('✅ Dynamic content issues');
    console.log('✅ Selector reliability problems');
    console.log('❌ Simple failing tests (overkill)');
    console.log('❌ CI/CD environments (adds complexity)');

    await this.completeTutorial('MCP Integration');
  }

  /**
   * Allure Integration Tutorial
   */
  async allureIntegration() {
    console.log('\n📊 Allure Integration');
    console.log('═'.repeat(25));
    console.log('Integrate AI analysis directly into Allure reports!');

    await this.pressEnterToContinue();

    console.log('📋 Setup Allure Reporter:');
    console.log('─'.repeat(25));
    console.log('1. Install Allure reporter:');
    console.log('   npm install --save-dev allure-playwright');
    console.log('');
    console.log('2. Configure playwright.config.js:');
    console.log(`
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    ['html'],  // Keep HTML reporter
    ['allure-playwright', {
      detail: true,
      outputFolder: 'allure-results',
      suiteTitle: true
    }]
  ]
});`);

    console.log('\n⚙️  Enable AI Integration:');
    console.log('─'.repeat(27));
    console.log('Configure ai.conf.js:');
    console.log(`
export const ai_conf = {
  // ... other settings
  allure_integration: true,
  allure_results_dir: 'allure-results'
};`);

    console.log('\n🚀 Usage Workflow:');
    console.log('─'.repeat(18));
    console.log('1. Run tests: npx playwright test');
    console.log('2. Run AI analysis: npx playwright-ai'); 
    console.log('3. Generate Allure report: npx allure generate allure-results');
    console.log('4. Open report: npx allure open');
    console.log('');
    console.log('💡 AI analysis appears as attachments in failed tests!');

    await this.completeTutorial('Allure Integration');
  }

  /**
   * Troubleshooting Tutorial
   */
  async troubleshooting() {
    console.log('\n🐛 Troubleshooting Common Issues');
    console.log('═'.repeat(40));
    console.log('Solutions for the most common problems!');

    await this.pressEnterToContinue();

    const issues = [
      {
        title: '❌ "API key not found"',
        solution: `
• Check ai.conf.js has api_key field
• If using env var: export API_KEY=your-key
• Verify no typos in environment variable name
• Test: echo $API_KEY (should show your key)
        `
      },
      {
        title: '❌ "Rate limit exceeded (429)"',
        solution: `
• Increase request_delay in configuration
• For Mistral: minimum 1000ms
• For high volume: try 3000-5000ms
• Consider upgrading your API plan
        `
      },
      {
        title: '❌ "No error files found"',
        solution: `
• Run playwright tests first to generate errors
• Check results_dir path in configuration
• Verify error_file_patterns match your files
• Look for copy-prompt.txt files manually
        `
      },
      {
        title: '❌ "MCP connection failed"',
        solution: `
• Check if port 3001 is available: lsof -i :3001
• Try different port: change mcp_ws_port
• Increase mcp_timeout for slow systems
• Restart with clean state
        `
      },
      {
        title: '❌ "TypeScript config not loading"',
        solution: `
• Ensure tsx is installed: npm list tsx
• Check ai.conf.ts syntax with tsc --noEmit
• Verify export: export const ai_conf = {...}
• Fallback to ai.conf.js if needed
        `
      }
    ];

    for (const issue of issues) {
      console.log(`\n${issue.title}`);
      console.log('─'.repeat(issue.title.length - 2));
      console.log(issue.solution);
      
      const next = await this.confirm('See next issue?');
      if (!next) break;
    }

    await this.completeTutorial('Troubleshooting');
  }

  /**
   * Best Practices Tutorial
   */
  async bestPractices() {
    console.log('\n💡 Best Practices & Tips');
    console.log('═'.repeat(30));
    console.log('Expert tips for optimal results!');

    await this.pressEnterToContinue();

    const practices = [
      {
        category: '🔒 Security',
        tips: [
          'Use environment variables for API keys',
          'Add ai.conf.js to .gitignore if hardcoded keys',
          'Rotate API keys periodically',
          'Use least-privilege API keys when possible'
        ]
      },
      {
        category: '⚡ Performance',
        tips: [
          'Start with longer request delays, then optimize',
          'Use specific error patterns to reduce noise',
          'Enable save_ai_responses for debugging',
          'Monitor API usage and costs'
        ]
      },
      {
        category: '📊 Reporting',
        tips: [
          'Enable Allure integration for team visibility',
          'Use descriptive AI messages for context',
          'Save AI responses for historical analysis',
          'Integrate with CI/CD for automated analysis'
        ]
      },
      {
        category: '🐛 Debugging',
        tips: [
          'Use MCP mode for complex DOM issues',
          'Validate AI suggestions before implementing',
          'Keep prompt lengths reasonable (2000-4000)',
          'Review and customize error patterns'
        ]
      }
    ];

    for (const practice of practices) {
      console.log(`\n${practice.category}`);
      console.log('─'.repeat(practice.category.length - 2));
      practice.tips.forEach((tip, index) => {
        console.log(`${index + 1}. ${tip}`);
      });
      
      const next = await this.confirm('See next category?');
      if (!next) break;
    }

    await this.completeTutorial('Best Practices');
  }

  /**
   * Helper method to check if command exists
   */
  async checkCommand(command) {
    try {
      execSync(command, { stdio: 'ignore' });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create quick configuration file
   */
  async createQuickConfig(apiKey) {
    const config = `// ai.conf.js
export const ai_conf = {
  api_key: ${apiKey ? `'${apiKey}'` : "process.env.API_KEY || 'your-api-key-here'"},
  ai_server: 'https://api.mistral.ai',
  model: 'mistral-medium',
  results_dir: 'test-results',
  report_dir: 'playwright-report',
  max_prompt_length: 2000,
  request_delay: 1000,
  messages: [
    {
      role: 'system',
      content: 'Ты AI помощник по отладке Playwright тестов. Анализируй ошибки и предлагай конкретные решения на русском языке.'
    }
  ]
};`;

    fs.writeFileSync('ai.conf.js', config, 'utf8');
    
    if (!apiKey) {
      console.log('💡 Don\'t forget to set your API key: export API_KEY=your-actual-key');
    }
  }

  /**
   * Complete tutorial with summary
   */
  async completeTutorial(tutorialName) {
    console.log(`\n🎉 ${tutorialName} Tutorial Complete!`);
    console.log('═'.repeat(30));
    console.log('Great job! You\'ve mastered this topic.');
    console.log('');
    
    const nextAction = await this.question('What would you like to do next?\n1. Another tutorial\n2. Exit\nChoice (1-2): ');
    
    if (nextAction === '1') {
      await this.startTutorial();
    } else {
      console.log('👋 Happy testing! Remember to check the documentation for more details.');
      this.rl.close();
    }
  }

  /**
   * Ask a question and wait for answer
   */
  question(prompt) {
    return new Promise((resolve) => {
      this.rl.question(prompt, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  /**
   * Ask yes/no question
   */
  async confirm(prompt) {
    const answer = await this.question(`${prompt} (y/N): `);
    return ['y', 'yes', 'да', 'д'].includes(answer.toLowerCase());
  }

  /**
   * Wait for Enter key
   */
  async pressEnterToContinue() {
    await this.question('Press Enter to continue...');
  }

  /**
   * Close readline interface
   */
  close() {
    this.rl.close();
  }
}

/**
 * Start interactive tutorial system
 */
export async function startInteractiveTutorial() {
  const tutorial = new InteractiveTutorial();
  await tutorial.startTutorial();
} 