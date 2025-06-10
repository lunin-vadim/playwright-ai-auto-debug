# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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