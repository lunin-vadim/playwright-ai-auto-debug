// src/main.js

import { CliApplication } from './presentation/cli/CliApplication.js';

/**
 * Главная точка входа в приложение
 * Использует Clean Architecture с Dependency Injection
 */
async function main() {
  try {
    console.log('🚀 Starting Playwright AI Auto-Debug (Clean Architecture Edition)');
    
    // Создаем CLI приложение
    const app = new CliApplication();
    
    // Получаем аргументы командной строки (исключая node и script)
    const args = process.argv.slice(2);
    
    // Запускаем приложение
    await app.run(args);
    
    // Очищаем ресурсы
    await app.dispose();
    
  } catch (error) {
    console.error('💥 Fatal error:', error.message);
    
    if (process.env.DEBUG) {
      console.error('Stack trace:', error.stack);
    }
    
    process.exit(1);
  }
}

// Обработка неперехваченных ошибок
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Graceful shutdown...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Graceful shutdown...');
  process.exit(0);
});

// Запускаем приложение
main().catch(error => {
  console.error('💥 Application startup failed:', error);
  process.exit(1);
}); 