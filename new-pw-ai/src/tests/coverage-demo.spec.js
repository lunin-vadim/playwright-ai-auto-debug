// new-pw-ai/src/tests/coverage-demo.spec.js

import { test, expect } from '../../coverage-lib/fixture.js';

test.describe('🎯 Test Coverage Demo', () => {
  
  test('✅ Homepage navigation test', async ({ page }) => {
    await test.step('Navigate to homepage', async () => {
      await page.goto('/');
      await expect(page).toHaveTitle(/Playwright/);
    });
    
    await test.step('Interact with main elements', async () => {
      // Тестируем основные элементы навигации
      const docsLink = page.locator('text=Docs');
      if (await docsLink.isVisible()) {
        await docsLink.click();
        await page.waitForLoadState('networkidle');
        await page.goBack();
      }
      
      // Тестируем поиск
      const searchButton = page.locator('[aria-label="Search"]').first();
      if (await searchButton.isVisible()) {
        await searchButton.click();
        await page.keyboard.press('Escape'); // Закрываем поиск
      }
      
      // Тестируем кнопку Get Started
      const getStartedButton = page.locator('text=Get started');
      if (await getStartedButton.isVisible()) {
        await getStartedButton.click();
        await page.waitForLoadState('networkidle');
        await page.goBack();
      }
    });
  });

  test('✅ Documentation page test', async ({ page }) => {
    await test.step('Navigate to docs', async () => {
      await page.goto('/docs/intro');
      await expect(page).toHaveTitle(/Playwright/);
    });
    
    await test.step('Test documentation elements', async () => {
      // Тестируем навигацию в документации
      const sidebar = page.locator('[role="navigation"]').first();
      if (await sidebar.isVisible()) {
        const firstLink = sidebar.locator('a').first();
        if (await firstLink.isVisible()) {
          await firstLink.click();
        }
      }
      
      // Тестируем поиск в документации
      const searchInput = page.locator('input[placeholder*="Search"]');
      if (await searchInput.isVisible()) {
        await searchInput.fill('test');
        await page.keyboard.press('Enter');
      }
    });
  });

  test('✅ API page exploration', async ({ page }) => {
    await test.step('Navigate to API docs', async () => {
      await page.goto('/docs/api/class-page');
      await page.waitForLoadState('networkidle');
    });
    
    await test.step('Test API documentation elements', async () => {
      // Тестируем элементы API документации
      const codeBlocks = page.locator('pre code');
      const count = await codeBlocks.count();
      expect(count).toBeGreaterThan(0);
      
      // Тестируем ссылки на методы
      const methodLinks = page.locator('a[href*="#"]');
      if (await methodLinks.first().isVisible()) {
        await methodLinks.first().click();
      }
    });
  });

  test('❌ Missing elements test', async ({ page }) => {
    await test.step('Navigate and search for missing elements', async () => {
      await page.goto('/');
      
      // Ищем элементы которых нет - для демонстрации непокрытых элементов
      try {
        await page.locator('#non-existent-button').click({ timeout: 1000 });
      } catch (error) {
        // Ожидаемая ошибка
      }
      
      try {
        await page.locator('.missing-form').fill('test');
      } catch (error) {
        // Ожидаемая ошибка  
      }
    });
  });
});
