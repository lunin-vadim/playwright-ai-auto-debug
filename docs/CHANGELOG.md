# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2025-01-16

### 🚨 Breaking Changes
- 🏗️ **Полная архитектурная перестройка**: Переход с монолитной структуры на Clean Architecture
  - **Новая точка входа**: `node src/main.js` вместо старого CLI
  - **Изменена структура проекта**: Код разделен на слои Domain/Application/Infrastructure/Presentation
  - **DI контейнер**: Все зависимости управляются через Dependency Injection
  - **Обратная совместимость**: Старый CLI `npx playwright-ai` продолжает работать через legacy слой

### Added
- 🏛️ **Clean Architecture Implementation**: Полное внедрение принципов чистой архитектуры
  - **Domain Layer**: Rich domain entities (`TestError`, `AIResponse`) с бизнес-логикой
  - **Application Layer**: Use Cases и сервисы приложения (`AnalyzeTestErrorsUseCase`, `TestDebugService`)
  - **Infrastructure Layer**: Реализации репозиториев, AI провайдеров, репортеров
  - **Presentation Layer**: CLI интерфейс с командами `debug`, `info`, `setup`

- 🔌 **Model Context Protocol (MCP) Integration**: Революционная интеграция с DOM snapshots
  - **WebSocket MCP Client**: Подключение к MCP серверам для получения DOM структуры
  - **DOM Snapshots**: Реальные снимки страниц для точного анализа селекторов
  - **Smart Element Analysis**: ИИ получает актуальную структуру DOM для диагностики
  - **CLI флаг**: `--use-mcp` для активации MCP режима
  - **Конфигурация MCP**: `mcp_integration`, `mcp_ws_host`, `mcp_ws_port`, `mcp_timeout`

- 🧩 **Dependency Injection Container**: Профессиональное управление зависимостями
  - **Singleton/Transient lifecycle**: Гибкое управление жизненным циклом объектов
  - **Middleware поддержка**: Логирование, валидация, обработка ошибок
  - **Автоматическое внедрение**: Декораторы и автоматическая инжекция зависимостей
  - **Health Checks**: Встроенная диагностика состояния системы

- 🎯 **Strategy Pattern для AI Провайдеров**: Легкое добавление новых AI сервисов
  - **Унифицированный интерфейс**: `IAIProvider` для всех AI провайдеров
  - **Mistral/OpenAI/Claude**: Готовые реализации популярных AI сервисов
  - **Модульная архитектура**: Новые провайдеры добавляются без изменения кода

- 🖥️ **Advanced CLI Interface**: Современный CLI с множественными командами
  - **Команда `debug`**: Основной анализ ошибок тестов
  - **Команда `info`**: Информация о системе и конфигурации
  - **Команда `setup`**: Интерактивная настройка проекта
  - **Команда `--help`**: Подробная справка по всем возможностям

### Changed
- 🔧 **Модульная структура проекта**: Переход от монолита к четкому разделению слоев
  - **Domain-Driven Design**: Rich domain entities с бизнес-логикой
  - **Разделение ответственности**: Каждый слой имеет четкую роль
  - **Слабая связанность**: Компоненты взаимодействуют через интерфейсы

- 📊 **Enhanced Error Analysis**: Улучшенный анализ ошибок с доменной логикой
  - **TestError entity**: Автоматическое определение типа ошибки, серьезности, ключевых слов
  - **Smart matching**: Интеллектуальное сопоставление ошибок с тестами
  - **Relevance scoring**: Система оценки релевантности для точного прикрепления

- 🎨 **Reporter Architecture**: Модульная система репортеров
  - **HTMLReporter**: Обновленная интеграция с Playwright HTML отчетами
  - **AllureReporter**: Улучшенная интеграция с Allure Framework
  - **MarkdownReporter**: Новый репортер для Markdown отчетов
  - **ReporterManager**: Централизованное управление всеми репортерами

### Technical
- 🏗️ **Clean Architecture Layers**: Четырехслойная архитектура по принципам Uncle Bob
  - **Инверсия зависимостей**: Infrastructure зависит от Domain, а не наоборот
  - **Use Cases**: Изолированная бизнес-логика в Application слое
  - **Entity-driven design**: Богатые доменные сущности с методами и валидацией

- 🔧 **Advanced DI Container**: Профессиональный IoC контейнер
  - **Lazy loading**: Создание объектов по требованию
  - **Circular dependency detection**: Защита от циклических зависимостей
  - **Middleware pipeline**: Расширяемая система middleware
  - **Registration validation**: Проверка корректности регистрации зависимостей

- 🔌 **MCP Protocol Implementation**: Полноценная поддержка Model Context Protocol
  - **WebSocket client**: Асинхронное подключение к MCP серверам
  - **Snapshot formats**: Поддержка accessibility, full, interactive форматов
  - **Error handling**: Graceful fallback при недоступности MCP
  - **Performance optimization**: Кэширование и фильтрация DOM элементов

- 📦 **Legacy Compatibility Layer**: Обеспечение обратной совместимости
  - **Legacy adapters**: Адаптеры для старых компонентов
  - **Gradual migration**: Поэтапный переход на новую архитектуру
  - **API compatibility**: Сохранение существующих API для пользователей

### Migration Guide
- 📖 **Для пользователей**: Старые команды `npx playwright-ai` продолжают работать
- 🔧 **Для разработчиков**: Новый API доступен через `src/main.js` и DI контейнер
- ⚙️ **Конфигурация**: Существующие `ai.conf.js` файлы остаются совместимыми
- 🧪 **Тестирование**: Новая архитектура обеспечивает лучшую тестируемость

## [1.3.0] - 2025-01-16

### Fixed
- 🐛 **Allure Integration: AI Responses Now Attach to ALL Failed Tests**: Полностью исправлена проблема прикрепления ответов ИИ только к последнему тесту
  - **Улучшенный алгоритм сопоставления**: Новая система анализа содержимого ошибок и имен файлов для точного соответствия тестам
  - **Анализ содержимого ошибок**: Извлечение ключевых слов, stack trace, сообщений об ошибках из промптов
  - **Анализ имен файлов**: Извлечение ключевых слов из путей к файлам ошибок (включая эмодзи и типы ошибок)
  - **Умная система скоринга**: Приоритизация совпадений по важности (сообщения об ошибках +5, имена тестов +4, stack trace +3)
  - **Обработка всех релевантных тестов**: Вместо ограничения в 3 теста, теперь обрабатываются все подходящие упавшие тесты
  - **Исправлена работа с директориями**: Функция `debugPlaywrightTests` теперь корректно переключается в директорию проекта

### Changed
- 📊 **Улучшенная отчетность**: Подсчет успешно прикрепленных attachment'ов с детальным логированием
- 🎯 **Полное покрытие упавших тестов**: AI ответы теперь прикрепляются ко всем релевантным упавшим тестам (100% покрытие)
- 🔍 **Предотвращение дублирования**: Улучшенная проверка существующих AI attachment'ов

### Technical
- 🏗️ **Новые функции анализа**: `extractFileBasedKeywords()`, `extractErrorTypeFromPath()` для лучшего сопоставления
- 🔧 **Улучшенная обработка путей**: Корректная смена рабочей директории с возвратом в исходную
- ✅ **Возвращаемые значения**: Функция `createAiAttachmentForTest()` теперь возвращает boolean для отслеживания успеха

## [1.2.6] - 2024-12-20

### Fixed
- 🐛 **Allure Integration Logic**: Completely refactored Allure integration for failed tests
  - Fixed logic to work only with failed/broken tests that have actual errors
  - Improved test matching algorithm with keyword scoring system
  - Enhanced attachment creation with unique IDs and proper file naming
  - Added prevention of duplicate AI attachments for the same test
  - Better error handling and debug logging throughout the process

### Changed
- 📊 **Smart Test Selection**: Enhanced algorithm for matching error files to failed tests
  - Keyword-based scoring system for better test-to-error matching
  - Support for multiple failed tests with AI analysis (max 3 tests)
  - Improved attachment content with structured Markdown format
  - Added test status validation to ensure only truly failed tests get AI analysis

### Technical
- 🏗️ **Modular Architecture**: Split attachment creation into separate functions
  - `createAiAttachmentForTest()` for individual test processing
  - `createAiAttachmentContent()` for formatted content generation
  - Better separation of concerns and improved maintainability
  - Enhanced error handling with specific debug messages

## [1.1.9] - 2024-12-20

### Fixed
- 🐛 **TypeScript Configuration Parsing**: Fixed TypeScript config loading issues
  - Improved error handling for empty TypeScript output
  - Added validation for ai_conf export in TypeScript modules
  - Enhanced error messages with actual output for debugging
  - Better handling of tsx execution edge cases

### Technical
- 🔧 **Robust TS Loading**: More reliable TypeScript configuration parsing
- 📝 **Better Debugging**: Enhanced error messages for troubleshooting
- ✅ **Validation**: Added checks for module exports

## [1.1.8] - 2024-12-20

### Fixed
- 🐛 **Configuration Loading Bug**: Fixed missing ai.conf.js import in published package
  - Removed hardcoded import of ai.conf.js from lib/config.js
  - Added dynamic loading for both JavaScript and TypeScript configurations
  - Improved error handling when configuration files are missing
  - Enhanced configuration detection logic

### Technical
- 🔧 **Dynamic Imports**: Both JS and TS configs now use dynamic imports
- 📦 **Package Independence**: Library no longer depends on bundled config files
- ✅ **Better Validation**: Clear error messages when config files are missing

## [1.1.7] - 2024-12-20

### Added
- 🔷 **Native TypeScript Configuration Support**
  - Added automatic loading of `ai.conf.ts` files with full type safety
  - TypeScript configuration has priority over JavaScript
  - Created `ai.conf.example.ts` with complete type definitions
  - Automatic fallback to JavaScript configuration if TypeScript not found

### Changed
- ⚙️ **Enhanced Configuration Loading**
  - Refactored `loadAiConfig()` to be async and support both JS/TS
  - Updated `sendToAI()` to accept configuration as parameter
  - Modified `buildMessages()` to work with dynamic configuration
  - Improved error handling for TypeScript configuration loading

### Technical
- 🔧 **TypeScript Integration**: Uses existing `tsx` dependency for TS execution
- 📝 **Type Safety**: Full TypeScript support with `AiConfig` interface
- 🔄 **Backward Compatibility**: Existing JavaScript configurations continue to work
- 📦 **Package Updates**: Added `ai.conf.example.ts` to published files

## [1.1.6] - 2024-12-20

### Changed
- 📝 **Updated Documentation**: Corrected configuration approach in README.md
  - Removed outdated information about `ai_conf` in `playwright.config.js`
  - Updated all examples to use separate `ai.conf.js` configuration file
  - Clarified that Playwright config should remain clean without AI settings
  - Updated TypeScript examples to use `ai.conf.ts`

### Fixed
- 🐛 **Configuration Documentation**: Fixed misleading information about configuration placement
  - All references now correctly point to `ai.conf.js` instead of embedding in Playwright config
  - Updated troubleshooting and security sections
  - Corrected example outputs and file references

## [1.1.4] - 2024-12-20

### Added
- 🖥️ **Real-time AI Response Streaming**: Added live console output during AI processing
  - Real-time streaming of AI responses to console
  - Visual separators and formatting for better readability
  - Response length information
  - Enhanced processing information (content length, model used, file paths)

### Changed
- 📊 **Enhanced Console Output**: More detailed processing information
  - Shows content length and truncation status
  - Displays AI model being used
  - Shows HTML report paths being updated
  - Added processing delays with countdown
  - Improved success/error reporting per file

### Technical
- 🔄 **Streaming Implementation**: Added `process.stdout.write()` for real-time output
- 📋 **Better User Experience**: Users can now see AI responses as they are generated
- ⏱️ **Processing Transparency**: Clear indication of processing steps and timing

## [1.1.3] - 2024-12-20

### Added
- 🔧 **Enhanced TypeScript Configuration Support**
  - Added `tsx` dependency for proper TypeScript config loading
  - Automatic detection and handling of `.ts` config files
  - Improved error messages for TypeScript configuration issues
  - Created comprehensive troubleshooting guide (`TYPESCRIPT_SUPPORT.md`)

### Fixed
- 🐛 **TypeScript Configuration Loading Error**: Fixed "Unknown file extension .ts" error
  - Implemented proper TypeScript config loading using `tsx`
  - Added fallback mechanisms and clear error messages
  - Enhanced configuration loading with async wrapper for top-level await support

### Changed
- 📝 **Updated Documentation**
  - Enhanced README.md with TypeScript setup instructions
  - Added troubleshooting section for TypeScript issues
  - Created detailed TypeScript support documentation

### Technical
- ⚙️ **Configuration Loading Improvements**
  - Added `isTsxAvailable()` check before loading TypeScript configs
  - Implemented proper async handling in TypeScript config execution
  - Enhanced error handling with specific TypeScript-related messages

## [1.1.2] - 2024-12-20

### Added
- 🔷 **TypeScript Configuration Support**
  - Added support for `playwright.config.ts` files
  - Library now automatically detects both `.js` and `.ts` config files
  - Created `playwright.config.example.ts` for TypeScript users
  
- 🎥 **Demo Video**
  - Added video demonstration in README
  - Shows complete workflow from error detection to AI solution integration

### Changed
- 📝 **Updated Documentation**
  - All references now mention both `.js` and `.ts` config files
  - Updated configuration examples for TypeScript support
  - Enhanced TypeScript setup instructions

### Fixed
- 🔧 **Configuration Loading**: Now properly handles both JavaScript and TypeScript config files

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] - 2024-12-19

### Fixed
- 🐛 **Enhanced Error Handling**: Improved handling of API errors and rate limiting
  - Better error messages for different HTTP status codes (401, 403, 429, 500, 503)
  - Specific guidance for rate limiting issues
  - Correct final status reporting (success/failure)
  - Processing summary with success/error counts

### Changed
- ⚙️ **Increased Default Request Delay**: Changed from 1000ms to 2000ms to reduce rate limiting
- 📝 **Added Troubleshooting Section**: Comprehensive guide for common issues in README.md
- 🔧 **Improved CLI Output**: More informative final status messages

### Technical
- 📊 **Processing Statistics**: Added detailed summary of processed vs failed files
- 🚨 **Better Error Classification**: Specific handling for authentication, rate limiting, and server errors
- ✅ **Accurate Exit Codes**: Proper exit codes based on actual processing results

## [1.1.0] - 2024-12-19

### Added
- 🌍 **Full English Translation**: Complete project localization
  - All documentation translated to English (README.md, CHANGELOG.md, architecture.md, TESTING.md)
  - Code comments and console messages in English
  - AI system messages now in English by default
  - Error messages and user-facing text in English

### Changed
- 🔄 **Updated Default AI Messages**: System prompts now use English
- 📝 **Enhanced Package Description**: More descriptive package.json
- 🏷️ **Extended Keywords**: Added more relevant npm keywords for better discoverability

### Technical
- 💬 **Localized Console Output**: All logging messages now in English
- 🤖 **AI Prompt Updates**: Default AI assistant messages in English
- 📋 **HTML Block Labels**: Error and solution labels in English ("Detected Error", "Recommended Solution")

## [1.0.5] - 2024-12-19

### Added
- 🎨 **New AI Block Design**: Full integration with Playwright styles
  - Modern gradient header in Playwright style
  - Responsive design with mobile device support
  - Semantic HTML markup with proper classes
  - Color coding for errors and solutions

- 🔧 **Enhanced Content Formatting**
  - Automatic markdown processing in AI solutions
  - Code highlighting in backticks
  - Code block formatting with syntax
  - Text splitting into paragraphs for better readability

- 🎯 **Smart Block Placement**
  - Automatic search for optimal insertion point
  - Priority insertion after test result blocks
  - Fallback mechanism for various HTML structures

### Changed
- ♻️ **Completely Refactored updateHtml.js**
  - New architecture with separate formatting functions
  - Improved insertion point search system
  - Safer HTML escaping

- 🎨 **Updated CSS Styles**
  - Compatibility with Playwright color scheme
  - Use of CSS variables and modern techniques
  - Responsive design with media queries

### Fixed
- 🐛 **Correct DOM Integration**: Block now organically integrates into report structure
- 📱 **Mobile Compatibility**: Correct display on all screen sizes
- 🔧 **Security**: Improved escaping of special characters

## [1.0.4] - 2024-12-19

### Added
- 📄 **Enhanced HTML Report Search**
  - Support for standard `playwright-report/index.html` folder
  - Configurable `report_dir` parameter
  - Search in 7 different possible locations
  - Alternative report file names

### Fixed
- 🐛 **HTML Report Search Issue**: Now finds reports in `playwright-report/`
- 🔧 **Improved Search Logic**: Priority search in standard locations

### Changed
- 📝 **Updated Documentation**: Added HTML report search description
- ⚙️ **Extended Configuration**: New `report_dir` parameter

## [1.0.3] - 2024-12-19

### Added
- 🔍 **Extended Error File Search**
  - Support for `error-context.md` files
  - Support for wildcard patterns (`*-error.txt`, `*-error.md`)
  - Configurable file patterns via `error_file_patterns`
  - Automatic HTML report search in different folders

### Fixed
- 🐛 **File Search Issue**: Library now finds `error-context.md` and other formats
- 🔧 **Improved HTML Report Search Logic**: Search in current and parent folders

### Changed
- 📝 **Updated Documentation**: Added description of supported file types
- ⚙️ **Extended Configuration**: New `error_file_patterns` parameter

## [1.0.2] - 2024-12-19

### Added
- 🔷 **TypeScript Support**
  - Added types for `ai_conf` configuration
  - Autocompletion and type checking in IDE
  - Extended `PlaywrightTestConfig` interface

### Fixed
- 🐛 **TypeScript Error**: "ai_conf does not exist on type Config"
  - Added module augmentation for @playwright/test
  - Created AiConfig interface with full type descriptions
  - Updated documentation with TypeScript examples

## [1.0.1] - 2024-12-19

### Added
- 🔧 **Configuration System via playwright.config.js**
  - Full AI configuration through `ai_conf` section
  - Required parameter validation
  - Default values for all optional settings
  
- 📋 **Architectural Documentation**
  - Created `architecture.md` with technical standards
  - Documented coding principles
  - Described execution lifecycle
  
- ⚙️ **Extended Configuration Capabilities**
  - Configurable AI server and model
  - Custom AI messages
  - Configurable results folder
  - Prompt limits and delay settings

### Changed
- 🔄 **Architecture Refactoring**
  - Separated configuration module (`lib/config.js`)
  - Removed hardcoded settings from `sendToAI.js`
  - Updated file search system to use configuration
  
- 📚 **Updated Documentation**
  - README.md with detailed new configuration system description
  - Added configuration parameters table
  - Created configuration example (`playwright.config.example.js`)

### Fixed
- 🐛 **Improved Error Handling**
  - Graceful handling of missing configuration files
  - Informative validation error messages
  - Correct handling of missing directories

## [1.0.0] - 2024-12-18

### Added
- 🚀 **First Library Release**
  - Automatic Playwright error file search
  - AI integration for error analysis
  - HTML report updates with AI solutions
  - CLI interface for execution
  
- 🔧 **Basic Functionality**
  - Recursive search for `copy-prompt.txt` files
  - Streaming AI response processing
  - AI block embedding in HTML reports
  - Rate limiting for API requests
  
- 📦 **Infrastructure**
  - NPM package with CLI command
  - ES6 modules support
  - Basic documentation and examples

## [1.2.6] - 2024-12-20

### Fixed
- 🐛 **Allure Integration Logic**: Completely refactored Allure integration for failed tests
  - Fixed logic to work only with failed/broken tests that have actual errors
  - Improved test matching algorithm with keyword scoring system
  - Enhanced attachment creation with unique IDs and proper file naming
  - Added prevention of duplicate AI attachments for the same test
  - Better error handling and debug logging throughout the process

### Changed
- 📊 **Smart Test Selection**: Enhanced algorithm for matching error files to failed tests
  - Keyword-based scoring system for better test-to-error matching
  - Support for multiple failed tests with AI analysis (max 3 tests)
  - Improved attachment content with structured Markdown format
  - Added test status validation to ensure only truly failed tests get AI analysis

### Technical
- 🏗️ **Modular Architecture**: Split attachment creation into separate functions
  - `createAiAttachmentForTest()` for individual test processing
  - `createAiAttachmentContent()` for formatted content generation
  - Better separation of concerns and improved maintainability
  - Enhanced error handling with specific debug messages 