// src/infrastructure/config/ConfigLoader.js

import fs from 'fs';
import path from 'path';

/**
 * Загрузчик конфигурации для новой архитектуры
 * Заменяет старый lib/config.js
 */
export class ConfigLoader {
  constructor() {
    this.configCache = null;
  }

  /**
   * Загружает конфигурацию AI
   * @returns {Promise<Object>}
   */
  async loadAiConfig() {
    if (this.configCache) {
      return this.configCache;
    }

    try {
      // Ищем файл конфигурации
      const configPath = this.findConfigFile();
      
      if (!configPath) {
        return this.getDefaultConfig();
      }

      // Загружаем конфигурацию
      const config = await this.loadConfigFromFile(configPath);
      
      // Валидируем и обогащаем
      this.configCache = this.enrichConfig(config);
      
      return this.configCache;
      
    } catch (error) {
      console.warn('⚠️  Config loading error:', error.message);
      return this.getDefaultConfig();
    }
  }

  /**
   * Ищет файл конфигурации
   * @returns {string|null}
   */
  findConfigFile() {
    const possiblePaths = [
      path.resolve(process.cwd(), 'ai.conf.js'),
      path.resolve(process.cwd(), 'ai.conf.mjs'),
      path.resolve(process.cwd(), 'ai.config.js'),
      path.resolve(process.cwd(), 'ai.config.mjs')
    ];

    for (const configPath of possiblePaths) {
      if (fs.existsSync(configPath)) {
        return configPath;
      }
    }

    return null;
  }

  /**
   * Загружает конфигурацию из файла
   * @param {string} configPath 
   * @returns {Promise<Object>}
   */
  async loadConfigFromFile(configPath) {
    try {
      // Используем динамический импорт для ES модулей
      const configModule = await import(`file://${configPath}`);
      
      // Поддерживаем разные форматы экспорта:
      // export default { ... }
      // export const ai_conf = { ... }
      // module.exports = { ... }
      return configModule.default || configModule.ai_conf || configModule;
    } catch (error) {
      // Fallback для CommonJS
      try {
        delete require.cache[require.resolve(configPath)];
        const config = require(configPath);
        return config.ai_conf || config;
      } catch (fallbackError) {
        throw new Error(`Failed to load config from ${configPath}: ${error.message}`);
      }
    }
  }

  /**
   * Обогащает конфигурацию значениями по умолчанию
   * @param {Object} config 
   * @returns {Object}
   */
  enrichConfig(config) {
    const defaultConfig = this.getDefaultConfig();
    
    return {
      ...defaultConfig,
      ...config,
      // Переопределяем API ключ из переменных окружения
      api_key: config.api_key || process.env.API_KEY,
      // Обеспечиваем наличие обязательных полей
      results_dir: config.results_dir || defaultConfig.results_dir,
      error_file_patterns: config.error_file_patterns || defaultConfig.error_file_patterns
    };
  }

  /**
   * Возвращает конфигурацию по умолчанию
   * @returns {Object}
   */
  getDefaultConfig() {
    return {
      api_key: process.env.API_KEY,
      ai_server: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-3.5-turbo',
      allure_integration: false,
      mcp_integration: false,
      results_dir: 'test-results',
      error_file_patterns: [
        '**/error-context.md',
        'copy-prompt.txt',
        'error.txt',
        'test-error.md',
        '*-error.txt',
        '*-error.md'
      ],
      max_tokens: 4000,
      temperature: 0.1,
      timeout: 30000
    };
  }

  /**
   * Проверяет валидность конфигурации
   * @param {Object} config 
   * @returns {Object}
   */
  validateConfig(config) {
    const issues = [];

    if (!config.api_key) {
      issues.push('API key is missing');
    }

    if (config.api_key === 'your-api-key-here') {
      issues.push('API key is using placeholder value');
    }

    if (!config.ai_server) {
      issues.push('AI server URL is missing');
    }

    if (!config.model) {
      issues.push('AI model is not specified');
    }

    return {
      isValid: issues.length === 0,
      issues,
      config
    };
  }

  /**
   * Очищает кеш конфигурации
   */
  clearCache() {
    this.configCache = null;
  }
}

// Экспортируем функцию для совместимости со старым API
export async function loadAiConfig() {
  const loader = new ConfigLoader();
  return await loader.loadAiConfig();
} 