import { test } from '../lib/simpleFixture.js';
import { expect } from '@playwright/test';

test.describe('🎯 AI Debug Integration Demo', () => {
  
  test('✅ Successful navigation test', async ({ page }) => {
    await test.step('Navigate to Playwright homepage', async () => {
      await page.goto('/');
      await expect(page).toHaveTitle(/Playwright/);
    });
    
    await test.step('Check main elements', async () => {
      console.log('🔍 Проверяем основные элементы...');
      
      // Используем конкретный селектор из отчета
      const getStartedButton = page.locator('a.getStarted_Sjon');
      await expect(getStartedButton).toBeVisible();
      console.log('✅ Кнопка Get started найдена');
      
      // Кликаем по кнопке
      await getStartedButton.click();
      console.log('✅ Клик по кнопке Get started выполнен');
      
      // Дополнительное взаимодействие - клик по ссылке Docs
      const docsLink = page.locator('a.navbar__item').filter({ hasText: 'Docs' });
      await docsLink.click();
      console.log('✅ Клик по ссылке Docs выполнен');
      
      const heading = page.locator('h1');
      await expect(heading).toContainText('Playwright');
      console.log('✅ Заголовок проверен');
    });
  });

  // test('✅ Successful navigation test', async ({ page }) => {
  //   await test.step('Navigate to Playwright homepage', async () => {
  //     await page.goto('/');
  //     await expect(page).toHaveTitle(/Playwright/);
  //   });
    
  //   await test.step('Check main elements', async () => {
  //     const getStartedButton = page.locator('text=Get started');
  //     await expect(getStartedButton).toBeVisible();
      
  //     const heading = page.locator('h1');
  //     await expect(heading).toContainText('Playwright');
  //   });
  // });

  test('❌ Login timeout simulation', async ({ page }) => {
    await test.step('Navigate to page', async () => {
      await page.goto('/');
    });
    
    await test.step('Wait for non-existent login element', async () => {
      // Намеренная ошибка: ждем элемент который не существует
      await page.waitForSelector('#login-form', { timeout: 3000 });
    });
    
    await test.step('This step will not execute', async () => {
      await page.fill('#username', 'testuser');
      await page.fill('#password', 'testpass');
      await page.click('#login-button');
    });
  });

  test('❌ Wrong title assertion', async ({ page }) => {
    await test.step('Navigate to page', async () => {
      await page.goto('/');
    });
    
    await test.step('Check wrong title', async () => {
      // Намеренная ошибка: проверяем неправильный заголовок
      await expect(page).toHaveTitle('E-commerce Shop | Best Deals Online');
    });
  });

  test('❌ Missing checkout button', async ({ page }) => {
    await test.step('Navigate to page', async () => {
      await page.goto('/');
    });
    
    await test.step('Try to find product', async () => {
      // Ждем загрузки страницы
      await page.waitForLoadState('networkidle');
    });
    
    await test.step('Click non-existent checkout button', async () => {
      // Намеренная ошибка: кликаем на несуществующий элемент
      await page.click('#add-to-cart-btn', { timeout: 5000 });
    });
  });

  test('❌ API response timeout', async ({ page }) => {
    await test.step('Navigate to slow endpoint', async () => {
      // Намеренная ошибка: переходим на несуществующий домен
      await page.goto('https://very-slow-api-endpoint-12345.com/products', { 
        timeout: 4000 
      });
    });
    
    await test.step('This will not execute', async () => {
      await expect(page.locator('.product-list')).toBeVisible();
    });
  });

  test('❌ Form validation error', async ({ page }) => {
    await test.step('Navigate to page', async () => {
      await page.goto('/');
    });
    
    await test.step('Fill form with invalid data', async () => {
      // Пытаемся найти форму которой нет
      await page.fill('#email-input', 'invalid-email');
      await page.fill('#phone-input', '123');
      await page.click('#submit-form');
    });
    
    await test.step('Check validation', async () => {
      await expect(page.locator('.error-message')).toContainText('Please enter valid email');
    });
  });
}); 