// src/presentation/cli/commands/InfoCommand.js

export class InfoCommand {
  static commandName = 'info';
  static description = 'Show system and dependency information';
  static usage = 'info';
  static options = [];

  constructor(container) {
    this.container = container;
  }

  async execute(args) {
    console.log('ℹ️  System Information\n');

    try {
      const info = this.container.getRegistrationInfo();
      console.log('🔧 Dependency Injection Container:');
      console.log(`   📦 Registered bindings: ${info.bindings.length}`);
      console.log(`   🔄 Singleton instances: ${info.singletons.length}`);
      console.log(`   📋 Constants: ${info.instances.length}`);

      try {
        const config = await this.container.get('config');
        console.log('\n⚙️  Configuration:');
        console.log(`   🤖 AI Server: ${config.ai_server}`);
        console.log(`   🧠 Model: ${config.model}`);
        console.log(`   📊 Allure Integration: ${config.allure_integration ? 'Enabled' : 'Disabled'}`);
        console.log(`   🔗 MCP Integration: ${config.mcp_integration ? 'Enabled' : 'Disabled'}`);
      } catch (error) {
        console.log('\n⚠️  Configuration: Not loaded or invalid');
      }

      try {
        const aiProvider = await this.container.get('aiProvider');
        console.log('\n🤖 AI Provider:');
        console.log(`   📛 Name: ${aiProvider.getProviderName()}`);
        const models = aiProvider.getSupportedModels();
        console.log(`   🧠 Supported models: ${models ? models.join(', ') : 'default'}`);;
      } catch (error) {
        console.log('\n⚠️  AI Provider: Not available');
      }

      console.log('\n🏗️  Architecture:');
      console.log('   📋 Pattern: Clean Architecture + Domain-Driven Design');
      console.log('   🔧 DI Container: Custom implementation');
      console.log('   🎯 Use Cases: Application layer orchestration');
      console.log('   📦 Entities: Rich domain models');

    } catch (error) {
      console.error('❌ Error getting system info:', error.message);
    }
  }
}
