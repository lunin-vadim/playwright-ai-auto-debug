#!/usr/bin/env node

import { debugPlaywrightTests } from '../lib/index.js';

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    useMcp: false,
    projectRoot: process.cwd()
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--use-mcp') {
      options.useMcp = true;
    } else if (arg === '--project' && i + 1 < args.length) {
      options.projectRoot = args[i + 1];
      i++; // skip next arg as it's the value
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
🤖 Playwright AI Auto-Debug

Usage: playwright-ai [options]

Options:
  --use-mcp          Enable MCP integration for DOM snapshot analysis
  --project <path>   Project root directory (default: current directory)
  --help, -h         Show this help message

Examples:
  playwright-ai                    # Standard mode
  playwright-ai --use-mcp          # MCP mode with DOM snapshots
  playwright-ai --project ./tests  # Custom project directory
      `);
      process.exit(0);
    }
  }

  return options;
}

async function main() {
  try {
    const options = parseArgs();
    
    console.log('🚀 Starting automatic Playwright test debugging...');
    if (options.useMcp) {
      console.log('🔗 MCP mode enabled - DOM snapshots will be included');
    }
    console.log();
    
    const result = await debugPlaywrightTests(options.projectRoot, options);
    
    if (result.success) {
      console.log('\n✅ Debugging completed successfully!');
      if (result.processed === 0) {
        console.log('ℹ️  No files were processed');
      }
    } else {
      console.log('\n⚠️  Debugging completed with errors!');
      console.log(`📋 ${result.processed} files processed successfully, ${result.errors} failed`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error during debugging execution:', error.message);
    process.exit(1);
  }
}

main(); 