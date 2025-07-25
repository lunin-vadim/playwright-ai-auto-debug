const { DetailedCoverageTracker } = require('./detailedCoverageTracker');
const { UICoverageAnalyzer } = require('./uiCoverageAnalyzer');
const { GlobalCoverageManager } = require('./globalCoverageManager');

class AutoCoveragePlugin {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.outputDir = options.outputDir || './coverage-reports';
    this.generateReports = options.generateReports !== false;
    this.trackAllPages = options.trackAllPages !== false;
    
    this.coverageTracker = new DetailedCoverageTracker();
    this.analyzer = new UICoverageAnalyzer();
    this.globalManager = new GlobalCoverageManager();
    
    this.testCoverage = new Map();
    this.currentTest = null;
  }

  // Автоматическая инициализация для каждого теста
  async setupTest(testInfo, page) {
    if (!this.enabled) return;
    
    this.currentTest = {
      title: testInfo.title,
      file: testInfo.file,
      startTime: Date.now(),
      pages: []
    };

    // Автоматический перехват всех навигаций
    page.on('load', async () => {
      await this.trackPageLoad(page);
    });

    // Автоматический перехват всех действий
    this.interceptPageActions(page);
  }

  // Перехват действий без изменения API
  interceptPageActions(page) {
    const originalClick = page.click;
    const originalFill = page.fill;
    const originalSelectOption = page.selectOption;
    const originalCheck = page.check;
    const originalUncheck = page.uncheck;

    page.click = async (selector, options) => {
      await this.trackAction('click', selector, page);
      return originalClick.call(page, selector, options);
    };

    page.fill = async (selector, value, options) => {
      await this.trackAction('fill', selector, page);
      return originalFill.call(page, selector, value, options);
    };

    page.selectOption = async (selector, values, options) => {
      await this.trackAction('select', selector, page);
      return originalSelectOption.call(page, selector, values, options);
    };

    page.check = async (selector, options) => {
      await this.trackAction('check', selector, page);
      return originalCheck.call(page, selector, options);
    };

    page.uncheck = async (selector, options) => {
      await this.trackAction('uncheck', selector, page);
      return originalUncheck.call(page, selector, options);
    };
  }

  // Автоматическое отслеживание загрузки страницы
  async trackPageLoad(page) {
    if (!this.enabled || !this.currentTest) return;

    try {
      const url = page.url();
      const snapshot = await this.getPageSnapshot(page);
      
      const pageData = {
        url,
        timestamp: Date.now(),
        snapshot,
        elements: await this.analyzer.analyzeAccessibilityTree(snapshot),
        coverage: []
      };

      this.currentTest.pages.push(pageData);
      
      if (this.trackAllPages) {
        await this.coverageTracker.trackPageVisit(
          this.currentTest.title,
          url,
          snapshot
        );
      }
    } catch (error) {
      console.warn('Auto coverage tracking failed for page load:', error.message);
    }
  }

  // Автоматическое отслеживание действий
  async trackAction(action, selector, page) {
    if (!this.enabled || !this.currentTest) return;

    try {
      const url = page.url();
      const element = await page.locator(selector).first();
      
      // Получаем информацию об элементе
      const elementInfo = await element.evaluate((el) => ({
        tagName: el.tagName,
        type: el.type || null,
        role: el.getAttribute('role'),
        ariaLabel: el.getAttribute('aria-label'),
        text: el.textContent?.trim() || '',
        id: el.id,
        className: el.className
      }));

      await this.coverageTracker.trackInteraction(
        this.currentTest.title,
        selector,
        action,
        elementInfo
      );

      // Добавляем в покрытие текущего теста
      const currentPage = this.currentTest.pages[this.currentTest.pages.length - 1];
      if (currentPage) {
        currentPage.coverage.push({
          action,
          selector,
          element: elementInfo,
          timestamp: Date.now()
        });
      }

    } catch (error) {
      console.warn('Auto coverage tracking failed for action:', error.message);
    }
  }

  // Завершение теста и сохранение данных
  async finishTest(testInfo) {
    if (!this.enabled || !this.currentTest) return;

    this.currentTest.endTime = Date.now();
    this.currentTest.duration = this.currentTest.endTime - this.currentTest.startTime;
    this.currentTest.status = testInfo.status;

    // Сохраняем данные теста
    this.testCoverage.set(this.currentTest.title, this.currentTest);

    // Обновляем глобальную статистику
    for (const page of this.currentTest.pages) {
      for (const coverage of page.coverage) {
        await this.globalManager.recordInteraction(
          coverage.selector,
          coverage.action,
          this.currentTest.title,
          page.url
        );
      }
    }

    this.currentTest = null;
  }

  // Генерация отчетов в конце всех тестов
  async generateFinalReports() {
    if (!this.enabled || !this.generateReports) return;

    try {
      // Детальный отчет по всем тестам
      const detailedReport = await this.coverageTracker.generateDetailedReport();
      
      // Глобальный отчет
      const globalReport = await this.globalManager.generateGlobalReport();
      
      // Сводный отчет
      const summaryReport = this.generateSummaryReport();

      // Сохраняем отчеты
      const fs = require('fs').promises;
      const path = require('path');
      
      await fs.mkdir(this.outputDir, { recursive: true });
      
      await Promise.all([
        fs.writeFile(
          path.join(this.outputDir, 'auto-coverage-detailed.json'),
          JSON.stringify(detailedReport, null, 2)
        ),
        fs.writeFile(
          path.join(this.outputDir, 'auto-coverage-global.json'),
          JSON.stringify(globalReport, null, 2)
        ),
        fs.writeFile(
          path.join(this.outputDir, 'auto-coverage-summary.json'),
          JSON.stringify(summaryReport, null, 2)
        ),
        fs.writeFile(
          path.join(this.outputDir, 'auto-coverage-summary.md'),
          this.generateMarkdownReport(summaryReport)
        )
      ]);

      console.log(`📊 Автоматические отчеты покрытия сохранены в ${this.outputDir}`);
      
    } catch (error) {
      console.error('Ошибка генерации автоматических отчетов:', error);
    }
  }

  // Получение снимка страницы
  async getPageSnapshot(page) {
    try {
      // Простой снимок через accessibility tree
      const accessibilityTree = await page.accessibility.snapshot();
      return { accessibilityTree, url: page.url(), timestamp: Date.now() };
    } catch (error) {
      console.warn('Failed to get page snapshot:', error.message);
      return { error: error.message, url: page.url(), timestamp: Date.now() };
    }
  }

  // Генерация сводного отчета
  generateSummaryReport() {
    const tests = Array.from(this.testCoverage.values());
    const totalTests = tests.length;
    const passedTests = tests.filter(t => t.status === 'passed').length;
    const failedTests = tests.filter(t => t.status === 'failed').length;

    const allInteractions = tests.flatMap(test => 
      test.pages.flatMap(page => page.coverage)
    );

    const uniqueSelectors = new Set(allInteractions.map(i => i.selector));
    const actionTypes = {};
    
    allInteractions.forEach(interaction => {
      actionTypes[interaction.action] = (actionTypes[interaction.action] || 0) + 1;
    });

    return {
      summary: {
        totalTests,
        passedTests,
        failedTests,
        totalInteractions: allInteractions.length,
        uniqueElements: uniqueSelectors.size,
        actionTypes
      },
      tests: tests.map(test => ({
        title: test.title,
        status: test.status,
        duration: test.duration,
        pagesVisited: test.pages.length,
        interactions: test.pages.reduce((sum, page) => sum + page.coverage.length, 0)
      })),
      elements: Array.from(uniqueSelectors).map(selector => {
        const interactions = allInteractions.filter(i => i.selector === selector);
        return {
          selector,
          interactionCount: interactions.length,
          actions: [...new Set(interactions.map(i => i.action))],
          tests: [...new Set(interactions.map(i => 
            tests.find(t => t.pages.some(p => p.coverage.includes(i)))?.title
          ))]
        };
      })
    };
  }

  // Генерация Markdown отчета
  generateMarkdownReport(summaryReport) {
    return `# Автоматический отчет покрытия UI

## Сводка

- **Всего тестов**: ${summaryReport.summary.totalTests}
- **Прошедших**: ${summaryReport.summary.passedTests}
- **Упавших**: ${summaryReport.summary.failedTests}
- **Всего взаимодействий**: ${summaryReport.summary.totalInteractions}
- **Уникальных элементов**: ${summaryReport.summary.uniqueElements}

## Типы действий

${Object.entries(summaryReport.summary.actionTypes)
  .map(([action, count]) => `- **${action}**: ${count}`)
  .join('\n')}

## Покрытие элементов

${summaryReport.elements
  .sort((a, b) => b.interactionCount - a.interactionCount)
  .slice(0, 20)
  .map(element => `
### \`${element.selector}\`
- **Взаимодействий**: ${element.interactionCount}
- **Действия**: ${element.actions.join(', ')}
- **Тесты**: ${element.tests.join(', ')}
`).join('\n')}

## Детали тестов

${summaryReport.tests.map(test => `
### ${test.title}
- **Статус**: ${test.status}
- **Длительность**: ${test.duration}ms
- **Страниц**: ${test.pagesVisited}
- **Взаимодействий**: ${test.interactions}
`).join('\n')}
`;
  }
}

module.exports = { AutoCoveragePlugin }; 