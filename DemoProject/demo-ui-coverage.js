#!/usr/bin/env node
// DemoProject/demo-ui-coverage.js

import { UICoverageAnalyzer } from './lib/uiCoverageAnalyzer.js';
import fs from 'fs';

/**
 * Демонстрация возможностей UI Coverage анализа через MCP
 */

console.log('🎯 Демонстрация UI Coverage анализа через MCP');
console.log('='.repeat(60));

async function runDemo() {
  // Инициализация анализатора
  const analyzer = new UICoverageAnalyzer({
    criticalElements: [
      { type: 'button', name: 'Get started', selector: 'text=Get started' },
      { type: 'button', name: 'Search', selector: 'button:has-text("Search")' },
      { type: 'link', name: 'Docs', selector: 'text=Docs' },
      { type: 'navigation', name: 'Main', selector: 'navigation' },
      { type: 'button', name: 'Node.js', selector: 'button:has-text("Node.js")' }
    ]
  });

  console.log('\n🌳 1. Анализ дерева доступности (accessibility tree)');
  console.log('   ✅ Получение структурированного снимка страницы');
  console.log('   ✅ Парсинг элементов с ролями, названиями и состояниями');
  
  // Демонстрационный snapshot от MCP
  const mockSnapshot = getMockMCPSnapshot();
  const accessibilityTree = analyzer.parseAccessibilityTree(mockSnapshot);
  
  console.log(`   📊 Найдено элементов: ${accessibilityTree.totalCount}`);
  console.log('   🔍 Типы элементов:');
  Object.entries(accessibilityTree.byType).forEach(([type, elements]) => {
    console.log(`      • ${type}: ${elements.length}`);
  });

  console.log('\n✅ 2. Подсчет элементов и проверка их свойств');
  console.log('   ✅ Подсчет элементов по типу');
  console.log('   ✅ Проверка атрибутов доступности');
  console.log('   ✅ Сравнение с эталонным деревом');
  
  const elementStats = analyzer.analyzeElementCoverage(accessibilityTree);
  console.log('   📈 Статистика элементов:');
  console.log(`      Всего: ${elementStats.summary.totalElements}`);
  console.log(`      Кнопки: ${elementStats.summary.buttons}`);
  console.log(`      Ссылки: ${elementStats.summary.links}`);
  console.log(`      Интерактивные: ${elementStats.summary.interactive}`);
  console.log(`      С aria-label: ${elementStats.summary.withAriaLabel}`);
  console.log(`      С role: ${elementStats.summary.withRole}`);

  console.log('\n🔄 3. Автоматическая проверка видимости и доступности');
  console.log('   ✅ Проверка критичных элементов');
  console.log('   ✅ Выявление отсутствующих элементов');
  console.log('   ✅ Генерация рекомендаций');
  
  const criticalCheck = analyzer.checkCriticalElements(
    accessibilityTree, 
    analyzer.config.criticalElements
  );
  
  console.log('   🎯 Результаты проверки критичных элементов:');
  console.log(`      Найдено: ${criticalCheck.foundCritical.length}`);
  console.log(`      Отсутствует: ${criticalCheck.missingCritical.length}`);
  
  if (criticalCheck.foundCritical.length > 0) {
    console.log('      ✅ Найденные критичные элементы:');
    criticalCheck.foundCritical.forEach(el => {
      console.log(`         • ${el.name} (${el.type})`);
    });
  }
  
  if (criticalCheck.missingCritical.length > 0) {
    console.log('      ❌ Отсутствующие критичные элементы:');
    criticalCheck.missingCritical.forEach(el => {
      console.log(`         • ${el.name} (${el.type})`);
    });
  }

  console.log('\n📊 4. Сравнение с золотой версией');
  console.log('   ✅ Сравнение с эталонным snapshot');
  console.log('   ✅ Выявление изменений в UI');
  console.log('   ✅ Автоматическое создание отчетов');
  
  // Создание "золотой" версии для демонстрации
  const goldenSnapshot = getGoldenSnapshot();
  const goldenTree = analyzer.parseAccessibilityTree(goldenSnapshot);
  const goldenComparison = analyzer.compareWithGolden(accessibilityTree, goldenTree);
  
  console.log('   🔗 Результаты сравнения:');
  console.log(`      Идентичность: ${goldenComparison.identical ? '✅' : '❌'}`);
  console.log(`      Новых элементов: ${goldenComparison.newElements.length}`);
  console.log(`      Удаленных элементов: ${goldenComparison.removedElements.length}`);
  
  if (goldenComparison.differences.length > 0) {
    console.log('      📝 Различия:');
    goldenComparison.differences.forEach(diff => {
      console.log(`         ${diff}`);
    });
  }

  console.log('\n⚙️ 5. Интеграция в CI/CD и магические отчеты');
  console.log('   ✅ Автоматическая генерация отчетов');
  console.log('   ✅ Интеграция в pipeline');
  console.log('   ✅ LLM подсказки и рекомендации');
  
  // Создание полного отчета
  const fullAnalysis = {
    accessibilityTree,
    elementStats,
    criticalCheck,
    goldenComparison
  };
  
  const coverageReport = analyzer.generateCoverageReport(fullAnalysis, 'demo-page');
  
  // Сохранение отчета
  const timestamp = Date.now();
  await analyzer.saveReport(coverageReport, `demo-ui-coverage-${timestamp}.md`);
  
  console.log('   📊 Сгенерированный отчет:');
  console.log(`      Страница: ${coverageReport.metadata.pageName}`);
  console.log(`      Всего элементов: ${coverageReport.summary.totalElements}`);
  console.log(`      Интерактивных: ${coverageReport.summary.interactiveElements}`);
  console.log(`      Оценка доступности: ${coverageReport.summary.accessibilityScore}%`);
  console.log(`      Покрытие: ${coverageReport.summary.coveragePercentage}%`);
  
  console.log('\n💡 6. Практические возможности');
  
  const practicalExamples = [
    {
      scenario: 'Регрессионное тестирование',
      description: 'Автоматическое выявление пропавших кнопок или ссылок',
      example: 'MCP обнаружит отсутствие кнопки "Submit" на странице Checkout'
    },
    {
      scenario: 'Проверка доступности',
      description: 'Контроль наличия aria-label и role атрибутов',
      example: 'Предупреждение о кнопках без accessibility атрибутов'
    },
    {
      scenario: 'Мониторинг изменений',
      description: 'Отслеживание добавления/удаления UI элементов',
      example: 'Уведомление о новых полях в форме регистрации'
    },
    {
      scenario: 'CI/CD интеграция',
      description: 'Автоматическая проверка критичных элементов в pipeline',
      example: 'Прерывание сборки при отсутствии кнопки оплаты'
    }
  ];
  
  practicalExamples.forEach((example, index) => {
    console.log(`   ${index + 1}. ${example.scenario}:`);
    console.log(`      ${example.description}`);
    console.log(`      💡 ${example.example}`);
  });

  console.log('\n🚀 7. Возможности MCP для UI Coverage');
  
  const mcpCapabilities = [
    'DOM Snapshot - полная структура страницы в реальном времени',
    'Element Interaction - возможность взаимодействия с элементами',
    'Accessibility Tree - дерево доступности с ролями и состояниями',
    'State Monitoring - отслеживание изменений состояния элементов',
    'Cross-browser Support - работа во всех современных браузерах',
    'Headless/Headed Mode - поддержка различных режимов запуска'
  ];
  
  mcpCapabilities.forEach(capability => {
    console.log(`   🔧 ${capability}`);
  });

  console.log('\n📈 8. Метрики и KPI');
  
  const metrics = {
    'UI Coverage': `${coverageReport.summary.coveragePercentage}%`,
    'Accessibility Score': `${coverageReport.summary.accessibilityScore}%`,
    'Critical Elements': `${criticalCheck.foundCritical.length}/${analyzer.config.criticalElements.length}`,
    'Interactive Elements': elementStats.summary.interactive,
    'Regression Risk': goldenComparison.identical ? 'Низкий' : 'Средний'
  };
  
  console.log('   📊 Ключевые метрики:');
  Object.entries(metrics).forEach(([metric, value]) => {
    console.log(`      ${metric}: ${value}`);
  });

  console.log('\n🎯 9. Рекомендации для команды');
  
  const recommendations = coverageReport.recommendations;
  if (recommendations.length > 0) {
    console.log('   📋 Автоматические рекомендации:');
    recommendations.forEach(rec => {
      console.log(`      • ${rec}`);
    });
  } else {
    console.log('   ✅ Все проверки пройдены успешно!');
  }

  console.log('\n✨ Демонстрация завершена!');
  console.log(`📄 Отчет сохранен: ui-coverage-reports/demo-ui-coverage-${timestamp}.md`);
  console.log('🔍 Проверьте созданные файлы отчетов для детального анализа');
}

// Вспомогательные функции

function getMockMCPSnapshot() {
  return `# Page snapshot

- region "Skip to main content":
  - link "Skip to main content":
    - /url: "#__docusaurus_skipToContent_fallback"
- navigation "Main":
  - link "Playwright logo Playwright":
    - /url: /
    - img "Playwright logo"
    - text: Playwright
  - link "Docs":
    - /url: /docs/intro
  - link "API":
    - /url: /docs/api/class-playwright
  - button "Node.js"
  - link "Community":
    - /url: /community/welcome
  - link "GitHub repository":
    - /url: https://github.com/microsoft/playwright
  - link "Discord server":
    - /url: https://aka.ms/playwright/discord
  - button "Switch between dark and light mode"
  - button "Search (Command+K)": Search ⌘ K
- banner:
  - heading "Playwright enables reliable end-to-end testing for modern web apps." [level=1]
  - link "Get started":
    - /url: /docs/intro
  - link "Star microsoft/playwright on GitHub":
    - /url: https://github.com/microsoft/playwright
    - text: Star
- main:
  - img "Browsers (Chromium, Firefox, WebKit)"
  - heading "Any browser • Any platform • One API" [level=3]
  - paragraph: Cross-browser. Playwright supports all modern rendering engines
  - link "TypeScript":
    - /url: https://playwright.dev/docs/intro
  - link "JavaScript":
    - /url: https://playwright.dev/docs/intro
  - link "Python":
    - /url: https://playwright.dev/python/docs/intro`;
}

function getGoldenSnapshot() {
  // Имитация "золотой" версии с отличиями
  return `# Page snapshot

- navigation "Main":
  - link "Playwright logo Playwright":
    - /url: /
  - link "Docs":
    - /url: /docs/intro
  - button "Node.js"
  - link "Community":
    - /url: /community/welcome
  - button "Search (Command+K)": Search ⌘ K
- banner:
  - heading "Playwright enables reliable end-to-end testing" [level=1]
  - link "Get started":
    - /url: /docs/intro
- main:
  - heading "Any browser • Any platform • One API" [level=3]
  - link "TypeScript":
    - /url: https://playwright.dev/docs/intro`;
}

// Запуск демонстрации
runDemo().catch(console.error); 