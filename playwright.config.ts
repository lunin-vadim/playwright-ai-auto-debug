import { defineConfig } from '@playwright/test';
// Import types for ai_conf support (install playwright-ai-auto-debug first)
import 'playwright-ai-auto-debug';
import { ai_conf } from './ai.conf.js';

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

  // AI configuration imported from ai.conf.js
  // This provides automatic debugging capabilities
  ...ai_conf
}); 