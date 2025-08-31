// src/infrastructure/ai/LocalAIProvider.js

/**
 * Локальный AI провайдер для работы с LM Studio, Ollama и другими локальными серверами
 * Поддерживает потоковую передачу ответов
 */
export class LocalAIProvider {
  constructor() {
    this.providerName = 'Local AI';
  }

  /**
   * Генерирует ответ от локального AI сервера с поддержкой стриминга
   * @param {string} prompt - промпт для анализа
   * @param {Object} config - конфигурация
   * @param {string} domSnapshot - DOM snapshot (опционально)
   * @returns {Promise<string>} - ответ от AI
   */
  async generateResponse(prompt, config, domSnapshot = null) {
    const requestBody = {
      model: config.model || 'auto',
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
          ...(config.api_key && config.api_key !== '' ? {
            'Authorization': `Bearer ${config.api_key}`
          } : {})
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Local AI server error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      // Обработка потокового ответа
      if (config.stream) {
        return await this.handleStreamResponse(response);
      } else {
        return await this.handleRegularResponse(response);
      }

    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(`Network error: Unable to connect to local AI server at ${config.ai_server}. Make sure the server is running.`);
      }
      throw error;
    }
  }

  /**
   * Обрабатывает потоковый ответ от AI сервера
   * @param {Response} response - ответ от fetch
   * @returns {Promise<string>} - полный ответ
   */
  async handleStreamResponse(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    console.log('📡 Receiving streaming response...');

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
              console.log('\n✅ Stream completed');
              return fullResponse.trim();
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              
              if (content) {
                fullResponse += content;
                // Выводим получаемый текст в реальном времени
                process.stdout.write(content);
              }
            } catch (parseError) {
              // Игнорируем ошибки парсинга отдельных чанков
              continue;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    if (fullResponse.trim().length === 0) {
      throw new Error('Empty response received from streaming API');
    }

    console.log(`\n✅ Received ${fullResponse.length} characters`);
    return fullResponse.trim();
  }

  /**
   * Обрабатывает обычный (не потоковый) ответ
   * @param {Response} response - ответ от fetch
   * @returns {Promise<string>} - ответ от AI
   */
  async handleRegularResponse(response) {
    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response choices returned from local AI server');
    }

    const content = data.choices[0].message?.content;
    if (!content) {
      throw new Error('Empty content in response from local AI server');
    }

    return content.trim();
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

    if (!config.ai_server) {
      issues.push('AI server URL is required');
    } else {
      // Проверяем что это локальный сервер
      try {
        const url = new URL(config.ai_server);
        if (!['localhost', '127.0.0.1'].includes(url.hostname) && 
            !url.hostname.startsWith('192.168.') && 
            !url.hostname.startsWith('10.') &&
            !url.hostname.startsWith('172.')) {
          console.warn(`⚠️  Server ${url.hostname} doesn't appear to be local. Make sure it's accessible.`);
        }
      } catch (urlError) {
        issues.push('Invalid AI server URL format');
      }
    }

    if (!config.model) {
      issues.push('Model is required');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Проверяет доступность локального AI сервера
   * @param {Object} config - конфигурация
   * @returns {Promise<boolean>}
   */
  async checkApiAvailability(config) {
    try {
      // Отправляем простой тестовый запрос
      const response = await fetch(config.ai_server, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.api_key && config.api_key !== '' ? {
            'Authorization': `Bearer ${config.api_key}`
          } : {})
        },
        body: JSON.stringify({
          model: config.model || 'auto',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1,
          stream: false
        })
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}
