import type { AiConfig } from './types/index.js';

export const ai_conf: AiConfig = {
  api_key: process.env.API_KEY || 'your-api-key-here',
  ai_server: 'https://api.openai.com/v1/chat/completions',
  model: 'gpt-3.5-turbo',
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
  ai_responses_dir: 'test-results',
  ai_response_filename_template: 'ai-response-{timestamp}-{index}.md',
  include_metadata: true,
  allure_integration: true,
  allure_results_dir: 'allure-results',
  mcp_integration: false,
  mcp_ws_host: 'localhost',
  mcp_ws_port: 3001,
  mcp_timeout: 30000,
  mcp_retry_attempts: 3,
  mcp_command: 'npx',
  mcp_args: ['@playwright/mcp@latest'],
  messages: [
    {
      role: 'system',
      content: 'You are an AI assistant for debugging Playwright tests. Analyze errors and suggest specific solutions in Russian. Be concise and practical with code examples.'
    },
    {
      role: 'system',
      content: 'When MCP DOM snapshots are available, use the exact element references (ref) provided. Focus on reliable selectors like getByRole, getByTestId, and getByText. Provide actionable Playwright code that can be validated through browser automation.'
    }
  ]
}; 