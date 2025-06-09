#!/usr/bin/env node

// Локальный тест библиотеки
import { debugPlaywrightTests } from './lib/index.js';

console.log('🧪 Локальное тестирование библиотеки...\n');

try {
  await debugPlaywrightTests();
  console.log('\n✅ Тест прошел успешно!');
} catch (error) {
  console.error('❌ Ошибка при тестировании:', error.message);
  process.exit(1);
} 