// src/infrastructure/ai/MistralProvider.js

import { BaseAIProvider } from './BaseAIProvider.js';

export class MistralProvider extends BaseAIProvider {
  constructor() {
    super('Mistral');
  }

  async generateResponse(prompt, config, domSnapshot = null) {
    if (!config.api_key) {
      throw new Error('Mistral API key is required. Set API_KEY environment variable or configure api_key in ai.conf.js');
    }

    const requestBody = {
      model: config.model || 'mistral-medium',
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
          'Authorization': `Bearer ${config.api_key}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Mistral API error: ${response.status} ${response.statusText} - ${errorData.message || 'Unknown error'}`);
      }

      if (config.stream) {
        return await this.handleStreamResponse(response);
      }

      return await this.handleRegularResponse(response);
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(`Network error: Unable to connect to Mistral API. Check your internet connection and API endpoint: ${config.ai_server}`);
      }
      if (error.message.includes('Unexpected token') && error.message.includes('data:')) {
        throw new Error('Stream parsing error: Mistral API returned streaming data but stream handling failed. Try setting stream: false in configuration.');
      }
      throw error;
    }
  }

  async validateConfiguration(config) {
    const issues = [];

    if (!config.api_key) issues.push('API key is required');
    if (!config.ai_server) {
      issues.push('AI server URL is required');
    } else if (!config.ai_server.startsWith('https://')) {
      issues.push('AI server URL should use HTTPS');
    }
    if (!config.model) issues.push('Model is required');

    return { isValid: issues.length === 0, issues };
  }
}
