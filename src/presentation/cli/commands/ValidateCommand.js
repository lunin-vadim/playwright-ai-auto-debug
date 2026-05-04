// src/presentation/cli/commands/ValidateCommand.js

export class ValidateCommand {
  static commandName = 'validate';
  static description = 'Validate configuration';
  static usage = 'validate [options]';
  static options = [
    '--help        Show help for this command'
  ];

  constructor(container) {
    this.container = container;
  }

  async execute(args) {
    console.log('🔍 Configuration validation (delegating to existing implementation)');
    const { validateConfiguration } = await import('../../../infrastructure/legacy/LegacyConfigValidator.js');
    return await validateConfiguration();
  }
}
