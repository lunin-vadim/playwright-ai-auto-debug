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
      return; // Тихо выходим если нет директории
    }

    // Ищем результаты тестов
    const testResultFiles = await glob(join(allureDir, '*-result.json'));
    
    if (testResultFiles.length === 0) {
      return; // Тихо выходим если нет результатов
    }

    // Находим упавшие тесты
    const failedTests = [];
    
    for (const file of testResultFiles) {
      try {
        const content = readFileSync(file, 'utf8');
        const testResult = JSON.parse(content);
        
        // Ищем тесты со статусом failed или broken
        if (testResult.status === 'failed' || testResult.status === 'broken') {
          failedTests.push({
            file,
            result: testResult,
            content
          });
        }
      } catch {
        continue; // Пропускаем поврежденные файлы
      }
    }

    if (failedTests.length === 0) {
      return; // Нет упавших тестов
    }

    // Выбираем наиболее подходящий тест
    let targetTest = failedTests[0]; // По умолчанию первый упавший

    // Пытаемся найти более точное соответствие
    if (errorFilePath) {
      // Извлекаем имя теста из пути к файлу ошибки
      const errorFileName = errorFilePath.split('/').pop();
      const possibleTestName = errorFileName.replace(/[^a-zA-Z0-9]/g, '');
      
      const matchingTest = failedTests.find(test => {
        const testName = test.result.name || test.result.fullName || '';
        return testName.toLowerCase().includes(possibleTestName.toLowerCase()) ||
               possibleTestName.toLowerCase().includes(testName.toLowerCase().replace(/[^a-zA-Z0-9]/g, ''));
      });
      
      if (matchingTest) {
        targetTest = matchingTest;
      }
    }

    // Создаем аттачмент
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const attachmentId = `ai-debug-${timestamp}`;
    
    // Создаем компактный Markdown файл
    let markdownContent = `# 🤖 AI Debug Analysis\n\n`;
    markdownContent += `**Test:** ${targetTest.result.name || 'Unknown'}\n`;
    markdownContent += `**Status:** ${targetTest.result.status}\n`;
    markdownContent += `**Generated:** ${new Date().toLocaleString('ru-RU')}\n\n`;
    markdownContent += `## 🔍 Error Details\n\n`;
    markdownContent += `\`\`\`\n${originalPrompt}\n\`\`\`\n\n`;
    markdownContent += `## 💡 AI Solution\n\n`;
    markdownContent += `${response}\n`;

    // Сохраняем аттачмент
    const attachmentPath = join(allureDir, `${attachmentId}.md`);
    writeFileSync(attachmentPath, markdownContent, 'utf8');

    // Добавляем аттачмент к тесту
    if (!targetTest.result.attachments) {
      targetTest.result.attachments = [];
    }

    // Проверяем, нет ли уже AI аттачмента
    const hasAiAttachment = targetTest.result.attachments.some(att => 
      att.name && att.name.includes('AI Debug')
    );

    if (!hasAiAttachment) {
      targetTest.result.attachments.push({
        name: '🤖 AI Debug Analysis',
        source: `${attachmentId}.md`,
        type: 'text/markdown'
      });

      // Добавляем метку для фильтрации (незаметно)
      if (!targetTest.result.labels) {
        targetTest.result.labels = [];
      }

      const hasAiLabel = targetTest.result.labels.some(label => label.name === 'ai-debug');
      if (!hasAiLabel) {
        targetTest.result.labels.push({
          name: 'ai-debug',
          value: 'analyzed'
        });
      }

      // Сохраняем обновленный результат теста
      writeFileSync(targetTest.file, JSON.stringify(targetTest.result, null, 2), 'utf8');
    }
    
  } catch (error) {
    // Тихо игнорируем ошибки интеграции с Allure
    console.debug(`Allure integration error: ${error.message}`);
  }
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
  return;
}

export { attachAiResponseToFailedTest, addAllureAttachmentToTest, createStandaloneAllureResult }; 