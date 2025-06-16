import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';

/**
 * Finds failed tests in Allure results and attaches AI response
 * @param {string} response - AI response content
 * @param {string} originalPrompt - original error prompt
 * @param {Object} config - AI configuration
 * @param {string} errorFilePath - path to error file for matching
 */
async function attachAiResponseToFailedTest(response, originalPrompt, config, errorFilePath = null) {
  if (!config.allure_integration) {
    return;
  }

  try {
    const allureDir = config.allure_results_dir || 'allure-results';
    
    if (!existsSync(allureDir)) {
      console.debug('Allure results directory not found, skipping integration');
      return;
    }

    // Ищем результаты тестов
    const testResultFiles = await glob(join(allureDir, '*-result.json'));
    
    if (testResultFiles.length === 0) {
      console.debug('No test result files found in Allure directory');
      return;
    }

    // Находим только упавшие тесты (failed, broken)
    const failedTests = [];
    
    for (const file of testResultFiles) {
      try {
        const content = readFileSync(file, 'utf8');
        const testResult = JSON.parse(content);
        
        // Строго проверяем статус - только failed и broken тесты
        if (testResult.status === 'failed' || testResult.status === 'broken') {
          // Проверяем что у теста есть ошибка или исключение
          const hasError = testResult.statusDetails && 
            (testResult.statusDetails.message || testResult.statusDetails.trace);
          
          if (hasError) {
            failedTests.push({
              file,
              result: testResult,
              errorMessage: testResult.statusDetails.message || '',
              errorTrace: testResult.statusDetails.trace || ''
            });
          }
        }
      } catch (parseError) {
        console.debug(`Failed to parse test result file ${file}: ${parseError.message}`);
        continue;
      }
    }

    if (failedTests.length === 0) {
      console.debug('No failed tests with errors found');
      return;
    }

    // Определяем целевые тесты для прикрепления AI ответа
    let targetTests = [];

    // Улучшенный алгоритм сопоставления по содержимому ошибок
    if (originalPrompt && originalPrompt.trim()) {
      const promptLower = originalPrompt.toLowerCase();
      
      // Извлекаем ключевые элементы из промпта
      const errorKeywords = extractErrorKeywords(originalPrompt);
      const stackTraceLines = extractStackTraceLines(originalPrompt);
      const errorMessages = extractErrorMessages(originalPrompt);
      
      // Извлекаем информацию из пути к файлу ошибки
      let fileBasedKeywords = [];
      if (errorFilePath) {
        fileBasedKeywords = extractFileBasedKeywords(errorFilePath);
      }
      
      // Оцениваем каждый упавший тест на соответствие
      const scoredTests = failedTests.map(test => {
        let score = 0;
        const testErrorLower = (test.errorMessage + ' ' + test.errorTrace).toLowerCase();
        const testName = (test.result.name || test.result.fullName || '').toLowerCase();
        
        // 1. Проверяем совпадение сообщений об ошибках
        errorMessages.forEach(msg => {
          if (testErrorLower.includes(msg.toLowerCase())) {
            score += 5; // Высокий приоритет для точных совпадений сообщений
          }
        });
        
        // 2. Проверяем совпадение строк stack trace
        stackTraceLines.forEach(line => {
          if (testErrorLower.includes(line.toLowerCase())) {
            score += 3; // Средний приоритет для stack trace
          }
        });
        
        // 3. Проверяем ключевые слова ошибок
        errorKeywords.forEach(keyword => {
          if (testErrorLower.includes(keyword.toLowerCase())) {
            score += 1; // Низкий приоритет для общих ключевых слов
          }
        });
        
        // 4. Проверяем соответствие по имени файла/теста (УЛУЧШЕНО)
        fileBasedKeywords.forEach(keyword => {
          if (testName.includes(keyword)) {
            score += 4; // Высокий приоритет для совпадения имен
          }
          // Также проверяем частичные совпадения
          if (keyword.length > 3 && testName.includes(keyword.substring(0, keyword.length - 1))) {
            score += 2;
          }
        });
        
        // 5. Дополнительная проверка по типу ошибки из имени файла
        if (errorFilePath) {
          const errorTypeFromPath = extractErrorTypeFromPath(errorFilePath);
          if (errorTypeFromPath && testErrorLower.includes(errorTypeFromPath)) {
            score += 3;
          }
        }
        
        return { ...test, matchScore: score };
      });
      
      // Берем тесты с наивысшим скором (минимум 1)
      const bestMatches = scoredTests.filter(test => test.matchScore > 0);
      if (bestMatches.length > 0) {
        // Сортируем по скору и берем все с высоким скором
        bestMatches.sort((a, b) => b.matchScore - a.matchScore);
        const maxScore = bestMatches[0].matchScore;
        
        // Если максимальный скор высокий (>=2), берем только лучшие совпадения
        // Иначе берем все тесты с положительным скором
        if (maxScore >= 2) {
          targetTests = bestMatches.filter(test => test.matchScore >= Math.max(2, maxScore - 1));
        } else {
          targetTests = bestMatches;
        }
      }
    }
    
    // Если не нашли подходящие тесты по содержимому, берем все упавшие
    if (targetTests.length === 0) {
      targetTests = failedTests;
      console.debug('No specific matches found, attaching AI response to all failed tests');
    }

    // Создаем AI attachment для каждого целевого теста
    let attachedCount = 0;
    for (const targetTest of targetTests) {
      const attached = await createAiAttachmentForTest(targetTest, response, originalPrompt, allureDir);
      if (attached) {
        attachedCount++;
      }
    }
    
    console.debug(`AI debug analysis attached to ${attachedCount}/${targetTests.length} failed test(s)`);
    
  } catch (error) {
    console.debug(`Allure integration error: ${error.message}`);
  }
}

/**
 * Извлекает ключевые слова ошибок из промпта
 * @param {string} prompt - текст промпта
 * @returns {Array<string>} массив ключевых слов
 */
function extractErrorKeywords(prompt) {
  const keywords = [];
  const lines = prompt.split('\n');
  
  for (const line of lines) {
    // Ищем типичные паттерны ошибок
    const errorPatterns = [
      /TimeoutError/gi,
      /Error:/gi,
      /Exception/gi,
      /Failed/gi,
      /Timeout/gi,
      /waiting for/gi,
      /locator\([^)]+\)/gi,
      /selector/gi,
      /element/gi
    ];
    
    errorPatterns.forEach(pattern => {
      const matches = line.match(pattern);
      if (matches) {
        matches.forEach(match => keywords.push(match.trim()));
      }
    });
  }
  
  return [...new Set(keywords)]; // убираем дубликаты
}

/**
 * Извлекает строки stack trace из промпта
 * @param {string} prompt - текст промпта
 * @returns {Array<string>} массив строк stack trace
 */
function extractStackTraceLines(prompt) {
  const lines = prompt.split('\n');
  const stackLines = [];
  
  for (const line of lines) {
    // Ищем строки, похожие на stack trace
    if (line.includes('.js:') && (line.includes('at ') || line.includes('/'))) {
      // Извлекаем имя файла и номер строки
      const match = line.match(/([^/\\]+\.js:\d+)/);
      if (match) {
        stackLines.push(match[1]);
      }
    }
  }
  
  return stackLines;
}

/**
 * Извлекает сообщения об ошибках из промпта
 * @param {string} prompt - текст промпта
 * @returns {Array<string>} массив сообщений об ошибках
 */
function extractErrorMessages(prompt) {
  const messages = [];
  const lines = prompt.split('\n');
  
  for (const line of lines) {
    // Ищем строки с сообщениями об ошибках
    if (line.includes('Error:') || line.includes('TimeoutError:') || line.includes('Exception:')) {
      const cleanMessage = line.replace(/^\s*[-*]\s*/, '').trim();
      if (cleanMessage.length > 10) { // игнорируем слишком короткие сообщения
        messages.push(cleanMessage);
      }
    }
  }
  
  return messages;
}

/**
 * Извлекает ключевые слова из пути к файлу ошибки
 * @param {string} filePath - путь к файлу ошибки
 * @returns {Array<string>} массив ключевых слов
 */
function extractFileBasedKeywords(filePath) {
  const keywords = [];
  
  // Извлекаем имя директории теста
  const pathParts = filePath.split('/');
  const testDirName = pathParts.find(part => part.includes('Demo') || part.includes('test') || part.includes('spec'));
  
  if (testDirName) {
    // Разбиваем имя директории на части
    const parts = testDirName.split(/[-_\s]+/);
    parts.forEach(part => {
      if (part.length > 2) {
        keywords.push(part.toLowerCase());
      }
    });
    
    // Ищем эмодзи и текст после них
    const emojiMatches = testDirName.match(/[❌✅⚠️🎯]\s*([^-]+)/g);
    if (emojiMatches) {
      emojiMatches.forEach(match => {
        const cleanMatch = match.replace(/[❌✅⚠️🎯]\s*/, '').trim();
        if (cleanMatch.length > 2) {
          keywords.push(cleanMatch.toLowerCase());
        }
      });
    }
  }
  
  return [...new Set(keywords)]; // убираем дубликаты
}

/**
 * Извлекает тип ошибки из пути к файлу
 * @param {string} filePath - путь к файлу ошибки
 * @returns {string|null} тип ошибки или null
 */
function extractErrorTypeFromPath(filePath) {
  const pathLower = filePath.toLowerCase();
  
  // Ищем типичные типы ошибок в пути
  const errorTypes = [
    'timeout',
    'login',
    'validation',
    'checkout',
    'title',
    'assertion',
    'api',
    'response',
    'form',
    'button',
    'missing'
  ];
  
  for (const errorType of errorTypes) {
    if (pathLower.includes(errorType)) {
      return errorType;
    }
  }
  
  return null;
}

/**
 * Creates AI attachment for a specific failed test
 * @param {Object} testData - test data with file and result
 * @param {string} response - AI response content
 * @param {string} originalPrompt - original error prompt
 * @param {string} allureDir - Allure results directory
 * @returns {boolean} true if attachment was created, false if already exists
 */
async function createAiAttachmentForTest(testData, response, originalPrompt, allureDir) {
  try {
    // Проверяем, нет ли уже AI attachment для этого теста
    const existingAiAttachment = testData.result.attachments?.find(att => 
      att.name && att.name.includes('AI Debug Analysis')
    );
    
    if (existingAiAttachment) {
      console.debug(`AI attachment already exists for test: ${testData.result.name}`);
      return false;
    }

    // Создаем уникальный ID для attachment
    const timestamp = Date.now();
    const testId = testData.result.uuid || testData.result.name?.replace(/[^a-zA-Z0-9]/g, '') || 'unknown';
    const attachmentId = `ai-debug-${testId}-${timestamp}`;
    
    // Создаем содержимое attachment в формате Markdown
    const markdownContent = createAiAttachmentContent(testData.result, originalPrompt, response);
    
    // Сохраняем attachment файл
    const attachmentFileName = `${attachmentId}.md`;
    const attachmentPath = join(allureDir, attachmentFileName);
    writeFileSync(attachmentPath, markdownContent, 'utf8');

    // Инициализируем массив attachments если его нет
    if (!testData.result.attachments) {
      testData.result.attachments = [];
    }

    // Добавляем attachment к тесту
    testData.result.attachments.push({
      name: '🤖 AI Debug Analysis',
      source: attachmentFileName,
      type: 'text/markdown'
    });

    // Добавляем label для удобной фильтрации
    if (!testData.result.labels) {
      testData.result.labels = [];
    }

    const hasAiLabel = testData.result.labels.some(label => label.name === 'ai-analyzed');
    if (!hasAiLabel) {
      testData.result.labels.push({
        name: 'ai-analyzed',
        value: 'true'
      });
    }

    // Сохраняем обновленный результат теста
    writeFileSync(testData.file, JSON.stringify(testData.result, null, 2), 'utf8');
    
    console.debug(`AI attachment created for test: ${testData.result.name}`);
    return true;
    
  } catch (error) {
    console.debug(`Failed to create AI attachment for test ${testData.result.name}: ${error.message}`);
    return false;
  }
}

/**
 * Creates formatted content for AI attachment
 * @param {Object} testResult - test result object
 * @param {string} originalPrompt - original error prompt
 * @param {string} response - AI response
 * @returns {string} formatted markdown content
 */
function createAiAttachmentContent(testResult, originalPrompt, response) {
  const timestamp = new Date().toLocaleString('ru-RU', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  let content = `# 🤖 AI Debug Analysis\n\n`;
  content += `**Test Name:** ${testResult.name || 'Unknown'}\n`;
  content += `**Test Status:** ${testResult.status}\n`;
  content += `**Analysis Time:** ${timestamp}\n`;
  
  if (testResult.fullName && testResult.fullName !== testResult.name) {
    content += `**Full Name:** ${testResult.fullName}\n`;
  }
  
  content += `\n---\n\n`;
  
  // Добавляем детали ошибки если есть
  if (testResult.statusDetails) {
    content += `## 🔍 Error Details\n\n`;
    
    if (testResult.statusDetails.message) {
      content += `**Error Message:**\n\`\`\`\n${testResult.statusDetails.message}\n\`\`\`\n\n`;
    }
    
    if (testResult.statusDetails.trace) {
      content += `**Stack Trace:**\n\`\`\`\n${testResult.statusDetails.trace}\n\`\`\`\n\n`;
    }
  }
  
  // Добавляем оригинальный промпт
  if (originalPrompt && originalPrompt.trim()) {
    content += `## 📝 Original Error Context\n\n`;
    content += `\`\`\`\n${originalPrompt.trim()}\n\`\`\`\n\n`;
  }
  
  // Добавляем AI решение
  content += `## 💡 AI Solution & Recommendations\n\n`;
  content += `${response}\n\n`;
  
  content += `---\n`;
  content += `*Generated by AI Debug Assistant*\n`;
  
  return content;
}

/**
 * Legacy function for backward compatibility - now just calls the main function
 * @deprecated Use attachAiResponseToFailedTest instead
 */
async function addAllureAttachmentToTest(response, originalPrompt, config, testName) {
  return attachAiResponseToFailedTest(response, originalPrompt, config, testName);
}

/**
 * Legacy function - no longer creates standalone results
 * @deprecated Standalone results are no longer created for seamless integration
 */
function createStandaloneAllureResult(response, originalPrompt, config, index = 0) {
  // Функция оставлена для обратной совместимости, но ничего не делает
  console.debug('createStandaloneAllureResult is deprecated and does nothing');
  return;
}

export { attachAiResponseToFailedTest, addAllureAttachmentToTest, createStandaloneAllureResult }; 