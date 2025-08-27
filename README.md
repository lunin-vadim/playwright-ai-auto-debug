# @playwright-ai/auto-debug

🤖 **Автоматическая отладка Playwright тестов с помощью ИИ**

[![npm version](https://img.shields.io/npm/v/playwright-ai-auto-debug.svg)](https://www.npmjs.com/package/playwright-ai-auto-debug)

## ✨ Основные возможности

- 🤖 **AI-анализ ошибок** - автоматическое определение причин падения тестов
- 📊 **Интеграция с отчетами** - встраивание решений в HTML и Allure отчеты  
- 🏗️ **Clean Architecture** - модульная расширяемая архитектура
- 🔌 **MCP Integration** - DOM snapshots для точной диагностики
- 🎯 **Умное сопоставление** - ИИ решения прикрепляются к релевантным тестам
- 🔧 **Простая настройка** - конфигурация через `ai.conf.js`

## 🚀 Быстрый старт

```bash
# 1. Установка
npm install @playwright-ai/auto-debug

# 2. Создание конфигурации
echo "export const ai_conf = { api_key: 'your-api-key' };" > ai.conf.js

# 3. Запуск анализа
npx playwright-ai

# 4. Запуск с MCP (DOM snapshots)
npx playwright-ai --use-mcp
```

> 📖 **Подробные инструкции**: [docs/QUICK_START.md](./docs/QUICK_START.md)

## 🔗 Новое: MCP Integration

**Model Context Protocol (MCP)** обеспечивает получение структурированной информации о DOM:
- 📸 **DOM snapshots** в AI промптах для точной локализации проблем
- 🧪 **Валидация действий** через MCP browser automation  
- 🎯 **Точные селекторы** на основе реальной структуры страницы

> 📖 **Подробное руководство**: [docs/MCP_INTEGRATION.md](./docs/MCP_INTEGRATION.md)

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

1. **Поиск ошибок** - автоматически находит файлы с ошибками тестов
2. **AI анализ** - отправляет ошибки в ИИ для получения решений  
3. **Обновление отчетов** - встраивает решения в HTML и Allure отчеты
4. **Умное сопоставление** - прикрепляет решения к релевантным тестам

## 🏗️ Новая архитектура

Версия 1.3.0+ использует **Clean Architecture** для лучшей модульности и расширяемости:

- **🏛️ Domain Layer** - бизнес-логика и доменные сущности
- **🎯 Application Layer** - use cases и сервисы приложения  
- **🔧 Infrastructure Layer** - AI провайдеры, репортеры, MCP клиент
- **🖥️ Presentation Layer** - CLI интерфейс

```bash
# Использование новой архитектуры
node src/main.js debug --use-mcp
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
- **API ключ** для AI сервиса (OpenAI, Claude, Mistral AI и др.)

## 🔧 Поддерживаемые форматы

### Файлы ошибок
- `copy-prompt.txt` - стандартные файлы Playwright
- `error-context.md` - расширенный формат с контекстом
- `*-error.txt`, `*-error.md` - пользовательские форматы

### Отчеты
- **HTML отчеты** Playwright с встроенными AI блоками
- **Allure отчеты** с AI вложениями для упавших тестов
- **Markdown файлы** с сохраненными AI ответами

## 🔒 Безопасность

- API ключи хранятся в локальной конфигурации
- Добавьте `ai.conf.js` в `.gitignore` для приватных ключей
- Соблюдается rate limiting для API запросов

## 🤝 Участие в разработке

1. Fork репозитория
2. Создайте feature branch
3. Следуйте принципам Clean Architecture
4. Добавьте тесты для новой функциональности
5. Создайте Pull Request

## 📄 Лицензия

MIT License - см. [LICENSE](LICENSE) файл для деталей. 