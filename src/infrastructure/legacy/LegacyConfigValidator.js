// src/infrastructure/legacy/LegacyConfigValidator.js

/**
 * Временная заглушка для старого модуля configValidator
 * TODO: Реализовать новый ConfigValidator в рамках Clean Architecture
 */

export async function validateConfiguration() {
  console.log('🔍 Configuration Validator');
  console.log('─'.repeat(40));
  console.log('⚠️  This is a temporary implementation');
  console.log('🔄 The full config validator will be implemented in the new architecture');
  console.log('');
  
  // Простая проверка наличия файла конфигурации
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    const configPath = path.resolve(process.cwd(), 'ai.conf.js');
    
    if (fs.existsSync(configPath)) {
      console.log('✅ ai.conf.js file found');
      
      // Проверяем API ключ
      if (process.env.API_KEY) {
        console.log('✅ API_KEY environment variable is set');
      } else {
        console.log('⚠️  API_KEY environment variable not found');
      }
      
      console.log('');
      console.log('📋 Basic validation passed');
      console.log('💡 For detailed validation, use the new architecture tools');
      
      return { valid: true, issues: [] };
    } else {
      console.log('❌ ai.conf.js file not found');
      console.log('💡 Run setup command to create configuration');
      
      return { valid: false, issues: ['Configuration file missing'] };
    }
    
  } catch (error) {
    console.error('❌ Validation error:', error.message);
    return { valid: false, issues: [error.message] };
  }
} 