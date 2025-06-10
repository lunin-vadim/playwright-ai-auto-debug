import { readdir, readFile, stat } from 'fs/promises';
import { join, dirname } from 'path';

/**
 * Проверяет является ли файл файлом с ошибками
 * @param {string} filename - имя файла
 * @param {Array<string>} patterns - паттерны файлов для поиска
 * @returns {boolean}
 */
function isErrorFile(filename, patterns) {
  return patterns.some(pattern => {
    if (pattern.includes('*')) {
      // Простая поддержка wildcards
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(filename);
    }
    return filename === pattern;
  });
}

/**
 * Ищет HTML отчет в различных возможных местах
 * @param {string} errorFilePath - путь к файлу с ошибкой
 * @param {Object} config - конфигурация AI
 * @returns {Promise<string>} - путь к HTML отчету
 */
async function findHtmlReport(errorFilePath, config) {
  const reportDir = config.report_dir || 'playwright-report';
  const resultsDir = config.results_dir || 'test-results';
  
  // Возможные пути к HTML отчету (в порядке приоритета)
  const possiblePaths = [
    // 1. В папке playwright-report (стандартное расположение)
    join(reportDir, 'index.html'),
    
    // 2. В корне проекта
    'index.html',
    
    // 3. В папке с результатами тестов
    join(resultsDir, 'index.html'),
    
    // 4. В той же папке что и файл с ошибкой
    join(dirname(errorFilePath), 'index.html'),
    
    // 5. В родительской папке файла с ошибкой
    join(dirname(dirname(errorFilePath)), 'index.html'),
    
    // 6. Альтернативные названия в playwright-report
    join(reportDir, 'report.html'),
    join(reportDir, 'test-report.html')
  ];
  
  // Проверяем каждый возможный путь
  for (const htmlPath of possiblePaths) {
    try {
      await stat(htmlPath);
      console.log(`📄 Найден HTML отчет: ${htmlPath}`);
      return htmlPath;
    } catch {
      // Файл не существует, продолжаем поиск
    }
  }
  
  // Если ничего не найдено, возвращаем путь по умолчанию
  const defaultPath = join(reportDir, 'index.html');
  console.log(`⚠️  HTML отчет не найден, будет использован: ${defaultPath}`);
  return defaultPath;
}

/**
 * Рекурсивно ищет файлы с ошибками в директории результатов
 * @param {Object} config - конфигурация AI с путем к результатам
 * @returns {Promise<Array<{path: string, content: string, htmlPath: string}>>}
 */
async function findPromptFiles(config) {
  const dir = config.results_dir || 'test-results';
  
  // Паттерны файлов для поиска (конфигурируемые)
  const errorFilePatterns = config.error_file_patterns || [
    'copy-prompt.txt',      // Стандартный файл Playwright
    'error-context.md',     // Альтернативный формат
    'error.txt',            // Простой текстовый файл
    'test-error.md',        // Markdown с ошибкой
    '*-error.txt',          // Файлы заканчивающиеся на -error.txt
    '*-error.md'            // Файлы заканчивающиеся на -error.md
  ];
  
  const prompts = [];
  
  try {
    const entries = await readdir(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stats = await stat(fullPath);
      
      if (stats.isDirectory()) {
        // Рекурсивно ищем в подпапках
        const subPrompts = await findPromptFilesRecursive(fullPath, errorFilePatterns, config);
        prompts.push(...subPrompts);
      } else if (isErrorFile(entry, errorFilePatterns)) {
        // Найден файл с ошибкой
        const content = await readFile(fullPath, 'utf-8');
        
        // Ищем HTML отчет
        const htmlPath = await findHtmlReport(fullPath, config);
        
        prompts.push({
          path: fullPath,
          content: content.trim(),
          htmlPath,
          fileType: entry.split('.').pop() // расширение файла
        });
        
        console.log(`✅ Найден файл с ошибкой: ${fullPath}`);
      }
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`⚠️  Папка ${dir} не найдена`);
      return [];
    }
    throw error;
  }
  
  return prompts;
}

/**
 * Вспомогательная функция для рекурсивного поиска в подпапках
 * @param {string} dir - директория для поиска
 * @param {Array<string>} errorFilePatterns - паттерны файлов для поиска
 * @param {Object} config - конфигурация AI
 * @returns {Promise<Array<{path: string, content: string, htmlPath: string}>>}
 */
async function findPromptFilesRecursive(dir, errorFilePatterns, config) {
  const prompts = [];
  
  try {
    const entries = await readdir(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stats = await stat(fullPath);
      
      if (stats.isDirectory()) {
        // Рекурсивно ищем в подпапках
        const subPrompts = await findPromptFilesRecursive(fullPath, errorFilePatterns, config);
        prompts.push(...subPrompts);
      } else if (isErrorFile(entry, errorFilePatterns)) {
        // Найден файл с ошибкой
        const content = await readFile(fullPath, 'utf-8');
        
        // Ищем HTML отчет
        const htmlPath = await findHtmlReport(fullPath, config);
        
        prompts.push({
          path: fullPath,
          content: content.trim(),
          htmlPath,
          fileType: entry.split('.').pop() // расширение файла
        });
        
        console.log(`✅ Найден файл с ошибкой: ${fullPath}`);
      }
    }
  } catch (error) {
    // Игнорируем ошибки доступа к отдельным папкам
    console.log(`⚠️  Не удалось прочитать папку: ${dir}`);
  }
  
  return prompts;
}

export { findPromptFiles }; 