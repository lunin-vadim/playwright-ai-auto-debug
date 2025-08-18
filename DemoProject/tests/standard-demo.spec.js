// DemoProject/tests/standard-demo.spec.js

// ЭТО ОБЫЧНЫЙ СТАНДАРТНЫЙ PLAYWRIGHT ТЕСТ
// Единственное изменение: импорт test из нашей фикстуры вместо @playwright/test

import { test } from '../lib/simpleFixture.js';
import { expect } from '@playwright/test';

test.describe('Стандартные Playwright тесты с автоматическим покрытием', () => {
  
  test('Простой тест - заход на сайт и клик', async ({ page }) => {
    // Никаких специальных вызовов для покрытия!
    // Просто пишем обычный Playwright тест
    
    await page.goto('https://the-internet.herokuapp.com');
    await page.click('text=A/B Testing');
    
    await expect(page).toHaveURL(/abtest/);
    await expect(page.locator('h3')).toContainText('A/B Test');
  });

  test('Работа с формой', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/login');
    
    // Все эти действия автоматически попадают в отчет покрытия:
    await page.fill('#username', 'tomsmith');
    await page.fill('#password', 'SuperSecretPassword!');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.flash.success')).toBeVisible();
  });

  test('Работа с элементами', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/checkboxes');
    
    // Чекбоксы
    await page.check('input[type="checkbox"]:first-child');
    await page.uncheck('input[type="checkbox"]:last-child');
    
    // Переход на другую страницу
    await page.goto('https://the-internet.herokuapp.com/dropdown');
    await page.selectOption('#dropdown', 'Option 1');
    
    await expect(page.locator('#dropdown')).toHaveValue('1');
  });

}); 