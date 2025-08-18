# 🚀 Быстрый старт

**Пошаговое руководство по установке и настройке playwright-ai-auto-debug за 5 минут**

## 📋 Предварительные требования

- ✅ **Node.js** версии 16.0.0 или выше
- ✅ **Playwright** проект с настроенными тестами
- ✅ **API ключ** от одного из поддерживаемых AI сервисов:
  - [Mistral AI](https://console.mistral.ai/) (рекомендуется)
  - [OpenAI](https://platform.openai.com/)
  - [Anthropic Claude](https://console.anthropic.com/)

## 🛠️ Шаг 1: Установка

```bash
# В корневой папке вашего Playwright проекта
npm install @playwright-ai/auto-debug
```

## ⚙️ Шаг 2: Конфигурация

### Вариант A: Конфигурация через ai.conf.js (рекомендуется)

Создайте файл `ai.conf.js` в корне проекта:

```javascript
// ai.conf.js
export const ai_conf = {
  // Обязательный параметр
  api_key: 'your-mistral-api-key-here',
  
  // Опциональные параметры
  ai_server: 'https://api.mistral.ai',
  model: 'mistral-medium',
  results_dir: 'test-results',
  request_delay: 2000  // Задержка между запросами
};
```

### Вариант B: TypeScript конфигурация

Для TypeScript проектов создайте `ai.conf.ts`:

```typescript
// ai.conf.ts
import type { AiConfig } from 'playwright-ai-auto-debug';

export const ai_conf: AiConfig = {
  api_key: process.env.API_KEY || 'your-api-key',
  ai_server: 'https://api.mistral.ai',
  model: 'mistral-medium',
  results_dir: 'test-results',
  max_prompt_length: 2000,
  request_delay: 2000
};
```

### Вариант C: Через переменные окружения

Создайте файл `.env`:

```env
API_KEY=your-mistral-api-key-here
```

> ⚠️ **Важно**: При использовании `ai.conf.js/ts`, настройки из `.env` игнорируются

## 🔐 Шаг 3: Безопасность API ключа

Добавьте конфигурационные файлы в `.gitignore`:

```bash
# .gitignore
ai.conf.js
ai.conf.ts
.env
```

## 🧪 Шаг 4: Запуск тестов и получение ошибок

```bash
# Запустите ваши Playwright тесты
npx playwright test

# Тесты упадут и создадут файлы ошибок в test-results/
```

## 🤖 Шаг 5: AI анализ ошибок

### Стандартный режим
```bash
npx playwright-ai
```

### Режим с MCP (DOM snapshots)
```bash
npx playwright-ai --use-mcp
```

### С указанием папки проекта
```bash
npx playwright-ai --project ./my-tests
```

## 📊 Шаг 6: Просмотр результатов

### HTML отчеты Playwright
Откройте `playwright-report/index.html` - в упавших тестах появятся AI блоки с решениями.

### Allure отчеты (опционально)

1. **Включите Allure интеграцию** в `ai.conf.js`:
```javascript
export const ai_conf = {
  api_key: 'your-key',
  allure_integration: true,
  allure_results_dir: 'allure-results'
};
```

2. **Настройте Playwright** для Allure в `playwright.config.js`:
```javascript
export default defineConfig({
  reporter: [
    ['html'],
    ['allure-playwright', { outputFolder: 'allure-results' }]
  ]
});
```

3. **Сгенерируйте отчет**:
```bash
npx allure generate allure-results -o allure-report
npx allure open allure-report
```

## ✅ Проверка установки

Выполните команду для проверки:

```bash
npx playwright-ai --help
```

Вы должны увидеть:
```
🤖 Playwright AI Auto-Debug

Usage: playwright-ai [options]

Options:
  --project <path>    Project directory (default: current)
  --use-mcp          Enable MCP DOM snapshots
  --help             Show help
```

## 🎯 Что дальше?

1. **Изучите демо проект**: `cd DemoProject && npm run demo:full`
2. **Настройте под ваш проект**: [docs/CONFIGURATION.md](./CONFIGURATION.md)
3. **Попробуйте MCP режим**: [docs/MCP_INTEGRATION.md](./MCP_INTEGRATION.md)
4. **Изучите архитектуру**: [docs/ARCHITECTURE.md](./ARCHITECTURE.md)

## 🆘 Возникли проблемы?

- 📖 **Решение проблем**: [docs/TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- 🐛 **Сообщить об ошибке**: [GitHub Issues](https://github.com/lunin-vadim/playwright-ai-auto-debug/issues)
- 💬 **Обсуждения**: [GitHub Discussions](https://github.com/lunin-vadim/playwright-ai-auto-debug/discussions)

---

**⏱️ Время настройки: ~5 минут | 🎯 Результат: Автоматический AI анализ всех ошибок тестов**
