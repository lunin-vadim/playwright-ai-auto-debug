import { findPromptFiles } from './extractPrompts.js';
import { sendToMistral } from './sendToMistral.js';
import { updateHtmlReport } from './updateHtml.js';

/**
 * Основная функция для автоматической отладки Playwright тестов
 */
async function debugPlaywrightTests() {
  try {
    // 1. Находим все файлы с промптами
    console.log('🔍 Поиск файлов с ошибками...');
    const prompts = await findPromptFiles();
    
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
        const truncatedContent = content.length > 2000 
          ? content.substring(0, 2000) + '\n...(содержимое обрезано)'
          : content;
        
        // 3. Отправляем в Mistral AI
        const solution = await sendToMistral(truncatedContent);
        
        if (!solution) {
          console.log('⚠️  Пустой ответ от AI');
          continue;
        }
        
        // 4. Обновляем HTML отчет
        await updateHtmlReport(htmlPath, truncatedContent, solution);
        
        // Небольшая задержка между запросами для соблюдения rate limits
        if (i < prompts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
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