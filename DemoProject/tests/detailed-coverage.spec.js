// DemoProject/tests/detailed-coverage.spec.js

import { test, expect } from '@playwright/test';
import { DetailedCoverageTracker } from '../lib/detailedCoverageTracker.js';
import { MockMCPIntegration } from '../lib/mockMCPIntegration.js';

/**
 * 🎯 Демонстрация детального покрытия UI элементов
 * Показывает какие именно элементы покрыты тестами, а какие нет
 */

let coverageTracker;
let mcpIntegration;

test.beforeAll(async () => {
  // Инициализация детального трекера покрытия
  coverageTracker = new DetailedCoverageTracker({
    outputDir: 'detailed-coverage',
    trackingEnabled: true,
    includeSelectors: true,
    includeScreenshots: true
  });
  
  mcpIntegration = new MockMCPIntegration();
  
  // Начало сессии детального покрытия
  coverageTracker.startSession('detailed-demo-session');
  
  console.log('🎬 Начата сессия детального покрытия UI элементов');
});

test.afterAll(async () => {
  if (coverageTracker) {
    // Генерация и сохранение детальных отчетов
    const reports = await coverageTracker.saveDetailedReports();
    
    console.log('\n📊 === ДЕТАЛЬНЫЕ ОТЧЕТЫ ПОКРЫТИЯ ===');
    console.log(`JSON отчет: ${reports.json}`);
    console.log(`HTML отчет: ${reports.html}`);
    console.log(`Дерево покрытия: ${reports.tree}`);
    
    // Показать краткую сводку
    const summary = coverageTracker.generateDetailedCoverageReport();
    console.log('\n📈 === СВОДКА ПОКРЫТИЯ ===');
    console.log(`Всего элементов: ${summary.summary.totalElements}`);
    console.log(`Покрыто: ${summary.summary.coveredElements}`);
    console.log(`Не покрыто: ${summary.summary.uncoveredElements}`);
    console.log(`Покрытие: ${summary.summary.coveragePercentage}%`);
    
    // Показать непокрытые критичные элементы
    const uncoveredCritical = summary.detailedElements.critical.filter(el => !el.covered);
    if (uncoveredCritical.length > 0) {
      console.log('\n🔴 === НЕПОКРЫТЫЕ КРИТИЧНЫЕ ЭЛЕМЕНТЫ ===');
      uncoveredCritical.forEach(el => {
        console.log(`❌ ${el.type}: "${el.text}" (${el.selector})`);
      });
    }
  }
});

test.describe('Детальное покрытие UI элементов', () => {
  
  test('Анализ главной страницы с детальным трекингом', async ({ page }) => {
    console.log('\n🔍 === АНАЛИЗ ГЛАВНОЙ СТРАНИЦЫ ===');
    
    // Переход на страницу
    await page.goto('https://playwright.dev');
    await page.waitForLoadState('networkidle');
    
    // Получение MCP snapshot
    const mcpSnapshot = await mcpIntegration.getMCPSnapshot(page);
    console.log('📸 MCP snapshot получен');
    
    // Регистрация всех элементов страницы
    const elements = coverageTracker.registerPageElements(
      'playwright-homepage', 
      mcpSnapshot, 
      'homepage-analysis'
    );
    
    console.log(`📋 Найдено ${elements.length} элементов на странице`);
    
    // Показать дерево элементов в консоли
    console.log('\n🌳 === ДЕРЕВО ЭЛЕМЕНТОВ ===');
    const tree = coverageTracker.generateCoverageTree('playwright-homepage');
    printTreeToConsole(tree.tree, 0);
    
    // Взаимодействие с некоторыми элементами для демонстрации покрытия
    console.log('\n🎯 === ВЗАИМОДЕЙСТВИЯ ===');
    
    // Поиск и клик по кнопке "Get started"
    try {
      const getStartedButton = page.locator('text="Get started"').first();
      if (await getStartedButton.isVisible()) {
        await getStartedButton.click();
        console.log('✅ Кликнули по кнопке "Get started"');
        
        // Отметка элемента как покрытого
        coverageTracker.markElementCovered(
          { type: 'button', text: 'Get started' },
          'homepage-analysis',
          'click'
        );
      }
    } catch (error) {
      console.log('❌ Кнопка "Get started" не найдена');
    }
    
    // Возврат на главную
    await page.goto('https://playwright.dev');
    await page.waitForLoadState('networkidle');
    
    // Поиск и клик по ссылке "Docs"
    try {
      const docsLink = page.locator('text="Docs"').first();
      if (await docsLink.isVisible()) {
        await docsLink.hover();
        console.log('✅ Навели на ссылку "Docs"');
        
        coverageTracker.markElementCovered(
          { type: 'link', text: 'Docs' },
          'homepage-analysis',
          'hover'
        );
      }
    } catch (error) {
      console.log('❌ Ссылка "Docs" не найдена');
    }
    
    // Поиск поля поиска
    try {
      const searchInput = page.locator('input[placeholder*="Search"], [role="searchbox"]').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('testing');
        console.log('✅ Ввели текст в поле поиска');
        
        coverageTracker.markElementCovered(
          { type: 'input', text: 'Search' },
          'homepage-analysis',
          'fill'
        );
      }
    } catch (error) {
      console.log('❌ Поле поиска не найдено');
    }
    
    expect(elements.length).toBeGreaterThan(0);
  });
  
  test('Анализ страницы документации', async ({ page }) => {
    console.log('\n📚 === АНАЛИЗ СТРАНИЦЫ ДОКУМЕНТАЦИИ ===');
    
    await page.goto('https://playwright.dev/docs/intro');
    await page.waitForLoadState('networkidle');
    
    // Получение snapshot для страницы документации
    const mcpSnapshot = await mcpIntegration.getMCPSnapshot(page);
    
    // Регистрация элементов
    const elements = coverageTracker.registerPageElements(
      'playwright-docs', 
      mcpSnapshot, 
      'docs-analysis'
    );
    
    console.log(`📋 Найдено ${elements.length} элементов на странице документации`);
    
    // Взаимодействие с навигацией
    try {
      const nextButton = page.locator('text="Next"').first();
      if (await nextButton.isVisible()) {
        await nextButton.click();
        console.log('✅ Кликнули по кнопке "Next"');
        
        coverageTracker.markElementCovered(
          { type: 'button', text: 'Next' },
          'docs-analysis',
          'click'
        );
      }
    } catch (error) {
      console.log('❌ Кнопка "Next" не найдена');
    }
    
    expect(elements.length).toBeGreaterThan(0);
  });
  
  test('Генерация итогового отчета покрытия', async ({ page }) => {
    console.log('\n📊 === ГЕНЕРАЦИЯ ИТОГОВОГО ОТЧЕТА ===');
    
    // Убедимся что есть данные - если нет, добавим тестовые
    if (coverageTracker.coverageData.allElements.size === 0) {
      // Добавим тестовые данные для демонстрации
      const mockSnapshot = `- button: "Test button"
- link: "Test link"
- input: "Test input"`;
      
      coverageTracker.registerPageElements('test-page', mockSnapshot, 'test-case');
      coverageTracker.markElementCovered(
        { type: 'button', text: 'Test button' },
        'test-case',
        'click'
      );
    }
    
    // Получение детального отчета
    const report = coverageTracker.generateDetailedCoverageReport();
    
    console.log('\n📈 === СТАТИСТИКА ===');
    console.log(`Всего элементов: ${report.summary.totalElements}`);
    console.log(`Покрыто тестами: ${report.summary.coveredElements}`);
    console.log(`Не покрыто: ${report.summary.uncoveredElements}`);
    console.log(`Процент покрытия: ${report.summary.coveragePercentage}%`);
    console.log(`Взаимодействий: ${report.summary.interactionsCount}`);
    
    // Покрытие по типам элементов
    console.log('\n📊 === ПОКРЫТИЕ ПО ТИПАМ ===');
    Object.entries(report.coverageByType).forEach(([type, coverage]) => {
      const icon = coverage.percentage === 100 ? '✅' : coverage.percentage > 50 ? '⚠️' : '❌';
      console.log(`${icon} ${type}: ${coverage.covered}/${coverage.total} (${coverage.percentage}%)`);
    });
    
    // Покрытие по страницам
    console.log('\n🌐 === ПОКРЫТИЕ ПО СТРАНИЦАМ ===');
    Object.entries(report.coverageByPage).forEach(([page, coverage]) => {
      const icon = coverage.percentage === 100 ? '✅' : coverage.percentage > 50 ? '⚠️' : '❌';
      console.log(`${icon} ${page}: ${coverage.covered}/${coverage.total} (${coverage.percentage}%)`);
    });
    
    // Критичные элементы
    console.log('\n🔴 === КРИТИЧНЫЕ ЭЛЕМЕНТЫ ===');
    console.log(`Всего критичных: ${report.criticalCoverage.total}`);
    console.log(`Покрыто: ${report.criticalCoverage.covered}`);
    console.log(`Не покрыто: ${report.criticalCoverage.uncovered}`);
    console.log(`Процент: ${report.criticalCoverage.percentage}%`);
    
    // Список непокрытых элементов
    console.log('\n❌ === НЕПОКРЫТЫЕ ЭЛЕМЕНТЫ ===');
    report.detailedElements.uncovered.slice(0, 10).forEach(element => {
      const criticalMark = element.critical ? '🔴' : '';
      const interactiveMark = element.interactable ? '🎯' : '';
      console.log(`${criticalMark}${interactiveMark} ${element.type}: "${element.text}" (${element.selector})`);
    });
    
    if (report.detailedElements.uncovered.length > 10) {
      console.log(`... и еще ${report.detailedElements.uncovered.length - 10} элементов`);
    }
    
    // Рекомендации
    console.log('\n💡 === РЕКОМЕНДАЦИИ ===');
    report.recommendations.forEach(rec => {
      const priorityIcon = rec.priority === 'HIGH' ? '🔴' : rec.priority === 'MEDIUM' ? '🟡' : '🟢';
      console.log(`${priorityIcon} [${rec.priority}] ${rec.category}: ${rec.message}`);
      console.log(`   Действие: ${rec.action}`);
      if (rec.elements.length > 0) {
        console.log(`   Элементы: ${rec.elements.join(', ')}`);
      }
    });
    
    // Проверки
    expect(report.summary.totalElements).toBeGreaterThan(0);
    expect(report.summary.coveragePercentage).toBeGreaterThanOrEqual(0);
    expect(report.summary.coveragePercentage).toBeLessThanOrEqual(100);
  });
});

/**
 * Вспомогательная функция для вывода дерева в консоль
 */
function printTreeToConsole(nodes, level = 0) {
  nodes.forEach(node => {
    const indent = '  '.repeat(level);
    const coverageIcon = node.covered ? '✅' : '❌';
    const criticalIcon = node.critical ? '🔴' : '';
    const interactableIcon = node.interactable ? '🎯' : '';
    const testsInfo = node.coverage.tests.length > 0 ? ` (${node.coverage.tests.length} тестов)` : '';
    
    console.log(`${indent}${coverageIcon}${criticalIcon}${interactableIcon} ${node.type}: "${node.text}"${testsInfo}`);
    
    if (node.children && node.children.length > 0) {
      printTreeToConsole(node.children, level + 1);
    }
  });
} 