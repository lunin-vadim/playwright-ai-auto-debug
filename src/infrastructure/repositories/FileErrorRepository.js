// src/infrastructure/repositories/FileErrorRepository.js

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { TestError } from '../../domain/entities/TestError.js';

/**
 * Репозиторий для поиска и загрузки файлов ошибок тестов
 */
export class FileErrorRepository {
  constructor() {
    this.name = 'FileErrorRepository';
  }

  /**
   * Находит все файлы ошибок в проекте
   * @param {string} projectPath - путь к проекту
   * @param {Object} config - конфигурация
   * @returns {Promise<TestError[]>} - массив ошибок тестов
   */
  async findErrors(projectPath, config) {
    console.log('🔍 Finding test error files...');
    
    const errorFiles = [];
    const patterns = config.error_file_patterns || [
      '**/error-context.md',
      'copy-prompt.txt',
      'error.txt',
      'test-error.md',
      '*-error.txt',
      '*-error.md'
    ];

    const resultsDir = config.results_dir || 'test-results';
    const searchPath = path.join(projectPath, resultsDir);

    // Проверяем существование директории результатов
    if (!fs.existsSync(searchPath)) {
      console.log(`⚠️  Results directory not found: ${searchPath}`);
      return [];
    }

    // Ищем файлы по каждому паттерну
    for (const pattern of patterns) {
      console.log(`🔍 Searching with pattern: ${pattern}`);
      
      // Добавляем **/ в начало паттерна если его нет для рекурсивного поиска
      const searchPattern = pattern.startsWith('**/') ? pattern : `**/${pattern}`;
      const fullPattern = path.join(searchPath, searchPattern);
      
      const files = await glob(fullPattern, { 
        ignore: ['**/node_modules/**'],
        absolute: true 
      });

      console.log(`📁 Found ${files.length} files with pattern: ${path.basename(pattern)}`);

      for (const filePath of files) {
        try {
          const errorFile = await this.loadErrorFile(filePath, config);
          if (errorFile) {
            errorFiles.push(errorFile);
          }
        } catch (error) {
          console.warn(`⚠️  Failed to load error file ${filePath}: ${error.message}`);
        }
      }
    }

    console.log(`📁 Found ${errorFiles.length} potential error files`);
    return errorFiles;
  }

  /**
   * Загружает файл ошибки и создает TestError entity
   * @param {string} filePath - путь к файлу ошибки
   * @param {Object} config - конфигурация
   * @returns {Promise<TestError|null>} - объект ошибки теста
   */
  async loadErrorFile(filePath, config) {
    try {
      if (!fs.existsSync(filePath)) {
        return null;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      
      if (!content || content.trim().length === 0) {
        console.warn(`⚠️  Empty error file: ${filePath}`);
        return null;
      }

      // Извлекаем метаданные из пути файла
      const metadata = this.extractMetadataFromPath(filePath);
      
      // Определяем тип ошибки из содержимого
      const errorType = this.detectErrorType(content);
      
      // Определяем серьезность ошибки
      const severity = this.calculateSeverity(content, errorType);

      // Извлекаем ключевые слова
      const keywords = this.extractKeywords(content);

      // Создаем TestError entity
      const testError = new TestError(
        filePath,
        content,
        errorType,
        metadata.testName
      );

      // Добавляем дополнительные свойства
      testError.keywords = keywords;
      testError.htmlPath = this.findRelatedHtmlReport(filePath, config);

      return testError;

    } catch (error) {
      console.error(`❌ Error loading file ${filePath}:`, error.message);
      return null;
    }
  }

  /**
   * Извлекает метаданные из пути к файлу
   * @param {string} filePath - путь к файлу
   * @returns {Object} - метаданные
   */
  extractMetadataFromPath(filePath) {
    const dirname = path.dirname(filePath);
    const basename = path.basename(filePath);
    const parts = dirname.split(path.sep);

    let timestamp = new Date();
    let fileSize = 0;
    try {
      const stat = fs.statSync(filePath);
      timestamp = stat.mtime;
      fileSize = stat.size;
    } catch {
      // file removed or permission denied between glob and stat — use defaults
    }

    return {
      testName: this.extractTestNameFromPath(parts),
      browser: this.extractBrowserFromPath(parts),
      timestamp,
      fileSize
    };
  }

  /**
   * Извлекает название теста из пути
   * @param {string[]} pathParts - части пути
   * @returns {string} - название теста
   */
  extractTestNameFromPath(pathParts) {
    // Ищем части пути, которые содержат название теста
    for (const part of pathParts) {
      if (part.includes('spec') || part.includes('test') || part.includes('Demo')) {
        return part.replace(/[_-]/g, ' ').trim();
      }
    }
    return 'Unknown Test';
  }

  /**
   * Извлекает браузер из пути
   * @param {string[]} pathParts - части пути
   * @returns {string} - браузер
   */
  extractBrowserFromPath(pathParts) {
    const browsers = ['chromium', 'firefox', 'webkit', 'chrome', 'safari'];
    for (const part of pathParts) {
      for (const browser of browsers) {
        if (part.toLowerCase().includes(browser)) {
          return browser;
        }
      }
    }
    return 'unknown';
  }

  /**
   * Определяет тип ошибки из содержимого
   * @param {string} content - содержимое файла
   * @returns {string} - тип ошибки
   */
  detectErrorType(content) {
    const lowerContent = content.toLowerCase();

    if (lowerContent.includes('timeout') || lowerContent.includes('timed out')) {
      return 'TIMEOUT';
    }
    if (lowerContent.includes('selector') || lowerContent.includes('element not found')) {
      return 'SELECTOR';
    }
    if (lowerContent.includes('network') || lowerContent.includes('connection')) {
      return 'NETWORK';
    }
    if (lowerContent.includes('assertion') || lowerContent.includes('expect')) {
      return 'ASSERTION';
    }
    if (lowerContent.includes('navigation') || lowerContent.includes('page')) {
      return 'NAVIGATION';
    }
    
    return 'UNKNOWN';
  }

  /**
   * Вычисляет серьезность ошибки
   * @param {string} content - содержимое файла
   * @param {string} errorType - тип ошибки
   * @returns {string} - уровень серьезности
   */
  calculateSeverity(content, errorType) {
    const criticalKeywords = ['fatal', 'critical', 'crash', 'abort'];
    const highKeywords = ['timeout', 'failed', 'error', 'exception'];
    const mediumKeywords = ['warning', 'retry', 'fallback'];

    const lowerContent = content.toLowerCase();

    if (criticalKeywords.some(keyword => lowerContent.includes(keyword))) {
      return 'CRITICAL';
    }
    if (highKeywords.some(keyword => lowerContent.includes(keyword)) || 
        ['TIMEOUT', 'ASSERTION'].includes(errorType)) {
      return 'HIGH';
    }
    if (mediumKeywords.some(keyword => lowerContent.includes(keyword))) {
      return 'MEDIUM';
    }

    return 'LOW';
  }

  /**
   * Извлекает ключевые слова из содержимого
   * @param {string} content - содержимое файла
   * @returns {string[]} - массив ключевых слов
   */
  extractKeywords(content) {
    const keywords = new Set();
    
    // Технические термины
    const techTerms = [
      'playwright', 'chromium', 'firefox', 'webkit',
      'selector', 'element', 'timeout', 'click', 'type',
      'navigation', 'page', 'frame', 'dialog'
    ];

    const lowerContent = content.toLowerCase();
    
    for (const term of techTerms) {
      if (lowerContent.includes(term)) {
        keywords.add(term);
      }
    }

    // Извлекаем селекторы
    const selectorMatches = content.match(/['"`][\w\-#\.\[\]="':]+['"`]/g);
    if (selectorMatches) {
      selectorMatches.slice(0, 5).forEach(match => {
        keywords.add(match.replace(/['"`]/g, ''));
      });
    }

    return Array.from(keywords).slice(0, 10); // Ограничиваем количество
  }

  /**
   * Находит связанный HTML отчет
   * @param {string} errorFilePath - путь к файлу ошибки
   * @param {Object} config - конфигурация
   * @returns {string|null} - путь к HTML отчету
   */
  findRelatedHtmlReport(errorFilePath, config) {
    try {
      const reportDir = config.report_dir || 'playwright-report';
      const projectDir = path.dirname(path.dirname(errorFilePath));
      const htmlReportPath = path.join(projectDir, reportDir, 'index.html');

      if (fs.existsSync(htmlReportPath)) {
        return htmlReportPath;
      }
    } catch (error) {
      console.warn(`⚠️  Could not find HTML report: ${error.message}`);
    }

    return null;
  }
}
