import { test, expect } from '@playwright/test';
import { globalCoverageManager } from '../lib/globalCoverageManager.js';
import { MockMCPIntegration } from '../lib/mockMCPIntegration.js';

// Настройка глобального менеджера для всех тестов
test.beforeAll(async () => {
  // Инициализация глобальной сессии покрытия
  globalCoverageManager.initializeGlobalSession();
  console.log('🌐 Запущена глобальная сессия покрытия для всех тестов');
});

test.afterAll(async () => {
  // Генерация единого отчета после всех тестов
  console.log('📊 Все тесты завершены. Генерация единого отчета покрытия...');
  await globalCoverageManager.saveUnifiedReport();
  globalCoverageManager.cleanup();
});

test.describe('Единое покрытие UI элементов', () => {
  
  test('Тест 1: Главная страница Playwright', async ({ page }) => {
    const testName = 'Тест 1: Главная страница Playwright';
    
    // Переход на главную страницу
    await page.goto('https://playwright.dev');
    await page.waitForLoadState('networkidle');
    
    // Получение снимка через MCP
    const mcpClient = new MockMCPIntegration();
    const snapshot = await mcpClient.getMCPSnapshot(page, { pageName: 'playwright-homepage' });
    
    // Регистрация элементов страницы
    const elements = globalCoverageManager.registerTestPageElements(
      testName, 
      'playwright-homepage', 
      snapshot
    );
    
    console.log(`📋 [${testName}] Найдено ${elements.length} элементов`);
    
    // Взаимодействие с элементами
    try {
      // Клик по логотипу
      const logo = await page.locator('[aria-label="Playwright logo"]').first();
      if (await logo.isVisible()) {
        await logo.click();
        globalCoverageManager.markTestElementCovered(testName, {
          type: 'link',
          text: 'Playwright logo',
          selector: '[aria-label="Playwright logo"]'
        }, 'click');
      }
    } catch (error) {
      console.log('⚠️ Не удалось кликнуть по логотипу');
    }
    
    try {
      // Клик по кнопке "Get started"
      const getStartedBtn = await page.locator('text="Get started"').first();
      if (await getStartedBtn.isVisible()) {
        await getStartedBtn.click();
        globalCoverageManager.markTestElementCovered(testName, {
          type: 'button',
          text: 'Get started',
          selector: 'text="Get started"'
        }, 'click');
        
        // Ожидание загрузки страницы документации
        await page.waitForLoadState('networkidle');
      }
    } catch (error) {
      console.log('⚠️ Не удалось кликнуть по "Get started"');
    }
    
    // Завершение теста
    globalCoverageManager.completeTest(testName, 'passed');
  });

  test('Тест 2: Страница документации', async ({ page }) => {
    const testName = 'Тест 2: Страница документации';
    
    // Переход на страницу документации
    await page.goto('https://playwright.dev/docs/intro');
    await page.waitForLoadState('networkidle');
    
    // Получение снимка через MCP
    const mcpClient = new MockMCPIntegration();
    const snapshot = await mcpClient.getMCPSnapshot(page, { pageName: 'playwright-docs' });
    
    // Регистрация элементов страницы
    const elements = globalCoverageManager.registerTestPageElements(
      testName, 
      'playwright-docs', 
      snapshot
    );
    
    console.log(`📋 [${testName}] Найдено ${elements.length} элементов`);
    
    // Взаимодействие с элементами
    try {
      // Клик по ссылке в навигации
      const installationLink = await page.locator('text="Installation"').first();
      if (await installationLink.isVisible()) {
        await installationLink.click();
        globalCoverageManager.markTestElementCovered(testName, {
          type: 'link',
          text: 'Installation',
          selector: 'text="Installation"'
        }, 'click');
        
        await page.waitForTimeout(1000);
      }
    } catch (error) {
      console.log('⚠️ Не удалось кликнуть по ссылке Installation');
    }
    
    try {
      // Поиск по документации
      const searchInput = await page.locator('[placeholder*="Search"]').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('test');
        globalCoverageManager.markTestElementCovered(testName, {
          type: 'input',
          text: 'Search',
          selector: '[placeholder*="Search"]'
        }, 'fill');
        
        await page.waitForTimeout(1000);
      }
    } catch (error) {
      console.log('⚠️ Не удалось найти поле поиска');
    }
    
    // Завершение теста
    globalCoverageManager.completeTest(testName, 'passed');
  });

  test('Тест 3: API документация', async ({ page }) => {
    const testName = 'Тест 3: API документация';
    
    // Переход на страницу API
    await page.goto('https://playwright.dev/docs/api/class-page');
    await page.waitForLoadState('networkidle');
    
    // Получение снимка через MCP
    const mcpClient = new MockMCPIntegration();
    const snapshot = await mcpClient.getMCPSnapshot(page, { pageName: 'playwright-api' });
    
    // Регистрация элементов страницы
    const elements = globalCoverageManager.registerTestPageElements(
      testName, 
      'playwright-api', 
      snapshot
    );
    
    console.log(`📋 [${testName}] Найдено ${elements.length} элементов`);
    
    // Взаимодействие с элементами
    try {
      // Раскрытие секции методов
      const methodToggle = await page.locator('[data-toggle="collapse"]').first();
      if (await methodToggle.isVisible()) {
        await methodToggle.click();
        globalCoverageManager.markTestElementCovered(testName, {
          type: 'button',
          text: 'Method toggle',
          selector: '[data-toggle="collapse"]'
        }, 'click');
      }
    } catch (error) {
      console.log('⚠️ Не удалось раскрыть секцию методов');
    }
    
    // Завершение теста с неудачей для демонстрации
    globalCoverageManager.completeTest(testName, 'failed');
  });

  test('Тест 4: Примеры кода', async ({ page }) => {
    const testName = 'Тест 4: Примеры кода';
    
    // Переход на страницу с примерами
    await page.goto('https://playwright.dev/docs/writing-tests');
    await page.waitForLoadState('networkidle');
    
    // Получение снимка через MCP
    const mcpClient = new MockMCPIntegration();
    const snapshot = await mcpClient.getMCPSnapshot(page, { pageName: 'playwright-examples' });
    
    // Регистрация элементов страницы
    const elements = globalCoverageManager.registerTestPageElements(
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
          
          globalCoverageManager.markTestElementCovered(testName, {
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
    
    // Завершение теста
    globalCoverageManager.completeTest(testName, 'passed');
  });

  test('Тест 5: Конфигурация', async ({ page }) => {
    const testName = 'Тест 5: Конфигурация';
    
    // Переход на страницу конфигурации
    await page.goto('https://playwright.dev/docs/test-configuration');
    await page.waitForLoadState('networkidle');
    
    // Получение снимка через MCP
    const mcpClient = new MockMCPIntegration();
    const snapshot = await mcpClient.getMCPSnapshot(page, { pageName: 'playwright-config' });
    
    // Регистрация элементов страницы
    const elements = globalCoverageManager.registerTestPageElements(
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
        globalCoverageManager.markTestElementCovered(testName, {
          type: 'heading',
          text: 'Configuration',
          selector: 'h1'
        }, 'hover');
      }
    } catch (error) {
      console.log('⚠️ Не удалось выполнить взаимодействие с заголовком');
    }
    
    // Завершение теста
    globalCoverageManager.completeTest(testName, 'passed');
  });

}); 