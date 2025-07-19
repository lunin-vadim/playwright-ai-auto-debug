export const ai_conf = {
  api_key: process.env.API_KEY || '',
  ai_server: 'https://api.mistral.ai',
  model: 'mistral-medium',
  results_dir: 'DemoProject/test-results',
  report_dir: 'DemoProject/playwright-report',
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
  ai_responses_dir: 'test-results',
  ai_response_filename_template: 'ai-response-{timestamp}-{index}.md',
  include_metadata: true,
  allure_integration: true,
  allure_results_dir: 'allure-results',
  
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