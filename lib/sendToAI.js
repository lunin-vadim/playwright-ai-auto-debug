import 'dotenv/config';
import { buildMessages } from './config.js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { createStandaloneAllureResult, addAllureAttachmentToTest } from './allureUtils.js';

/**
 * Sends prompt to AI API and receives response in streaming mode
 * @param {string} promptContent - error content from copy-prompt.txt
 * @param {Object} config - AI configuration
 * @returns {Promise<string>} - full response from AI
 */
async function sendToAI(promptContent, config) {
  if (!config.api_key) {
    throw new Error('api_key not found in AI configuration');
  }
  
  console.log('🔁 Sent to AI...');
  console.log('🤖 AI Response:');
  console.log('─'.repeat(50));
  
  const apiUrl = `${config.ai_server}/v1/chat/completions`;
  const messages = buildMessages(promptContent, config);
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.api_key}` 
    },
    body: JSON.stringify({
      model: config.model,
      messages: messages,
      stream: true
    })
  });
  
  if (!response.ok) {
    let errorMessage = `AI API error: ${response.status} ${response.statusText}`;
    
    // Enhanced error messages based on status code
    switch (response.status) {
      case 401:
        errorMessage += ' - Invalid API key';
        break;
      case 403:
        errorMessage += ' - Access forbidden - check your API key permissions';
        break;
      case 429:
        errorMessage += ' - Rate limit exceeded - too many requests';
        break;
      case 500:
        errorMessage += ' - Internal server error - try again later';
        break;
      case 503:
        errorMessage += ' - Service unavailable - try again later';
        break;
    }
    
    throw new Error(errorMessage);
  }
  
  let fullResponse = '';
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            break;
          }
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            
            if (content) {
              fullResponse += content;
              // Stream output to console in real-time
              process.stdout.write(content);
            }
          } catch (e) {
            // Ignore parsing errors for individual chunks
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
  
  console.log('\n' + '─'.repeat(50));
  console.log(`✅ Response received (${fullResponse.trim().length} chars)`);
  return fullResponse.trim();
}

/**
 * Saves AI response to Markdown file
 * @param {string} response - AI response content
 * @param {string} originalPrompt - original error prompt
 * @param {Object} config - AI configuration
 * @param {number} index - file index for naming
 */
function saveResponseToMarkdown(response, originalPrompt, config, index = 0) {
  if (!config.save_ai_responses) {
    return;
  }

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const responseDir = config.ai_responses_dir || 'ai-responses';
    
    // Создаем директорию если не существует
    if (!existsSync(responseDir)) {
      mkdirSync(responseDir, { recursive: true });
    }

    // Формируем имя файла
    const filename = (config.ai_response_filename_template || 'ai-response-{timestamp}-{index}.md')
      .replace('{timestamp}', timestamp)
      .replace('{index}', index.toString().padStart(3, '0'));
    
    const filepath = join(responseDir, filename);

    // Формируем содержимое MD файла
    let markdownContent = '';
    
    if (config.include_metadata) {
      markdownContent += `# AI Response Report\n\n`;
      markdownContent += `**Дата:** ${new Date().toLocaleString('ru-RU')}\n`;
      markdownContent += `**Модель:** ${config.model}\n`;
      markdownContent += `**API Server:** ${config.ai_server}\n`;
      markdownContent += `**Файл:** ${index + 1}\n\n`;
      markdownContent += `---\n\n`;
    }

    markdownContent += `## Исходная ошибка\n\n`;
    markdownContent += `\`\`\`\n${originalPrompt}\n\`\`\`\n\n`;
    markdownContent += `## Решение от ИИ\n\n`;
    markdownContent += `${response}\n\n`;
    
    if (config.include_metadata) {
      markdownContent += `---\n`;
      markdownContent += `*Сгенерировано автоматически pw-ai*\n`;
    }

    // Сохраняем файл
    writeFileSync(filepath, markdownContent, 'utf8');
    console.log(`💾 AI response saved to: ${filepath}`);
    
  } catch (error) {
    console.error(`❌ Error saving AI response to Markdown: ${error.message}`);
  }
}

/**
 * Creates Allure attachment for AI response
 * @param {string} response - AI response content
 * @param {string} originalPrompt - original error prompt
 * @param {Object} config - AI configuration
 * @param {number} index - file index for naming
 * @param {string} testName - optional test name to attach to
 */
async function createAllureAttachment(response, originalPrompt, config, index = 0, testName = null) {
  if (!config.allure_integration) {
    return;
  }

  try {
    // Пытаемся прикрепить к существующему тесту
    if (testName) {
      await addAllureAttachmentToTest(response, originalPrompt, config, testName);
    }
    
    // Всегда создаем отдельный результат для AI анализа
    createStandaloneAllureResult(response, originalPrompt, config, index);
    
  } catch (error) {
    console.error(`❌ Error creating Allure attachment: ${error.message}`);
  }
}

export { sendToAI, saveResponseToMarkdown, createAllureAttachment }; 