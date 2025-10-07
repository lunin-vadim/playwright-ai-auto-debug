// src/presentation/cli/CliApplication.js

import { getContainer } from '../../infrastructure/di/bindings.js';
import fs from 'fs';
import path from 'path';

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
    this.commands.set('ui-coverage', this.createUICoverageCommand());
    this.commands.set('coverage', this.createCoverageCommand()); // НОВОЕ!
    this.commands.set('setup', this.createSetupCommand());
    this.commands.set('validate', this.createValidateCommand());
    this.commands.set('doctor', this.createDoctorCommand());
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
        '--parallel    Parallel AI workers (default: from config)',
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
          const parallelArg = self.extractOption(args, '--parallel');
          const parallel = parallelArg ? Math.max(1, Number(parallelArg)) : undefined;

          console.log(`📁 Project path: ${projectPath}`);
          console.log(`🔗 MCP enabled: ${useMcp}`);

          // Выполняем анализ
          const results = await testDebugService.debugTests(projectPath, { useMcp, parallel });

          // Выводим результаты
          await self.displayResults(results);

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
   * Создает команду UI coverage анализа
   * @returns {Object}
   */
  createUICoverageCommand() {
    const self = this;
    return {
      description: 'Analyze UI coverage with MCP DOM snapshots',
      usage: 'ui-coverage [options]',
      options: [
        '--project     Project directory (default: current)',
        '--page        Page name for report (default: auto-detect)',
        '--critical    Path to critical elements config',
        '--golden      Enable golden snapshot comparison',
        '--all-tests   Analyze coverage across all test files',
        '--help        Show help for this command'
      ],
      async execute(args, options) {
        try {
          console.log('🎯 UI Coverage Analysis');
          console.log('🔧 Initializing UI Coverage analyzer...');

          // Извлекаем опции
          const projectPath = self.extractOption(args, '--project') || process.cwd();
          const pageName = self.extractOption(args, '--page') || 'current-page';
          const criticalConfigPath = self.extractOption(args, '--critical');
          const enableGolden = args.includes('--golden');
          const analyzeAllTests = args.includes('--all-tests');

          console.log(`📁 Project path: ${projectPath}`);
          console.log(`📄 Page name: ${pageName}`);
          console.log(`🔍 All tests analysis: ${analyzeAllTests ? 'Yes' : 'No'}`);

          // Импортируем UI coverage из DemoProject
          const { UICoverageAnalyzer } = await import('../../../DemoProject/lib/uiCoverageAnalyzer.js');
          
          // Загружаем критичные элементы если указан путь
          let criticalElements = [
            { type: 'button', name: 'Get started', selector: 'text=Get started' },
            { type: 'button', name: 'Search', selector: 'button:has-text("Search")' },
            { type: 'link', name: 'Docs', selector: 'text=Docs' },
            { type: 'navigation', name: 'Main', selector: 'navigation' }
          ];
          
          if (criticalConfigPath && fs.existsSync(criticalConfigPath)) {
            const criticalConfig = JSON.parse(fs.readFileSync(criticalConfigPath, 'utf8'));
            criticalElements = criticalConfig.criticalElements || criticalElements;
          }
          
          // Создаем анализатор
          const analyzer = new UICoverageAnalyzer({
            criticalElements,
            coverageReportsDir: path.join(projectPath, 'ui-coverage-reports')
          });
          
          // Получаем snapshots для анализа
          let snapshots = [];
          
          if (analyzeAllTests) {
            console.log('🔍 Analyzing all test scenarios...');
            snapshots = [
              { name: 'main-page', content: self.getDemoSnapshot() },
              { name: 'navigation-test', content: self.getNavigationSnapshot() },
              { name: 'form-test', content: self.getFormSnapshot() },
              { name: 'api-test', content: self.getApiSnapshot() }
            ];
          } else {
            snapshots = [{ name: pageName, content: self.getDemoSnapshot() }];
          }
          
          // Выполняем анализ для каждого snapshot
          const allResults = [];
          
          for (const snapshot of snapshots) {
            console.log(`🌳 Parsing accessibility tree for ${snapshot.name}...`);
            const accessibilityTree = analyzer.parseAccessibilityTree(snapshot.content);
            
            console.log(`📊 Analyzing element coverage for ${snapshot.name}...`);
            const elementStats = analyzer.analyzeElementCoverage(accessibilityTree);
            
            console.log(`🔍 Checking critical elements for ${snapshot.name}...`);
            const criticalCheck = analyzer.checkCriticalElements(accessibilityTree, criticalElements);
            
            // Сравнение с эталоном если включено
            let goldenComparison = null;
            if (enableGolden) {
              const goldenSnapshot = self.getGoldenSnapshot();
              const goldenTree = analyzer.parseAccessibilityTree(goldenSnapshot);
              goldenComparison = analyzer.compareWithGolden(accessibilityTree, goldenTree);
            }
            
            allResults.push({
              name: snapshot.name,
              accessibilityTree,
              elementStats,
              criticalCheck,
              goldenComparison
            });
          }
          
          // Агрегируем результаты
          const aggregatedResults = self.aggregateResults(allResults);
          const accessibilityTree = aggregatedResults.combinedTree;
          const elementStats = aggregatedResults.combinedStats;
          const criticalCheck = aggregatedResults.combinedCriticalCheck;
          const goldenComparison = aggregatedResults.combinedGoldenComparison;
          
          // Генерируем отчет
          const analysisResults = {
            accessibilityTree,
            elementStats,
            criticalCheck,
            goldenComparison
          };
          
          const coverageReport = analyzer.generateCoverageReport(analysisResults, pageName);
          
          // Сохраняем отчет
          const timestamp = Date.now();
          await analyzer.saveReport(coverageReport, `ui-coverage-${timestamp}.md`);
          
          // Генерируем HTML отчет
          const htmlReport = self.generateHTMLReport(coverageReport, analysisResults, timestamp);
          const htmlPath = path.join(projectPath, 'ui-coverage-reports', `ui-coverage-${timestamp}.html`);
          
          // Создаем директорию если не существует
          const reportsDir = path.join(projectPath, 'ui-coverage-reports');
          if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
          }
          
          fs.writeFileSync(htmlPath, htmlReport, 'utf8');
          
          // Выводим результаты
          console.log('\n✅ UI Coverage analysis completed');
          
          if (analyzeAllTests) {
            console.log(`📊 Analyzed ${allResults.length} test scenarios`);
            allResults.forEach(result => {
              console.log(`   • ${result.name}: ${result.elementStats.summary.totalElements} elements`);
            });
          }
          
          console.log(`📊 Total elements: ${coverageReport.summary.totalElements}`);
          console.log(`🎯 Interactive elements: ${coverageReport.summary.interactiveElements}`);
          console.log(`📈 Coverage: ${coverageReport.summary.coveragePercentage}%`);
          console.log(`♿ Accessibility Score: ${coverageReport.summary.accessibilityScore}%`);
          console.log(`🔍 Critical elements found: ${criticalCheck.foundCritical.length}/${criticalElements.length}`);
          
          if (criticalCheck.missingCritical.length > 0) {
            console.log('\n❌ Missing critical elements:');
            criticalCheck.missingCritical.forEach(el => {
              console.log(`   • ${el.name} (${el.type})`);
            });
          }
          
          if (coverageReport.recommendations.length > 0) {
            console.log('\n💡 Recommendations:');
            coverageReport.recommendations.forEach(rec => {
              console.log(`   • ${rec}`);
            });
          }
          
          console.log(`\n📄 Reports saved:`);
          console.log(`   📝 Markdown: ui-coverage-reports/ui-coverage-${timestamp}.md`);
          console.log(`   🌐 HTML: ui-coverage-reports/ui-coverage-${timestamp}.html`);
          console.log(`   📊 JSON: ui-coverage-reports/ui-coverage-${timestamp}.json`);
          
          return {
            success: true,
            report: coverageReport,
            recommendations: coverageReport.recommendations,
            htmlPath
          };

        } catch (error) {
          console.error('❌ UI Coverage analysis failed:', error.message);
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
   * Создает команду проверки окружения/путей
   * @returns {Object}
   */
  createDoctorCommand() {
    const self = this;
    return {
      description: 'Check paths and required files based on ai.conf',
      usage: 'doctor [--project <path>] [--fix] [--json]',
      options: [
        '--project     Project directory (default: current)',
        '--fix         Create missing folders (no files)',
        '--json        Output JSON report'
      ],
      async execute(args, options) {
        const projectPath = self.extractOption(args, '--project') || process.cwd();
        const doFix = args.includes('--fix');
        const asJson = args.includes('--json');

        const fs = await import('fs');
        const path = await import('path');
        const { glob } = await import('glob');

        // Загружаем конфиг через DI контейнер
        let config;
        try {
          config = await self.container.get('config');
        } catch (e) {
          config = {};
        }

        // Нормализуем директории относительно projectPath
        const resultsDir = path.join(projectPath, config.results_dir || 'test-results');
        const reportDir = path.join(projectPath, config.report_dir || 'playwright-report');
        const aiResponsesDir = path.join(projectPath, config.ai_responses_dir || 'ai-responses');
        const allureDir = path.join(projectPath, config.allure_results_dir || 'allure-results');
        const patterns = Array.isArray(config.error_file_patterns) && config.error_file_patterns.length
          ? config.error_file_patterns
          : ['**/error-context.md', 'copy-prompt.txt', 'error.txt', 'test-error.md', '*-error.txt', '*-error.md'];

        // Список проверок
        const checks = [];

        function ensureDir(dirPath) {
          const exists = fs.existsSync(dirPath);
          if (!exists && doFix) {
            fs.mkdirSync(dirPath, { recursive: true });
          }
          return fs.existsSync(dirPath);
        }

        const dirsToCheck = [
          { key: 'results_dir', path: resultsDir },
          { key: 'report_dir', path: reportDir },
          { key: 'ai_responses_dir', path: aiResponsesDir },
        ];

        if (config.allure_integration) {
          dirsToCheck.push({ key: 'allure_results_dir', path: allureDir });
        }

        // Проверяем папки
        for (const item of dirsToCheck) {
          const ok = ensureDir(item.path);
          checks.push({ type: 'dir', key: item.key, path: item.path, ok });
        }

        // Проверяем файлы по паттернам в results_dir
        const filesReport = [];
        try {
          for (const pattern of patterns) {
            const matches = await glob(path.join(resultsDir, pattern));
            filesReport.push({ pattern, count: matches.length, samples: matches.slice(0, 5) });
          }
        } catch (e) {
          // игнорируем ошибки glob
        }

        // Проверяем типовые артефакты
        const expectedArtifacts = [
          { label: 'Playwright HTML report', path: path.join(reportDir, 'index.html') },
          { label: 'Allure results dir', path: allureDir, onlyIf: !!config.allure_integration },
        ];

        const artifacts = expectedArtifacts
          .filter(a => a.onlyIf === undefined || a.onlyIf)
          .map(a => ({ label: a.label, path: a.path, ok: fs.existsSync(a.path) }));

        // Итоговый статус
        const hasMissingDirs = checks.some(c => c.type === 'dir' && !c.ok);
        const hasNoErrorFiles = filesReport.every(fr => fr.count === 0);

        const summary = {
          projectPath,
          fixed: doFix,
          status: hasMissingDirs ? 'incomplete' : 'ok',
          hints: [
            hasMissingDirs ? 'Создайте недостающие директории или запустите с --fix' : null,
            hasNoErrorFiles ? 'Файлы ошибок не найдены — это нормально, если сейчас нет упавших тестов' : null,
          ].filter(Boolean)
        };

        if (asJson) {
          console.log(JSON.stringify({ summary, checks, files: filesReport, artifacts }, null, 2));
        } else {
          console.log('🩺 Environment Doctor\n');
          console.log(`📁 Project: ${projectPath}`);
          console.log(`🔧 Fix mode: ${doFix ? 'ON' : 'OFF'}`);
          console.log('\n📂 Directories:');
          for (const c of checks) {
            console.log(`  ${c.ok ? '✅' : '❌'} ${c.key.padEnd(18)} ${c.path}`);
          }
          console.log('\n📝 Error file patterns:');
          for (const fr of filesReport) {
            console.log(`  ${fr.count > 0 ? '✅' : '⚠️ '} ${fr.pattern} — найдено: ${fr.count}`);
            if (fr.samples.length > 0) {
              fr.samples.forEach(s => console.log(`     • ${path.relative(projectPath, s)}`));
            }
          }
          console.log('\n📦 Artifacts:');
          for (const a of artifacts) {
            console.log(`  ${a.ok ? '✅' : '⚠️ '} ${a.label}: ${a.path}`);
          }
          if (summary.hints.length) {
            console.log('\n💡 Hints:');
            summary.hints.forEach(h => console.log(`  • ${h}`));
          }
        }

        if (hasMissingDirs) {
          process.exitCode = 2;
        } else {
          process.exitCode = 0;
        }

        return { summary, checks, files: filesReport, artifacts };
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
   * Создает команду UI Test Coverage
   * @returns {Object}
   */
  createCoverageCommand() {
    return {
      description: 'UI Test Coverage system setup and management',
      usage: 'coverage <subcommand> [options]',
      options: [
        'init       Setup UI Test Coverage in current project',
        'info       Show information about coverage system',
        '--help     Show help for this command'
      ],
      async execute(args, options) {
        try {
          const { CoverageCommand } = await import('./CoverageCommand.js');
          const coverageCmd = new CoverageCommand();
          
          const subcommand = args[1]; // coverage <subcommand>
          
          switch (subcommand) {
            case 'init':
              await coverageCmd.init(options);
              break;
            case 'info':
              await coverageCmd.info();
              break;
            default:
              console.log('🎯 UI Test Coverage');
              console.log('\nДоступные команды:');
              console.log('  npx playwright-ai coverage init  # Настройка в проекте');
              console.log('  npx playwright-ai coverage info  # Информация о системе');
              console.log('\n💡 После настройки:');
              console.log('  npm run test:coverage            # Запуск тестов с покрытием');
              console.log('  npm run coverage:open            # Открытие отчета');
          }
          
        } catch (error) {
          console.error('❌ Ошибка команды coverage:', error.message);
          throw error;
        }
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
    console.log('  playwright-ai doctor             # Check paths and required files');
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
   * Получает демо snapshot для UI coverage анализа
   * @returns {string}
   */
  getDemoSnapshot() {
    return `# Page snapshot

- region "Skip to main content":
  - link "Skip to main content":
    - /url: "#__docusaurus_skipToContent_fallback"
- navigation "Main":
  - link "Playwright logo Playwright":
    - /url: /
    - img "Playwright logo"
    - text: Playwright
  - link "Docs":
    - /url: /docs/intro
  - link "API":
    - /url: /docs/api/class-playwright
  - button "Node.js"
  - link "Community":
    - /url: /community/welcome
  - link "GitHub repository":
    - /url: https://github.com/microsoft/playwright
  - button "Switch between dark and light mode"
  - button "Search (Command+K)": Search ⌘ K
- banner:
  - heading "Playwright enables reliable end-to-end testing for modern web apps." [level=1]
  - link "Get started":
    - /url: /docs/intro
  - link "Star microsoft/playwright on GitHub":
    - /url: https://github.com/microsoft/playwright
- main:
  - img "Browsers (Chromium, Firefox, WebKit)"
  - heading "Any browser • Any platform • One API" [level=3]
  - paragraph: Cross-browser. Playwright supports all modern rendering engines
  - link "TypeScript":
    - /url: https://playwright.dev/docs/intro
  - link "JavaScript":
    - /url: https://playwright.dev/docs/intro`;
  }

  /**
   * Получает золотой snapshot для сравнения
   * @returns {string}
   */
  getGoldenSnapshot() {
    return `# Page snapshot

- navigation "Main":
  - link "Playwright logo Playwright":
    - /url: /
  - link "Docs":
    - /url: /docs/intro
  - button "Node.js"
  - link "Community":
    - /url: /community/welcome
  - button "Search (Command+K)": Search ⌘ K
- banner:
  - heading "Playwright enables reliable end-to-end testing" [level=1]
  - link "Get started":
    - /url: /docs/intro
- main:
  - heading "Any browser • Any platform • One API" [level=3]
  - link "TypeScript":
    - /url: https://playwright.dev/docs/intro`;
  }

  /**
   * Генерирует подробный HTML отчет по UI coverage
   * @param {Object} coverageReport - отчет о покрытии
   * @param {Object} analysisResults - результаты анализа
   * @param {number} timestamp - временная метка
   * @returns {string} HTML содержимое
   */
  generateHTMLReport(coverageReport, analysisResults, timestamp) {
    const { summary, elementBreakdown, criticalElementsCheck, recommendations } = coverageReport;
    const { accessibilityTree, elementStats, criticalCheck, goldenComparison } = analysisResults;

    return `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UI Coverage Report - ${coverageReport.metadata.pageName}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1400px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-card.success { background: linear-gradient(135deg, #4caf50 0%, #8bc34a 100%); }
        .stat-card.warning { background: linear-gradient(135deg, #ff9800 0%, #ffc107 100%); }
        .stat-card.danger { background: linear-gradient(135deg, #f44336 0%, #e91e63 100%); }
        .stat-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .stat-label { opacity: 0.9; }
        .section { margin: 30px 0; }
        .section-title { font-size: 1.5em; margin-bottom: 15px; border-bottom: 2px solid #eee; padding-bottom: 5px; }
        .elements-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .elements-table th, .elements-table td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
        .elements-table th { background: #f5f5f5; font-weight: bold; }
        .element-row.found { background: #e8f5e8; }
        .element-row.missing { background: #ffebee; }
        .element-row.critical { border-left: 4px solid #f44336; }
        .recommendation { padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid; }
        .recommendation.high { border-color: #f44336; background: #ffebee; }
        .recommendation.medium { border-color: #ff9800; background: #fff3e0; }
        .recommendation.low { border-color: #4caf50; background: #e8f5e8; }
        .tabs { display: flex; border-bottom: 2px solid #eee; margin-bottom: 20px; }
        .tab { padding: 10px 20px; cursor: pointer; border-bottom: 2px solid transparent; }
        .tab.active { border-bottom-color: #667eea; color: #667eea; font-weight: bold; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .progress-bar { width: 100%; height: 20px; background: #eee; border-radius: 10px; overflow: hidden; margin: 10px 0; }
        .progress-fill { height: 100%; transition: width 0.3s; }
        .progress-high { background: linear-gradient(90deg, #4caf50, #8bc34a); }
        .progress-medium { background: linear-gradient(90deg, #ff9800, #ffc107); }
        .progress-low { background: linear-gradient(90deg, #f44336, #e91e63); }
        .element-tree { font-family: monospace; background: #f9f9f9; padding: 15px; border-radius: 5px; max-height: 400px; overflow-y: auto; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 UI Coverage Report</h1>
            <p><strong>Страница:</strong> ${coverageReport.metadata.pageName}</p>
            <p><strong>Время анализа:</strong> ${new Date(timestamp).toLocaleString('ru-RU')}</p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card ${summary.coveragePercentage >= 80 ? 'success' : summary.coveragePercentage >= 50 ? 'warning' : 'danger'}">
                <div class="stat-value">${summary.coveragePercentage}%</div>
                <div class="stat-label">Покрытие тестами</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${summary.totalElements}</div>
                <div class="stat-label">Всего элементов</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${summary.interactiveElements}</div>
                <div class="stat-label">Интерактивных</div>
            </div>
            <div class="stat-card ${summary.accessibilityScore >= 70 ? 'success' : summary.accessibilityScore >= 40 ? 'warning' : 'danger'}">
                <div class="stat-value">${summary.accessibilityScore}%</div>
                <div class="stat-label">Доступность</div>
            </div>
        </div>

        <div class="tabs">
            <div class="tab active" onclick="showTab('overview')">Обзор</div>
            <div class="tab" onclick="showTab('elements')">Элементы</div>
            <div class="tab" onclick="showTab('critical')">Критичные</div>
            <div class="tab" onclick="showTab('recommendations')">Рекомендации</div>
            ${goldenComparison ? '<div class="tab" onclick="showTab(\'comparison\')">Сравнение</div>' : ''}
        </div>

        <div id="overview" class="tab-content active">
            <div class="section">
                <h2 class="section-title">📊 Разбивка по типам элементов</h2>
                <table class="elements-table">
                    <thead>
                        <tr>
                            <th>Тип элемента</th>
                            <th>Количество</th>
                            <th>Покрытие</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>🔘 Кнопки</td>
                            <td>${elementBreakdown.buttons || 0}</td>
                            <td>
                                <div class="progress-bar">
                                    <div class="progress-fill progress-medium" style="width: ${Math.min(100, (elementBreakdown.buttons || 0) * 20)}%"></div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>🔗 Ссылки</td>
                            <td>${elementBreakdown.links || 0}</td>
                            <td>
                                <div class="progress-bar">
                                    <div class="progress-fill progress-high" style="width: ${Math.min(100, (elementBreakdown.links || 0) * 10)}%"></div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>📝 Поля ввода</td>
                            <td>${elementBreakdown.inputs || 0}</td>
                            <td>
                                <div class="progress-bar">
                                    <div class="progress-fill progress-low" style="width: ${Math.min(100, (elementBreakdown.inputs || 0) * 25)}%"></div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>📋 Формы</td>
                            <td>${elementBreakdown.forms || 0}</td>
                            <td>
                                <div class="progress-bar">
                                    <div class="progress-fill progress-medium" style="width: ${Math.min(100, (elementBreakdown.forms || 0) * 50)}%"></div>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div id="elements" class="tab-content">
            <div class="section">
                <h2 class="section-title">🌳 Дерево элементов страницы</h2>
                <div class="element-tree">
${accessibilityTree.elements.map(el => 
    `                    <div class="element-item">${el.line}</div>`
).join('\n')}
                </div>
            </div>
        </div>

        <div id="critical" class="tab-content">
            <div class="section">
                <h2 class="section-title">🎯 Критичные элементы</h2>
                <table class="elements-table">
                    <thead>
                        <tr>
                            <th>Элемент</th>
                            <th>Тип</th>
                            <th>Селектор</th>
                            <th>Статус</th>
                        </tr>
                    </thead>
                    <tbody>
${criticalCheck.foundCritical.map(el => 
    `                        <tr class="element-row found">
                            <td>✅ ${el.name}</td>
                            <td>${el.type}</td>
                            <td><code>${el.selector}</code></td>
                            <td><span style="color: #4caf50;">Найден</span></td>
                        </tr>`
).join('\n')}
${criticalCheck.missingCritical.map(el => 
    `                        <tr class="element-row missing critical">
                            <td>❌ ${el.name}</td>
                            <td>${el.type}</td>
                            <td><code>${el.selector}</code></td>
                            <td><span style="color: #f44336;">Отсутствует</span></td>
                        </tr>`
).join('\n')}
                    </tbody>
                </table>
            </div>
        </div>

        <div id="recommendations" class="tab-content">
            <div class="section">
                <h2 class="section-title">💡 Рекомендации</h2>
${recommendations.map(rec => 
    `                <div class="recommendation ${rec.includes('🔴') ? 'high' : rec.includes('♿') ? 'medium' : 'low'}">
                    ${rec}
                </div>`
).join('\n')}
            </div>
        </div>

        ${goldenComparison ? `
        <div id="comparison" class="tab-content">
            <div class="section">
                <h2 class="section-title">🔗 Сравнение с эталоном</h2>
                <p><strong>Идентичность:</strong> ${goldenComparison.identical ? '✅ Да' : '❌ Нет'}</p>
                <p><strong>Новых элементов:</strong> ${goldenComparison.newElements.length}</p>
                <p><strong>Удаленных элементов:</strong> ${goldenComparison.removedElements.length}</p>
                ${goldenComparison.differences.length > 0 ? `
                <h3>Различия:</h3>
                <ul>
                ${goldenComparison.differences.map(diff => `<li>${diff}</li>`).join('\n')}
                </ul>
                ` : ''}
            </div>
        </div>
        ` : ''}
    </div>

    <script>
        function showTab(tabName) {
            // Скрываем все вкладки
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Показываем выбранную вкладку
            document.getElementById(tabName).classList.add('active');
            event.target.classList.add('active');
        }
    </script>
</body>
</html>`;
  }

  /**
   * Получает snapshot для навигационного теста
   */
  getNavigationSnapshot() {
    return `# Navigation Test Page snapshot

- navigation "Main":
  - link "Home": /url: /
  - link "Products": /url: /products
  - link "About": /url: /about
  - link "Contact": /url: /contact
  - button "Menu Toggle"
- main:
  - heading "Navigation Test" [level=1]
  - button "Back to Home"`;
  }

  /**
   * Получает snapshot для формы
   */
  getFormSnapshot() {
    return `# Form Test Page snapshot

- main:
  - heading "Contact Form" [level=1]
  - form:
    - input "Name" type=text
    - input "Email" type=email
    - textarea "Message"
    - button "Submit"
    - button "Reset"
- navigation:
  - link "Back": /url: /`;
  }

  /**
   * Получает snapshot для API теста
   */
  getApiSnapshot() {
    return `# API Test Page snapshot

- main:
  - heading "API Dashboard" [level=1]
  - button "Load Data"
  - button "Refresh"
  - div "Loading indicator"
- section "Results":
  - table "Data Table"
  - button "Export CSV"
  - link "View Details": /url: /details`;
  }

  /**
   * Агрегирует результаты всех тестов
   */
  aggregateResults(allResults) {
    const combinedElements = [];
    let totalElements = 0;
    let totalInteractive = 0;
    let allFoundCritical = [];
    let allMissingCritical = [];
    
    // Объединяем элементы из всех результатов
    allResults.forEach(result => {
      combinedElements.push(...result.accessibilityTree.elements);
      totalElements += result.elementStats.summary.totalElements;
      totalInteractive += result.elementStats.summary.interactive;
      allFoundCritical.push(...result.criticalCheck.foundCritical);
      allMissingCritical.push(...result.criticalCheck.missingCritical);
    });

    // Удаляем дубликаты критичных элементов
    const uniqueFound = allFoundCritical.filter((item, index, self) => 
      index === self.findIndex(el => el.name === item.name && el.type === item.type)
    );
    const uniqueMissing = allMissingCritical.filter((item, index, self) => 
      index === self.findIndex(el => el.name === item.name && el.type === item.type)
    );

    return {
      combinedTree: {
        elements: combinedElements,
        totalCount: totalElements,
        byType: this.groupElementsByType(combinedElements)
      },
      combinedStats: {
        summary: {
          totalElements,
          interactive: totalInteractive,
          buttons: combinedElements.filter(el => el.type === 'button').length,
          links: combinedElements.filter(el => el.type === 'link').length,
          inputs: combinedElements.filter(el => el.type === 'input').length,
          forms: combinedElements.filter(el => el.type === 'form').length,
          navigation: combinedElements.filter(el => el.type === 'navigation').length,
          withAriaLabel: 0,
          withRole: 0
        }
      },
      combinedCriticalCheck: {
        foundCritical: uniqueFound,
        missingCritical: uniqueMissing,
        allCriticalPresent: uniqueMissing.length === 0
      },
      combinedGoldenComparison: allResults[0]?.goldenComparison || null,
      testResults: allResults
    };
  }

  /**
   * Группирует элементы по типу
   */
  groupElementsByType(elements) {
    const grouped = {};
    elements.forEach(el => {
      if (!grouped[el.type]) {
        grouped[el.type] = [];
      }
      grouped[el.type].push(el);
    });
    return grouped;
  }

  /**
   * Отображает результаты анализа
   * @param {Object} results - результаты анализа
   */
  async displayResults(results) {
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
      
      // Показываем пользователю где найти отчеты
      await this.showReportLocations();
    } else {
      console.log('⚠️  Analysis completed with some errors');
    }
  }

  /**
   * Показывает пользователю где найти созданные отчеты
   */
  async showReportLocations() {
    try {
      const config = await this.container.get('config');
      const fs = await import('fs');
      const path = await import('path');
      const { glob } = await import('glob');
      
      console.log('\n📄 Где найти отчеты:');
      
      // Проверяем HTML отчеты
      const reportDir = config.report_dir || 'playwright-report';
      if (fs.existsSync(reportDir)) {
        const htmlFiles = await glob(path.join(reportDir, 'ai-analysis-*.html'));
        if (htmlFiles.length > 0) {
          const latestHtml = htmlFiles[htmlFiles.length - 1];
          console.log(`   🌐 HTML отчет: ${latestHtml}`);
          console.log(`      💡 Откройте в браузере: open ${latestHtml}`);
        }
      }
      
      // Проверяем Markdown отчеты
      const aiResponsesDir = config.ai_responses_dir || 'ai-responses';
      if (fs.existsSync(aiResponsesDir)) {
        const markdownFiles = await glob(path.join(aiResponsesDir, 'analysis-summary-*.md'));
        if (markdownFiles.length > 0) {
          const latestSummary = markdownFiles[markdownFiles.length - 1];
          console.log(`   📝 Сводный отчет: ${latestSummary}`);
        }
        
        const responseFiles = await glob(path.join(aiResponsesDir, 'ai-response-*.md'));
        if (responseFiles.length > 0) {
          console.log(`   📄 AI ответы: ${responseFiles.length} файлов в ${aiResponsesDir}/`);
        }
      }
      
      // Проверяем Allure
      if (config.allure_integration) {
        const allureDir = config.allure_results_dir || 'allure-results';
        if (fs.existsSync(allureDir)) {
          console.log(`   📊 Allure attachments: ${allureDir}/`);
          console.log(`      💡 Запустите: npx allure serve ${allureDir}`);
        }
      }
      
    } catch (error) {
      console.warn(`⚠️  Не удалось проверить отчеты: ${error.message}`);
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