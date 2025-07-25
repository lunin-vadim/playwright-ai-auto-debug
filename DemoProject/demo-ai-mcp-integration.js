#!/usr/bin/env node
// DemoProject/demo-ai-mcp-integration.js

import fs from 'fs';
import path from 'path';

/**
 * Демонстрационный скрипт интеграции AI анализа с MCP и Allure
 * Показывает как работает библиотека playwright-ai-auto-debug
 */

console.log('🎯 Демонстрация интеграции AI + MCP + Allure');
console.log('='.repeat(50));

// 1. Демонстрация MCP интеграции
console.log('\n🔌 1. MCP Integration - DOM Snapshots');
console.log('   ✅ MCP клиент подключается к Playwright MCP серверу');
console.log('   ✅ Получает детальные DOM снапшоты страниц');
console.log('   ✅ Предоставляет контекст для AI анализа');

// 2. Показать структуру DOM снапшота
const errorContextPath = 'test-results/demo-🎯-AI-Debug-Integration-Demo-❌-Login-timeout-simulation-chromium/error-context.md';
if (fs.existsSync(errorContextPath)) {
  const domSnapshot = fs.readFileSync(errorContextPath, 'utf8');
  const lines = domSnapshot.split('\n').slice(0, 20);
  console.log('\n📊 Пример DOM снапшота из MCP:');
  console.log('   ' + lines.join('\n   '));
  console.log('   ... (полный снапшот содержит все элементы страницы)');
}

// 3. Демонстрация AI анализа
console.log('\n🤖 2. AI Analysis Integration');
console.log('   ✅ AI получает DOM контекст от MCP');
console.log('   ✅ Анализирует ошибки с учетом структуры страницы');
console.log('   ✅ Предлагает конкретные решения');

// 4. Показать созданные AI анализы
const aiAnalyses = [
  'allure-results/ai-response-demo-1.md',
  'allure-results/ai-response-demo-2.md', 
  'allure-results/ai-response-demo-3.md'
];

aiAnalyses.forEach((filePath, index) => {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const title = content.split('\n')[0].replace('# ', '');
    console.log(`   📝 AI анализ ${index + 1}: ${title}`);
  }
});

// 5. Демонстрация Allure интеграции
console.log('\n📊 3. Allure Integration');
console.log('   ✅ AI анализы автоматически добавляются как attachments');
console.log('   ✅ Каждый упавший тест получает персональный AI анализ');
console.log('   ✅ Тесты помечаются меткой "ai-analyzed: true"');

// 6. Показать структуру Allure результатов
const allureResultsDir = 'allure-results';
if (fs.existsSync(allureResultsDir)) {
  const files = fs.readdirSync(allureResultsDir);
  const resultFiles = files.filter(f => f.endsWith('-result.json'));
  const aiFiles = files.filter(f => f.startsWith('ai-response-'));
  
  console.log(`   📁 Создано ${resultFiles.length} результатов тестов`);
  console.log(`   🤖 Создано ${aiFiles.length} AI анализов`);
  console.log('   📎 AI анализы прикреплены к соответствующим тестам');
}

// 7. Демонстрация возможностей MCP
console.log('\n🚀 4. MCP Capabilities Demonstration');

const mcpFeatures = [
  {
    name: 'DOM Snapshot',
    description: 'Полный снапшот DOM структуры страницы',
    example: 'Элементы: навигация, кнопки, формы, ссылки'
  },
  {
    name: 'Element Interaction',
    description: 'Возможность взаимодействия с элементами',
    example: 'click(), fill(), hover() через MCP'
  },
  {
    name: 'Page Context',
    description: 'Контекст страницы для AI анализа',
    example: 'URL, заголовок, доступные действия'
  },
  {
    name: 'Error Context',
    description: 'Детальный контекст ошибок',
    example: 'Скриншоты, видео, DOM состояние'
  }
];

mcpFeatures.forEach(feature => {
  console.log(`   🔧 ${feature.name}: ${feature.description}`);
  console.log(`      Пример: ${feature.example}`);
});

// 8. Статистика демонстрации
console.log('\n📈 5. Demo Statistics');
console.log('   🧪 Всего тестов: 6 (1 ✅ прошел, 5 ❌ упали)');
console.log('   🤖 AI анализов: 3 (демонстрационные)');
console.log('   📊 Allure attachments: скриншоты, видео, DOM снапшоты, AI анализы');
console.log('   🔌 MCP интеграция: включена (--use-mcp флаг)');

// 9. Инструкции для просмотра отчета
console.log('\n🎯 6. Viewing Results');
console.log('   1. Откройте Allure отчет: npm run allure:open');
console.log('   2. Найдите упавшие тесты (красные)');
console.log('   3. Откройте детали теста');
console.log('   4. Просмотрите attachments:');
console.log('      - Screenshot (скриншот ошибки)');
console.log('      - Video (видео выполнения)');
console.log('      - Error Context (DOM снапшот от MCP)');
console.log('      - AI Debug Analysis (анализ от AI)');

console.log('\n✨ Демонстрация завершена!');
console.log('🚀 Запустите: npm run allure:open для просмотра отчета'); 