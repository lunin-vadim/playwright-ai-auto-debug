# Changelog

All notable changes to this project will be documented in this file.

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