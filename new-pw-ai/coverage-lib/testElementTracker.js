// new-pw-ai/src/main/lib/testElementTracker.js

import fs from 'fs';
import path from 'path';

/**
 * Система отслеживания элементов используемых в тестах
 * Анализирует какие селекторы используются и сопоставляет с реальными элементами страницы
 */
export class TestElementTracker {
  constructor(config = {}) {
    this.config = {
      outputDir: config.outputDir || 'test-coverage-reports',
      trackingEnabled: config.trackingEnabled ?? true,
      ...config
    };
    
    // Хранилище данных о покрытии
    this.testCoverageData = {
      tests: new Map(), // testName -> { pages: [], elements: [], selectors: [] }
      pages: new Map(), // pageUrl -> { elements: [], visitedBy: [] }
      globalStats: {
        totalTests: 0,
        totalPages: 0,
        totalElements: 0,
        coveredElements: 0,
        uncoveredElements: []
      }
    };
    
    // Список отслеживаемых методов Playwright
    this.trackedMethods = [
      'click', 'fill', 'type', 'check', 'uncheck', 'selectOption',
      'hover', 'focus', 'blur', 'dblclick', 'dragTo',
      'waitForSelector', 'locator', 'getByRole', 'getByText', 
      'getByLabel', 'getByTestId', 'getByPlaceholder'
    ];
  }

  /**
   * 🎯 Инициализация трекинга для теста
   */
  async startTestTracking(testName, page) {
    if (!this.config.trackingEnabled) return;
    
    console.log(`🔍 Начинаю отслеживание элементов для теста: ${testName}`);
    
    // Инициализируем данные теста
    this.testCoverageData.tests.set(testName, {
      pages: [],
      elements: [],
      selectors: [],
      interactions: [],
      startTime: Date.now()
    });
    
    // Подключаем перехватчики для отслеживания взаимодействий
    await this.attachPageTrackers(testName, page);
  }

  /**
   * 📡 Подключение трекеров к странице
   */
  async attachPageTrackers(testName, page) {
    const testData = this.testCoverageData.tests.get(testName);
    
    // Отслеживание будет происходить через перехват page.goto в fixture
    
    // Перехват методов локаторов
    const originalLocator = page.locator;
    page.locator = (selector, options) => {
      this.trackSelectorUsage(testName, selector, 'locator');
      return originalLocator.call(page, selector, options);
    };
    
    // Перехват методов getBy*
    const originalGetByRole = page.getByRole;
    page.getByRole = (role, options) => {
      this.trackSelectorUsage(testName, `role=${role}`, 'getByRole', options);
      return originalGetByRole.call(page, role, options);
    };
    
    const originalGetByText = page.getByText;
    page.getByText = (text, options) => {
      this.trackSelectorUsage(testName, `text=${text}`, 'getByText', options);
      return originalGetByText.call(page, text, options);
    };
  }

  /**
   * 🌐 Отслеживание посещения страницы
   */
  async trackPageVisit(testName, url, page) {
    try {
      console.log(`📄 Анализирую страницу: ${url} для теста: ${testName}`);
      
      // Ждем загрузки страницы
      await page.waitForLoadState('networkidle', { timeout: 5000 });
      
      // Получаем все элементы страницы
      const pageElements = await this.extractPageElements(page, url);
      
      // Сохраняем данные о странице
      if (!this.testCoverageData.pages.has(url)) {
        this.testCoverageData.pages.set(url, {
          elements: pageElements,
          visitedBy: [],
          lastAnalyzed: Date.now()
        });
      }
      
      // Добавляем тест к посетителям страницы
      const pageData = this.testCoverageData.pages.get(url);
      if (!pageData.visitedBy.includes(testName)) {
        pageData.visitedBy.push(testName);
      }
      
      // Добавляем страницу к тесту
      const testData = this.testCoverageData.tests.get(testName);
      if (!testData.pages.includes(url)) {
        testData.pages.push(url);
      }
      
    } catch (error) {
      console.warn(`⚠️ Ошибка анализа страницы ${url}:`, error.message);
    }
  }

  /**
   * 🔍 Извлечение всех элементов со страницы
   */
  async extractPageElements(page, url) {
    try {
      // Проверяем что это HTML страница
      const contentType = await page.evaluate(() => document.contentType || 'text/html');
      if (!contentType.includes('html')) {
        return [];
      }

      const elements = await page.evaluate(() => {
        const allElements = [];
        
        // Получаем все интерактивные элементы
        const interactiveSelectors = [
          'button', 'a', 'input', 'select', 'textarea', 
          '[role="button"]', '[role="link"]', '[role="textbox"]',
          '[onclick]', '[onsubmit]', '[tabindex]'
        ];
        
        interactiveSelectors.forEach(selector => {
          try {
            document.querySelectorAll(selector).forEach((element, index) => {
              // Фильтруем только видимые и значимые элементы
              if (element.offsetParent !== null || element.tagName === 'A') {
                const elementData = {
                  tagName: element.tagName.toLowerCase(),
                  type: element.type || 'unknown',
                  id: element.id || '',
                  className: element.className || '',
                  text: (element.textContent || element.innerText || '').trim().substring(0, 100),
                  href: element.href || '',
                  role: element.getAttribute('role') || '',
                  ariaLabel: element.getAttribute('aria-label') || '',
                  placeholder: element.getAttribute('placeholder') || '',
                  selector: selector,
                  xpath: '',
                  position: { x: element.offsetLeft || 0, y: element.offsetTop || 0 },
                  visible: element.offsetParent !== null,
                  index: index
                };
                
                // Добавляем только если есть текст или важные атрибуты
                if (elementData.text || elementData.id || elementData.ariaLabel || elementData.href) {
                  allElements.push(elementData);
                }
              }
            });
          } catch (err) {
            console.warn('Ошибка обработки селектора:', selector, err.message);
          }
        });
        
        return allElements;
      });
      
      console.log(`📊 Извлечено ${elements.length} элементов со страницы ${url}`);
      return elements;
    } catch (error) {
      console.warn(`⚠️ Ошибка извлечения элементов со страницы ${url}:`, error.message);
      return [];
    }
  }

  /**
   * 📝 Отслеживание использования селекторов
   */
  trackSelectorUsage(testName, selector, method, options = {}) {
    const testData = this.testCoverageData.tests.get(testName);
    if (!testData) return;
    
    const interaction = {
      selector,
      method,
      options,
      timestamp: Date.now()
    };
    
    testData.selectors.push(selector);
    testData.interactions.push(interaction);
    
    console.log(`🎯 Тест ${testName} использует: ${method}("${selector}")`);
  }

  /**
   * 📊 Анализ покрытия после завершения всех тестов
   */
  async analyzeCoverage() {
    console.log('📊 Анализирую покрытие элементов тестами...');
    
    const coverageReport = {
      summary: {
        totalTests: this.testCoverageData.tests.size,
        totalPages: this.testCoverageData.pages.size,
        totalElements: 0,
        coveredElements: 0,
        coveragePercentage: 0
      },
      pageAnalysis: [],
      testAnalysis: [],
      uncoveredElements: [],
      recommendations: []
    };
    
    // Анализ по страницам
    for (const [pageUrl, pageData] of this.testCoverageData.pages) {
      const pageAnalysis = await this.analyzePageCoverage(pageUrl, pageData);
      coverageReport.pageAnalysis.push(pageAnalysis);
      coverageReport.summary.totalElements += pageData.elements.length;
    }
    
    // Анализ по тестам
    for (const [testName, testData] of this.testCoverageData.tests) {
      const testAnalysis = this.analyzeTestCoverage(testName, testData);
      coverageReport.testAnalysis.push(testAnalysis);
    }
    
    // Поиск непокрытых элементов
    coverageReport.uncoveredElements = this.findUncoveredElements();
    
    // Расчет общего покрытия
    const totalElements = coverageReport.summary.totalElements;
    const coveredElements = this.calculateCoveredElements();
    coverageReport.summary.coveredElements = coveredElements;
    coverageReport.summary.coveragePercentage = totalElements > 0 
      ? Math.round((coveredElements / totalElements) * 100) 
      : 0;
    
    // Генерация рекомендаций
    coverageReport.recommendations = this.generateRecommendations(coverageReport);
    
    return coverageReport;
  }

  /**
   * 📄 Анализ покрытия конкретной страницы
   */
  async analyzePageCoverage(pageUrl, pageData) {
    const usedSelectors = new Set();
    
    // Собираем все селекторы используемые на этой странице
    for (const testName of pageData.visitedBy) {
      const testData = this.testCoverageData.tests.get(testName);
      if (testData) {
        testData.selectors.forEach(selector => usedSelectors.add(selector));
      }
    }
    
    // Сопоставляем элементы страницы с используемыми селекторами
    const coveredElements = [];
    const uncoveredElements = [];
    
    for (const element of pageData.elements) {
      const isCovered = this.isElementCovered(element, usedSelectors);
      
      if (isCovered.covered) {
        coveredElements.push({
          ...element,
          coveredBy: isCovered.matchedSelectors,
          usedInTests: pageData.visitedBy
        });
      } else {
        uncoveredElements.push(element);
      }
    }
    
    return {
      url: pageUrl,
      visitedBy: pageData.visitedBy,
      totalElements: pageData.elements.length,
      coveredElements: coveredElements.length,
      uncoveredElements: uncoveredElements.length,
      coveragePercentage: Math.round((coveredElements.length / pageData.elements.length) * 100),
      elementDetails: {
        covered: coveredElements,
        uncovered: uncoveredElements
      }
    };
  }

  /**
   * 🧪 Анализ покрытия конкретного теста
   */
  analyzeTestCoverage(testName, testData) {
    return {
      testName,
      pagesVisited: testData.pages.length,
      selectorsUsed: testData.selectors.length,
      uniqueSelectors: [...new Set(testData.selectors)].length,
      interactions: testData.interactions.length,
      duration: Date.now() - testData.startTime,
      pages: testData.pages,
      mostUsedSelectors: this.getMostUsedSelectors(testData.selectors)
    };
  }

  /**
   * 🔍 Проверка покрытия элемента селекторами
   */
  isElementCovered(element, usedSelectors) {
    const matchedSelectors = [];
    
    for (const selector of usedSelectors) {
      if (this.matchesSelector(element, selector)) {
        matchedSelectors.push(selector);
      }
    }
    
    return {
      covered: matchedSelectors.length > 0,
      matchedSelectors
    };
  }

  /**
   * 🎯 Проверка соответствия элемента селектору
   */
  matchesSelector(element, selector) {
    // Простое сопоставление по тексту
    if (selector.includes('text=') && element.text.includes(selector.replace('text=', ''))) {
      return true;
    }
    
    // Сопоставление по роли
    if (selector.includes('role=') && element.role === selector.replace('role=', '')) {
      return true;
    }
    
    // Сопоставление по ID
    if (selector.startsWith('#') && element.id === selector.substring(1)) {
      return true;
    }
    
    // Сопоставление по классу
    if (selector.startsWith('.') && element.className.includes(selector.substring(1))) {
      return true;
    }
    
    // Сопоставление по тегу
    if (element.tagName === selector.toLowerCase()) {
      return true;
    }
    
    return false;
  }

  /**
   * 🔍 Поиск непокрытых элементов
   */
  findUncoveredElements() {
    const uncovered = [];
    
    for (const [pageUrl, pageData] of this.testCoverageData.pages) {
      const usedSelectors = new Set();
      
      // Собираем все селекторы для этой страницы
      for (const testName of pageData.visitedBy) {
        const testData = this.testCoverageData.tests.get(testName);
        if (testData) {
          testData.selectors.forEach(selector => usedSelectors.add(selector));
        }
      }
      
      // Ищем непокрытые элементы
      for (const element of pageData.elements) {
        const coverage = this.isElementCovered(element, usedSelectors);
        if (!coverage.covered) {
          uncovered.push({
            ...element,
            pageUrl,
            suggestedSelectors: this.generateSuggestedSelectors(element),
            priority: this.calculateElementPriority(element)
          });
        }
      }
    }
    
    return uncovered.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 🎯 Генерация предлагаемых селекторов для элемента
   */
  generateSuggestedSelectors(element) {
    const selectors = [];
    
    if (element.id) {
      selectors.push(`#${element.id}`);
    }
    
    if (element.text && element.text.length < 50) {
      selectors.push(`text=${element.text}`);
    }
    
    if (element.role) {
      selectors.push(`[role="${element.role}"]`);
    }
    
    if (element.ariaLabel) {
      selectors.push(`[aria-label="${element.ariaLabel}"]`);
    }
    
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.length > 2);
      if (classes.length > 0) {
        selectors.push(`.${classes[0]}`);
      }
    }
    
    selectors.push(element.tagName);
    
    return selectors;
  }

  /**
   * ⭐ Расчет приоритета элемента
   */
  calculateElementPriority(element) {
    let priority = 1;
    
    // Высокий приоритет для интерактивных элементов
    if (['button', 'a', 'input'].includes(element.tagName)) {
      priority += 5;
    }
    
    // Высокий приоритет для элементов с текстом
    if (element.text && element.text.length > 0) {
      priority += 3;
    }
    
    // Высокий приоритет для видимых элементов
    if (element.visible) {
      priority += 2;
    }
    
    // Высокий приоритет для элементов с ID
    if (element.id) {
      priority += 2;
    }
    
    return priority;
  }

  /**
   * 📊 Расчет количества покрытых элементов
   */
  calculateCoveredElements() {
    let covered = 0;
    
    for (const [pageUrl, pageData] of this.testCoverageData.pages) {
      const usedSelectors = new Set();
      
      for (const testName of pageData.visitedBy) {
        const testData = this.testCoverageData.tests.get(testName);
        if (testData) {
          testData.selectors.forEach(selector => usedSelectors.add(selector));
        }
      }
      
      for (const element of pageData.elements) {
        if (this.isElementCovered(element, usedSelectors).covered) {
          covered++;
        }
      }
    }
    
    return covered;
  }

  /**
   * 📈 Получение самых используемых селекторов
   */
  getMostUsedSelectors(selectors) {
    const selectorCount = {};
    
    selectors.forEach(selector => {
      selectorCount[selector] = (selectorCount[selector] || 0) + 1;
    });
    
    return Object.entries(selectorCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([selector, count]) => ({ selector, count }));
  }

  /**
   * 💡 Генерация рекомендаций
   */
  generateRecommendations(coverageReport) {
    const recommendations = [];
    
    // Рекомендации по покрытию
    if (coverageReport.summary.coveragePercentage < 50) {
      recommendations.push({
        type: 'coverage',
        priority: 'high',
        message: `🔴 Низкое покрытие элементов (${coverageReport.summary.coveragePercentage}%) - добавьте тесты для важных элементов`
      });
    }
    
    // Рекомендации по непокрытым элементам
    const highPriorityUncovered = coverageReport.uncoveredElements.filter(el => el.priority > 5);
    if (highPriorityUncovered.length > 0) {
      recommendations.push({
        type: 'elements',
        priority: 'high',
        message: `🎯 Найдено ${highPriorityUncovered.length} важных непокрытых элементов`
      });
    }
    
    // Рекомендации по конкретным тестам
    const testsWithLowCoverage = coverageReport.testAnalysis.filter(test => test.selectorsUsed < 3);
    if (testsWithLowCoverage.length > 0) {
      recommendations.push({
        type: 'tests',
        priority: 'medium',
        message: `📝 ${testsWithLowCoverage.length} тестов используют мало селекторов - расширьте проверки`
      });
    }
    
    return recommendations;
  }

  /**
   * 💾 Сохранение отчета покрытия
   */
  async saveCoverageReport(coverageReport) {
    const timestamp = Date.now();
    const reportDir = this.config.outputDir;
    
    // Создаем директорию если не существует
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    // Сохраняем JSON отчет
    const jsonPath = path.join(reportDir, `test-coverage-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(coverageReport, null, 2));
    
    // Генерируем и сохраняем HTML отчет
    const htmlReport = this.generateHTMLReport(coverageReport);
    const htmlPath = path.join(reportDir, `test-coverage-${timestamp}.html`);
    fs.writeFileSync(htmlPath, htmlReport);
    
    // Генерируем и сохраняем Markdown отчет
    const mdReport = this.generateMarkdownReport(coverageReport);
    const mdPath = path.join(reportDir, `test-coverage-${timestamp}.md`);
    fs.writeFileSync(mdPath, mdReport);
    
    console.log(`📊 Отчеты покрытия сохранены:`);
    console.log(`   📝 JSON: ${jsonPath}`);
    console.log(`   🌐 HTML: ${htmlPath}`);
    console.log(`   📄 MD: ${mdPath}`);
    
    return { jsonPath, htmlPath, mdPath };
  }

  /**
   * 🌐 Генерация HTML отчета
   */
  generateHTMLReport(coverageReport) {
    return `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Coverage Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1400px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-card.success { background: linear-gradient(135deg, #4caf50 0%, #8bc34a 100%); }
        .stat-card.warning { background: linear-gradient(135deg, #ff9800 0%, #ffc107 100%); }
        .stat-card.danger { background: linear-gradient(135deg, #f44336 0%, #e91e63 100%); }
        .stat-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .stat-label { opacity: 0.9; }
        .section { margin: 30px 0; }
        .section-title { font-size: 1.5em; margin-bottom: 15px; border-bottom: 2px solid #eee; padding-bottom: 5px; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
        .table th { background: #f5f5f5; font-weight: bold; }
        .covered { background: #e8f5e8; }
        .uncovered { background: #ffebee; }
        .high-priority { border-left: 4px solid #f44336; }
        .tabs { display: flex; border-bottom: 2px solid #eee; margin-bottom: 20px; }
        .tab { padding: 10px 20px; cursor: pointer; border-bottom: 2px solid transparent; }
        .tab.active { border-bottom-color: #667eea; color: #667eea; font-weight: bold; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .progress-bar { width: 100%; height: 20px; background: #eee; border-radius: 10px; overflow: hidden; margin: 10px 0; }
        .progress-fill { height: 100%; transition: width 0.3s; }
        .progress-high { background: linear-gradient(90deg, #4caf50, #8bc34a); }
        .progress-medium { background: linear-gradient(90deg, #ff9800, #ffc107); }
        .progress-low { background: linear-gradient(90deg, #f44336, #e91e63); }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Test Coverage Report</h1>
            <p><strong>Дата анализа:</strong> ${new Date().toLocaleString('ru')}</p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card ${coverageReport.summary.coveragePercentage > 70 ? 'success' : coverageReport.summary.coveragePercentage > 40 ? 'warning' : 'danger'}">
                <div class="stat-value">${coverageReport.summary.coveragePercentage}%</div>
                <div class="stat-label">Покрытие элементов</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${coverageReport.summary.totalTests}</div>
                <div class="stat-label">Всего тестов</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${coverageReport.summary.totalPages}</div>
                <div class="stat-label">Страниц</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${coverageReport.summary.totalElements}</div>
                <div class="stat-label">Всего элементов</div>
            </div>
        </div>

        <div class="tabs">
            <div class="tab active" onclick="showTab('summary')">Сводка</div>
            <div class="tab" onclick="showTab('pages')">По страницам</div>
            <div class="tab" onclick="showTab('tests')">По тестам</div>
            <div class="tab" onclick="showTab('uncovered')">Непокрытые</div>
        </div>

        <div id="summary" class="tab-content active">
            <div class="section">
                <h2 class="section-title">📊 Общая статистика</h2>
                <p><strong>Покрыто элементов:</strong> ${coverageReport.summary.coveredElements} из ${coverageReport.summary.totalElements}</p>
                <div class="progress-bar">
                    <div class="progress-fill ${coverageReport.summary.coveragePercentage > 70 ? 'progress-high' : coverageReport.summary.coveragePercentage > 40 ? 'progress-medium' : 'progress-low'}" style="width: ${coverageReport.summary.coveragePercentage}%"></div>
                </div>
            </div>
        </div>

        <div id="pages" class="tab-content">
            <div class="section">
                <h2 class="section-title">🌐 Анализ по страницам</h2>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Страница</th>
                            <th>Тестов</th>
                            <th>Элементов</th>
                            <th>Покрыто</th>
                            <th>Покрытие</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${coverageReport.pageAnalysis.map(page => `
                            <tr>
                                <td>${page.url}</td>
                                <td>${page.visitedBy.length}</td>
                                <td>${page.totalElements}</td>
                                <td>${page.coveredElements}</td>
                                <td>
                                    <div class="progress-bar">
                                        <div class="progress-fill ${page.coveragePercentage > 70 ? 'progress-high' : page.coveragePercentage > 40 ? 'progress-medium' : 'progress-low'}" style="width: ${page.coveragePercentage}%"></div>
                                    </div>
                                    ${page.coveragePercentage}%
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <div id="tests" class="tab-content">
            <div class="section">
                <h2 class="section-title">🧪 Анализ по тестам</h2>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Тест</th>
                            <th>Страниц</th>
                            <th>Селекторов</th>
                            <th>Взаимодействий</th>
                            <th>Время (мс)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${coverageReport.testAnalysis.map(test => `
                            <tr>
                                <td>${test.testName}</td>
                                <td>${test.pagesVisited}</td>
                                <td>${test.uniqueSelectors}</td>
                                <td>${test.interactions}</td>
                                <td>${test.duration}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <div id="uncovered" class="tab-content">
            <div class="section">
                <h2 class="section-title">🎯 Непокрытые элементы</h2>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Элемент</th>
                            <th>Тип</th>
                            <th>Страница</th>
                            <th>Предлагаемые селекторы</th>
                            <th>Приоритет</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${coverageReport.uncoveredElements.slice(0, 20).map(element => `
                            <tr class="${element.priority > 5 ? 'high-priority' : ''}">
                                <td>${element.text || element.tagName}</td>
                                <td>${element.tagName}</td>
                                <td>${element.pageUrl}</td>
                                <td><code>${element.suggestedSelectors.slice(0, 2).join(', ')}</code></td>
                                <td>${element.priority}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <script>
        function showTab(tabName) {
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            document.getElementById(tabName).classList.add('active');
            event.target.classList.add('active');
        }
    </script>
</body>
</html>`;
  }

  /**
   * 📄 Генерация Markdown отчета
   */
  generateMarkdownReport(coverageReport) {
    return `# 🎯 Test Coverage Report

## 📊 Сводка

- **Всего тестов:** ${coverageReport.summary.totalTests}
- **Страниц проанализировано:** ${coverageReport.summary.totalPages}
- **Всего элементов:** ${coverageReport.summary.totalElements}
- **Покрыто элементов:** ${coverageReport.summary.coveredElements}
- **Покрытие:** ${coverageReport.summary.coveragePercentage}%
- **Дата анализа:** ${new Date().toLocaleString('ru')}

## 🌐 Анализ по страницам

${coverageReport.pageAnalysis.map(page => `
### ${page.url}
- **Посещено тестами:** ${page.visitedBy.join(', ')}
- **Элементов:** ${page.totalElements}
- **Покрыто:** ${page.coveredElements}
- **Покрытие:** ${page.coveragePercentage}%
`).join('\n')}

## 🧪 Анализ по тестам

${coverageReport.testAnalysis.map(test => `
### ${test.testName}
- **Страниц:** ${test.pagesVisited}
- **Селекторов:** ${test.uniqueSelectors}
- **Взаимодействий:** ${test.interactions}
- **Время выполнения:** ${test.duration}ms
`).join('\n')}

## 🎯 Топ-10 непокрытых элементов

${coverageReport.uncoveredElements.slice(0, 10).map((element, index) => `
${index + 1}. **${element.text || element.tagName}** (${element.tagName})
   - Страница: ${element.pageUrl}
   - Приоритет: ${element.priority}
   - Предлагаемые селекторы: \`${element.suggestedSelectors.slice(0, 3).join('`, `')}\`
`).join('\n')}

## 💡 Рекомендации

${coverageReport.recommendations.map(rec => `- ${rec.message}`).join('\n')}

---
*Отчет создан автоматически с помощью TestElementTracker*
`;
  }

  /**
   * 🔄 Завершение отслеживания теста
   */
  async finishTestTracking(testName) {
    const testData = this.testCoverageData.tests.get(testName);
    if (testData) {
      testData.endTime = Date.now();
      console.log(`✅ Завершено отслеживание теста: ${testName}`);
    }
  }

  /**
   * 📈 Получение статистики покрытия
   */
  getCoverageStats() {
    return {
      tests: this.testCoverageData.tests.size,
      pages: this.testCoverageData.pages.size,
      totalElements: Array.from(this.testCoverageData.pages.values())
        .reduce((sum, page) => sum + page.elements.length, 0)
    };
  }
}
