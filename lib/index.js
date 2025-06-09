import { findPromptFiles } from './extractPrompts.js';
import { sendToMistral } from './sendToMistral.js';
import { updateHtmlReport } from './updateHtml.js';
import { loadAiConfig } from './config.js';

/**
 * Основная функция для автоматической отладки Playwright тестов
 * @param {string} projectRoot - корневая папка проекта (по умолчанию текущая)
 */
async function debugPlaywrightTests(projectRoot = process.cwd()) {
  try {
    // 0. Загружаем конфигурацию AI
    console.log('⚙️  Загрузка конфигурации AI...');
    const config = await loadAiConfig(projectRoot);
    
    // 1. Находим все файлы с промптами
    console.log('🔍 Поиск файлов с ошибками...');
    const prompts = await findPromptFiles(config);
    
    if (prompts.length === 0) {
      console.log('ℹ️  Файлы с ошибками не найдены');
      return;
    }
    
    console.log(`📋 Найдено ${prompts.length} файл(ов) с ошибками\n`);
    
    // 2. Обрабатываем каждый промпт
    for (let i = 0; i < prompts.length; i++) {
      const { path, content, htmlPath } = prompts[i];
      
      console.log(`\n📝 Обработка ${i + 1}/${prompts.length}: ${path}`);
      
      try {
        // Ограничиваем размер промпта для экономии токенов
        const maxLength = config.max_prompt_length || 2000;
        const truncatedContent = content.length > maxLength 
          ? content.substring(0, maxLength) + '\n...(содержимое обрезано)'
          : content;
        
        // 3. Отправляем в AI
        const solution = await sendToMistral(truncatedContent, config);
        
        if (!solution) {
          console.log('⚠️  Пустой ответ от AI');
          continue;
        }
        
        // 4. Обновляем HTML отчет
        await updateHtmlReport(htmlPath, truncatedContent, solution);
        
        // Небольшая задержка между запросами для соблюдения rate limits
        if (i < prompts.length - 1) {
          const delay = config.request_delay || 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
      } catch (error) {
        console.error(`❌ Ошибка при обработке ${path}:`, error.message);
        continue;
      }
    }
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error.message);
    throw error;
  }
}

export { debugPlaywrightTests }; 