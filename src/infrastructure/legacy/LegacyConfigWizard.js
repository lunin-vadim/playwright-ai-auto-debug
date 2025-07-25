// src/infrastructure/legacy/LegacyConfigWizard.js

/**
 * Временная заглушка для старого модуля configWizard
 * TODO: Реализовать новый ConfigWizard в рамках Clean Architecture
 */

export async function startSetupWizard() {
  console.log('🧙‍♂️ Configuration Setup Wizard');
  console.log('─'.repeat(40));
  console.log('⚠️  This is a temporary implementation');
  console.log('🔄 The full setup wizard will be implemented in the new architecture');
  console.log('');
  console.log('For now, please:');
  console.log('1. Create ai.conf.js file manually');
  console.log('2. Set your API key as environment variable: export API_KEY=your-key');
  console.log('3. Configure Mistral AI endpoint in ai.conf.js');
  console.log('');
  console.log('Example ai.conf.js:');
  console.log(`
export default {
  api_key: process.env.API_KEY,
  ai_server: 'https://api.mistral.ai/v1/chat/completions',
  model: 'mistral-medium',
  allure_integration: false,
  mcp_integration: false,
  results_dir: 'test-results',
  error_file_patterns: ['**/*.json', '**/*.html']
};
  `);
  
  return { success: true, message: 'Setup wizard completed (legacy mode)' };
} 