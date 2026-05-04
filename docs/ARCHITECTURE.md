# 🏗️ Clean Architecture Guide

**Руководство по новой архитектуре Playwright AI Auto-Debug**

## 🎯 Обзор архитектуры

Версия 1.3.0+ полностью переработана с использованием принципов **Clean Architecture** и **Domain-Driven Design** для решения проблем монолитной структуры.

### ❌ Проблемы старой архитектуры
- Монолитная структура (225+ строк в одном файле)
- Смешанная ответственность модулей
- Тесная связанность компонентов
- Отсутствие абстракций
- Сложное тестирование

### ✅ Решения новой архитектуры
- **Clean Architecture** с четким разделением слоев
- **Domain-Driven Design** с rich domain entities
- **Dependency Injection** для управления зависимостями
- **Strategy Pattern** для AI провайдеров
- **Observer Pattern** для отчетности
- **Command Pattern** для MCP действий

## 📁 Структура слоев

```
src/
├── domain/                          # 🏛️ Доменный слой
│   ├── entities/                    # Доменные сущности
│   │   ├── TestError.js            # Ошибка теста с бизнес-логикой
│   │   ├── AIResponse.js           # Ответ ИИ с анализом
│   │   └── Report.js               # Отчет с метриками
│   ├── repositories/               # Интерфейсы репозиториев
│   │   ├── IAIProvider.js          # Интерфейс AI провайдера
│   │   ├── IErrorRepository.js     # Интерфейс репозитория ошибок
│   │   └── IReporter.js            # Интерфейс репортера
│   └── services/                   # Доменные сервисы
│       └── ErrorAnalysisService.js # Анализ ошибок
│
├── application/                     # 🎯 Слой приложения
│   ├── usecases/                   # Use Cases (бизнес-логика)
│   │   └── AnalyzeTestErrorsUseCase.js
│   └── services/                   # Сервисы приложения
│       └── TestDebugService.js     # Главный сервис
│
├── infrastructure/                  # 🔧 Инфраструктурный слой
│   ├── ai/                         # AI провайдеры
│   │   ├── MistralProvider.js      # Mistral AI
│   │   ├── OpenAIProvider.js       # OpenAI GPT
│   │   └── ClaudeProvider.js       # Anthropic Claude
│   ├── repositories/               # Реализации репозиториев
│   │   └── FileErrorRepository.js  # Файловый репозиторий
│   ├── reporters/                  # Репортеры
│   │   ├── HTMLReporter.js         # HTML отчеты
│   │   ├── AllureReporter.js       # Allure интеграция
│   │   └── MarkdownReporter.js     # Markdown отчеты
│   ├── mcp/                        # MCP интеграция
│   │   └── McpClient.js            # MCP клиент
│   ├── config/                     # Конфигурация
│   │   └── ConfigLoader.js         # Загрузчик конфигурации
│   └── di/                         # Dependency Injection
│       ├── Container.js            # DI контейнер
│       └── bindings.js             # Конфигурация зависимостей
│
├── presentation/                    # 🖥️ Слой представления
│   └── cli/                        # CLI интерфейс
│       └── CliApplication.js       # CLI приложение
│
└── main.js                         # 🚀 Точка входа
```

## 🏛️ Принципы Clean Architecture

### 1. Dependency Rule
Зависимости направлены внутрь - внешние слои зависят от внутренних, но не наоборот.

```javascript
// ✅ Правильно: Infrastructure зависит от Domain
class MistralProvider extends IAIProvider {
  // Реализация интерфейса из Domain слоя
}

// ❌ Неправильно: Domain не должен зависеть от Infrastructure
class TestError {
  constructor(filePath, content) {
    this.mistralClient = new MistralProvider(); // Нарушение принципа
  }
}
```

### 2. Separation of Concerns
Каждый слой имеет четкую ответственность:

```javascript
// Domain Layer - бизнес-правила
class TestError {
  detectErrorType() {
    if (this.content.includes('AssertionError')) return 'assertion_error';
    if (this.content.includes('TimeoutError')) return 'timeout_error';
    return 'unknown_error';
  }
}

// Application Layer - оркестрация
class AnalyzeTestErrorsUseCase {
  async execute(request) {
    const errors = await this.errorRepository.findErrors(request.projectPath);
    // Оркестрация бизнес-логики
  }
}

// Infrastructure Layer - внешние зависимости
class MistralProvider {
  async generateResponse(prompt) {
    return await fetch('https://api.mistral.ai/v1/chat/completions', {
      // Реализация внешнего API
    });
  }
}
```

## 🔧 Dependency Injection

### Использование DI контейнера

```javascript
// Получение сервиса через DI
import { getContainer } from './src/infrastructure/di/Container.js';

const container = getContainer();
const testDebugService = await container.get('testDebugService');
const results = await testDebugService.debugTests('./project');
```

### Регистрация новых зависимостей

```javascript
// src/infrastructure/di/bindings.js
export function configureContainer() {
  const container = new Container();
  
  // Singleton - один экземпляр на весь жизненный цикл
  container.singleton('configLoader', (c) => new ConfigLoader());
  
  // Transient - новый экземпляр при каждом запросе
  container.transient('aiProvider', async (c) => {
    const config = await c.get('config');
    return new MistralProvider(config);
  });
  
  return container;
}
```

## 🎯 Domain-Driven Design

### Доменные сущности

```javascript
// src/domain/entities/TestError.js
export class TestError {
  constructor(filePath, content, errorType = null, testName = null) {
    this.filePath = filePath;
    this.content = content;
    this.errorType = errorType || this.detectErrorType();
    this.testName = testName || this.extractTestName();
    this.severity = this.calculateSeverity();
    this.keywords = this.extractKeywords();
  }
  
  // Бизнес-логика внутри сущности
  detectErrorType() {
    // Логика определения типа ошибки
  }
  
  hasDomContext() {
    // Определяет, нужен ли DOM snapshot для анализа
    return this.errorType === 'selector_error' || 
           this.errorType === 'element_not_found';
  }
}
```

### Доменные сервисы

```javascript
// src/domain/services/ErrorAnalysisService.js
export class ErrorAnalysisService {
  analyzeErrorComplexity(testError) {
    // Сложная доменная логика анализа ошибок
    let complexity = 0;
    
    if (testError.hasStackTrace()) complexity += 2;
    if (testError.hasMultipleErrors()) complexity += 3;
    if (testError.hasDomContext()) complexity += 1;
    
    return complexity;
  }
}
```

## 🔌 Паттерны проектирования

### 1. Strategy Pattern - AI Providers

```javascript
// Интерфейс стратегии
class IAIProvider {
  async generateResponse(prompt, config, domSnapshot) {
    throw new Error('Must implement generateResponse');
  }
}

// Конкретные стратегии
class MistralProvider extends IAIProvider {
  async generateResponse(prompt, config, domSnapshot) {
    // Реализация для Mistral
  }
}

class OpenAIProvider extends IAIProvider {
  async generateResponse(prompt, config, domSnapshot) {
    // Реализация для OpenAI
  }
}
```

### 2. Observer Pattern - Reporters

```javascript
// Субъект
class ReporterManager {
  constructor() {
    this.reporters = [];
  }
  
  addReporter(reporter) {
    this.reporters.push(reporter);
  }
  
  async notifyAll(testError, aiResponse) {
    for (const reporter of this.reporters) {
      await reporter.processResult(testError, aiResponse);
    }
  }
}

// Наблюдатели
class HTMLReporter {
  async processResult(testError, aiResponse) {
    // Обновление HTML отчетов
  }
}

class AllureReporter {
  async processResult(testError, aiResponse) {
    // Создание Allure вложений
  }
}
```

### 3. Command Pattern - MCP Actions

```javascript
// Команда
class GetDomSnapshotCommand {
  constructor(mcpClient, options) {
    this.mcpClient = mcpClient;
    this.options = options;
  }
  
  async execute() {
    return await this.mcpClient.getSnapshot(this.options);
  }
}

// Invoker
class McpCommandInvoker {
  async executeCommand(command) {
    try {
      return await command.execute();
    } catch (error) {
      // Обработка ошибок команды
    }
  }
}
```

## 🧪 Тестирование архитектуры

### Unit тесты доменных сущностей

```javascript
// tests/domain/entities/TestError.test.js
import { TestError } from '../../../src/domain/entities/TestError.js';

describe('TestError', () => {
  test('should detect assertion error type', () => {
    const error = new TestError('test.js', 'AssertionError: expected true but got false');
    expect(error.errorType).toBe('assertion_error');
  });
  
  test('should determine DOM context need', () => {
    const error = new TestError('test.js', 'Element not found: button[data-testid="submit"]');
    expect(error.hasDomContext()).toBe(true);
  });
});
```

### Integration тесты с моками

```javascript
// tests/application/usecases/AnalyzeTestErrorsUseCase.test.js
describe('AnalyzeTestErrorsUseCase', () => {
  test('should analyze errors with mocked dependencies', async () => {
    const mockErrorRepo = { findErrors: jest.fn().mockResolvedValue([testError]) };
    const mockAiProvider = { generateResponse: jest.fn().mockResolvedValue(aiResponse) };
    const mockReporter = { processResult: jest.fn() };
    
    const useCase = new AnalyzeTestErrorsUseCase(
      mockErrorRepo, mockAiProvider, mockReporter
    );
    
    const result = await useCase.execute(request);
    expect(result.success).toBe(true);
  });
});
```

## 🔄 Расширение системы

### Добавление нового AI провайдера

1. **Создайте реализацию интерфейса**:
```javascript
// src/infrastructure/ai/CustomAIProvider.js
import { IAIProvider } from '../../domain/repositories/IAIProvider.js';

export class CustomAIProvider extends IAIProvider {
  async generateResponse(prompt, config, domSnapshot) {
    // Ваша реализация
    const response = await this.callCustomAPI(prompt);
    return this.formatResponse(response);
  }
  
  getProviderName() { return 'Custom AI'; }
  getSupportedModels() { return ['custom-model-1', 'custom-model-2']; }
}
```

2. **Зарегистрируйте в DI контейнере**:
```javascript
// src/infrastructure/di/bindings.js
container.bind('customAiProvider', (c) => new CustomAIProvider());
```

### Добавление нового репортера

1. **Реализуйте интерфейс**:
```javascript
// src/infrastructure/reporters/SlackReporter.js
import { IReporter } from '../../domain/repositories/IReporter.js';

export class SlackReporter extends IReporter {
  async processResult(testError, aiResponse) {
    // Отправка в Slack
    await this.sendToSlack({
      error: testError.content,
      solution: aiResponse.content,
      test: testError.testName
    });
  }
}
```

2. **Добавьте в ReporterManager**:
```javascript
// src/infrastructure/di/bindings.js
container.singleton('reporterManager', async (c) => {
  const manager = new ReporterManager();
  
  // Существующие репортеры
  manager.addReporter(await c.get('htmlReporter'));
  manager.addReporter(await c.get('allureReporter'));
  
  // Новый репортер
  if (config.slack_integration) {
    manager.addReporter(new SlackReporter(config));
  }
  
  return manager;
});
```

## 🔄 Use Cases и бизнес-логика

### Главный Use Case

```javascript
// src/application/usecases/AnalyzeTestErrorsUseCase.js
export class AnalyzeTestErrorsUseCase {
  constructor(errorRepository, aiProvider, reporterManager, mcpClient = null) {
    this.errorRepository = errorRepository;
    this.aiProvider = aiProvider;
    this.reporterManager = reporterManager;
    this.mcpClient = mcpClient;
  }

  async execute(request) {
    // 1. Валидация запроса
    this.validateRequest(request);
    
    // 2. Поиск ошибок
    const errorFiles = await this.errorRepository.findErrors(
      request.projectPath, 
      request.config
    );
    
    // 3. Анализ каждой ошибки
    for (const errorFile of errorFiles) {
      const testError = new TestError(errorFile.path, errorFile.content);
      
      // 4. Получение DOM snapshot (если нужно)
      let domSnapshot = null;
      if (this.mcpClient && testError.hasDomContext()) {
        domSnapshot = await this.mcpClient.getSnapshot();
      }
      
      // 5. AI анализ
      const aiResponse = await this.aiProvider.generateResponse(
        testError.content, 
        request.config, 
        domSnapshot
      );
      
      // 6. Обновление отчетов
      await this.reporterManager.processResult(testError, aiResponse);
    }
    
    return { success: true, processedCount: errorFiles.length };
  }
}
```

## 🔧 Dependency Injection в деталях

### Container.js

```javascript
// src/infrastructure/di/Container.js
export class Container {
  constructor() {
    this.bindings = new Map();
    this.singletons = new Set();
    this.instances = new Map();
  }
  
  // Регистрация singleton зависимости
  singleton(key, factory) {
    this.bindings.set(key, factory);
    this.singletons.add(key);
    return this;
  }
  
  // Регистрация transient зависимости
  transient(key, factory) {
    this.bindings.set(key, factory);
    return this;
  }
  
  // Получение экземпляра
  get(key) {
    if (this.singletons.has(key) && this.instances.has(key)) {
      return this.instances.get(key);
    }
    
    const factory = this.bindings.get(key);
    if (!factory) {
      throw new Error(`No binding found for: ${key}`);
    }
    
    const instance = factory(this);
    
    if (this.singletons.has(key)) {
      this.instances.set(key, instance);
    }
    
    return instance;
  }
}
```

### Конфигурация зависимостей

```javascript
// src/infrastructure/di/bindings.js
export function configureContainer() {
  const container = new Container();
  
  // Конфигурация
  container.singleton('configLoader', (c) => new ConfigLoader());
  container.singleton('config', async (c) => {
    const configLoader = c.get('configLoader');
    return await configLoader.loadAiConfig();
  });
  
  // Репозитории
  container.singleton('errorRepository', (c) => new FileErrorRepository());
  
  // AI провайдеры
  container.singleton('aiProvider', async (c) => {
    const config = await c.get('config');
    return new MistralProvider(config);
  });
  
  // Репортеры
  container.singleton('reporterManager', async (c) => {
    const manager = new ReporterManager();
    manager.addReporter(await c.get('htmlReporter'));
    manager.addReporter(await c.get('allureReporter'));
    return manager;
  });
  
  // Use Cases
  container.singleton('analyzeTestErrorsUseCase', async (c) => {
    return new AnalyzeTestErrorsUseCase(
      c.get('errorRepository'),
      await c.get('aiProvider'),
      await c.get('reporterManager'),
      await c.get('mcpClient')
    );
  });
  
  return container;
}
```

## 🎯 Доменные сущности

### TestError - Rich Domain Entity

```javascript
// src/domain/entities/TestError.js
export class TestError {
  constructor(filePath, content, errorType = null, testName = null) {
    this.filePath = filePath;
    this.content = content;
    this.errorType = errorType || this.detectErrorType();
    this.testName = testName || this.extractTestName();
    this.severity = this.calculateSeverity();
    this.keywords = this.extractKeywords();
    this.timestamp = new Date();
  }
  
  // Бизнес-логика определения типа ошибки
  detectErrorType() {
    const content = this.content.toLowerCase();
    
    if (content.includes('assertionerror')) return 'assertion_error';
    if (content.includes('timeouterror')) return 'timeout_error';
    if (content.includes('element not found')) return 'selector_error';
    if (content.includes('network')) return 'network_error';
    
    return 'unknown_error';
  }
  
  // Определение необходимости DOM контекста
  hasDomContext() {
    return ['selector_error', 'element_not_found', 'interaction_error']
      .includes(this.errorType);
  }
  
  // Расчет важности ошибки
  calculateSeverity() {
    if (this.errorType === 'assertion_error') return 'high';
    if (this.errorType === 'timeout_error') return 'medium';
    return 'low';
  }
  
  // Извлечение ключевых слов для сопоставления
  extractKeywords() {
    const text = this.content.toLowerCase();
    const keywords = [];
    
    // Извлечение селекторов
    const selectorMatches = text.match(/['"`]([^'"`]*?)['"`]/g);
    if (selectorMatches) {
      keywords.push(...selectorMatches.map(s => s.slice(1, -1)));
    }
    
    // Извлечение имен тестов
    const testMatches = text.match(/test[:\s]+([^\n]+)/gi);
    if (testMatches) {
      keywords.push(...testMatches);
    }
    
    return keywords;
  }
}
```

### AIResponse - Value Object

```javascript
// src/domain/entities/AIResponse.js
export class AIResponse {
  constructor(content, model, timestamp = null, metadata = {}) {
    this.content = content;
    this.model = model;
    this.timestamp = timestamp || new Date();
    this.metadata = metadata;
    this.wordCount = this.calculateWordCount();
    this.confidence = this.calculateConfidence();
  }
  
  // Анализ качества ответа
  calculateConfidence() {
    let confidence = 0.5; // Базовая уверенность
    
    if (this.content.includes('```')) confidence += 0.2; // Есть код
    if (this.content.length > 200) confidence += 0.1;   // Подробный ответ
    if (this.hasSpecificSelectors()) confidence += 0.2; // Конкретные селекторы
    
    return Math.min(confidence, 1.0);
  }
  
  hasSpecificSelectors() {
    return /\[data-testid=|#\w+|\.\w+/.test(this.content);
  }
}
```

## 🚀 Использование новой архитектуры

### Запуск через новый CLI

```bash
# Анализ ошибок
npx playwright-ai debug

# С MCP интеграцией
npx playwright-ai debug --use-mcp

# Информация о системе
npx playwright-ai info

# Настройка проекта
npx playwright-ai setup

# Диагностика путей
npx playwright-ai doctor
```

### Программное использование

```javascript
// Использование в коде
import { getContainer } from './src/infrastructure/di/Container.js';

async function analyzeMyTests() {
  const container = getContainer();
  const testDebugService = await container.get('testDebugService');
  
  const results = await testDebugService.debugTests('./my-project', {
    useMcp: true
  });
  
  console.log(`Processed ${results.processedCount} errors`);
}
```

## 📊 Мониторинг и метрики

### Health Checks

```javascript
// Проверка состояния системы
const container = getContainer();
const service = await container.get('testDebugService');

const health = await service.healthCheck();
console.log(`Status: ${health.status}`);
console.log(`Components: ${health.components.join(', ')}`);
```

### Метрики производительности

```javascript
// Получение метрик
const metrics = await service.getMetrics();
console.log(`Average analysis time: ${metrics.avgAnalysisTime}ms`);
console.log(`Success rate: ${metrics.successRate}%`);
console.log(`Total errors processed: ${metrics.totalProcessed}`);
```

## 🔄 Миграция со старой архитектуры

### Совместимость

- ✅ **CLI команды** остаются теми же
- ✅ **Конфигурация** использует тот же формат
- ✅ **Отчеты** совместимы с существующими
- ✅ **Постепенная миграция** - старая версия в `lib/`, новая в `src/`

### Переход на новую архитектуру

```bash
npx playwright-ai debug
```

## 🎯 Преимущества новой архитектуры

### Для разработчиков
- 🧪 **Тестируемость** - все компоненты легко тестируются изолированно
- 🔧 **Модульность** - изменения в одном слое не влияют на другие
- 📖 **Читаемость** - четкая структура и разделение ответственности
- 🚀 **Расширяемость** - новые функции добавляются без изменения существующего кода

### Для бизнеса
- ⚡ **Производительность** - оптимизированные зависимости и ленивая загрузка
- 🛡️ **Надежность** - строгая типизация и валидация
- 📊 **Мониторинг** - встроенные метрики и health checks
- 🔄 **Масштабируемость** - легко добавлять новые AI провайдеры и функции

---

**🏗️ Clean Architecture обеспечивает долгосрочное развитие и масштабирование проекта**
