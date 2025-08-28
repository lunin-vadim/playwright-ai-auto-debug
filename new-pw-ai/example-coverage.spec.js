// example-coverage.spec.js - Пример использования UI Test Coverage

import { test, expect } from './coverage-lib/fixture.js';

test.describe('🎯 UI Coverage Example', () => {
  test('✅ Тест с автоматическим отслеживанием покрытия', async ({ page }) => {
    // Переходим на страницу - автоматически анализируются все элементы
    await page.goto('https://playwright.dev/');
    
    // Каждое взаимодействие отслеживается автоматически
    await page.locator('text=Docs').click();
    await page.goBack();
    
    await page.locator('[aria-label="Search (Command+K)"]').click();
    await page.keyboard.press('Escape');
    
    console.log('✅ Покрытие элементов отслежено автоматически');
  });
  
  // После всех тестов будет создан объединенный отчет:
  // test-coverage-reports/index.html
});
