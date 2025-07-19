// DemoProject/tests/simple-auto-coverage.spec.js

// ВАРИАНТ 1: Стандартный Playwright тест БЕЗ покрытия
// import { test, expect } from '@playwright/test';

// ВАРИАНТ 2: Тот же тест НО с автоматическим покрытием - одна строка изменений!
import { test } from '../lib/simpleFixture.js';
import { expect } from '@playwright/test';

test.describe('Демонстрация автоматического покрытия', () => {
  
  test('Стандартный тест Playwright - покрытие отслеживается автоматически', async ({ page }) => {
    // Обычный код теста - НИКАКИХ изменений!
    
    await page.goto('https://playwright.dev');
    
    // Все эти действия автоматически отслеживаются:
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

  test('Тест с чекбоксами', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/checkboxes');
    
    // Автоматически отслеживаются все типы действий
    await page.check('input[type="checkbox"]:first-child');
    await page.uncheck('input[type="checkbox"]:last-child');
    
    await expect(page.locator('input[type="checkbox"]:first-child')).toBeChecked();
  });

}); 