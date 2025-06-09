#!/usr/bin/env node

import { readFile, writeFile } from 'fs/promises';
import * as cheerio from 'cheerio';
import { glob } from 'glob';

console.log('🧹 Очистка AI-блоков из HTML отчетов...');

try {
  const htmlFiles = await glob('test-results/**/index.html');
  
  for (const htmlFile of htmlFiles) {
    const content = await readFile(htmlFile, 'utf-8');
    const $ = cheerio.load(content);
    
    // Удаляем AI debug блоки
    $('.ai-debug').remove();
    
    await writeFile(htmlFile, $.html(), 'utf-8');
    console.log(`✅ Очищен: ${htmlFile}`);
  }
  
  console.log('\n🎉 Очистка завершена!');
} catch (error) {
  console.error('❌ Ошибка при очистке:', error.message);
} 