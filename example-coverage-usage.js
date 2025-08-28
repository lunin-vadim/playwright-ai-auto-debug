// example-coverage-usage.js - Пример использования системы покрытия UI тестов

// ✅ ПРОСТОЙ СПОСОБ - Импорт готового fixture
import { test, expect } from 'playwright-ai-auto-debug/coverage';

test.describe('🎯 Мои тесты с покрытием', () => {
  test('✅ Тест с автоматическим отслеживанием покрытия', async ({ page }) => {
    // Система автоматически отслеживает все взаимодействия
    await page.goto('https://example.com');
    
    // Каждый locator и действие отслеживается
    await page.locator('button').click();
    await page.locator('#login').fill('user');
    
    // В конце всех тестов генерируется объединенный отчет
    // test-coverage-reports/index.html
  });
});

// ✅ ПРОДВИНУТЫЙ СПОСОБ - Ручная настройка
import { TestElementTracker, GlobalCoverageTracker } from 'playwright-ai-auto-debug/coverage';
import { test as base } from '@playwright/test';

// Создаем кастомный трекер с настройками
const customTracker = new GlobalCoverageTracker({
  outputDir: 'my-coverage-reports',
  trackingEnabled: true
});

// Создаем кастомный fixture
export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    // Ваша кастомная логика
    await customTracker.startTracking(testInfo.title);
    
    await use(page);
    
    await customTracker.finishTracking(testInfo.title);
  }
});

test.afterAll(async () => {
  const report = customTracker.generateUnifiedReport();
  await customTracker.saveUnifiedReport(report);
});
