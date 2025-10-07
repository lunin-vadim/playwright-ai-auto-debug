import { test, expect } from '../../coverage-lib/fixture.js';

test.describe.only('🎯 AI Debug Integration Demo', () => {
  
  test('✅ Successful navigation test', async ({ page }) => {
    await test.step('Navigate to Playwright homepage', async () => {
      await page.goto('/');
      await expect(page).toHaveTitle(/Playwright/);
    });
    
    await test.step('Check main elements', async () => {
      const getStartedButton = page.locator('text=Get started');
      await expect(getStartedButton).toBeVisible();
      
      const heading = page.locator('h1');
      await expect(heading).toContainText('Playwright');
    });
  });

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

  test('✅ Successful documentation search', async ({ page }) => {
    await test.step('Navigate to Playwright docs', async () => {
      await page.goto('https://playwright.dev/docs/intro');
      await expect(page).toHaveTitle(/Playwright/);
    });
    
    await test.step('Search for test info', async () => {
      const searchButton = page.locator('[aria-label="Search"]').first();
      if (await searchButton.isVisible()) {
        await searchButton.click();
        await page.fill('input[placeholder*="Search"]', 'test');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
      }
    });
    
    await test.step('Verify search results', async () => {
      // Проверяем что страница загрузилась успешно
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test('❌ Network error simulation', async ({ page }) => {
    await test.step('Block network requests', async () => {
      // Блокируем все сетевые запросы
      await page.route('**/*', route => route.abort());
      
      // Пытаемся загрузить страницу
      await page.goto('https://playwright.dev/', { timeout: 5000 });
    });
  });

  test('✅ Basic element interactions', async ({ page }) => {
    await test.step('Navigate to Playwright homepage', async () => {
      await page.goto('https://playwright.dev/');
      await expect(page).toHaveTitle(/Playwright/);
    });
    
    await test.step('Interact with navigation', async () => {
      const docsLink = page.locator('a[href="/docs/intro"]').first();
      if (await docsLink.isVisible()) {
        await docsLink.click();
        await page.waitForLoadState('networkidle');
      }
    });
    
    await test.step('Verify navigation success', async () => {
      await expect(page.url()).toContain('/docs');
    });
  });

  test('❌ JavaScript console errors', async ({ page }) => {
    const consoleErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await test.step('Navigate and trigger JS error', async () => {
      await page.goto('/');
      
      // Намеренно вызываем JS ошибку
      await page.evaluate(() => {
        throw new Error('Simulated JavaScript error for testing');
      });
    });
    
    await test.step('Check for console errors', async () => {
      // Ждем немного для обработки ошибок
      await page.waitForTimeout(1000);
      expect(consoleErrors.length).toBeGreaterThan(0);
    });
  });

  test('❌ Mobile viewport issues', async ({ page }) => {
    await test.step('Set mobile viewport', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
    });
    
    await test.step('Check mobile-specific element', async () => {
      // Ищем элемент который должен быть только на мобильной версии
      await expect(page.locator('.mobile-menu-toggle')).toBeVisible({ timeout: 3000 });
    });
  });

  test('✅ Cookie and local storage operations', async ({ page }) => {
    await test.step('Navigate and set storage', async () => {
      await page.goto('/');
      
      // Устанавливаем данные в localStorage
      await page.evaluate(() => {
        localStorage.setItem('testKey', 'testValue');
        document.cookie = 'testCookie=testValue; path=/';
      });
    });
    
    await test.step('Verify storage data', async () => {
      const localStorageValue = await page.evaluate(() => localStorage.getItem('testKey'));
      expect(localStorageValue).toBe('testValue');
      
      const cookies = await page.context().cookies();
      const testCookie = cookies.find(c => c.name === 'testCookie');
      expect(testCookie?.value).toBe('testValue');
    });
  });

  test('❌ File upload failure', async ({ page }) => {
    await test.step('Navigate to page', async () => {
      await page.goto('/');
    });
    
    await test.step('Try to upload file', async () => {
      // Пытаемся найти input для загрузки файла
      const fileInput = page.locator('input[type="file"]');
      await expect(fileInput).toBeVisible({ timeout: 3000 });
      
      // Пытаемся загрузить файл
      await fileInput.setInputFiles('nonexistent-file.txt');
    });
  });

  test('❌ Drag and drop failure', async ({ page }) => {
    await test.step('Navigate to page', async () => {
      await page.goto('/');
    });
    
    await test.step('Attempt drag and drop', async () => {
      // Пытаемся найти элементы для drag & drop
      const source = page.locator('.draggable-item');
      const target = page.locator('.drop-zone');
      
      await expect(source).toBeVisible({ timeout: 3000 });
      await expect(target).toBeVisible({ timeout: 3000 });
      
      await source.dragTo(target);
    });
  });

  test('✅ Screenshot and visual comparison', async ({ page }) => {
    await test.step('Navigate and take screenshot', async () => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Делаем скриншот для визуального сравнения
      await expect(page).toHaveScreenshot('homepage.png', { 
        fullPage: true,
        threshold: 0.3 
      });
    });
  });

  test('❌ Database connection simulation', async ({ page }) => {
    await test.step('Navigate to page', async () => {
      await page.goto('/');
    });
    
    await test.step('Simulate API call failure', async () => {
      // Перехватываем API запросы и возвращаем ошибку
      await page.route('**/api/**', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Database connection failed' })
        });
      });
      
      // Пытаемся загрузить данные
      await page.click('#load-data-btn');
      await expect(page.locator('.error-notification')).toBeVisible({ timeout: 5000 });
    });
  });

  test('✅ Multi-step user journey', async ({ page }) => {
    await test.step('Start user journey', async () => {
      await page.goto('/');
      await expect(page).toHaveTitle(/Playwright/);
    });
    
    await test.step('Navigate through sections', async () => {
      // Переходим по различным секциям сайта
      const sections = ['docs', 'community', 'blog'];
      
      for (const section of sections) {
        const link = page.locator(`a[href*="${section}"]`).first();
        if (await link.isVisible()) {
          await link.click();
          await page.waitForLoadState('networkidle');
          await page.goBack();
          await page.waitForLoadState('networkidle');
        }
      }
    });
    
    await test.step('Verify final state', async () => {
      await expect(page.url()).toContain('playwright.dev');
    });
  });

  test('❌ Memory leak simulation', async ({ page }) => {
    await test.step('Create memory-intensive operations', async () => {
      await page.goto('/');
      
      // Создаем множество DOM элементов для симуляции утечки памяти
      await page.evaluate(() => {
        for (let i = 0; i < 10000; i++) {
          const div = document.createElement('div');
          div.innerHTML = `<span>Memory test element ${i}</span>`;
          document.body.appendChild(div);
        }
      });
    });
    
    await test.step('Try to interact with overloaded page', async () => {
      // Пытаемся найти элемент в перегруженной странице
      await expect(page.locator('#performance-critical-element')).toBeVisible({ timeout: 2000 });
    });
  });

  test('✅ Accessibility testing', async ({ page }) => {
    await test.step('Navigate and check accessibility', async () => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
    });
    
    await test.step('Check keyboard navigation', async () => {
      // Проверяем навигацию с клавиатуры
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['A', 'BUTTON', 'INPUT'].includes(focusedElement)).toBeTruthy();
    });
    
    await test.step('Check ARIA attributes', async () => {
      const mainContent = page.locator('[role="main"], main').first();
      await expect(mainContent).toBeVisible();
    });
  });

  test('❌ Infinite scroll timeout', async ({ page }) => {
    await test.step('Navigate to page', async () => {
      await page.goto('/');
    });
    
    await test.step('Try infinite scroll', async () => {
      // Пытаемся скроллить до элемента который никогда не появится
      let scrollAttempts = 0;
      const maxAttempts = 10;
      
      while (scrollAttempts < maxAttempts) {
        await page.evaluate(() => window.scrollBy(0, 1000));
        await page.waitForTimeout(500);
        
        const targetElement = page.locator('.infinite-scroll-end-marker');
        if (await targetElement.isVisible()) {
          break;
        }
        scrollAttempts++;
      }
      
      // Ожидаем элемент который не появится
      await expect(page.locator('.infinite-scroll-end-marker')).toBeVisible({ timeout: 3000 });
    });
  });

  test('✅ Performance monitoring', async ({ page }) => {
    await test.step('Monitor page performance', async () => {
      await page.goto('/');
      
      // Измеряем производительность загрузки
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        return {
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart
        };
      });
      
      // Проверяем что страница загрузилась достаточно быстро
      expect(performanceMetrics.loadTime).toBeLessThan(10000); // 10 секунд
    });
  });

  test('❌ Cross-origin iframe issues', async ({ page }) => {
    await test.step('Navigate to page', async () => {
      await page.goto('/');
    });
    
    await test.step('Try to interact with iframe', async () => {
      // Создаем iframe с cross-origin контентом
      await page.evaluate(() => {
        const iframe = document.createElement('iframe');
        iframe.src = 'https://example.com';
        iframe.id = 'test-iframe';
        document.body.appendChild(iframe);
      });
      
      await page.waitForTimeout(2000);
      
      // Пытаемся получить доступ к содержимому iframe
      const iframe = page.frameLocator('#test-iframe');
      await expect(iframe.locator('body')).toContainText('Example Domain', { timeout: 3000 });
    });
  });

  test('✅ Multi-tab operations', async ({ browser }) => {
    const context = await browser.newContext();
    
    await test.step('Open multiple tabs', async () => {
      const page1 = await context.newPage();
      const page2 = await context.newPage();
      
      await page1.goto('/');
      await page2.goto('https://playwright.dev/docs');
      
      await expect(page1).toHaveTitle(/Playwright/);
      await expect(page2).toHaveTitle(/Playwright/);
      
      await page1.close();
      await page2.close();
    });
    
    await context.close();
  });

  test('❌ WebSocket connection failure', async ({ page }) => {
    await test.step('Navigate to page', async () => {
      await page.goto('/');
    });
    
    await test.step('Try WebSocket connection', async () => {
      // Пытаемся установить WebSocket соединение
      await page.evaluate(() => {
        const ws = new WebSocket('wss://nonexistent-websocket-server.com/socket');
        
        ws.onopen = () => {
          window.wsConnected = true;
        };
        
        ws.onerror = () => {
          window.wsError = true;
        };
      });
      
      await page.waitForTimeout(3000);
      
      // Проверяем что соединение установлено (не установится)
      const wsConnected = await page.evaluate(() => window.wsConnected);
      expect(wsConnected).toBe(true);
    });
  });

  test('❌ Geolocation permission denied', async ({ page }) => {
    await test.step('Navigate to page', async () => {
      await page.goto('/');
    });
    
    await test.step('Request geolocation', async () => {
      // Запрашиваем геолокацию
      await page.evaluate(() => {
        navigator.geolocation.getCurrentPosition(
          position => {
            window.locationReceived = true;
            window.userLocation = position;
          },
          error => {
            window.locationError = error.message;
          }
        );
      });
      
      await page.waitForTimeout(2000);
      
      // Ожидаем успешного получения локации
      const locationReceived = await page.evaluate(() => window.locationReceived);
      expect(locationReceived).toBe(true);
    });
  });

  test('✅ Local storage persistence', async ({ page }) => {
    await test.step('Set data in first session', async () => {
      await page.goto('/');
      
      await page.evaluate(() => {
        localStorage.setItem('userPreferences', JSON.stringify({
          theme: 'dark',
          language: 'en',
          notifications: true
        }));
        
        sessionStorage.setItem('currentSession', 'session123');
      });
    });
    
    await test.step('Reload and verify persistence', async () => {
      await page.reload();
      
      const preferences = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('userPreferences') || '{}');
      });
      
      expect(preferences.theme).toBe('dark');
      expect(preferences.language).toBe('en');
      
      // sessionStorage должно сохраниться при перезагрузке
      const session = await page.evaluate(() => sessionStorage.getItem('currentSession'));
      expect(session).toBe('session123');
    });
  });

  test('❌ PDF download timeout', async ({ page }) => {
    await test.step('Navigate to page', async () => {
      await page.goto('/');
    });
    
    await test.step('Try to download PDF', async () => {
      // Ждем начала загрузки PDF файла
      const downloadPromise = page.waitForDownload({ timeout: 3000 });
      
      // Кликаем на несуществующую ссылку для загрузки
      await page.click('#download-pdf-btn');
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('.pdf');
    });
  });

  test('✅ Form submission success', async ({ page }) => {
    await test.step('Navigate to page', async () => {
      await page.goto('/');
    });
    
    await test.step('Create and fill form', async () => {
      // Создаем простую форму для тестирования
      await page.evaluate(() => {
        const form = document.createElement('form');
        form.innerHTML = `
          <input type="text" id="test-name" placeholder="Name" />
          <input type="email" id="test-email" placeholder="Email" />
          <button type="submit" id="test-submit">Submit</button>
        `;
        document.body.appendChild(form);
      });
      
      await page.fill('#test-name', 'Test User');
      await page.fill('#test-email', 'test@example.com');
    });
    
    await test.step('Submit form', async () => {
      await page.click('#test-submit');
      
      // Проверяем что форма была отправлена (элементы существуют)
      const nameValue = await page.inputValue('#test-name');
      const emailValue = await page.inputValue('#test-email');
      
      expect(nameValue).toBe('Test User');
      expect(emailValue).toBe('test@example.com');
    });
  });

  test('❌ CSS animation timing issues', async ({ page }) => {
    await test.step('Navigate to page', async () => {
      await page.goto('/');
    });
    
    await test.step('Create animated element', async () => {
      await page.evaluate(() => {
        const div = document.createElement('div');
        div.id = 'animated-element';
        div.style.cssText = `
          width: 100px;
          height: 100px;
          background: red;
          transition: all 5s ease;
          transform: translateX(0px);
        `;
        document.body.appendChild(div);
        
        // Запускаем анимацию
        setTimeout(() => {
          div.style.transform = 'translateX(500px)';
        }, 100);
      });
    });
    
    await test.step('Wait for animation completion', async () => {
      // Ожидаем завершения анимации слишком рано
      await page.waitForTimeout(1000); // Анимация длится 5 секунд
      
      const element = page.locator('#animated-element');
      await expect(element).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 500, 0)');
    });
  });

  test('✅ Responsive design verification', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const viewport of viewports) {
      await test.step(`Test ${viewport.name} viewport`, async () => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/');
        
        // Проверяем что основные элементы видны на всех разрешениях
        await expect(page.locator('body')).toBeVisible();
        
        // Делаем скриншот для каждого разрешения
        await page.screenshot({ 
          path: `test-results/${viewport.name.toLowerCase()}-viewport.png`,
          fullPage: true 
        });
      });
    }
  });

  test('❌ Service Worker registration failure', async ({ page }) => {
    await test.step('Navigate to page', async () => {
      await page.goto('/');
    });
    
    await test.step('Try to register Service Worker', async () => {
      await page.evaluate(() => {
        // Пытаемся зарегистрировать несуществующий Service Worker
        navigator.serviceWorker.register('/nonexistent-sw.js')
          .then(registration => {
            window.swRegistered = true;
          })
          .catch(error => {
            window.swError = error.message;
          });
      });
      
      await page.waitForTimeout(3000);
      
      // Ожидаем успешной регистрации
      const swRegistered = await page.evaluate(() => window.swRegistered);
      expect(swRegistered).toBe(true);
    });
  });

  test('✅ Dynamic content loading', async ({ page }) => {
    await test.step('Navigate and create dynamic content', async () => {
      await page.goto('/');
      
      // Создаем динамический контент
      await page.evaluate(() => {
        const container = document.createElement('div');
        container.id = 'dynamic-container';
        document.body.appendChild(container);
        
        // Имитируем загрузку контента с задержкой
        setTimeout(() => {
          container.innerHTML = '<h2>Dynamically loaded content</h2>';
        }, 1000);
      });
    });
    
    await test.step('Wait for dynamic content', async () => {
      await expect(page.locator('#dynamic-container h2')).toContainText('Dynamically loaded content');
    });
  });
}); 