// new-pw-ai/src/main/lib/testCoverageFixture.js

import { test as base } from '@playwright/test';
import { TestElementTracker } from './testElementTracker.js';
import { GlobalCoverageTracker } from './globalCoverageTracker.js';

/**
 * Playwright fixture для автоматического отслеживания покрытия элементов
 */

// Глобальные трекеры
const elementTracker = new TestElementTracker({
  outputDir: 'test-coverage-reports',
  trackingEnabled: true
});

const globalTracker = new GlobalCoverageTracker({
  outputDir: 'test-coverage-reports',
  trackingEnabled: true
});

/**
 * Расширенный test fixture с автоматическим отслеживанием покрытия
 */
export const test = base.extend({
  // Автоматическое отслеживание для каждого теста
  page: async ({ page }, use, testInfo) => {
    const testName = testInfo.title;
    
    // Запускаем отслеживание для теста
    await elementTracker.startTestTracking(testName, page);
    
    // Перехватываем методы page для отслеживания селекторов
    const originalMethods = {};
    
    // Список методов для отслеживания
    const methodsToTrack = [
      'click', 'fill', 'type', 'check', 'uncheck', 'selectOption',
      'hover', 'focus', 'blur', 'dblclick', 'press',
      'waitForSelector', 'isVisible', 'isEnabled', 'isChecked'
    ];
    
    // Перехватываем методы page
    methodsToTrack.forEach(methodName => {
      if (typeof page[methodName] === 'function') {
        originalMethods[methodName] = page[methodName];
        page[methodName] = function(selector, ...args) {
          // Отслеживаем использование селектора в обоих трекерах
          elementTracker.trackSelectorUsage(testName, selector, methodName, args[0]);
          globalTracker.addSelectorUsage(testName, selector, methodName, args[0]);
          return originalMethods[methodName].call(this, selector, ...args);
        };
      }
    });

    // Перехватываем page.goto для анализа страниц
    const originalGoto = page.goto;
    page.goto = async function(url, options) {
      const result = await originalGoto.call(this, url, options);
      
      // Анализируем страницу после загрузки
      try {
        const currentUrl = page.url();
        if (currentUrl && 
            !currentUrl.includes('about:blank') && 
            currentUrl.includes('playwright.dev')) {
          console.log(`🔍 Анализирую страницу после goto: ${currentUrl} для теста: ${testName}`);
          
          // Анализируем в обоих трекерах
          await elementTracker.trackPageVisit(testName, currentUrl, page);
          
          // Добавляем данные в глобальный трекер
          const pageElements = await elementTracker.extractPageElements(page, currentUrl);
          globalTracker.addPageData(currentUrl, { elements: pageElements }, testName);
        }
      } catch (error) {
        console.warn(`⚠️ Ошибка анализа после goto:`, error.message);
      }
      
      return result;
    };
    
    // Перехватываем page.locator
    const originalLocator = page.locator;
    page.locator = function(selector, options) {
      elementTracker.trackSelectorUsage(testName, selector, 'locator', options);
      globalTracker.addSelectorUsage(testName, selector, 'locator', options);
      return originalLocator.call(this, selector, options);
    };
    
    // Перехватываем методы getBy*
    const getByMethods = ['getByRole', 'getByText', 'getByLabel', 'getByTestId', 'getByPlaceholder'];
    getByMethods.forEach(methodName => {
      if (typeof page[methodName] === 'function') {
        originalMethods[methodName] = page[methodName];
        page[methodName] = function(selector, options) {
          const selectorString = typeof selector === 'string' ? selector : JSON.stringify(selector);
          elementTracker.trackSelectorUsage(testName, `${methodName}(${selectorString})`, methodName, options);
          globalTracker.addSelectorUsage(testName, `${methodName}(${selectorString})`, methodName, options);
          return originalMethods[methodName].call(this, selector, options);
        };
      }
    });
    
    // Отслеживание навигации и анализ элементов страницы
    page.on('load', async () => {
      try {
        const url = page.url();
        if (url && 
            !url.includes('about:blank') && 
            !url.includes('/assets/') && 
            !url.includes('/img/') && 
            !url.includes('.js') && 
            !url.includes('.css') && 
            !url.includes('.png') && 
            !url.includes('.jpg') && 
            !url.includes('.svg') &&
            url.includes('playwright.dev')) {
          console.log(`🔍 Анализирую HTML страницу: ${url} для теста: ${testName}`);
          await globalTracker.trackPageVisit(testName, url, page);
        }
      } catch (error) {
        console.warn(`⚠️ Ошибка отслеживания страницы:`, error.message);
      }
    });
    
    // Используем оригинальную page
    await use(page);
    
    // Завершаем отслеживание теста
    await elementTracker.finishTestTracking(testName);
    
    // Добавляем данные теста в глобальный трекер
    const testData = elementTracker.testCoverageData.tests.get(testName);
    if (testData) {
      globalTracker.addTestData(testName, {
        ...testData,
        status: testInfo.status
      });
    }
  }
});

/**
 * Хук для генерации отчета после всех тестов
 */
test.afterAll(async () => {
  console.log('\n📊 Генерирую объединенный отчет покрытия всех тестов...');
  
  try {
    // Генерируем объединенный отчет
    const unifiedReport = globalTracker.generateUnifiedReport();
    const reportPaths = await globalTracker.saveUnifiedReport(unifiedReport);
    
    console.log('✅ Объединенный анализ покрытия завершен');
    console.log(`📈 Общее покрытие: ${unifiedReport.summary.coveragePercentage}%`);
    console.log(`🧪 Всего тестов: ${unifiedReport.summary.totalTests}`);
    console.log(`📄 Страниц: ${unifiedReport.summary.totalPages}`);
    console.log(`🎯 Элементов найдено: ${unifiedReport.summary.totalElements}`);
    console.log(`✅ Покрыто: ${unifiedReport.summary.coveredElements}`);
    console.log(`❌ Непокрыто: ${unifiedReport.summary.uncoveredElements}`);
    
    // Выводим рекомендации
    if (unifiedReport.recommendations.length > 0) {
      console.log('\n💡 Рекомендации:');
      unifiedReport.recommendations.forEach(rec => {
        console.log(`   ${rec.message}`);
      });
    }
    
    // Показываем топ непокрытых элементов
    if (unifiedReport.uncoveredElements.length > 0) {
      console.log('\n🎯 Топ-5 непокрытых элементов:');
      unifiedReport.uncoveredElements.slice(0, 5).forEach((element, index) => {
        console.log(`   ${index + 1}. ${element.text || element.tagName} (${element.pageUrl})`);
        console.log(`      Селекторы: ${element.suggestedSelectors.slice(0, 2).join(', ')}`);
      });
    }
    
    console.log(`\n🏠 Главный отчет: test-coverage-reports/index.html`);
    console.log(`📊 Детальный отчет: ${reportPaths.htmlPath}`);
    
  } catch (error) {
    console.error('❌ Ошибка генерации объединенного отчета:', error.message);
  }
});

export { expect } from '@playwright/test';
