// src/domain/repositories/IAIProvider.js

/**
 * Интерфейс AI провайдера
 * Определяет контракт для всех AI провайдеров (Mistral, OpenAI, Claude)
 */
export class IAIProvider {
  /**
   * Генерирует ответ ИИ на основе промпта
   * @param {string} prompt - текст ошибки для анализа
   * @param {Object} config - конфигурация провайдера
   * @param {Object} domSnapshot - опциональный DOM snapshot от MCP
   * @returns {Promise<string>} - ответ ИИ
   */
  async generateResponse(prompt, config, domSnapshot = null) {
    throw new Error('generateResponse must be implemented by concrete provider');
  }

  /**
   * Валидирует конфигурацию провайдера
   * @param {Object} config - конфигурация для проверки
   * @returns {Promise<Object>} - результат валидации
   */
  async validateConfiguration(config) {
    throw new Error('validateConfiguration must be implemented by concrete provider');
  }

  /**
   * Возвращает имя провайдера
   * @returns {string}
   */
  getProviderName() {
    throw new Error('getProviderName must be implemented by concrete provider');
  }

  /**
   * Возвращает поддерживаемые модели
   * @returns {string[]}
   */
  getSupportedModels() {
    throw new Error('getSupportedModels must be implemented by concrete provider');
  }

  /**
   * Проверяет доступность API
   * @param {Object} config - конфигурация провайдера
   * @returns {Promise<boolean>}
   */
  async checkApiAvailability(config) {
    throw new Error('checkApiAvailability must be implemented by concrete provider');
  }

  /**
   * Возвращает лимиты провайдера (tokens, requests per minute)
   * @returns {Object}
   */
  getLimits() {
    return {
      maxTokens: 4096,
      requestsPerMinute: 60,
      maxPromptLength: 8000
    };
  }

  /**
   * Подготавливает промпт с учетом особенностей провайдера
   * @param {string} prompt - исходный промпт
   * @param {Object} domSnapshot - DOM snapshot
   * @returns {string} - обработанный промпт
   */
  preparePrompt(prompt, domSnapshot = null) {
    let preparedPrompt = prompt;
    
    if (domSnapshot) {
      preparedPrompt += `\n\n📸 DOM Snapshot:\n${JSON.stringify(domSnapshot, null, 2)}`;
    }
    
    return preparedPrompt;
  }

  /**
   * Обрабатывает ответ провайдера
   * @param {string} rawResponse - сырой ответ от API
   * @returns {string} - обработанный ответ
   */
  processResponse(rawResponse) {
    return rawResponse.trim();
  }
} 