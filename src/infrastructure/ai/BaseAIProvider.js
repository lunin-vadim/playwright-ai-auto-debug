// src/infrastructure/ai/BaseAIProvider.js

/**
 * Базовый класс AI провайдера. Содержит общую логику для всех провайдеров.
 * Подклассы переопределяют generateResponse() и validateConfiguration().
 */
export class BaseAIProvider {
  constructor(providerName) {
    this.providerName = providerName;
  }

  /**
   * @param {string} prompt
   * @param {Object} config
   * @param {string|null} domSnapshot
   * @returns {Promise<string>}
   */
  async generateResponse(prompt, config, domSnapshot = null) {
    throw new Error(`${this.providerName}: generateResponse() must be implemented`);
  }

  /**
   * @param {Object} config
   * @returns {Promise<{isValid: boolean, issues: string[]}>}
   */
  async validateConfiguration(config) {
    throw new Error(`${this.providerName}: validateConfiguration() must be implemented`);
  }

  /**
   * Обрабатывает потоковый (SSE) ответ от AI API
   * @param {Response} response
   * @returns {Promise<string>}
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
              console.log('\n');
              return result.trim();
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                if (isFirstChunk) {
                  console.log('🤖 AI Response (streaming):');
                  console.log('─'.repeat(50));
                  isFirstChunk = false;
                }
                process.stdout.write(content);
                result += content;
              }
            } catch {
              // ignore individual chunk parse errors
            }
          }
        }
      }

      console.log('\n');

      if (!result.trim()) {
        throw new Error(`Empty response received from ${this.providerName} streaming API`);
      }

      return result.trim();
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Обрабатывает обычный (не потоковый) ответ от AI API
   * @param {Response} response
   * @returns {Promise<string>}
   */
  async handleRegularResponse(response) {
    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error(`No response choices returned from ${this.providerName} API`);
    }

    const content = data.choices[0].message?.content;
    if (!content) {
      throw new Error(`Empty response content from ${this.providerName} API`);
    }

    return content.trim();
  }

  /**
   * Строит текст промпта, добавляя DOM snapshot если он передан
   * @param {string} prompt
   * @param {string|null} domSnapshot
   * @returns {string}
   */
  buildPromptContent(prompt, domSnapshot) {
    if (!domSnapshot) return prompt;

    return (
      prompt +
      '\n\n## DOM Snapshot\n' +
      '```html\n' +
      domSnapshot +
      '\n```' +
      '\n\nИспользуй эту информацию о структуре DOM для более точного анализа селекторов и элементов страницы.'
    );
  }

  getProviderName() {
    return this.providerName;
  }

  getSupportedModels() {
    return null;
  }

  /**
   * Проверяет доступность API (стандартная реализация для облачных провайдеров)
   * @param {Object} config
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
