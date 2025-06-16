// DemoProject/ai.conf.js
export const ai_conf = {
  // API ключ - установите через переменную окружения или замените на свой
  api_key: process.env.API_KEY || 'your-api-key-here',
  
  // Настройки AI сервера
  ai_server: 'https://api.mistral.ai',
  model: 'mistral-medium',
  
  // Директории
  results_dir: 'test-results',
  report_dir: 'playwright-report',
  ai_responses_dir: 'ai-responses',
  
  // Настройки обработки
  max_prompt_length: 2000,
  request_delay: 1000,
  
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
  ai_response_filename_template: 'ai-response-{timestamp}-{index}.md',
  include_metadata: true,
  
  // 🎯 Allure интеграция - ВКЛЮЧЕНА
  allure_integration: true,
  allure_results_dir: 'allure-results',
  
  // Настройки AI сообщений
  messages: [
    {
      role: 'system',
      content: 'Ты AI помощник по отладке Playwright тестов. Анализируй ошибки и предлагай конкретные решения на русском языке. Отвечай кратко и по делу с примерами кода.'
    },
    {
      role: 'system',
      content: 'При анализе ошибок учитывай: это демонстрационный проект для playwright-ai-auto-debug. Предлагай практические решения с учетом современных практик тестирования.'
    }
  ]
}; 