import fs from 'fs';
import path from 'path';

/**
 * Анализатор покрытия UI-элементов через MCP
 * Использует accessibility tree для оценки покрытия тестами
 */
export class UICoverageAnalyzer {
  constructor(config = {}) {
    this.config = {
      goldenSnapshotsDir: config.goldenSnapshotsDir || 'golden-snapshots',
      coverageReportsDir: config.coverageReportsDir || 'ui-coverage-reports',
      criticalElements: config.criticalElements || [],
      ...config
    };
    
    this.elementStats = {
      buttons: [],
      inputs: [],
      links: [],
      forms: [],
      navigation: [],
      interactive: []
    };
    
    this.coverageReport = {
      totalElements: 0,
      coveredElements: 0,
      missingElements: [],
      unexpectedElements: [],
      criticalElementsStatus: {}
    };
  }

  /**
   * 🌳 1. Анализ дерева доступности из MCP snapshot
   * @param {string} snapshotContent - содержимое snapshot от MCP
   * @returns {Object} структурированное дерево элементов
   */
  parseAccessibilityTree(snapshotContent) {
    const lines = snapshotContent.split('\n');
    const elements = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Парсинг различных типов элементов
      if (trimmed.includes('button')) {
        elements.push(this.parseElement(trimmed, 'button'));
      } else if (trimmed.includes('link')) {
        elements.push(this.parseElement(trimmed, 'link'));
      } else if (trimmed.includes('textbox') || trimmed.includes('input')) {
        elements.push(this.parseElement(trimmed, 'input'));
      } else if (trimmed.includes('navigation')) {
        elements.push(this.parseElement(trimmed, 'navigation'));
      } else if (trimmed.includes('form')) {
        elements.push(this.parseElement(trimmed, 'form'));
      }
    }
    
    return {
      elements,
      totalCount: elements.length,
      byType: this.groupElementsByType(elements)
    };
  }

  /**
   * Парсинг отдельного элемента из строки snapshot
   */
  parseElement(line, type) {
    const element = {
      type,
      text: this.extractText(line),
      url: this.extractUrl(line),
      attributes: this.extractAttributes(line),
      selector: this.generateSelector(line, type),
      line: line.trim()
    };
    
    return element;
  }

  /**
   * ✅ 2. Подсчет элементов и проверка их свойств
   * @param {Object} accessibilityTree - дерево доступности
   * @returns {Object} статистика элементов
   */
  analyzeElementCoverage(accessibilityTree) {
    const stats = {
      buttons: accessibilityTree.byType.button || [],
      inputs: accessibilityTree.byType.input || [],
      links: accessibilityTree.byType.link || [],
      forms: accessibilityTree.byType.form || [],
      navigation: accessibilityTree.byType.navigation || [],
      interactive: []
    };

    // Подсчет интерактивных элементов
    stats.interactive = [
      ...stats.buttons,
      ...stats.inputs,
      ...stats.links.filter(link => link.url && link.url !== '#')
    ];

    // Проверка обязательных атрибутов
    stats.elementsWithAriaLabel = accessibilityTree.elements.filter(
      el => el.attributes.includes('aria-label')
    );
    
    stats.elementsWithRole = accessibilityTree.elements.filter(
      el => el.attributes.includes('role=')
    );

    // Статистика по типам
    stats.summary = {
      totalElements: accessibilityTree.totalCount,
      buttons: stats.buttons.length,
      inputs: stats.inputs.length,
      links: stats.links.length,
      forms: stats.forms.length,
      navigation: stats.navigation.length,
      interactive: stats.interactive.length,
      withAriaLabel: stats.elementsWithAriaLabel.length,
      withRole: stats.elementsWithRole.length
    };

    return stats;
  }

  /**
   * 🔄 3. Автоматическая проверка видимости и доступности
   * @param {Object} currentSnapshot - текущий snapshot
   * @param {Array} criticalElements - критичные элементы для проверки
   * @returns {Object} отчет о проверке
   */
  checkCriticalElements(currentSnapshot, criticalElements = []) {
    const report = {
      allCriticalPresent: true,
      missingCritical: [],
      foundCritical: [],
      recommendations: []
    };

    const allElements = currentSnapshot.elements || [];
    
    for (const critical of criticalElements) {
      const found = allElements.find(el => 
        this.matchesCriticalElement(el, critical)
      );
      
      if (found) {
        report.foundCritical.push({
          ...critical,
          element: found,
          status: 'found'
        });
      } else {
        report.missingCritical.push({
          ...critical,
          status: 'missing'
        });
        report.allCriticalPresent = false;
        
        // Генерация рекомендаций
        report.recommendations.push(
          `❌ Критичный элемент "${critical.name}" (${critical.type}) не найден на странице`
        );
      }
    }

    return report;
  }

  /**
   * Сравнение с "золотой" версией snapshot
   * @param {Object} currentSnapshot - текущий snapshot
   * @param {Object} goldenSnapshot - эталонный snapshot
   * @returns {Object} отчет о различиях
   */
  compareWithGolden(currentSnapshot, goldenSnapshot) {
    const report = {
      identical: true,
      differences: [],
      newElements: [],
      removedElements: [],
      modifiedElements: []
    };

    const currentElements = currentSnapshot.elements || [];
    const goldenElements = goldenSnapshot.elements || [];

    // Поиск новых элементов
    for (const current of currentElements) {
      const found = goldenElements.find(golden => 
        this.elementsMatch(current, golden)
      );
      
      if (!found) {
        report.newElements.push(current);
        report.identical = false;
      }
    }

    // Поиск удаленных элементов
    for (const golden of goldenElements) {
      const found = currentElements.find(current => 
        this.elementsMatch(current, golden)
      );
      
      if (!found) {
        report.removedElements.push(golden);
        report.identical = false;
      }
    }

    // Генерация различий
    if (report.newElements.length > 0) {
      report.differences.push(`➕ Добавлено ${report.newElements.length} элементов`);
    }
    
    if (report.removedElements.length > 0) {
      report.differences.push(`➖ Удалено ${report.removedElements.length} элементов`);
    }

    return report;
  }

  /**
   * ⚙️ 4. Генерация отчета для CI/CD
   * @param {Object} analysisResults - результаты анализа
   * @param {string} pageName - название страницы
   * @returns {Object} структурированный отчет
   */
  generateCoverageReport(analysisResults, pageName = 'unknown') {
    const timestamp = new Date().toISOString();
    
    const report = {
      metadata: {
        pageName,
        timestamp,
        analyzer: 'UICoverageAnalyzer',
        version: '1.0.0'
      },
      
      summary: {
        totalElements: analysisResults.elementStats?.summary?.totalElements || 0,
        interactiveElements: analysisResults.elementStats?.summary?.interactive || 0,
        accessibilityScore: this.calculateAccessibilityScore(analysisResults),
        coveragePercentage: this.calculateCoveragePercentage(analysisResults)
      },
      
      elementBreakdown: analysisResults.elementStats?.summary || {},
      
      criticalElementsCheck: analysisResults.criticalCheck || {},
      
      goldenComparison: analysisResults.goldenComparison || {},
      
      recommendations: this.generateRecommendations(analysisResults),
      
      rawData: {
        elements: analysisResults.accessibilityTree?.elements || [],
        elementStats: analysisResults.elementStats || {}
      }
    };

    return report;
  }

  /**
   * Сохранение отчета в файл
   */
  async saveReport(report, filename) {
    const reportsDir = this.config.coverageReportsDir;
    
    // Создание директории если не существует
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const filePath = path.join(reportsDir, filename);
    
    // Сохранение JSON отчета
    fs.writeFileSync(
      filePath.replace('.md', '.json'), 
      JSON.stringify(report, null, 2)
    );
    
    // Сохранение Markdown отчета
    const markdownReport = this.generateMarkdownReport(report);
    fs.writeFileSync(filePath, markdownReport);
    
    console.log(`📊 UI Coverage отчет сохранен: ${filePath}`);
    
    return filePath;
  }

  /**
   * Генерация Markdown отчета
   */
  generateMarkdownReport(report) {
    return `# 🎯 UI Coverage Report: ${report.metadata.pageName}

## 📊 Сводка

- **Всего элементов:** ${report.summary.totalElements}
- **Интерактивных элементов:** ${report.summary.interactiveElements}
- **Оценка доступности:** ${report.summary.accessibilityScore}%
- **Покрытие тестами:** ${report.summary.coveragePercentage}%
- **Дата анализа:** ${report.metadata.timestamp}

## 🔍 Детализация по типам элементов

| Тип элемента | Количество |
|--------------|------------|
| Кнопки | ${report.elementBreakdown.buttons || 0} |
| Поля ввода | ${report.elementBreakdown.inputs || 0} |
| Ссылки | ${report.elementBreakdown.links || 0} |
| Формы | ${report.elementBreakdown.forms || 0} |
| Навигация | ${report.elementBreakdown.navigation || 0} |

## ✅ Проверка критичных элементов

${this.formatCriticalElementsCheck(report.criticalElementsCheck)}

## 📋 Рекомендации

${report.recommendations.map(rec => `- ${rec}`).join('\n')}

## 🔗 Сравнение с эталоном

${this.formatGoldenComparison(report.goldenComparison)}

---
*Отчет создан автоматически с помощью UICoverageAnalyzer*`;
  }

  // Вспомогательные методы

  extractText(line) {
    const textMatch = line.match(/text[:\s]+"([^"]+)"/);
    return textMatch ? textMatch[1] : '';
  }

  extractUrl(line) {
    const urlMatch = line.match(/\/url[:\s]+"?([^"\s]+)"?/);
    return urlMatch ? urlMatch[1] : '';
  }

  extractAttributes(line) {
    return line; // Упрощенная версия, можно расширить
  }

  generateSelector(line, type) {
    // Упрощенная генерация селектора
    const text = this.extractText(line);
    if (text) {
      return `${type}:has-text("${text}")`;
    }
    return `${type}`;
  }

  groupElementsByType(elements) {
    return elements.reduce((groups, element) => {
      const type = element.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(element);
      return groups;
    }, {});
  }

  matchesCriticalElement(element, critical) {
    return element.type === critical.type && 
           (element.text.includes(critical.name) || 
            element.selector.includes(critical.selector));
  }

  elementsMatch(el1, el2) {
    return el1.type === el2.type && 
           el1.text === el2.text && 
           el1.url === el2.url;
  }

  calculateAccessibilityScore(results) {
    const total = results.elementStats?.summary?.totalElements || 1;
    const withAriaLabel = results.elementStats?.summary?.withAriaLabel || 0;
    const withRole = results.elementStats?.summary?.withRole || 0;
    
    return Math.round(((withAriaLabel + withRole) / (total * 2)) * 100);
  }

  calculateCoveragePercentage(results) {
    // Упрощенный расчет покрытия
    const critical = results.criticalCheck?.foundCritical?.length || 0;
    const totalCritical = (results.criticalCheck?.foundCritical?.length || 0) + 
                         (results.criticalCheck?.missingCritical?.length || 0);
    
    return totalCritical > 0 ? Math.round((critical / totalCritical) * 100) : 100;
  }

  generateRecommendations(results) {
    const recommendations = [];
    
    if (results.criticalCheck?.missingCritical?.length > 0) {
      recommendations.push(
        `🔴 Найдено ${results.criticalCheck.missingCritical.length} отсутствующих критичных элементов`
      );
    }
    
    if (results.goldenComparison?.newElements?.length > 0) {
      recommendations.push(
        `🆕 Обнаружено ${results.goldenComparison.newElements.length} новых элементов - проверьте регрессию`
      );
    }
    
    if (results.goldenComparison?.removedElements?.length > 0) {
      recommendations.push(
        `⚠️ Удалено ${results.goldenComparison.removedElements.length} элементов - возможна потеря функциональности`
      );
    }
    
    const accessibilityScore = this.calculateAccessibilityScore(results);
    if (accessibilityScore < 70) {
      recommendations.push(
        `♿ Низкая оценка доступности (${accessibilityScore}%) - добавьте aria-label и role атрибуты`
      );
    }
    
    return recommendations.length > 0 ? recommendations : ['✅ Все проверки пройдены успешно'];
  }

  formatCriticalElementsCheck(check) {
    if (!check || !check.foundCritical) {
      return 'Проверка критичных элементов не выполнялась';
    }
    
    const found = check.foundCritical.map(el => `✅ ${el.name}`).join('\n');
    const missing = check.missingCritical.map(el => `❌ ${el.name}`).join('\n');
    
    return `${found}\n${missing}`;
  }

  formatGoldenComparison(comparison) {
    if (!comparison || comparison.identical === undefined) {
      return 'Сравнение с эталоном не выполнялось';
    }
    
    if (comparison.identical) {
      return '✅ Страница идентична эталонной версии';
    }
    
    return comparison.differences.join('\n');
  }
} 