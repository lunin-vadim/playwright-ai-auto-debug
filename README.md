# @playwright-ai/auto-debug

🤖 **Автоматическая отладка Playwright тестов с помощью ИИ**

[![npm version](https://img.shields.io/npm/v/playwright-ai-auto-debug.svg)](https://www.npmjs.com/package/playwright-ai-auto-debug)

## ✨ Основные возможности

- 🤖 **AI-анализ ошибок** - автоматическое определение причин падения тестов
- 📊 **UI Test Coverage** - реальное покрытие элементов интерфейса тестами (НОВОЕ!)
- 🎯 **Объединенные отчеты** - drill-down анализ по тестам, страницам и элементам
- 📊 **Интеграция с отчетами** - встраивание решений в HTML и Allure отчеты  
- 🏗️ **Clean Architecture** - Domain-Driven Design с DI контейнером
- 🔌 **MCP Integration** - DOM snapshots для точной диагностики
- 🎯 **Умное сопоставление** - ИИ решения прикрепляются к релевантным тестам
- 🧩 **Множественные AI провайдеры** - OpenAI, Mistral, LocalAI с единым интерфейсом
- 🖥️ **Современный CLI** - команды `debug`, `info`, `setup`, `validate`
- 🔧 **Простая настройка** - конфигурация через `ai.conf.js` или `.ts`

## 🚀 Быстрый старт

```bash
# 1. Установка
npm install playwright-ai-auto-debug

# 2. Создание конфигурации
echo "export const ai_conf = { api_key: 'your-api-key' };" > ai.conf.js

# 3. Интерактивная настройка
npx playwright-ai setup

# 4. Запуск анализа
npx playwright-ai debug

# 5. Запуск с MCP (DOM snapshots)
npx playwright-ai debug --use-mcp    # Рекомендуется для точной диагностики
```

## 🎯 UI Test Coverage (НОВОЕ!)

**Система реального покрытия элементов интерфейса тестами:**

```bash
# 1. Установка и настройка в проекте
npm install playwright-ai-auto-debug
npx playwright-ai coverage init

# 2. Использование в тестах
```

```javascript
// Импорт из локальной папки (создается автоматически)
import { test, expect } from './coverage-lib/fixture.js';

test.describe('🎯 Мои тесты с покрытием', () => {
  test('✅ Автоматическое отслеживание', async ({ page }) => {
    await page.goto('https://example.com');
    
    // Каждое взаимодействие автоматически отслеживается
    await page.locator('button').click();
    await page.locator('#login').fill('user');
    await page.locator('text=Submit').click();
  });
});
```

```bash
# 3. Запуск тестов с покрытием
npm run test:coverage

# 4. Открытие объединенного отчета
npm run coverage:open
# или
open test-coverage-reports/index.html
```

**🎯 Объединенный отчет показывает:**
- **📊 Общее покрытие** - процент элементов покрытых тестами
- **🌐 По страницам** - drill-down анализ каждой страницы  
- **🧪 По тестам** - какие элементы покрывает каждый тест
- **🎯 Непокрытые элементы** - с предлагаемыми селекторами
- **📝 Анализ селекторов** - эффективность использования
- **💡 Интерактивная навигация** - клик для детализации

**✨ Ключевые особенности:**
- **Один отчет** вместо множества файлов
- **Drill-down интерфейс** для проваливания в детали
- **Автоматическое отслеживание** всех взаимодействий с элементами
- **Приоритизация элементов** по важности для тестирования
- **Умные рекомендации** селекторов для непокрытых элементов

### 🎯 Workflow для пользователя:

```bash
# В любом Playwright проекте:
npm install playwright-ai-auto-debug   # Установка
npx playwright-ai coverage init        # Настройка (один раз)

# В ваших тестах просто замените импорт:
# ❌ import { test, expect } from '@playwright/test';
# ✅ import { test, expect } from './coverage-lib/fixture.js';

npm run test:coverage                   # Запуск с покрытием
npm run coverage:open                   # Открытие отчета
```

**📊 Результат:** Интерактивный HTML отчет с:
- Общей статистикой покрытия по всем тестам
- Анализом по каждой странице и тесту  
- Списком непокрытых элементов с селекторами
- Возможностью "провалиться" в детали

> 📖 **Подробные инструкции**: [docs/QUICK_START.md](./docs/QUICK_START.md)

## 🔗 Новое: MCP Integration

**Model Context Protocol (MCP)** обеспечивает получение структурированной информации о DOM:
- 📸 **DOM snapshots** в AI промптах для точной локализации проблем
- 🧪 **Валидация действий** через MCP browser automation  
- 🎯 **Точные селекторы** на основе реальной структуры страницы

> 📖 **Подробное руководство**: [docs/MCP_INTEGRATION.md](./docs/MCP_INTEGRATION.md)

## 🖥️ CLI Команды (v3.2.0+)

**Новая архитектура** предоставляет расширенный набор команд:

```bash
# 🔍 Основные команды
npx playwright-ai debug              # Анализ ошибок тестов
npx playwright-ai debug --use-mcp    # С DOM snapshots через MCP
npx playwright-ai debug --parallel 4 # Параллельная обработка
npx playwright-ai info               # Информация о системе и конфигурации
npx playwright-ai setup              # Интерактивная настройка проекта
npx playwright-ai validate           # Проверка конфигурации
npx playwright-ai doctor             # Диагностика путей и артефактов
npx playwright-ai doctor --fix       # Автоматически создать недостающие папки
npx playwright-ai doctor --json      # Вывод в JSON

# 🎯 UI Test Coverage
npx playwright-ai coverage init      # Настройка системы покрытия
npx playwright-ai coverage info      # Информация о покрытии
npx playwright-ai ui-coverage        # Анализ покрытия с MCP DOM snapshots

# 📊 Справка
npx playwright-ai help               # Справка по всем командам
npx playwright-ai help debug         # Справка по конкретной команде
```

<!-- ## 🎥 Demo Video

[![Demo Video](https://img.youtube.com/vi/mva6ktpKOKw/maxresdefault.jpg)](https://youtu.be/mva6ktpKOKw) -->

## 📚 Документация

| Руководство | Описание |
|-------------|----------|
| 📖 [Быстрый старт](./docs/QUICK_START.md) | Пошаговая установка и настройка за 5 минут |
| 🔌 [MCP Integration](./docs/MCP_INTEGRATION.md) | DOM snapshots и browser automation |
| 🏗️ [Архитектура](./docs/ARCHITECTURE.md) | Clean Architecture и расширение системы |
| ⚙️ [Конфигурация](./docs/CONFIGURATION.md) | Все параметры и настройки |
| 🆘 [Решение проблем](./docs/TROUBLESHOOTING.md) | Типичные ошибки и их исправление |

## 🎭 Демо проект

Для изучения всех возможностей используйте готовый демо проект:

```bash
cd DemoProject
npm install
npm run demo:full  # Полная демонстрация с AI анализом
```

> 📖 **Подробности**: [DemoProject/README.md](./DemoProject/README.md)

## 🔍 Как это работает

### 🤖 AI Debug System:
1. **🔍 Поиск ошибок** - FileErrorRepository находит файлы с ошибками тестов
2. **🧠 AI анализ** - Strategy Pattern для выбора AI провайдера (OpenAI/Mistral/LocalAI)
3. **🔌 MCP интеграция** - получение DOM snapshots для точной диагностики
4. **📊 Обновление отчетов** - модульные репортеры встраивают решения в HTML/Allure
5. **🎯 Умное сопоставление** - алгоритм скоринга прикрепляет решения к релевантным тестам
6. **🧩 DI управление** - Dependency Injection координирует все компоненты

### 🎯 UI Test Coverage System:
1. **🔧 Автоматическая настройка** - `npx playwright-ai coverage init` копирует файлы
2. **🕵️ Перехват взаимодействий** - Playwright fixture отслеживает все `page.locator()`, `click()`, `fill()`
3. **📄 Анализ страниц** - извлечение всех интерактивных элементов с DOM
4. **🎯 Сопоставление** - сравнение найденных элементов с используемыми в тестах
5. **📊 Объединенный отчет** - генерация единого HTML отчета с drill-down навигацией
6. **💡 Умные рекомендации** - предложения селекторов для непокрытых элементов

## 🏗️ Clean Architecture (v3.2.0+)

Версия 3.2.0+ расширена **UI Test Coverage System** и полностью переработана с **Clean Architecture** для профессиональной разработки:

- **🏛️ Domain Layer** - Rich domain entities с бизнес-логикой (`TestError`, `AIResponse`)
- **🎯 Application Layer** - Use Cases и сервисы (`AnalyzeTestErrorsUseCase`, `TestDebugService`)  
- **🔧 Infrastructure Layer** - AI провайдеры, репортеры, MCP клиент, **UI Coverage System**
- **🖥️ Presentation Layer** - CLI с командами `debug`, `coverage`, `info`, `setup`, `validate`
- **🧩 DI Container** - Dependency Injection для управления зависимостями

```bash
npx playwright-ai debug --use-mcp    # Анализ ошибок с MCP
npx playwright-ai info               # Информация о системе
npx playwright-ai setup              # Интерактивная настройка
npx playwright-ai validate           # Проверка конфигурации
npx playwright-ai doctor             # Диагностика путей и окружения

# UI Test Coverage
npx playwright-ai coverage init      # Настройка покрытия
npx playwright-ai coverage info      # Информация о покрытии
```

## 🤖 AI Провайдеры

### 🤖 OpenAI
```javascript
// ai.conf.js
export const ai_conf = {
  api_key: 'sk-...',
  ai_server: 'https://api.openai.com/v1/chat/completions',
  model: 'gpt-4'
};
```

### 🔮 Mistral AI
```javascript
// ai.conf.js
export const ai_conf = {
  api_key: 'your-mistral-key',
  ai_server: 'https://api.mistral.ai/v1/chat/completions',
  model: 'mistral-large'
};
```

### 🏠 Local AI (LM Studio, Ollama)
```javascript
// ai.conf.js
export const ai_conf = {
  api_key: 'not-needed',
  ai_server: 'http://localhost:1234/v1/chat/completions',
  model: 'auto-detect'
};
```

> 📖 **Подробнее**: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)

## 📋 Пример результата

После выполнения команды в ваших HTML отчетах появится стильный блок с AI решением:

```html
<div class="ai-debug-section">
  <h2 class="ai-debug-header">🤖 AI Debug Assistant</h2>
  <div class="ai-debug-content">
    <div class="ai-error-section">
      <div class="ai-section-title">❌ Обнаруженная ошибка</div>
      <div class="ai-error-details">Error: Timeout waiting for selector...</div>
    </div>
    <div class="ai-solution-section">
      <div class="ai-section-title">💡 Рекомендуемое решение</div>
      <div class="ai-solution-content">
        <p>Попробуйте добавить ожидание перед этим шагом...</p>
      </div>
    </div>
  </div>
</div>
```

## ⚙️ Системные требования

- **Node.js** >= 16.0.0
- **Playwright** проект с настроенными тестами
- **AI провайдер** - API ключ или локальный сервер (OpenAI, Mistral, LocalAI)

## 🔧 Поддерживаемые форматы

### Файлы ошибок
- `copy-prompt.txt` - стандартные файлы Playwright
- `error-context.md` - расширенный формат с контекстом
- `*-error.txt`, `*-error.md` - пользовательские форматы
- **Автоматическое определение типа** - timeout, selector, assertion, network ошибки

### Отчеты
- **HTML отчеты** Playwright с встроенными AI блоками
- **Allure отчеты** с AI вложениями для упавших тестов
- **Markdown файлы** с сохраненными AI ответами

## 🔒 Безопасность

- **🔐 Локальное хранение API ключей** - в `ai.conf.js`/`ai.conf.ts`
- **🛡️ Защита приватных данных** - добавьте `ai.conf.*` в `.gitignore`
- **⏱️ Rate limiting** - автоматическое ограничение API запросов
- **🏠 Поддержка локальных AI** - полная приватность с LocalAI/Ollama
- **🔍 Валидация конфигурации** - проверка настроек через `validate` команду

## 🤝 Участие в разработке

1. **Fork репозитория** и клонируйте локально
2. **Изучите архитектуру** - ознакомьтесь с [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
3. **Создайте feature branch** для новой функциональности
4. **Следуйте принципам** - Clean Architecture, SOLID, DDD
5. **Добавьте тесты** - для новых Use Cases и Entity
6. **Используйте DI контейнер** - регистрируйте зависимости в `bindings.js`
7. **Создайте Pull Request** с описанием изменений

## 📄 Лицензия

MIT License - см. [LICENSE](LICENSE) файл для деталей. 