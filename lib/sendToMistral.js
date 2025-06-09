import 'dotenv/config';
import { buildMessages } from './config.js';

/**
 * Отправляет промпт в AI API и получает ответ в режиме стрима
 * @param {string} promptContent - содержимое ошибки из copy-prompt.txt
 * @param {Object} config - конфигурация AI из playwright.config.js
 * @returns {Promise<string>} - полный ответ от AI
 */
async function sendToMistral(promptContent, config) {
  if (!config.api_key) {
    throw new Error('api_key не найден в конфигурации AI');
  }
  
  console.log('🔁 Отправлено в AI...');
  
  const apiUrl = `${config.ai_server}/v1/chat/completions`;
  const messages = buildMessages(config, promptContent);
  
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
    throw new Error(`Ошибка AI API: ${response.status} ${response.statusText}`);
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
            }
          } catch (e) {
            // Игнорируем ошибки парсинга отдельных чанков
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
  
  console.log('✅ Ответ получен');
  return fullResponse.trim();
}

export { sendToMistral }; 