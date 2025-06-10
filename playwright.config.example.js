import { defineConfig } from '@playwright/test';

export default defineConfig({
  // Regular Playwright settings
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

  // AI configuration for automatic debugging
  // For TypeScript projects: install playwright-ai-auto-debug and types will be connected automatically
  ai_conf: {
    // Required parameters
    api_key: '8C33pPUpKV8abmFBcxoH6T9JE44lWbBl', // Your API key
    
    // Optional parameters (default values)
    ai_server: 'https://api.mistral.ai',        // AI server URL
    model: 'mistral-medium',                    // AI model
    results_dir: 'test-results',                // Test results folder
    report_dir: 'playwright-report',            // HTML reports folder
    max_prompt_length: 2000,                    // Maximum prompt length
    request_delay: 1000,                        // Delay between requests (ms)
    
    // Error file patterns to search for (optional)
    error_file_patterns: [
      'copy-prompt.txt',      // Standard Playwright file
      'error-context.md',     // Alternative format (new)
      'error.txt',            // Simple text file
      'test-error.md',        // Markdown with error
      '*-error.txt',          // Files ending with -error.txt
      '*-error.md'            // Files ending with -error.md
    ],
    
    // Custom AI messages (optional)
    messages: [
      {
        role: 'system',
        content: 'You are an AI assistant for debugging Playwright tests. Analyze errors and suggest specific solutions in English. Be concise and to the point.'
      },
      // You can add additional system messages
      {
        role: 'system', 
        content: 'When analyzing errors, consider our project specifics: we use React, TypeScript and test e-commerce functionality.'
      }
    ]
  }
}); 