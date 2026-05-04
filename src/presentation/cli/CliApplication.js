// src/presentation/cli/CliApplication.js

import { getContainer } from '../../infrastructure/di/bindings.js';
import { DebugCommand } from './commands/DebugCommand.js';
import { UiCoverageCommand } from './commands/UiCoverageCommand.js';
import { SetupCommand } from './commands/SetupCommand.js';
import { ValidateCommand } from './commands/ValidateCommand.js';
import { DoctorCommand } from './commands/DoctorCommand.js';
import { InfoCommand } from './commands/InfoCommand.js';

export class CliApplication {
  constructor(container = null) {
    this.container = container || getContainer();
    this.commands = new Map();
    this.registerCommands();
  }

  registerCommands() {
    const commandClasses = [
      DebugCommand,
      UiCoverageCommand,
      SetupCommand,
      ValidateCommand,
      DoctorCommand,
      InfoCommand,
    ];

    for (const Cmd of commandClasses) {
      const instance = new Cmd(this.container);
      instance.description = Cmd.description;
      instance.usage = Cmd.usage;
      instance.options = Cmd.options;
      this.commands.set(Cmd.commandName, instance);
    }

    // alias
    this.commands.set('analyze', this.commands.get('debug'));

    // coverage subcommand (has its own subcommand logic, keep inline)
    this.commands.set('coverage', {
      description: 'UI Test Coverage system setup and management',
      usage: 'coverage <subcommand> [options]',
      options: [
        'init       Setup UI Test Coverage in current project',
        'info       Show information about coverage system',
        '--help     Show help for this command'
      ],
      async execute(args) {
        try {
          const { CoverageCommand } = await import('./CoverageCommand.js');
          const coverageCmd = new CoverageCommand();
          const subcommand = args[1];
          switch (subcommand) {
            case 'init': await coverageCmd.init({}); break;
            case 'info': await coverageCmd.info(); break;
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
    });

    // help and version stay inline (trivial)
    const self = this;
    this.commands.set('help', {
      description: 'Show help information',
      usage: 'help [command]',
      options: [],
      execute(args) {
        const commandName = args[1];
        if (commandName && self.commands.has(commandName)) {
          self.showCommandHelp(commandName);
        } else {
          self.showGeneralHelp();
        }
      }
    });

    this.commands.set('version', {
      description: 'Show version information',
      usage: 'version',
      options: [],
      async execute() {
        const packageJson = await import('../../../package.json', { assert: { type: 'json' } });
        console.log(`playwright-ai-auto-debug v${packageJson.default.version}`);
        console.log('🏗️  Clean Architecture Edition');
      }
    });
  }

  async run(args) {
    const [command = 'debug', ...params] = args;

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
      command.options.forEach(option => console.log(`  ${option}`));
    }
  }

  async dispose() {
    if (this.container) {
      this.container.clear();
    }
  }
}
