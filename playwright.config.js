import { defineConfig } from '@playwright/test';
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

  // AI configuration for automatic debugging
  // For TypeScript projects: install playwright-ai-auto-debug and types will be connected automatically
  // ai_conf больше не добавляется в основной объект Playwright
}); 