import { readFile, access } from 'fs/promises';
import { join } from 'path';
import { pathToFileURL } from 'url';

/**
 * Загружает конфигурацию AI из playwright.config.js
 * @param {string} projectRoot - корневая папка проекта (по умолчанию текущая)
 * @returns {Promise<Object>} - конфигурация AI
 */
async function loadAiConfig(projectRoot = process.cwd()) {
  const configPath = join(projectRoot, 'playwright.config.js');
  
  try {
    // Проверяем существование файла
    await access(configPath);
    
    // Импортируем конфигурацию как ES модуль
    const configUrl = pathToFileURL(configPath).href;
    const configModule = await import(configUrl);
    const config = configModule.default || configModule;
    
    if (!config.ai_conf) {
      throw new Error('Секция ai_conf не найдена в playwright.config.js');
    }
    
    // Валидация обязательных полей
    const aiConfig = config.ai_conf;
    
    if (!aiConfig.api_key) {
      throw new Error('api_key обязателен в ai_conf');
    }
    
    // Устанавливаем значения по умолчанию
    const defaultConfig = {
      ai_server: 'https://api.mistral.ai',
      model: 'mistral-medium',
      results_dir: 'test-results',
      max_prompt_length: 2000,
      request_delay: 1000,
      error_file_patterns: [
        'copy-prompt.txt',      // Стандартный файл Playwright
        'error-context.md',     // Альтернативный формат
        'error.txt',            // Простой текстовый файл
        'test-error.md',        // Markdown с ошибкой
        '*-error.txt',          // Файлы заканчивающиеся на -error.txt
        '*-error.md'            // Файлы заканчивающиеся на -error.md
      ],
      messages: [
        {
          role: 'system',
          content: 'Ты AI помощник по отладке Playwright тестов. Анализируй ошибки и предлагай конкретные решения на русском языке. Отвечай кратко и по делу.'
        }
      ]
    };
    
    // Объединяем с пользовательской конфигурацией
    const finalConfig = {
      ...defaultConfig,
      ...aiConfig
    };
    
    console.log('✅ Конфигурация AI загружена из playwright.config.js');
    return finalConfig;
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`playwright.config.js не найден в ${projectRoot}`);
    }
    
    if (error.message.includes('ai_conf') || error.message.includes('api_key')) {
      throw error;
    }
    
    throw new Error(`Ошибка загрузки конфигурации: ${error.message}`);
  }
}

/**
 * Создает сообщения для AI API на основе конфигурации
 * @param {Object} config - конфигурация AI
 * @param {string} promptContent - содержимое ошибки
 * @returns {Array} - массив сообщений для API
 */
function buildMessages(config, promptContent) {
  const messages = [...config.messages];
  
  // Добавляем пользовательское сообщение с ошибкой
  messages.push({
    role: 'user',
    content: `Вот ошибка из Playwright теста:\n\n${promptContent}\n\nПредложи конкретное решение этой проблемы.`
  });
  
  return messages;
}

export { loadAiConfig, buildMessages }; 