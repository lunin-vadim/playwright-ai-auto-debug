# 🏗️ Новая архитектура Playwright AI Auto-Debug

## 🎯 Цели рефакторинга

### Проблемы текущей архитектуры:
- ❌ Монолитная структура (225 строк в одном файле)
- ❌ Смешанная ответственность 
- ❌ Тесная связанность модулей
- ❌ Отсутствие абстракций
- ❌ Процедурный стиль
- ❌ Сложное тестирование

### Решение:
- ✅ **Clean Architecture** + **Domain-Driven Design**
- ✅ **Dependency Injection** для управления зависимостями
- ✅ **Strategy Pattern** для AI провайдеров
- ✅ **Observer Pattern** для отчетности
- ✅ **Command Pattern** для действий

## 📁 Новая структура проекта

```
playwright-ai-auto-debug/
├── src/                              # Исходный код (новая структура)
│   ├── domain/                       # Доменный слой (бизнес-логика)
│   │   ├── entities/                 # Доменные сущности
│   │   │   ├── TestError.js         # Ошибка теста
│   │   │   ├── AIResponse.js        # Ответ ИИ
│   │   │   ├── TestReport.js        # Отчет теста
│   │   │   └── Configuration.js     # Конфигурация
│   │   ├── repositories/            # Интерфейсы репозиториев
│   │   │   ├── IErrorRepository.js  # Интерфейс для работы с ошибками
│   │   │   ├── IAIProvider.js       # Интерфейс AI провайдера
│   │   │   └── IReportRepository.js # Интерфейс репортеров
│   │   └── services/                # Доменные сервисы
│   │       ├── ErrorAnalysisService.js    # Анализ ошибок
│   │       └── TestMatchingService.js     # Сопоставление тестов
│   ├── application/                  # Слой приложения (Use Cases)
│   │   ├── usecases/                # Сценарии использования
│   │   │   ├── AnalyzeTestErrorsUseCase.js     # Анализ ошибок тестов
│   │   │   ├── GenerateAIResponseUseCase.js    # Генерация AI ответа
│   │   │   ├── CreateReportsUseCase.js         # Создание отчетов
│   │   │   └── ValidateActionsUseCase.js       # Валидация действий MCP
│   │   ├── dto/                     # Data Transfer Objects
│   │   │   ├── AnalysisRequest.js   # Запрос на анализ
│   │   │   └── AnalysisResult.js    # Результат анализа
│   │   └── interfaces/              # Интерфейсы слоя приложения
│   │       └── ITestDebugService.js # Главный сервис
│   ├── infrastructure/              # Инфраструктурный слой
│   │   ├── ai/                      # AI провайдеры
│   │   │   ├── MistralProvider.js   # Mistral AI
│   │   │   ├── OpenAIProvider.js    # OpenAI
│   │   │   ├── ClaudeProvider.js    # Anthropic Claude
│   │   │   └── AIProviderFactory.js # Фабрика провайдеров
│   │   ├── repositories/            # Реализации репозиториев
│   │   │   ├── FileErrorRepository.js     # Работа с файлами ошибок
│   │   │   └── AllureReportRepository.js  # Allure отчеты
│   │   ├── reporters/               # Репортеры
│   │   │   ├── HTMLReporter.js      # HTML отчеты
│   │   │   ├── AllureReporter.js    # Allure интеграция
│   │   │   ├── MarkdownReporter.js  # Markdown файлы
│   │   │   └── ReporterManager.js   # Управление репортерами
│   │   ├── mcp/                     # MCP интеграция
│   │   │   ├── McpClient.js         # MCP клиент (рефакторенный)
│   │   │   ├── commands/            # MCP команды
│   │   │   │   ├── ClickCommand.js  # Команда клика
│   │   │   │   ├── FillCommand.js   # Команда заполнения
│   │   │   │   └── SnapshotCommand.js # Команда снимка
│   │   │   └── McpCommandExecutor.js # Выполнитель команд
│   │   ├── config/                  # Конфигурация
│   │   │   ├── ConfigLoader.js      # Загрузчик конфигурации
│   │   │   └── ConfigValidator.js   # Валидатор (существующий)
│   │   └── di/                      # Dependency Injection
│   │       ├── Container.js         # DI контейнер
│   │       └── bindings.js          # Привязки зависимостей
│   ├── presentation/                # Слой представления
│   │   ├── cli/                     # CLI интерфейс
│   │   │   ├── commands/            # CLI команды
│   │   │   │   ├── DebugCommand.js  # Команда отладки
│   │   │   │   ├── SetupCommand.js  # Команда настройки
│   │   │   │   └── ValidateCommand.js # Команда валидации
│   │   │   └── CliApplication.js    # Главное CLI приложение
│   │   └── controllers/             # Контроллеры
│   │       └── TestDebugController.js # Контроллер отладки
│   └── shared/                      # Общий код
│       ├── utils/                   # Утилиты
│       ├── constants/               # Константы
│       └── errors/                  # Кастомные ошибки
├── lib/                             # Старый код (для совместимости)
│   └── ... (существующие файлы)
├── tests/                           # Тесты
│   ├── unit/                        # Unit тесты
│   │   ├── domain/                  # Тесты доменного слоя
│   │   ├── application/             # Тесты слоя приложения
│   │   └── infrastructure/          # Тесты инфраструктуры
│   ├── integration/                 # Интеграционные тесты
│   └── e2e/                        # E2E тесты
└── docs/                           # Документация
    ├── architecture/               # Архитектурная документация
    │   ├── clean-architecture.md   # Clean Architecture
    │   ├── domain-design.md        # Domain-Driven Design
    │   └── patterns.md            # Используемые паттерны
    └── migration/                  # Миграция
        └── migration-guide.md     # Руководство по миграции
```

## 🏛️ Архитектурные слои

### 1. 📋 Domain Layer (Доменный слой)

**Ответственность:** Бизнес-логика, доменные правила

#### Entities (Сущности):
```javascript
// domain/entities/TestError.js
class TestError {
  constructor(filePath, content, errorType, testName) {
    this.filePath = filePath;
    this.content = content;
    this.errorType = errorType;
    this.testName = testName;
    this.timestamp = new Date();
  }
  
  // Доменные методы
  extractKeywords() { /* ... */ }
  getErrorSeverity() { /* ... */ }
  isRetryable() { /* ... */ }
}
```

#### Repositories (Интерфейсы):
```javascript
// domain/repositories/IAIProvider.js
class IAIProvider {
  async generateResponse(prompt, config) {
    throw new Error('Must be implemented');
  }
  
  async validateConfiguration(config) {
    throw new Error('Must be implemented');
  }
}
```

#### Domain Services:
```javascript
// domain/services/ErrorAnalysisService.js
class ErrorAnalysisService {
  constructor(testMatchingService) {
    this.testMatchingService = testMatchingService;
  }
  
  analyzeError(testError) {
    // Доменная логика анализа ошибок
  }
}
```

### 2. 🎯 Application Layer (Слой приложения)

**Ответственность:** Оркестрация, Use Cases

#### Use Cases:
```javascript
// application/usecases/AnalyzeTestErrorsUseCase.js
class AnalyzeTestErrorsUseCase {
  constructor(errorRepository, aiProvider, reporterManager) {
    this.errorRepository = errorRepository;
    this.aiProvider = aiProvider;
    this.reporterManager = reporterManager;
  }
  
  async execute(request) {
    // 1. Найти ошибки
    const errors = await this.errorRepository.findErrors(request.projectPath);
    
    // 2. Проанализировать каждую ошибку
    const results = [];
    for (const error of errors) {
      const response = await this.aiProvider.generateResponse(error.content);
      results.push(new AnalysisResult(error, response));
    }
    
    // 3. Создать отчеты
    await this.reporterManager.createReports(results);
    
    return results;
  }
}
```

### 3. 🔧 Infrastructure Layer (Инфраструктурный слой)

**Ответственность:** Внешние интеграции, технические детали

#### AI Providers (Strategy Pattern):
```javascript
// infrastructure/ai/MistralProvider.js
class MistralProvider extends IAIProvider {
  constructor(httpClient, config) {
    super();
    this.httpClient = httpClient;
    this.config = config;
  }
  
  async generateResponse(prompt, config) {
    // Реализация для Mistral AI
  }
}

// infrastructure/ai/AIProviderFactory.js
class AIProviderFactory {
  static create(providerType, config) {
    switch (providerType) {
      case 'mistral': return new MistralProvider(httpClient, config);
      case 'openai': return new OpenAIProvider(httpClient, config);
      case 'claude': return new ClaudeProvider(httpClient, config);
      default: throw new Error(`Unknown provider: ${providerType}`);
    }
  }
}
```

#### Reporters (Observer Pattern):
```javascript
// infrastructure/reporters/ReporterManager.js
class ReporterManager {
  constructor() {
    this.reporters = [];
  }
  
  addReporter(reporter) {
    this.reporters.push(reporter);
  }
  
  async createReports(results) {
    for (const reporter of this.reporters) {
      await reporter.generate(results);
    }
  }
}
```

#### MCP Commands (Command Pattern):
```javascript
// infrastructure/mcp/commands/ClickCommand.js
class ClickCommand {
  constructor(element) {
    this.element = element;
  }
  
  async execute(mcpClient) {
    return await mcpClient.click(this.element.ref);
  }
  
  canUndo() {
    return false;
  }
}
```

### 4. 🎨 Presentation Layer (Слой представления)

**Ответственность:** CLI, контроллеры

```javascript
// presentation/cli/CliApplication.js
class CliApplication {
  constructor(container) {
    this.container = container;
    this.commands = new Map();
    this.registerCommands();
  }
  
  registerCommands() {
    this.commands.set('debug', new DebugCommand(this.container));
    this.commands.set('setup', new SetupCommand(this.container));
    this.commands.set('validate', new ValidateCommand(this.container));
  }
  
  async run(args) {
    const [command, ...params] = args;
    const commandHandler = this.commands.get(command);
    
    if (!commandHandler) {
      throw new Error(`Unknown command: ${command}`);
    }
    
    return await commandHandler.execute(params);
  }
}
```

## 🔗 Dependency Injection

```javascript
// infrastructure/di/Container.js
class Container {
  constructor() {
    this.bindings = new Map();
    this.instances = new Map();
  }
  
  bind(key, factory) {
    this.bindings.set(key, factory);
  }
  
  get(key) {
    if (this.instances.has(key)) {
      return this.instances.get(key);
    }
    
    const factory = this.bindings.get(key);
    if (!factory) {
      throw new Error(`No binding found for: ${key}`);
    }
    
    const instance = factory(this);
    this.instances.set(key, instance);
    return instance;
  }
}

// infrastructure/di/bindings.js
export function configureContainer() {
  const container = new Container();
  
  // Repositories
  container.bind('errorRepository', (c) => new FileErrorRepository());
  container.bind('configLoader', (c) => new ConfigLoader());
  
  // AI Providers
  container.bind('aiProvider', (c) => {
    const config = c.get('configLoader').load();
    return AIProviderFactory.create(config.providerType, config);
  });
  
  // Services
  container.bind('errorAnalysisService', (c) => 
    new ErrorAnalysisService(c.get('testMatchingService'))
  );
  
  // Use Cases
  container.bind('analyzeTestErrorsUseCase', (c) =>
    new AnalyzeTestErrorsUseCase(
      c.get('errorRepository'),
      c.get('aiProvider'),
      c.get('reporterManager')
    )
  );
  
  return container;
}
```

## 🔄 Миграционная стратегия

### Этап 1: Создание новой структуры (параллельно)
- Создать новые директории `src/`
- Реализовать доменные сущности
- Настроить DI контейнер

### Этап 2: Миграция по слоям
- Перенести бизнес-логику в доменный слой
- Создать Use Cases
- Реализовать новые провайдеры и репозитории

### Этап 3: Обновление точки входа
- Создать новый CLI с DI
- Обеспечить обратную совместимость
- Постепенно удалить старый код

### Этап 4: Тестирование и документация
- Написать unit тесты для всех слоев
- Обновить документацию
- Провести нагрузочное тестирование

## ✅ Преимущества новой архитектуры

1. **🧩 Модульность** - четкое разделение ответственности
2. **🧪 Тестируемость** - легко писать unit тесты
3. **🔄 Расширяемость** - простое добавление новых AI провайдеров
4. **🛠️ Поддерживаемость** - понятная структура кода
5. **⚡ Производительность** - ленивая загрузка зависимостей
6. **🔒 Надежность** - изоляция ошибок между слоями
7. **📚 Документируемость** - архитектура самодокументируется

## 📊 Сравнение архитектур

| Аспект | Старая архитектура | Новая архитектура |
|--------|-------------------|-------------------|
| Структура | Процедурная | Clean Architecture |
| Связанность | Тесная | Слабая |
| Тестируемость | Сложная | Простая |
| Расширяемость | Ограниченная | Высокая |
| Поддерживаемость | Низкая | Высокая |
| Производительность | Средняя | Высокая |

## 🚀 Следующие шаги

1. **Создать новую структуру директорий**
2. **Реализовать доменные сущности**
3. **Настроить DI контейнер**
4. **Создать базовые Use Cases**
5. **Реализовать AI провайдеры**
6. **Добавить репортеры**
7. **Написать тесты**
8. **Обновить CLI**
9. **Провести миграцию**
10. **Обновить документацию** 