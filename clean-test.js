#!/usr/bin/env node

import { readFile, writeFile } from 'fs/promises';
import * as cheerio from 'cheerio';
import { glob } from 'glob';

console.log('🧹 Cleaning AI blocks from HTML reports...');

try {
  const htmlFiles = await glob('test-results/**/index.html');
  
  for (const htmlFile of htmlFiles) {
    const content = await readFile(htmlFile, 'utf-8');
    const $ = cheerio.load(content);
    
    // Remove AI debug blocks
    $('.ai-debug').remove();
    
    await writeFile(htmlFile, $.html(), 'utf-8');
    console.log(`✅ Cleaned: ${htmlFile}`);
  }
  
  console.log('\n🎉 Cleaning completed!');
} catch (error) {
  console.error('❌ Error during cleaning:', error.message);
} 