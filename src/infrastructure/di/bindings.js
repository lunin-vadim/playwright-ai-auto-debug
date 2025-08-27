// src/infrastructure/di/bindings.js

import { Container } from './Container.js';

// Импорты реальных реализаций
import { OpenAIProvider } from '../ai/OpenAIProvider.js';
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
          case 'auto':
          default:
            return new OpenAIProvider();
          case 'claude':
            // TODO: Реализовать ClaudeProvider
            throw new Error('Claude provider not implemented yet. Use OpenAI provider.');
        }
      }
    };
  });

  container.singleton('aiProvider', async (c) => {
    const config = await c.get('config');
    const factory = c.get('aiProviderFactory');
    
    // Определяем провайдера на основе конфигурации
    let providerType = 'openai'; // по умолчанию OpenAI
    
    if (config.ai_server && config.ai_server.includes('claude')) {
      providerType = 'claude';
    } else if (config.ai_server && config.ai_server.includes('openai')) {
      providerType = 'openai';
    }
    
    return factory.create(providerType, config);
  });

  // ===== REPORTERS =====

  container.singleton('htmlReporter', (c) => {
    return {
      async generate(results) {
        // TODO: Реализовать HTMLReporter
        const { updateHtmlReport } = await import('../../../lib/updateHtml.js');
        
        for (const result of results) {
          if (result.errorFile?.htmlPath) {
            await updateHtmlReport(
              result.errorFile.htmlPath,
              result.testError?.content || '',
              result.aiResponse?.content || ''
            );
          }
        }
      },
      getName() { return 'HTML Reporter'; }
    };
  });

  container.singleton('allureReporter', (c) => {
    return {
      async generate(results) {
        // TODO: Реализовать AllureReporter
        const { createAllureAttachment } = await import('../../../lib/sendToAI.js');
        
        for (const result of results) {
          if (result.aiResponse && result.testError) {
            const config = await c.get('config');
            await createAllureAttachment(
              result.aiResponse.content,
              result.testError.content,
              config,
              0,
              result.errorFile?.path
            );
          }
        }
      },
      getName() { return 'Allure Reporter'; }
    };
  });

  container.singleton('markdownReporter', (c) => {
    return {
      async generate(results) {
        // TODO: Реализовать MarkdownReporter
        const { saveResponseToMarkdown } = await import('../../../lib/sendToAI.js');
        
        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          if (result.aiResponse && result.testError) {
            const config = await c.get('config');
            saveResponseToMarkdown(
              result.aiResponse.content,
              result.testError.content,
              config,
              i
            );
          }
        }
      },
      getName() { return 'Markdown Reporter'; }
    };
  });

  container.singleton('reporterManager', async (c) => {
    const config = await c.get('config');
    
    const reporters = [];
    
    // Добавляем репортеры на основе конфигурации
    reporters.push(c.get('htmlReporter')); // всегда включен
    
    if (config.allure_integration) {
      reporters.push(c.get('allureReporter'));
    }
    
    if (config.save_ai_responses) {
      reporters.push(c.get('markdownReporter'));
    }

    return {
      reporters,
      async createReports(results) {
        console.log(`📊 Creating reports using ${this.reporters.length} reporter(s)...`);
        
        for (const reporter of this.reporters) {
          try {
            console.log(`📄 Running ${reporter.getName()}...`);
            await reporter.generate(results);
          } catch (error) {
            console.warn(`⚠️  ${reporter.getName()} failed: ${error.message}`);
          }
        }
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