// example-new-architecture.js

/**
 * Пример использования новой архитектуры Playwright AI Auto-Debug
 * 
 * Демонстрирует:
 * - Clean Architecture с Domain-Driven Design
 * - Dependency Injection контейнер
 * - Use Cases для бизнес-логики
 * - Rich domain entities
 * - Strategy Pattern для AI провайдеров
 */

import { CliApplication } from './src/presentation/cli/CliApplication.js';
import { getContainer } from './src/infrastructure/di/bindings.js';

async function demonstrateNewArchitecture() {
  console.log('🏗️  Демонстрация новой архитектуры Playwright AI Auto-Debug\n');
  
  try {
    // ===== 1. DEPENDENCY INJECTION =====
    console.log('1️⃣  Dependency Injection Container');
    console.log('─'.repeat(40));
    
    const container = getContainer();
    const info = container.getRegistrationInfo();
    
    console.log(`📦 Зарегистрированных зависимостей: ${info.bindings.length}`);
    console.log(`🔄 Singleton экземпляров: ${info.singletons.length}`);
    console.log(`📋 Константы: ${info.instances.length}`);
    console.log('✅ DI контейнер инициализирован\n');

    // ===== 2. DOMAIN ENTITIES =====
    console.log('2️⃣  Domain Entities');
    console.log('─'.repeat(40));
    
    const { TestError } = await import('./src/domain/entities/TestError.js');
    const { AIResponse } = await import('./src/domain/entities/AIResponse.js');
    
    // Создаем доменную сущность ошибки теста
    const testError = new TestError(
      'tests/login.spec.js',
      'Error: expect(received).toBe(expected)',
      'assertion_error',
      'Login should work'
    );
    
    console.log(`📄 TestError ID: ${testError.id}`);
    console.log(`🔍 Error Type: ${testError.errorType}`);
    console.log(`⚡ Severity: ${testError.severity}`);
    console.log(`🏷️  Keywords: ${testError.keywords.join(', ')}`);
    
    // Создаем ответ ИИ
    const aiResponse = new AIResponse(
      'The test is failing because the login button selector is incorrect...',
      testError,
      { provider: 'mistral', confidence: 0.85 }
    );
    
    console.log(`🤖 AIResponse ID: ${aiResponse.id}`);
    console.log(`🎯 Confidence: ${aiResponse.confidence}`);
    console.log(`🎬 Actions: ${aiResponse.actions.length}`);
    console.log(`💡 Recommendations: ${aiResponse.recommendations.length}`);
    console.log('✅ Domain entities работают корректно\n');

    // ===== 3. USE CASES =====
    console.log('3️⃣  Use Cases');
    console.log('─'.repeat(40));
    
    try {
      const analyzeTestErrorsUseCase = await container.get('analyzeTestErrorsUseCase');
      console.log('✅ AnalyzeTestErrorsUseCase загружен');
      
      const testDebugService = await container.get('testDebugService');
      console.log('✅ TestDebugService загружен');
      
      try {
        const serviceInfo = testDebugService.getServiceInfo();
        console.log(`📋 Service: ${serviceInfo.name} v${serviceInfo.version}`);
        console.log(`🏗️  Architecture: ${serviceInfo.architecture}`);
        console.log(`🎯 Patterns: ${serviceInfo.patterns.join(', ')}`);
      } catch (error) {
        console.log(`⚠️  Service info: ${error.message}`);
      }
      
      // Health check
      try {
        const health = await testDebugService.healthCheck();
        console.log(`💚 Health Status: ${health.status.toUpperCase()}`);
      } catch (error) {
        console.log(`⚠️  Health check: ${error.message}`);
      }
      console.log('✅ Use Cases инициализированы\n');
      
    } catch (error) {
      console.log(`⚠️  Use Cases: ${error.message}\n`);
    }

    // ===== 4. AI PROVIDERS =====
    console.log('4️⃣  AI Providers (Strategy Pattern)');
    console.log('─'.repeat(40));
    
    try {
      const aiProvider = await container.get('aiProvider');
      console.log(`🤖 Provider: ${aiProvider.getProviderName()}`);
      console.log(`🧠 Models: ${aiProvider.getSupportedModels().join(', ')}`);
      
      const validation = await aiProvider.validateConfiguration({ api_key: 'test' });
      console.log(`🔑 Config Valid: ${validation.isValid}`);
      console.log('✅ AI Provider готов к работе\n');
      
    } catch (error) {
      console.log(`⚠️  AI Provider: ${error.message}\n`);
    }

    // ===== 5. CLI APPLICATION =====
    console.log('5️⃣  CLI Application');
    console.log('─'.repeat(40));
    
    const app = new CliApplication(container);
    console.log('✅ CLI Application инициализировано');
    
    // Показываем справку
    console.log('\n📖 Доступные команды:');
    app.showGeneralHelp();

    // ===== 6. АРХИТЕКТУРНЫЕ ПРЕИМУЩЕСТВА =====
    console.log('\n🎉 Архитектурные преимущества новой системы:');
    console.log('─'.repeat(50));
    
    const benefits = [
      '🔧 Модульность: каждый компонент имеет единственную ответственность',
      '🔄 Тестируемость: все зависимости инъектируются, легко мокается',
      '📦 Расширяемость: новые AI провайдеры добавляются без изменения кода',
      '🎯 Читаемость: четкое разделение по слоям (Domain, Application, Infrastructure)',
      '⚡ Производительность: singleton зависимости, ленивая инициализация',
      '🛡️  Надежность: строгая типизация, валидация на всех уровнях',
      '🔀 Гибкость: легко менять реализации через DI',
      '📊 Мониторинг: встроенные health checks и метрики'
    ];
    
    benefits.forEach(benefit => console.log(`  ${benefit}`));

    console.log('\n🚀 Новая архитектура готова к использованию!');
    console.log('💡 Запустите: node src/main.js --help');
    
    // Очистка
    await app.dispose();
    
  } catch (error) {
    console.error('❌ Ошибка демонстрации:', error.message);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
  }
}

// Запускаем демонстрацию
demonstrateNewArchitecture().catch(console.error); 