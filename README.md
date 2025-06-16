# @playwright-ai/auto-debug

🤖 Automatic Playwright test debugging with AI assistance

[![npm version](https://img.shields.io/npm/v/playwright-ai-auto-debug.svg)](https://www.npmjs.com/package/playwright-ai-auto-debug)

<!-- ## 🎥 Demo Video

[![Demo Video](https://img.youtube.com/vi/mva6ktpKOKw/maxresdefault.jpg)](https://youtu.be/mva6ktpKOKw) -->

Watch the demo to see how the library automatically analyzes Playwright test errors and provides AI-powered solutions integrated directly into your HTML reports.

## 📦 Installation

```bash
npm install @playwright-ai/auto-debug
```

## 🔧 Configuration

### Configuration via ai.conf.js (recommended)

Create an `ai.conf.js` file in your project root:

```javascript
// ai.conf.js
export const ai_conf = {
  // Required parameters
  api_key: 'your_api_key_here',
  
  // Optional parameters
  ai_server: 'https://api.mistral.ai',        // AI server URL
  model: 'mistral-medium',                    // AI model
  results_dir: 'test-results',                // Test results folder
  max_prompt_length: 2000,                    // Maximum prompt length
  request_delay: 1000,                        // Delay between requests (ms)
  
  // Custom AI messages (optional)
  messages: [
    {
      role: 'system',
      content: 'You are an AI assistant for debugging Playwright tests. Analyze errors and suggest specific solutions in English. Be concise and to the point.'
    },
    // You can add additional system messages
    {
      role: 'system', 
      content: 'When analyzing errors, consider our project specifics: we use React, TypeScript and test e-commerce functionality.'
    }
  ]
};
```

Your `playwright.config.js` or `playwright.config.ts` remains clean:

```javascript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  // Regular Playwright settings
  testDir: './tests',
  reporter: 'html',
  // No ai_conf here - it's in ai.conf.js
});
```

### TypeScript Support

For TypeScript projects, you can create `ai.conf.ts` with full type safety:

```typescript
// ai.conf.ts
import type { AiConfig } from 'playwright-ai-auto-debug';

export const ai_conf: AiConfig = {
  api_key: process.env.API_KEY || 'your_api_key_here',
  ai_server: 'https://api.mistral.ai',
  model: 'mistral-medium',
  results_dir: 'test-results',
  report_dir: 'playwright-report',
  max_prompt_length: 2000,
  request_delay: 1000,
  error_file_patterns: [
    'copy-prompt.txt',
    'error-context.md',
    'error.txt',
    'test-error.md',
    '*-error.txt',
    '*-error.md'
  ],
  messages: [
    {
      role: 'system',
      content: 'Ты AI помощник по отладке Playwright тестов. Анализируй ошибки и предлагай конкретные решения.'
    }
  ]
};
```

**Автоматическое определение конфигурации:**
- Если существует `ai.conf.ts` - загружается TypeScript конфигурация
- Если только `ai.conf.js` - загружается JavaScript конфигурация
- TypeScript конфигурация имеет приоритет над JavaScript

> ⚠️ **Важно**: `tsx` уже включен в зависимости пакета, дополнительная установка не требуется.

### Alternative configuration via .env

Create a `.env` file in the project root:

```env
API_KEY=your_api_key_here
```

> ⚠️ When using configuration via `ai.conf.js` or `ai.conf.ts`, settings from `.env` are ignored

## 🚀 Usage

### CLI command

```bash
npx playwright-ai
```

### Via npm scripts

Add to `package.json`:

```json
{
  "scripts": {
    "debug:ai": "npx playwright-ai"
  }
}
```

Then run:

```bash
npm run debug:ai
```

## ⚙️ Configuration Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `api_key` | string | ✅ | - | API key for AI service |
| `ai_server` | string | ❌ | `https://api.mistral.ai` | AI server URL |
| `model` | string | ❌ | `mistral-medium` | AI model for analysis |
| `results_dir` | string | ❌ | `test-results` | Test results folder |
| `report_dir` | string | ❌ | `playwright-report` | HTML reports folder |
| `max_prompt_length` | number | ❌ | `2000` | Maximum prompt length |
| `request_delay` | number | ❌ | `2000` | Delay between requests (ms) |
| `error_file_patterns` | array | ❌ | See below | Error file patterns |
| `save_ai_responses` | boolean | ❌ | `false` | Save AI responses to Markdown |
| `ai_responses_dir` | string | ❌ | `ai-responses` | Directory for AI responses |
| `allure_integration` | boolean | ❌ | `false` | Enable Allure integration |
| `allure_results_dir` | string | ❌ | `allure-results` | Allure results directory |
| `messages` | array | ❌ | System message | Custom AI messages |

### HTML Reports Search

The library automatically searches for HTML reports in the following locations (in priority order):

1. `playwright-report/index.html` - standard Playwright location
2. `index.html` - in project root  
3. `test-results/index.html` - in results folder
4. In the same folder as the error file
5. In the parent folder of the error file
6. Alternative names: `report.html`, `test-report.html`

You can configure the reports folder via the `report_dir` parameter:

```javascript
ai_conf: {
  api_key: 'your_key',
  report_dir: 'my-custom-reports',  // Will search in my-custom-reports/index.html
  results_dir: 'test-results'
}
```

### Supported Error Files

By default, the library searches for the following file types:

- `copy-prompt.txt` - standard Playwright file
- `error-context.md` - alternative format with error context
- `error.txt` - simple text file with error
- `test-error.md` - Markdown file with error description
- `*-error.txt` - any files ending with `-error.txt`
- `*-error.md` - any files ending with `-error.md`

You can configure custom patterns via the `error_file_patterns` parameter:

```javascript
ai_conf: {
  api_key: 'your_key',
  error_file_patterns: [
    'my-custom-error.txt',
    'failure-*.md',
    'test-results.json'
  ]
}
```

## 🔍 How It Works

1. **Load Configuration**: Reads settings from `ai.conf.js` or `ai.conf.ts`
2. **Find Errors**: Automatically finds all `copy-prompt.txt` files in the specified folder
3. **AI Analysis**: Sends error content to AI for solutions
4. **Update Reports**: Adds error and solution block to Playwright HTML reports

## 📋 Example Result

After running the command, a stylish block integrated with Playwright design will appear in your HTML reports:

```html
<div class="ai-debug-section">
  <h2 class="ai-debug-header">🤖 AI Debug Assistant</h2>
  <div class="ai-debug-content">
    <div class="ai-error-section">
      <div class="ai-section-title">❌ Detected Error</div>
      <div class="ai-error-details">Error: Timeout while waiting for selector...</div>
    </div>
    <div class="ai-solution-section">
      <div class="ai-section-title ai-solution-title">💡 Recommended Solution</div>
      <div class="ai-solution-content">
        <p>Try adding a wait before this step...</p>
      </div>
    </div>
  </div>
</div>
```

### 🎨 Design Features

- **Playwright Integration**: Block uses the same styles and color scheme as standard reports
- **Responsive**: Automatically adapts to screen size
- **Code Formatting**: Markdown support, code highlighting in backticks
- **Readability**: Clear separation of error and solution with color coding
- **Modern Design**: Gradients, shadows and rounded corners in Playwright style

## 📊 Execution Logs

The tool provides detailed real-time output during processing:

```bash
🚀 Starting automatic Playwright test debugging...

⚙️  Loading AI configuration...
📋 Loading JavaScript configuration...
✅ AI configuration loaded from ai.conf.js

🔍 Searching for error files...
📄 Found HTML report: test-results/index.html
✅ Found error file: test-results/copy-prompt.txt
📋 Found 1 error file(s)

📝 Processing 1/1: test-results/copy-prompt.txt
📊 Content length: 398 chars
🎯 Using model: mistral-medium
🔁 Sent to AI...
🤖 AI Response:
──────────────────────────────────────────────────
The error indicates that Playwright couldn't find the login button...
[Real-time streaming of AI response continues here]
──────────────────────────────────────────────────
✅ Response received (1714 chars)
📄 Updating HTML report: test-results/index.html
✅ Successfully processed file 1/1

📊 Processing Summary:
   ✅ Successfully processed: 1/1

✅ Debugging completed successfully!
```

### 🖥️ Real-time Features

- **Live AI Streaming**: See AI responses as they are generated in real-time
- **Processing Details**: Content length, model information, file paths
- **Visual Separators**: Clear formatting with lines and emojis
- **Progress Tracking**: File-by-file processing status
- **Response Metrics**: Character count and processing time information

## 📊 Allure Integration

The library provides seamless and invisible integration with Allure reports - AI responses are automatically attached to failed tests without creating additional test results.

### How It Works

```mermaid
graph TD
    A["🧪 Playwright Tests"] --> B["❌ Failed Tests"]
    A --> C["✅ Passed Tests"]
    
    B --> D["📄 Error Files<br/>copy-prompt.txt<br/>checkout-error.txt"]
    
    D --> E["🤖 AI Analysis"]
    E --> F["💡 AI Solutions<br/>- Login timeout fix<br/>- Checkout selector fix"]
    
    F --> G["📎 Smart Test Matching"]
    G --> H["🎯 Keyword Scoring<br/>Match errors to tests"]
    
    H --> I["🔗 Attach to Failed Tests"]
    I --> J["📊 Allure Report"]
    J --> K["🤖 AI Debug Analysis<br/>attached only to failed tests"]
    
    C --> L["No AI Analysis<br/>for passed tests"]
    
    style B fill:#ffe6e6
    style C fill:#e6ffe6
    style E fill:#e6f3ff
    style G fill:#fff9e6
    style K fill:#fff2e6
```

### Enable Allure Integration

Add to your `ai.conf.js` or `ai.conf.ts`:

```javascript
export const ai_conf = {
  api_key: 'your_api_key',
  allure_integration: true,
  allure_results_dir: 'allure-results',
  // ... other settings
};
```

### Playwright Configuration

Configure Playwright to use Allure reporter in `playwright.config.js`:

```javascript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    ['html'],
    ['allure-playwright', {
      detail: true,
      outputFolder: 'allure-results',
      suiteTitle: false
    }]
  ],
  // ... other settings
});
```

### Generate Allure Report

After running tests and AI analysis:

```bash
# Run your tests
npx playwright test

# Run AI analysis
npx playwright-ai

# Generate Allure report
npx allure generate allure-results -o allure-report

# Open report
npx allure open allure-report
```

### What Gets Added to Failed Tests

- 🤖 **AI Debug Analysis Attachment**: Markdown file with AI solution attached to the failed test
- 🏷️ **Smart Label**: `ai-analyzed: true` label for filtering (doesn't affect report structure)
- 📋 **Rich Content**: Original error details, stack traces, and AI recommendations in readable format
- 🎯 **Smart Matching**: Intelligent algorithm matches error files to the most relevant failed tests
- 🚫 **No Duplicates**: Prevents multiple AI attachments for the same test

### Allure Report Features

- 📎 **Seamless Attachments**: AI analysis appears as a natural part of failed test results
- 🔍 **Smart Filtering**: Filter tests with AI analysis using the `ai-analyzed` label
- 📊 **No Clutter**: Report structure remains clean and professional
- 🤖 **Rich Analysis**: Detailed AI recommendations right where you need them
- 🎯 **Precise Targeting**: Only failed tests with actual errors get AI analysis
- 📋 **Structured Content**: Well-formatted Markdown with error details and solutions

### Example Integration

When a test fails, you'll see:
- Original test failure information
- Screenshots and traces (if configured)
- **🤖 AI Debug Analysis** attachment with solution

The AI attachment contains:
```markdown
# 🤖 AI Debug Analysis

**Test:** Login should work with valid credentials
**Status:** failed
**Generated:** 15.01.2024, 14:30:25

## 🔍 Error Details
```
[Original error details]
```

## 💡 AI Solution
[AI recommendations and solutions]
```

## ⚙️ Requirements

- Node.js >= 16.0.0
- API key for AI service
- Playwright tests with generated reports
- `ai.conf.js` or `ai.conf.ts` file with AI configuration

## 🔒 Security

- API key is stored in project configuration
- Add `ai.conf.js` or `ai.conf.ts` to `.gitignore` if using private keys
- Rate limiting is respected for API requests

## 🐛 Troubleshooting

### Rate Limiting (429 Error)
If you encounter "Too Many Requests" errors:

```javascript
ai_conf: {
  api_key: 'your_key',
  request_delay: 3000,  // Increase delay between requests
  // ... other settings
}
```

**Solutions:**
- Increase `request_delay` (try 3000-5000ms)
- Process fewer files at once
- Wait before retrying
- Check your API plan limits

### Authentication Errors (401/403)
- Verify your API key is correct
- Check API key permissions
- Ensure sufficient credits/quota

### Network Issues
- Check internet connection
- Verify AI server URL
- Try again later if server is unavailable

## 📄 License

MIT 