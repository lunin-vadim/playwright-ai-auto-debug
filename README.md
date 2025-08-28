# @playwright-ai/auto-debug

🤖 **Автоматическая отладка Playwright тестов с помощью ИИ**

[![npm version](https://img.shields.io/npm/v/playwright-ai-auto-debug.svg)](https://www.npmjs.com/package/playwright-ai-auto-debug)

## ✨ Основные возможности

- 🤖 **AI-анализ ошибок** - автоматическое определение причин падения тестов
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

# 3. Интерактивная настройка (новое в v2.0+)
node src/main.js setup

# 4. Запуск анализа
npx playwright-ai                    # Legacy CLI (обратная совместимость)
node src/main.js debug               # Новая архитектура

# 5. Запуск с MCP (DOM snapshots)
node src/main.js debug --use-mcp     # Рекомендуется для точной диагностики
```

> 📖 **Подробные инструкции**: [docs/QUICK_START.md](./docs/QUICK_START.md)

## 🔗 Новое: MCP Integration

**Model Context Protocol (MCP)** обеспечивает получение структурированной информации о DOM:
- 📸 **DOM snapshots** в AI промптах для точной локализации проблем
- 🧪 **Валидация действий** через MCP browser automation  
- 🎯 **Точные селекторы** на основе реальной структуры страницы

> 📖 **Подробное руководство**: [docs/MCP_INTEGRATION.md](./docs/MCP_INTEGRATION.md)

## 🖥️ CLI Команды (v2.0.0+)

**Новая архитектура** предоставляет расширенный набор команд:

```bash
# 🔍 Основные команды
node src/main.js debug              # Анализ ошибок тестов
node src/main.js debug --use-mcp    # С DOM snapshots через MCP
node src/main.js info               # Информация о системе и конфигурации
node src/main.js setup              # Интерактивная настройка проекта
node src/main.js validate           # Проверка конфигурации

# 📊 Дополнительные опции
node src/main.js debug --verbose    # Подробный вывод
node src/main.js debug --dry-run    # Тестовый запуск без изменений
node src/main.js --help             # Справка по всем командам

# 🔄 Legacy поддержка
npx playwright-ai                   # Старый CLI через legacy слой
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

1. **🔍 Поиск ошибок** - FileErrorRepository находит файлы с ошибками тестов
2. **🧠 AI анализ** - Strategy Pattern для выбора AI провайдера (OpenAI/Mistral/LocalAI)
3. **🔌 MCP интеграция** - получение DOM snapshots для точной диагностики
4. **📊 Обновление отчетов** - модульные репортеры встраивают решения в HTML/Allure
5. **🎯 Умное сопоставление** - алгоритм скоринга прикрепляет решения к релевантным тестам
6. **🧩 DI управление** - Dependency Injection координирует все компоненты

## 🏗️ Clean Architecture (v2.0.0+)

Версия 2.0.0+ полностью переработана с **Clean Architecture** для профессиональной разработки:

- **🏛️ Domain Layer** - Rich domain entities с бизнес-логикой (`TestError`, `AIResponse`)
- **🎯 Application Layer** - Use Cases и сервисы (`AnalyzeTestErrorsUseCase`, `TestDebugService`)  
- **🔧 Infrastructure Layer** - AI провайдеры (OpenAI, Mistral, LocalAI), репортеры, MCP клиент
- **🖥️ Presentation Layer** - Современный CLI с командами `debug`, `info`, `setup`, `validate`
- **🧩 DI Container** - Dependency Injection для управления зависимостями

```bash
# Новые CLI команды
node src/main.js debug --use-mcp    # Анализ ошибок с MCP
node src/main.js info               # Информация о системе
node src/main.js setup              # Интерактивная настройка
node src/main.js validate           # Проверка конфигурации

# Старый CLI (обратная совместимость)
npx playwright-ai                   # Работает через legacy слой
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