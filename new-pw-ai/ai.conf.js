import dotenv from 'dotenv';
dotenv.config();

export default {
  api_key: process.env.API_KEY || '',
  ai_server: 'https://api.mistral.ai/v1/chat/completions',
  model: 'codestral-latest',

  results_dir: 'test-results',
  report_dir: 'playwright-report',

  allure_integration: true,
  allure_results_dir: 'allure-results',

  save_ai_responses: true,
  ai_responses_dir: 'ai-responses',

  summary_report: true,
  summary_report_formats: ['html'],

  max_prompt_length: 4000,
  request_delay: 1000,
  parallel_enabled: true,
  parallel_limit: 3,

  messages: [
    {
      role: 'system',
      content:
        'You are an AI assistant for debugging Playwright tests. ' +
        'Analyze the error and suggest a specific fix with a short code example. Be concise.',
    },
  ],
};
