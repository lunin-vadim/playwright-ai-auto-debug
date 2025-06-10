#!/usr/bin/env node

// Local library test
import { debugPlaywrightTests } from './lib/index.js';

console.log('🧪 Local library testing...\n');

try {
  await debugPlaywrightTests();
  console.log('\n✅ Test completed successfully!');
} catch (error) {
  console.error('❌ Error during testing:', error.message);
  process.exit(1);
} 