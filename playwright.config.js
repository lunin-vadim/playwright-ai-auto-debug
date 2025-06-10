import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  reporter: 'html',
  
  ai_conf: {
    api_key: 'test_key_for_demo',
    ai_server: 'https://api.mistral.ai',
    model: 'mistral-medium',
    results_dir: 'test-results',
    max_prompt_length: 2000,
    request_delay: 1000,
    error_file_patterns: [
      'copy-prompt.txt',
      'error-context.md',
      'error.txt',
      '*-error.txt',
      '*-error.md'
    ],
    messages: [
      {
        role: 'system',
        content: 'Ты AI помощник по отладке Playwright тестов.'
      }
    ]
  }
}); 