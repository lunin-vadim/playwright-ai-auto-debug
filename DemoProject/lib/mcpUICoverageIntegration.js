import { UICoverageAnalyzer } from './uiCoverageAnalyzer.js';

/**
 * Интеграция MCP с UI Coverage Analyzer
 * Обеспечивает получение реальных DOM snapshots от MCP для анализа покрытия
 */
export class MCPUICoverageIntegration {
  constructor(mcpClient, config = {}) {
    this.mcpClient = mcpClient;
    this.analyzer = new UICoverageAnalyzer(config);
    this.config = {
      autoSaveReports: config.autoSaveReports !== false,
      reportsDir: config.reportsDir || 'ui-coverage-reports',
      enableGoldenComparison: config.enableGoldenComparison || false,
      criticalElements: config.criticalElements || [],
      ...config
    };
  }

  /**
   * 🌳 Получение и анализ accessibility tree через MCP
   * @param {string} pageName - название страницы для отчета
   * @returns {Object} результаты анализа
   */
  async analyzePageCoverage(pageName = 'unknown-page') {
    try {
      console.log(`🔍 Анализ UI покрытия страницы: ${pageName}`);
      
      // 1. Получение snapshot от MCP
      const mcpSnapshot = await this.getMCPSnapshot();
      
      // 2. Парсинг accessibility tree
      const accessibilityTree = this.analyzer.parseAccessibilityTree(mcpSnapshot);
      console.log(`📊 Найдено ${accessibilityTree.totalCount} элементов`);
      
      // 3. Анализ покрытия элементов
      const elementStats = this.analyzer.analyzeElementCoverage(accessibilityTree);
      console.log(`🎯 Интерактивных элементов: ${elementStats.summary.interactive}`);
      
      // 4. Проверка критичных элементов
      const criticalCheck = await this.checkCriticalElements(accessibilityTree);
      
      // 5. Сравнение с эталоном (если включено)
      let goldenComparison = null;
      if (this.config.enableGoldenComparison) {
        goldenComparison = await this.compareWithGolden(accessibilityTree, pageName);
      }
      
      // 6. Генерация отчета
      const analysisResults = {
        accessibilityTree,
        elementStats,
        criticalCheck,
        goldenComparison
      };
      
      const coverageReport = this.analyzer.generateCoverageReport(analysisResults, pageName);
      
      // 7. Автосохранение отчета
      if (this.config.autoSaveReports) {
        await this.saveReport(coverageReport, pageName);
      }
      
      return {
        success: true,
        report: coverageReport,
        analysisResults,
        recommendations: this.generateActionableRecommendations(analysisResults)
      };
      
    } catch (error) {
      console.error(`❌ Ошибка анализа UI покрытия: ${error.message}`);
      return {
        success: false,
        error: error.message,
        recommendations: ['Проверьте подключение к MCP серверу']
      };
    }
  }

  /**
   * Получение snapshot от MCP сервера
   */
  async getMCPSnapshot() {
    if (!this.mcpClient || !this.mcpClient.connected) {
      throw new Error('MCP клиент не подключен');
    }
    
    try {
      const snapshot = await this.mcpClient.getSnapshot();
      if (!snapshot || !snapshot.content) {
        throw new Error('Пустой snapshot от MCP сервера');
      }
      
      return snapshot.content;
    } catch (error) {
      throw new Error(`Ошибка получения MCP snapshot: ${error.message}`);
    }
  }

  /**
   * Проверка критичных элементов с логированием
   */
  async checkCriticalElements(accessibilityTree) {
    const criticalElements = this.config.criticalElements;
    
    if (criticalElements.length === 0) {
      console.log('⚠️ Критичные элементы не настроены');
      return { allCriticalPresent: true, foundCritical: [], missingCritical: [] };
    }
    
    const criticalCheck = this.analyzer.checkCriticalElements(accessibilityTree, criticalElements);
    
    // Логирование результатов
    console.log(`✅ Найдено критичных элементов: ${criticalCheck.foundCritical.length}/${criticalElements.length}`);
    
    if (criticalCheck.missingCritical.length > 0) {
      console.log('❌ Отсутствующие критичные элементы:');
      criticalCheck.missingCritical.forEach(missing => {
        console.log(`   • ${missing.name} (${missing.type})`);
      });
    }
    
    return criticalCheck;
  }

  /**
   * Сравнение с золотой версией
   */
  async compareWithGolden(currentTree, pageName) {
    try {
      const goldenPath = `golden-snapshots/${pageName}.json`;
      const goldenTree = await this.loadGoldenSnapshot(goldenPath);
      
      if (!goldenTree) {
        console.log(`📝 Создание нового эталонного snapshot: ${goldenPath}`);
        await this.saveGoldenSnapshot(currentTree, goldenPath);
        return { identical: true, isNewGolden: true };
      }
      
      const comparison = this.analyzer.compareWithGolden(currentTree, goldenTree);
      
      if (!comparison.identical) {
        console.log('🔄 Обнаружены различия с эталонной версией:');
        comparison.differences.forEach(diff => console.log(`   ${diff}`));
      }
      
      return comparison;
      
    } catch (error) {
      console.warn(`⚠️ Ошибка сравнения с эталоном: ${error.message}`);
      return null;
    }
  }

  /**
   * Загрузка эталонного snapshot
   */
  async loadGoldenSnapshot(path) {
    try {
      const fs = await import('fs');
      if (!fs.existsSync(path)) {
        return null;
      }
      
      const content = fs.readFileSync(path, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.warn(`Не удалось загрузить эталонный snapshot: ${error.message}`);
      return null;
    }
  }

  /**
   * Сохранение эталонного snapshot
   */
  async saveGoldenSnapshot(tree, path) {
    try {
      const fs = await import('fs');
      const pathModule = await import('path');
      
      const dir = pathModule.dirname(path);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(path, JSON.stringify(tree, null, 2));
      console.log(`💾 Эталонный snapshot сохранен: ${path}`);
    } catch (error) {
      console.error(`Ошибка сохранения эталонного snapshot: ${error.message}`);
    }
  }

  /**
   * Сохранение отчета с временной меткой
   */
  async saveReport(report, pageName) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `ui-coverage-${pageName}-${timestamp}.md`;
    
    return await this.analyzer.saveReport(report, filename);
  }

  /**
   * Генерация практических рекомендаций
   */
  generateActionableRecommendations(analysisResults) {
    const recommendations = [];
    const { elementStats, criticalCheck, goldenComparison } = analysisResults;
    
    // Рекомендации по критичным элементам
    if (criticalCheck?.missingCritical?.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Critical Elements',
        message: `Отсутствует ${criticalCheck.missingCritical.length} критичных элементов`,
        action: 'Проверьте наличие обязательных UI компонентов',
        elements: criticalCheck.missingCritical.map(el => el.name)
      });
    }
    
    // Рекомендации по доступности
    const accessibilityScore = this.analyzer.calculateAccessibilityScore(analysisResults);
    if (accessibilityScore < 70) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Accessibility',
        message: `Низкая оценка доступности: ${accessibilityScore}%`,
        action: 'Добавьте aria-label и role атрибуты к элементам',
        target: 'Интерактивные элементы без accessibility атрибутов'
      });
    }
    
    // Рекомендации по изменениям
    if (goldenComparison && !goldenComparison.identical) {
      if (goldenComparison.removedElements?.length > 0) {
        recommendations.push({
          priority: 'HIGH',
          category: 'Regression',
          message: `Удалено ${goldenComparison.removedElements.length} элементов`,
          action: 'Проверьте, не была ли потеряна функциональность',
          elements: goldenComparison.removedElements.map(el => el.text || el.type)
        });
      }
      
      if (goldenComparison.newElements?.length > 0) {
        recommendations.push({
          priority: 'LOW',
          category: 'New Features',
          message: `Добавлено ${goldenComparison.newElements.length} новых элементов`,
          action: 'Обновите тесты для покрытия новой функциональности',
          elements: goldenComparison.newElements.map(el => el.text || el.type)
        });
      }
    }
    
    // Рекомендации по покрытию
    const interactiveCount = elementStats?.summary?.interactive || 0;
    if (interactiveCount < 3) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Test Coverage',
        message: `Мало интерактивных элементов: ${interactiveCount}`,
        action: 'Проверьте, все ли интерактивные элементы загружены',
        target: 'Кнопки, ссылки, поля ввода'
      });
    }
    
    return recommendations;
  }

  /**
   * Генерация CI/CD отчета
   */
  async generateCIReport(pageName, exitOnFailure = false) {
    const result = await this.analyzePageCoverage(pageName);
    
    if (!result.success) {
      console.error('❌ UI Coverage анализ не удался');
      if (exitOnFailure) {
        process.exit(1);
      }
      return result;
    }
    
    const { report, recommendations } = result;
    
    // Вывод краткой сводки для CI
    console.log('\n📊 UI Coverage CI/CD Report:');
    console.log(`   Page: ${pageName}`);
    console.log(`   Total Elements: ${report.summary.totalElements}`);
    console.log(`   Interactive Elements: ${report.summary.interactiveElements}`);
    console.log(`   Accessibility Score: ${report.summary.accessibilityScore}%`);
    console.log(`   Coverage: ${report.summary.coveragePercentage}%`);
    
    // Проверка критичных ошибок
    const criticalIssues = recommendations.filter(rec => rec.priority === 'HIGH');
    
    if (criticalIssues.length > 0) {
      console.log(`\n🔴 Критичные проблемы (${criticalIssues.length}):`);
      criticalIssues.forEach(issue => {
        console.log(`   • ${issue.message}`);
        console.log(`     Действие: ${issue.action}`);
      });
      
      if (exitOnFailure) {
        console.log('\n❌ Сборка прервана из-за критичных проблем UI');
        process.exit(1);
      }
    } else {
      console.log('\n✅ Критичных проблем не обнаружено');
    }
    
    return result;
  }

  /**
   * Пакетный анализ нескольких страниц
   */
  async analyzeBatch(pages, options = {}) {
    const results = [];
    
    console.log(`🔄 Пакетный анализ ${pages.length} страниц...`);
    
    for (const pageName of pages) {
      console.log(`\n📄 Анализ страницы: ${pageName}`);
      
      try {
        // Здесь должна быть навигация к странице через MCP
        // await this.mcpClient.navigateToPage(pageName);
        
        const result = await this.analyzePageCoverage(pageName);
        results.push({ pageName, ...result });
        
        if (options.delay) {
          await new Promise(resolve => setTimeout(resolve, options.delay));
        }
        
      } catch (error) {
        console.error(`❌ Ошибка анализа ${pageName}: ${error.message}`);
        results.push({ 
          pageName, 
          success: false, 
          error: error.message 
        });
      }
    }
    
    // Генерация сводного отчета
    await this.generateBatchReport(results);
    
    return results;
  }

  /**
   * Генерация сводного отчета по пакетному анализу
   */
  async generateBatchReport(results) {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log('\n📊 Сводный отчет пакетного анализа:');
    console.log(`   Успешно проанализировано: ${successful.length}`);
    console.log(`   Ошибок: ${failed.length}`);
    
    if (successful.length > 0) {
      const avgCoverage = successful.reduce((sum, r) => 
        sum + (r.report?.summary?.coveragePercentage || 0), 0) / successful.length;
      const avgAccessibility = successful.reduce((sum, r) => 
        sum + (r.report?.summary?.accessibilityScore || 0), 0) / successful.length;
      
      console.log(`   Среднее покрытие: ${avgCoverage.toFixed(1)}%`);
      console.log(`   Средняя доступность: ${avgAccessibility.toFixed(1)}%`);
    }
    
    // Сохранение сводного отчета
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const batchReport = {
      timestamp,
      summary: {
        total: results.length,
        successful: successful.length,
        failed: failed.length
      },
      results
    };
    
    const fs = await import('fs');
    const reportsDir = this.config.reportsDir;
    
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    fs.writeFileSync(
      `${reportsDir}/batch-report-${timestamp}.json`,
      JSON.stringify(batchReport, null, 2)
    );
    
    console.log(`💾 Сводный отчет сохранен: batch-report-${timestamp}.json`);
  }
} 