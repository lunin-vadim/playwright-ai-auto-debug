#!/usr/bin/env node

import { debugPlaywrightTests } from '../lib/index.js';

async function main() {
  try {
    console.log('🚀 Starting automatic Playwright test debugging...\n');
    const result = await debugPlaywrightTests();
    
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