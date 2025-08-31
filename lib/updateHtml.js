// lib/updateHtml.js

import fs from 'fs';
import path from 'path';

/**
 * Обновляет HTML отчет с добавлением AI блока
 * @param {string} htmlPath - путь к HTML файлу
 * @param {string} errorContent - содержимое ошибки
 * @param {string} aiResponse - ответ AI
 * @param {string} testName - имя теста (опционально)
 */
export async function updateHtmlReport(htmlPath, errorContent, aiResponse, testName = null) {
  try {
    if (!fs.existsSync(htmlPath)) {
      console.warn(`⚠️  HTML file not found: ${htmlPath}`);
      return;
    }

    let htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    
    // Проверяем, является ли это основным Playwright отчетом
    if (isPlaywrightMainReport(htmlContent)) {
      // Используем переданное имя теста или извлекаем из errorContent
      const finalTestName = testName || extractTestName(errorContent) || 'Unknown Test';
      await integrateIntoPlaywrightReport(htmlPath, htmlContent, errorContent, aiResponse, finalTestName);
    } else {
      // Обычная интеграция для других HTML файлов
      const aiBlock = createAiBlock(errorContent, aiResponse);
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
    }
    
  } catch (error) {
    console.error(`❌ Failed to update HTML report: ${error.message}`);
  }
}

/**
 * Проверяет, является ли HTML файл основным отчетом Playwright
 */
function isPlaywrightMainReport(htmlContent) {
  return htmlContent.includes('playwrightReportBase64') && 
         htmlContent.includes('<div id=\'root\'></div>');
}

/**
 * Извлекает имя теста из содержимого ошибки или пути к файлу
 */
export function extractTestName(errorContent, filePath = '') {
  if (!errorContent && !filePath) return null;
  
  // Пробуем различные паттерны для извлечения имени теста из контента
  if (errorContent) {
    const patterns = [
      /› ([^›]+) › ([^›]+) › ([^›\n]+)/,  // Playwright test hierarchy
      /Test: (.+)/,                       // Простой формат "Test: ..."
      /describe\(['"]([^'"]+)/,           // describe('test name')
      /test\(['"]([^'"]+)/,               // test('test name')
      /it\(['"]([^'"]+)/                  // it('test name')
    ];
    
    for (const pattern of patterns) {
      const match = errorContent.match(pattern);
      if (match) {
        // Для Playwright иерархии берем последний элемент (имя теста)
        return match[match.length - 1].trim();
      }
    }
  }
  
  // Извлекаем из пути к файлу ошибки
  const fullPath = filePath || errorContent || '';
  
  // Создаем карту для восстановления полных имен из сокращенных путей
  const testNameMap = {
    // Полные пути
    'Memory-leak-simulation': 'Memory leak simulation',
    'Form-validation-error': 'Form validation error', 
    'Login-timeout-simulation': 'Login timeout simulation',
    'Infinite-scroll-timeout': 'Infinite scroll timeout',
    'API-response-timeout': 'API response timeout',
    'Wrong-title-assertion': 'Wrong title assertion',
    'Missing-checkout-button': 'Missing checkout button',
    'Network-error-simulation': 'Network error simulation',
    'JavaScript-console-errors': 'JavaScript console errors',
    'Mobile-viewport-issues': 'Mobile viewport issues',
    'File-upload-failure': 'File upload failure',
    'Drag-and-drop-failure': 'Drag and drop failure',
    'Database-connection-simulation': 'Database connection simulation',
    'WebSocket-connection-failure': 'WebSocket connection failure',
    'Geolocation-permission-denied': 'Geolocation permission denied',
    'PDF-download-timeout': 'PDF download timeout',
    'Service-Worker-registration-failure': 'Service Worker registration failure',
    'CSS-animation-timing-issues': 'CSS animation timing issues',
    
    // Сокращенные суффиксы
    'ebSocket-connection-failure': 'WebSocket connection failure',
    'abase-connection-simulation': 'Database connection simulation', 
    'olocation-permission-denied': 'Geolocation permission denied',
    'Worker-registration-failure': 'Service Worker registration failure'
  };
  
  // Пробуем различные паттерны извлечения
  const patterns = [
    // Полные пути с ❌- префиксом
    /demo-🎯-AI-Debug-Integration-Demo-❌-([^/]+)-chromium/,
    // Сокращенные пути
    /demo-🎯-AI-Debug-Integrati-[a-z0-9]+-([^/]+)-chromium/,
    // Обычные пути
    /([^/\\]+)-chromium\/error-context\.md/
  ];
  
  for (const pattern of patterns) {
    const match = fullPath.match(pattern);
    if (match) {
      const rawName = match[1];
      
      // Проверяем карту имен
      if (testNameMap[rawName]) {
        return testNameMap[rawName];
      }
      
      // Если нет в карте, обрабатываем самостоятельно
      let testName = rawName
        .replace(/^❌-/, '')  // Убираем префикс ❌-
        .replace(/^✅-/, '')  // Убираем префикс ✅-
        .replace(/-/g, ' ')   // Заменяем дефисы на пробелы
        .replace(/([a-z])([A-Z])/g, '$1 $2')  // Добавляем пробелы перед заглавными буквами
        .replace(/\s+/g, ' ') // Убираем лишние пробелы
        .trim();
        
      if (testName && testName.length > 3) {
        return testName;
      }
    }
  }
  
  return null;
}

/**
 * Интегрирует AI анализ в основной HTML отчет Playwright
 */
async function integrateIntoPlaywrightReport(htmlPath, htmlContent, errorContent, aiResponse, testName = 'Unknown Test') {
  try {
    // Проверяем, уже ли добавлены AI блоки
    if (htmlContent.includes('ai-analysis-overlay')) {
      // Если уже есть AI блоки, добавляем новый анализ к существующим
      await addToExistingAiAnalysis(htmlPath, htmlContent, errorContent, aiResponse, testName);
    } else {
      // Создаем первый AI блок
      await createFirstAiAnalysis(htmlPath, htmlContent, errorContent, aiResponse, testName);
    }
    
  } catch (error) {
    console.error(`❌ Failed to integrate into Playwright report: ${error.message}`);
  }
}

/**
 * Создает первый AI анализ в отчете
 */
async function createFirstAiAnalysis(htmlPath, htmlContent, errorContent, aiResponse, testName = 'Unknown Test') {
  const aiBlock = createPlaywrightStyleAiBlock(errorContent, aiResponse, testName);
  
  // Ищем место для вставки - перед закрывающим тегом body
  const bodyCloseIndex = htmlContent.lastIndexOf('</body>');
  if (bodyCloseIndex === -1) {
    console.warn('⚠️  Could not find </body> tag in Playwright report');
    return;
  }
  
  // Вставляем AI блок как отдельную секцию
  const updatedContent = htmlContent.slice(0, bodyCloseIndex) + 
                        aiBlock + 
                        htmlContent.slice(bodyCloseIndex);
  
  fs.writeFileSync(htmlPath, updatedContent, 'utf-8');
  console.log(`✅ Integrated AI analysis into Playwright report: ${path.basename(htmlPath)}`);
}

/**
 * Добавляет новый анализ к существующим AI блокам
 */
async function addToExistingAiAnalysis(htmlPath, htmlContent, errorContent, aiResponse, testName = 'Unknown Test') {
  // Создаем новый элемент анализа для добавления к существующему списку
  const newAnalysisItem = createAnalysisItem(errorContent, aiResponse, testName);
  
  // Ищем место для вставки нового элемента - в конец контейнера анализов
  const containerEndPattern = /<\/div>\s*<\/div>\s*<\/div>\s*<div id="ai-analysis-trigger"/;
  const match = htmlContent.match(containerEndPattern);
  
  if (match) {
    const insertionPoint = match.index;
    const updatedContent = htmlContent.slice(0, insertionPoint) + 
                          newAnalysisItem + 
                          htmlContent.slice(insertionPoint);
    
    // Обновляем счетчик анализов в кнопке
    const countPattern = /<span id="ai-analysis-count">AI Analysis(\s*\(\d+\))?<\/span>/;
    const analysisCount = (updatedContent.match(/class="ai-analysis-item"/g) || []).length;
    const finalContent = updatedContent.replace(
      countPattern, 
      `<span id="ai-analysis-count">AI Analysis (${analysisCount})</span>`
    );
    
    fs.writeFileSync(htmlPath, finalContent, 'utf-8');
    console.log(`✅ Added new AI analysis to existing report: ${path.basename(htmlPath)}`);
  } else {
    console.warn('⚠️  Could not find insertion point for additional AI analysis');
  }
}

/**
 * Создает AI блок в стиле Playwright для интеграции в основной отчет
 */
function createPlaywrightStyleAiBlock(errorContent, aiResponse, testName = 'Unknown Test') {
  const analysisItem = createAnalysisItem(errorContent, aiResponse, testName);
  
  return `
    <div id="ai-analysis-overlay" style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10000;
      display: none;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(4px);
    ">
      <div style="
        background: var(--color-canvas-default, white);
        border-radius: 12px;
        max-width: 1000px;
        max-height: 85vh;
        overflow-y: auto;
        margin: 20px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        border: 1px solid var(--color-border-default, #d0d7de);
      ">
        <div style="
          padding: 24px;
          border-bottom: 1px solid var(--color-border-muted, #d8dee4);
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          background: var(--color-canvas-default, white);
          z-index: 1;
        ">
          <div style="display: flex; align-items: center;">
            <span style="font-size: 24px; margin-right: 12px;">🤖</span>
            <h2 style="
              margin: 0;
              color: var(--color-fg-default, #24292f);
              font-size: 18px;
              font-weight: 600;
            ">AI Analysis & Solutions</h2>
          </div>
          <button onclick="document.getElementById('ai-analysis-overlay').style.display='none'" style="
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: var(--color-fg-muted, #656d76);
            padding: 4px;
            border-radius: 4px;
            transition: background-color 0.2s;
          " onmouseover="this.style.backgroundColor='var(--color-neutral-muted, #f6f8fa)'" 
             onmouseout="this.style.backgroundColor='transparent'">&times;</button>
        </div>
        
        <div id="ai-analyses-container" style="padding: 0;">
          ${analysisItem}
        </div>
      </div>
    </div>
    
    <div id="ai-analysis-trigger" style="
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      background: linear-gradient(135deg, #2da44e 0%, #1a7f37 100%);
      color: white;
      border: none;
      border-radius: 50px;
      padding: 12px 20px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 8px 24px rgba(45, 164, 78, 0.3);
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    " onclick="document.getElementById('ai-analysis-overlay').style.display='flex'" 
       onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 12px 32px rgba(45, 164, 78, 0.4)'; this.style.background='linear-gradient(135deg, #1a7f37 0%, #2da44e 100%)'"
       onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 24px rgba(45, 164, 78, 0.3)'; this.style.background='linear-gradient(135deg, #2da44e 0%, #1a7f37 100%)'">
      <span style="font-size: 16px;">🤖</span>
      <span id="ai-analysis-count">AI Analysis (1)</span>
    </div>
    
    <style>
      /* Playwright-совместимые стили для AI анализа */
      @media (prefers-color-scheme: dark) {
        #ai-analysis-overlay {
          background: rgba(0, 0, 0, 0.9) !important;
        }
        
        #ai-analysis-overlay > div {
          background: var(--color-canvas-default, #0d1117) !important;
          border-color: var(--color-border-default, #30363d) !important;
        }
        
        .test-header {
          background: var(--color-canvas-subtle, #161b22) !important;
        }
        
        .ai-analysis-item pre {
          background: var(--color-neutral-subtle, #21262d) !important;
          border-color: var(--color-attention-muted, #9e6a03) !important;
          color: var(--color-fg-default, #f0f6fc) !important;
        }
        
        .analysis-content > div:last-child > div {
          background: var(--color-success-subtle, #0f2419) !important;
          border-color: var(--color-success-muted, #2ea043) !important;
          color: var(--color-fg-default, #f0f6fc) !important;
        }
      }
      
      /* Анимации для улучшения UX */
      #ai-analysis-overlay {
        animation: fadeIn 0.3s ease-out;
      }
      
      @keyframes fadeIn {
        from {
          opacity: 0;
          backdrop-filter: blur(0px);
        }
        to {
          opacity: 1;
          backdrop-filter: blur(4px);
        }
      }
      
      .ai-analysis-item {
        animation: slideInUp 0.4s ease-out;
      }
      
      @keyframes slideInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      /* Анимация аккордиона */
      .analysis-content {
        transition: all 0.3s ease-out;
        overflow: hidden;
      }
      
      .analysis-content.expanding {
        animation: expandContent 0.3s ease-out;
      }
      
      .analysis-content.collapsing {
        animation: collapseContent 0.3s ease-out;
      }
      
      @keyframes expandContent {
        from {
          opacity: 0;
          max-height: 0;
        }
        to {
          opacity: 1;
          max-height: 1000px;
        }
      }
      
      @keyframes collapseContent {
        from {
          opacity: 1;
          max-height: 1000px;
        }
        to {
          opacity: 0;
          max-height: 0;
        }
      }
    </style>
    
    <script>
      // JavaScript для управления аккордионом
      function toggleAnalysis(itemId) {
        const content = document.getElementById(itemId);
        const chevron = document.getElementById(itemId + '-chevron');
        
        if (content.style.display === 'none' || content.style.display === '') {
          // Открываем
          content.style.display = 'block';
          content.classList.add('expanding');
          chevron.style.transform = 'rotate(180deg)';
          
          setTimeout(() => {
            content.classList.remove('expanding');
          }, 300);
        } else {
          // Закрываем
          content.classList.add('collapsing');
          chevron.style.transform = 'rotate(0deg)';
          
          setTimeout(() => {
            content.style.display = 'none';
            content.classList.remove('collapsing');
          }, 300);
        }
      }
      
      // Функция для открытия первого анализа по умолчанию
      function openFirstAnalysis() {
        const firstItem = document.querySelector('.ai-analysis-item');
        if (firstItem) {
          const firstContent = firstItem.querySelector('.analysis-content');
          const firstChevron = firstItem.querySelector('[id$="-chevron"]');
          if (firstContent && firstChevron) {
            firstContent.style.display = 'block';
            firstChevron.style.transform = 'rotate(180deg)';
          }
        }
      }
      
      // Открываем первый анализ при загрузке
      document.addEventListener('DOMContentLoaded', openFirstAnalysis);
    </script>
  `;
}

/**
 * Создает отдельный элемент анализа
 */
function createAnalysisItem(errorContent, aiResponse, testName = 'Unknown Test') {
  const escapedError = escapeHtml(errorContent);
  const escapedResponse = escapeHtml(aiResponse);
  const itemId = `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  return `
    <div class="ai-analysis-item" style="
      border-bottom: 1px solid var(--color-border-muted, #d8dee4);
    ">
      <!-- Заголовок теста с аккордионом -->
      <div class="test-header" onclick="toggleAnalysis('${itemId}')" style="
        padding: 20px 24px;
        cursor: pointer;
        background: var(--color-canvas-subtle, #f6f8fa);
        border-bottom: 1px solid var(--color-border-muted, #d8dee4);
        display: flex;
        align-items: center;
        justify-content: space-between;
        transition: background-color 0.2s;
      " onmouseover="this.style.backgroundColor='var(--color-neutral-muted, #afb8c1)'" 
         onmouseout="this.style.backgroundColor='var(--color-canvas-subtle, #f6f8fa)'">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 18px;">🧪</span>
          <div>
            <h3 style="
              margin: 0;
              color: var(--color-fg-default, #24292f);
              font-size: 16px;
              font-weight: 600;
            ">${escapeHtml(testName)}</h3>
            <p style="
              margin: 4px 0 0 0;
              color: var(--color-fg-muted, #656d76);
              font-size: 14px;
            ">Нажмите для просмотра анализа</p>
          </div>
        </div>
        <span id="${itemId}-chevron" style="
          font-size: 20px;
          color: var(--color-fg-muted, #656d76);
          transition: transform 0.2s;
        ">▼</span>
      </div>
      
      <!-- Содержимое анализа (скрыто по умолчанию) -->
      <div id="${itemId}" class="analysis-content" style="
        display: none;
        padding: 24px;
      ">
        <div style="margin-bottom: 24px;">
          <h4 style="
            color: var(--color-danger-fg, #d1242f);
            margin: 0 0 12px 0;
            font-size: 15px;
            font-weight: 600;
            display: flex;
            align-items: center;
          ">
            <span style="margin-right: 8px;">🔍</span>
            Detected Error
          </h4>
          <pre style="
            background: var(--color-attention-subtle, #fff8c5);
            border: 1px solid var(--color-attention-muted, #d4a72c);
            padding: 16px;
            border-radius: 6px;
            overflow-x: auto;
            font-size: 13px;
            margin: 0;
            line-height: 1.45;
            font-family: ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
          ">${escapedError}</pre>
        </div>
        
        <div>
          <h4 style="
            color: var(--color-success-fg, #1a7f37);
            margin: 0 0 12px 0;
            font-size: 15px;
            font-weight: 600;
            display: flex;
            align-items: center;
          ">
            <span style="margin-right: 8px;">💡</span>
            Recommended Solution
          </h4>
          <div style="
            background: var(--color-success-subtle, #dafbe1);
            border: 1px solid var(--color-success-muted, #4ac26b);
            padding: 16px;
            border-radius: 6px;
            font-size: 14px;
            line-height: 1.6;
            margin: 0;
            color: var(--color-fg-default, #24292f);
          ">${formatMarkdown(escapedResponse)}</div>
        </div>
      </div>
    </div>
  `;
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
