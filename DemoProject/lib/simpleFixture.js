// DemoProject/lib/simpleFixture.js

import { test as base } from '@playwright/test';
import { SimpleCoveragePlugin } from './simpleCoveragePlugin.js';

// Глобальный экземпляр плагина - принудительно пересоздаем для свежих данных
let globalCoveragePlugin = null;

// Расширяем базовые фикстуры Playwright
const test = base.extend({
  // Автоматическая страница с покрытием
  page: async ({ page }, use, testInfo) => {
    // Принудительно пересоздаем плагин для чистых данных
    const config = testInfo.config?.use?.autoCoverage || { enabled: true };
    globalCoveragePlugin = new SimpleCoveragePlugin(config);

    // Настраиваем отслеживание для текущего теста
    await globalCoveragePlugin.setupTest(testInfo, page);

    // Используем страницу в тесте
    await use(page);

    // Завершаем отслеживание
    await globalCoveragePlugin.finishTest(testInfo);
  }
});

// Глобальный teardown для генерации отчетов
test.afterAll(async () => {
  if (globalCoveragePlugin) {
    await globalCoveragePlugin.generateFinalReports();
  }
});

export { test }; 