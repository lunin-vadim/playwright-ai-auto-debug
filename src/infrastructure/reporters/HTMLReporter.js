// src/infrastructure/reporters/HTMLReporter.js

import fs from 'fs';
import path from 'path';

export class HTMLReporter {
  constructor(config) {
    this.config = config;
  }

  getName() { return 'HTML Reporter'; }

  async generate(results) {
    const { updateHtmlReport, extractTestName } = await import('./htmlUtils.js');

    console.log(`🌐 HTML Reporter: Processing ${results.length} results...`);

    const timestamp = Date.now();
    const reportDir = this.config.report_dir || 'playwright-report';
    const htmlPath = path.join(reportDir, `ai-analysis-${timestamp}.html`);

    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
      console.log(`📁 Created report directory: ${reportDir}`);
    }

    const htmlContent = this.generateHTMLReport(results, this.config);
    fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
    console.log(`📄 Created HTML report: ${htmlPath}`);

    const mainReportPath = path.join(reportDir, 'index.html');
    if (fs.existsSync(mainReportPath) && results.length > 0) {
      console.log('🔗 Integrating AI analysis into main Playwright report...');

      const aiAnalyses = results
        .filter(result => result.aiResponse?.content)
        .map(result => {
          const filePath = result.testError?.filePath || '';
          const testName =
            extractTestName(result.testError?.content || '', filePath) ||
            result.testError?.testName ||
            'Unknown Test';
          return {
            testName,
            errorContent: result.testError?.content || '',
            aiResponse: result.aiResponse?.content || '',
            filePath
          };
        });

      if (aiAnalyses.length > 0) {
        await this.integrateIntoMainReport(mainReportPath, aiAnalyses, updateHtmlReport);
      }
    }

    for (const result of results) {
      if (result.errorFile?.htmlPath) {
        await updateHtmlReport(
          result.errorFile.htmlPath,
          result.testError?.content || '',
          result.aiResponse?.content || ''
        );
        console.log(`🔄 Updated existing HTML: ${result.errorFile.htmlPath}`);
      }
    }
  }

  async integrateIntoMainReport(mainReportPath, aiAnalyses, updateHtmlReport) {
    try {
      for (const analysis of aiAnalyses) {
        await updateHtmlReport(
          mainReportPath,
          analysis.errorContent,
          analysis.aiResponse,
          analysis.testName
        );
      }
      console.log(`✅ Successfully integrated ${aiAnalyses.length} AI analyses into main report`);
    } catch (error) {
      console.error(`❌ Failed to integrate AI analyses: ${error.message}`);
    }
  }

  generateHTMLReport(results, config) {
    const timestamp = new Date().toISOString();
    const successCount = results.filter(r => r.success).length;

    return `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Анализ Ошибок Тестов</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
        .stat-card { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }
        .success { border-left: 4px solid #28a745; }
        .error { border-left: 4px solid #dc3545; }
        .result-item { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 6px; }
        .result-header { font-weight: bold; margin-bottom: 10px; }
        .ai-response { background: #f8f9fa; padding: 15px; border-radius: 4px; margin-top: 10px; }
        pre { background: #f4f4f4; padding: 10px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 AI Анализ Ошибок Тестов</h1>
            <p>Отчет создан: ${timestamp}</p>
        </div>
        <div class="summary">
            <div class="stat-card success">
                <h3>✅ Успешно</h3>
                <div style="font-size: 24px; font-weight: bold;">${successCount}</div>
            </div>
            <div class="stat-card error">
                <h3>❌ Ошибок</h3>
                <div style="font-size: 24px; font-weight: bold;">${results.length - successCount}</div>
            </div>
            <div class="stat-card">
                <h3>📊 Всего</h3>
                <div style="font-size: 24px; font-weight: bold;">${results.length}</div>
            </div>
        </div>
        <div class="results">
            ${results.map((result, index) => `
                <div class="result-item ${result.success ? 'success' : 'error'}">
                    <div class="result-header">
                        ${result.success ? '✅' : '❌'} Файл ${index + 1}: ${result.testError?.filePath || 'Неизвестно'}
                    </div>
                    ${result.testError ? `
                        <p><strong>Тест:</strong> ${result.testError.testName || 'Не определен'}</p>
                        <p><strong>Тип ошибки:</strong> ${result.testError.errorType || 'Неизвестно'}</p>
                    ` : ''}
                    ${result.aiResponse ? `
                        <div class="ai-response">
                            <h4>🤖 AI Рекомендации:</h4>
                            <pre>${result.aiResponse.content}</pre>
                        </div>
                    ` : ''}
                    ${result.error ? `
                        <div style="color: #dc3545; margin-top: 10px;">
                            <strong>Ошибка:</strong> ${result.error}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;
  }
}
