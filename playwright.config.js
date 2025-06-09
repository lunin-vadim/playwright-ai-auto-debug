import { defineConfig } from '@playwright/test';

export default defineConfig({
  // Обычные настройки Playwright
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },

  // Конфигурация AI для автоматической отладки
  ai_conf: {
    // Обязательные параметры
    api_key: process.env.MISTRAL_API_KEY || 'demo_key_for_testing',
    
    // Опциональные параметры
    ai_server: 'https://api.mistral.ai',
    model: 'mistral-medium',
    results_dir: 'test-results',
    max_prompt_length: 2000,
    request_delay: 1000,
    
    // Кастомные сообщения для AI
    messages: [
      {
        role: 'system',
        content: 'Ты AI помощник по отладке Playwright тестов. Анализируй ошибки и предлагай конкретные решения на русском языке. Отвечай кратко и по делу.'
      },
      {
        role: 'system', 
        content: 'При анализе ошибок учитывай специфику проекта: используем современный JavaScript/TypeScript стек.'
      }
    ]
  }
}); 