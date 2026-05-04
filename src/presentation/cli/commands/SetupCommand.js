// src/presentation/cli/commands/SetupCommand.js

export class SetupCommand {
  static commandName = 'setup';
  static description = 'Interactive setup wizard';
  static usage = 'setup [options]';
  static options = [
    '--help        Show help for this command'
  ];

  constructor(container) {
    this.container = container;
  }

  async execute(args) {
    console.log('🧙‍♂️ Setup wizard (delegating to existing implementation)');
    const { startSetupWizard } = await import('../../../infrastructure/legacy/LegacyConfigWizard.js');
    return await startSetupWizard();
  }
}
