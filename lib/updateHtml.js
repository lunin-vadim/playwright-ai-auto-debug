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
    $('.ai-debug-section').remove();
    
    // Создаем стили совместимые с Playwright
    const aiStyles = `
      <style>
        .ai-debug-section {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          margin: 1rem 0;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          border-left: 4px solid #667eea;
        }
        
        .ai-debug-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 1rem 1.5rem;
          margin: 0;
          font-size: 1.25rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .ai-debug-content {
          padding: 1.5rem;
        }
        
        .ai-error-section {
          margin-bottom: 1.5rem;
        }
        
        .ai-section-title {
          margin: 0 0 0.75rem 0;
          font-weight: 600;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #dc3545;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .ai-solution-title {
          color: #28a745;
        }
        
        .ai-error-details {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          border-radius: 4px;
          padding: 1rem;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.875rem;
          color: #721c24;
          white-space: pre-wrap;
          line-height: 1.4;
          overflow-x: auto;
        }
        
        .ai-solution-content {
          background: #d4edda;
          border: 1px solid #c3e6cb;
          border-radius: 4px;
          padding: 1rem;
          font-size: 0.875rem;
          color: #155724;
          line-height: 1.6;
          border-left: 4px solid #28a745;
        }
        
        .ai-solution-content p {
          margin: 0 0 0.75rem 0;
        }
        
        .ai-solution-content p:last-child {
          margin-bottom: 0;
        }
        
        .ai-solution-content code {
          background: rgba(0,0,0,0.1);
          padding: 0.125rem 0.25rem;
          border-radius: 3px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.8em;
        }
        
        .ai-solution-content pre {
          background: rgba(0,0,0,0.05);
          padding: 0.75rem;
          border-radius: 4px;
          margin: 0.5rem 0;
          overflow-x: auto;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.8em;
        }
        
        @media (max-width: 768px) {
          .ai-debug-content {
            padding: 1rem;
          }
          
          .ai-debug-header {
            padding: 0.75rem 1rem;
            font-size: 1.1rem;
          }
        }
      </style>
    `;
    
    // Добавляем стили в head если их еще нет
    if (!$('head').html().includes('ai-debug-section')) {
      $('head').append(aiStyles);
    }
    
    // Форматируем решение от AI для лучшего отображения
    const formattedSolution = formatAiSolution(solution);
    
    // Создаем новый блок с AI отладкой в стиле Playwright
    const aiDebugHtml = `
      <div class="ai-debug-section">
        <h2 class="ai-debug-header">
          🤖 AI Debug Assistant
        </h2>
        <div class="ai-debug-content">
          <div class="ai-error-section">
            <div class="ai-section-title">
              ❌ Обнаруженная ошибка
            </div>
            <div class="ai-error-details">${escapeHtml(error)}</div>
          </div>
          <div class="ai-solution-section">
            <div class="ai-section-title ai-solution-title">
              💡 Рекомендуемое решение
            </div>
            <div class="ai-solution-content">${formattedSolution}</div>
          </div>
        </div>
      </div>
    `;
    
    // Ищем подходящее место для вставки блока
    const insertionPoint = findInsertionPoint($);
    
    if (insertionPoint.length > 0) {
      insertionPoint.after(aiDebugHtml);
    } else {
      // Fallback: вставляем в конец container или body
      if ($('.container').length > 0) {
        $('.container').append(aiDebugHtml);
      } else if ($('body').length > 0) {
        $('body').append(aiDebugHtml);
      } else {
        $('html').append(aiDebugHtml);
      }
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

/**
 * Форматирует решение от AI для лучшего отображения в HTML
 * @param {string} solution - решение от AI
 * @returns {string} - отформатированное решение
 */
function formatAiSolution(solution) {
  // Экранируем HTML
  let formatted = escapeHtml(solution);
  
  // Заменяем переносы строк на параграфы
  formatted = formatted
    .split('\n\n')
    .map(paragraph => paragraph.trim())
    .filter(paragraph => paragraph.length > 0)
    .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('');
  
  // Обрабатываем код в обратных кавычках
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Обрабатываем блоки кода
  formatted = formatted.replace(/```([^`]+)```/g, '<pre>$1</pre>');
  
  // Если нет параграфов, создаем один
  if (!formatted.includes('<p>')) {
    formatted = `<p>${formatted}</p>`;
  }
  
  return formatted;
}

/**
 * Находит подходящее место для вставки AI блока в HTML отчете
 * @param {CheerioAPI} $ - объект cheerio
 * @returns {Cheerio} - элемент после которого нужно вставить блок
 */
function findInsertionPoint($) {
  // Приоритетные места для вставки (в порядке предпочтения)
  const selectors = [
    '.test-results',           // Блок с результатами тестов
    '.summary',                // Блок с суммарной информацией
    '.test-item:last-child',   // Последний тест
    '.container > *:last-child', // Последний элемент в контейнере
    'main > *:last-child',     // Последний элемент в main
    'body > *:last-child'      // Последний элемент в body
  ];
  
  for (const selector of selectors) {
    const element = $(selector);
    if (element.length > 0) {
      return element.last();
    }
  }
  
  return $(); // Возвращаем пустой объект если ничего не найдено
}

export { updateHtmlReport }; 