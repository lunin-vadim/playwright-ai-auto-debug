import dotenv from 'dotenv';

dotenv.config();

export const ai_conf = {
  // API ключ - установите через переменную окружения или замените на свой
  api_key: '8C33pPUpKV8abmFBcxoH6T9JE44lWbBl',
  
  // Настройки AI сервера
  ai_server: 'http://192.168.100.8:1234/v1/chat/completions',
  model: 'qwen3-14b', // Используем более доступную модель
  
  // Директории
  results_dir: 'test-results',
  report_dir: 'playwright-report',
  ai_responses_dir: 'ai-responses',
  
  // Настройки обработки
  max_prompt_length: 2000,
  request_delay: 1000, // Увеличиваем задержку до 3 секунд
  stream: true, // Включаем потоковую передачу ответов
  
  // Паттерны файлов ошибок
  error_file_patterns: [
    'copy-prompt.txt',
    'error-context.md',
    'error.txt',
    'test-error.md',
    '*-error.txt',
    '*-error.md'
  ],
  
  // Сохранение AI ответов
  save_ai_responses: true,
  ai_responses_dir: 'allure-results',
  ai_response_filename_template: 'ai-response-{timestamp}-{index}.md',
  include_metadata: true,
  
  // 🎯 Allure интеграция - ВКЛЮЧЕНА
  allure_integration: true,
  allure_results_dir: 'allure-results',
  
  // Настройки AI сообщений
  messages: [
    {
      role: 'system',
      content: 'You are an AI assistant for debugging Playwright tests. Analyze errors and offer specific solutions in English. Answer briefly and to the point with code examples.'
    },
    {
      role: 'system',
      content: 'When analyzing errors, keep in mind: this is a demo project for playwright-ai-auto-debug. Offer practical solutions taking into account modern testing practices.'
    }
    ]
}; 