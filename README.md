# @playwright-ai/auto-debug

🤖 Automatic Playwright test debugging with AI assistance

## 🎥 Demo Video

[![Demo Video](https://img.youtube.com/vi/mva6ktpKOKw/maxresdefault.jpg)](https://youtu.be/mva6ktpKOKw)

Watch the demo to see how the library automatically analyzes Playwright test errors and provides AI-powered solutions integrated directly into your HTML reports.

## 📦 Installation

```bash
npm install @playwright-ai/auto-debug
```

## 🔧 Configuration

### Configuration via playwright.config.js or playwright.config.ts (recommended)

Add the `ai_conf` section to your `playwright.config.js` or `playwright.config.ts`:

```javascript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  // Regular Playwright settings
  testDir: './tests',
  reporter: 'html',
  
  // AI configuration for automatic debugging
  ai_conf: {
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
  }
});
```

### TypeScript Support

For TypeScript projects, you need to install `tsx` to support TypeScript configuration files:

```bash
npm install tsx
```

Then you can use `playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  // Regular Playwright settings
  testDir: './tests',
  reporter: 'html',
  
  // AI configuration for automatic debugging
  ai_conf: {
    api_key: process.env.API_KEY || 'your_api_key_here',
    ai_server: 'https://api.mistral.ai',
    model: 'mistral-medium',
    // ... other parameters
  }
});
```

> ⚠️ **Important**: If you get `Unknown file extension ".ts"` error, either:
> 1. Install `tsx`: `npm install tsx`
> 2. Or rename `playwright.config.ts` to `playwright.config.js`

See [TYPESCRIPT_SUPPORT.md](./TYPESCRIPT_SUPPORT.md) for detailed troubleshooting.

### Alternative configuration via .env

Create a `.env` file in the project root:

```env
API_KEY=your_api_key_here
```

> ⚠️ When using configuration via `playwright.config.js` or `playwright.config.ts`, settings from `.env` are ignored

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

1. **Load Configuration**: Reads settings from `playwright.config.js` or `playwright.config.ts`
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
✅ AI configuration loaded from playwright.config.js

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

## ⚙️ Requirements

- Node.js >= 16.0.0
- API key for AI service
- Playwright tests with generated reports
- `playwright.config.js` or `playwright.config.ts` file with `ai_conf` section

## 🔒 Security

- API key is stored in project configuration
- Add `playwright.config.js` or `playwright.config.ts` to `.gitignore` if using private keys
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

## ⚠️ Важно: изменение конфигурации ai_conf (с версии X.Y.Z)

Начиная с версии X.Y.Z, объект `ai_conf` вынесен в отдельный файл `ai.conf.js`.

- Не добавляйте `ai_conf` в основной объект Playwright-конфига (`defineConfig`).
- Вместо этого создайте файл `ai.conf.js` в корне проекта и экспортируйте объект `ai_conf` оттуда:

```js
// ai.conf.js
export const ai_conf = {
  // ... параметры ...
};
```

- В файле `playwright.config.js` просто импортируйте этот объект при необходимости:

```js
import { ai_conf } from './ai.conf.js';
```

Это изменение важно для корректной работы типизации Playwright и предотвращения ошибок. 