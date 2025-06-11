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
  console.log('🤖 AI Response:');
  console.log('─'.repeat(50));
  
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

export { sendToAI }; 