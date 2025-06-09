import { readFile, writeFile, access } from 'fs/promises';
import * as cheerio from 'cheerio';

/**
 * Обновляет HTML отчет, добавляя блок с AI-отладкой
 * @param {string} htmlPath - путь к HTML файлу
 * @param {string} error - текст ошибки
 * @param {string} solution - решение от AI
 */
async function updateHtmlReport(htmlPath, error, solution) {
  try {
    // Проверяем существование HTML файла
    await access(htmlPath);
  } catch {
    console.log(`⚠️  HTML файл не найден: ${htmlPath}`);
    return;
  }
  
  try {
    const htmlContent = await readFile(htmlPath, 'utf-8');
    const $ = cheerio.load(htmlContent);
    
    // Удаляем существующий AI debug блок если есть
    $('.ai-debug').remove();
    
    // Создаем новый блок с AI отладкой
    const aiDebugHtml = `
      <div class="ai-debug" style="border: 2px solid #4CAF50; border-radius: 8px; padding: 15px; margin: 20px 0; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <h3 style="color: #2E7D32; margin: 0 0 15px 0; font-size: 18px; display: flex; align-items: center;">
          🔍 AI Debug
        </h3>
        <div style="margin-bottom: 15px;">
          <p style="margin: 0 0 8px 0; font-weight: 600; color: #d32f2f;">Ошибка:</p>
          <pre style="background: #ffebee; padding: 10px; border-radius: 4px; margin: 0; white-space: pre-wrap; font-size: 13px; color: #c62828; border-left: 4px solid #f44336;">${escapeHtml(error)}</pre>
        </div>
        <div>
          <p style="margin: 0 0 8px 0; font-weight: 600; color: #2E7D32;">Решение от AI:</p>
          <div style="background: #e8f5e8; padding: 10px; border-radius: 4px; margin: 0; font-size: 14px; color: #1b5e20; border-left: 4px solid #4CAF50; line-height: 1.5;">${escapeHtml(solution).replace(/\n/g, '<br>')}</div>
        </div>
      </div>
    `;
    
    // Вставляем блок в конец body или в конец основного контента
    if ($('body').length > 0) {
      $('body').append(aiDebugHtml);
    } else {
      $('html').append(aiDebugHtml);
    }
    
    // Сохраняем обновленный HTML
    await writeFile(htmlPath, $.html(), 'utf-8');
    console.log(`💾 HTML обновлён: ${htmlPath}`);
    
  } catch (error) {
    console.error(`❌ Ошибка при обновлении HTML ${htmlPath}:`, error.message);
  }
}

/**
 * Экранирует HTML символы
 * @param {string} text - текст для экранирования
 * @returns {string} - экранированный текст
 */
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export { updateHtmlReport }; 