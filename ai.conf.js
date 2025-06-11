export const ai_conf = {
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
  messages: [
    {
      role: 'system',
      content: 'You are an AI assistant for debugging Playwright tests. Analyze errors and suggest specific solutions in English. Be concise and to the point.'
    },
    {
      role: 'system',
      content: 'When analyzing errors, consider our project specifics: we use React, TypeScript and test e-commerce functionality.'
    }
  ]
}; 