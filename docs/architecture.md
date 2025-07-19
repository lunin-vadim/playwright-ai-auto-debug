# Architecture of playwright-ai-auto-debug project

## 🏗️ Architectural Principles

### 1. Modularity & Type Safety
- Each module is responsible for one specific task
- Clear separation of responsibilities between components
- Full TypeScript support with type definitions
- Minimal coupling between modules with well-defined interfaces

### 2. Configuration Flexibility
- Support for both JavaScript (`ai.conf.js`) and TypeScript (`ai.conf.ts`) configurations
- TypeScript configuration has priority over JavaScript
- Full type safety for TypeScript configurations
- Default values for all optional parameters
- Runtime validation of required parameters

### 3. Asynchronous Architecture
- Async configuration loading for both JS and TS
- Dynamic configuration passing between modules
- Non-blocking error processing
- Graceful degradation when files are missing

### 4. Error Handling & Resilience
- Comprehensive error handling for TypeScript compilation
- Informative error messages with context
- Continue working when errors occur in individual files
- Fallback mechanisms for configuration loading

## 📁 Project Structure

```
playwright-ai-auto-debug/
├── bin/
│   └── index.js                    # CLI entry point
├── lib/
│   ├── index.js                    # Main orchestration logic
│   ├── config.js                   # Configuration management (JS/TS)
│   ├── extractPrompts.js           # Error file search and extraction
│   ├── sendToAI.js                 # AI API interaction
│   └── updateHtml.js               # HTML report updates
├── types/
│   ├── index.d.ts                  # TypeScript type definitions
│   └── global.d.ts                 # Global type extensions
├── ai.conf.example.ts              # TypeScript configuration example
├── package.json
├── README.md
└── architecture.md
```

## 🔧 Technical Solutions

### Configuration System (v1.1.7+)
- **File**: `lib/config.js`
- **Principle**: Separate configuration files with automatic detection
- **Priority**: TypeScript (`ai.conf.ts`) > JavaScript (`ai.conf.js`)
- **Loading**: Asynchronous with `tsx` for TypeScript execution
- **Validation**: Runtime validation with detailed error messages

```javascript
// Configuration loading flow
async function loadAiConfig() {
  if (existsSync('./ai.conf.ts')) {
    // Load TypeScript config using tsx
    return await loadTsConfig('./ai.conf.ts');
  } else {
    // Fallback to JavaScript config
    return ai_conf;
  }
}
```

#### TypeScript Configuration Structure
```typescript
import type { AiConfig } from 'playwright-ai-auto-debug';

export const ai_conf: AiConfig = {
  api_key: string,                    // Required
  ai_server?: string,                 // Default: 'https://api.mistral.ai'
  model?: string,                     // Default: 'mistral-medium'
  results_dir?: string,               // Default: 'test-results'
  report_dir?: string,                // Default: 'playwright-report'
  max_prompt_length?: number,         // Default: 2000
  request_delay?: number,             // Default: 1000
  error_file_patterns?: string[],     // Default: predefined patterns
  messages?: Array<{                  // Default: system message
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>
}
```

### TypeScript Integration
- **Execution**: Uses `tsx` for TypeScript file execution
- **Process**: Spawns separate process for TS config loading
- **Error Handling**: Comprehensive TypeScript compilation error handling
- **Type Safety**: Full IntelliSense support for configuration

```javascript
// TypeScript config loading implementation
async function loadTsConfig(configPath) {
  return new Promise((resolve, reject) => {
    const tsxProcess = spawn('npx', ['tsx', '--eval', `
      import('${pathToFileURL(configPath).href}').then(module => {
        console.log(JSON.stringify(module.ai_conf));
      }).catch(err => {
        console.error('Error:', err.message);
        process.exit(1);
      });
    `], { stdio: ['pipe', 'pipe', 'pipe'] });
    
    // Handle process output and errors
  });
}
```

### Error File Search & Processing
- **File**: `lib/extractPrompts.js`
- **Algorithm**: Configurable pattern-based search
- **Patterns**: Extensible through `error_file_patterns`
- **Path**: Configurable through `results_dir`
- **Handling**: Graceful handling of missing directories and files

### AI Integration
- **File**: `lib/sendToAI.js`
- **Architecture**: Configuration-driven API interaction
- **Protocol**: HTTP REST API with streaming support
- **Configuration**: Dynamic configuration passing
- **Rate limiting**: Configurable delay between requests

```javascript
// Updated AI integration signature
async function sendToAI(promptContent, config) {
  // Uses dynamic configuration instead of global
}
```

### Report Updates
- **File**: `lib/updateHtml.js`
- **Approach**: DOM manipulation through cheerio
- **Style**: Embedded CSS styles for independence
- **Security**: HTML content escaping
- **Integration**: Seamless integration with Playwright report styles

## 📋 Coding Standards

### JavaScript/ES6+ with TypeScript Support
- **Modules**: ES6 modules (`import/export`)
- **Async/Await**: For all asynchronous operations
- **TypeScript**: Full type definitions and examples
- **Configuration**: Dynamic configuration passing
- **Error Handling**: Comprehensive async error handling

### Type Definitions
- **Interface**: `AiConfig` for configuration structure
- **Global Types**: Extensions for Playwright types
- **Export**: Proper TypeScript module exports
- **Compatibility**: Both CommonJS and ES modules support

### Naming Conventions
- **Functions**: camelCase, verbs (`loadAiConfig`, `sendToAI`)
- **Variables**: camelCase, nouns (`apiKey`, `configPath`)
- **Types**: PascalCase (`AiConfig`, `MessageRole`)
- **Files**: camelCase (`sendToAI.js`, `ai.conf.example.ts`)

### Documentation
- **JSDoc**: For all public functions with type information
- **TypeScript**: Inline type documentation
- **Examples**: Both JavaScript and TypeScript examples
- **README**: Up-to-date with TypeScript support

### Error Handling Patterns
```javascript
// Async configuration loading with fallback
try {
  let config;
  
  if (existsSync('./ai.conf.ts')) {
    console.log('📝 Loading TypeScript configuration from ai.conf.ts');
    config = await loadTsConfig('./ai.conf.ts');
  } else {
    console.log('📝 Loading JavaScript configuration from ai.conf.js');
    config = ai_conf;
  }
  
  // Validate and return
  if (!config.api_key) {
    throw new Error('api_key is required in ai_conf');
  }
  
  return config;
} catch (error) {
  throw new Error(`Configuration loading error: ${error.message}`);
}
```

## 🔄 Execution Lifecycle (v1.1.7)

1. **Initialization** (`bin/index.js`)
   - CLI command launch
   - Global error handling setup

2. **Configuration Detection & Loading** (`lib/config.js`)
   - Check for `ai.conf.ts` (priority)
   - Fallback to `ai.conf.js`
   - TypeScript compilation and execution (if needed)
   - Validation and applying defaults
   - Building messages for AI

3. **Error Search** (`lib/extractPrompts.js`)
   - Pattern-based search in `results_dir`
   - Reading error file content
   - Preparing data for processing

4. **AI Processing** (`lib/sendToAI.js`)
   - Dynamic configuration usage
   - Sending request to AI API
   - Processing streaming response
   - Returning complete solution

5. **Report Updates** (`lib/updateHtml.js`)
   - Parsing HTML reports
   - Adding AI block with Playwright styling
   - Saving updated file

## 🧪 Testing Strategy

### Configuration Testing
- JavaScript configuration loading
- TypeScript configuration loading
- Fallback mechanism testing
- Error handling for invalid configurations

### Integration Tests
- Full execution cycle with both config types
- TypeScript compilation error handling
- Real configuration testing

### Type Safety Testing
- TypeScript configuration validation
- IntelliSense support verification
- Type definition accuracy

## 🔒 Security Considerations

### API Keys
- Never hardcode in code or examples
- Environment variable support
- Secure configuration file handling
- Mask in logs and error messages

### TypeScript Execution
- Sandboxed `tsx` execution
- Process isolation for TS compilation
- Error output sanitization
- Secure file path handling

### Input Validation
- Configuration structure validation
- File existence checks
- HTML content sanitization
- Path traversal prevention

## 📦 Dependency Management

### Core Dependencies
- `cheerio` - DOM manipulation
- `dotenv` - Environment variables
- `glob` - File pattern matching
- `tsx` - TypeScript execution (built-in)

### TypeScript Support
- Built-in `tsx` dependency
- No additional TypeScript installation required
- Automatic TypeScript detection and execution

## 🚀 Deployment and Publishing

### Version Management
- Semantic Versioning (semver)
- Major version for breaking changes (like v1.1.7 architecture changes)
- Comprehensive changelog maintenance

### NPM Publishing Process
1. Version bump in `package.json`
2. Update `CHANGELOG.md`
3. Test both JS and TS configurations
4. Verify TypeScript type definitions
5. Publish to NPM
6. Tag release in Git

### GitHub Workflow
- Structured commit messages
- Feature branches for major changes
- Comprehensive PR reviews
- Automated testing (future)

## 🔧 Allure Integration Architecture (v1.2.6)

### Smart Test Matching System
- **Keyword Scoring**: Algorithm that matches error files to failed tests using keyword analysis
- **Multiple Test Support**: Can attach AI analysis to multiple relevant failed tests (max 3)
- **Duplicate Prevention**: Checks for existing AI attachments before creating new ones
- **Status Validation**: Only processes tests with `failed` or `broken` status that have actual error details

### Attachment Creation Process
```javascript
// Modular attachment creation
async function createAiAttachmentForTest(testData, response, originalPrompt, allureDir) {
  // 1. Check for existing AI attachments
  // 2. Generate unique attachment ID
  // 3. Create formatted Markdown content
  // 4. Save attachment file
  // 5. Update test result with attachment reference
  // 6. Add ai-analyzed label for filtering
}
```

### Content Structure
- **Test Information**: Name, status, full name, analysis timestamp
- **Error Details**: Original error message and stack trace from test results
- **Context**: Original error prompt from error files
- **AI Solution**: Formatted AI recommendations and solutions
- **Metadata**: Generation timestamp and AI assistant attribution

## 🔮 Future Architecture Considerations

### Potential Enhancements
- Configuration schema validation
- Plugin system for custom AI providers
- Advanced TypeScript features (decorators, etc.)
- Configuration file hot-reloading
- Multi-language AI response support
- Advanced test-to-error matching algorithms
- Batch processing for multiple failed tests

### Scalability
- Modular AI provider system
- Configuration caching
- Parallel error processing
- Advanced error pattern recognition
- Allure integration performance optimization

## 📊 Architecture Metrics

### Performance
- Async configuration loading: ~100-500ms
- TypeScript compilation: ~200-800ms (first time)
- Configuration caching for subsequent runs
- Minimal memory footprint

### Compatibility
- Node.js 16+ support
- Both CommonJS and ES modules
- JavaScript and TypeScript projects
- Cross-platform compatibility (Windows, macOS, Linux) 