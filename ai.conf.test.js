export default {
  api_key: 'test-key',
  ai_server: 'https://api.mistral.ai',
  model: 'mistral-medium',
  results_dir: 'test-results',
  error_file_patterns: [
    '**/error-context.md',
    'copy-prompt.txt',
    'error.txt'
  ],
  save_ai_responses: true,
  allure_integration: true
}; 