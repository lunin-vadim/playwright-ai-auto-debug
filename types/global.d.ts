import type { AiConfig } from './index';

// Расширяем глобальные типы Playwright для поддержки ai_conf
declare module '@playwright/test' {
  interface PlaywrightTestConfig {
    /** Конфигурация AI для автоматической отладки */
    ai_conf?: AiConfig;
  }
} 