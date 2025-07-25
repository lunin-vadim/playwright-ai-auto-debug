// DemoProject/lib/globalCoverageManager.js

import fs from 'fs';
import path from 'path';
import { DetailedCoverageTracker } from './detailedCoverageTracker.js';

/**
 * Глобальный менеджер покрытия UI элементов
 * Агрегирует данные всех тестов в единый отчет
 */
export class GlobalCoverageManager {
  constructor(config = {}) {
    this.config = {
      outputDir: config.outputDir || 'unified-coverage',
      sessionName: config.sessionName || `unified-session-${Date.now()}`,
      ...config
    };
    
    // Единый трекер для всех тестов
    this.coverageTracker = new DetailedCoverageTracker({
      outputDir: this.config.outputDir,
      trackingEnabled: true,
      includeSelectors: true,
      includeScreenshots: false
    });
    
    this.isInitialized = false;
    this.testCounter = 0;
    this.testResults = new Map();
  }

  /**
   * 🎬 Инициализация глобальной сессии
   */
  initializeGlobalSession() {
    if (!this.isInitialized) {
      this.coverageTracker.startSession(this.config.sessionName);
      this.isInitialized = true;
      console.log(`🌐 Инициализирован глобальный трекер покрытия: ${this.config.sessionName}`);
    }
    return this.config.sessionName;
  }

  /**
   * 📊 Регистрация элементов страницы от теста
   */
  registerTestPageElements(testName, pageName, mcpSnapshot) {
    this.initializeGlobalSession();
    
    const elements = this.coverageTracker.registerPageElements(
      pageName, 
      mcpSnapshot, 
      testName
    );
    
    // Сохранение информации о тесте
    if (!this.testResults.has(testName)) {
      this.testResults.set(testName, {
        name: testName,
        pages: new Set(),
        elementsFound: 0,
        elementsCovered: 0,
        interactions: []
      });
    }
    
    const testInfo = this.testResults.get(testName);
    testInfo.pages.add(pageName);
    testInfo.elementsFound += elements.length;
    
    console.log(`📋 [${testName}] Зарегистрировано ${elements.length} элементов на странице ${pageName}`);
    
    return elements;
  }

  /**
   * ✅ Отметка покрытия элемента от теста
   */
  markTestElementCovered(testName, element, interactionType = 'unknown') {
    this.initializeGlobalSession();
    
    this.coverageTracker.markElementCovered(element, testName, interactionType);
    
    // Обновление статистики теста
    const testInfo = this.testResults.get(testName);
    if (testInfo) {
      testInfo.elementsCovered++;
      testInfo.interactions.push({
        element,
        interactionType,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`✅ [${testName}] Элемент покрыт: ${element.text || element.type} (${interactionType})`);
  }

  /**
   * 📝 Регистрация завершения теста
   */
  completeTest(testName, status = 'passed') {
    const testInfo = this.testResults.get(testName);
    if (testInfo) {
      testInfo.status = status;
      testInfo.completedAt = new Date().toISOString();
      
      console.log(`🏁 [${testName}] Тест завершен: ${status}`);
      console.log(`   Страниц: ${testInfo.pages.size}, Элементов: ${testInfo.elementsFound}, Покрыто: ${testInfo.elementsCovered}`);
    }
    
    this.testCounter++;
  }

  /**
   * 📊 Генерация единого отчета по всем тестам
   */
  generateUnifiedReport() {
    if (!this.isInitialized) {
      console.warn('⚠️ Глобальный трекер не инициализирован');
      return null;
    }

    const baseReport = this.coverageTracker.generateDetailedCoverageReport();
    
    // Добавление информации о тестах
    const testsSummary = Array.from(this.testResults.values()).map(test => ({
      name: test.name,
      status: test.status || 'unknown',
      pages: Array.from(test.pages),
      elementsFound: test.elementsFound,
      elementsCovered: test.elementsCovered,
      interactions: test.interactions.length,
      coveragePercentage: test.elementsFound > 0 ? 
        Math.round((test.elementsCovered / test.elementsFound) * 100) : 0,
      completedAt: test.completedAt
    }));

    // Собираем все элементы из всех тестов
    const allElementsRegistry = [];
    const pageElementsMap = new Map();
    
    // Получаем все элементы из базового отчета
    const allElements = [...baseReport.detailedElements.covered, ...baseReport.detailedElements.uncovered];
    
    // Обрабатываем каждый элемент и добавляем метаданные
    allElements.forEach(element => {
      // Элемент уже содержит информацию о покрытии, тестах и взаимодействиях
      allElementsRegistry.push(element);
      
      // Группируем элементы по страницам
      if (element.pages && element.pages.length > 0) {
        element.pages.forEach(pageName => {
          if (!pageElementsMap.has(pageName)) {
            pageElementsMap.set(pageName, []);
          }
          pageElementsMap.get(pageName).push(element);
        });
      }
    });

    // Расширенный отчет
    const unifiedReport = {
      ...baseReport,
      
      // Информация о глобальной сессии
      globalSession: {
        sessionName: this.config.sessionName,
        totalTests: this.testCounter,
        testsCompleted: testsSummary.filter(t => t.status !== 'unknown').length,
        testsPassed: testsSummary.filter(t => t.status === 'passed').length,
        testsFailed: testsSummary.filter(t => t.status === 'failed').length,
        allElementsRegistry: allElementsRegistry,
        pageElementsMap: Object.fromEntries(pageElementsMap)
      },
      
      // Детальная информация о тестах
      testsDetails: testsSummary,
      
      // Агрегированная статистика
      aggregatedStats: this.calculateAggregatedStats(testsSummary),
      
      // Покрытие по тестам
      coverageByTest: this.calculateCoverageByTest(testsSummary),
      
      // Топ непокрытых элементов
      topUncoveredElements: this.getTopUncoveredElements(baseReport.detailedElements.uncovered),
      
      // Рекомендации на основе всех тестов
      unifiedRecommendations: this.generateUnifiedRecommendations(baseReport, testsSummary)
    };

    return unifiedReport;
  }

  /**
   * Расчет агрегированной статистики
   */
  calculateAggregatedStats(testsSummary) {
    const totalElementsFound = testsSummary.reduce((sum, test) => sum + test.elementsFound, 0);
    const totalElementsCovered = testsSummary.reduce((sum, test) => sum + test.elementsCovered, 0);
    const totalInteractions = testsSummary.reduce((sum, test) => sum + test.interactions, 0);
    
    const avgCoveragePerTest = testsSummary.length > 0 ? 
      Math.round(testsSummary.reduce((sum, test) => sum + test.coveragePercentage, 0) / testsSummary.length) : 0;
    
    return {
      totalElementsFound,
      totalElementsCovered,
      totalInteractions,
      avgCoveragePerTest,
      testsWithFullCoverage: testsSummary.filter(t => t.coveragePercentage === 100).length,
      testsWithNoCoverage: testsSummary.filter(t => t.coveragePercentage === 0).length,
      mostProductiveTest: testsSummary.reduce((max, test) => 
        test.elementsCovered > (max?.elementsCovered || 0) ? test : max, null
      ),
      leastProductiveTest: testsSummary.reduce((min, test) => 
        test.elementsCovered < (min?.elementsCovered || Infinity) ? test : min, null
      )
    };
  }

  /**
   * Расчет покрытия по тестам
   */
  calculateCoverageByTest(testsSummary) {
    return testsSummary.map(test => ({
      testName: test.name,
      coverage: test.coveragePercentage,
      elementsFound: test.elementsFound,
      elementsCovered: test.elementsCovered,
      efficiency: test.elementsFound > 0 ? 
        Math.round((test.elementsCovered / test.elementsFound) * 100) : 0,
      pages: test.pages
    })).sort((a, b) => b.coverage - a.coverage);
  }

  /**
   * Получение топ непокрытых элементов
   */
  getTopUncoveredElements(uncoveredElements) {
    // Группировка по типам
    const byType = uncoveredElements.reduce((groups, element) => {
      if (!groups[element.type]) {
        groups[element.type] = [];
      }
      groups[element.type].push(element);
      return groups;
    }, {});

    // Топ по типам
    const topByType = Object.entries(byType)
      .map(([type, elements]) => ({
        type,
        count: elements.length,
        examples: elements.slice(0, 3).map(el => el.text || el.type)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Топ критичных непокрытых
    const criticalUncovered = uncoveredElements
      .filter(el => el.critical)
      .slice(0, 10);

    // Топ интерактивных непокрытых
    const interactiveUncovered = uncoveredElements
      .filter(el => el.interactable)
      .slice(0, 10);

    return {
      byType: topByType,
      critical: criticalUncovered,
      interactive: interactiveUncovered,
      total: uncoveredElements.length
    };
  }

  /**
   * Генерация объединенных рекомендаций
   */
  generateUnifiedRecommendations(baseReport, testsSummary) {
    const recommendations = [...baseReport.recommendations];

    // Рекомендации по тестам
    const lowCoverageTests = testsSummary.filter(t => t.coveragePercentage < 50);
    if (lowCoverageTests.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Test Coverage',
        message: `${lowCoverageTests.length} тестов имеют низкое покрытие (<50%)`,
        tests: lowCoverageTests.map(t => t.name),
        action: 'Добавьте больше взаимодействий в эти тесты'
      });
    }

    // Рекомендации по неиспользуемым страницам
    const allPages = new Set();
    testsSummary.forEach(test => test.pages.forEach(page => allPages.add(page)));
    
    if (allPages.size > testsSummary.length) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Page Coverage',
        message: `Некоторые страницы анализируются несколькими тестами`,
        pages: Array.from(allPages),
        action: 'Рассмотрите оптимизацию распределения страниц по тестам'
      });
    }

    return recommendations;
  }

  /**
   * 💾 Сохранение единого отчета
   */
  async saveUnifiedReport() {
    const report = this.generateUnifiedReport();
    if (!report) {
      console.error('❌ Не удалось сгенерировать отчет');
      return null;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputDir = this.config.outputDir;
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // JSON отчет
    const jsonPath = path.join(outputDir, `unified-coverage-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

    // HTML отчет
    const htmlReport = await this.generateUnifiedHTMLReport(report);
    const htmlPath = path.join(outputDir, `unified-coverage-${timestamp}.html`);
    fs.writeFileSync(htmlPath, htmlReport);

    // Краткий отчет
    const summaryPath = path.join(outputDir, `coverage-summary-${timestamp}.md`);
    const summaryReport = this.generateSummaryReport(report);
    fs.writeFileSync(summaryPath, summaryReport);

    console.log('\n📊 === ЕДИНЫЙ ОТЧЕТ ПОКРЫТИЯ СОХРАНЕН ===');
    console.log(`📄 JSON: ${jsonPath}`);
    console.log(`🌐 HTML: ${htmlPath}`);
    console.log(`📝 Summary: ${summaryPath}`);

    // Вывод краткой статистики
    this.printUnifiedSummary(report);

    return {
      json: jsonPath,
      html: htmlPath,
      summary: summaryPath
    };
  }

  /**
   * 📄 Генерация HTML отчета для единого покрытия
   */
  async generateUnifiedHTMLReport(report) {
    const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Unified UI Coverage Report - ${report.globalSession.sessionName}</title>
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
        .tests-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .tests-table th, .tests-table td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
        .tests-table th { background: #f5f5f5; font-weight: bold; }
        .coverage-bar { width: 100px; height: 20px; background: #eee; border-radius: 10px; overflow: hidden; }
        .coverage-fill { height: 100%; transition: width 0.3s; }
        .coverage-high { background: linear-gradient(90deg, #4caf50, #8bc34a); }
        .coverage-medium { background: linear-gradient(90deg, #ff9800, #ffc107); }
        .coverage-low { background: linear-gradient(90deg, #f44336, #e91e63); }
        .recommendation { padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid; }
        .recommendation.high { border-color: #f44336; background: #ffebee; }
        .recommendation.medium { border-color: #ff9800; background: #fff3e0; }
        .recommendation.low { border-color: #4caf50; background: #e8f5e8; }
        .element-list { max-height: 300px; overflow-y: auto; }
        .element-item { padding: 8px; margin: 4px 0; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
        .element-item.uncovered { background: #ffebee; border-left: 3px solid #f44336; }
        .element-item.critical { background: #fce4ec; border-left: 3px solid #e91e63; }
        .tabs { display: flex; border-bottom: 2px solid #eee; margin-bottom: 20px; }
        .tab { padding: 10px 20px; cursor: pointer; border-bottom: 2px solid transparent; }
        .tab.active { border-bottom-color: #667eea; color: #667eea; font-weight: bold; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Единый отчет покрытия UI элементов</h1>
            <p>Сессия: ${report.globalSession.sessionName}</p>
            <p>Тестов: ${report.globalSession.totalTests} | Пройдено: ${report.globalSession.testsPassed} | Провалено: ${report.globalSession.testsFailed}</p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${report.summary.totalElements}</div>
                <div class="stat-label">Всего элементов</div>
            </div>
            <div class="stat-card success">
                <div class="stat-value">${report.summary.coveredElements}</div>
                <div class="stat-label">Покрыто</div>
            </div>
            <div class="stat-card danger">
                <div class="stat-value">${report.summary.uncoveredElements}</div>
                <div class="stat-label">Не покрыто</div>
            </div>
            <div class="stat-card ${report.summary.coveragePercentage >= 80 ? 'success' : report.summary.coveragePercentage >= 50 ? 'warning' : 'danger'}">
                <div class="stat-value">${report.summary.coveragePercentage}%</div>
                <div class="stat-label">Покрытие</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${report.aggregatedStats.totalInteractions}</div>
                <div class="stat-label">Взаимодействий</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${report.aggregatedStats.avgCoveragePerTest}%</div>
                <div class="stat-label">Среднее по тестам</div>
            </div>
        </div>

        <div class="tabs">
            <div class="tab active" onclick="showTab('tests')">📊 Тесты</div>
            <div class="tab" onclick="showTab('coverage')">📈 Покрытие</div>
            <div class="tab" onclick="showTab('covered')">✅ Покрытые</div>
            <div class="tab" onclick="showTab('uncovered')">❌ Непокрытые</div>
            <div class="tab" onclick="showTab('pages')">🌐 Страницы</div>
            <div class="tab" onclick="showTab('recommendations')">💡 Рекомендации</div>
        </div>

        <div id="tests" class="tab-content active">
            <div class="section">
                <h2 class="section-title">📊 Результаты тестов</h2>
                <table class="tests-table">
                    <thead>
                        <tr>
                            <th>Тест</th>
                            <th>Статус</th>
                            <th>Страниц</th>
                            <th>Элементов</th>
                            <th>Покрыто</th>
                            <th>Покрытие</th>
                            <th>Взаимодействий</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${report.testsDetails.map(test => `
                            <tr>
                                <td><strong>${test.name}</strong></td>
                                <td>${test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⏳'} ${test.status}</td>
                                <td>${test.pages.length}</td>
                                <td>${test.elementsFound}</td>
                                <td>${test.elementsCovered}</td>
                                <td>
                                    <div class="coverage-bar">
                                        <div class="coverage-fill ${test.coveragePercentage >= 80 ? 'coverage-high' : test.coveragePercentage >= 50 ? 'coverage-medium' : 'coverage-low'}" 
                                             style="width: ${test.coveragePercentage}%"></div>
                                    </div>
                                    ${test.coveragePercentage}%
                                </td>
                                <td>${test.interactions}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <div id="coverage" class="tab-content">
            <div class="section">
                <h2 class="section-title">📈 Покрытие по типам элементов</h2>
                <table class="tests-table">
                    <thead>
                        <tr><th>Тип</th><th>Всего</th><th>Покрыто</th><th>Процент</th><th>Прогресс</th></tr>
                    </thead>
                    <tbody>
                        ${Object.entries(report.coverageByType).map(([type, coverage]) => `
                            <tr>
                                <td><strong>${type}</strong></td>
                                <td>${coverage.total}</td>
                                <td>${coverage.covered}</td>
                                <td>${coverage.percentage}%</td>
                                <td>
                                    <div class="coverage-bar">
                                        <div class="coverage-fill ${coverage.percentage >= 80 ? 'coverage-high' : coverage.percentage >= 50 ? 'coverage-medium' : 'coverage-low'}" 
                                             style="width: ${coverage.percentage}%"></div>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="section">
                <h2 class="section-title">🌐 Покрытие по страницам</h2>
                <table class="tests-table">
                    <thead>
                        <tr><th>Страница</th><th>Всего</th><th>Покрыто</th><th>Процент</th><th>Прогресс</th></tr>
                    </thead>
                    <tbody>
                        ${Object.entries(report.coverageByPage).map(([page, coverage]) => `
                            <tr>
                                <td><strong>${page}</strong></td>
                                <td>${coverage.total}</td>
                                <td>${coverage.covered}</td>
                                <td>${coverage.percentage}%</td>
                                <td>
                                    <div class="coverage-bar">
                                        <div class="coverage-fill ${coverage.percentage >= 80 ? 'coverage-high' : coverage.percentage >= 50 ? 'coverage-medium' : 'coverage-low'}" 
                                             style="width: ${coverage.percentage}%"></div>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <div id="covered" class="tab-content">
            <div class="section">
                <h2 class="section-title">✅ Покрытые элементы</h2>
                ${report.globalSession.allElementsRegistry.filter(el => el.covered).length > 0 ? `
                <div class="element-list">
                    ${report.globalSession.allElementsRegistry
                        .filter(el => el.covered)
                        .map(element => `
                        <div class="element-item" style="background: #e8f5e8; border-left: 3px solid #4caf50;">
                            ✅ ${element.type}: "${element.text}" 
                            <div style="font-size: 0.8em; color: #666; margin-top: 4px;">
                                📄 ${element.pages ? element.pages.join(', ') : 'unknown'} | 🎯 ${element.tests ? element.tests.join(', ') : 'unknown'} | 🤝 ${element.interactions && element.interactions.length > 0 ? element.interactions[0].type : 'unknown'}
                            </div>
                        </div>
                    `).join('')}
                </div>
                ` : '<p>Нет покрытых элементов</p>'}
            </div>

            <div class="section">
                <h2 class="section-title">📊 Покрытые элементы по тестам</h2>
                ${report.testsDetails.map(testData => {
                    const coveredElements = report.globalSession.allElementsRegistry.filter(el => 
                        el.covered && el.tests && el.tests.includes(testData.name)
                    );
                    return `
                                         <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
                        <h4>${testData.name} (${coveredElements.length} элементов)</h4>
                        ${coveredElements.length > 0 ? `
                        <div style="margin-top: 10px;">
                            ${coveredElements.map(el => `
                                <span style="display: inline-block; margin: 2px; padding: 4px 8px; background: #e8f5e8; border-radius: 4px; font-size: 0.9em;">
                                    ${el.type}: ${el.text}
                                </span>
                            `).join('')}
                        </div>
                        ` : '<p style="color: #666;">Нет покрытых элементов</p>'}
                    </div>
                    `;
                }).join('')}
            </div>
        </div>

        <div id="uncovered" class="tab-content">
            <div class="section">
                <h2 class="section-title">❌ Топ непокрытых элементов по типам</h2>
                ${report.topUncoveredElements.byType.map(item => `
                    <div style="margin: 15px 0;">
                        <h4>${item.type} (${item.count} элементов)</h4>
                        <div style="color: #666;">${item.examples.join(', ')}</div>
                    </div>
                `).join('')}
            </div>

            ${report.topUncoveredElements.critical.length > 0 ? `
            <div class="section">
                <h2 class="section-title">🔴 Критичные непокрытые элементы</h2>
                <div class="element-list">
                    ${report.topUncoveredElements.critical.map(element => `
                        <div class="element-item critical">
                            🔴 ${element.type}: "${element.text}" (${element.selector})
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <div class="section">
                <h2 class="section-title">🎯 Интерактивные непокрытые элементы</h2>
                <div class="element-list">
                    ${report.topUncoveredElements.interactive.slice(0, 20).map(element => `
                        <div class="element-item uncovered">
                            🎯 ${element.type}: "${element.text}" (${element.selector})
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>

        <div id="pages" class="tab-content">
            <div class="section">
                <h2 class="section-title">🌐 Детализация по страницам</h2>
                ${Object.entries(report.globalSession.pageElementsMap).map(([pageName, pageElements]) => {
                    const coveredElements = pageElements.filter(el => el.covered);
                    const uncoveredElements = pageElements.filter(el => !el.covered);
                    const coveragePercent = pageElements.length > 0 ? Math.round((coveredElements.length / pageElements.length) * 100) : 0;
                    
                    return `
                    <div style="margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <h3>${pageName}</h3>
                            <div style="text-align: right;">
                                <div style="font-size: 1.5em; font-weight: bold; color: ${coveragePercent >= 50 ? '#4caf50' : '#f44336'};">
                                    ${coveragePercent}%
                                </div>
                                <div style="font-size: 0.9em; color: #666;">
                                    ${coveredElements.length}/${pageElements.length} элементов
                                </div>
                            </div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div>
                                <h4 style="color: #4caf50;">✅ Покрытые (${coveredElements.length})</h4>
                                <div style="max-height: 200px; overflow-y: auto;">
                                    ${coveredElements.length > 0 ? coveredElements.map(el => `
                                        <div style="padding: 4px 8px; margin: 2px 0; background: #e8f5e8; border-radius: 4px; font-size: 0.9em;">
                                            ${el.type}: ${el.text}
                                            <div style="font-size: 0.8em; color: #666;">🎯 ${el.testName}</div>
                                        </div>
                                    `).join('') : '<p style="color: #666;">Нет покрытых элементов</p>'}
                                </div>
                            </div>
                            
                            <div>
                                <h4 style="color: #f44336;">❌ Непокрытые (${uncoveredElements.length})</h4>
                                <div style="max-height: 200px; overflow-y: auto;">
                                    ${uncoveredElements.length > 0 ? uncoveredElements.slice(0, 10).map(el => `
                                        <div style="padding: 4px 8px; margin: 2px 0; background: #ffebee; border-radius: 4px; font-size: 0.9em;">
                                            ${el.type}: ${el.text}
                                        </div>
                                    `).join('') + (uncoveredElements.length > 10 ? `<div style="padding: 4px 8px; color: #666; font-style: italic;">... и еще ${uncoveredElements.length - 10} элементов</div>` : '') : '<p style="color: #666;">Все элементы покрыты!</p>'}
                                </div>
                            </div>
                        </div>
                        
                        <div style="margin-top: 15px;">
                            <h4>📊 Статистика по типам элементов</h4>
                            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                                ${Object.entries(pageElements.reduce((acc, el) => {
                                    if (!acc[el.type]) acc[el.type] = { total: 0, covered: 0 };
                                    acc[el.type].total++;
                                    if (el.covered) acc[el.type].covered++;
                                    return acc;
                                }, {})).map(([type, stats]) => `
                                    <div style="padding: 8px 12px; background: #f5f5f5; border-radius: 4px; font-size: 0.9em;">
                                        <strong>${type}</strong>: ${stats.covered}/${stats.total} 
                                        (${stats.total > 0 ? Math.round((stats.covered / stats.total) * 100) : 0}%)
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>
        </div>

        <div id="recommendations" class="tab-content">
            <div class="section">
                <h2 class="section-title">💡 Рекомендации по улучшению покрытия</h2>
                ${report.unifiedRecommendations.map(rec => `
                    <div class="recommendation ${rec.priority.toLowerCase()}">
                        <h4>${rec.priority === 'HIGH' ? '🔴' : rec.priority === 'MEDIUM' ? '🟡' : '🟢'} [${rec.priority}] ${rec.category}</h4>
                        <p><strong>Проблема:</strong> ${rec.message}</p>
                        <p><strong>Действие:</strong> ${rec.action}</p>
                        ${rec.tests ? `<p><strong>Тесты:</strong> ${rec.tests.join(', ')}</p>` : ''}
                        ${rec.elements ? `<p><strong>Элементы:</strong> ${rec.elements.slice(0, 5).join(', ')}${rec.elements.length > 5 ? '...' : ''}</p>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    </div>

    <script>
        function showTab(tabName) {
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            event.target.classList.add('active');
            document.getElementById(tabName).classList.add('active');
        }
    </script>
</body>
</html>`;
    
    return html;
  }

  /**
   * 📝 Генерация краткого отчета
   */
  generateSummaryReport(report) {
    return `# 📊 Краткий отчет покрытия UI элементов

## 🎯 Общая информация
- **Сессия**: ${report.globalSession.sessionName}
- **Дата**: ${new Date().toLocaleString()}
- **Тестов выполнено**: ${report.globalSession.totalTests}
- **Успешных**: ${report.globalSession.testsPassed}
- **Провалившихся**: ${report.globalSession.testsFailed}

## 📈 Статистика покрытия
- **Всего элементов**: ${report.summary.totalElements}
- **Покрыто**: ${report.summary.coveredElements}
- **Не покрыто**: ${report.summary.uncoveredElements}
- **Процент покрытия**: ${report.summary.coveragePercentage}%
- **Взаимодействий**: ${report.aggregatedStats.totalInteractions}

## 🏆 Лучшие тесты
${report.testsDetails
  .sort((a, b) => b.coveragePercentage - a.coveragePercentage)
  .slice(0, 5)
  .map(test => `- **${test.name}**: ${test.coveragePercentage}% (${test.elementsCovered}/${test.elementsFound})`)
  .join('\n')}

## ⚠️ Проблемные области
${report.topUncoveredElements.byType
  .slice(0, 3)
  .map(item => `- **${item.type}**: ${item.count} непокрытых элементов`)
  .join('\n')}

## 💡 Главные рекомендации
${report.unifiedRecommendations
  .slice(0, 3)
  .map(rec => `- **[${rec.priority}] ${rec.category}**: ${rec.message}`)
  .join('\n')}

---
*Отчет сгенерирован автоматически системой детального покрытия UI элементов*`;
  }

  /**
   * 📊 Вывод краткой статистики в консоль
   */
  printUnifiedSummary(report) {
    console.log('\n📊 === КРАТКАЯ СТАТИСТИКА ЕДИНОГО ОТЧЕТА ===');
    console.log(`🎯 Сессия: ${report.globalSession.sessionName}`);
    console.log(`🧪 Тестов: ${report.globalSession.totalTests} (✅${report.globalSession.testsPassed} ❌${report.globalSession.testsFailed})`);
    console.log(`📊 Элементов: ${report.summary.totalElements} (✅${report.summary.coveredElements} ❌${report.summary.uncoveredElements})`);
    console.log(`📈 Покрытие: ${report.summary.coveragePercentage}% (среднее по тестам: ${report.aggregatedStats.avgCoveragePerTest}%)`);
    console.log(`🎯 Взаимодействий: ${report.aggregatedStats.totalInteractions}`);
    
    if (report.aggregatedStats.mostProductiveTest) {
      console.log(`🏆 Лучший тест: ${report.aggregatedStats.mostProductiveTest.name} (${report.aggregatedStats.mostProductiveTest.elementsCovered} элементов)`);
    }
    
    console.log(`💡 Рекомендаций: ${report.unifiedRecommendations.length}`);
  }

  /**
   * 🧹 Очистка ресурсов
   */
  cleanup() {
    this.testResults.clear();
    this.isInitialized = false;
    console.log('🧹 Глобальный трекер покрытия очищен');
  }
}

// Экспорт синглтона для использования во всех тестах
export const globalCoverageManager = new GlobalCoverageManager();
export default GlobalCoverageManager;