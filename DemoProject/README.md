# 🎯 Playwright AI Auto-Debug Demo Project

Demo project showcasing `playwright-ai-auto-debug` capabilities with Allure integration.

## 🚀 Quick Start

### 1. Install dependencies
```bash
cd DemoProject
npm install
```

### 2. Install browsers
```bash
npx playwright install
```

### 3. Configure API key
```bash
# Copy environment file
cp env.example .env

# Edit .env and set your API key
# API_KEY=your-mistral-api-key-here
```

### 4. Run full demonstration
```bash
npm run demo:full
```

This command will:
1. Run tests (5 will fail, 1 will pass)
2. AI error analysis
3. Generate Allure report
4. Open report in browser

## 📋 Available commands

### Testing
- `npm test` - run all tests
- `npm run test:headed` - run with visible browser
- `npm run test:debug` - run in debug mode

### AI analysis
- `npm run ai:debug` - run AI error analysis (standard mode)
- `npx playwright-ai --use-mcp` - run with MCP DOM snapshots

### Allure reports
- `npm run allure:generate` - generate report
- `npm run allure:open` - open report
- `npm run allure:serve` - serve report

### Utilities
- `npm run clean` - clean all results

## 🧪 Demo tests

The project contains 6 tests:

### ✅ Passing test
- **Successful navigation test** - main navigation check

### ❌ Failing tests (for AI analysis demonstration)
- **Login timeout simulation** - element search timeout
- **Wrong title assertion** - incorrect title check
- **Missing checkout button** - missing element
- **API response timeout** - network timeout
- **Form validation error** - form validation error

## 🤖 AI integration

### What happens automatically:
1. **Tests fail** and create error files (`error-context.md`)
2. **AI analyzes** each error and suggests solutions
3. **Allure integration** attaches AI analysis to failed tests
4. **Smart matching** finds the most suitable tests for each error

### In the Allure report you'll see:
- 🤖 **AI Debug Analysis** - attachments with solutions for each failed test
- 🏷️ **ai-analyzed: true** - label for filtering tests with AI analysis
- 📋 **Structured content** - error details and specific recommendations

## 📊 Project structure

```
DemoProject/
├── package.json              # Dependencies and scripts
├── playwright.config.js      # Playwright + Allure configuration
├── ai.conf.js               # AI configuration with Allure integration enabled
├── env.example              # Environment file example
├── tests/
│   └── demo.spec.js         # Demo tests
├── allure-results/          # Allure results (created automatically)
├── allure-report/           # Allure HTML report (created automatically)
├── test-results/            # Playwright results (created automatically)
└── ai-responses/            # AI responses (created automatically)
```

## 🔧 Configuration

### AI configuration (`ai.conf.js`)
- ✅ **Allure integration enabled** (`allure_integration: true`)
- 🎯 **Smart matching** of tests and errors
- 📝 **AI response saving** to separate files
- 🚫 **Duplicate attachment prevention**

### Playwright configuration
- 📊 **Allure reporter** configured with detailed information
- 🎥 **Screenshots and videos** on test failure
- 🔍 **Traces** for debugging
- 🌐 **Multi-browser** support (Chromium, Firefox, WebKit)

## 🎯 Expected result

After running `npm run demo:full`:

1. **5 tests will fail**, 1 will pass
2. **AI will analyze** each error
3. **Allure report** will open in browser
4. The report will show **AI Debug Analysis** attachments for each failed test

## 🔍 What to check in Allure report

- [ ] All failed tests have "🤖 AI Debug Analysis" attachment
- [ ] AI analysis contains specific solutions and code examples
- [ ] Can filter tests by `ai-analyzed: true` label
- [ ] Passing test does NOT have AI analysis
- [ ] Each AI analysis is unique and matches the specific error

## 🆘 Troubleshooting

### API key error
```bash
# Check that API key is set
echo $API_KEY
# or check .env file
```

### Allure issues
```bash
# Reinstall Allure
npm install -g allure-commandline
```

### Clean results
```bash
npm run clean
``` 