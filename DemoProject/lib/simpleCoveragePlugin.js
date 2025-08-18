import fs from 'fs';
import path from 'path';
import { PageElementsAnalyzer } from './pageElementsAnalyzer.js';

// Глобальный экземпляр анализатора для сохранения состояния между тестами
let globalElementsAnalyzer = null;

class SimpleCoveragePlugin {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.outputDir = options.outputDir || './coverage-reports';
    this.generateReports = options.generateReports !== false;
    
    // Используем глобальный анализатор или создаем новый
    if (!globalElementsAnalyzer) {
      globalElementsAnalyzer = new PageElementsAnalyzer();
    }
    this.elementsAnalyzer = globalElementsAnalyzer;
    
    this.testCoverage = new Map();
    this.allInteractions = [];
    this.currentTest = null;
    
    // Принудительно очищаем старые данные при каждом создании
    this.clearOldData();
  }
  
  // Очистка старых данных
  clearOldData() {
    console.log('🧹 Принудительная очистка всех данных покрытия...');
    
    // Очищаем данные анализатора
    this.elementsAnalyzer.coveredElements.clear();
    this.elementsAnalyzer.interactions = [];
    this.elementsAnalyzer.pageElements.clear();
    
    // Очищаем данные плагина
    this.allInteractions = [];
    this.testCoverage.clear();
    
    // Пересоздаем глобальный анализатор для полной очистки
    globalElementsAnalyzer = new PageElementsAnalyzer();
    this.elementsAnalyzer = globalElementsAnalyzer;
  }

  // Автоматическая инициализация для каждого теста
  async setupTest(testInfo, page) {
    if (!this.enabled) return;
    
    this.currentTest = {
      title: testInfo.title,
      file: testInfo.file,
      startTime: Date.now(),
      interactions: []
    };

    console.log(`📊 Начало отслеживания покрытия для теста: ${testInfo.title}`);

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
    const originalGoto = page.goto;
    const originalLocator = page.locator;

    // Перехват прямых методов страницы
    page.click = async (selector, options) => {
      await this.trackAction('click', selector, page);
      return originalClick.call(page, selector, options);
    };

    page.fill = async (selector, value, options) => {
      await this.trackAction('fill', selector, page, { value });
      return originalFill.call(page, selector, value, options);
    };

    page.selectOption = async (selector, values, options) => {
      await this.trackAction('select', selector, page, { values });
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

    page.goto = async (url, options) => {
      await this.trackAction('navigate', url, page);
      const result = await originalGoto.call(page, url, options);
      
      // Сканируем элементы после загрузки страницы
      await this.scanPageElements(page);
      
      return result;
    };

    // Перехват методов локаторов
    page.locator = (selector, options) => {
      const locator = originalLocator.call(page, selector, options);
      
      // Перехватываем методы локатора
      const originalLocatorClick = locator.click;
      const originalLocatorFill = locator.fill;
      const originalLocatorCheck = locator.check;
      const originalLocatorUncheck = locator.uncheck;
      const originalLocatorSelectOption = locator.selectOption;

      locator.click = async (options) => {
        await this.trackAction('click', selector, page);
        return originalLocatorClick.call(locator, options);
      };

      locator.fill = async (value, options) => {
        await this.trackAction('fill', selector, page, { value });
        return originalLocatorFill.call(locator, value, options);
      };

      locator.check = async (options) => {
        await this.trackAction('check', selector, page);
        return originalLocatorCheck.call(locator, options);
      };

      locator.uncheck = async (options) => {
        await this.trackAction('uncheck', selector, page);
        return originalLocatorUncheck.call(locator, options);
      };

      locator.selectOption = async (values, options) => {
        await this.trackAction('select', selector, page, { values });
        return originalLocatorSelectOption.call(locator, values, options);
      };

      return locator;
    };
  }

  // Автоматическое отслеживание действий
  async trackAction(action, selector, page, extra = {}) {
    if (!this.enabled || !this.currentTest) return;

    try {
      const url = page.url();
      const timestamp = Date.now();
      
      let elementInfo = {};
      
      // Получаем информацию об элементе если это не навигация
      if (action !== 'navigate') {
        try {
          const element = await page.locator(selector).first();
          elementInfo = await element.evaluate((el) => ({
            tagName: el.tagName,
            type: el.type || null,
            role: el.getAttribute('role'),
            ariaLabel: el.getAttribute('aria-label'),
            text: el.textContent?.trim() || '',
            id: el.id,
            className: el.className
          }));
        } catch (error) {
          elementInfo = { error: 'Element not found or not accessible' };
        }
      }

      const interaction = {
        action,
        selector,
        element: elementInfo,
        url,
        timestamp,
        test: this.currentTest.title,
        ...extra
      };

      this.currentTest.interactions.push(interaction);
      this.allInteractions.push(interaction);
      
      // Отмечаем элемент как покрытый
      this.elementsAnalyzer.markElementCovered(selector, action, this.currentTest.title, url);
      
      console.log(`  ✓ ${action}: ${selector} (${url})`);
      console.log(`  📊 Элемент отмечен как покрытый в анализаторе`);

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

    console.log(`📊 Завершено отслеживание для теста: ${this.currentTest.title}`);
    console.log(`   Взаимодействий: ${this.currentTest.interactions.length}`);
    console.log(`   Длительность: ${this.currentTest.duration}ms`);
    console.log(`   Статус: ${this.currentTest.status}`);

    // Сохраняем данные теста
    this.testCoverage.set(this.currentTest.title, this.currentTest);

    this.currentTest = null;
  }

  // Автоматическое сканирование элементов на странице
  async scanPageElements(page) {
    if (!this.enabled || !this.currentTest) return;

    try {
      await this.elementsAnalyzer.scanPageElements(page, this.currentTest.title);
    } catch (error) {
      console.warn('Ошибка сканирования элементов страницы:', error.message);
    }
  }

  // Генерация отчетов в конце всех тестов
  async generateFinalReports() {
    if (!this.enabled || !this.generateReports) return;

    try {
      console.log(`\n🔍 Генерация отчетов:`);
      console.log(`   Всего взаимодействий: ${this.allInteractions.length}`);
      console.log(`   Покрытых элементов в анализаторе: ${this.elementsAnalyzer.coveredElements.size}`);
      
      const summaryReport = this.generateSummaryReport();

      // Создаем папку для отчетов
      await fs.promises.mkdir(this.outputDir, { recursive: true });
      
      // СНАЧАЛА генерируем отчет по элементам
      await this.elementsAnalyzer.saveReports(this.outputDir);
      
      // ПОТОМ сохраняем наши отчеты
      await Promise.all([
        fs.promises.writeFile(
          path.join(this.outputDir, 'simple-coverage-summary.json'),
          JSON.stringify(summaryReport, null, 2)
        ),
        fs.promises.writeFile(
          path.join(this.outputDir, 'simple-coverage-summary.md'),
          this.generateMarkdownReport(summaryReport)
        ),
        (async () => {
          console.log(`📝 Записываю ${this.allInteractions.length} взаимодействий в файл...`);
          console.log(`📝 Первое взаимодействие:`, this.allInteractions[0]);
          await fs.promises.writeFile(
            path.join(this.outputDir, 'simple-coverage-interactions.json'),
            JSON.stringify(this.allInteractions, null, 2)
          );
          console.log(`✅ Файл simple-coverage-interactions.json записан успешно`);
        })()
      ]);

      console.log(`\n📊 Автоматические отчеты покрытия сохранены в ${this.outputDir}`);
      console.log(`📄 Файлы:`);
      console.log(`   • simple-coverage-summary.json - сводная статистика`);
      console.log(`   • simple-coverage-summary.md - человекочитаемый отчет`);
      console.log(`   • simple-coverage-interactions.json - все взаимодействия`);
      console.log(`   • elements-coverage-report.json - анализ всех элементов`);
      console.log(`   • elements-coverage-report.md - покрытие элементов`);
      
    } catch (error) {
      console.error('Ошибка генерации автоматических отчетов:', error);
    }
  }

  // Генерация сводного отчета
  generateSummaryReport() {
    const tests = Array.from(this.testCoverage.values());
    const totalTests = tests.length;
    const passedTests = tests.filter(t => t.status === 'passed').length;
    const failedTests = tests.filter(t => t.status === 'failed').length;

    const uniqueSelectors = new Set(this.allInteractions.map(i => i.selector));
    const actionTypes = {};
    
    this.allInteractions.forEach(interaction => {
      actionTypes[interaction.action] = (actionTypes[interaction.action] || 0) + 1;
    });

    const elementsByType = {};
    this.allInteractions.forEach(interaction => {
      if (interaction.element && interaction.element.tagName) {
        const tag = interaction.element.tagName.toLowerCase();
        elementsByType[tag] = (elementsByType[tag] || 0) + 1;
      }
    });

    return {
      summary: {
        totalTests,
        passedTests,
        failedTests,
        totalInteractions: this.allInteractions.length,
        uniqueElements: uniqueSelectors.size,
        actionTypes,
        elementsByType
      },
      tests: tests.map(test => ({
        title: test.title,
        status: test.status,
        duration: test.duration,
        interactions: test.interactions.length,
        uniqueSelectors: new Set(test.interactions.map(i => i.selector)).size
      })),
      topElements: Array.from(uniqueSelectors).map(selector => {
        const interactions = this.allInteractions.filter(i => i.selector === selector);
        return {
          selector,
          interactionCount: interactions.length,
          actions: [...new Set(interactions.map(i => i.action))],
          tests: [...new Set(interactions.map(i => i.test))]
        };
      }).sort((a, b) => b.interactionCount - a.interactionCount).slice(0, 10)
    };
  }

  // Генерация Markdown отчета
  generateMarkdownReport(summaryReport) {
    return `# Автоматический отчет покрытия UI

## 📊 Сводка

- **Всего тестов**: ${summaryReport.summary.totalTests}
- **Прошедших**: ${summaryReport.summary.passedTests}
- **Упавших**: ${summaryReport.summary.failedTests}
- **Всего взаимодействий**: ${summaryReport.summary.totalInteractions}
- **Уникальных элементов**: ${summaryReport.summary.uniqueElements}

## 🎯 Типы действий

${Object.entries(summaryReport.summary.actionTypes)
  .map(([action, count]) => `- **${action}**: ${count}`)
  .join('\n')}

## 🏷️ Элементы по типам

${Object.entries(summaryReport.summary.elementsByType)
  .map(([tag, count]) => `- **${tag}**: ${count}`)
  .join('\n')}

## 🔝 Топ элементов по взаимодействиям

${summaryReport.topElements.map((element, index) => `
### ${index + 1}. \`${element.selector}\`
- **Взаимодействий**: ${element.interactionCount}
- **Действия**: ${element.actions.join(', ')}
- **Тесты**: ${element.tests.join(', ')}
`).join('\n')}

## 📝 Детали тестов

${summaryReport.tests.map(test => `
### ${test.title}
- **Статус**: ${test.status === 'passed' ? '✅ Прошел' : '❌ Упал'}
- **Длительность**: ${test.duration}ms
- **Взаимодействий**: ${test.interactions}
- **Уникальных селекторов**: ${test.uniqueSelectors}
`).join('\n')}

---
*Отчет сгенерирован автоматически ${new Date().toLocaleString('ru-RU')}*
`;
  }
}

export { SimpleCoveragePlugin }; 