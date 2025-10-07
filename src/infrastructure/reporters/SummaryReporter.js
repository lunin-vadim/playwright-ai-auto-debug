// src/infrastructure/reporters/SummaryReporter.js

import fs from 'fs';
import path from 'path';

/**
 * Репортер для создания общего отчета по всем дефектам
 * Агрегирует результаты анализа всех ошибок в единый отчет
 */
export class SummaryReporter {
  constructor(config) {
    this.config = config;
    this.name = 'Summary Reporter';
  }

  /**
   * Генерирует общий отчет по всем результатам анализа
   * @param {Array} results - массив результатов анализа
   */
  async generate(results) {
    if (!results || results.length === 0) {
      console.log('📊 No results to generate summary report');
      return;
    }

    console.log(`📊 Generating summary report for ${results.length} results...`);

    const summaryData = this.aggregateResults(results);
    
    // Генерируем отчеты в разных форматах
    await this.generateHtmlSummary(summaryData);
    await this.generateMarkdownSummary(summaryData);
    await this.generateJsonSummary(summaryData);

    console.log(`✅ Summary report generated successfully`);
    console.log(`   📁 HTML: ${this.getSummaryPath('html')}`);
    console.log(`   📄 Markdown: ${this.getSummaryPath('md')}`);
    console.log(`   📊 JSON: ${this.getSummaryPath('json')}`);
  }

  /**
   * Агрегирует результаты анализа
   * @param {Array} results - результаты анализа
   * @returns {Object} - агрегированные данные
   */
  aggregateResults(results) {
    const timestamp = new Date().toISOString();
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    // Статистика по типам ошибок
    const errorTypes = {};
    const severities = {};
    const testFiles = new Set();
    
    // Статистика по AI ответам
    let totalConfidence = 0;
    let totalActions = 0;
    let totalRecommendations = 0;
    const aiModels = {};

    // Детальная информация по каждому результату
    const detailedResults = [];

    for (const result of successful) {
      if (result.testError) {
        const errorType = result.testError.errorType || 'unknown';
        const severity = result.testError.severity || 'medium';
        
        errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
        severities[severity] = (severities[severity] || 0) + 1;
        testFiles.add(result.testError.filePath);
      }

      if (result.aiResponse) {
        totalConfidence += result.aiResponse.confidence || 0;
        totalActions += result.aiResponse.actions?.length || 0;
        totalRecommendations += result.aiResponse.recommendations?.length || 0;
        
        const model = result.aiResponse.metadata?.model || 'unknown';
        aiModels[model] = (aiModels[model] || 0) + 1;
      }

      // Добавляем детальную информацию
      detailedResults.push({
        testFile: result.testError?.filePath || 'unknown',
        errorType: result.testError?.errorType || 'unknown',
        severity: result.testError?.severity || 'medium',
        confidence: result.aiResponse?.confidence || 0,
        actionsCount: result.aiResponse?.actions?.length || 0,
        recommendationsCount: result.aiResponse?.recommendations?.length || 0,
        aiModel: result.aiResponse?.metadata?.model || 'unknown',
        processingTime: result.aiResponse?.metadata?.processingTime || 0,
        timestamp: result.timestamp || new Date(),
        success: result.success
      });
    }

    return {
      metadata: {
        generatedAt: timestamp,
        totalResults: results.length,
        successfulResults: successful.length,
        failedResults: failed.length,
        uniqueTestFiles: testFiles.size,
        reportVersion: '1.0.0'
      },
      
      summary: {
        successRate: results.length > 0 ? (successful.length / results.length) * 100 : 0,
        averageConfidence: successful.length > 0 ? (totalConfidence / successful.length) * 100 : 0,
        totalActions,
        totalRecommendations,
        averageProcessingTime: this.calculateAverageProcessingTime(detailedResults)
      },

      statistics: {
        errorTypes: this.sortByCount(errorTypes),
        severities: this.sortByCount(severities),
        aiModels: this.sortByCount(aiModels)
      },

      topIssues: {
        mostCommonErrors: Object.entries(errorTypes)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([type, count]) => ({ type, count })),
        
        highSeverityIssues: detailedResults
          .filter(r => r.severity === 'high' || r.severity === 'critical')
          .length,
        
        lowConfidenceResults: detailedResults
          .filter(r => r.confidence < 0.7)
          .length
      },

      recommendations: this.generateGlobalRecommendations(detailedResults, errorTypes, severities),
      
      detailedResults: detailedResults.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
      
      failedResults: failed.map(r => ({
        testFile: r.testError?.filePath || 'unknown',
        error: r.error || 'Unknown error',
        timestamp: r.timestamp || new Date()
      }))
    };
  }

  /**
   * Генерирует HTML отчет
   */
  async generateHtmlSummary(data) {
    const htmlContent = this.generateHtmlContent(data);
    const filePath = this.getSummaryPath('html');
    
    await this.ensureDirectoryExists(path.dirname(filePath));
    await fs.promises.writeFile(filePath, htmlContent, 'utf8');
  }

  /**
   * Генерирует Markdown отчет
   */
  async generateMarkdownSummary(data) {
    const markdownContent = this.generateMarkdownContent(data);
    const filePath = this.getSummaryPath('md');
    
    await this.ensureDirectoryExists(path.dirname(filePath));
    await fs.promises.writeFile(filePath, markdownContent, 'utf8');
  }

  /**
   * Генерирует JSON отчет
   */
  async generateJsonSummary(data) {
    const jsonContent = JSON.stringify(data, null, 2);
    const filePath = this.getSummaryPath('json');
    
    await this.ensureDirectoryExists(path.dirname(filePath));
    await fs.promises.writeFile(filePath, jsonContent, 'utf8');
  }

  /**
   * Генерирует HTML контент
   */
  generateHtmlContent(data) {
    const { metadata, summary, statistics, topIssues, recommendations, detailedResults, failedResults } = data;
    
    return `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Отчет по дефектам - ${new Date(metadata.generatedAt).toLocaleString('ru')}</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 16px; background: #f8fafc; color: #334155; }
        .container { max-width: 900px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 1.75rem; font-weight: 600; }
        .header p { margin: 8px 0 0 0; opacity: 0.9; font-size: 0.9rem; }
        
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 20px; }
        .stat { background: white; padding: 16px; border-radius: 8px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .stat-value { font-size: 1.5rem; font-weight: 700; color: #3b82f6; }
        .stat-label { font-size: 0.8rem; color: #64748b; margin-top: 4px; }
        
        .section { background: white; border-radius: 8px; padding: 20px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .section h2 { margin: 0 0 16px 0; font-size: 1.25rem; font-weight: 600; color: #1e293b; }
        
        .error-types { display: flex; flex-wrap: wrap; gap: 8px; }
        .error-type { background: #f1f5f9; padding: 8px 12px; border-radius: 6px; font-size: 0.85rem; }
        .error-type .count { background: #3b82f6; color: white; padding: 2px 6px; border-radius: 4px; margin-left: 6px; font-weight: 600; }
        
        .recommendations { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 0 8px 8px 0; }
        .recommendations ul { margin: 0; padding-left: 20px; }
        .recommendations li { margin-bottom: 6px; font-size: 0.9rem; }
        
        .results-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
        .results-table th { background: #f8fafc; padding: 10px 8px; text-align: left; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
        .results-table td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
        .results-table tr:hover { background: #f8fafc; }
        
        .severity-high { color: #dc2626; font-weight: 600; }
        .severity-medium { color: #d97706; font-weight: 600; }
        .severity-low { color: #059669; font-weight: 600; }
        .confidence-high { color: #059669; }
        .confidence-medium { color: #d97706; }
        .confidence-low { color: #dc2626; }
        
        .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 500; }
        .badge-success { background: #dcfce7; color: #166534; }
        .badge-warning { background: #fef3c7; color: #92400e; }
        .badge-error { background: #fecaca; color: #991b1b; }
        
        @media (max-width: 640px) {
            .stats { grid-template-columns: repeat(2, 1fr); }
            .results-table { font-size: 0.8rem; }
            .results-table th, .results-table td { padding: 6px 4px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Отчет по дефектам</h1>
            <p>Сгенерирован: ${new Date(metadata.generatedAt).toLocaleString('ru')}</p>
        </div>
        
        <div class="stats">
            <div class="stat">
                <div class="stat-value">${metadata.totalResults}</div>
                <div class="stat-label">Всего</div>
            </div>
            <div class="stat">
                <div class="stat-value">${metadata.successfulResults}</div>
                <div class="stat-label">Обработано</div>
            </div>
            <div class="stat">
                <div class="stat-value">${summary.successRate.toFixed(0)}%</div>
                <div class="stat-label">Успех</div>
            </div>
            <div class="stat">
                <div class="stat-value">${summary.averageConfidence.toFixed(0)}%</div>
                <div class="stat-label">Уверенность ИИ</div>
            </div>
            <div class="stat">
                <div class="stat-value">${summary.totalActions}</div>
                <div class="stat-label">Действий</div>
            </div>
            <div class="stat">
                <div class="stat-value">${summary.totalRecommendations}</div>
                <div class="stat-label">Рекомендаций</div>
            </div>
        </div>

        ${topIssues.mostCommonErrors.length > 0 ? `
        <div class="section">
            <h2>🔥 Типы ошибок</h2>
            <div class="error-types">
                ${topIssues.mostCommonErrors.map(error => `
                    <div class="error-type">
                        ${error.type}<span class="count">${error.count}</span>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        ${recommendations.length > 0 ? `
        <div class="section">
            <h2>💡 Рекомендации</h2>
            <div class="recommendations">
                <ul>
                    ${recommendations.slice(0, 3).map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        </div>
        ` : ''}

        <div class="section">
            <h2>📋 Результаты (${detailedResults.length})</h2>
            <div style="overflow-x: auto;">
                <table class="results-table">
                    <thead>
                        <tr>
                            <th>Файл</th>
                            <th>Тип</th>
                            <th>Критичность</th>
                            <th>ИИ</th>
                            <th>Действия</th>
                            <th>Время</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${detailedResults.map(result => {
                            // Извлекаем название теста из пути
                            const pathParts = result.testFile.split('/');
                            const testDirName = pathParts[pathParts.length - 2] || '';
                            const testName = testDirName.replace(/^demo-🎯-AI-Debug-Integration-Demo-/, '').replace(/-chromium$/, '');
                            const cleanTestName = testName.replace(/^[a-f0-9]+-/, '') // убираем хеш в начале
                                .replace(/-/g, ' ') // заменяем дефисы на пробелы
                                .replace(/^❌\s*/, '❌ ') // добавляем пробел после эмодзи
                                .replace(/^✅\s*/, '✅ '); // добавляем пробел после эмодзи
                            
                            return `
                            <tr>
                                <td>
                                    <div style="font-weight: 600; color: #1e293b;">${cleanTestName}</div>
                                    <div style="font-size: 0.75rem; color: #64748b; margin-top: 2px;" title="${result.testFile}">${testDirName}</div>
                                </td>
                                <td><span class="badge badge-warning">${result.errorType}</span></td>
                                <td class="severity-${result.severity}">${result.severity.toUpperCase()}</td>
                                <td class="confidence-${this.getConfidenceClass(result.confidence)}">${(result.confidence * 100).toFixed(0)}%</td>
                                <td>${result.actionsCount + result.recommendationsCount}</td>
                                <td>${(result.processingTime / 1000).toFixed(1)}s</td>
                            </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        ${failedResults.length > 0 ? `
        <div class="section">
            <h2>❌ Неудачи (${failedResults.length})</h2>
            <div style="overflow-x: auto;">
                <table class="results-table">
                    <thead>
                        <tr>
                            <th>Файл</th>
                            <th>Ошибка</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${failedResults.map(result => {
                            const pathParts = result.testFile.split('/');
                            const testDirName = pathParts[pathParts.length - 2] || '';
                            const testName = testDirName.replace(/^demo-🎯-AI-Debug-Integration-Demo-/, '').replace(/-chromium$/, '');
                            const cleanTestName = testName.replace(/^[a-f0-9]+-/, '')
                                .replace(/-/g, ' ')
                                .replace(/^❌\s*/, '❌ ')
                                .replace(/^✅\s*/, '✅ ');
                            
                            return `
                            <tr>
                                <td>
                                    <div style="font-weight: 600; color: #1e293b;">${cleanTestName}</div>
                                    <div style="font-size: 0.75rem; color: #64748b; margin-top: 2px;" title="${result.testFile}">${testDirName}</div>
                                </td>
                                <td><span class="badge badge-error">${result.error}</span></td>
                            </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        ` : ''}
        
        <div style="text-align: center; padding: 20px; color: #64748b; font-size: 0.8rem;">
            Сгенерировано playwright-ai-auto-debug
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Генерирует Markdown контент
   */
  generateMarkdownContent(data) {
    const { metadata, summary, statistics, topIssues, recommendations, detailedResults, failedResults } = data;
    
    return `# 🎯 Общий отчет по дефектам

**Сгенерирован:** ${new Date(metadata.generatedAt).toLocaleString('ru')}

## 📊 Основная статистика

| Метрика | Значение |
|---------|----------|
| Всего результатов | ${metadata.totalResults} |
| Успешно обработано | ${metadata.successfulResults} |
| Процент успеха | ${summary.successRate.toFixed(1)}% |
| Средняя уверенность ИИ | ${summary.averageConfidence.toFixed(1)}% |
| Всего действий | ${summary.totalActions} |
| Всего рекомендаций | ${summary.totalRecommendations} |
| Уникальных тестовых файлов | ${metadata.uniqueTestFiles} |

## 🔥 Топ проблем

### Наиболее частые типы ошибок:
${topIssues.mostCommonErrors.map(error => `- **${error.type}**: ${error.count} раз`).join('\n')}

### Критичные показатели:
- ⚠️ **Высокая критичность**: ${topIssues.highSeverityIssues} случаев
- 🤔 **Низкая уверенность ИИ**: ${topIssues.lowConfidenceResults} случаев

## 💡 Общие рекомендации

${recommendations.map(rec => `- ${rec}`).join('\n')}

## 📋 Детальные результаты

| Файл | Тип ошибки | Критичность | Уверенность ИИ | Действия | Рекомендации | Время |
|------|------------|-------------|----------------|----------|--------------|-------|
${detailedResults.map(result => 
  `| ${path.basename(result.testFile)} | ${result.errorType} | ${result.severity} | ${(result.confidence * 100).toFixed(1)}% | ${result.actionsCount} | ${result.recommendationsCount} | ${result.processingTime}ms |`
).join('\n')}

${failedResults.length > 0 ? `
## ❌ Неудачные результаты

| Файл | Ошибка | Время |
|------|--------|-------|
${failedResults.map(result => 
  `| ${path.basename(result.testFile)} | ${result.error} | ${new Date(result.timestamp).toLocaleString('ru')} |`
).join('\n')}
` : ''}

---
*Отчет сгенерирован автоматически системой playwright-ai-auto-debug*
`;
  }

  /**
   * Вспомогательные методы
   */
  getSummaryPath(extension) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dir = this.config.ai_responses_dir || 'ai-responses';
    return path.join(dir, `summary-report-${timestamp}.${extension}`);
  }

  async ensureDirectoryExists(dirPath) {
    try {
      await fs.promises.mkdir(dirPath, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  sortByCount(obj) {
    return Object.entries(obj)
      .sort(([,a], [,b]) => b - a)
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});
  }

  calculateAverageProcessingTime(results) {
    if (results.length === 0) return 0;
    const total = results.reduce((sum, r) => sum + (r.processingTime || 0), 0);
    return Math.round(total / results.length);
  }

  getConfidenceClass(confidence) {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
  }

  generateGlobalRecommendations(results, errorTypes, severities) {
    const recommendations = [];
    
    // Рекомендации на основе типов ошибок
    const topErrorType = Object.keys(errorTypes)[0];
    if (topErrorType) {
      recommendations.push(`Наиболее частая ошибка "${topErrorType}" - рассмотрите возможность улучшения тестовых сценариев для этого типа`);
    }
    
    // Рекомендации на основе критичности
    const highSeverityCount = results.filter(r => r.severity === 'high' || r.severity === 'critical').length;
    if (highSeverityCount > 0) {
      recommendations.push(`Обнаружено ${highSeverityCount} критичных проблем - приоритизируйте их исправление`);
    }
    
    // Рекомендации на основе уверенности ИИ
    const lowConfidenceCount = results.filter(r => r.confidence < 0.7).length;
    if (lowConfidenceCount > 0) {
      recommendations.push(`${lowConfidenceCount} результатов имеют низкую уверенность ИИ - требуется дополнительная проверка`);
    }
    
    // Рекомендации по производительности
    const avgProcessingTime = this.calculateAverageProcessingTime(results);
    if (avgProcessingTime > 5000) {
      recommendations.push(`Среднее время обработки ${avgProcessingTime}ms - рассмотрите оптимизацию промптов или увеличение параллелизма`);
    }
    
    // Общие рекомендации
    recommendations.push('Регулярно анализируйте отчеты для выявления паттернов в ошибках');
    recommendations.push('Используйте MCP интеграцию для получения более точного контекста DOM');
    
    return recommendations;
  }

  getName() {
    return this.name;
  }
}
