const { test as base } = require('@playwright/test');
const { AutoCoveragePlugin } = require('./autoCoveragePlugin');

// Глобальный экземпляр плагина
let globalCoveragePlugin = null;

// Расширяем базовые фикстуры Playwright
const test = base.extend({
  // Автоматическая страница с покрытием
  page: async ({ page }, use, testInfo) => {
    // Инициализируем плагин если нужно
    if (!globalCoveragePlugin) {
      const config = testInfo.config?.use?.autoCoverage || {};
      globalCoveragePlugin = new AutoCoveragePlugin(config);
    }

    // Настраиваем отслеживание для текущего теста
    await globalCoveragePlugin.setupTest(testInfo, page);

    // Используем страницу в тесте
    await use(page);

    // Завершаем отслеживание
    await globalCoveragePlugin.finishTest(testInfo);
  },

  // Автоматический контекст с покрытием
  context: async ({ context }, use, testInfo) => {
    // Настраиваем перехват для всех новых страниц в контексте
    context.on('page', async (page) => {
      if (globalCoveragePlugin) {
        await globalCoveragePlugin.setupTest(testInfo, page);
      }
    });

    await use(context);
  }
});

// Глобальный teardown для генерации отчетов
test.afterAll(async () => {
  if (globalCoveragePlugin) {
    await globalCoveragePlugin.generateFinalReports();
  }
});

module.exports = { test }; 