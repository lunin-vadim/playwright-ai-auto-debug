// DemoProject/tests/unified-coverage-all.spec.js

import { test, expect } from '@playwright/test';
import { GlobalCoverageManager } from '../lib/globalCoverageManager.js';
import { MockMCPIntegration } from '../lib/mockMCPIntegration.js';

// Создаем единый экземпляр менеджера для всех тестов
const unifiedCoverageManager = new GlobalCoverageManager({
  outputDir: 'unified-coverage-all',
  sessionName: `all-tests-session-${Date.now()}`
});

// Последовательное выполнение всех тестов в одном worker'е
test.describe.serial('🎯 ЕДИНЫЙ ОТЧЕТ: Все тесты в одном документе', () => {
  
  test.beforeAll(async () => {
    // Инициализация единой сессии покрытия
    unifiedCoverageManager.initializeGlobalSession();
    console.log('🌐 Запущена единая сессия покрытия для ВСЕХ тестов');
  });

  test.afterAll(async () => {
    // Генерация единого отчета после всех тестов
    console.log('📊 Генерация ЕДИНОГО отчета покрытия...');
    await unifiedCoverageManager.saveUnifiedReport();
    unifiedCoverageManager.cleanup();
    console.log('✅ ЕДИНЫЙ отчет создан в unified-coverage-all/');
  });

  test('✅ УСПЕШНЫЙ: Главная страница Playwright', async ({ page }) => {
    const testName = 'УСПЕШНЫЙ: Главная страница Playwright';
    
    try {
      await page.goto('https://playwright.dev');
      await page.waitForLoadState('networkidle');
      
      const mcpClient = new MockMCPIntegration();
      const snapshot = await mcpClient.getMCPSnapshot(page, { pageName: 'playwright-homepage' });
      
      const elements = unifiedCoverageManager.registerTestPageElements(
        testName, 
        'playwright-homepage', 
        snapshot
      );
      
      console.log(`📋 [${testName}] Найдено ${elements.length} элементов`);
      
      // Взаимодействие с элементами
      try {
        const getStartedBtn = await page.locator('text="Get started"').first();
        if (await getStartedBtn.isVisible()) {
          await getStartedBtn.click();
          unifiedCoverageManager.markTestElementCovered(testName, {
            type: 'button',
            text: 'Get started',
            selector: 'text="Get started"'
          }, 'click');
          
          await page.waitForLoadState('networkidle');
        }
      } catch (error) {
        console.log('⚠️ Не удалось кликнуть по "Get started"');
      }
      
      unifiedCoverageManager.completeTest(testName, 'passed');
      
    } catch (error) {
      console.log(`❌ Ошибка в тесте ${testName}:`, error.message);
      unifiedCoverageManager.completeTest(testName, 'failed');
      throw error;
    }
  });

  test('✅ УСПЕШНЫЙ: Страница документации', async ({ page }) => {
    const testName = 'УСПЕШНЫЙ: Страница документации';
    
    try {
      await page.goto('https://playwright.dev/docs/intro');
      await page.waitForLoadState('networkidle');
      
      const mcpClient = new MockMCPIntegration();
      const snapshot = await mcpClient.getMCPSnapshot(page, { pageName: 'playwright-docs' });
      
      const elements = unifiedCoverageManager.registerTestPageElements(
        testName, 
        'playwright-docs', 
        snapshot
      );
      
      console.log(`📋 [${testName}] Найдено ${elements.length} элементов`);
      
      try {
        const installationLink = await page.locator('text="Installation"').first();
        if (await installationLink.isVisible()) {
          await installationLink.click();
          unifiedCoverageManager.markTestElementCovered(testName, {
            type: 'link',
            text: 'Installation',
            selector: 'text="Installation"'
          }, 'click');
          
          await page.waitForTimeout(1000);
        }
      } catch (error) {
        console.log('⚠️ Не удалось кликнуть по ссылке Installation');
      }
      
      unifiedCoverageManager.completeTest(testName, 'passed');
      
    } catch (error) {
      console.log(`❌ Ошибка в тесте ${testName}:`, error.message);
      unifiedCoverageManager.completeTest(testName, 'failed');
      throw error;
    }
  });

  test('❌ УПАВШИЙ: API документация (намеренная ошибка)', async ({ page }) => {
    const testName = 'УПАВШИЙ: API документация';
    
    try {
      await page.goto('https://playwright.dev/docs/api/class-page');
      await page.waitForLoadState('networkidle');
      
      const mcpClient = new MockMCPIntegration();
      const snapshot = await mcpClient.getMCPSnapshot(page, { pageName: 'playwright-api' });
      
      const elements = unifiedCoverageManager.registerTestPageElements(
        testName, 
        'playwright-api', 
        snapshot
      );
      
      console.log(`📋 [${testName}] Найдено ${elements.length} элементов`);
      
      // Минимальное взаимодействие перед ошибкой
      try {
        const heading = await page.locator('h1').first();
        if (await heading.isVisible()) {
          await heading.hover();
          unifiedCoverageManager.markTestElementCovered(testName, {
            type: 'heading',
            text: 'API Documentation',
            selector: 'h1'
          }, 'hover');
        }
      } catch (error) {
        console.log('⚠️ Не удалось выполнить взаимодействие с заголовком');
      }
      
      // Намеренная ошибка для демонстрации упавшего теста
      unifiedCoverageManager.completeTest(testName, 'failed');
      console.log('❌ Тест намеренно упал для демонстрации');
      
    } catch (error) {
      console.log(`❌ Ошибка в тесте ${testName}:`, error.message);
      unifiedCoverageManager.completeTest(testName, 'failed');
      // Не бросаем ошибку дальше, чтобы продолжить выполнение других тестов
    }
  });

  test('✅ УСПЕШНЫЙ: Примеры кода с высоким покрытием', async ({ page }) => {
    const testName = 'УСПЕШНЫЙ: Примеры кода с высоким покрытием';
    
    try {
      await page.goto('https://playwright.dev/docs/writing-tests');
      await page.waitForLoadState('networkidle');
      
      const mcpClient = new MockMCPIntegration();
      const snapshot = await mcpClient.getMCPSnapshot(page, { pageName: 'playwright-examples' });
      
      const elements = unifiedCoverageManager.registerTestPageElements(
        testName, 
        'playwright-examples', 
        snapshot
      );
      
      console.log(`📋 [${testName}] Найдено ${elements.length} элементов`);
      
      // Множественные взаимодействия для демонстрации высокого покрытия
      const interactions = [
        { selector: 'h1', type: 'heading', action: 'hover' },
        { selector: 'code', type: 'code', action: 'click' },
        { selector: '[role="tab"]', type: 'tab', action: 'click' },
        { selector: 'button', type: 'button', action: 'click' },
        { selector: 'a[href*="github"]', type: 'link', action: 'hover' }
      ];
      
      for (const interaction of interactions) {
        try {
          const element = await page.locator(interaction.selector).first();
          if (await element.isVisible()) {
            if (interaction.action === 'click') {
              await element.click();
            } else if (interaction.action === 'hover') {
              await element.hover();
            }
            
            unifiedCoverageManager.markTestElementCovered(testName, {
              type: interaction.type,
              text: interaction.selector,
              selector: interaction.selector
            }, interaction.action);
            
            await page.waitForTimeout(500);
          }
        } catch (error) {
          console.log(`⚠️ Не удалось выполнить ${interaction.action} для ${interaction.selector}`);
        }
      }
      
      unifiedCoverageManager.completeTest(testName, 'passed');
      
    } catch (error) {
      console.log(`❌ Ошибка в тесте ${testName}:`, error.message);
      unifiedCoverageManager.completeTest(testName, 'failed');
      throw error;
    }
  });

  test('✅ УСПЕШНЫЙ: Конфигурация с низким покрытием', async ({ page }) => {
    const testName = 'УСПЕШНЫЙ: Конфигурация с низким покрытием';
    
    try {
      await page.goto('https://playwright.dev/docs/test-configuration');
      await page.waitForLoadState('networkidle');
      
      const mcpClient = new MockMCPIntegration();
      const snapshot = await mcpClient.getMCPSnapshot(page, { pageName: 'playwright-config' });
      
      const elements = unifiedCoverageManager.registerTestPageElements(
        testName, 
        'playwright-config', 
        snapshot
      );
      
      console.log(`📋 [${testName}] Найдено ${elements.length} элементов`);
      
      // Минимальное взаимодействие для демонстрации низкого покрытия
      try {
        const heading = await page.locator('h1').first();
        if (await heading.isVisible()) {
          await heading.hover();
          unifiedCoverageManager.markTestElementCovered(testName, {
            type: 'heading',
            text: 'Configuration',
            selector: 'h1'
          }, 'hover');
        }
      } catch (error) {
        console.log('⚠️ Не удалось выполнить взаимодействие с заголовком');
      }
      
      unifiedCoverageManager.completeTest(testName, 'passed');
      
    } catch (error) {
      console.log(`❌ Ошибка в тесте ${testName}:`, error.message);
      unifiedCoverageManager.completeTest(testName, 'failed');
      throw error;
    }
  });

  test('❌ УПАВШИЙ: Неправильный URL (намеренная ошибка)', async ({ page }) => {
    const testName = 'УПАВШИЙ: Неправильный URL';
    
    try {
      // Намеренно неправильный URL для демонстрации ошибки
      await page.goto('https://playwright.dev/nonexistent-page-404');
      await page.waitForLoadState('networkidle');
      
      const mcpClient = new MockMCPIntegration();
      const snapshot = await mcpClient.getMCPSnapshot(page, { pageName: 'playwright-404' });
      
      const elements = unifiedCoverageManager.registerTestPageElements(
        testName, 
        'playwright-404', 
        snapshot
      );
      
      console.log(`📋 [${testName}] Найдено ${elements.length} элементов`);
      
      // Попытка найти элемент, которого нет
      const nonExistentElement = await page.locator('text="This element does not exist"');
      await expect(nonExistentElement).toBeVisible({ timeout: 1000 });
      
      unifiedCoverageManager.completeTest(testName, 'passed');
      
    } catch (error) {
      console.log(`❌ Ошибка в тесте ${testName}:`, error.message);
      unifiedCoverageManager.completeTest(testName, 'failed');
      // Не бросаем ошибку дальше, чтобы продолжить выполнение других тестов
    }
  });

}); 