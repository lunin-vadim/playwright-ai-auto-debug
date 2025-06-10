# Architecture of playwright-ai-auto-debug project

## 🏗️ Architectural Principles

### 1. Modularity
- Each module is responsible for one specific task
- Clear separation of responsibilities between components
- Minimal coupling between modules

### 2. Configurability
- All settings are moved to configuration file
- Default values for all optional parameters
- Validation of required parameters

### 3. Error Handling
- Graceful degradation when files are missing
- Informative error messages
- Continue working when errors occur in individual files

## 📁 Project Structure

```
playwright-ai-auto-debug/
├── bin/
│   └── index.js              # CLI entry point
├── lib/
│   ├── index.js              # Main logic
│   ├── config.js             # Configuration management
│   ├── extractPrompts.js     # Error file search
│   ├── sendToAI.js          # AI API interaction
│   └── updateHtml.js         # HTML report updates
├── package.json
├── README.md
├── architecture.md
└── playwright.config.example.js
```

## 🔧 Technical Solutions

### Configuration System
- **File**: `lib/config.js`
- **Principle**: Configuration through user's `playwright.config.js`
- **Fallback**: Default values for all optional parameters
- **Validation**: Required field validation on load

```javascript
// Configuration structure
ai_conf: {
  api_key: string,              // Required
  ai_server: string,            // Default: 'https://api.mistral.ai'
  model: string,                // Default: 'mistral-medium'
  results_dir: string,          // Default: 'test-results'
  max_prompt_length: number,    // Default: 2000
  request_delay: number,        // Default: 1000
  messages: Array<Object>       // Default: system message
}
```

### Error File Search
- **File**: `lib/extractPrompts.js`
- **Algorithm**: Recursive search for `copy-prompt.txt` files
- **Path**: Configurable through `results_dir`
- **Handling**: Graceful handling of missing directories

### AI Integration
- **File**: `lib/sendToAI.js`
- **Protocol**: HTTP REST API with streaming support
- **Configuration**: Fully configurable endpoint and model
- **Rate limiting**: Configurable delay between requests

### Report Updates
- **File**: `lib/updateHtml.js`
- **Approach**: DOM manipulation through cheerio
- **Style**: Embedded CSS styles for independence
- **Security**: HTML content escaping

## 📋 Coding Standards

### JavaScript/ES6+
- **Modules**: ES6 modules (`import/export`)
- **Async/Await**: For all asynchronous operations
- **Destructuring**: Use where applicable
- **Template literals**: For strings with variables

### Naming
- **Functions**: camelCase, verbs (`loadConfig`, `sendToAI`)
- **Variables**: camelCase, nouns (`apiKey`, `configPath`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_CONFIG`)
- **Files**: camelCase (`sendToAI.js`)

### Documentation
- **JSDoc**: For all public functions
- **Comments**: Explanation of complex logic
- **README**: Up-to-date usage documentation
- **Examples**: Working configuration examples

### Error Handling
```javascript
// Standard error handling pattern
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  if (error.code === 'EXPECTED_ERROR') {
    console.log('⚠️  Expected error:', error.message);
    return defaultValue;
  }
  throw new Error(`Descriptive message: ${error.message}`);
}
```

### Logging
- **Emojis**: For visual separation of message types
- **Levels**: 
  - `🚀` - Process start
  - `⚙️` - Configuration
  - `🔍` - Search/analysis
  - `✅` - Success
  - `⚠️` - Warning
  - `❌` - Error
  - `💾` - Data saving

## 🔄 Execution Lifecycle

1. **Initialization** (`bin/index.js`)
   - CLI command launch
   - Global error handling

2. **Configuration Loading** (`lib/config.js`)
   - Search for `playwright.config.js`
   - Validation and applying defaults
   - Building messages for AI

3. **Error Search** (`lib/extractPrompts.js`)
   - Recursive search in `results_dir`
   - Reading `copy-prompt.txt` content
   - Preparing data for processing

4. **AI Processing** (`lib/sendToAI.js`)
   - Sending request to AI API
   - Processing streaming response
   - Returning complete solution

5. **Report Updates** (`lib/updateHtml.js`)
   - Parsing HTML reports
   - Adding AI block
   - Saving updated file

## 🧪 Testing Principles

### Test Modularity
- Each module is tested independently
- Mocking external dependencies
- Testing edge cases

### Integration Tests
- Full execution cycle
- Testing with real configurations
- Error handling verification

## 🔒 Security

### API Keys
- Never hardcode in code
- Store in user configuration
- Mask in logs

### Input Data Validation
- Check file existence
- Configuration validation
- HTML content sanitization

## 📦 Dependency Management

### Principles
- Minimal number of dependencies
- Use only verified packages
- Regular security updates

### Current Dependencies
- `cheerio` - DOM manipulation
- `dotenv` - Environment variables (legacy support)
- `glob` - File pattern matching (if used)

## 🚀 Deployment and Publishing

### Versioning
- Semantic Versioning (semver)
- MAJOR.MINOR.PATCH format
- Changelog for each version

### NPM Publishing
- Test verification before publishing
- Documentation updates
- Release tagging in Git

### GitHub
- Structured commit messages
- Pull requests for changes
- Issues for tracking bugs and features 