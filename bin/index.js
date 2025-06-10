#!/usr/bin/env node

import { debugPlaywrightTests } from '../lib/index.js';

async function main() {
  try {
    console.log('🚀 Starting automatic Playwright test debugging...\n');
    await debugPlaywrightTests();
    console.log('\n✅ Debugging completed successfully!');
  } catch (error) {
    console.error('❌ Error during debugging execution:', error.message);
    process.exit(1);
  }
}

main(); 