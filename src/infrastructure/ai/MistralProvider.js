// src/infrastructure/ai/MistralProvider.js

/**
 * Mistral AI провайдер для отправки запросов к Mistral API
 */
export class MistralProvider {
  constructor() {
    this.providerName = 'Mistral';
    this.supportedModels = [
      'mistral-tiny',
      'mistral-small',
      'mistral-medium',
      'mistral-large',
      'open-mistral-7b',
      'open-mixtral-8x7b'
    ];
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

      const data = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response choices returned from Mistral API');
      }

      return data.choices[0].message.content.trim();

    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(`Network error: Unable to connect to Mistral API. Check your internet connection and API endpoint: ${config.ai_server}`);
      }
      throw error;
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
    return this.supportedModels;
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
    } else if (!this.supportedModels.includes(config.model)) {
      issues.push(`Model "${config.model}" is not supported. Supported models: ${this.supportedModels.join(', ')}`);
    }

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
          model: config.model || 'mistral-medium',
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
