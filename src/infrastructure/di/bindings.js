// src/infrastructure/di/bindings.js

import { Container } from './Container.js';

// Импорты реальных реализаций
import { OpenAIProvider } from '../ai/OpenAIProvider.js';
import { MistralProvider } from '../ai/MistralProvider.js';
import { LocalAIProvider } from '../ai/LocalAIProvider.js';
import { FileErrorRepository } from '../repositories/FileErrorRepository.js';
import { HTMLReporter } from '../reporters/HTMLReporter.js';
import { AllureReporter } from '../reporters/AllureReporter.js';
import { MarkdownReporter } from '../reporters/MarkdownReporter.js';
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
    return new HTMLReporter(config);
  });

  container.singleton('allureReporter', async (c) => {
    const config = await c.get('config');
    return new AllureReporter(config);
  });

  container.singleton('markdownReporter', async (c) => {
    const config = await c.get('config');
    return new MarkdownReporter(config);
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
    const { McpClient } = await import('../mcp/McpClient.js');
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