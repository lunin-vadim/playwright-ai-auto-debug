# 🆘 Troubleshooting Guide

**Руководство по решению типичных проблем с playwright-ai-auto-debug**

## 🔧 Проблемы установки

### ❌ Ошибка: "Module not found"

**Симптомы:**
```bash
Error: Cannot find module 'playwright-ai-auto-debug'
```

**Решения:**
```bash
# 1. Переустановите пакет
npm uninstall @playwright-ai/auto-debug
npm install @playwright-ai/auto-debug

# 2. Очистите кэш npm
npm cache clean --force

# 3. Проверьте package.json
cat package.json | grep playwright-ai
```

### ❌ Ошибка: "Unknown file extension .ts"

**Симптомы:**
```bash
TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".ts"
```

**Решения:**
```bash
# 1. Проверьте установку tsx
npm list tsx

# 2. Переустановите пакет (tsx включен в зависимости)
npm install @playwright-ai/auto-debug

# 3. Используйте JavaScript конфигурацию
mv ai.conf.ts ai.conf.js
```

## 🔑 Проблемы с API ключами

### ❌ Ошибка: "API key not found"

**Симптомы:**
```bash
❌ Error: API key is required
```

**Решения:**

1. **Проверьте конфигурацию:**
```bash
# Проверьте наличие файла
ls -la ai.conf.js ai.conf.ts .env

# Проверьте содержимое
cat ai.conf.js
```

2. **Создайте конфигурацию:**
```javascript
// ai.conf.js
export const ai_conf = {
  api_key: 'your-actual-api-key-here'
};
```

3. **Проверьте переменные окружения:**
```bash
echo $API_KEY
export API_KEY=your-api-key
```

### ❌ Ошибка 401: "Unauthorized"

**Симптомы:**
```bash
❌ AI request failed: 401 Unauthorized
```

**Решения:**
- ✅ Проверьте правильность API ключа
- ✅ Убедитесь, что ключ активен
- ✅ Проверьте права доступа к API
- ✅ Убедитесь в наличии средств на аккаунте

```javascript
// Проверка API ключа
export const ai_conf = {
  api_key: 'sk-...',  // Должен начинаться с правильного префикса
  ai_server: 'https://api.mistral.ai'  // Правильный URL сервера
};
```

### ❌ Ошибка 429: "Too Many Requests"

**Симптомы:**
```bash
❌ AI request failed: 429 Too Many Requests
```

**Решения:**

1. **Увеличьте задержку:**
```javascript
// ai.conf.js
export const ai_conf = {
  api_key: 'your-key',
  request_delay: 5000,  // Увеличьте до 5 секунд
  concurrent_requests: 1  // Только один запрос одновременно
};
```

2. **Проверьте лимиты API:**
```bash
# Для Mistral AI
curl -H "Authorization: Bearer your-key" https://api.mistral.ai/v1/models
```

3. **Обработайте меньше файлов:**
```javascript
export const ai_conf = {
  api_key: 'your-key',
  error_file_patterns: ['copy-prompt.txt'],  // Только основные файлы
  max_prompt_length: 1000  // Уменьшите размер промптов
};
```

## 📁 Проблемы с файлами

### ❌ "No error files found"

**Симптомы:**
```bash
📋 Found 0 error file(s)
```

**Решения:**

1. **Проверьте папку с результатами:**
```bash
# Посмотрите содержимое
ls -la test-results/
ls -la playwright-report/

# Найдите файлы ошибок
find . -name "copy-prompt.txt" -o -name "*error*"
```

2. **Настройте правильные пути:**
```javascript
// ai.conf.js
export const ai_conf = {
  api_key: 'your-key',
  results_dir: 'test-results',  // Проверьте правильность пути
  error_file_patterns: [
    'copy-prompt.txt',
    '**/*error*.txt',  // Рекурсивный поиск
    '**/*error*.md'
  ]
};
```

3. **Запустите тесты сначала:**
```bash
# Сначала запустите тесты (они должны упасть)
npx playwright test

# Затем анализ
npx playwright-ai
```

### ❌ "HTML report not found"

**Симптомы:**
```bash
⚠️ HTML report not found in standard locations
```

**Решения:**

1. **Проверьте конфигурацию Playwright:**
```javascript
// playwright.config.js
export default defineConfig({
  reporter: 'html',  // Убедитесь что HTML репортер включен
  // ...
});
```

2. **Настройте правильный путь:**
```javascript
// ai.conf.js
export const ai_conf = {
  api_key: 'your-key',
  report_dir: 'playwright-report',  // Или ваша кастомная папка
};
```

3. **Сгенерируйте отчет вручную:**
```bash
npx playwright show-report
```

## 🔌 Проблемы с MCP

### ❌ "MCP connection failed"

**Симптомы:**
```bash
❌ Failed to connect to MCP server: Connection refused
```

**Решения:**

1. **Проверьте MCP сервер:**
```bash
# Проверьте, запущен ли сервер на порту
netstat -an | grep 3001
lsof -i :3001
```

2. **Настройте правильный порт:**
```javascript
// ai.conf.js
export const ai_conf = {
  api_key: 'your-key',
  mcp_integration: true,
  mcp_ws_host: 'localhost',
  mcp_ws_port: 3001,  // Проверьте правильность порта
  mcp_timeout: 30000
};
```

3. **Отключите MCP временно:**
```bash
# Запуск без MCP
npx playwright-ai  # без флага --use-mcp
```

### ❌ "MCP timeout"

**Симптомы:**
```bash
⚠️ MCP request timeout after 30000ms
```

**Решения:**

1. **Увеличьте таймаут:**
```javascript
// ai.conf.js
export const ai_conf = {
  api_key: 'your-key',
  mcp_integration: true,
  mcp_timeout: 60000,  // Увеличьте до 60 секунд
  mcp_retry_attempts: 5  // Больше попыток
};
```

2. **Оптимизируйте snapshot'ы:**
```javascript
export const ai_conf = {
  api_key: 'your-key',
  mcp_integration: true,
  mcp_element_filters: {
    maxElements: 200,        // Ограничьте количество элементов
    excludeHidden: true,     // Исключите скрытые элементы
    includeInteractive: true // Только интерактивные элементы
  }
};
```

## 📊 Проблемы с отчетами

### ❌ "Allure attachments not created"

**Симптомы:**
- AI анализ выполняется, но вложения не появляются в Allure отчетах

**Решения:**

1. **Проверьте настройки Allure:**
```javascript
// playwright.config.js
export default defineConfig({
  reporter: [
    ['html'],
    ['allure-playwright', {
      detail: true,  // Включите детальную информацию
      outputFolder: 'allure-results'
    }]
  ]
});
```

2. **Включите Allure интеграцию:**
```javascript
// ai.conf.js
export const ai_conf = {
  api_key: 'your-key',
  allure_integration: true,  // Обязательно включите
  allure_results_dir: 'allure-results'
};
```

3. **Проверьте упавшие тесты:**
```bash
# Должны быть упавшие тесты для AI анализа
npx playwright test --reporter=line | grep "failed"
```

### ❌ "AI blocks not appearing in HTML reports"

**Симптомы:**
- AI анализ выполняется, но блоки не появляются в HTML отчетах

**Решения:**

1. **Проверьте путь к отчетам:**
```bash
# Найдите HTML отчеты
find . -name "index.html" -path "*/playwright-report/*"
```

2. **Проверьте права на запись:**
```bash
# Проверьте права на папку отчетов
ls -la playwright-report/
chmod 755 playwright-report/
```

3. **Включите HTML обновления:**
```javascript
// ai.conf.js
export const ai_conf = {
  api_key: 'your-key',
  html_injection_enabled: true,  // Включите встраивание в HTML
  report_dir: 'playwright-report'
};
```

## 🌐 Проблемы с сетью

### ❌ "Network request failed"

**Симптомы:**
```bash
❌ AI request failed: Network request failed
```

**Решения:**

1. **Проверьте интернет соединение:**
```bash
# Проверьте доступность AI сервера
curl -I https://api.mistral.ai
ping api.mistral.ai
```

2. **Проверьте прокси настройки:**
```bash
# Если используете корпоративный прокси
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080
```

3. **Используйте альтернативный сервер:**
```javascript
// ai.conf.js
export const ai_conf = {
  api_key: 'your-openai-key',
  ai_server: 'https://api.openai.com',  // Попробуйте другой сервер
  model: 'gpt-3.5-turbo'
};
```

## 🔄 Проблемы с конфигурацией

### ❌ "Configuration loading failed"

**Симптомы:**
```bash
❌ Failed to load configuration: SyntaxError
```

**Решения:**

1. **Проверьте синтаксис:**
```bash
# Проверьте JavaScript синтаксис
node -c ai.conf.js

# Проверьте TypeScript синтаксис
npx tsc --noEmit ai.conf.ts
```

2. **Используйте простую конфигурацию:**
```javascript
// ai.conf.js - минимальная рабочая версия
export const ai_conf = {
  api_key: 'your-key'
};
```

3. **Проверьте экспорт:**
```javascript
// ✅ Правильно
export const ai_conf = { ... };

// ❌ Неправильно
module.exports = { ai_conf: { ... } };
```

### ❌ "TypeScript configuration error"

**Симптомы:**
```bash
❌ Failed to load TypeScript config: tsx not available
```

**Решения:**

1. **Переключитесь на JavaScript:**
```bash
# Конвертируйте TS в JS
cp ai.conf.ts ai.conf.js
# Удалите типы из ai.conf.js
```

2. **Проверьте зависимости:**
```bash
# tsx должен быть включен автоматически
npm list tsx
```

## 🚀 Проблемы производительности

### ❌ "AI analysis too slow"

**Симптомы:**
- Анализ занимает больше 5 минут на файл

**Решения:**

1. **Оптимизируйте промпты:**
```javascript
// ai.conf.js
export const ai_conf = {
  api_key: 'your-key',
  max_prompt_length: 1000,  // Уменьшите размер промптов
  request_delay: 1000,      // Уменьшите задержку
  concurrent_requests: 2    // Увеличьте параллельность
};
```

2. **Используйте более быструю модель:**
```javascript
export const ai_conf = {
  api_key: 'your-key',
  model: 'mistral-small',   // Вместо mistral-large
  ai_server: 'https://api.mistral.ai'
};
```

3. **Фильтруйте файлы ошибок:**
```javascript
export const ai_conf = {
  api_key: 'your-key',
  error_file_patterns: [
    'copy-prompt.txt'  // Только основные файлы
  ]
};
```

### ❌ "MCP snapshots too large"

**Симптомы:**
```bash
⚠️ MCP snapshot size: 2.5MB (too large)
```

**Решения:**

1. **Настройте фильтры элементов:**
```javascript
// ai.conf.js
export const ai_conf = {
  api_key: 'your-key',
  mcp_integration: true,
  mcp_element_filters: {
    maxElements: 100,           // Ограничьте количество
    excludeTagNames: [          // Исключите ненужные теги
      'script', 'style', 'meta', 'link'
    ],
    includeInteractive: true,   // Только интерактивные
    excludeHidden: true,        // Исключите скрытые
    minTextLength: 3            // Минимальная длина текста
  }
};
```

2. **Используйте accessibility формат:**
```javascript
export const ai_conf = {
  api_key: 'your-key',
  mcp_integration: true,
  mcp_snapshot_format: 'accessibility'  // Вместо 'full'
};
```

## 🎯 Проблемы с качеством анализа

### ❌ "AI solutions are not relevant"

**Симптомы:**
- AI предлагает общие решения
- Решения не подходят к конкретной ошибке

**Решения:**

1. **Улучшите системные промпты:**
```javascript
// ai.conf.js
export const ai_conf = {
  api_key: 'your-key',
  messages: [
    {
      role: 'system',
      content: `Ты эксперт по Playwright тестам для e-commerce приложения.
      
      КОНТЕКСТ ПРОЕКТА:
      - React + TypeScript приложение
      - Используем data-testid атрибуты
      - Основные страницы: login, catalog, checkout
      - API: /api/auth, /api/products, /api/orders
      
      ТРЕБОВАНИЯ К ОТВЕТАМ:
      - Анализируй конкретную ошибку
      - Предлагай точные селекторы
      - Приводи примеры исправленного кода
      - Объясняй причину проблемы`
    }
  ]
};
```

2. **Включите MCP для DOM контекста:**
```bash
# Запуск с DOM snapshots для лучшего контекста
npx playwright-ai --use-mcp
```

3. **Используйте более мощную модель:**
```javascript
export const ai_conf = {
  api_key: 'your-key',
  model: 'mistral-large',  // Или gpt-4 для OpenAI
  max_prompt_length: 3000  // Больше контекста
};
```

### ❌ "AI responses in wrong language"

**Симптомы:**
- AI отвечает на английском вместо русского

**Решения:**

```javascript
// ai.conf.js
export const ai_conf = {
  api_key: 'your-key',
  messages: [
    {
      role: 'system',
      content: 'Ты AI помощник по отладке Playwright тестов. ОБЯЗАТЕЛЬНО отвечай на русском языке. Анализируй ошибки и предлагай конкретные решения с примерами кода.'
    }
  ]
};
```

## 🔧 Проблемы с интеграциями

### ❌ "Allure report generation failed"

**Симптомы:**
```bash
Error: allure command not found
```

**Решения:**

1. **Установите Allure:**
```bash
# Через npm
npm install -g allure-commandline

# Через brew (macOS)
brew install allure

# Проверьте установку
allure --version
```

2. **Установите allure-playwright:**
```bash
npm install allure-playwright
```

3. **Проверьте конфигурацию:**
```javascript
// playwright.config.js
export default defineConfig({
  reporter: [
    ['html'],
    ['allure-playwright', {
      detail: true,
      outputFolder: 'allure-results'
    }]
  ]
});
```

### ❌ "Allure attachments missing"

**Симптомы:**
- Allure отчет генерируется, но AI вложения отсутствуют

**Решения:**

1. **Проверьте упавшие тесты:**
```bash
# Должны быть именно упавшие тесты, не пропущенные
npx playwright test --reporter=line | grep -E "(failed|✘)"
```

2. **Включите детальные логи:**
```javascript
// ai.conf.js
export const ai_conf = {
  api_key: 'your-key',
  allure_integration: true,
  debug_mode: true  // Включите для диагностики
};
```

3. **Проверьте права на запись:**
```bash
# Проверьте права на папку allure-results
ls -la allure-results/
chmod -R 755 allure-results/
```

## 🐛 Отладка и диагностика

### Включение debug режима

```javascript
// ai.conf.js
export const ai_conf = {
  api_key: 'your-key',
  debug_mode: true,           // Подробные логи
  save_ai_responses: true,    // Сохранять ответы для анализа
  
  // MCP отладка
  mcp_debug: true,
  mcp_log_level: 'debug'
};
```

### Диагностические команды

```bash
# Проверка конфигурации
npx playwright-ai --validate-config

# Показать активную конфигурацию  
npx playwright-ai --show-config

# Тест MCP подключения
npx playwright-ai --test-mcp-connection

# Информация о системе
npx playwright-ai --system-info
```

### Анализ логов

```bash
# Запуск с подробными логами
DEBUG=playwright-ai:* npx playwright-ai

# Сохранение логов в файл
npx playwright-ai > debug.log 2>&1
```

## 🔄 Проблемы совместимости

### ❌ "Node.js version incompatible"

**Симптомы:**
```bash
Error: Node.js version 14.x is not supported
```

**Решения:**

1. **Обновите Node.js:**
```bash
# Проверьте версию
node --version

# Обновите через nvm
nvm install 18
nvm use 18

# Или через официальный сайт
# https://nodejs.org/
```

2. **Проверьте совместимость:**
```bash
# Минимальная версия: Node.js 16.0.0
node --version  # Должно быть >= 16.0.0
```

### ❌ "Playwright version conflicts"

**Симптомы:**
```bash
Warning: Playwright version mismatch
```

**Решения:**

1. **Обновите Playwright:**
```bash
npm install @playwright/test@latest
npx playwright install
```

2. **Проверьте совместимость:**
```bash
# Проверьте версии
npm list @playwright/test
npm list playwright-ai-auto-debug
```

## 📋 Чек-лист диагностики

Когда что-то не работает, проверьте по порядку:

### ✅ Базовая диагностика
- [ ] Node.js >= 16.0.0
- [ ] Пакет установлен: `npm list @playwright-ai/auto-debug`
- [ ] Конфигурация существует: `ls ai.conf.js`
- [ ] API ключ установлен: `grep api_key ai.conf.js`

### ✅ Файлы и папки
- [ ] Тесты выполнены: `ls test-results/`
- [ ] Есть файлы ошибок: `find . -name "*error*"`
- [ ] HTML отчет существует: `ls playwright-report/index.html`

### ✅ Сетевые проблемы
- [ ] Интернет соединение работает
- [ ] AI сервер доступен: `curl -I https://api.mistral.ai`
- [ ] API ключ валиден (нет 401 ошибок)
- [ ] Нет rate limiting (нет 429 ошибок)

### ✅ MCP диагностика (если используется)
- [ ] MCP сервер запущен: `lsof -i :3001`
- [ ] MCP интеграция включена в конфигурации
- [ ] Нет таймаутов MCP соединения

### ✅ Отчеты
- [ ] HTML блоки появляются в отчетах
- [ ] Allure вложения создаются (если включено)
- [ ] AI ответы сохраняются (если включено)

## 🆘 Получение помощи

### Сбор информации для баг репорта

```bash
# Соберите диагностическую информацию
npx playwright-ai --system-info > system-info.txt
npx playwright-ai --show-config > config-info.txt
npm list > dependencies.txt

# Запустите с debug логами
DEBUG=* npx playwright-ai > debug.log 2>&1
```

### Где получить помощь

- 🐛 **GitHub Issues**: [Сообщить об ошибке](https://github.com/lunin-vadim/playwright-ai-auto-debug/issues)
- 💬 **Discussions**: [Задать вопрос](https://github.com/lunin-vadim/playwright-ai-auto-debug/discussions)
- 📧 **Email**: support@playwright-ai.dev
- 📖 **Документация**: [docs/](../docs/)

### Шаблон баг репорта

```markdown
## 🐛 Описание проблемы
[Опишите что происходит]

## 🔄 Шаги для воспроизведения
1. [Первый шаг]
2. [Второй шаг]
3. [Результат]

## 💻 Окружение
- OS: [macOS/Windows/Linux]
- Node.js: [версия]
- Playwright: [версия]
- Plugin: [версия]

## ⚙️ Конфигурация
```javascript
// Ваш ai.conf.js (без API ключа)
```

## 📋 Логи
```
[Вставьте логи ошибок]
```
```

---

**🆘 Большинство проблем решается правильной конфигурацией и проверкой базовых требований**
