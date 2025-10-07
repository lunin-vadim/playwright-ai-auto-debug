// src/application/services/TestDebugService.js

/**
 * Главный сервис приложения для отладки тестов
 * Координирует работу всех Use Cases и предоставляет единый API
 */
export class TestDebugService {
  constructor(analyzeTestErrorsUseCase, config) {
    this.analyzeTestErrorsUseCase = analyzeTestErrorsUseCase;
    this.config = config;
  }

  /**
   * Выполняет полный цикл отладки тестов
   * @param {string} projectPath - путь к проекту
   * @param {Object} options - опции выполнения
   * @param {boolean} options.useMcp - использовать MCP
   * @param {string[]} options.patterns - паттерны файлов
   * @param {boolean} options.verbose - подробный вывод
   * @returns {Promise<Object>} - результаты анализа
   */
  async debugTests(projectPath, options = {}) {
    const startTime = Date.now();
    
    console.log(`🎯 Starting test debug analysis...`);
    console.log(`📁 Project: ${projectPath}`);
    console.log(`⚙️  Options:`, JSON.stringify(options, null, 2));

    try {
      // Подготавливаем запрос для Use Case
      const request = {
        projectPath,
        config: this.config,
        useMcp: options.useMcp || false,
        patterns: options.patterns || ['**/*.spec.js', '**/*.test.js'],
        verbose: options.verbose || false,
        parallel: typeof options.parallel === 'number' && !Number.isNaN(options.parallel)
          ? Math.max(1, options.parallel)
          : undefined
      };

      // Выполняем анализ через Use Case
      const results = await this.analyzeTestErrorsUseCase.execute(request);

      // Добавляем метаданные времени выполнения
      const processingTimeMs = Date.now() - startTime;
      results.metadata = {
        ...results.metadata,
        processingTimeMs,
        timestamp: new Date().toISOString(),
        projectPath,
        options
      };

      console.log(`✅ Analysis completed in ${processingTimeMs}ms`);
      
      return {
        success: true,
        ...results
      };

    } catch (error) {
      const processingTimeMs = Date.now() - startTime;
      
      console.error(`❌ Analysis failed after ${processingTimeMs}ms:`, error.message);
      
      return {
        success: false,
        error: {
          message: error.message,
          stack: error.stack,
          processingTimeMs
        },
        metadata: {
          processingTimeMs,
          timestamp: new Date().toISOString(),
          projectPath,
          options
        }
      };
    }
  }

  /**
   * Получает информацию о конфигурации сервиса
   * @returns {Object}
   */
  getServiceInfo() {
    return {
      name: 'TestDebugService',
      version: '1.0.0',
      architecture: 'Clean Architecture',
      patterns: ['Domain-Driven Design', 'Dependency Injection', 'Use Cases'],
      config: {
        ai_server: this.config.ai_server,
        model: this.config.model,
        allure_integration: this.config.allure_integration,
        mcp_integration: this.config.mcp_integration
      }
    };
  }

  /**
   * Проверяет готовность сервиса к работе
   * @returns {Promise<Object>}
   */
  async healthCheck() {
    try {
      // Проверяем конфигурацию
      if (!this.config || !this.config.ai_server) {
        throw new Error('Configuration is missing or invalid');
      }

      // Проверяем Use Case
      if (!this.analyzeTestErrorsUseCase) {
        throw new Error('AnalyzeTestErrorsUseCase is not available');
      }

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        checks: {
          configuration: 'OK',
          useCase: 'OK'
        }
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        checks: {
          configuration: this.config ? 'OK' : 'FAIL',
          useCase: this.analyzeTestErrorsUseCase ? 'OK' : 'FAIL'
        }
      };
    }
  }
} 