// lib/updateHtml.js

import fs from 'fs';
import path from 'path';

/**
 * Обновляет HTML отчет с добавлением AI блока
 * @param {string} htmlPath - путь к HTML файлу
 * @param {string} errorContent - содержимое ошибки
 * @param {string} aiResponse - ответ AI
 */
export async function updateHtmlReport(htmlPath, errorContent, aiResponse) {
  try {
    if (!fs.existsSync(htmlPath)) {
      console.warn(`⚠️  HTML file not found: ${htmlPath}`);
      return;
    }

    let htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    
    // Создаем AI блок
    const aiBlock = createAiBlock(errorContent, aiResponse);
    
    // Находим место для вставки (после первого test-result блока)
    const insertionPoint = findInsertionPoint(htmlContent);
    
    if (insertionPoint !== -1) {
      htmlContent = htmlContent.slice(0, insertionPoint) + 
                   aiBlock + 
                   htmlContent.slice(insertionPoint);
      
      fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
      console.log(`✅ Updated HTML report: ${path.basename(htmlPath)}`);
    } else {
      console.warn(`⚠️  Could not find insertion point in: ${path.basename(htmlPath)}`);
    }
    
  } catch (error) {
    console.error(`❌ Failed to update HTML report: ${error.message}`);
  }
}

/**
 * Создает AI блок для вставки в HTML
 */
function createAiBlock(errorContent, aiResponse) {
  const escapedError = escapeHtml(errorContent);
  const escapedResponse = escapeHtml(aiResponse);
  
  return `
<div class="ai-debug-block" style="
  margin: 20px 0;
  padding: 20px;
  border: 2px solid #4CAF50;
  border-radius: 8px;
  background: linear-gradient(135deg, #f0f8ff 0%, #e8f5e8 100%);
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
">
  <div class="ai-header" style="
    display: flex;
    align-items: center;
    margin-bottom: 15px;
    font-weight: bold;
    color: #2c3e50;
  ">
    <span style="font-size: 24px; margin-right: 10px;">🤖</span>
    <h3 style="margin: 0; color: #27ae60;">AI Analysis & Solution</h3>
  </div>
  
  <div class="error-section" style="margin-bottom: 15px;">
    <h4 style="color: #e74c3c; margin: 0 0 8px 0;">🔍 Detected Error:</h4>
    <pre style="
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 12px;
      margin: 0;
    ">${escapedError}</pre>
  </div>
  
  <div class="solution-section">
    <h4 style="color: #27ae60; margin: 0 0 8px 0;">💡 Recommended Solution:</h4>
    <div style="
      background: #d4edda;
      border: 1px solid #c3e6cb;
      padding: 10px;
      border-radius: 4px;
      font-size: 14px;
      line-height: 1.5;
      margin: 0;
    ">${formatMarkdown(escapedResponse)}</div>
  </div>
</div>
`;
}

/**
 * Находит точку вставки в HTML
 */
function findInsertionPoint(htmlContent) {
  // Ищем после первого test-result блока
  const patterns = [
    /<div[^>]*class="[^"]*test-result[^"]*"[^>]*>.*?<\/div>/s,
    /<div[^>]*class="[^"]*result[^"]*"[^>]*>.*?<\/div>/s,
    /<body[^>]*>/,
    /<div[^>]*class="[^"]*content[^"]*"[^>]*>/
  ];
  
  for (const pattern of patterns) {
    const match = htmlContent.match(pattern);
    if (match) {
      return match.index + match[0].length;
    }
  }
  
  return -1;
}

/**
 * Экранирует HTML символы
 */
function escapeHtml(text) {
  if (!text) return '';
  
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Простое форматирование markdown
 */
function formatMarkdown(text) {
  if (!text) return '';
  
  return text
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre style="background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto;"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code style="background: #f1f2f6; padding: 2px 4px; border-radius: 3px;">$1</code>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.+)/, '<p>$1')
    .replace(/(.+)$/, '$1</p>');
}
