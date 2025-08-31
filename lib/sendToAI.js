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
    
    console.log(`🔍 Searching for matching test among ${files.length} test result files...`);
    console.log(`📁 Target error file: ${errorFilePath}`);
    
    let bestMatch = null;
    let bestMatchScore = 0;
    
    // Сначала ищем точное совпадение
    for (const file of files) {
      const filePath = path.join(allureDir, file);
      const data = fs.readFileSync(filePath, 'utf-8');
      const testResult = JSON.parse(data);
      
      console.log(`\n📋 Checking test: ${testResult.name} (${testResult.uuid})`);
      
      // Проверяем, соответствует ли этот тест нашему файлу ошибки
      if (isMatchingTest(testResult, errorFilePath)) {
        // Проверяем, не добавлен ли уже этот attachment
        const existingAttachment = testResult.attachments?.find(att => att.source === attachmentName);
        if (existingAttachment) {
          console.log(`⚠️  AI attachment already exists for test: ${testResult.name}`);
          return;
        }
        
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
        console.log(`✅ Added AI attachment to test: ${testResult.name} (UUID: ${testResult.uuid})`);
        return;
      }
    }
    
    console.log(`⚠️  No matching test found for error file: ${errorFilePath}`);
    console.log(`📊 Checked ${files.length} test result files, none matched the criteria.`);
    
    // Логируем информацию о доступных тестах для отладки
    console.log(`\n🔍 Available failed tests:`);
    const failedTests = [];
    for (const file of files) {
      const filePath = path.join(allureDir, file);
      const data = fs.readFileSync(filePath, 'utf-8');
      const testResult = JSON.parse(data);
      
      if (testResult.status === 'failed') {
        failedTests.push({
          name: testResult.name,
          uuid: testResult.uuid,
          fullName: testResult.fullName
        });
        console.log(`   - "${testResult.name}" (${testResult.uuid})`);
      }
    }
    
    if (failedTests.length === 0) {
      console.log(`   No failed tests found. AI attachment will be orphaned.`);
    }
    
  } catch (error) {
    console.error(`❌ Failed to add attachment to Allure test: ${error.message}`);
    console.error(`Error details:`, error);
  }
}

/**
 * Извлекает название теста из пути к файлу ошибки
 * @param {string} errorDir - название директории с ошибкой
 * @returns {string|null} название теста или null если не удалось извлечь
 */
function extractTestNameFromErrorPath(errorDir) {
  if (!errorDir) return null;
  
  // Паттерны для извлечения названия теста:
  // "demo-🎯-AI-Debug-Integration-Demo-❌-Infinite-scroll-timeout-chromium" -> "❌ Infinite scroll timeout"
  // "element-coverage-test-🎯-E-598b6-over-top-uncovered-elements-chromium" -> "✅ Cover top uncovered elements"
  
  // Удаляем браузер в конце
  let cleanDir = errorDir.replace(/-chromium$|-firefox$|-webkit$/, '');
  
  // Ищем паттерн с эмодзи статуса (❌ или ✅)
  const emojiMatch = cleanDir.match(/([❌✅].*?)$/);
  if (emojiMatch) {
    return emojiMatch[1].replace(/-/g, ' ').trim();
  }
  
  // Ищем паттерн для element-coverage-test
  if (cleanDir.includes('element-coverage-test')) {
    // Для "element-coverage-test-🎯-E-598b6-over-top-uncovered-elements"
    // Ищем паттерн после последнего хеша: "over-top-uncovered-elements" -> "top-uncovered-elements"
    const match = cleanDir.match(/element-coverage-test.*?[0-9a-f]{5,}-(.+)$/);
    if (match) {
      let testName = match[1];
      // Убираем "over-" если есть
      if (testName.startsWith('over-')) {
        testName = testName.substring(4);
      }
      return '✅ Cover ' + testName.replace(/-/g, ' ').trim();
    }
  }
  
  // Ищем паттерн для WebSocket и других сложных названий
  if (cleanDir.includes('ebSocket')) {
    return '❌ WebSocket connection failure';
  }
  
  // Если нет эмодзи, пробуем найти название теста после последнего разделителя
  const parts = cleanDir.split('-');
  if (parts.length >= 3) {
    // Берем последние части как название теста
    const testNameParts = parts.slice(-3);
    return testNameParts.join(' ').trim();
  }
  
  return null;
}

/**
 * Проверяет, соответствует ли тест файлу ошибки
 * @param {Object} testResult - результат теста из Allure JSON
 * @param {string} errorFilePath - путь к файлу ошибки
 * @returns {boolean}
 */
function isMatchingTest(testResult, errorFilePath) {
  if (!testResult || !errorFilePath) {
    console.log(`   ❌ Missing testResult or errorFilePath`);
    return false;
  }
  
  // Извлекаем информацию из пути к файлу ошибки
  const errorDir = path.basename(path.dirname(errorFilePath));
  const errorFileName = path.basename(errorFilePath);
  
  console.log(`🔍 Checking test match:`);
  console.log(`   Test name: "${testResult.name}"`);
  console.log(`   Test UUID: "${testResult.uuid}"`);
  console.log(`   Test status: ${testResult.status}`);
  console.log(`   Test fullName: "${testResult.fullName}"`);
  console.log(`   Error dir: "${errorDir}"`);
  console.log(`   Error file: "${errorFileName}"`);
  console.log(`   Error full path: "${errorFilePath}"`);
  
  // Проверяем статус теста (должен быть failed)
  if (testResult.status !== 'failed') {
    console.log(`   ❌ Test status is not 'failed'`);
    return false;
  }
  
  // 1. Точное сопоставление по UUID в пути к файлу ошибки
  if (errorDir.includes(testResult.uuid) || errorFilePath.includes(testResult.uuid)) {
    console.log(`   ✅ Exact match found by UUID`);
    return true;
  }
  
  // 2. Сопоставление по testCaseId если есть
  if (testResult.testCaseId && (errorDir.includes(testResult.testCaseId) || errorFilePath.includes(testResult.testCaseId))) {
    console.log(`   ✅ Match found by testCaseId`);
    return true;
  }
  
  // 3. Сопоставление по названию теста в пути к файлу ошибки
  // Извлекаем название теста из пути ошибки (например, "❌ Infinite scroll timeout" из "demo-🎯-AI-Debug-Integration-Demo-❌-Infinite-scroll-timeout-chromium")
  const testNameFromPath = extractTestNameFromErrorPath(errorDir);
  console.log(`   Extracted test name from path: "${testNameFromPath}"`);
  
  if (testNameFromPath && testResult.name) {
    const normalizedPathTestName = normalizeString(testNameFromPath);
    const normalizedResultTestName = normalizeString(testResult.name);
    
    console.log(`   Comparing: "${normalizedPathTestName}" vs "${normalizedResultTestName}"`);
    
    if (normalizedPathTestName === normalizedResultTestName) {
      console.log(`   ✅ Exact match found by test name`);
      return true;
    }
    
    // Проверяем сходство названий тестов
    const similarity = calculateStringSimilarity(normalizedPathTestName, normalizedResultTestName);
    console.log(`   Test name similarity: ${Math.round(similarity * 100)}%`);
    
    if (similarity > 0.8) { // Требуем 80% сходства для названий тестов
      console.log(`   ✅ Match found by test name similarity (${Math.round(similarity * 100)}%)`);
      return true;
    }
  }
  
  // 4. Нормализуем имена для сравнения (более строгое сопоставление)  
  function normalizeString(str) {
    return str?.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '') || '';
  }
  
  const normalizedTestName = normalizeString(testResult.name);
  const normalizedErrorDir = normalizeString(errorDir);
  
  console.log(`   Normalized test name: "${normalizedTestName}"`);
  console.log(`   Normalized error dir: "${normalizedErrorDir}"`);
  
  // 5. Проверяем по имени теста (должно быть точное совпадение или очень близкое)
  if (normalizedTestName && normalizedErrorDir && normalizedTestName.length > 3) {
    const similarity = calculateStringSimilarity(normalizedTestName, normalizedErrorDir);
    console.log(`   String similarity: ${Math.round(similarity * 100)}%`);
    
    if (similarity > 0.7) { // Требуем 70% сходства
      console.log(`   ✅ Match found by test name similarity (${Math.round(similarity * 100)}%)`);
      return true;
    }
  }
  
  // 6. Проверяем по ключевым словам из имени теста (более строгие критерии)
  const testWords = normalizedTestName?.split(/\s+/).filter(word => word.length > 3) || [];
  const errorWords = normalizedErrorDir?.split(/\s+/).filter(word => word.length > 3) || [];
  
  let matchingWords = 0;
  let totalSignificantWords = Math.max(testWords.length, errorWords.length);
  
  for (const testWord of testWords) {
    if (errorWords.some(errorWord => 
        errorWord === testWord || // точное совпадение
        (errorWord.length > 4 && testWord.length > 4 && 
         (errorWord.includes(testWord) || testWord.includes(errorWord)))
    )) {
      matchingWords++;
    }
  }
  
  const matchRatio = totalSignificantWords > 0 ? matchingWords / totalSignificantWords : 0;
  console.log(`   Keyword match ratio: ${matchingWords}/${totalSignificantWords} = ${Math.round(matchRatio * 100)}%`);
  
  if (matchingWords >= 2 && matchRatio > 0.5) { // Требуем минимум 2 совпадения и 50% от общих слов
    console.log(`   ✅ Match found by keywords (${matchingWords} matching words, ${Math.round(matchRatio * 100)}% ratio)`);
    return true;
  }
  
  console.log(`   ❌ No sufficient match found`);
  return false;
}

/**
 * Вычисляет сходство между двумя строками (алгоритм Jaro-Winkler упрощенный)
 * @param {string} str1 
 * @param {string} str2 
 * @returns {number} значение от 0 до 1
 */
function calculateStringSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;
  
  const len1 = str1.length;
  const len2 = str2.length;
  const maxDistance = Math.floor(Math.max(len1, len2) / 2) - 1;
  
  let matches = 0;
  const str1Matches = new Array(len1).fill(false);
  const str2Matches = new Array(len2).fill(false);
  
  // Найти совпадения
  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - maxDistance);
    const end = Math.min(i + maxDistance + 1, len2);
    
    for (let j = start; j < end; j++) {
      if (str2Matches[j] || str1[i] !== str2[j]) continue;
      str1Matches[i] = true;
      str2Matches[j] = true;
      matches++;
      break;
    }
  }
  
  if (matches === 0) return 0;
  
  // Подсчитать транспозиции
  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!str1Matches[i]) continue;
    while (!str2Matches[k]) k++;
    if (str1[i] !== str2[k]) transpositions++;
    k++;
  }
  
  const jaro = (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;
  return jaro;
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
