// DemoProject/tests/auto-coverage.spec.js

// Используем обычный импорт Playwright - НЕТ изменений!
import { test, expect } from '@playwright/test';

// Единственное изменение - используем нашу фикстуру вместо базовой
// const { test } = require('../lib/playwrightFixture');

test.describe('Автоматическое покрытие UI', () => {
  
  test('Обычный тест - покрытие отслеживается автоматически', async ({ page }) => {
    // Никаких изменений в коде теста!
    await page.goto('https://playwright.dev');
    
    // Все действия автоматически отслеживаются
    await page.click('text=Get started');
    
    // Ждем загрузки страницы документации
    await page.waitForSelector('h1');
    
    // Проверяем что попали на страницу документации
    await expect(page).toHaveURL(/.*docs.*/);
    await expect(page).toHaveTitle(/Playwright/);
  });

  test('Тест с формой - автоматическое отслеживание', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/login');
    
    // Все взаимодействия отслеживаются без дополнительного кода
    await page.fill('#username', 'tomsmith');
    await page.fill('#password', 'SuperSecretPassword!');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=You logged into a secure area!')).toBeVisible();
  });

  test('Тест с чекбоксами - автоматическое покрытие', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/checkboxes');
    
    // Автоматически отслеживаются все типы действий
    await page.check('input[type="checkbox"]:first-child');
    await page.uncheck('input[type="checkbox"]:last-child');
    
    await expect(page.locator('input[type="checkbox"]:first-child')).toBeChecked();
  });

  test('Тест с выпадающим списком', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/dropdown');
    
    // Автоматическое отслеживание select действий
    await page.selectOption('#dropdown', 'Option 1');
    
    await expect(page.locator('#dropdown')).toHaveValue('1');
  });

  test('Навигация между страницами', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com');
    
    // Автоматическое отслеживание навигации
    await page.click('text=A/B Testing');
    await page.goBack();
    await page.click('text=Add/Remove Elements');
    
    await expect(page).toHaveURL(/add_remove_elements/);
  });

}); 