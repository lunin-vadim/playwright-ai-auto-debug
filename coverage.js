// coverage.js - Простой импорт для системы покрытия UI тестов

// Экспортируем основные компоненты системы покрытия
export { test, expect } from "./src/infrastructure/coverage/testCoverageFixture.js";
export { TestElementTracker } from "./src/infrastructure/coverage/testElementTracker.js";
export { GlobalCoverageTracker } from "./src/infrastructure/coverage/globalCoverageTracker.js";

// Удобная функция для быстрой настройки
export function createTestCoverage(config = {}) {
  return {
    outputDir: config.outputDir || 'test-coverage-reports',
    trackingEnabled: config.trackingEnabled ?? true,
    ...config
  };
}
