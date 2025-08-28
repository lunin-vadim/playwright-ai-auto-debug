// lib/sendToAI.js

import fs from 'fs';
import path from 'path';

/**
 * Создает Allure attachment с AI ответом
 * @param {string} aiResponse - ответ AI
 * @param {string} errorContent - содержимое ошибки
 * @param {Object} config - конфигурация
 * @param {number} index - индекс файла
 * @param {string} errorFilePath - путь к файлу ошибки
 */
export async function createAllureAttachment(aiResponse, errorContent, config, index, errorFilePath) {
  try {
    const allureDir = config.allure_results_dir || 'allure-results';
    
    // Создаем директорию если не существует
    if (!fs.existsSync(allureDir)) {
      fs.mkdirSync(allureDir, { recursive: true });
    }
    
    const timestamp = Date.now();
    const attachmentName = `ai-analysis-${timestamp}-${index}.md`;
    const attachmentPath = path.join(allureDir, attachmentName);
    
    const content = createAllureAttachmentContent(aiResponse, errorContent, errorFilePath);
    
    fs.writeFileSync(attachmentPath, content, 'utf-8');
    
    console.log(`📎 Created Allure attachment: ${attachmentName}`);
    
    // Добавляем attachment к соответствующему тесту в Allure JSON
    await addAttachmentToAllureTest(allureDir, attachmentName, errorFilePath);
    
  } catch (error) {
    console.error(`❌ Failed to create Allure attachment: ${error.message}`);
  }
}

/**
 * Добавляет AI attachment к соответствующему тесту в Allure JSON файлах
 * @param {string} allureDir - директория с результатами Allure
 * @param {string} attachmentName - имя файла attachment
 * @param {string} errorFilePath - путь к файлу ошибки для поиска соответствующего теста
 */
async function addAttachmentToAllureTest(allureDir, attachmentName, errorFilePath) {
  try {
    // Находим все JSON файлы результатов тестов
    const files = fs.readdirSync(allureDir).filter(file => 
      file.endsWith('-result.json') && file !== 'environment.properties'
    );
    
    for (const file of files) {
      const filePath = path.join(allureDir, file);
      const data = fs.readFileSync(filePath, 'utf-8');
      const testResult = JSON.parse(data);
      
      // Проверяем, соответствует ли этот тест нашему файлу ошибки
      if (isMatchingTest(testResult, errorFilePath)) {
        // Добавляем AI attachment к тесту
        if (!testResult.attachments) {
          testResult.attachments = [];
        }
        
        testResult.attachments.push({
          name: "🤖 AI Analysis",
          source: attachmentName,
          type: "text/markdown"
        });
        
        // Сохраняем обновленный JSON
        fs.writeFileSync(filePath, JSON.stringify(testResult, null, 2), 'utf-8');
        console.log(`✅ Added AI attachment to test: ${testResult.name}`);
        return;
      }
    }
    
    console.log(`⚠️  No matching test found for error file: ${errorFilePath}`);
    
  } catch (error) {
    console.error(`❌ Failed to add attachment to Allure test: ${error.message}`);
  }
}

/**
 * Проверяет, соответствует ли тест файлу ошибки
 * @param {Object} testResult - результат теста из Allure JSON
 * @param {string} errorFilePath - путь к файлу ошибки
 * @returns {boolean}
 */
function isMatchingTest(testResult, errorFilePath) {
  if (!testResult || !errorFilePath) return false;
  
  // Извлекаем информацию из пути к файлу ошибки
  const errorDir = path.basename(path.dirname(errorFilePath));
  
  console.log(`🔍 Checking test match:`);
  console.log(`   Test name: "${testResult.name}"`);
  console.log(`   Test status: ${testResult.status}`);
  console.log(`   Error dir: "${errorDir}"`);
  
  // Проверяем статус теста (должен быть failed)
  if (testResult.status !== 'failed') {
    console.log(`   ❌ Test status is not 'failed'`);
    return false;
  }
  
  // Нормализуем имена для сравнения
  const normalizeString = (str) => str?.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '');
  
  const normalizedTestName = normalizeString(testResult.name);
  const normalizedErrorDir = normalizeString(errorDir);
  
  console.log(`   Normalized test name: "${normalizedTestName}"`);
  console.log(`   Normalized error dir: "${normalizedErrorDir}"`);
  
  // Проверяем по имени теста
  if (normalizedTestName && normalizedErrorDir && 
      (normalizedErrorDir.includes(normalizedTestName) || 
       normalizedTestName.includes(normalizedErrorDir))) {
    console.log(`   ✅ Match found by test name`);
    return true;
  }
  
  // Проверяем по ключевым словам из имени теста
  const testWords = normalizedTestName?.split(/\s+/).filter(word => word.length > 2) || [];
  const errorWords = normalizedErrorDir?.split(/\s+/).filter(word => word.length > 2) || [];
  
  let matchingWords = 0;
  for (const testWord of testWords) {
    if (errorWords.some(errorWord => errorWord.includes(testWord) || testWord.includes(errorWord))) {
      matchingWords++;
    }
  }
  
  if (matchingWords >= 2) {
    console.log(`   ✅ Match found by keywords (${matchingWords} matching words)`);
    return true;
  }
  
  // Проверяем по UUID или другим идентификаторам
  if (errorDir.includes(testResult.uuid)) {
    console.log(`   ✅ Match found by UUID`);
    return true;
  }
  
  // Проверяем по времени выполнения (берем только последний failed тест)
  if (testResult.status === 'failed') {
    console.log(`   ✅ Match found - this is a failed test (fallback match)`);
    return true;
  }
  
  console.log(`   ❌ No match found`);
  return false;
}

/**
 * Сохраняет AI ответ в markdown файл
 * @param {string} aiResponse - ответ AI
 * @param {string} errorContent - содержимое ошибки
 * @param {Object} config - конфигурация
 * @param {number} index - индекс файла
 */
export function saveResponseToMarkdown(aiResponse, errorContent, config, index) {
  try {
    const outputDir = config.ai_responses_dir || 'ai-responses';
    
    // Создаем директорию если не существует
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const timestamp = Date.now();
    const filename = config.ai_response_filename_template 
      ? config.ai_response_filename_template
          .replace('{timestamp}', timestamp)
          .replace('{index}', index)
      : `ai-response-${timestamp}-${index}.md`;
    
    const filePath = path.join(outputDir, filename);
    
    const content = createMarkdownContent(aiResponse, errorContent, config);
    
    fs.writeFileSync(filePath, content, 'utf-8');
    
    console.log(`📄 Saved AI response: ${filename}`);
    
  } catch (error) {
    console.error(`❌ Failed to save markdown response: ${error.message}`);
  }
}

/**
 * Создает содержимое Allure attachment
 */
function createAllureAttachmentContent(aiResponse, errorContent, errorFilePath) {
  const timestamp = new Date().toISOString();
  
  return `# 🤖 AI Test Analysis

## 📊 Analysis Details
- **Timestamp:** ${timestamp}
- **Error File:** ${errorFilePath || 'Unknown'}
- **Analysis Type:** Automated AI Debug

## 🔍 Detected Error
\`\`\`
${errorContent || 'No error content available'}
\`\`\`

## 💡 AI Recommended Solution
${aiResponse || 'No AI response available'}

---
*Generated by playwright-ai-auto-debug*
`;
}

/**
 * Создает markdown содержимое
 */
function createMarkdownContent(aiResponse, errorContent, config) {
  const timestamp = new Date().toISOString();
  
  let content = `# 🤖 AI Analysis Report

**Generated:** ${timestamp}
**Configuration:** ${config.model || 'Unknown model'}

## 🔍 Error Analysis
\`\`\`
${errorContent || 'No error content'}
\`\`\`

## 💡 AI Solution
${aiResponse || 'No AI response'}

`;

  // Добавляем метаданные если включено
  if (config.include_metadata) {
    content += `
## 📋 Metadata
- **API Server:** ${config.ai_server || 'Not specified'}
- **Model:** ${config.model || 'Not specified'}
- **Max Tokens:** ${config.max_tokens || 'Not specified'}
- **Temperature:** ${config.temperature || 'Not specified'}
- **Allure Integration:** ${config.allure_integration ? 'Enabled' : 'Disabled'}
- **MCP Integration:** ${config.mcp_integration ? 'Enabled' : 'Disabled'}
`;
  }

  content += '\n---\n*Generated by playwright-ai-auto-debug*\n';
  
  return content;
}

/**
 * Legacy функция для обратной совместимости
 */
export async function sendToAI(prompt, config, domSnapshot) {
  // Перенаправляем на legacy реализацию
  const { sendToAI: legacySendToAI } = await import('../src/infrastructure/legacy/LegacySendToAI.js');
  return await legacySendToAI(prompt, config, domSnapshot);
}
