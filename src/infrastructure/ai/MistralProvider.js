// src/infrastructure/ai/MistralProvider.js

/**
 * Mistral AI провайдер для отправки запросов к Mistral API
 */
export class MistralProvider {
  constructor() {
    this.providerName = 'Mistral';
  }

  /**
   * Генерирует ответ от Mistral API
   * @param {string} prompt - промпт для анализа
   * @param {Object} config - конфигурация
   * @param {string} domSnapshot - DOM snapshot (опционально)
   * @returns {Promise<string>} - ответ от AI
   */
  async generateResponse(prompt, config, domSnapshot = null) {
    if (!config.api_key) {
      throw new Error('Mistral API key is required. Set API_KEY environment variable or configure api_key in ai.conf.js');
    }

    const requestBody = {
      model: config.model || 'mistral-medium',
      messages: [
        ...config.messages || [],
        {
          role: 'user',
          content: this.buildPromptContent(prompt, domSnapshot)
        }
      ],
      max_tokens: 2000,
      temperature: 0.1,
      stream: config.stream || false
    };

    try {
      const response = await fetch(config.ai_server, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.api_key}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Mistral API error: ${response.status} ${response.statusText} - ${errorData.message || 'Unknown error'}`);
      }

      // Обработка потокового ответа
      if (config.stream) {
        return await this.handleStreamResponse(response);
      }

      // Обработка обычного ответа
      const data = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response choices returned from Mistral API');
      }

      return data.choices[0].message.content.trim();

    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(`Network error: Unable to connect to Mistral API. Check your internet connection and API endpoint: ${config.ai_server}`);
      }
      
      // Обработка ошибок парсинга JSON для потоковых ответов
      if (error.message.includes('Unexpected token') && error.message.includes('data:')) {
        throw new Error('Stream parsing error: Mistral API returned streaming data but stream handling failed. Try setting stream: false in configuration.');
      }
      
      throw error;
    }
  }

  /**
   * Обрабатывает потоковый ответ от Mistral API
   * @param {Response} response - ответ от fetch
   * @returns {Promise<string>} - собранный текст ответа
   */
  async handleStreamResponse(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let result = '';
    let isFirstChunk = true;

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            
            if (data === '[DONE]') {
              console.log('\n'); // Новая строка после завершения
              return result.trim();
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                const content = parsed.choices[0].delta.content;
                
                // Показываем заголовок только при первом чанке
                if (isFirstChunk && content.trim()) {
                  console.log('🤖 AI Response (streaming):');
                  console.log('─'.repeat(50));
                  isFirstChunk = false;
                }
                
                // Выводим контент в реальном времени
                process.stdout.write(content);
                result += content;
              }
            } catch (parseError) {
              // Игнорируем ошибки парсинга отдельных чанков
              continue;
            }
          }
        }
      }

      console.log('\n'); // Новая строка после завершения
      return result.trim();
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Строит содержимое промпта с учетом DOM snapshot
   * @param {string} prompt - основной промпт
   * @param {string} domSnapshot - DOM snapshot
   * @returns {string} - полный промпт
   */
  buildPromptContent(prompt, domSnapshot) {
    let content = prompt;

    if (domSnapshot) {
      content += '\n\n## DOM Snapshot\n';
      content += '```html\n';
      content += domSnapshot;
      content += '\n```';
      content += '\n\nИспользуй эту информацию о структуре DOM для более точного анализа селекторов и элементов страницы.';
    }

    return content;
  }

  /**
   * Возвращает имя провайдера
   * @returns {string}
   */
  getProviderName() {
    return this.providerName;
  }

  /**
   * Возвращает список поддерживаемых моделей
   * @returns {string[]}
   */
  getSupportedModels() {
    // Возвращаем null чтобы указать что поддерживаем любые модели
    return null;
  }

  /**
   * Валидирует конфигурацию провайдера
   * @param {Object} config - конфигурация
   * @returns {Promise<{isValid: boolean, issues: string[]}>}
   */
  async validateConfiguration(config) {
    const issues = [];

    if (!config.api_key) {
      issues.push('API key is required');
    }

    if (!config.ai_server) {
      issues.push('AI server URL is required');
    } else if (!config.ai_server.startsWith('https://')) {
      issues.push('AI server URL should use HTTPS');
    }

    if (!config.model) {
      issues.push('Model is required');
    }
    // Убираем проверку поддерживаемых моделей - позволяем пользователю использовать любые модели

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Проверяет доступность API
   * @param {Object} config - конфигурация
   * @returns {Promise<boolean>}
   */
  async checkApiAvailability(config) {
    try {
      const response = await fetch(config.ai_server, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.api_key}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1
        })
      });

      return response.status !== 401 && response.status !== 403;
    } catch {
      return false;
    }
  }
}
