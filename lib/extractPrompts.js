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
        const subPrompts = await findPromptFilesRecursive(fullPath, errorFilePatterns);
        prompts.push(...subPrompts);
      } else if (isErrorFile(entry, errorFilePatterns)) {
        // Найден файл с ошибкой
        const content = await readFile(fullPath, 'utf-8');
        
        // Ищем HTML файл в той же папке или родительской
        let htmlPath = join(dir, 'index.html');
        try {
          await stat(htmlPath);
        } catch {
          // Если нет в корне, ищем в папке с тестом
          htmlPath = join(dirname(fullPath), 'index.html');
        }
        
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
 * @returns {Promise<Array<{path: string, content: string, htmlPath: string}>>}
 */
async function findPromptFilesRecursive(dir, errorFilePatterns) {
  const prompts = [];
  
  try {
    const entries = await readdir(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stats = await stat(fullPath);
      
      if (stats.isDirectory()) {
        // Рекурсивно ищем в подпапках
        const subPrompts = await findPromptFilesRecursive(fullPath, errorFilePatterns);
        prompts.push(...subPrompts);
      } else if (isErrorFile(entry, errorFilePatterns)) {
        // Найден файл с ошибкой
        const content = await readFile(fullPath, 'utf-8');
        
        // Ищем HTML файл в той же папке или родительской
        let htmlPath = join(dir, 'index.html');
        try {
          await stat(htmlPath);
        } catch {
          // Если нет в текущей папке, ищем в родительской
          htmlPath = join(dirname(dir), 'index.html');
        }
        
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