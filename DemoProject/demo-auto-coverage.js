#!/usr/bin/env node
// DemoProject/demo-auto-coverage.js

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Демонстрация автоматического покрытия UI');
console.log('='.repeat(50));

console.log('\n📋 Что демонстрирует этот пример:');
console.log('• Автоматическое отслеживание всех действий в тестах');
console.log('• Минимальные изменения в коде (только конфигурация)');
console.log('• Автоматическая генерация отчетов покрытия');
console.log('• Интеграция с существующими тестами');

console.log('\n🔧 Настройка (уже сделана):');
console.log('• Добавлена конфигурация autoCoverage в playwright.config.js');
console.log('• Создан AutoCoveragePlugin для автоматического отслеживания');
console.log('• Никаких изменений в существующих тестах не требуется!');

console.log('\n🧪 Запуск тестов с автоматическим покрытием...');

try {
  // Запускаем тесты
  console.log('Запуск: npx playwright test auto-coverage.spec.js');
  execSync('npx playwright test auto-coverage.spec.js --reporter=list', { 
    stdio: 'inherit',
    cwd: __dirname 
  });

  console.log('\n✅ Тесты завершены!');

  // Проверяем созданные отчеты
  const reportsDir = path.join(__dirname, 'coverage-reports');
  
  if (fs.existsSync(reportsDir)) {
    console.log('\n📊 Созданные отчеты покрытия:');
    
    const files = fs.readdirSync(reportsDir);
    files.forEach(file => {
      const filePath = path.join(reportsDir, file);
      const stats = fs.statSync(filePath);
      console.log(`• ${file} (${Math.round(stats.size / 1024)}KB)`);
    });

    // Показываем сводку если есть
    const summaryPath = path.join(reportsDir, 'auto-coverage-summary.md');
    if (fs.existsSync(summaryPath)) {
      console.log('\n📋 Сводка покрытия:');
      const summary = fs.readFileSync(summaryPath, 'utf8');
      
      // Извлекаем основные метрики
      const lines = summary.split('\n');
      lines.slice(0, 15).forEach(line => {
        if (line.includes('**') || line.includes('##')) {
          console.log(line.replace(/[#*]/g, ''));
        }
      });
    }

    // Показываем JSON сводку
    const jsonSummaryPath = path.join(reportsDir, 'auto-coverage-summary.json');
    if (fs.existsSync(jsonSummaryPath)) {
      console.log('\n📈 Статистика:');
      const jsonSummary = JSON.parse(fs.readFileSync(jsonSummaryPath, 'utf8'));
      
      console.log(`• Всего тестов: ${jsonSummary.summary.totalTests}`);
      console.log(`• Всего взаимодействий: ${jsonSummary.summary.totalInteractions}`);
      console.log(`• Уникальных элементов: ${jsonSummary.summary.uniqueElements}`);
      
      if (jsonSummary.summary.actionTypes) {
        console.log('• Типы действий:');
        Object.entries(jsonSummary.summary.actionTypes).forEach(([action, count]) => {
          console.log(`  - ${action}: ${count}`);
        });
      }
    }

  } else {
    console.log('\n⚠️  Отчеты покрытия не найдены');
    console.log('Проверьте настройки autoCoverage в playwright.config.js');
  }

  console.log('\n🎯 Преимущества автоматического покрытия:');
  console.log('• НЕ требует изменений в существующих тестах');
  console.log('• Автоматически отслеживает ВСЕ действия');
  console.log('• Генерирует подробные отчеты');
  console.log('• Интегрируется с CI/CD');
  console.log('• Работает с любыми Playwright тестами');

  console.log('\n📁 Файлы для интеграции:');
  console.log('• lib/autoCoveragePlugin.js - основной плагин');
  console.log('• lib/playwrightFixture.js - фикстура для тестов');
  console.log('• playwright.config.js - конфигурация (добавлен autoCoverage)');

  console.log('\n🚀 Как использовать в ваших проектах:');
  console.log('1. Скопируйте lib/autoCoveragePlugin.js');
  console.log('2. Добавьте autoCoverage в playwright.config.js');
  console.log('3. Запускайте тесты как обычно!');
  console.log('4. Отчеты генерируются автоматически');

} catch (error) {
  console.error('\n❌ Ошибка при запуске демонстрации:');
  console.error(error.message);
  
  console.log('\n🔧 Возможные решения:');
  console.log('• Убедитесь что установлены зависимости: npm install');
  console.log('• Проверьте что браузеры установлены: npx playwright install');
  console.log('• Проверьте интернет соединение для тестовых сайтов');
}

console.log('\n' + '='.repeat(50));
console.log('✨ Демонстрация завершена!'); 