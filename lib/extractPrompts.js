import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';

/**
 * Рекурсивно ищет все copy-prompt.txt файлы в директории test-results
 * @param {string} dir - директория для поиска
 * @returns {Promise<Array<{path: string, content: string, htmlPath: string}>>}
 */
async function findPromptFiles(dir = 'test-results') {
  const prompts = [];
  
  try {
    const entries = await readdir(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stats = await stat(fullPath);
      
      if (stats.isDirectory()) {
        // Рекурсивно ищем в подпапках
        const subPrompts = await findPromptFiles(fullPath);
        prompts.push(...subPrompts);
      } else if (entry === 'copy-prompt.txt') {
        // Найден файл с промптом
        const content = await readFile(fullPath, 'utf-8');
        const htmlPath = join(dir, 'index.html');
        
        prompts.push({
          path: fullPath,
          content: content.trim(),
          htmlPath
        });
        
        console.log(`✅ Найден prompt: ${fullPath}`);
      }
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('⚠️  Папка test-results не найдена');
      return [];
    }
    throw error;
  }
  
  return prompts;
}

export { findPromptFiles }; 