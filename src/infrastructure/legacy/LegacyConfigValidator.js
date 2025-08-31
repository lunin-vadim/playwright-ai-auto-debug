// src/infrastructure/legacy/LegacyConfigValidator.js

import { ConfigLoader } from '../config/ConfigLoader.js';

/**
 * Валидация конфигурации (временная реализация для совместимости)
 */
export async function validateConfiguration() {
  try {
    console.log('🔧 Loading configuration...');
    
    const configLoader = new ConfigLoader();
    const config = await configLoader.loadAiConfig();
    
    console.log('✅ Configuration loaded successfully');
    console.log(`🤖 AI Provider: ${getProviderName(config.ai_server)}`);
    console.log(`📡 Server: ${config.ai_server}`);
    console.log(`🎯 Model: ${config.model}`);
    
    // Валидация конфигурации
    const validation = configLoader.validateConfig(config);
    
    if (validation.isValid) {
      console.log('✅ Configuration is valid');
      
      // Дополнительные проверки
      await checkApiConnection(config);
      
      console.log('🎉 All checks passed!');
      return { success: true, config, issues: [] };
    } else {
      console.log('❌ Configuration validation failed:');
      validation.issues.forEach(issue => {
        console.log(`   • ${issue}`);
      });
      
      return { success: false, config, issues: validation.issues };
    }
    
  } catch (error) {
    console.error('❌ Configuration validation error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Определяет имя провайдера по URL сервера
 * @param {string} serverUrl 
 * @returns {string}
 */
function getProviderName(serverUrl) {
  if (serverUrl.includes('api.openai.com')) return 'OpenAI';
  if (serverUrl.includes('api.mistral.ai')) return 'Mistral';
  if (serverUrl.includes('localhost') || serverUrl.includes('127.0.0.1')) return 'Local AI';
  return 'Custom';
}

/**
 * Проверяет соединение с API
 * @param {Object} config 
 */
async function checkApiConnection(config) {
  console.log('🔍 Testing API connection...');
  
  try {
    // Импортируем нужный провайдер
    let Provider;
    const providerName = getProviderName(config.ai_server);
    
    switch (providerName) {
      case 'OpenAI':
        const { OpenAIProvider } = await import('../ai/OpenAIProvider.js');
        Provider = OpenAIProvider;
        break;
      case 'Mistral':
        const { MistralProvider } = await import('../ai/MistralProvider.js');
        Provider = MistralProvider;
        break;
      case 'Local AI':
        const { LocalAIProvider } = await import('../ai/LocalAIProvider.js');
        Provider = LocalAIProvider;
        break;
      default:
        console.log('⚠️  Unknown provider, skipping API test');
        return;
    }
    
    const provider = new Provider();
    
    // Проверяем доступность API если метод существует
    if (typeof provider.checkApiAvailability === 'function') {
      const isAvailable = await provider.checkApiAvailability(config);
      if (isAvailable) {
        console.log('✅ API connection successful');
      } else {
        console.log('⚠️  API connection failed (check credentials)');
      }
    } else {
      console.log('ℹ️  API availability check not implemented for this provider');
    }
    
  } catch (error) {
    console.log(`⚠️  API connection test failed: ${error.message}`);
  }
}
