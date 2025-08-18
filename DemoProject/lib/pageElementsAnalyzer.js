import fs from 'fs';
import path from 'path';

class PageElementsAnalyzer {
  constructor() {
    this.pageElements = new Map(); // URL -> элементы
    this.coveredElements = new Set(); // покрытые селекторы
    this.interactions = []; // все взаимодействия
  }

  // Сканирование всех элементов на странице
  async scanPageElements(page, testName) {
    try {
      const url = page.url();
      
      // Получаем все интерактивные элементы
      const elements = await page.evaluate(() => {
        const interactiveSelectors = [
          'button',
          'input',
          'select', 
          'textarea',
          'a[href]',
          '[onclick]',
          '[role="button"]',
          '[role="link"]',
          '[role="tab"]',
          '[role="menuitem"]',
          '[tabindex]',
          'form',
          'label',
          '[data-testid]',
          '[data-test]',
          '[id]',
          '.btn',
          '.button',
          '.link',
          '.clickable'
        ];

        const foundElements = [];
        
        interactiveSelectors.forEach(selector => {
          try {
            const elements = document.querySelectorAll(selector);
            elements.forEach((el, index) => {
              // Создаем уникальный селектор
              let uniqueSelector = selector;
              if (elements.length > 1) {
                if (el.id) {
                  uniqueSelector = `#${el.id}`;
                } else if (el.className) {
                  uniqueSelector = `${el.tagName.toLowerCase()}.${el.className.split(' ')[0]}`;
                } else {
                  uniqueSelector = `${selector}:nth-child(${index + 1})`;
                }
              }

              const rect = el.getBoundingClientRect();
              const isVisible = rect.width > 0 && rect.height > 0 && 
                               window.getComputedStyle(el).visibility !== 'hidden' &&
                               window.getComputedStyle(el).display !== 'none';

              foundElements.push({
                selector: uniqueSelector,
                tagName: el.tagName.toLowerCase(),
                type: el.type || null,
                text: el.textContent?.trim().substring(0, 50) || '',
                placeholder: el.placeholder || '',
                value: el.value || '',
                href: el.href || '',
                id: el.id || '',
                className: el.className || '',
                role: el.getAttribute('role') || '',
                ariaLabel: el.getAttribute('aria-label') || '',
                dataTestId: el.getAttribute('data-testid') || el.getAttribute('data-test') || '',
                isVisible,
                position: {
                  x: Math.round(rect.x),
                  y: Math.round(rect.y),
                  width: Math.round(rect.width),
                  height: Math.round(rect.height)
                },
                isClickable: el.tagName.toLowerCase() === 'button' || 
                           el.tagName.toLowerCase() === 'a' ||
                           el.onclick !== null ||
                           el.getAttribute('role') === 'button' ||
                           el.style.cursor === 'pointer',
                isFormElement: ['input', 'select', 'textarea'].includes(el.tagName.toLowerCase())
              });
            });
          } catch (e) {
            console.warn(`Ошибка при сканировании селектора ${selector}:`, e.message);
          }
        });

        return foundElements;
      });

      // Сохраняем элементы для этой страницы
      this.pageElements.set(url, {
        url,
        testName,
        timestamp: Date.now(),
        elements: elements,
        totalElements: elements.length,
        visibleElements: elements.filter(el => el.isVisible).length,
        clickableElements: elements.filter(el => el.isClickable).length,
        formElements: elements.filter(el => el.isFormElement).length
      });

      console.log(`🔍 Найдено ${elements.length} интерактивных элементов на ${url}`);
      console.log(`   Видимых: ${elements.filter(el => el.isVisible).length}`);
      console.log(`   Кликабельных: ${elements.filter(el => el.isClickable).length}`);
      console.log(`   Форм: ${elements.filter(el => el.isFormElement).length}`);

      return elements;
    } catch (error) {
      console.warn('Ошибка сканирования элементов:', error.message);
      return [];
    }
  }

  // Отметить элемент как покрытый
  markElementCovered(selector, action, testName, url) {
    this.coveredElements.add(selector);
    this.interactions.push({
      selector,
      action,
      testName,
      url,
      timestamp: Date.now()
    });
  }

  // Генерация отчета покрытия
  generateCoverageReport() {
    const allPages = Array.from(this.pageElements.values());
    const allElements = allPages.flatMap(page => 
      page.elements.map(el => ({...el, pageUrl: page.url, testName: page.testName}))
    );

    // Анализируем покрытие
    const coveredElements = allElements.filter(el => this.coveredElements.has(el.selector));
    const uncoveredElements = allElements.filter(el => !this.coveredElements.has(el.selector));

    // Группируем по типам
    const elementsByType = {};
    const coverageByType = {};

    allElements.forEach(el => {
      const type = el.tagName;
      elementsByType[type] = (elementsByType[type] || 0) + 1;
      
      if (this.coveredElements.has(el.selector)) {
        coverageByType[type] = (coverageByType[type] || 0) + 1;
      }
    });

    return {
      summary: {
        totalElements: allElements.length,
        coveredElements: coveredElements.length,
        uncoveredElements: uncoveredElements.length,
        coveragePercent: Math.round((coveredElements.length / allElements.length) * 100) || 0,
        totalInteractions: this.interactions.length,
        pagesAnalyzed: allPages.length
      },
      elementsByType,
      coverageByType,
      detailedCoverage: {
        covered: coveredElements,
        uncovered: uncoveredElements
      },
      interactions: this.interactions
    };
  }

  // Сохранение отчетов
  async saveReports(outputDir = './coverage-reports') {
    const reportData = this.generateCoverageReport();
    
    await fs.promises.mkdir(outputDir, { recursive: true });
    
    // JSON отчет
    await fs.promises.writeFile(
      path.join(outputDir, 'elements-coverage-report.json'),
      JSON.stringify(reportData, null, 2)
    );

    // Markdown отчет
    const mdReport = this.generateMarkdownReport(reportData);
    await fs.promises.writeFile(
      path.join(outputDir, 'elements-coverage-report.md'),
      mdReport
    );

    console.log(`\n📊 Отчеты покрытия элементов сохранены:`);
    console.log(`   📊 elements-coverage-report.json - данные для анализа`);
    console.log(`   📝 elements-coverage-report.md - текстовый отчет`);

    return reportData;
  }

  // Markdown отчет
  generateMarkdownReport(reportData) {
    return `# Отчет покрытия UI элементов

## 📊 Сводка

- **Всего элементов**: ${reportData.summary.totalElements}
- **Покрыто тестами**: ${reportData.summary.coveredElements}
- **Не покрыто**: ${reportData.summary.uncoveredElements}
- **Процент покрытия**: ${reportData.summary.coveragePercent}%
- **Страниц проанализировано**: ${reportData.summary.pagesAnalyzed}

## 🎯 Покрытие по типам элементов

${Object.entries(reportData.elementsByType).map(([type, total]) => {
  const covered = reportData.coverageByType[type] || 0;
  const percent = Math.round((covered / total) * 100) || 0;
  return `- **${type.toUpperCase()}**: ${covered}/${total} (${percent}%)`;
}).join('\n')}

## ✅ Покрытые элементы (${reportData.summary.coveredElements})

${reportData.detailedCoverage.covered.map(el => 
  `- \`${el.selector}\` - ${el.tagName.toUpperCase()} "${el.text}" (${el.pageUrl})`
).join('\n')}

${reportData.detailedCoverage.covered.length === 0 ? '\n*Нет покрытых элементов*' : ''}

## ❌ Не покрытые элементы (${reportData.summary.uncoveredElements})

${reportData.detailedCoverage.uncovered.map(el => 
  `- \`${el.selector}\` - ${el.tagName.toUpperCase()} "${el.text}" (${el.pageUrl}) ${el.isVisible ? '👁️' : '🙈'}`
).join('\n')}

## 📊 Детальная статистика взаимодействий

${reportData.interactions.map(interaction => 
  `- **${interaction.action}** на \`${interaction.selector}\` в тесте "${interaction.testName}"`
).join('\n')}

${reportData.interactions.length === 0 ? '\n*Нет записанных взаимодействий*' : ''}

---
*Отчет сгенерирован ${new Date().toLocaleString('ru-RU')}*
`;
  }
}

export { PageElementsAnalyzer }; 