// src/presentation/cli/CliApplication.js

import { getContainer } from '../../infrastructure/di/bindings.js';

/**
 * Главное CLI приложение с новой архитектурой
 * Использует Dependency Injection для управления зависимостями
 */
export class CliApplication {
  constructor(container = null) {
    this.container = container || getContainer();
    this.commands = new Map();
    this.registerCommands();
  }

  /**
   * Регистрирует доступные команды
   */
  registerCommands() {
    this.commands.set('debug', this.createDebugCommand());
    this.commands.set('analyze', this.createDebugCommand()); // alias
    this.commands.set('setup', this.createSetupCommand());
    this.commands.set('validate', this.createValidateCommand());
    this.commands.set('info', this.createInfoCommand());
    this.commands.set('help', this.createHelpCommand());
    this.commands.set('version', this.createVersionCommand());
  }

  /**
   * Создает команду отладки тестов
   * @returns {Object}
   */
  createDebugCommand() {
    const self = this;
    return {
      description: 'Analyze test errors with AI assistance',
      usage: 'debug [options]',
      options: [
        '--use-mcp     Enable MCP DOM snapshots',
        '--project     Project directory (default: current)',
        '--help        Show help for this command'
      ],
      async execute(args, options) {
        try {
          console.log('🏗️  Using Clean Architecture implementation');
          console.log('🔧 Initializing dependencies...');

          // Получаем главный сервис через DI
          const testDebugService = await self.container.get('testDebugService');
          
          // Извлекаем опции из аргументов
          const projectPath = self.extractOption(args, '--project') || process.cwd();
          const useMcp = args.includes('--use-mcp');

          console.log(`📁 Project path: ${projectPath}`);
          console.log(`🔗 MCP enabled: ${useMcp}`);

          // Выполняем анализ
          const results = await testDebugService.debugTests(projectPath, { useMcp });

          // Выводим результаты
          self.displayResults(results);

          return results;

        } catch (error) {
          console.error('❌ Analysis failed:', error.message);
          
          if (error.message.includes('api_key')) {
            console.error('💡 Run "playwright-ai setup" to configure API key');
          }
          
          throw error;
        }
      }
    };
  }

  /**
   * Создает команду настройки
   * @returns {Object}
   */
  createSetupCommand() {
    return {
      description: 'Interactive setup wizard',
      usage: 'setup [options]',
      options: [
        '--help        Show help for this command'
      ],
      async execute(args, options) {
        console.log('🧙‍♂️ Setup wizard (delegating to existing implementation)');
        
        // Делегируем к временной реализации
        const { startSetupWizard } = await import('../../infrastructure/legacy/LegacyConfigWizard.js');
        return await startSetupWizard();
      }
    };
  }

  /**
   * Создает команду валидации
   * @returns {Object}
   */
  createValidateCommand() {
    return {
      description: 'Validate configuration',
      usage: 'validate [options]',
      options: [
        '--help        Show help for this command'
      ],
      async execute(args, options) {
        console.log('🔍 Configuration validation (delegating to existing implementation)');
        
        // Делегируем к временной реализации
        const { validateConfiguration } = await import('../../infrastructure/legacy/LegacyConfigValidator.js');
        return await validateConfiguration();
      }
    };
  }

  /**
   * Создает команду информации о системе
   * @returns {Object}
   */
  createInfoCommand() {
    const self = this;
    return {
      description: 'Show system and dependency information',
      usage: 'info',
      options: [],
      async execute(args, options) {
        console.log('ℹ️  System Information\n');
        
        try {
          // Информация о контейнере
          const info = self.container.getRegistrationInfo();
          console.log('🔧 Dependency Injection Container:');
          console.log(`   📦 Registered bindings: ${info.bindings.length}`);
          console.log(`   🔄 Singleton instances: ${info.singletons.length}`);
          console.log(`   📋 Constants: ${info.instances.length}`);

          // Информация о конфигурации
          try {
            const config = await self.container.get('config');
            console.log('\n⚙️  Configuration:');
            console.log(`   🤖 AI Server: ${config.ai_server}`);
            console.log(`   🧠 Model: ${config.model}`);
            console.log(`   📊 Allure Integration: ${config.allure_integration ? 'Enabled' : 'Disabled'}`);
            console.log(`   🔗 MCP Integration: ${config.mcp_integration ? 'Enabled' : 'Disabled'}`);
          } catch (error) {
            console.log('\n⚠️  Configuration: Not loaded or invalid');
          }

          // Информация о AI провайдере
          try {
            const aiProvider = await self.container.get('aiProvider');
            console.log('\n🤖 AI Provider:');
            console.log(`   📛 Name: ${aiProvider.getProviderName()}`);
            console.log(`   🧠 Supported models: ${aiProvider.getSupportedModels().join(', ')}`);
          } catch (error) {
            console.log('\n⚠️  AI Provider: Not available');
          }

          // Архитектурная информация
          console.log('\n🏗️  Architecture:');
          console.log('   📋 Pattern: Clean Architecture + Domain-Driven Design');
          console.log('   🔧 DI Container: Custom implementation');
          console.log('   🎯 Use Cases: Application layer orchestration');
          console.log('   📦 Entities: Rich domain models');

        } catch (error) {
          console.error('❌ Error getting system info:', error.message);
        }
      }
    };
  }

  /**
   * Создает команду помощи
   * @returns {Object}
   */
  createHelpCommand() {
    const self = this;
    return {
      description: 'Show help information',
      usage: 'help [command]',
      options: [],
      execute(args, options) {
        const commandName = args[1];
        
        if (commandName && self.commands.has(commandName)) {
          self.showCommandHelp(commandName);
        } else {
          self.showGeneralHelp();
        }
      }
    };
  }

  /**
   * Создает команду версии
   * @returns {Object}
   */
  createVersionCommand() {
    return {
      description: 'Show version information',
      usage: 'version',
      options: [],
      async execute(args, options) {
        const packageJson = await import('../../../package.json', { assert: { type: 'json' } });
        console.log(`playwright-ai-auto-debug v${packageJson.default.version}`);
        console.log('🏗️  Clean Architecture Edition');
      }
    };
  }

  /**
   * Запускает CLI приложение
   * @param {string[]} args - аргументы командной строки
   * @returns {Promise<*>}
   */
  async run(args) {
    const [command = 'debug', ...params] = args;
    
    // Обработка флагов помощи и версии
    if (params.includes('--help') || params.includes('-h')) {
      if (this.commands.has(command)) {
        this.showCommandHelp(command);
        return;
      }
    }

    if (params.includes('--version') || params.includes('-v')) {
      await this.commands.get('version').execute([], {});
      return;
    }

    // Выполнение команды
    const commandHandler = this.commands.get(command);
    
    if (!commandHandler) {
      console.error(`❌ Unknown command: ${command}`);
      this.showGeneralHelp();
      process.exit(1);
    }

    try {
      return await commandHandler.execute([command, ...params], {});
    } catch (error) {
      console.error(`❌ Command '${command}' failed:`, error.message);
      
      if (process.env.DEBUG) {
        console.error('Stack trace:', error.stack);
      }
      
      process.exit(1);
    }
  }

  /**
   * Показывает общую справку
   */
  showGeneralHelp() {
    console.log('🎭 Playwright AI Auto-Debug - Clean Architecture Edition\n');
    console.log('🏗️  Automatic Playwright test debugging with AI assistance\n');
    
    console.log('Usage: playwright-ai <command> [options]\n');
    
    console.log('Commands:');
    for (const [name, command] of this.commands) {
      console.log(`  ${name.padEnd(12)} ${command.description}`);
    }
    
    console.log('\nGlobal Options:');
    console.log('  --help, -h     Show help');
    console.log('  --version, -v  Show version');
    
    console.log('\nExamples:');
    console.log('  playwright-ai debug              # Analyze errors in current directory');
    console.log('  playwright-ai debug --use-mcp    # Use MCP for DOM snapshots');
    console.log('  playwright-ai setup              # Interactive configuration');
    console.log('  playwright-ai validate           # Validate configuration');
    console.log('  playwright-ai info               # Show system information');
    
    console.log('\n🏗️  Architecture Features:');
    console.log('  • Clean Architecture with Domain-Driven Design');
    console.log('  • Dependency Injection container');
    console.log('  • Modular AI providers (Strategy pattern)');
    console.log('  • Extensible reporters (Observer pattern)');
    console.log('  • Rich domain entities with business logic');
    console.log('  • Use Cases for application orchestration');
  }

  /**
   * Показывает справку по конкретной команде
   * @param {string} commandName - имя команды
   */
  showCommandHelp(commandName) {
    const command = this.commands.get(commandName);
    if (!command) {
      console.error(`❌ Unknown command: ${commandName}`);
      return;
    }

    console.log(`Command: ${commandName}`);
    console.log(`Description: ${command.description}`);
    console.log(`Usage: playwright-ai ${command.usage}\n`);
    
    if (command.options && command.options.length > 0) {
      console.log('Options:');
      command.options.forEach(option => {
        console.log(`  ${option}`);
      });
    }
  }

  /**
   * Извлекает значение опции из аргументов
   * @param {string[]} args - аргументы
   * @param {string} option - имя опции
   * @returns {string|null}
   */
  extractOption(args, option) {
    const index = args.indexOf(option);
    if (index !== -1 && index + 1 < args.length) {
      return args[index + 1];
    }
    return null;
  }

  /**
   * Отображает результаты анализа
   * @param {Object} results - результаты анализа
   */
  displayResults(results) {
    console.log('\n📊 Analysis Results Summary:');
    console.log('─'.repeat(50));
    
    if (results.summary) {
      const summary = results.summary;
      console.log(`📁 Total files: ${summary.totalFiles}`);
      console.log(`✅ Processed: ${summary.processedFiles}`);
      console.log(`❌ Errors: ${summary.errorFiles}`);
      console.log(`📈 Success rate: ${summary.successRate.toFixed(1)}%`);
      console.log(`🎯 Average confidence: ${summary.averageConfidence.toFixed(1)}%`);
      console.log(`⏱️  Processing time: ${summary.processingTimeMs}ms`);
      
      if (summary.topErrorTypes.length > 0) {
        console.log(`🔍 Top error types: ${summary.topErrorTypes.slice(0, 3).join(', ')}`);
      }
      
      if (summary.totalActions > 0) {
        console.log(`🎬 Total actions suggested: ${summary.totalActions}`);
      }
      
      if (summary.totalRecommendations > 0) {
        console.log(`💡 Total recommendations: ${summary.totalRecommendations}`);
      }
    }

    console.log('\n🏗️  Powered by Clean Architecture');
    
    if (results.success) {
      console.log('✅ Analysis completed successfully');
    } else {
      console.log('⚠️  Analysis completed with some errors');
    }
  }

  /**
   * Очистка ресурсов
   */
  async dispose() {
    if (this.container) {
      this.container.clear();
    }
  }
} 