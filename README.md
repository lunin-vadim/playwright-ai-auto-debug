# @playwright-ai/auto-debug

🤖 Автоматическая отладка Playwright тестов с помощью AI

## 📦 Установка

```bash
npm install @playwright-ai/auto-debug
```

## 🔧 Настройка

### Конфигурация через playwright.config.js (рекомендуется)

Добавьте секцию `ai_conf` в ваш `playwright.config.js`:

```javascript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  // Обычные настройки Playwright
  testDir: './tests',
  reporter: 'html',
  
  // Конфигурация AI для автоматической отладки
  ai_conf: {
    // Обязательные параметры
    api_key: 'ваш_api_ключ_здесь',
    
    // Опциональные параметры
    ai_server: 'https://api.mistral.ai',        // URL AI сервера
    model: 'mistral-medium',                    // Модель AI
    results_dir: 'test-results',                // Папка с результатами тестов
    max_prompt_length: 2000,                    // Максимальная длина промпта
    request_delay: 1000,                        // Задержка между запросами (мс)
    
    // Кастомные сообщения для AI (опционально)
    messages: [
      {
        role: 'system',
        content: 'Ты AI помощник по отладке Playwright тестов. Анализируй ошибки и предлагай конкретные решения на русском языке.'
      }
    ]
  }
});
```

### TypeScript поддержка

Для TypeScript проектов библиотека автоматически предоставляет типы. После установки добавьте импорт в ваш `playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test';
// Импортируем типы для поддержки ai_conf
import 'playwright-ai-auto-debug';

export default defineConfig({
  // Обычные настройки Playwright
  testDir: './tests',
  reporter: 'html',
  
  // ai_conf теперь поддерживается с автодополнением
  ai_conf: {
    api_key: process.env.MISTRAL_API_KEY || 'your_api_key_here',
    // ... остальные параметры с автодополнением
  }
});
```

> 💡 **Совет**: После импорта `playwright-ai-auto-debug` TypeScript будет предоставлять автодополнение для всех параметров `ai_conf`

### Альтернативная настройка через .env

Создайте файл `.env` в корне проекта:

```env
MISTRAL_API_KEY=ваш_api_ключ_здесь
```

> ⚠️ При использовании конфигурации через `playwright.config.js` настройки из `.env` игнорируются

## 🚀 Использование

### CLI команда

```bash
npx playwright-ai
```

### Через npm scripts

Добавьте в `package.json`:

```json
{
  "scripts": {
    "debug:ai": "npx playwright-ai"
  }
}
```

Затем запустите:

```bash
npm run debug:ai
```

## ⚙️ Параметры конфигурации

| Параметр | Тип | Обязательный | По умолчанию | Описание |
|----------|-----|--------------|--------------|----------|
| `api_key` | string | ✅ | - | API ключ для AI сервиса |
| `ai_server` | string | ❌ | `https://api.mistral.ai` | URL AI сервера |
| `model` | string | ❌ | `mistral-medium` | Модель AI для анализа |
| `results_dir` | string | ❌ | `test-results` | Папка с результатами тестов |
| `max_prompt_length` | number | ❌ | `2000` | Максимальная длина промпта |
| `request_delay` | number | ❌ | `1000` | Задержка между запросами (мс) |
| `error_file_patterns` | array | ❌ | См. ниже | Паттерны файлов с ошибками |
| `messages` | array | ❌ | Системное сообщение | Кастомные сообщения для AI |

### Поддерживаемые файлы с ошибками

По умолчанию библиотека ищет следующие типы файлов:

- `copy-prompt.txt` - стандартный файл Playwright
- `error-context.md` - альтернативный формат с контекстом ошибки
- `error.txt` - простой текстовый файл с ошибкой
- `test-error.md` - Markdown файл с описанием ошибки
- `*-error.txt` - любые файлы заканчивающиеся на `-error.txt`
- `*-error.md` - любые файлы заканчивающиеся на `-error.md`

Вы можете настроить собственные паттерны через параметр `error_file_patterns`:

```javascript
ai_conf: {
  api_key: 'your_key',
  error_file_patterns: [
    'my-custom-error.txt',
    'failure-*.md',
    'test-results.json'
  ]
}
```

## 🔍 Как это работает

1. **Загрузка конфигурации**: Читает настройки из `playwright.config.js`
2. **Поиск ошибок**: Автоматически находит все файлы `copy-prompt.txt` в указанной папке
3. **AI анализ**: Отправляет содержимое ошибок в AI для получения решений
4. **Обновление отчетов**: Добавляет блок с ошибкой и решением в HTML отчеты Playwright

## 📋 Пример результата

После выполнения команды в ваших HTML отчетах появится блок:

```html
<div class="ai-debug">
  <h3>🔍 AI Debug</h3>
  <p><strong>Ошибка:</strong> Error: Timeout while waiting for selector...</p>
  <p><strong>Решение от AI:</strong> Попробуйте добавить ожидание перед этим шагом...</p>
</div>
```

## 📊 Логи выполнения

```bash
🚀 Запуск автоматической отладки Playwright тестов...

⚙️  Загрузка конфигурации AI...
✅ Конфигурация AI загружена из playwright.config.js

🔍 Поиск файлов с ошибками...
✅ Найден prompt: test-results/test1/copy-prompt.txt
✅ Найден prompt: test-results/test2/copy-prompt.txt
📋 Найдено 2 файл(ов) с ошибками

📝 Обработка 1/2: test-results/test1/copy-prompt.txt
🔁 Отправлено в AI...
✅ Ответ получен
💾 HTML обновлён: test-results/test1/index.html

📝 Обработка 2/2: test-results/test2/copy-prompt.txt
🔁 Отправлено в AI...
✅ Ответ получен
💾 HTML обновлён: test-results/test2/index.html

✅ Отладка завершена успешно!
```

## ⚙️ Требования

- Node.js >= 16.0.0
- API ключ для AI сервиса
- Playwright тесты с сгенерированными отчетами
- Файл `playwright.config.js` с секцией `ai_conf`

## 🔒 Безопасность

- API ключ хранится в конфигурации проекта
- Добавьте `playwright.config.js` в `.gitignore` если используете приватные ключи
- Соблюдается rate limiting для API запросов

## 📄 Лицензия

MIT 