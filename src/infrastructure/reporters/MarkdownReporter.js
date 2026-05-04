// src/infrastructure/reporters/MarkdownReporter.js

import fs from 'fs';
import path from 'path';

export class MarkdownReporter {
  constructor(config) {
    this.config = config;
  }

  getName() { return 'Markdown Reporter'; }

  async generate(results) {
    const { saveResponseToMarkdown } = await import('./allureUtils.js');

    console.log(`📝 Markdown Reporter: Processing ${results.length} results...`);

    const outputDir = this.config.ai_responses_dir || 'ai-responses';

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`📁 Created AI responses directory: ${outputDir}`);
    }

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.aiResponse && result.testError) {
        saveResponseToMarkdown(
          result.aiResponse.content,
          result.testError.content,
          this.config,
          i
        );
      }
    }

    const timestamp = Date.now();
    const summaryPath = path.join(outputDir, `analysis-summary-${timestamp}.md`);
    const summaryContent = this.generateSummaryReport(results);
    fs.writeFileSync(summaryPath, summaryContent, 'utf-8');
    console.log(`📄 Created summary report: ${summaryPath}`);
  }

  generateSummaryReport(results) {
    const timestamp = new Date().toISOString();
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.length - successCount;

    let summary = `# 🤖 AI Анализ Ошибок Тестов\n\n`;
    summary += `**Дата создания:** ${timestamp}\n\n`;
    summary += `## 📊 Сводка\n\n`;
    summary += `- ✅ **Успешно обработано:** ${successCount}/${results.length}\n`;
    summary += `- ❌ **Ошибок:** ${errorCount}/${results.length}\n`;
    summary += `- 📈 **Процент успеха:** ${Math.round((successCount / results.length) * 100)}%\n\n`;

    if (successCount > 0) {
      summary += `## ✅ Успешно проанализированные файлы\n\n`;
      results.filter(r => r.success).forEach((result, index) => {
        summary += `### ${index + 1}. ${result.testError?.testName || 'Неизвестный тест'}\n`;
        summary += `**Файл:** \`${result.testError?.filePath || 'Неизвестно'}\`\n`;
        summary += `**Тип ошибки:** ${result.testError?.errorType || 'Неизвестно'}\n\n`;
        if (result.aiResponse) {
          summary += `**AI Рекомендации:**\n\`\`\`\n${result.aiResponse.content}\n\`\`\`\n\n`;
        }
        summary += `---\n\n`;
      });
    }

    if (errorCount > 0) {
      summary += `## ❌ Ошибки обработки\n\n`;
      results.filter(r => !r.success).forEach((result, index) => {
        summary += `### ${index + 1}. ${result.testError?.filePath || 'Неизвестный файл'}\n`;
        summary += `**Ошибка:** ${result.error || 'Неизвестная ошибка'}\n\n`;
      });
    }

    return summary;
  }
}
