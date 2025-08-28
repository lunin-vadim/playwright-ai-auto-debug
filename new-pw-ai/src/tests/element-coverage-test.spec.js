// new-pw-ai/src/tests/element-coverage-test.spec.js

import { test, expect } from '../../coverage-lib/fixture.js';

test.describe('🎯 Element Coverage Test', () => {
  
  test('✅ Cover top uncovered elements', async ({ page }) => {
    await test.step('Navigate to homepage', async () => {
      await page.goto('/');
      await expect(page).toHaveTitle(/Playwright/);
    });
    
    await test.step('Test Search element', async () => {
      // Покрываем Search⌘K элемент (топ #1 из отчета)
      const searchButton = page.locator('[aria-label="Search (Command+K)"]');
      if (await searchButton.isVisible()) {
        await searchButton.click();
        await page.keyboard.press('Escape'); // Закрываем поиск
        console.log('✅ Покрыт элемент: Search⌘K');
      }
    });
    
    await test.step('Test Playwright logo', async () => {
      // Покрываем Playwright logo (топ #2 из отчета)  
      const playwrightLogo = page.locator('text=Playwright').first();
      if (await playwrightLogo.isVisible()) {
        await playwrightLogo.click();
        await page.waitForLoadState('networkidle');
        console.log('✅ Покрыт элемент: Playwright logo');
      }
    });
    
    await test.step('Test API navigation', async () => {
      // Покрываем API link (топ #4 из отчета)
      await page.goto('/');
      const apiLink = page.locator('text=API');
      if (await apiLink.isVisible()) {
        await apiLink.click();
        await page.waitForLoadState('networkidle');
        console.log('✅ Покрыт элемент: API link');
      }
    });
    
    await test.step('Test Node.js dropdown', async () => {
      // Покрываем Node.js dropdown (топ #5 из отчета)
      await page.goto('/');
      const nodeJsButton = page.locator('[role="button"]').filter({ hasText: 'Node.js' });
      if (await nodeJsButton.isVisible()) {
        await nodeJsButton.hover(); // Открываем dropdown
        await page.waitForTimeout(500);
        console.log('✅ Покрыт элемент: Node.js dropdown');
      }
    });
    
    await test.step('Test Community navigation', async () => {
      // Покрываем Community link (топ #9 из отчета)
      const communityLink = page.locator('text=Community');
      if (await communityLink.isVisible()) {
        await communityLink.click();
        await page.waitForLoadState('networkidle');
        console.log('✅ Покрыт элемент: Community link');
      }
    });
  });

  test('✅ Cover language dropdown elements', async ({ page }) => {
    await test.step('Navigate and test language options', async () => {
      await page.goto('/');
      
      // Покрываем элементы языков из dropdown
      const nodeJsButton = page.locator('[role="button"]').filter({ hasText: 'Node.js' });
      if (await nodeJsButton.isVisible()) {
        await nodeJsButton.hover();
        await page.waitForTimeout(500);
        
        // Тестируем Python link
        const pythonLink = page.locator('.dropdown__link').filter({ hasText: 'Python' });
        if (await pythonLink.isVisible()) {
          await pythonLink.click();
          await page.waitForLoadState('networkidle');
          console.log('✅ Покрыт элемент: Python link');
        }
      }
    });
    
    await test.step('Test Java language option', async () => {
      await page.goto('/');
      
      const nodeJsButton = page.locator('[role="button"]').filter({ hasText: 'Node.js' });
      if (await nodeJsButton.isVisible()) {
        await nodeJsButton.hover();
        await page.waitForTimeout(500);
        
        // Тестируем Java link
        const javaLink = page.locator('.dropdown__link').filter({ hasText: 'Java' });
        if (await javaLink.isVisible()) {
          await javaLink.click();
          await page.waitForLoadState('networkidle');
          console.log('✅ Покрыт элемент: Java link');
        }
      }
    });
    
    await test.step('Test .NET language option', async () => {
      await page.goto('/');
      
      const nodeJsButton = page.locator('[role="button"]').filter({ hasText: 'Node.js' });
      if (await nodeJsButton.isVisible()) {
        await nodeJsButton.hover();
        await page.waitForTimeout(500);
        
        // Тестируем .NET link
        const dotnetLink = page.locator('.dropdown__link').filter({ hasText: '.NET' });
        if (await dotnetLink.isVisible()) {
          await dotnetLink.click();
          await page.waitForLoadState('networkidle');
          console.log('✅ Покрыт элемент: .NET link');
        }
      }
    });
  });

  test('✅ Cover GitHub and social elements', async ({ page }) => {
    await test.step('Navigate and test GitHub elements', async () => {
      await page.goto('/');
      
      // Покрываем Star button
      const starButton = page.locator('[aria-label="Star microsoft/playwright on GitHub"]');
      if (await starButton.isVisible()) {
        await starButton.hover(); // Не кликаем чтобы не переходить на GitHub
        console.log('✅ Покрыт элемент: Star button');
      }
      
      // Покрываем GitHub link если есть
      const githubLink = page.locator('a[href*="github.com"]').first();
      if (await githubLink.isVisible()) {
        await githubLink.hover();
        console.log('✅ Покрыт элемент: GitHub link');
      }
    });
  });

  test('✅ Cover footer and additional elements', async ({ page }) => {
    await test.step('Navigate and scroll to footer', async () => {
      await page.goto('/');
      
      // Скроллим вниз для доступа к footer элементам
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
    });
    
    await test.step('Test footer elements', async () => {
      // Ищем и тестируем footer элементы
      const footerLinks = page.locator('footer a');
      const count = await footerLinks.count();
      
      if (count > 0) {
        // Тестируем первые несколько ссылок в footer
        for (let i = 0; i < Math.min(count, 3); i++) {
          const link = footerLinks.nth(i);
          if (await link.isVisible()) {
            const text = await link.textContent();
            await link.hover();
            console.log(`✅ Покрыт footer элемент: ${text}`);
          }
        }
      }
    });
    
    await test.step('Test additional interactive elements', async () => {
      // Ищем дополнительные интерактивные элементы
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      console.log(`🔍 Найдено ${buttonCount} кнопок на странице`);
      
      // Тестируем первые несколько кнопок
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const text = await button.textContent();
          await button.hover();
          console.log(`✅ Покрыта кнопка: ${text || 'без текста'}`);
        }
      }
    });
  });
});
