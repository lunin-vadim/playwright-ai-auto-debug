# 📚 Playwright AI Auto-Debug - Полная документация

## 📋 Содержание

1. [🎯 Обзор](#🎯-обзор)
2. [🧙‍♂️ Улучшения пользовательского опыта](#🧙‍♂️-улучшения-пользовательского-опыта)
3. [🔗 MCP Integration](#🔗-mcp-integration)
4. [🏗️ Архитектура](#🏗️-архитектура)
5. [🧪 Тестирование](#🧪-тестирование)
6. [📝 Changelog](#📝-changelog)

---

## 🎯 Обзор

**Playwright AI Auto-Debug** - это революционный инструмент для автоматического анализа упавших тестов с использованием ИИ. Плагин автоматически анализирует ошибки тестов и предоставляет конкретные решения прямо в отчетах.

### ✨ Ключевые особенности:

- 🤖 **AI-анализ ошибок** с конкретными решениями на русском языке
- 📊 **Интеграция с Allure** для командной работы и отчетности
- 🔗 **MCP протокол** для получения DOM snapshots
- 📈 **UI Coverage система** для анализа качества тестов
- 🧙‍♂️ **Интерактивная настройка** с мастером конфигурации
- 🔍 **Валидация конфигурации** с детальными рекомендациями
- 📚 **Интерактивные туториалы** для быстрого освоения

---

## 🧙‍♂️ Улучшения пользовательского опыта

### 1. 🧙‍♂️ Интерактивный мастер настройки

```bash
playwright-ai setup
```

**Полнофункциональный мастер для первоначальной настройки:**

#### Возможности:
- **Выбор AI провайдера**: Mistral AI, OpenAI, Anthropic, Custom
- **Автоматическая конфигурация**: Серверы, модели, настройки по умолчанию  
- **Безопасность API ключей**: Environment variables или прямой ввод
- **Настройка проекта**: Директории, Allure интеграция
- **Advanced опции**: Сохранение ответов, кастомные паттерны ошибок
- **MCP интеграция**: DOM snapshots настройка
- **TypeScript support**: Создание .ts или .js конфигурации

#### Пример процесса:
```
🧙‍♂️ Welcome to Playwright AI Auto-Debug Setup Wizard!
═════════════════════════════════════════════════════════
This wizard will help you create the perfect configuration.

📋 Step 1: Basic Configuration
──────────────────────────────
🤖 Choose your AI provider:
1. Mistral AI (recommended)
2. OpenAI ChatGPT  
3. Anthropic Claude
4. Custom provider

Enter your choice (1-4): 1
✅ Selected: Mistral AI
🔗 Server: https://api.mistral.ai
🧠 Model: mistral-medium

🔑 Step 2: API Key Configuration
──────────────────────────────
Enter your Mistral AI API key (or press Enter to use environment variable): [hidden]
✅ API key configured

📁 Step 3: Project Settings
──────────────────────────
Results directory [test-results]: DemoProject/test-results
Reports directory [playwright-report]: DemoProject/playwright-report
✅ Project directories configured

📊 Step 4: Allure Integration  
──────────────────────────────
Enable Allure integration? (y/n): y
Allure results directory [allure-results]: allure-results
✅ Allure integration enabled

⚙️ Step 5: Advanced Options
──────────────────────────
Save AI responses? (y/n): y
Custom error patterns? (y/n): n
✅ Advanced options configured

🔗 Step 6: MCP Integration
──────────────────────────
Enable MCP for DOM snapshots? (y/n): y
MCP WebSocket port [3001]: 3001
✅ MCP integration configured

📝 Configuration Summary:
─────────────────────────
✅ AI Provider: Mistral AI (mistral-medium)
✅ API Key: Configured via environment
✅ Project: DemoProject structure
✅ Allure: Enabled with allure-results
✅ MCP: Enabled on port 3001
✅ Responses: Will be saved

Create ai.conf.js? (y/n): y
✅ Configuration saved to ai.conf.js

🎉 Setup completed successfully!

Next steps:
1. Run your tests: npx playwright test  
2. Analyze failures: playwright-ai
3. For DOM snapshots: playwright-ai --use-mcp
```

### 2. 🔍 Configuration Validator 

```bash
playwright-ai validate
```

**Полная валидация конфигурации** с детальными рекомендациями:

#### Проверки:
- ✅ **Обязательные поля**: API key, server, model
- 🔗 **API конфигурация**: URL validation, model compatibility
- 📁 **Директории**: Существование, права доступа
- ⚡ **Производительность**: Лимиты промптов, задержки
- 🔗 **MCP настройки**: Порты, команды, таймауты
- 📊 **Allure интеграция**: Конфигурация отчетов
- 🎯 **Паттерны ошибок**: Валидность regex

#### Пример отчета:
```
🔍 Validating configuration...

✅ REQUIRED FIELDS
─────────────────
✅ api_key: Configured via environment variable
✅ ai_server: https://api.mistral.ai (reachable)
✅ model: mistral-medium (supported)

⚠️  WARNINGS
─────────────
⚠️  request_delay: 1000ms may be too low for production
⚠️  max_prompt_length: 2000 chars - consider 4000+ for better context

💡 RECOMMENDATIONS
─────────────────
💡 Enable save_ai_responses for debugging
💡 Consider MCP integration for DOM analysis  
💡 Add custom error_file_patterns for your project
💡 Set up Allure integration for team collaboration

📊 PERFORMANCE ANALYSIS
────────────────────────
✅ API latency: ~200ms (excellent)
✅ Config loading: ~50ms (fast)
⚠️  Large prompt detection: May truncate context

🔗 MCP INTEGRATION
─────────────────
❌ MCP disabled - missing DOM snapshot capabilities  
💡 Enable with: mcp_integration: true

📈 OVERALL SCORE: 85/100
─────────────────────────
✅ Configuration is valid and ready to use
💡 Consider applying 4 recommendations for optimization
```

### 3. 📚 Interactive Tutorials

```bash
playwright-ai tutorial
```

**6 интерактивных обучающих модулей:**

#### Доступные туториалы:
1. **🚀 Quick Start Guide** (5 min) - Быстрый старт
2. **⚙️ Advanced Configuration** (10 min) - Продвинутые настройки  
3. **🔗 MCP Integration Setup** (15 min) - Настройка MCP
4. **📊 Allure Integration** (10 min) - Интеграция с Allure
5. **🐛 Troubleshooting** (8 min) - Решение проблем
6. **💡 Best Practices** (12 min) - Лучшие практики

#### Пример Quick Start:
```
📚 Playwright AI Auto-Debug - Interactive Tutorials
═══════════════════════════════════════════════════════
Choose your learning path:

1. 🚀 Quick Start Guide (5 min)
2. ⚙️ Advanced Configuration (10 min)  
3. 🔗 MCP Integration Setup (15 min)
4. 📊 Allure Integration (10 min)
5. 🐛 Troubleshooting Common Issues (8 min)
6. 💡 Best Practices & Tips (12 min)
0. ❌ Exit

Select tutorial (0-6): 1

🚀 Quick Start Guide - Playwright AI Auto-Debug
════════════════════════════════════════════════

Welcome! This 5-minute tutorial will get you up and running.

📋 Prerequisites Check:
─────────────────────
✅ Node.js 16+ installed
✅ Playwright installed  
❌ AI API key missing

Let's fix the missing API key:

Step 1: Get your API key
────────────────────────
Visit: https://console.mistral.ai/api-keys/
Create new key and copy it.

Press Enter when ready...

Step 2: Configure API key  
─────────────────────────
You can set it via:
1. Environment variable: export API_KEY=your-key-here
2. Configuration file: api_key: 'your-key-here'

Choose option (1 or 2): 1

Step 3: Run your first analysis
──────────────────────────────── 
1. Run tests: npx playwright test
2. Analyze: playwright-ai

Try it now? (y/n): y

🎉 Tutorial completed! 
Next: Try 'playwright-ai tutorial' for advanced topics.
```

## Enhanced CLI Commands

All new UX improvements are integrated into the main CLI:

```bash
# Setup wizard
playwright-ai setup

# Configuration validation  
playwright-ai validate

# Interactive learning
playwright-ai tutorial

# Standard analysis
playwright-ai  

# With MCP DOM snapshots
playwright-ai --use-mcp

# Help and version
playwright-ai --help
playwright-ai --version
```

---

## 🔗 MCP Integration

**Model Context Protocol** интеграция для получения структурированной DOM информации.

### Возможности:
- 📸 **DOM snapshots** в AI промптах
- 🧪 **Валидация действий** через MCP browser automation  
- 🎯 **Точные селекторы** на основе реальной структуры страницы

### Использование:
```bash
# Стандартный режим
playwright-ai

# MCP режим с DOM snapshots  
playwright-ai --use-mcp
```

### Настройка:
```javascript
// ai.conf.js
export const ai_conf = {
  // MCP Integration settings
  mcp_integration: true,
  mcp_ws_host: 'localhost',
  mcp_ws_port: 3001,
  mcp_timeout: 30000,
  mcp_retry_attempts: 3,
  mcp_command: 'npx',
  mcp_args: ['@playwright/mcp@latest'],
  // ... other settings
};
```

---

## 🏗️ Архитектура

### Основные компоненты:

#### 1. 📦 Core Modules
- **`lib/index.js`** - Основная логика анализа
- **`lib/config.js`** - Загрузка и валидация конфигурации
- **`lib/sendToAI.js`** - Коммуникация с AI провайдерами
- **`lib/actionParser.js`** - Парсинг ошибок и действий
- **`lib/updateHtml.js`** - Обновление HTML отчетов
- **`lib/allureUtils.js`** - Интеграция с Allure  

#### 2. 🧙‍♂️ UX Enhancement Modules  
- **`lib/configWizard.js`** - Интерактивный мастер настройки
- **`lib/configValidator.js`** - Валидация конфигурации
- **`lib/interactiveTutorial.js`** - Система обучения

#### 3. 🔗 Integration Modules
- **`lib/mcpClient.js`** - MCP протокол клиент
- **`lib/extractPrompts.js`** - Извлечение промптов из ошибок

#### 4. 🎯 CLI Interface
- **`bin/index.js`** - Точка входа CLI со всеми командами

### Архитектурные принципы:
- **Модульность**: Каждый модуль выполняет одну функцию
- **Расширяемость**: Простое добавление новых AI провайдеров
- **Надежность**: Обработка ошибок и восстановление
- **Performance**: Кэширование и оптимизация запросов

---

## 🧪 Тестирование

### Доступные команды:
```bash
# Основные команды
npm run clean:test              # Очистка AI блоков из HTML отчетов
npm run demo                    # Показать инструкции демо  
npm run demo:full               # Запуск полного демо

# CLI команды
playwright-ai setup             # Интерактивный мастер настройки
playwright-ai validate          # Валидация конфигурации  
playwright-ai tutorial          # Интерактивные туториалы
```

### Тестовые данные:
Проект содержит готовые тестовые данные в `DemoProject/`:
- Упавшие тесты с различными типами ошибок
- HTML отчеты для обновления
- Allure результаты для интеграции
- MCP демо для DOM snapshots

---

## 📝 Changelog

### v1.3.0 - Major UX Improvements

#### 🆕 Новые возможности:
- **CLI Setup Wizard** (`playwright-ai setup`)
  - Интерактивная настройка с выбором AI провайдера
  - Автоматическая конфигурация серверов и моделей
  - Безопасная работа с API ключами
  - TypeScript/JavaScript конфигурация
  - MCP интеграция setup

- **Configuration Validator** (`playwright-ai validate`)  
  - Полная валидация всех настроек
  - Детальные ошибки, предупреждения, рекомендации
  - Проверка API доступности и производительности
  - MCP и Allure валидация
  - Scoring система (0-100)

- **Interactive Tutorial System** (`playwright-ai tutorial`)
  - 6 обучающих модулей (Quick Start → Best Practices)
  - Пошаговые интерактивные гайды
  - Проверка prerequisites и установки
  - Практические примеры конфигурации
  - Troubleshooting помощь

#### 🔧 Улучшения CLI:
- Enhanced help с примерами использования
- Improved error handling и пользовательские сообщения
- Graceful shutdown обработка  
- Quick config validation перед запуском
- Better version management

#### 🏗️ Архитектурные улучшения:
- Модульная структура UX компонентов
- Улучшенная обработка ошибок
- Кэширование конфигурации  
- TypeScript поддержка в config загрузчике
- Improved MCP integration

#### 📚 Документация:
- Unified documentation в `docs/README.md`
- Removed duplicate markdown files
- Enhanced examples и use cases  
- Better CLI documentation
- Consolidated demo instructions

### Previous Versions:
- **v1.2.0** - MCP Integration
- **v1.1.0** - Allure Integration  
- **v1.0.0** - Initial Release

---

## 🚀 Quick Start

1. **Установка:**
```bash
npm install @playwright-ai/auto-debug
```

2. **Настройка:**
```bash  
playwright-ai setup
```

3. **Запуск тестов:**
```bash
npx playwright test
```

4. **Анализ ошибок:**
```bash
playwright-ai
```

5. **С DOM snapshots:**
```bash
playwright-ai --use-mcp
```

---

## 📞 Поддержка

- **GitHub:** https://github.com/lunin-vadim/playwright-ai-auto-debug
- **Issues:** https://github.com/lunin-vadim/playwright-ai-auto-debug/issues
- **Tutorials:** `playwright-ai tutorial`
- **Validation:** `playwright-ai validate` 