// src/infrastructure/di/bindings.js

import { Container } from './Container.js';

// Импорты реальных реализаций
import { OpenAIProvider } from '../ai/OpenAIProvider.js';
import { MistralProvider } from '../ai/MistralProvider.js';
import { LocalAIProvider } from '../ai/LocalAIProvider.js';
import { FileErrorRepository } from '../repositories/FileErrorRepository.js';
// import { ReporterManager } from '../reporters/ReporterManager.js';
// import { McpClient } from '../mcp/McpClient.js';
import { ConfigLoader } from '../config/ConfigLoader.js';

// Импорты Use Cases
import { AnalyzeTestErrorsUseCase } from '../../application/usecases/AnalyzeTestErrorsUseCase.js';
import { TestDebugService } from '../../application/services/TestDebugService.js';

/**
 * Конфигурирует DI контейнер со всеми зависимостями
 * @returns {Container} - настроенный контейнер
 */
export function configureContainer() {
  const container = new Container();

  // ===== CONFIGURATION =====
  
  container.singleton('configLoader', (c) => {
    return new ConfigLoader();
  });

  container.transient('config', async (c) => {
    const configLoader = c.get('configLoader');
    return await configLoader.loadAiConfig();
  });

  // ===== REPOSITORIES =====
  
  container.singleton('errorRepository', (c) => {
    return new FileErrorRepository();
  });

  // ===== AI PROVIDERS =====

  container.singleton('aiProviderFactory', (c) => {
    return {
      create(providerType, config) {
        switch (providerType.toLowerCase()) {
          case 'openai':
            return new OpenAIProvider();
          case 'mistral':
            return new MistralProvider();
          case 'local':
          case 'ollama':
          case 'lmstudio':
            return new LocalAIProvider();
          case 'auto':
          default:
            // Автоопределение по URL сервера
            if (config.ai_server && config.ai_server.includes('mistral.ai')) {
              return new MistralProvider();
            } else if (config.ai_server && config.ai_server.includes('openai.com')) {
              return new OpenAIProvider();
            } else if (config.ai_server && (
              config.ai_server.includes('localhost') || 
              config.ai_server.includes('127.0.0.1') ||
              config.ai_server.match(/192\.168\.\d+\.\d+/) ||
              config.ai_server.match(/10\.\d+\.\d+\.\d+/) ||
              config.ai_server.match(/172\.\d+\.\d+\.\d+/)
            )) {
              return new LocalAIProvider();
            }
            return new OpenAIProvider();
          case 'claude':
            // TODO: Реализовать ClaudeProvider
            throw new Error('Claude provider not implemented yet. Use OpenAI, Mistral or Local provider.');
        }
      }
    };
  });

  container.singleton('aiProvider', async (c) => {
    const config = await c.get('config');
    const factory = c.get('aiProviderFactory');
    
    // Определяем провайдера на основе конфигурации
    let providerType = 'auto'; // автоопределение
    
    if (config.ai_server && config.ai_server.includes('mistral.ai')) {
      providerType = 'mistral';
    } else if (config.ai_server && config.ai_server.includes('openai.com')) {
      providerType = 'openai';
    } else if (config.ai_server && config.ai_server.includes('claude')) {
      providerType = 'claude';
    } else if (config.ai_server && (
      config.ai_server.includes('localhost') || 
      config.ai_server.includes('127.0.0.1') ||
      config.ai_server.match(/192\.168\.\d+\.\d+/) ||
      config.ai_server.match(/10\.\d+\.\d+\.\d+/) ||
      config.ai_server.match(/172\.\d+\.\d+\.\d+/)
    )) {
      providerType = 'local';
    }
    
    return factory.create(providerType, config);
  });

  // ===== REPORTERS =====

  container.singleton('htmlReporter', async (c) => {
    const config = await c.get('config');
    return {
      async generate(results) {
        const { updateHtmlReport } = await import('../../../lib/updateHtml.js');
        const fs = await import('fs');
        const path = await import('path');
        
        console.log(`🌐 HTML Reporter: Processing ${results.length} results...`);
        
        // Создаем HTML отчет с результатами анализа
        const timestamp = Date.now();
        const reportDir = config.report_dir || 'playwright-report';
        const htmlPath = path.join(reportDir, `ai-analysis-${timestamp}.html`);
        
        // Создаем директорию если не существует
        if (!fs.existsSync(reportDir)) {
          fs.mkdirSync(reportDir, { recursive: true });
          console.log(`📁 Created report directory: ${reportDir}`);
        }
        
        // Генерируем HTML отчет
        const htmlContent = this.generateHTMLReport(results, config);
        fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
        console.log(`📄 Created HTML report: ${htmlPath}`);
        
        // Проверяем, есть ли основной HTML отчет Playwright и интегрируем туда AI анализ
        const mainReportPath = path.join(reportDir, 'index.html');
        if (fs.existsSync(mainReportPath) && results.length > 0) {
          console.log('🔗 Integrating AI analysis into main Playwright report...');
          
          // Импортируем функцию извлечения имени теста
          const { extractTestName } = await import('../../../lib/updateHtml.js');
          
          // Собираем все AI анализы для интеграции
          const aiAnalyses = results
            .filter(result => result.aiResponse?.content)
            .map(result => {
              // Извлекаем имя теста из пути к файлу
              const filePath = result.testError?.filePath || '';
              
              let testName = extractTestName(result.testError?.content || '', filePath) ||
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
            await this.integrateIntoMainReport(mainReportPath, aiAnalyses);
          }
        }
        
        // Также обновляем существующие HTML файлы если они есть
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
      },
      
      async integrateIntoMainReport(mainReportPath, aiAnalyses) {
        const fs = await import('fs');
        const { updateHtmlReport } = await import('../../../lib/updateHtml.js');
        
        try {
          // Интегрируем каждый AI анализ в основной отчет
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
      },
      
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
      },
      
      getName() { return 'HTML Reporter'; }
    };
  });

  container.singleton('allureReporter', async (c) => {
    const config = await c.get('config');
    return {
      async generate(results) {
        const { createAllureAttachment } = await import('../../../lib/sendToAI.js');
        
        console.log(`🎯 Allure Reporter: Processing ${results.length} results...`);
        
        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          if (result.aiResponse && result.testError) {
            
            console.log(`\n📋 Processing result ${i + 1}/${results.length}:`);
            console.log(`   Test error file: ${result.testError.filePath}`);
            console.log(`   Test error content length: ${result.testError.content?.length || 0} chars`);
            console.log(`   AI response length: ${result.aiResponse.content?.length || 0} chars`);
            
            await createAllureAttachment(
              result.aiResponse.content,
              result.testError.content,
              config,
              i,
              result.testError.filePath
            );
          } else {
            console.log(`⚠️  Skipping result ${i + 1}: missing aiResponse or testError`);
            if (!result.aiResponse) console.log(`     Missing aiResponse`);
            if (!result.testError) console.log(`     Missing testError`);
          }
        }
        
        console.log(`\n✅ Allure Reporter: Completed processing ${results.length} results`);
      },
      getName() { return 'Allure Reporter'; }
    };
  });

  container.singleton('markdownReporter', async (c) => {
    const config = await c.get('config');
    return {
      async generate(results) {
        const { saveResponseToMarkdown } = await import('../../../lib/sendToAI.js');
        const fs = await import('fs');
        const path = await import('path');
        
        console.log(`📝 Markdown Reporter: Processing ${results.length} results...`);
        
        const outputDir = config.ai_responses_dir || 'ai-responses';
        
        // Создаем директорию если не существует
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
          console.log(`📁 Created AI responses directory: ${outputDir}`);
        }
        
        // Сохраняем индивидуальные файлы
        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          if (result.aiResponse && result.testError) {
            saveResponseToMarkdown(
              result.aiResponse.content,
              result.testError.content,
              config,
              i
            );
          }
        }
        
        // Создаем общий сводный отчет
        const timestamp = Date.now();
        const summaryPath = path.join(outputDir, `analysis-summary-${timestamp}.md`);
        const summaryContent = this.generateSummaryReport(results, config);
        fs.writeFileSync(summaryPath, summaryContent, 'utf-8');
        console.log(`📄 Created summary report: ${summaryPath}`);
      },
      
      generateSummaryReport(results, config) {
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
      },
      
      getName() { return 'Markdown Reporter'; }
    };
  });

  // Summary Reporter
  container.singleton('summaryReporter', async (c) => {
    const config = await c.get('config');
    const { SummaryReporter } = await import('../reporters/SummaryReporter.js');
    
    return new SummaryReporter(config);
  });

  container.singleton('reporterManager', async (c) => {
    const config = await c.get('config');
    
    const reporters = [];
    
    // Добавляем репортеры на основе конфигурации
    reporters.push(await c.get('htmlReporter')); // всегда включен
    
    if (config.allure_integration) {
      reporters.push(await c.get('allureReporter'));
    }
    
    if (config.save_ai_responses) {
      reporters.push(await c.get('markdownReporter'));
    }
    
    // Общий отчет добавляется отдельно в AnalyzeTestErrorsUseCase
    // if (config.summary_report !== false) {
    //   reporters.push(await c.get('summaryReporter'));
    // }

    return {
      reporters,
      async createReports(results) {
        console.log(`📊 Creating reports using ${this.reporters.length} reporter(s)...`);
        console.log(`📁 Results to process: ${results.length}`);
        console.log(`⚙️  Config directories: ai_responses_dir="${config.ai_responses_dir}", allure_results_dir="${config.allure_results_dir}"`);
        
        for (const reporter of this.reporters) {
          try {
            const reporterName = typeof reporter.getName === 'function' ? reporter.getName() : 'Unknown Reporter';
            console.log(`📄 Running ${reporterName}...`);
            await reporter.generate(results);
            console.log(`✅ ${reporterName} completed successfully`);
          } catch (error) {
            const reporterName = typeof reporter.getName === 'function' ? reporter.getName() : 'Unknown Reporter';
            console.warn(`⚠️  ${reporterName} failed: ${error.message}`);
            console.warn(`   Stack: ${error.stack}`);
          }
        }
        
        console.log(`📊 Report generation completed. Check directories:`);
        console.log(`   📁 AI responses: ${config.ai_responses_dir || 'ai-responses'}`);
        console.log(`   📁 Allure results: ${config.allure_results_dir || 'allure-results'}`);
      },
      addReporter(reporter) {
        this.reporters.push(reporter);
      }
    };
  });

  // ===== MCP CLIENT =====

  container.transient('mcpClient', async (c) => {
    const config = await c.get('config');
    
    if (!config.mcp_integration) {
      return null;
    }

    // TODO: Реализовать новый MCP клиент
    const { McpClient } = await import('../../../lib/mcpClient.js');
    return new McpClient(config);
  });

  // ===== USE CASES =====

  container.singleton('analyzeTestErrorsUseCase', async (c) => {
    const errorRepository = c.get('errorRepository');
    const aiProvider = await c.get('aiProvider');
    const reporterManager = await c.get('reporterManager');
    const mcpClient = await c.get('mcpClient');

    return new AnalyzeTestErrorsUseCase(
      errorRepository,
      aiProvider,
      reporterManager,
      mcpClient
    );
  });

  // ===== SERVICES =====

  container.singleton('testDebugService', async (c) => {
    const analyzeUseCase = await c.get('analyzeTestErrorsUseCase');
    
    return {
      async debugTests(projectPath, options = {}) {
        const config = await c.get('config');
        
        const request = {
          projectPath: projectPath || process.cwd(),
          config,
          useMcp: options.useMcp || false
        };

        return await analyzeUseCase.execute(request);
      }
    };
  });

  // ===== MIDDLEWARE =====

  // Middleware для логирования создания экземпляров
  container.addMiddleware((key, instance, container) => {
    if (process.env.DEBUG_DI) {
      console.log(`🔧 DI: Created instance of '${key}'`);
    }
    return instance;
  });

  // Middleware для обработки ошибок
  container.addMiddleware((key, instance, container) => {
    if (instance && typeof instance === 'object') {
      // Добавляем обработку ошибок для сервисов
      const originalMethods = {};
      
      for (const prop of Object.getOwnPropertyNames(Object.getPrototypeOf(instance))) {
        if (typeof instance[prop] === 'function' && prop !== 'constructor') {
          originalMethods[prop] = instance[prop];
          instance[prop] = async (...args) => {
            try {
              return await originalMethods[prop].apply(instance, args);
            } catch (error) {
              console.error(`❌ Error in ${key}.${prop}:`, error.message);
              throw error;
            }
          };
        }
      }
    }
    
    return instance;
  });

  return container;
}

/**
 * Создает контейнер для тестирования с mock зависимостями
 * @returns {Container}
 */
export function configureTestContainer() {
  const container = new Container();

  // Mock зависимости для тестирования
  container.constant('config', {
    api_key: 'test-key',
    model: 'test-model',
    max_prompt_length: 1000,
    request_delay: 0
  });

  container.singleton('errorRepository', () => ({
    async findErrors() {
      return [
        {
          path: 'test-error.txt',
          content: 'Test error content',
          htmlPath: 'test-report.html'
        }
      ];
    }
  }));

  container.singleton('aiProvider', () => ({
    async generateResponse(prompt) {
      return 'Mock AI response for: ' + prompt.substring(0, 50);
    },
    getProviderName() { return 'Mock Provider'; },
    getSupportedModels() { return ['mock-model']; },
    async validateConfiguration() { return { isValid: true, issues: [] }; }
  }));

  container.singleton('reporterManager', () => ({
    async createReports(results) {
      console.log(`Mock: Created reports for ${results.length} results`);
    }
  }));

  container.constant('mcpClient', null);

  // Use Cases
  container.singleton('analyzeTestErrorsUseCase', (c) => 
    new AnalyzeTestErrorsUseCase(
      c.get('errorRepository'),
      c.get('aiProvider'),
      c.get('reporterManager'),
      c.get('mcpClient')
    )
  );

  // Application Services
  container.singleton('testDebugService', (c) => 
    new TestDebugService(
      c.get('analyzeTestErrorsUseCase'),
      c.get('config')
    )
  );

  return container;
}

/**
 * Получает основной настроенный контейнер (singleton)
 * @returns {Container}
 */
let mainContainer = null;

export function getContainer() {
  if (!mainContainer) {
    mainContainer = configureContainer();
  }
  return mainContainer;
}

/**
 * Сбрасывает основной контейнер (для тестирования)
 */
export function resetContainer() {
  if (mainContainer) {
    mainContainer.clear();
    mainContainer = null;
  }
} 