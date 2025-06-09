
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  reporter: 'html',
  
  ai_conf: {
    api_key: 'test_api_key_123',
    ai_server: 'https://api.mistral.ai',
    model: 'mistral-medium',
    results_dir: 'custom-results',
    max_prompt_length: 3000,
    request_delay: 500,
    messages: [
      {
        role: 'system',
        content: 'Кастомное системное сообщение для тестов'
      }
    ]
  }
});
