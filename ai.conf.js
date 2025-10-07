export default {
  api_key: process.env.API_KEY || '',
  ai_server: 'https://api.openai.com/v1/chat/completions',
  model: 'gpt-3.5-turbo',
  results_dir: 'test-results',
  report_dir: 'playwright-report',
  max_prompt_length: 2000,
  request_delay: 1000,
  // Параллельная обработка AI дебага
  parallel_enabled: true,
  parallel_limit: Math.max(1, Number(process.env.PW_AI_PARALLEL || 4)),
  error_file_patterns: [
    '**/error-context.md',
    'copy-prompt.txt',
    'error.txt',
    'test-error.md',
    '*-error.txt',
    '*-error.md'
  ],
  save_ai_responses: true,
  ai_responses_dir: 'test-results',
  ai_response_filename_template: 'ai-response-{timestamp}-{index}.md',
  include_metadata: true,
  allure_integration: true,
  allure_results_dir: 'allure-results',
  
  // Summary report settings
  summary_report: true, // Генерировать общий отчет по всем дефектам
  summary_report_formats: ['html', 'markdown', 'json'], // Форматы общего отчета
  
  // MCP Integration settings
  mcp_integration: false, // Enabled via --use-mcp flag
  mcp_ws_host: 'localhost',
  mcp_ws_port: 3001,
  mcp_timeout: 30000,
  mcp_retry_attempts: 3,
  mcp_command: 'npx',
  mcp_args: ['@playwright/mcp@latest'],
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