import 'dotenv/config';

/**
 * Отправляет промпт в Mistral API и получает ответ в режиме стрима
 * @param {string} promptContent - содержимое ошибки из copy-prompt.txt
 * @returns {Promise<string>} - полный ответ от AI
 */
async function sendToMistral(promptContent) {
  const apiKey = process.env.MISTRAL_API_KEY;
  
  if (!apiKey) {
    throw new Error('MISTRAL_API_KEY не найден в переменных окружения');
  }
  
  console.log('🔁 Отправлено в Mistral...');
  
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'mistral-medium',
      messages: [
        {
          role: 'system',
          content: 'Ты AI помощник по отладке Playwright тестов. Анализируй ошибки и предлагай конкретные решения на русском языке. Отвечай кратко и по делу.'
        },
        {
          role: 'user',
          content: `Вот ошибка из Playwright теста:\n\n${promptContent}\n\nПредложи конкретное решение этой проблемы.`
        }
      ],
      stream: true
    })
  });
  
  if (!response.ok) {
    throw new Error(`Ошибка Mistral API: ${response.status} ${response.statusText}`);
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