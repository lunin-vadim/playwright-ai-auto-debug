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

    if (errorFilePath) {
      // Пытаемся найти наиболее подходящий тест по пути к файлу ошибки
      const errorFileName = errorFilePath.split('/').pop().replace(/\.[^/.]+$/, ''); // убираем расширение
      const errorKeywords = errorFileName.toLowerCase().split(/[^a-zA-Z0-9]+/).filter(Boolean);
      
      // Ищем тесты с наибольшим совпадением
      const scoredTests = failedTests.map(test => {
        const testName = (test.result.name || test.result.fullName || '').toLowerCase();
        const testKeywords = testName.split(/[^a-zA-Z0-9]+/).filter(Boolean);
        
        // Подсчитываем совпадения ключевых слов
        let score = 0;
        errorKeywords.forEach(keyword => {
          if (testKeywords.some(testKeyword => 
            testKeyword.includes(keyword) || keyword.includes(testKeyword)
          )) {
            score++;
          }
        });
        
        // Дополнительные очки за совпадение в сообщении об ошибке
        if (test.errorMessage.toLowerCase().includes(errorFileName.toLowerCase())) {
          score += 2;
        }
        
        return { ...test, matchScore: score };
      });
      
      // Берем тесты с наивысшим скором (минимум 1)
      const bestMatches = scoredTests.filter(test => test.matchScore > 0);
      if (bestMatches.length > 0) {
        // Сортируем по скору и берем лучшие совпадения
        bestMatches.sort((a, b) => b.matchScore - a.matchScore);
        const maxScore = bestMatches[0].matchScore;
        targetTests = bestMatches.filter(test => test.matchScore === maxScore);
      }
    }
    
    // Если не нашли подходящие тесты по файлу, берем все упавшие
    if (targetTests.length === 0) {
      targetTests = failedTests.slice(0, 3); // Ограничиваем максимум 3 тестами
    }

    // Создаем AI attachment для каждого целевого теста
    for (const targetTest of targetTests) {
      await createAiAttachmentForTest(targetTest, response, originalPrompt, allureDir);
    }
    
    console.debug(`AI debug analysis attached to ${targetTests.length} failed test(s)`);
    
  } catch (error) {
    console.debug(`Allure integration error: ${error.message}`);
  }
}

/**
 * Creates AI attachment for a specific failed test
 * @param {Object} testData - test data with file and result
 * @param {string} response - AI response content
 * @param {string} originalPrompt - original error prompt
 * @param {string} allureDir - Allure results directory
 */
async function createAiAttachmentForTest(testData, response, originalPrompt, allureDir) {
  try {
    // Проверяем, нет ли уже AI attachment для этого теста
    const existingAiAttachment = testData.result.attachments?.find(att => 
      att.name && att.name.includes('AI Debug Analysis')
    );
    
    if (existingAiAttachment) {
      console.debug(`AI attachment already exists for test: ${testData.result.name}`);
      return;
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
    
  } catch (error) {
    console.debug(`Failed to create AI attachment for test ${testData.result.name}: ${error.message}`);
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