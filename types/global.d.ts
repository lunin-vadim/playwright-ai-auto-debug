import type { AiConfig } from './index';

// Extend global Playwright types to support ai_conf
declare module '@playwright/test' {
  interface PlaywrightTestConfig {
    /** AI configuration for automatic debugging */
    ai_conf?: AiConfig;
  }
} 