# ⚙️ Configuration Guide

**Подробное руководство по настройке playwright-ai-auto-debug**

## 📋 Обзор конфигурации

Плагин поддерживает три способа конфигурации:

1. **`ai.conf.js`** - JavaScript конфигурация (рекомендуется)
2. **`ai.conf.ts`** - TypeScript конфигурация с типизацией
3. **`.env`** - переменные окружения (базовая настройка)

> ⚠️ **Приоритет**: `ai.conf.ts` > `ai.conf.js` > `.env`

## 🔧 Полная конфигурация

### JavaScript конфигурация

```javascript
// ai.conf.js
export const ai_conf = {
  // ===== ОБЯЗАТЕЛЬНЫЕ ПАРАМЕТРЫ =====
  
  api_key: 'your-api-key-here',                    // API ключ для AI сервиса
  
  // ===== AI НАСТРОЙКИ =====
  
  ai_server: 'https://api.mistral.ai',             // URL AI сервера
  model: 'mistral-medium',                         // Модель AI
  max_prompt_length: 2000,                         // Максимальная длина промпта
  request_delay: 2000,                             // Задержка между запросами (мс)
  
  // ===== ФАЙЛЫ И ПАПКИ =====
  
  results_dir: 'test-results',                     // Папка с результатами тестов
  report_dir: 'playwright-report',                 // Папка с HTML отчетами
  ai_responses_dir: 'ai-responses',                // Папка для сохранения AI ответов
  
  // ===== ПОИСК ОШИБОК =====
  
  error_file_patterns: [                           // Паттерны файлов ошибок
    'copy-prompt.txt',
    'error-context.md',
    'error.txt',
    'test-error.md',
    '*-error.txt',
    '*-error.md'
  ],
  
  // ===== ALLURE ИНТЕГРАЦИЯ =====
  
  allure_integration: true,                        // Включить Allure интеграцию
  allure_results_dir: 'allure-results',           // Папка результатов Allure
  
  // ===== MCP ИНТЕГРАЦИЯ =====
  
  mcp_integration: true,                           // Включить MCP
  mcp_ws_host: 'localhost',                        // Хост MCP сервера
  mcp_ws_port: 3001,                              // Порт MCP сервера
  mcp_timeout: 30000,                             // Таймаут MCP (мс)
  mcp_retry_attempts: 3,                          // Попытки подключения
  mcp_retry_delay: 1000,                          // Задержка между попытками
  
  // ===== ДОПОЛНИТЕЛЬНЫЕ НАСТРОЙКИ =====
  
  save_ai_responses: true,                         // Сохранять AI ответы в файлы
  debug_mode: false,                              // Режим отладки
  concurrent_requests: 1,                         // Одновременные запросы к AI
  
  // ===== КАСТОМНЫЕ AI СООБЩЕНИЯ =====
  
  messages: [
    {
      role: 'system',
      content: 'Ты AI помощник по отладке Playwright тестов. Анализируй ошибки и предлагай конкретные решения на русском языке.'
    },
    {
      role: 'system',
      content: 'При анализе учитывай специфику проекта: используем React, TypeScript и тестируем e-commerce функциональность.'
    }
  ]
};
```

### TypeScript конфигурация

```typescript
// ai.conf.ts
import type { AiConfig } from 'playwright-ai-auto-debug';

export const ai_conf: AiConfig = {
  // Обязательные параметры
  api_key: process.env.API_KEY || 'your-api-key-here',
  
  // AI настройки
  ai_server: 'https://api.mistral.ai',
  model: 'mistral-medium',
  max_prompt_length: 2000,
  request_delay: 2000,
  
  // Файлы и папки
  results_dir: 'test-results',
  report_dir: 'playwright-report',
  ai_responses_dir: 'ai-responses',
  
  // Поиск ошибок
  error_file_patterns: [
    'copy-prompt.txt',
    'error-context.md',
    '*-error.txt'
  ],
  
  // Allure интеграция
  allure_integration: true,
  allure_results_dir: 'allure-results',
  
  // MCP интеграция
  mcp_integration: true,
  mcp_ws_host: 'localhost',
  mcp_ws_port: 3001,
  mcp_timeout: 30000,
  
  // Дополнительные настройки
  save_ai_responses: true,
  debug_mode: false,
  
  // Кастомные сообщения
  messages: [
    {
      role: 'system',
      content: 'You are an AI assistant for debugging Playwright tests. Provide specific solutions with code examples.'
    }
  ]
};
```

## 📊 Детальное описание параметров

### Обязательные параметры

| Параметр | Тип | Описание | Пример |
|----------|-----|----------|--------|
| `api_key` | string | API ключ для AI сервиса | `'sk-abc123...'` |

### AI настройки

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| `ai_server` | string | `'https://api.mistral.ai'` | URL AI сервера |
| `model` | string | `'mistral-medium'` | Модель AI для анализа |
| `max_prompt_length` | number | `2000` | Максимальная длина промпта |
| `request_delay` | number | `2000` | Задержка между запросами (мс) |
| `concurrent_requests` | number | `1` | Одновременные запросы |

### Файлы и папки

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| `results_dir` | string | `'test-results'` | Папка с результатами тестов |
| `report_dir` | string | `'playwright-report'` | Папка с HTML отчетами |
| `ai_responses_dir` | string | `'ai-responses'` | Папка для AI ответов |

### Поиск ошибок

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| `error_file_patterns` | array | См. ниже | Паттерны файлов ошибок |

**Стандартные паттерны**:
```javascript
error_file_patterns: [
  'copy-prompt.txt',      // Стандартные файлы Playwright
  'error-context.md',     // Расширенный формат с контекстом
  'error.txt',            // Простые текстовые файлы
  'test-error.md',        // Markdown файлы с ошибками
  '*-error.txt',          // Любые файлы, заканчивающиеся на -error.txt
  '*-error.md'            // Любые файлы, заканчивающиеся на -error.md
]
```

### Allure интеграция

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| `allure_integration` | boolean | `false` | Включить Allure интеграцию |
| `allure_results_dir` | string | `'allure-results'` | Папка результатов Allure |

### MCP интеграция

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| `mcp_integration` | boolean | `false` | Включить MCP |
| `mcp_ws_host` | string | `'localhost'` | Хост MCP сервера |
| `mcp_ws_port` | number | `3001` | Порт MCP сервера |
| `mcp_timeout` | number | `30000` | Таймаут MCP (мс) |
| `mcp_retry_attempts` | number | `3` | Попытки подключения |
| `mcp_retry_delay` | number | `1000` | Задержка между попытками |

### Дополнительные настройки

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| `save_ai_responses` | boolean | `false` | Сохранять AI ответы в файлы |
| `debug_mode` | boolean | `false` | Режим отладки |

## 🎯 Специализированные конфигурации

### Для больших проектов

```javascript
// ai.conf.js - оптимизация для больших проектов
export const ai_conf = {
  api_key: 'your-key',
  
  // Увеличенные лимиты
  max_prompt_length: 4000,
  request_delay: 3000,
  concurrent_requests: 2,
  
  // Фильтрация ошибок
  error_file_patterns: [
    'critical-*-error.txt',  // Только критичные ошибки
    'regression-*.md'        // Только регрессии
  ],
  
  // Оптимизация MCP
  mcp_timeout: 60000,        // Увеличенный таймаут
  mcp_snapshot_options: {
    maxElements: 500,        // Ограничение элементов
    includeInvisible: false  // Исключить скрытые элементы
  }
};
```

### Для CI/CD pipeline

```javascript
// ai.conf.js - настройки для CI/CD
export const ai_conf = {
  api_key: process.env.MISTRAL_API_KEY,
  
  // Ускоренный режим
  request_delay: 1000,
  max_prompt_length: 1500,
  concurrent_requests: 3,
  
  // Без MCP в CI (для скорости)
  mcp_integration: false,
  
  // Сохранение результатов
  save_ai_responses: true,
  ai_responses_dir: 'ci-ai-responses',
  
  // Allure для отчетности
  allure_integration: true,
  allure_results_dir: 'allure-results'
};
```

### Для разработки и отладки

```javascript
// ai.conf.js - настройки для разработки
export const ai_conf = {
  api_key: 'your-dev-key',
  
  // Отладочный режим
  debug_mode: true,
  save_ai_responses: true,
  
  // Подробные логи MCP
  mcp_integration: true,
  mcp_debug: true,
  mcp_log_level: 'debug',
  
  // Кастомные сообщения для отладки
  messages: [
    {
      role: 'system',
      content: 'Ты AI помощник для отладки. Будь максимально подробным в объяснениях и предлагай несколько вариантов решения.'
    },
    {
      role: 'system',
      content: 'Это development окружение. Добавляй debug информацию и логирование в предлагаемые решения.'
    }
  ]
};
```

## 🔐 Безопасность конфигурации

### Защита API ключей

```bash
# .gitignore
ai.conf.js
ai.conf.ts
.env
*.key
```

### Использование переменных окружения

```javascript
// ai.conf.js - безопасная конфигурация
export const ai_conf = {
  // Используем переменные окружения
  api_key: process.env.AI_API_KEY,
  
  // Проверка наличия ключа
  validate() {
    if (!this.api_key) {
      throw new Error('AI_API_KEY environment variable is required');
    }
  }
};
```

### Конфигурация для разных окружений

```javascript
// ai.conf.js - мульти-окружение
const environment = process.env.NODE_ENV || 'development';

const baseConfig = {
  api_key: process.env.AI_API_KEY,
  results_dir: 'test-results',
  allure_integration: true
};

const environmentConfigs = {
  development: {
    ...baseConfig,
    debug_mode: true,
    request_delay: 3000,
    mcp_integration: true,
    save_ai_responses: true
  },
  
  staging: {
    ...baseConfig,
    request_delay: 2000,
    mcp_integration: true,
    max_prompt_length: 3000
  },
  
  production: {
    ...baseConfig,
    request_delay: 1000,
    mcp_integration: false,  // Отключаем MCP в prod для скорости
    max_prompt_length: 1500,
    concurrent_requests: 3
  }
};

export const ai_conf = environmentConfigs[environment];
```

## 🤖 Настройка AI провайдеров

### Mistral AI (рекомендуется)

```javascript
export const ai_conf = {
  api_key: 'your-mistral-key',
  ai_server: 'https://api.mistral.ai',
  model: 'mistral-medium',  // или 'mistral-large', 'mistral-small'
  
  // Mistral-специфичные настройки
  temperature: 0.3,         // Креативность ответов (0-1)
  top_p: 0.9,              // Nucleus sampling
  max_tokens: 1000         // Максимум токенов в ответе
};
```

### OpenAI GPT

```javascript
export const ai_conf = {
  api_key: 'sk-your-openai-key',
  ai_server: 'https://api.openai.com',
  model: 'gpt-4',          // или 'gpt-3.5-turbo'
  
  // OpenAI-специфичные настройки
  temperature: 0.2,
  max_tokens: 1500,
  presence_penalty: 0.1,
  frequency_penalty: 0.1
};
```

### Anthropic Claude

```javascript
export const ai_conf = {
  api_key: 'sk-ant-your-claude-key',
  ai_server: 'https://api.anthropic.com',
  model: 'claude-3-sonnet-20240229',
  
  // Claude-специфичные настройки
  max_tokens: 2000,
  temperature: 0.3
};
```

## 📸 MCP конфигурация

### Базовые настройки MCP

```javascript
export const ai_conf = {
  api_key: 'your-key',
  
  // Включение MCP
  mcp_integration: true,
  mcp_ws_host: 'localhost',
  mcp_ws_port: 3001,
  mcp_timeout: 30000,
  
  // Формат snapshot'ов
  mcp_snapshot_format: 'accessibility', // 'full', 'interactive', 'accessibility'
  
  // Опции snapshot'ов
  mcp_snapshot_options: {
    includeInvisible: false,           // Включать невидимые элементы
    maxDepth: 10,                      // Максимальная глубина DOM
    includeStyles: true,               // Включать CSS стили
    includeAttributes: [               // Какие атрибуты включать
      'id', 'class', 'data-testid', 'aria-label', 'role'
    ]
  }
};
```

### Продвинутые MCP настройки

```javascript
export const ai_conf = {
  api_key: 'your-key',
  mcp_integration: true,
  
  // Фильтрация элементов
  mcp_element_filters: {
    excludeTagNames: ['script', 'style', 'meta', 'link'],
    includeInteractive: true,          // Только интерактивные элементы
    minTextLength: 3,                  // Минимальная длина текста
    maxElements: 300,                  // Максимум элементов в snapshot
    excludeHidden: true                // Исключить скрытые элементы
  },
  
  // Кэширование snapshot'ов
  mcp_cache_enabled: true,
  mcp_cache_ttl: 60000,               // Время жизни кэша (мс)
  
  // Обработка ошибок MCP
  mcp_fallback_enabled: true,         // Продолжить без MCP при ошибках
  mcp_error_threshold: 3              // Максимум ошибок MCP подряд
};
```

## 📊 Конфигурация отчетности

### HTML отчеты

```javascript
export const ai_conf = {
  api_key: 'your-key',
  
  // HTML отчеты
  report_dir: 'playwright-report',
  html_injection_enabled: true,       // Встраивать AI блоки в HTML
  html_style_customization: {
    theme: 'dark',                    // 'light', 'dark', 'auto'
    accentColor: '#ff6b35',          // Цвет акцента
    fontSize: '14px'                 // Размер шрифта
  }
};
```

### Allure отчеты

```javascript
export const ai_conf = {
  api_key: 'your-key',
  
  // Allure интеграция
  allure_integration: true,
  allure_results_dir: 'allure-results',
  allure_attachment_format: 'markdown', // 'markdown', 'html', 'text'
  
  // Настройки вложений
  allure_attachment_options: {
    includeErrorDetails: true,        // Включать детали ошибки
    includeAiMetadata: true,         // Включать метаданные AI
    maxAttachmentSize: 50000,        // Максимальный размер вложения
    compressLargeAttachments: true   // Сжимать большие вложения
  },
  
  // Фильтрация тестов
  allure_test_filters: {
    onlyFailedTests: true,           // Только упавшие тесты
    excludeSkippedTests: true,       // Исключить пропущенные
    minErrorLength: 50               // Минимальная длина ошибки
  }
};
```

### Markdown отчеты

```javascript
export const ai_conf = {
  api_key: 'your-key',
  
  // Сохранение AI ответов
  save_ai_responses: true,
  ai_responses_dir: 'ai-responses',
  
  // Формат markdown файлов
  markdown_format: {
    includeTimestamp: true,          // Включать временные метки
    includeErrorContext: true,       // Включать контекст ошибки
    includeAiMetadata: true,         // Включать метаданные AI
    templatePath: './custom-template.md' // Кастомный шаблон
  }
};
```

## 🎨 Кастомизация AI сообщений

### Системные промпты

```javascript
export const ai_conf = {
  api_key: 'your-key',
  
  messages: [
    {
      role: 'system',
      content: `Ты эксперт по отладке Playwright тестов. 
      
      ТВОЯ ЗАДАЧА:
      1. Проанализировать ошибку теста
      2. Определить точную причину падения
      3. Предложить конкретное решение с примером кода
      4. Объяснить, почему это решение работает
      
      ФОРМАТ ОТВЕТА:
      - Начни с краткого описания проблемы
      - Предложи конкретное решение
      - Приведи пример исправленного кода
      - Добавь дополнительные рекомендации если нужно
      
      СТИЛЬ:
      - Будь конкретным и практичным
      - Используй примеры кода
      - Объясняй сложные концепции простым языком`
    },
    {
      role: 'system',
      content: `КОНТЕКСТ ПРОЕКТА:
      - Используем React + TypeScript
      - Тестируем e-commerce приложение
      - Основные страницы: login, catalog, checkout, profile
      - Используем data-testid атрибуты для селекторов
      - API эндпоинты: /api/auth, /api/products, /api/orders`
    }
  ]
};
```

### Специализированные промпты

```javascript
// Для разных типов ошибок
export const ai_conf = {
  api_key: 'your-key',
  
  // Кастомные промпты по типам ошибок
  custom_prompts: {
    selector_error: `Анализируй проблемы с селекторами. 
                    Предлагай альтернативные селекторы и объясняй их преимущества.`,
    
    timeout_error: `Фокусируйся на проблемах таймаутов. 
                   Предлагай оптимальные стратегии ожидания.`,
    
    assertion_error: `Анализируй логику тестов и предлагай 
                     улучшения в проверках и assertions.`
  }
};
```

## 🔄 Динамическая конфигурация

### Конфигурация через функции

```javascript
// ai.conf.js - динамическая конфигурация
export const ai_conf = {
  // Базовые настройки
  api_key: process.env.AI_API_KEY,
  
  // Динамические настройки
  getRequestDelay() {
    const hour = new Date().getHours();
    // Увеличиваем задержку в рабочие часы
    return (hour >= 9 && hour <= 18) ? 3000 : 1000;
  },
  
  getModel() {
    const isProduction = process.env.NODE_ENV === 'production';
    return isProduction ? 'mistral-medium' : 'mistral-large';
  },
  
  // Условные настройки
  getMcpConfig() {
    return {
      mcp_integration: process.env.ENABLE_MCP === 'true',
      mcp_ws_port: parseInt(process.env.MCP_PORT) || 3001
    };
  }
};
```

### Конфигурация по проектам

```javascript
// ai.conf.js - настройки для разных проектов
const projectConfigs = {
  'e-commerce': {
    messages: [
      { role: 'system', content: 'Специализируйся на e-commerce тестах' }
    ],
    error_file_patterns: ['checkout-*-error.txt', 'payment-*.md']
  },
  
  'admin-panel': {
    messages: [
      { role: 'system', content: 'Фокусируйся на админ-панели и формах' }
    ],
    error_file_patterns: ['admin-*-error.txt', 'form-*.md']
  }
};

const projectType = process.env.PROJECT_TYPE || 'e-commerce';

export const ai_conf = {
  api_key: process.env.AI_API_KEY,
  ...projectConfigs[projectType]
};
```

## 🧪 Валидация конфигурации

### Встроенная валидация

```javascript
// ai.conf.js с валидацией
export const ai_conf = {
  api_key: process.env.AI_API_KEY,
  
  // Функция валидации
  validate() {
    const errors = [];
    
    if (!this.api_key) {
      errors.push('API ключ обязателен');
    }
    
    if (this.request_delay < 1000) {
      errors.push('request_delay должен быть >= 1000ms для избежания rate limiting');
    }
    
    if (this.mcp_integration && !this.mcp_ws_port) {
      errors.push('mcp_ws_port обязателен при включенной MCP интеграции');
    }
    
    if (errors.length > 0) {
      throw new Error(`Ошибки конфигурации:\n${errors.join('\n')}`);
    }
  }
};
```

### CLI валидация

```bash
# Проверка конфигурации
npx playwright-ai validate

# Информация о загруженной конфигурации
npx playwright-ai info
```

## 📊 Мониторинг конфигурации

### Отображение текущей конфигурации

```bash
# Показать загруженную конфигурацию и систему
npx playwright-ai info
```

### Health check конфигурации

```javascript
// Программная проверка конфигурации
import { getContainer } from './src/infrastructure/di/Container.js';

const container = getContainer();
const configLoader = container.get('configLoader');

const healthCheck = await configLoader.healthCheck();
console.log(`Config status: ${healthCheck.status}`);
console.log(`Issues: ${healthCheck.issues.join(', ')}`);
```

## 🔧 Миграция конфигурации

### Из старой версии (< 1.3.0)

```javascript
// Старая конфигурация в playwright.config.js
export default defineConfig({
  ai_conf: {
    api_key: 'key',
    model: 'mistral-medium'
  }
});

// ⬇️ Новая конфигурация в ai.conf.js
export const ai_conf = {
  api_key: 'key',
  model: 'mistral-medium'
};
```

### Автоматическая миграция

Создайте `ai.conf.js` вручную на основе примера из `ai.conf.example.js` в корне проекта.

## 🎯 Лучшие практики

### 1. Структура конфигурации
- ✅ Используйте отдельный `ai.conf.js` файл
- ✅ Добавьте конфигурацию в `.gitignore`
- ✅ Используйте переменные окружения для секретов
- ❌ Не храните API ключи в коде

### 2. Производительность
- ✅ Настройте `request_delay` под ваш API план
- ✅ Используйте `concurrent_requests` для ускорения
- ✅ Ограничивайте `max_prompt_length` для экономии токенов
- ❌ Не устанавливайте слишком малые задержки

### 3. MCP оптимизация
- ✅ Включайте MCP только для сложных UI тестов
- ✅ Используйте фильтры элементов для уменьшения данных
- ✅ Настройте таймауты под вашу инфраструктуру
- ❌ Не включайте MCP в CI без необходимости

### 4. Безопасность
- ✅ Используйте переменные окружения
- ✅ Валидируйте конфигурацию при запуске
- ✅ Ограничивайте доступ к конфигурационным файлам
- ❌ Не коммитьте API ключи в репозиторий

## 🚀 Примеры готовых конфигураций

### Минимальная конфигурация

```javascript
// ai.conf.js - минимум для старта
export const ai_conf = {
  api_key: process.env.AI_API_KEY
};
```

### Полная конфигурация

```javascript
// ai.conf.js - все возможности
export const ai_conf = {
  // Обязательные
  api_key: process.env.AI_API_KEY,
  
  // AI
  ai_server: 'https://api.mistral.ai',
  model: 'mistral-medium',
  max_prompt_length: 2000,
  request_delay: 2000,
  
  // Файлы
  results_dir: 'test-results',
  report_dir: 'playwright-report',
  ai_responses_dir: 'ai-responses',
  error_file_patterns: ['copy-prompt.txt', '*-error.md'],
  
  // Allure
  allure_integration: true,
  allure_results_dir: 'allure-results',
  
  // MCP
  mcp_integration: true,
  mcp_ws_host: 'localhost',
  mcp_ws_port: 3001,
  mcp_timeout: 30000,
  
  // Дополнительно
  save_ai_responses: true,
  debug_mode: false,
  
  // AI сообщения
  messages: [
    {
      role: 'system',
      content: 'Ты эксперт по Playwright тестам. Предлагай конкретные решения.'
    }
  ]
};
```

---

**⚙️ Правильная конфигурация - основа эффективной работы AI анализа**
