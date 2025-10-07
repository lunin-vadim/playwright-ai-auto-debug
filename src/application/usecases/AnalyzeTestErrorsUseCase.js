// src/application/usecases/AnalyzeTestErrorsUseCase.js

import { TestError } from '../../domain/entities/TestError.js';
import { AIResponse } from '../../domain/entities/AIResponse.js';

/**
 * Use Case для анализа ошибок тестов
 * Оркестрирует весь процесс анализа от поиска ошибок до создания отчетов
 */
export class AnalyzeTestErrorsUseCase {
  constructor(errorRepository, aiProvider, reporterManager, mcpClient = null) {
    this.errorRepository = errorRepository;
    this.aiProvider = aiProvider;
    this.reporterManager = reporterManager;
    this.mcpClient = mcpClient;
  }

  /**
   * Выполняет анализ ошибок тестов
   * @param {Object} request - запрос на анализ
   * @param {string} request.projectPath - путь к проекту
   * @param {Object} request.config - конфигурация
   * @param {boolean} request.useMcp - использовать MCP для DOM snapshots
   * @returns {Promise<Object>} - результат анализа
   */
  async execute(request) {
    const { projectPath, config, useMcp = false, parallel } = request;
    
    console.log('🚀 Starting test error analysis...');
    console.log(`📁 Project path: ${projectPath}`);
    console.log(`🤖 AI Provider: ${this.aiProvider.getProviderName()}`);
    console.log(`🔗 MCP enabled: ${useMcp && this.mcpClient ? 'Yes' : 'No'}`);
    console.log(`⚙️  Configuration check:`);
    console.log(`   📝 save_ai_responses: ${config.save_ai_responses}`);
    console.log(`   📁 ai_responses_dir: ${config.ai_responses_dir}`);
    console.log(`   📊 allure_integration: ${config.allure_integration}`);
    console.log(`   📁 allure_results_dir: ${config.allure_results_dir}`);
    console.log(`   🌐 report_dir: ${config.report_dir}`);

    const results = {
      success: false,
      processed: 0,
      errors: 0,
      total: 0,
      analysisResults: [],
      summary: null,
      startTime: new Date(),
      endTime: null,
      processingTime: 0
    };

    try {
      // 1. Инициализация MCP клиента (если требуется)
      if (useMcp && this.mcpClient) {
        console.log('🔗 Initializing MCP client...');
        const mcpStarted = await this.mcpClient.start();
        
        if (!mcpStarted) {
          console.warn('⚠️  MCP client failed to start, continuing without MCP');
          this.mcpClient = null;
        }
      }

      // 2. Поиск файлов ошибок
      console.log('🔍 Searching for error files...');
      const errorFiles = await this.errorRepository.findErrors(projectPath, config);
      
      if (errorFiles.length === 0) {
        console.log('ℹ️  No error files found');
        results.success = true;
        results.endTime = new Date();
        results.processingTime = results.endTime - results.startTime;
        return results;
      }

      console.log(`📋 Found ${errorFiles.length} error file(s)`);
      results.total = errorFiles.length;
      
      // 3. Параллельная/последовательная обработка ошибок с ограничением concurrency
      const parallelEnabled = config.parallel_enabled !== false;
      const maxConcurrency = Math.max(1, Number(parallel || config.parallel_limit || 1));
      console.log(`⚙️  Parallel: ${parallelEnabled ? 'ON' : 'OFF'} | Workers: ${parallelEnabled ? maxConcurrency : 1}`);

      const processOne = async (testError, index) => {
        console.log(`\n📝 Processing ${index + 1}/${errorFiles.length}: ${testError.filePath}`);

        try {
          // TestError уже создан в repository, просто используем его

          console.log(`🎯 Error type: ${testError.errorType}`);
          console.log(`📊 Severity: ${testError.severity}`);
          console.log(`🔤 Keywords: ${testError.keywords.slice(0, 3).join(', ')}${testError.keywords.length > 3 ? '...' : ''}`);

          // Получаем DOM snapshot если MCP доступен
          let domSnapshot = null;
          if (this.mcpClient && testError.hasDomContext()) {
            try {
              console.log('📸 Getting DOM snapshot from MCP...');
              domSnapshot = await this.mcpClient.getSnapshot();
              console.log(`✅ DOM snapshot received: ${domSnapshot.elements?.length || 0} elements`);
            } catch (error) {
              console.warn(`⚠️  Failed to get DOM snapshot: ${error.message}`);
            }
          }

          // Подготавливаем промпт с учетом лимитов
          const maxLength = config.max_prompt_length || 2000;
          const truncatedContent = testError.content.length > maxLength 
            ? testError.content.substring(0, maxLength) + '\n...(content truncated)'
            : testError.content;

          console.log(`📏 Content length: ${testError.content.length} chars${testError.content.length > maxLength ? ' (truncated)' : ''}`);

          // Генерируем ответ ИИ
          console.log('🤖 Generating AI response...');
          const startTime = Date.now();
          
          const rawResponse = await this.aiProvider.generateResponse(
            truncatedContent,
            config,
            domSnapshot
          );

          const processingTime = Date.now() - startTime;
          console.log(`⏱️  AI response generated in ${processingTime}ms`);

          if (!rawResponse || rawResponse.trim().length === 0) {
            throw new Error('Empty response from AI provider');
          }

          // Создаем доменную сущность ответа ИИ
          const aiResponse = new AIResponse(rawResponse, testError, {
            model: config.model,
            provider: this.aiProvider.getProviderName(),
            processingTime,
            timestamp: new Date()
          });

          console.log(`📊 Response confidence: ${Math.round(aiResponse.confidence * 100)}%`);
          console.log(`🎬 Actions found: ${aiResponse.actions.length}`);
          console.log(`💡 Recommendations: ${aiResponse.recommendations.length}`);

          // Валидация качества ответа
          const qualityCheck = aiResponse.validateQuality();
          if (qualityCheck.warnings.length > 0) {
            console.warn('⚠️  Quality warnings:', qualityCheck.warnings);
          }

          // Валидация действий через MCP (если доступен)
          if (this.mcpClient && aiResponse.hasExecutableCode()) {
            try {
              console.log('🧪 Validating actions through MCP...');
              const validationResults = await this.validateActionsViaMcp(aiResponse);
              
              // Обогащаем ответ результатами валидации
              aiResponse.mcpValidation = validationResults;
              console.log(`✅ MCP validation: ${validationResults.successfulActions}/${validationResults.totalActions} successful`);
            } catch (error) {
              console.warn(`⚠️  MCP validation failed: ${error.message}`);
            }
          }

          // Создаем отчеты
          console.log('📄 Creating reports...');
          console.log(`📝 Report data: testError=${!!testError}, aiResponse=${!!aiResponse}`);
          console.log(`📁 Test file: ${testError?.filePath || 'Unknown'}`);
          console.log(`🤖 AI response length: ${aiResponse?.content?.length || 0} chars`);
          
          await this.reporterManager.createReports([{
            testError,
            aiResponse,
            errorFile: testError,
            timestamp: new Date(),
            success: true
          }]);

          results.analysisResults.push({
            testError,
            aiResponse,
            errorFile: testError,
            success: true
          });

          results.processed++;
          console.log(`✅ Successfully processed file ${index + 1}/${errorFiles.length}`);

          // Пауза между запросами для соблюдения rate limits (только при последовательной или малой конкуренции)
          if (!parallelEnabled || maxConcurrency === 1) {
            if (index < errorFiles.length - 1) {
              const delay = config.request_delay || 1000;
              console.log(`⏳ Waiting ${delay}ms before next request...`);
              await this.sleep(delay);
            }
          }

        } catch (error) {
          results.errors++;
          console.error(`❌ Error processing ${testError.filePath}: ${error.message}`);
          
          // Улучшенная обработка ошибок с конкретными рекомендациями
          this.handleProcessingError(error, testError.filePath);
          
          results.analysisResults.push({
            testError: testError,
            aiResponse: null,
            errorFile: testError,
            success: false,
            error: error.message
          });
        }
      };

      if (!parallelEnabled || maxConcurrency === 1) {
        for (let i = 0; i < errorFiles.length; i++) {
          await processOne(errorFiles[i], i);
        }
      } else {
        // Простая параллельная обработка с ограничением concurrency
        const promises = [];
        for (let i = 0; i < errorFiles.length; i += maxConcurrency) {
          const batch = errorFiles.slice(i, i + maxConcurrency);
          const batchPromises = batch.map((errorFile, batchIndex) => 
            processOne(errorFile, i + batchIndex)
          );
          await Promise.all(batchPromises);
        }
      }

      // 4. Создание общего резюме
      results.summary = this.createSummary(results);
      results.success = results.errors === 0;
      results.endTime = new Date();
      results.processingTime = results.endTime - results.startTime;

      // 6. Финальный отчет
      console.log(`\n📊 Analysis Summary:`);
      console.log(`   ✅ Successfully processed: ${results.processed}/${results.total}`);
      console.log(`   ❌ Errors encountered: ${results.errors}/${results.total}`);
      console.log(`   ⏱️  Total processing time: ${results.processingTime}ms`);

      if (results.summary.topErrorTypes.length > 0) {
        console.log(`   🎯 Top error types: ${results.summary.topErrorTypes.slice(0, 3).join(', ')}`);
      }

      console.log(`\n📄 Generated Reports:`);
      console.log(`   🌐 HTML Report: ${config.report_dir || 'playwright-report'}/ai-analysis-*.html`);
      console.log(`   📝 Markdown Reports: ${config.ai_responses_dir || 'ai-responses'}/`);
      if (config.allure_integration) {
        console.log(`   📊 Allure Attachments: ${config.allure_results_dir || 'allure-results'}/`);
      }
      if (config.summary_report !== false) {
        console.log(`   📋 Summary Report: ${config.ai_responses_dir || 'ai-responses'}/summary-report-*.html`);
      }
      
      // Проверяем фактическое наличие созданных файлов
      await this.verifyGeneratedReports(config);

      // 5. Генерация общего отчета (если включен)
      console.log(`🔍 Summary report check: enabled=${config.summary_report !== false}, results=${results.analysisResults.length}`);
      if (config.summary_report !== false && results.analysisResults.length > 0) {
        console.log('\n📊 Generating summary report...');
        console.log(`📊 Summary report data: ${results.analysisResults.length} results`);
        try {
          // Создаем SummaryReporter напрямую для общего отчета
          const { SummaryReporter } = await import('../../infrastructure/reporters/SummaryReporter.js');
          const summaryReporter = new SummaryReporter(config);
          await summaryReporter.generate(results.analysisResults);
          console.log('✅ Summary report generated successfully');
        } catch (error) {
          console.warn(`⚠️  Failed to generate summary report: ${error.message}`);
          console.warn(`   Stack: ${error.stack}`);
        }
      } else {
        console.log('ℹ️  Summary report skipped');
      }

      return results;

    } catch (error) {
      console.error('❌ Critical error during analysis:', error.message);
      results.success = false;
      results.endTime = new Date();
      results.processingTime = results.endTime - results.startTime;
      throw error;
    } finally {
      // Cleanup MCP client
      if (this.mcpClient) {
        await this.mcpClient.cleanup();
      }
    }
  }

  /**
   * Валидирует действия через MCP
   * @param {AIResponse} aiResponse - ответ ИИ с действиями
   * @returns {Promise<Object>} - результаты валидации
   */
  async validateActionsViaMcp(aiResponse) {
    const executableCode = aiResponse.getExecutableCode();
    const actions = [];

    // Конвертируем код в MCP действия (упрощенная версия)
    for (const snippet of executableCode) {
      const clickMatches = snippet.code.match(/\.click\(\)/g) || [];
      const fillMatches = snippet.code.match(/\.fill\(['"`]([^'"`]+)['"`]\)/g) || [];

      actions.push(...clickMatches.map(() => ({ type: 'click', ref: 'element_1' })));
      actions.push(...fillMatches.map(match => {
        const value = match.match(/['"`]([^'"`]+)['"`]/)?.[1] || '';
        return { type: 'fill', ref: 'element_1', value };
      }));
    }

    if (actions.length === 0) {
      return { totalActions: 0, successfulActions: 0, results: [] };
    }

    return await this.mcpClient.validateActions(actions);
  }

  /**
   * Обрабатывает ошибки с конкретными рекомендациями
   * @param {Error} error - ошибка
   * @param {string} filePath - путь к файлу
   */
  handleProcessingError(error, filePath) {
    if (error.message.includes('429')) {
      console.error('💡 Recommendation: Increase request_delay in configuration');
    } else if (error.message.includes('401') || error.message.includes('403')) {
      console.error('💡 Recommendation: Check your API key configuration');
    } else if (error.message.includes('timeout')) {
      console.error('💡 Recommendation: Check network connection or increase timeout');
    }
  }

  /**
   * Создает резюме результатов анализа
   * @param {Object} results - результаты анализа
   * @returns {Object} - резюме
   */
  createSummary(results) {
    const successful = results.analysisResults.filter(r => r.success);
    const errorTypes = {};
    const severities = {};
    let totalConfidence = 0;
    let totalActions = 0;
    let totalRecommendations = 0;

    for (const result of successful) {
      if (result.testError) {
        errorTypes[result.testError.errorType] = (errorTypes[result.testError.errorType] || 0) + 1;
        severities[result.testError.severity] = (severities[result.testError.severity] || 0) + 1;
      }

      if (result.aiResponse) {
        totalConfidence += result.aiResponse.confidence;
        totalActions += result.aiResponse.actions.length;
        totalRecommendations += result.aiResponse.recommendations.length;
      }
    }

    return {
      totalFiles: results.total,
      processedFiles: results.processed,
      errorFiles: results.errors,
      successRate: results.total > 0 ? (results.processed / results.total) * 100 : 0,
      averageConfidence: successful.length > 0 ? (totalConfidence / successful.length) * 100 : 0,
      totalActions,
      totalRecommendations,
      topErrorTypes: Object.entries(errorTypes)
        .sort(([,a], [,b]) => b - a)
        .map(([type]) => type),
      topSeverities: Object.entries(severities)
        .sort(([,a], [,b]) => b - a)
        .map(([severity]) => severity),
      processingTimeMs: results.processingTime
    };
  }

  /**
   * Проверяет наличие созданных отчетов
   * @param {Object} config - конфигурация
   */
  async verifyGeneratedReports(config) {
    const fs = await import('fs');
    const path = await import('path');
    const { glob } = await import('glob');
    
    console.log(`\n🔍 Проверка созданных файлов отчетов:`);
    
    try {
      // Проверяем HTML отчеты
      const reportDir = config.report_dir || 'playwright-report';
      if (fs.existsSync(reportDir)) {
        const htmlFiles = await glob(path.join(reportDir, 'ai-analysis-*.html'));
        if (htmlFiles.length > 0) {
          console.log(`   ✅ HTML отчет: ${htmlFiles[htmlFiles.length - 1]}`);
        } else {
          console.log(`   ❌ HTML отчет не найден в ${reportDir}`);
        }
      } else {
        console.log(`   ❌ Директория HTML отчетов не найдена: ${reportDir}`);
      }
      
      // Проверяем Markdown отчеты
      const aiResponsesDir = config.ai_responses_dir || 'ai-responses';
      if (fs.existsSync(aiResponsesDir)) {
        const markdownFiles = await glob(path.join(aiResponsesDir, '*.md'));
        console.log(`   ✅ Markdown файлов: ${markdownFiles.length} в ${aiResponsesDir}`);
        
        // Показываем последние файлы
        if (markdownFiles.length > 0) {
          const recentFiles = markdownFiles.slice(-3);
          recentFiles.forEach(file => {
            console.log(`      📄 ${path.basename(file)}`);
          });
        }
      } else {
        console.log(`   ❌ Директория Markdown отчетов не найдена: ${aiResponsesDir}`);
      }
      
      // Проверяем Allure attachments
      if (config.allure_integration) {
        const allureDir = config.allure_results_dir || 'allure-results';
        if (fs.existsSync(allureDir)) {
          const allureFiles = await glob(path.join(allureDir, 'ai-analysis-*.md'));
          console.log(`   ✅ Allure attachments: ${allureFiles.length} в ${allureDir}`);
        } else {
          console.log(`   ❌ Директория Allure не найдена: ${allureDir}`);
        }
      }
      
      // Проверяем общий отчет
      if (config.summary_report !== false) {
        const summaryFiles = await glob(path.join(aiResponsesDir, 'summary-report-*.html'));
        if (summaryFiles.length > 0) {
          console.log(`   ✅ Общий отчет: ${summaryFiles[summaryFiles.length - 1]}`);
        } else {
          console.log(`   ❌ Общий отчет не найден в ${aiResponsesDir}`);
        }
      }
      
    } catch (error) {
      console.warn(`⚠️  Ошибка при проверке отчетов: ${error.message}`);
    }
  }

  /**
   * Утилита для паузы
   * @param {number} ms - миллисекунды
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 