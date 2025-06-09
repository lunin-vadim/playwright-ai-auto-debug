#!/usr/bin/env node

import { debugPlaywrightTests } from '../lib/index.js';

async function main() {
  try {
    console.log('🚀 Запуск автоматической отладки Playwright тестов...\n');
    await debugPlaywrightTests();
    console.log('\n✅ Отладка завершена успешно!');
  } catch (error) {
    console.error('❌ Ошибка при выполнении отладки:', error.message);
    process.exit(1);
  }
}

main(); 