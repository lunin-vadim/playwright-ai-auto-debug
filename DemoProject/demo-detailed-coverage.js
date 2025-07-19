#!/usr/bin/env node
// DemoProject/demo-detailed-coverage.js

import { chromium } from 'playwright';
import { DetailedCoverageTracker } from './lib/detailedCoverageTracker.js';
import { MockMCPIntegration } from './lib/mockMCPIntegration.js';

/**
 * 🎯 Демонстрация детального покрытия UI элементов
 * Показывает конкретные элементы, которые покрыты и не покрыты тестами
 */

async function runDetailedCoverageDemo() {
  console.log('🎬 === ДЕМОНСТРАЦИЯ ДЕТАЛЬНОГО ПОКРЫТИЯ UI ЭЛЕМЕНТОВ ===\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Инициализация системы детального покрытия
  const coverageTracker = new DetailedCoverageTracker({
    outputDir: 'detailed-coverage',
    trackingEnabled: true,
    includeSelectors: true,
    includeScreenshots: true
  });
  
  const mcpIntegration = new MockMCPIntegration();
  
  // Начало сессии
  const sessionId = coverageTracker.startSession('detailed-demo-interactive');
  console.log(`🎬 Начата сессия: ${sessionId}\n`);
  
  try {
    // ===== АНАЛИЗ ГЛАВНОЙ СТРАНИЦЫ =====
    console.log('🔍 === АНАЛИЗ ГЛАВНОЙ СТРАНИЦЫ PLAYWRIGHT.DEV ===');
    await page.goto('https://playwright.dev');
    await page.waitForLoadState('networkidle');
    
    // Получение MCP snapshot
    console.log('📸 Получение MCP snapshot...');
    const homepageSnapshot = await mcpIntegration.getMCPSnapshot(page);
    
    // Регистрация всех элементов
    console.log('📋 Регистрация элементов страницы...');
    const homepageElements = coverageTracker.registerPageElements(
      'playwright-homepage',
      homepageSnapshot,
      'homepage-demo'
    );
    
    console.log(`📊 Найдено ${homepageElements.length} элементов\n`);
    
    // Показать дерево элементов
    console.log('🌳 === ДЕРЕВО ЭЛЕМЕНТОВ ГЛАВНОЙ СТРАНИЦЫ ===');
    const homepageTree = coverageTracker.generateCoverageTree('playwright-homepage');
    printTreeToConsole(homepageTree.tree, 0);
    console.log('');
    
    // ===== СИМУЛЯЦИЯ ВЗАИМОДЕЙСТВИЙ =====
    console.log('🎯 === СИМУЛЯЦИЯ ВЗАИМОДЕЙСТВИЙ С ЭЛЕМЕНТАМИ ===');
    
    // Взаимодействие 1: Кнопка "Get started"
    try {
      const getStartedBtn = page.locator('text="Get started"').first();
      if (await getStartedBtn.isVisible()) {
        await getStartedBtn.click();
        await page.waitForTimeout(1000);
        
        coverageTracker.markElementCovered(
          { type: 'button', text: 'Get started', lineNumber: 1 },
          'homepage-demo',
          'click'
        );
        
        console.log('✅ Кликнули по кнопке "Get started"');
        await page.goBack();
        await page.waitForLoadState('networkidle');
      }
    } catch (error) {
      console.log('❌ Кнопка "Get started" не найдена');
    }
    
    // Взаимодействие 2: Ссылка "Docs"
    try {
      const docsLink = page.locator('a:has-text("Docs")').first();
      if (await docsLink.isVisible()) {
        await docsLink.hover();
        await page.waitForTimeout(500);
        
        coverageTracker.markElementCovered(
          { type: 'link', text: 'Docs', lineNumber: 2 },
          'homepage-demo',
          'hover'
        );
        
        console.log('✅ Навели на ссылку "Docs"');
      }
    } catch (error) {
      console.log('❌ Ссылка "Docs" не найдена');
    }
    
    // Взаимодействие 3: Поиск
    try {
      const searchInput = page.locator('input[placeholder*="Search"], [role="searchbox"]').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('testing');
        await page.waitForTimeout(500);
        
        coverageTracker.markElementCovered(
          { type: 'input', text: 'Search docs', lineNumber: 3 },
          'homepage-demo',
          'fill'
        );
        
        console.log('✅ Ввели текст в поле поиска');
      }
    } catch (error) {
      console.log('❌ Поле поиска не найдено');
    }
    
    // ===== АНАЛИЗ СТРАНИЦЫ ДОКУМЕНТАЦИИ =====
    console.log('\n📚 === АНАЛИЗ СТРАНИЦЫ ДОКУМЕНТАЦИИ ===');
    await page.goto('https://playwright.dev/docs/intro');
    await page.waitForLoadState('networkidle');
    
    // Получение snapshot для документации
    const docsSnapshot = await mcpIntegration.getMCPSnapshot(page);
    const docsElements = coverageTracker.registerPageElements(
      'playwright-docs',
      docsSnapshot,
      'docs-demo'
    );
    
    console.log(`📊 Найдено ${docsElements.length} элементов на странице документации`);
    
    // Взаимодействие с навигацией
    try {
      const nextBtn = page.locator('text="Next"').first();
      if (await nextBtn.isVisible()) {
        await nextBtn.click();
        await page.waitForTimeout(1000);
        
        coverageTracker.markElementCovered(
          { type: 'button', text: 'Next', lineNumber: 4 },
          'docs-demo',
          'click'
        );
        
        console.log('✅ Кликнули по кнопке "Next"');
      }
    } catch (error) {
      console.log('❌ Кнопка "Next" не найдена');
    }
    
    // ===== ГЕНЕРАЦИЯ ДЕТАЛЬНОГО ОТЧЕТА =====
    console.log('\n📊 === ГЕНЕРАЦИЯ ДЕТАЛЬНОГО ОТЧЕТА ПОКРЫТИЯ ===');
    
    const detailedReport = coverageTracker.generateDetailedCoverageReport();
    
    // Статистика
    console.log('\n📈 === ОБЩАЯ СТАТИСТИКА ===');
    console.log(`Всего элементов: ${detailedReport.summary.totalElements}`);
    console.log(`Покрыто тестами: ${detailedReport.summary.coveredElements}`);
    console.log(`Не покрыто: ${detailedReport.summary.uncoveredElements}`);
    console.log(`Процент покрытия: ${detailedReport.summary.coveragePercentage}%`);
    console.log(`Всего взаимодействий: ${detailedReport.summary.interactionsCount}`);
    
    // Покрытие по типам
    console.log('\n📊 === ПОКРЫТИЕ ПО ТИПАМ ЭЛЕМЕНТОВ ===');
    Object.entries(detailedReport.coverageByType).forEach(([type, coverage]) => {
      const icon = coverage.percentage === 100 ? '✅' : 
                   coverage.percentage > 50 ? '⚠️' : '❌';
      console.log(`${icon} ${type.padEnd(12)}: ${coverage.covered.toString().padStart(2)}/${coverage.total.toString().padStart(2)} (${coverage.percentage.toString().padStart(3)}%)`);
    });
    
    // Покрытие по страницам
    console.log('\n🌐 === ПОКРЫТИЕ ПО СТРАНИЦАМ ===');
    Object.entries(detailedReport.coverageByPage).forEach(([page, coverage]) => {
      const icon = coverage.percentage === 100 ? '✅' : 
                   coverage.percentage > 50 ? '⚠️' : '❌';
      console.log(`${icon} ${page.padEnd(20)}: ${coverage.covered.toString().padStart(2)}/${coverage.total.toString().padStart(2)} (${coverage.percentage.toString().padStart(3)}%)`);
    });
    
    // Критичные элементы
    console.log('\n🔴 === КРИТИЧНЫЕ ЭЛЕМЕНТЫ ===');
    console.log(`Всего критичных элементов: ${detailedReport.criticalCoverage.total}`);
    console.log(`Покрыто: ${detailedReport.criticalCoverage.covered}`);
    console.log(`Не покрыто: ${detailedReport.criticalCoverage.uncovered}`);
    console.log(`Процент покрытия: ${detailedReport.criticalCoverage.percentage}%`);
    
    if (detailedReport.criticalCoverage.elements.length > 0) {
      console.log('\nСписок критичных элементов:');
      detailedReport.criticalCoverage.elements.forEach(element => {
        const statusIcon = element.status === 'covered' ? '✅' : '❌';
        console.log(`  ${statusIcon} ${element.type}: "${element.text}"`);
      });
    }
    
    // Покрытые элементы
    console.log('\n✅ === ПОКРЫТЫЕ ЭЛЕМЕНТЫ ===');
    detailedReport.detailedElements.covered.forEach(element => {
      console.log(`✅ ${element.type}: "${element.text}" (тестов: ${element.tests.length})`);
      console.log(`   Селектор: ${element.selector}`);
      console.log(`   Страницы: ${element.pages.join(', ')}`);
      if (element.interactions.length > 0) {
        console.log(`   Взаимодействия: ${element.interactions.map(i => i.type).join(', ')}`);
      }
      console.log('');
    });
    
    // Непокрытые элементы (первые 15)
    console.log('\n❌ === НЕПОКРЫТЫЕ ЭЛЕМЕНТЫ (первые 15) ===');
    detailedReport.detailedElements.uncovered.slice(0, 15).forEach(element => {
      const criticalMark = element.critical ? '🔴' : '';
      const interactiveMark = element.interactable ? '🎯' : '';
      console.log(`❌ ${criticalMark}${interactiveMark} ${element.type}: "${element.text}"`);
      console.log(`   Селектор: ${element.selector}`);
      console.log(`   Путь: ${element.path}`);
      console.log(`   Страницы: ${element.pages.join(', ')}`);
      console.log('');
    });
    
    if (detailedReport.detailedElements.uncovered.length > 15) {
      console.log(`... и еще ${detailedReport.detailedElements.uncovered.length - 15} непокрытых элементов`);
    }
    
    // История взаимодействий
    console.log('\n🎯 === ИСТОРИЯ ВЗАИМОДЕЙСТВИЙ ===');
    detailedReport.interactions.forEach(interaction => {
      const timestamp = new Date(interaction.timestamp).toLocaleTimeString();
      console.log(`[${timestamp}] ${interaction.interactionType.toUpperCase()}: ${interaction.element.text || interaction.element.type}`);
      console.log(`   Тест: ${interaction.testName}`);
      console.log(`   Путь: ${interaction.elementPath}`);
      console.log('');
    });
    
    // Рекомендации
    console.log('\n💡 === РЕКОМЕНДАЦИИ ПО УЛУЧШЕНИЮ ПОКРЫТИЯ ===');
    detailedReport.recommendations.forEach(rec => {
      const priorityIcon = rec.priority === 'HIGH' ? '🔴' : 
                          rec.priority === 'MEDIUM' ? '🟡' : '🟢';
      console.log(`${priorityIcon} [${rec.priority}] ${rec.category}`);
      console.log(`   Проблема: ${rec.message}`);
      console.log(`   Действие: ${rec.action}`);
      if (rec.elements.length > 0) {
        console.log(`   Элементы: ${rec.elements.slice(0, 3).join(', ')}${rec.elements.length > 3 ? '...' : ''}`);
      }
      console.log('');
    });
    
    // ===== СОХРАНЕНИЕ ОТЧЕТОВ =====
    console.log('\n💾 === СОХРАНЕНИЕ ДЕТАЛЬНЫХ ОТЧЕТОВ ===');
    const reports = await coverageTracker.saveDetailedReports();
    
    console.log('📊 Отчеты сохранены:');
    console.log(`   📄 JSON отчет: ${reports.json}`);
    console.log(`   🌐 HTML отчет: ${reports.html}`);
    console.log(`   🌳 Дерево покрытия: ${reports.tree}`);
    
    console.log('\n🎉 === ДЕМОНСТРАЦИЯ ЗАВЕРШЕНА ===');
    console.log('Откройте HTML отчет в браузере для интерактивного просмотра!');
    
  } catch (error) {
    console.error('❌ Ошибка во время демонстрации:', error);
  } finally {
    await browser.close();
  }
}

/**
 * Вспомогательная функция для вывода дерева в консоль
 */
function printTreeToConsole(nodes, level = 0) {
  nodes.slice(0, 20).forEach(node => { // Ограничиваем вывод первыми 20 элементами
    const indent = '  '.repeat(level);
    const coverageIcon = node.covered ? '✅' : '❌';
    const criticalIcon = node.critical ? '🔴' : '';
    const interactableIcon = node.interactable ? '🎯' : '';
    const testsInfo = node.coverage.tests.length > 0 ? ` (${node.coverage.tests.length} тестов)` : '';
    
    console.log(`${indent}${coverageIcon}${criticalIcon}${interactableIcon} ${node.type}: "${node.text.slice(0, 40)}${node.text.length > 40 ? '...' : ''}"${testsInfo}`);
    
    if (node.children && node.children.length > 0 && level < 2) { // Ограничиваем глубину
      printTreeToConsole(node.children, level + 1);
    }
  });
  
  if (nodes.length > 20) {
    console.log(`  ... и еще ${nodes.length - 20} элементов`);
  }
}

// Запуск демонстрации
if (import.meta.url === `file://${process.argv[1]}`) {
  runDetailedCoverageDemo().catch(console.error);
} 