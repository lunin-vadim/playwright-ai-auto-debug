import 'dotenv/config';
import { buildMessages } from './config.js';

/**
 * Sends prompt to AI API and receives response in streaming mode
 * @param {string} promptContent - error content from copy-prompt.txt
 * @param {Object} config - AI configuration from playwright.config.js
 * @returns {Promise<string>} - full response from AI
 */
async function sendToAI(promptContent, config) {
  if (!config.api_key) {
    throw new Error('api_key not found in AI configuration');
  }
  
  console.log('🔁 Sent to AI...');
  
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
    throw new Error(`AI API error: ${response.status} ${response.statusText}`);
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
            // Ignore parsing errors for individual chunks
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
  
  console.log('✅ Response received');
  return fullResponse.trim();
}

export { sendToAI }; 