// src/infrastructure/ai/LocalAIProvider.js

import { BaseAIProvider } from './BaseAIProvider.js';

/**
 * Провайдер для локальных AI серверов: LM Studio, Ollama, LocalAI и др.
 */
export class LocalAIProvider extends BaseAIProvider {
  constructor() {
    super('Local AI');
  }

  async generateResponse(prompt, config, domSnapshot = null) {
    const requestBody = {
      model: config.model || 'auto',
      messages: [
        ...(config.messages || []),
        { role: 'user', content: this.buildPromptContent(prompt, domSnapshot) }
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
          ...(config.api_key ? { 'Authorization': `Bearer ${config.api_key}` } : {})
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Local AI server error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      if (config.stream) {
        return await this.handleStreamResponse(response);
      }

      return await this.handleRegularResponse(response);
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(`Network error: Unable to connect to local AI server at ${config.ai_server}. Make sure the server is running.`);
      }
      throw error;
    }
  }

  async validateConfiguration(config) {
    const issues = [];

    if (!config.ai_server) {
      issues.push('AI server URL is required');
    } else {
      try {
        const url = new URL(config.ai_server);
        const isLocal =
          ['localhost', '127.0.0.1'].includes(url.hostname) ||
          url.hostname.startsWith('192.168.') ||
          url.hostname.startsWith('10.') ||
          url.hostname.startsWith('172.');
        if (!isLocal) {
          console.warn(`⚠️  Server ${url.hostname} doesn't appear to be local. Make sure it's accessible.`);
        }
      } catch {
        issues.push('Invalid AI server URL format');
      }
    }

    if (!config.model) issues.push('Model is required');

    return { isValid: issues.length === 0, issues };
  }

  async checkApiAvailability(config) {
    try {
      const response = await fetch(config.ai_server, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.api_key ? { 'Authorization': `Bearer ${config.api_key}` } : {})
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
