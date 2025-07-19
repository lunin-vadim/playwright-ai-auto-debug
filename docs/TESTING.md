# 🧪 Local Library Testing

## 📋 Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up API key**:
   ```bash
   echo "API_KEY=your_key" > .env
   ```

3. **Run full test**:
   ```bash
   npm run demo
   ```

## 🔧 Available Commands

### Main Commands
- `npm run test:local` - run library with test data
- `npm run clean:test` - clean AI blocks from HTML reports
- `npm run demo` - full cycle: clean + test

### CLI Commands
- `npx playwright-ai` - run via npm link
- `node test-local.js` - direct run without npm link

## 📁 Test Data

The project contains ready test data:

```
test-results/
├── test-example-1/
│   ├── copy-prompt.txt    # Timeout error
│   └── index.html         # HTML report
└── test-example-2/
    ├── copy-prompt.txt    # Assertion error
    └── index.html         # HTML report
```

## ✅ What to Check

1. **File Search**: Library finds all `copy-prompt.txt` files
2. **API Requests**: Successful requests to AI
3. **HTML Updates**: AI blocks are added to reports
4. **Logging**: Detailed process messages

## 🎯 Expected Result

After running, AI blocks will appear in HTML reports:

```html
<div class="ai-debug">
  <h3>🔍 AI Debug</h3>
  <div>Error: [error text]</div>
  <div>AI Solution: [specific recommendations]</div>
</div>
```

## 🔍 Browser Verification

Open HTML files in browser:
```bash
open test-results/test-example-1/index.html
open test-results/test-example-2/index.html
```

## 🐛 Debugging

### API Issues
- Check `.env` file with API_KEY
- Ensure internet connection

### File Issues
- Make sure `test-results/` folder exists
- Check file access permissions

### Dependency Issues
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📊 Example Successful Output

```
🚀 Starting automatic Playwright test debugging...

🔍 Searching for error files...
✅ Found prompt: test-results/test-example-1/copy-prompt.txt
✅ Found prompt: test-results/test-example-2/copy-prompt.txt
📋 Found 2 error file(s)

📝 Processing 1/2: test-results/test-example-1/copy-prompt.txt
🔁 Sent to AI...
✅ Response received
💾 HTML updated: test-results/test-example-1/index.html

📝 Processing 2/2: test-results/test-example-2/copy-prompt.txt
🔁 Sent to AI...
✅ Response received
💾 HTML updated: test-results/test-example-2/index.html

✅ Debugging completed successfully! 