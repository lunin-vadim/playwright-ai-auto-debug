// new-pw-ai/src/main/lib/globalCoverageTracker.js

import fs from 'fs';
import path from 'path';

/**
 * Глобальный трекер покрытия для объединения данных всех тестов
 */
export class GlobalCoverageTracker {
  constructor(config = {}) {
    this.config = {
      outputDir: config.outputDir || 'test-coverage-reports',
      trackingEnabled: config.trackingEnabled ?? true,
      ...config
    };
    
    // Глобальное хранилище данных покрытия
    this.globalData = {
      tests: new Map(), // testName -> testData
      pages: new Map(), // pageUrl -> pageData  
      selectors: new Map(), // selector -> usage info
      sessions: [], // история запусков
      startTime: Date.now()
    };
    
    this.currentSession = {
      id: `session-${Date.now()}`,
      startTime: Date.now(),
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0
    };
  }

  /**
   * 🎯 Добавление данных теста в глобальную статистику
   */
  addTestData(testName, testData) {
    // Добавляем или обновляем данные теста
    if (this.globalData.tests.has(testName)) {
      const existing = this.globalData.tests.get(testName);
      // Объединяем данные если тест запускался несколько раз
      existing.runs = existing.runs || [];
      existing.runs.push(testData);
      existing.lastRun = testData;
    } else {
      this.globalData.tests.set(testName, {
        ...testData,
        runs: [testData],
        firstRun: testData,
        lastRun: testData
      });
    }

    // Добавляем в текущую сессию
    this.currentSession.tests.push({
      name: testName,
      ...testData
    });
    this.currentSession.totalTests++;
  }

  /**
   * 📄 Добавление данных страницы
   */
  addPageData(pageUrl, pageData, testName) {
    if (!this.globalData.pages.has(pageUrl)) {
      this.globalData.pages.set(pageUrl, {
        elements: pageData.elements,
        visitedBy: [],
        firstVisited: Date.now(),
        lastAnalyzed: Date.now(),
        totalVisits: 0
      });
    }

    const existing = this.globalData.pages.get(pageUrl);
    if (!existing.visitedBy.includes(testName)) {
      existing.visitedBy.push(testName);
    }
    existing.totalVisits++;
    existing.lastAnalyzed = Date.now();
    
    // Обновляем элементы если они изменились
    if (pageData.elements.length > existing.elements.length) {
      existing.elements = pageData.elements;
    }
  }

  /**
   * 🎯 Добавление информации о селекторе
   */
  addSelectorUsage(testName, selector, method, options = {}) {
    const key = `${selector}::${method}`;
    
    if (!this.globalData.selectors.has(key)) {
      this.globalData.selectors.set(key, {
        selector,
        method,
        usedBy: [],
        totalUsage: 0,
        firstUsed: Date.now()
      });
    }

    const existing = this.globalData.selectors.get(key);
    if (!existing.usedBy.includes(testName)) {
      existing.usedBy.push(testName);
    }
    existing.totalUsage++;
    existing.lastUsed = Date.now();
  }

  /**
   * 📊 Генерация объединенного отчета
   */
  generateUnifiedReport() {
    console.log('📊 Генерирую объединенный отчет покрытия...');

    // Завершаем текущую сессию
    this.currentSession.endTime = Date.now();
    this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;
    this.globalData.sessions.push(this.currentSession);

    const report = {
      metadata: {
        generatedAt: new Date().toISOString(),
        sessionId: this.currentSession.id,
        totalSessions: this.globalData.sessions.length
      },
      summary: this.calculateGlobalSummary(),
      currentSession: this.currentSession,
      pageAnalysis: this.generatePageAnalysis(),
      testAnalysis: this.generateTestAnalysis(),
      selectorAnalysis: this.generateSelectorAnalysis(),
      uncoveredElements: this.findGlobalUncoveredElements(),
      recommendations: this.generateGlobalRecommendations(),
      drillDown: this.generateDrillDownData()
    };

    return report;
  }

  /**
   * 📈 Расчет глобальной статистики
   */
  calculateGlobalSummary() {
    const totalTests = this.globalData.tests.size;
    const totalPages = this.globalData.pages.size;
    
    let totalElements = 0;
    let coveredElements = 0;
    
    // Подсчет элементов и покрытия
    for (const [pageUrl, pageData] of this.globalData.pages) {
      totalElements += pageData.elements.length;
      
      // Подсчет покрытых элементов для этой страницы
      const usedSelectors = this.getSelectorsForPage(pageUrl);
      for (const element of pageData.elements) {
        if (this.isElementCovered(element, usedSelectors)) {
          coveredElements++;
        }
      }
    }

    const coveragePercentage = totalElements > 0 
      ? Math.round((coveredElements / totalElements) * 100) 
      : 0;

    return {
      totalTests,
      totalPages,
      totalElements,
      coveredElements,
      uncoveredElements: totalElements - coveredElements,
      coveragePercentage,
      totalSelectors: this.globalData.selectors.size,
      sessionDuration: Date.now() - this.globalData.startTime
    };
  }

  /**
   * 🌐 Анализ по страницам
   */
  generatePageAnalysis() {
    const pageAnalysis = [];

    for (const [pageUrl, pageData] of this.globalData.pages) {
      const usedSelectors = this.getSelectorsForPage(pageUrl);
      const coveredCount = pageData.elements.filter(el => 
        this.isElementCovered(el, usedSelectors)
      ).length;

      pageAnalysis.push({
        url: pageUrl,
        totalElements: pageData.elements.length,
        coveredElements: coveredCount,
        uncoveredElements: pageData.elements.length - coveredCount,
        coveragePercentage: Math.round((coveredCount / pageData.elements.length) * 100),
        visitedBy: pageData.visitedBy,
        totalVisits: pageData.totalVisits,
        elements: pageData.elements.map(el => ({
          ...el,
          covered: this.isElementCovered(el, usedSelectors),
          usedInTests: this.getTestsUsingElement(el, usedSelectors)
        }))
      });
    }

    return pageAnalysis.sort((a, b) => b.totalVisits - a.totalVisits);
  }

  /**
   * 🧪 Анализ по тестам
   */
  generateTestAnalysis() {
    const testAnalysis = [];

    for (const [testName, testData] of this.globalData.tests) {
      const lastRun = testData.lastRun;
      
      testAnalysis.push({
        testName,
        status: lastRun.status || 'unknown',
        pagesVisited: lastRun.pages?.length || 0,
        selectorsUsed: lastRun.selectors?.length || 0,
        uniqueSelectors: [...new Set(lastRun.selectors || [])].length,
        interactions: lastRun.interactions?.length || 0,
        duration: lastRun.duration || 0,
        runs: testData.runs?.length || 1,
        pages: lastRun.pages || [],
        mostUsedSelectors: this.getMostUsedSelectorsForTest(testName)
      });
    }

    return testAnalysis.sort((a, b) => b.selectorsUsed - a.selectorsUsed);
  }

  /**
   * 🎯 Анализ селекторов
   */
  generateSelectorAnalysis() {
    const selectorAnalysis = [];

    for (const [key, selectorData] of this.globalData.selectors) {
      selectorAnalysis.push({
        selector: selectorData.selector,
        method: selectorData.method,
        usedBy: selectorData.usedBy,
        totalUsage: selectorData.totalUsage,
        testsCount: selectorData.usedBy.length,
        efficiency: this.calculateSelectorEfficiency(selectorData)
      });
    }

    return selectorAnalysis.sort((a, b) => b.totalUsage - a.totalUsage);
  }

  /**
   * 🔍 Данные для drill-down навигации
   */
  generateDrillDownData() {
    return {
      testsByPage: this.generateTestsByPageMap(),
      elementsByTest: this.generateElementsByTestMap(),
      selectorsByTest: this.generateSelectorsByTestMap(),
      pagesByTest: this.generatePagesByTestMap()
    };
  }

  /**
   * 🗺️ Карта тестов по страницам
   */
  generateTestsByPageMap() {
    const map = {};
    for (const [pageUrl, pageData] of this.globalData.pages) {
      map[pageUrl] = pageData.visitedBy;
    }
    return map;
  }

  /**
   * 🎯 Карта элементов по тестам
   */
  generateElementsByTestMap() {
    const map = {};
    for (const [testName, testData] of this.globalData.tests) {
      map[testName] = [];
      for (const pageUrl of testData.lastRun.pages || []) {
        const pageData = this.globalData.pages.get(pageUrl);
        if (pageData) {
          const usedSelectors = this.getSelectorsForTest(testName);
          const coveredElements = pageData.elements.filter(el =>
            this.isElementCovered(el, usedSelectors)
          );
          map[testName].push(...coveredElements);
        }
      }
    }
    return map;
  }

  /**
   * 📝 Получение селекторов для конкретной страницы
   */
  getSelectorsForPage(pageUrl) {
    const selectors = new Set();
    
    for (const [testName, testData] of this.globalData.tests) {
      if (testData.lastRun.pages?.includes(pageUrl)) {
        for (const selector of testData.lastRun.selectors || []) {
          selectors.add(selector);
        }
      }
    }
    
    return selectors;
  }

  /**
   * 🎯 Получение селекторов для конкретного теста
   */
  getSelectorsForTest(testName) {
    const testData = this.globalData.tests.get(testName);
    return new Set(testData?.lastRun.selectors || []);
  }

  /**
   * ✅ Проверка покрытия элемента
   */
  isElementCovered(element, usedSelectors) {
    for (const selector of usedSelectors) {
      if (this.matchesSelector(element, selector)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 🎯 Проверка соответствия селектора элементу
   */
  matchesSelector(element, selector) {
    // Точное соответствие по тексту
    if (selector.includes('text=') && element.text) {
      const selectorText = selector.replace(/text=|locator\(|\)|"/g, '');
      return element.text.includes(selectorText);
    }
    
    // Соответствие по aria-label
    if (selector.includes('aria-label') && element.ariaLabel) {
      return selector.includes(element.ariaLabel);
    }
    
    // Соответствие по ID
    if (selector.startsWith('#') && element.id) {
      return element.id === selector.substring(1);
    }
    
    // Соответствие по классу
    if (selector.includes('.') && element.className) {
      const classFromSelector = selector.match(/\.([a-zA-Z0-9_-]+)/)?.[1];
      return classFromSelector && element.className.includes(classFromSelector);
    }
    
    // Соответствие по тегу
    if (element.tagName === selector.toLowerCase()) {
      return true;
    }

    // Соответствие по role
    if (selector.includes('role=') && element.role) {
      return selector.includes(element.role);
    }
    
    return false;
  }

  /**
   * 🔍 Поиск глобальных непокрытых элементов
   */
  findGlobalUncoveredElements() {
    const uncovered = [];
    
    for (const [pageUrl, pageData] of this.globalData.pages) {
      const usedSelectors = this.getSelectorsForPage(pageUrl);
      
      for (const element of pageData.elements) {
        if (!this.isElementCovered(element, usedSelectors)) {
          uncovered.push({
            ...element,
            pageUrl,
            suggestedSelectors: this.generateSuggestedSelectors(element),
            priority: this.calculateElementPriority(element),
            pageVisits: pageData.totalVisits
          });
        }
      }
    }
    
    return uncovered.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 🎯 Генерация предлагаемых селекторов
   */
  generateSuggestedSelectors(element) {
    const selectors = [];
    
    if (element.text && element.text.length < 50) {
      selectors.push(`text=${element.text}`);
    }
    
    if (element.id) {
      selectors.push(`#${element.id}`);
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
    
    if (element.role) {
      selectors.push(`[role="${element.role}"]`);
    }
    
    selectors.push(element.tagName);
    
    return selectors.slice(0, 4); // Ограничиваем 4 предложениями
  }

  /**
   * ⭐ Расчет приоритета элемента
   */
  calculateElementPriority(element) {
    let priority = 1;
    
    if (['button', 'a', 'input'].includes(element.tagName)) priority += 5;
    if (element.text && element.text.length > 0) priority += 3;
    if (element.visible) priority += 2;
    if (element.id) priority += 2;
    if (element.ariaLabel) priority += 2;
    if (element.role) priority += 1;
    
    return priority;
  }

  /**
   * 💡 Генерация глобальных рекомендаций
   */
  generateGlobalRecommendations() {
    const recommendations = [];
    const summary = this.calculateGlobalSummary();
    
    // Рекомендации по покрытию
    if (summary.coveragePercentage < 30) {
      recommendations.push({
        type: 'coverage',
        priority: 'high',
        message: `🔴 Очень низкое покрытие (${summary.coveragePercentage}%) - критически важно добавить тесты`
      });
    } else if (summary.coveragePercentage < 60) {
      recommendations.push({
        type: 'coverage', 
        priority: 'medium',
        message: `🟡 Среднее покрытие (${summary.coveragePercentage}%) - рекомендуется улучшить`
      });
    } else {
      recommendations.push({
        type: 'coverage',
        priority: 'low', 
        message: `🟢 Хорошее покрытие (${summary.coveragePercentage}%)`
      });
    }

    // Рекомендации по непокрытым элементам
    const highPriorityUncovered = this.findGlobalUncoveredElements().filter(el => el.priority > 8);
    if (highPriorityUncovered.length > 0) {
      recommendations.push({
        type: 'elements',
        priority: 'high',
        message: `🎯 ${highPriorityUncovered.length} критически важных элементов без покрытия`
      });
    }

    // Рекомендации по тестам
    const testsWithLowCoverage = Array.from(this.globalData.tests.values())
      .filter(test => (test.lastRun.selectors?.length || 0) < 3);
    
    if (testsWithLowCoverage.length > 0) {
      recommendations.push({
        type: 'tests',
        priority: 'medium',
        message: `📝 ${testsWithLowCoverage.length} тестов используют мало селекторов`
      });
    }

    return recommendations;
  }

  /**
   * 💾 Сохранение объединенного отчета
   */
  async saveUnifiedReport(report) {
    const timestamp = Date.now();
    const reportDir = this.config.outputDir;
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    // Сохраняем главный объединенный отчет
    const jsonPath = path.join(reportDir, `unified-coverage-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

    const htmlPath = path.join(reportDir, `unified-coverage-${timestamp}.html`);
    const htmlContent = this.generateUnifiedHTMLReport(report);
    fs.writeFileSync(htmlPath, htmlContent);

    const mdPath = path.join(reportDir, `unified-coverage-${timestamp}.md`);
    const mdContent = this.generateUnifiedMarkdownReport(report);
    fs.writeFileSync(mdPath, mdContent);

    // Создаем index.html для быстрого доступа
    const indexPath = path.join(reportDir, 'index.html');
    const indexContent = this.generateIndexHTML(timestamp);
    fs.writeFileSync(indexPath, indexContent);

    console.log(`📊 Объединенный отчет сохранен:`);
    console.log(`   📝 JSON: ${jsonPath}`);
    console.log(`   🌐 HTML: ${htmlPath}`);
    console.log(`   📄 MD: ${mdPath}`);
    console.log(`   🏠 Index: ${indexPath}`);

    return { jsonPath, htmlPath, mdPath, indexPath };
  }

  /**
   * 🌐 Генерация объединенного HTML отчета
   */
  generateUnifiedHTMLReport(report) {
    return `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎯 Unified Test Coverage Report</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1600px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #2c3e50; margin-bottom: 10px; }
        .header .subtitle { color: #7f8c8d; font-size: 1.1em; }
        
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { padding: 25px; border-radius: 12px; text-align: center; color: white; position: relative; overflow: hidden; }
        .stat-card.coverage { background: linear-gradient(135deg, ${report.summary.coveragePercentage > 60 ? '#4caf50, #8bc34a' : report.summary.coveragePercentage > 30 ? '#ff9800, #ffc107' : '#f44336, #e91e63'}); }
        .stat-card.tests { background: linear-gradient(135deg, #667eea, #764ba2); }
        .stat-card.pages { background: linear-gradient(135deg, #00c9ff, #92fe9d); }
        .stat-card.elements { background: linear-gradient(135deg, #fc466b, #3f5efb); }
        
        .stat-value { font-size: 2.5em; font-weight: bold; margin-bottom: 5px; }
        .stat-label { opacity: 0.9; font-size: 1.1em; }
        .stat-detail { opacity: 0.8; font-size: 0.9em; margin-top: 5px; }
        
        .tabs { display: flex; border-bottom: 3px solid #eee; margin-bottom: 30px; background: #f8f9fa; border-radius: 8px 8px 0 0; }
        .tab { padding: 15px 25px; cursor: pointer; border-bottom: 3px solid transparent; font-weight: 500; transition: all 0.3s; }
        .tab:hover { background: #e9ecef; }
        .tab.active { border-bottom-color: #667eea; color: #667eea; background: white; }
        
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        
        .section { margin: 30px 0; }
        .section-title { font-size: 1.8em; margin-bottom: 20px; color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .table th { background: #667eea; color: white; padding: 15px; text-align: left; font-weight: 600; }
        .table td { padding: 12px 15px; border-bottom: 1px solid #eee; }
        .table tr:hover { background: #f8f9fa; }
        
        .covered { background: #e8f5e8; }
        .uncovered { background: #ffebee; }
        .high-priority { border-left: 4px solid #f44336; }
        .medium-priority { border-left: 4px solid #ff9800; }
        
        .progress-bar { width: 100%; height: 8px; background: #eee; border-radius: 4px; overflow: hidden; margin: 5px 0; }
        .progress-fill { height: 100%; transition: width 0.3s; border-radius: 4px; }
        .progress-high { background: linear-gradient(90deg, #4caf50, #8bc34a); }
        .progress-medium { background: linear-gradient(90deg, #ff9800, #ffc107); }
        .progress-low { background: linear-gradient(90deg, #f44336, #e91e63); }
        
        .drill-down { cursor: pointer; color: #667eea; text-decoration: underline; }
        .drill-down:hover { color: #5a6fd8; }
        
        .expandable { cursor: pointer; }
        .expandable:hover { background: #f0f0f0; }
        .details { display: none; padding: 10px; background: #f8f9fa; border-left: 4px solid #667eea; margin: 5px 0; }
        .details.show { display: block; }
        
        .recommendation { padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid; }
        .recommendation.high { border-color: #f44336; background: #ffebee; }
        .recommendation.medium { border-color: #ff9800; background: #fff3e0; }
        .recommendation.low { border-color: #4caf50; background: #e8f5e8; }
        
        .badge { display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 0.8em; font-weight: bold; margin: 2px; }
        .badge.success { background: #4caf50; color: white; }
        .badge.warning { background: #ff9800; color: white; }
        .badge.danger { background: #f44336; color: white; }
        .badge.info { background: #2196f3; color: white; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Unified Test Coverage Report</h1>
            <p class="subtitle">Объединенный анализ покрытия UI элементов тестами</p>
            <p><strong>Сессия:</strong> ${report.metadata.sessionId} | <strong>Создан:</strong> ${new Date(report.metadata.generatedAt).toLocaleString('ru')}</p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card coverage">
                <div class="stat-value">${report.summary.coveragePercentage}%</div>
                <div class="stat-label">Общее покрытие</div>
                <div class="stat-detail">${report.summary.coveredElements} из ${report.summary.totalElements}</div>
            </div>
            <div class="stat-card tests">
                <div class="stat-value">${report.summary.totalTests}</div>
                <div class="stat-label">Всего тестов</div>
                <div class="stat-detail">${report.currentSession.totalTests} в сессии</div>
            </div>
            <div class="stat-card pages">
                <div class="stat-value">${report.summary.totalPages}</div>
                <div class="stat-label">Страниц</div>
                <div class="stat-detail">${report.summary.totalSelectors} селекторов</div>
            </div>
            <div class="stat-card elements">
                <div class="stat-value">${report.summary.uncoveredElements}</div>
                <div class="stat-label">Непокрыто</div>
                <div class="stat-detail">${Math.round((report.summary.sessionDuration / 1000))}s сессия</div>
            </div>
        </div>

        <div class="tabs">
            <div class="tab active" onclick="showTab('summary')">📊 Сводка</div>
            <div class="tab" onclick="showTab('pages')">🌐 По страницам</div>
            <div class="tab" onclick="showTab('tests')">🧪 По тестам</div>
            <div class="tab" onclick="showTab('uncovered')">🎯 Непокрытые</div>
            <div class="tab" onclick="showTab('selectors')">📝 Селекторы</div>
        </div>

        <div id="summary" class="tab-content active">
            <div class="section">
                <h2 class="section-title">📊 Общая статистика</h2>
                <div class="progress-bar">
                    <div class="progress-fill ${report.summary.coveragePercentage > 60 ? 'progress-high' : report.summary.coveragePercentage > 30 ? 'progress-medium' : 'progress-low'}" style="width: ${report.summary.coveragePercentage}%"></div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
                    <div>
                        <h3>🎯 Топ-5 непокрытых элементов</h3>
                        ${report.uncoveredElements.slice(0, 5).map((element, index) => `
                            <div class="expandable" onclick="toggleDetails('uncovered-${index}')">
                                <strong>${index + 1}. ${element.text || element.tagName}</strong>
                                <span class="badge ${element.priority > 8 ? 'danger' : element.priority > 5 ? 'warning' : 'info'}">${element.priority}</span>
                            </div>
                            <div id="uncovered-${index}" class="details">
                                <strong>Страница:</strong> ${element.pageUrl}<br>
                                <strong>Селекторы:</strong> <code>${element.suggestedSelectors.join(', ')}</code>
                            </div>
                        `).join('')}
                    </div>
                    <div>
                        <h3>📈 Рекомендации</h3>
                        ${report.recommendations.map(rec => `
                            <div class="recommendation ${rec.priority}">
                                ${rec.message}
                            </div>
                        `).join('')}
                    </div>
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
                            <th>Элементов</th>
                            <th>Покрыто</th>
                            <th>Покрытие</th>
                            <th>Тесты</th>
                            <th>Детали</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${report.pageAnalysis.map((page, index) => `
                            <tr>
                                <td><strong>${page.url}</strong></td>
                                <td>${page.totalElements}</td>
                                <td>${page.coveredElements}</td>
                                <td>
                                    <div class="progress-bar">
                                        <div class="progress-fill ${page.coveragePercentage > 60 ? 'progress-high' : page.coveragePercentage > 30 ? 'progress-medium' : 'progress-low'}" style="width: ${page.coveragePercentage}%"></div>
                                    </div>
                                    ${page.coveragePercentage}%
                                </td>
                                <td>${page.visitedBy.length}</td>
                                <td><span class="drill-down" onclick="toggleDetails('page-${index}')">Показать детали</span></td>
                            </tr>
                            <tr id="page-${index}" class="details" style="display: none;">
                                <td colspan="6">
                                    <strong>Посещено тестами:</strong> ${page.visitedBy.join(', ')}<br>
                                    <strong>Всего посещений:</strong> ${page.totalVisits}<br>
                                    <strong>Непокрытые элементы:</strong> ${page.elements.filter(el => !el.covered).slice(0, 3).map(el => el.text || el.tagName).join(', ')}
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
                            <th>Статус</th>
                            <th>Страниц</th>
                            <th>Селекторов</th>
                            <th>Взаимодействий</th>
                            <th>Время</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${report.testAnalysis.map(test => `
                            <tr>
                                <td><strong>${test.testName}</strong></td>
                                <td><span class="badge ${test.status === 'passed' ? 'success' : 'danger'}">${test.status}</span></td>
                                <td>${test.pagesVisited}</td>
                                <td>${test.uniqueSelectors}</td>
                                <td>${test.interactions}</td>
                                <td>${test.duration}ms</td>
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
                            <th>Приоритет</th>
                            <th>Предлагаемые селекторы</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${report.uncoveredElements.slice(0, 20).map(element => `
                            <tr class="${element.priority > 8 ? 'high-priority' : element.priority > 5 ? 'medium-priority' : ''}">
                                <td><strong>${element.text || element.tagName}</strong></td>
                                <td><span class="badge info">${element.tagName}</span></td>
                                <td>${element.pageUrl.split('/').pop() || 'homepage'}</td>
                                <td><span class="badge ${element.priority > 8 ? 'danger' : element.priority > 5 ? 'warning' : 'info'}">${element.priority}</span></td>
                                <td><code>${element.suggestedSelectors.slice(0, 2).join(', ')}</code></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <div id="selectors" class="tab-content">
            <div class="section">
                <h2 class="section-title">📝 Анализ селекторов</h2>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Селектор</th>
                            <th>Метод</th>
                            <th>Использований</th>
                            <th>Тестов</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${report.selectorAnalysis.slice(0, 20).map(selector => `
                            <tr>
                                <td><code>${selector.selector}</code></td>
                                <td><span class="badge info">${selector.method}</span></td>
                                <td>${selector.totalUsage}</td>
                                <td>${selector.testsCount}</td>
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
        
        function toggleDetails(elementId) {
            const element = document.getElementById(elementId);
            if (element.style.display === 'none' || !element.style.display) {
                element.style.display = 'table-row';
            } else {
                element.style.display = 'none';
            }
        }
    </script>
</body>
</html>`;
  }

  /**
   * 📄 Генерация объединенного Markdown отчета
   */
  generateUnifiedMarkdownReport(report) {
    return `# 🎯 Unified Test Coverage Report

## 📊 Общая статистика

- **Покрытие:** ${report.summary.coveragePercentage}% (${report.summary.coveredElements} из ${report.summary.totalElements})
- **Тестов:** ${report.summary.totalTests}
- **Страниц:** ${report.summary.totalPages}  
- **Селекторов:** ${report.summary.totalSelectors}
- **Время сессии:** ${Math.round(report.summary.sessionDuration / 1000)}s
- **Дата:** ${new Date(report.metadata.generatedAt).toLocaleString('ru')}

## 🌐 Топ страниц по покрытию

${report.pageAnalysis.slice(0, 10).map((page, index) => `
${index + 1}. **${page.url}**
   - Элементов: ${page.totalElements}
   - Покрыто: ${page.coveredElements} (${page.coveragePercentage}%)
   - Тестов: ${page.visitedBy.length}
   - Посещений: ${page.totalVisits}
`).join('')}

## 🧪 Анализ тестов

${report.testAnalysis.map(test => `
### ${test.testName}
- **Статус:** ${test.status}
- **Страниц:** ${test.pagesVisited}
- **Селекторов:** ${test.uniqueSelectors}
- **Взаимодействий:** ${test.interactions}
- **Время:** ${test.duration}ms
`).join('')}

## 🎯 Топ-20 непокрытых элементов

${report.uncoveredElements.slice(0, 20).map((element, index) => `
${index + 1}. **${element.text || element.tagName}** (${element.tagName}) - Приоритет: ${element.priority}
   - Страница: ${element.pageUrl}
   - Селекторы: \`${element.suggestedSelectors.slice(0, 3).join('`, `')}\`
`).join('')}

## 💡 Рекомендации

${report.recommendations.map(rec => `- ${rec.message}`).join('\n')}

---
*Объединенный отчет создан автоматически с помощью GlobalCoverageTracker*
`;
  }

  /**
   * 🏠 Генерация index.html для быстрого доступа
   */
  generateIndexHTML(timestamp) {
    return `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Test Coverage Reports</title>
    <meta http-equiv="refresh" content="0; url=unified-coverage-${timestamp}.html">
</head>
<body>
    <p>Перенаправление на последний отчет покрытия...</p>
    <p><a href="unified-coverage-${timestamp}.html">Открыть отчет вручную</a></p>
</body>
</html>`;
  }

  // Вспомогательные методы
  getMostUsedSelectorsForTest(testName) {
    const testData = this.globalData.tests.get(testName);
    if (!testData?.lastRun.selectors) return [];
    
    const selectorCount = {};
    testData.lastRun.selectors.forEach(selector => {
      selectorCount[selector] = (selectorCount[selector] || 0) + 1;
    });
    
    return Object.entries(selectorCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([selector, count]) => ({ selector, count }));
  }

  calculateSelectorEfficiency(selectorData) {
    // Эффективность = количество тестов / общее использование
    return selectorData.usedBy.length / selectorData.totalUsage;
  }

  generateSelectorsByTestMap() {
    const map = {};
    for (const [testName, testData] of this.globalData.tests) {
      map[testName] = testData.lastRun.selectors || [];
    }
    return map;
  }

  generatePagesByTestMap() {
    const map = {};
    for (const [testName, testData] of this.globalData.tests) {
      map[testName] = testData.lastRun.pages || [];
    }
    return map;
  }

  getTestsUsingElement(element, usedSelectors) {
    const tests = [];
    for (const [testName, testData] of this.globalData.tests) {
      const testSelectors = new Set(testData.lastRun.selectors || []);
      if (this.isElementCovered(element, testSelectors)) {
        tests.push(testName);
      }
    }
    return tests;
  }
}
