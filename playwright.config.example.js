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
  // Для TypeScript проектов: установите playwright-ai-auto-debug и типы будут подключены автоматически
  ai_conf: {
    // Обязательные параметры
    api_key: '8C33pPUpKV8abmFBcxoH6T9JE44lWbBl', // Ваш API ключ
    
    // Опциональные параметры (значения по умолчанию)
    ai_server: 'https://api.mistral.ai',        // URL AI сервера
    model: 'mistral-medium',                    // Модель AI
    results_dir: 'test-results',                // Папка с результатами тестов
    report_dir: 'playwright-report',            // Папка с HTML отчетами
    max_prompt_length: 2000,                    // Максимальная длина промпта
    request_delay: 1000,                        // Задержка между запросами (мс)
    
    // Паттерны файлов с ошибками для поиска (опционально)
    error_file_patterns: [
      'copy-prompt.txt',      // Стандартный файл Playwright
      'error-context.md',     // Альтернативный формат (новый)
      'error.txt',            // Простой текстовый файл
      'test-error.md',        // Markdown с ошибкой
      '*-error.txt',          // Файлы заканчивающиеся на -error.txt
      '*-error.md'            // Файлы заканчивающиеся на -error.md
    ],
    
    // Кастомные сообщения для AI (опционально)
    messages: [
      {
        role: 'system',
        content: 'Ты AI помощник по отладке Playwright тестов. Анализируй ошибки и предлагай конкретные решения на русском языке. Отвечай кратко и по делу.'
      },
      // Можно добавить дополнительные системные сообщения
      {
        role: 'system', 
        content: 'При анализе ошибок учитывай специфику нашего проекта: используем React, TypeScript и тестируем e-commerce функционал.'
      }
    ]
  }
}); 