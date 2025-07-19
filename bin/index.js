#!/usr/bin/env node

import { debugPlaywrightTests } from '../lib/index.js';
import { startSetupWizard } from '../lib/configWizard.js';
import { validateConfiguration } from '../lib/configValidator.js';
import { startInteractiveTutorial } from '../lib/interactiveTutorial.js';
import { loadAiConfig } from '../lib/config.js';
import fs from 'fs';

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    useMcp: false,
    projectRoot: process.cwd(),
    command: 'debug' // default command
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--use-mcp') {
      options.useMcp = true;
    } else if (arg === '--project' && i + 1 < args.length) {
      options.projectRoot = args[i + 1];
      i++; // skip next arg as it's the value
    } else if (arg === 'setup') {
      options.command = 'setup';
    } else if (arg === 'validate') {
      options.command = 'validate';
    } else if (arg === 'tutorial') {
      options.command = 'tutorial';
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    } else if (arg === '--version' || arg === '-v') {
      showVersion();
      process.exit(0);
    }
  }

  return options;
}

function showHelp() {
  console.log(`
🤖 Playwright AI Auto-Debug v1.2.0

USAGE:
  playwright-ai [command] [options]

COMMANDS:
  (default)               Run AI analysis on failed tests
  setup                   Interactive setup wizard for configuration
  validate                Validate current configuration  
  tutorial                Start interactive tutorial system

OPTIONS:
  --use-mcp              Enable MCP integration for DOM snapshot analysis
  --project <path>       Project root directory (default: current directory)
  --help, -h             Show this help message
  --version, -v          Show version information

EXAMPLES:
  playwright-ai                    # Run standard AI analysis
  playwright-ai --use-mcp          # Run with MCP DOM snapshots
  playwright-ai setup              # Start configuration wizard
  playwright-ai validate           # Check configuration
  playwright-ai tutorial           # Learn with interactive tutorials
  playwright-ai --project ./tests  # Custom project directory

FIRST TIME SETUP:
  1. playwright-ai setup           # Create configuration
  2. npx playwright test           # Run your tests
  3. playwright-ai                 # Analyze failed tests

MORE INFO:
  Documentation: https://github.com/lunin-vadim/playwright-ai-auto-debug
  Issues: https://github.com/lunin-vadim/playwright-ai-auto-debug/issues
  `);
}

function showVersion() {
  try {
    // Try to read package.json from the module
    const packageJsonPath = new URL('../package.json', import.meta.url);
    const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    console.log(`🤖 Playwright AI Auto-Debug v${packageData.version}`);
  } catch (error) {
    console.log('🤖 Playwright AI Auto-Debug v1.2.0');
  }
}

async function main() {
  try {
    const options = parseArgs();
    
    // Handle different commands
    switch (options.command) {
      case 'setup':
        console.log('🧙‍♂️ Starting setup wizard...\n');
        await startSetupWizard();
        break;
        
      case 'validate':
        console.log('🔍 Validating configuration...\n');
        try {
          const config = await loadAiConfig();
          const result = await validateConfiguration(config);
          process.exit(result.valid ? 0 : 1);
        } catch (error) {
          console.error('❌ Configuration loading error:', error.message);
          console.log('\n💡 Try running "playwright-ai setup" to create configuration');
          process.exit(1);
        }
        break;
        
      case 'tutorial':
        console.log('📚 Starting interactive tutorials...\n');
        await startInteractiveTutorial();
        break;
        
      case 'debug':
      default:
        console.log('🚀 Starting automatic Playwright test debugging...');
        if (options.useMcp) {
          console.log('�� MCP mode enabled - DOM snapshots will be included');
        }
        console.log();
        
        // Quick config validation before debugging
        try {
          const config = await loadAiConfig();
          console.log('✅ Configuration loaded successfully');
          
          // Quick validation
          if (!config.api_key) {
            console.log('⚠️  Warning: API key not found');
            console.log('💡 Set API_KEY environment variable or run "playwright-ai setup"');
          }
          
          if (config.api_key === 'your-api-key-here') {
            console.log('⚠️  Warning: Using placeholder API key');
            console.log('💡 Update your configuration with real API key');
          }
        } catch (error) {
          console.error('❌ Configuration error:', error.message);
          console.log('\n🔧 Quick fixes:');
          console.log('  1. Run "playwright-ai setup" to create configuration');
          console.log('  2. Or manually create ai.conf.js file');
          console.log('  3. Run "playwright-ai validate" to check configuration');
          process.exit(1);
        }
        
        const result = await debugPlaywrightTests(options.projectRoot, options);
        
        if (result.success) {
          console.log('\n✅ Debugging completed successfully!');
          if (result.processed === 0) {
            console.log('\n📋 No failed tests found to analyze.');
            console.log('💡 Tips:');
            console.log('   • Run "npx playwright test" first to generate test results');
            console.log('   • Check your results_dir configuration');
            console.log('   • Verify error_file_patterns in configuration');
          } else {
            console.log(`📊 Processed ${result.processed} error files`);
            console.log('\n🎯 Next Steps:');
            console.log('   • Check updated HTML reports for AI analysis');
            console.log('   • Review AI suggestions in Allure reports (if enabled)');
            console.log('   • Run "playwright-ai validate" to optimize configuration');
          }
        } else {
          console.log('\n⚠️  Debugging completed with errors!');
          console.log(`📋 ${result.processed || 0} files processed successfully, ${result.errors || 0} failed`);
          console.log('\n🔧 Troubleshooting:');
          console.log('   • Run "playwright-ai validate" to check configuration');
          console.log('   • Try "playwright-ai tutorial" for help');
          console.log('   • Check API key and rate limits');
          process.exit(1);
        }
        break;
    }
  } catch (error) {
    console.error('❌ Error during execution:', error.message);
    console.log('\n🆘 Need help?');
    console.log('   • Run "playwright-ai tutorial" for interactive guidance');
    console.log('   • Run "playwright-ai setup" to reconfigure');
    console.log('   • Check documentation: https://github.com/lunin-vadim/playwright-ai-auto-debug');
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Goodbye! Thanks for using Playwright AI Auto-Debug.');
  process.exit(0);
});

process.on('SIGTERM', () => {
  process.exit(0);
});

main(); 