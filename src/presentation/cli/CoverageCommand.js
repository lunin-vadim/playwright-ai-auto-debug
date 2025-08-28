// src/presentation/cli/CoverageCommand.js

import fs from 'fs';
import path from 'path';

/**
 * CLI команда для настройки UI Test Coverage
 */
export class CoverageCommand {
  constructor() {
    this.templateDir = path.resolve(process.cwd());
  }

  /**
   * 🎯 Инициализация системы покрытия в проекте пользователя
   */
  async init(options = {}) {
    console.log('🎯 Настройка UI Test Coverage...');
    
    try {
      // Создаем директорию для coverage файлов
      const coverageDir = path.join(this.templateDir, 'coverage-lib');
      if (!fs.existsSync(coverageDir)) {
        fs.mkdirSync(coverageDir, { recursive: true });
      }

      // Копируем файлы системы покрытия
      await this.copyCoverageFiles(coverageDir);
      
      // Создаем пример теста
      await this.createExampleTest();
      
      // Обновляем package.json
      await this.updatePackageJson();

      console.log('✅ UI Test Coverage настроено успешно!');
      console.log('\n📖 Как использовать:');
      console.log('1. Импортируйте: import { test, expect } from "./coverage-lib/fixture.js"');
      console.log('2. Запустите тесты: npm test');
      console.log('3. Откройте отчет: open test-coverage-reports/index.html');
      
    } catch (error) {
      console.error('❌ Ошибка настройки покрытия:', error.message);
      throw error;
    }
  }

  /**
   * 📁 Копирование файлов системы покрытия
   */
  async copyCoverageFiles(targetDir) {
    const sourceDir = path.resolve(path.dirname(import.meta.url.replace('file://', '')), '../../infrastructure/coverage');
    
    // Список файлов для копирования
    const filesToCopy = [
      'testElementTracker.js',
      'globalCoverageTracker.js',
      'testCoverageFixture.js'
    ];

    for (const fileName of filesToCopy) {
      const sourcePath = path.join(sourceDir, fileName);
      const targetPath = path.join(targetDir, fileName);
      
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`📄 Скопирован: ${fileName}`);
      }
    }

    // Создаем простой fixture.js для пользователей
    const fixtureContent = `// coverage-lib/fixture.js - Простой импорт для UI Test Coverage

export { test, expect } from './testCoverageFixture.js';
export { TestElementTracker } from './testElementTracker.js'; 
export { GlobalCoverageTracker } from './globalCoverageTracker.js';
`;
    
    fs.writeFileSync(path.join(targetDir, 'fixture.js'), fixtureContent);
    console.log('📄 Создан: fixture.js');
  }

  /**
   * 📝 Создание примера теста
   */
  async createExampleTest() {
    const exampleTest = `// example-coverage.spec.js - Пример использования UI Test Coverage

import { test, expect } from './coverage-lib/fixture.js';

test.describe('🎯 UI Coverage Example', () => {
  test('✅ Тест с автоматическим отслеживанием покрытия', async ({ page }) => {
    // Переходим на страницу - автоматически анализируются все элементы
    await page.goto('https://playwright.dev/');
    
    // Каждое взаимодействие отслеживается автоматически
    await page.locator('text=Docs').click();
    await page.goBack();
    
    await page.locator('[aria-label="Search (Command+K)"]').click();
    await page.keyboard.press('Escape');
    
    console.log('✅ Покрытие элементов отслежено автоматически');
  });
  
  // После всех тестов будет создан объединенный отчет:
  // test-coverage-reports/index.html
});
`;

    const examplePath = path.join(this.templateDir, 'example-coverage.spec.js');
    if (!fs.existsSync(examplePath)) {
      fs.writeFileSync(examplePath, exampleTest);
      console.log('📄 Создан: example-coverage.spec.js');
    }
  }

  /**
   * 📦 Обновление package.json
   */
  async updatePackageJson() {
    const packagePath = path.join(this.templateDir, 'package.json');
    
    if (fs.existsSync(packagePath)) {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      // Добавляем скрипты если их нет
      if (!packageJson.scripts) {
        packageJson.scripts = {};
      }
      
      if (!packageJson.scripts['test:coverage']) {
        packageJson.scripts['test:coverage'] = 'npx playwright test && echo "📊 Отчет: test-coverage-reports/index.html"';
      }
      
      if (!packageJson.scripts['coverage:open']) {
        packageJson.scripts['coverage:open'] = 'open test-coverage-reports/index.html';
      }

      // Добавляем type: module если нет
      if (!packageJson.type) {
        packageJson.type = 'module';
      }
      
      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
      console.log('📦 Обновлен: package.json');
    }
  }

  /**
   * ℹ️ Информация о системе покрытия
   */
  async info() {
    console.log('🎯 UI Test Coverage System');
    console.log('📊 Реальное покрытие элементов интерфейса тестами');
    console.log('\n✨ Возможности:');
    console.log('- Автоматическое отслеживание взаимодействий с элементами');
    console.log('- Объединенные отчеты с drill-down навигацией');
    console.log('- Анализ непокрытых элементов с предлагаемыми селекторами');
    console.log('- Интерактивные HTML отчеты');
    console.log('\n🚀 Команды:');
    console.log('- npx playwright-ai coverage init  # Настройка в проекте');
    console.log('- npm run test:coverage            # Запуск тестов с покрытием');
    console.log('- npm run coverage:open            # Открытие отчета');
  }
}
