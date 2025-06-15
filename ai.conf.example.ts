import type { AiConfig } from './types/index.js';

export const ai_conf: AiConfig = {
  api_key: process.env.API_KEY || '8C33pPUpKV8abmFBcxoH6T9JE44lWbBl',
  ai_server: 'https://api.mistral.ai',
  model: 'mistral-medium',
  results_dir: 'test-results',
  report_dir: 'playwright-report',
  max_prompt_length: 2000,
  request_delay: 1000,
  error_file_patterns: [
    'copy-prompt.txt',
    'error-context.md',
    'error.txt',
    'test-error.md',
    '*-error.txt',
    '*-error.md'
  ],
  save_ai_responses: true,
  ai_responses_dir: 'ai-responses',
  ai_response_filename_template: 'ai-response-{timestamp}-{index}.md',
  include_metadata: true,
  allure_integration: true,
  allure_results_dir: 'allure-results',
  messages: [
    {
      role: 'system',
      content: 'Ты AI помощник по отладке Playwright тестов. Анализируй ошибки и предлагай конкретные решения на русском языке. Отвечай кратко и по делу.'
    },
    {
      role: 'system',
      content: 'При анализе ошибок учитывай специфику нашего проекта: используем React, TypeScript и тестируем e-commerce функционал.'
    }
  ]
}; 