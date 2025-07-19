#!/usr/bin/env node
// DemoProject/show-coverage.js

import fs from 'fs';
import path from 'path';

/**
 * 📊 Быстрый просмотр покрытия тестов
 */

function showLatestCoverage() {
  const coverageDir = './demo-coverage';
  
  if (!fs.existsSync(coverageDir)) {
    console.log('❌ Папка demo-coverage не найдена. Запустите сначала: npm run demo:coverage');
    return;
  }
  
  // Поиск последнего отчета
  const files = fs.readdirSync(coverageDir);
  const summaryFiles = files.filter(f => f.startsWith('coverage-summary-') && f.endsWith('.md'));
  
  if (summaryFiles.length === 0) {
    console.log('❌ Отчеты покрытия не найдены');
    return;
  }
  
  // Сортировка по дате (последний файл)
  summaryFiles.sort();
  const latestSummary = summaryFiles[summaryFiles.length - 1];
  const latestHtml = latestSummary.replace('coverage-summary-', 'unified-coverage-').replace('.md', '.html');
  
  console.log('📊 === ПОКРЫТИЕ ТЕСТОВ ===\n');
  
  // Чтение и отображение краткого отчета
  const summaryPath = path.join(coverageDir, latestSummary);
  const summaryContent = fs.readFileSync(summaryPath, 'utf8');
  console.log(summaryContent);
  
  // Информация о HTML отчете
  const htmlPath = path.join(coverageDir, latestHtml);
  if (fs.existsSync(htmlPath)) {
    console.log(`\n🌐 Детальный HTML отчет: ${htmlPath}`);
    console.log(`💡 Для просмотра: open ${htmlPath}`);
  }
  
  // Показать доступные отчеты
  console.log(`\n📁 Всего отчетов: ${summaryFiles.length}`);
  summaryFiles.forEach((file, index) => {
    const timestamp = file.match(/coverage-summary-(.+)\.md/)[1];
    const date = new Date(timestamp.replace(/Z$/, ''));
    console.log(`   ${index + 1}. ${date.toLocaleString('ru-RU')}`);
  });
}

// Запуск
showLatestCoverage(); 