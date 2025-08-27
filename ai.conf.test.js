export default {
  api_key: 'test-key',
  ai_server: 'https://api.openai.com/v1/chat/completions',
  model: 'gpt-3.5-turbo',
  results_dir: 'test-results',
  error_file_patterns: [
    '**/error-context.md',
    'copy-prompt.txt',
    'error.txt'
  ],
  save_ai_responses: true,
  allure_integration: true
}; 