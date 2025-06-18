# ⚡ Demo Project Quick Start

## 🚀 3 minutes to Allure report with AI analysis

### 1. Setup (30 seconds)
```bash
cd DemoProject
npm install
npx playwright install chromium
```

### 2. Configure API key (30 seconds)
```bash
cp env.example .env
# Edit .env and set API_KEY=your-mistral-api-key
```

### 3. Run demonstration (2 minutes)
```bash
npm run demo:full
```

## ✅ What will happen:

1. **Tests will run** (6 tests: 1 will pass ✅, 5 will fail ❌)
2. **AI will analyze errors** and create solutions
3. **Allure report will be generated** with AI attachments
4. **Browser will open** with ready report

## 🔍 What to check in the report:

- [ ] 5 failed tests have "🤖 AI Debug Analysis" attachment
- [ ] 1 passing test does NOT have AI analysis
- [ ] AI suggests specific solutions with code examples
- [ ] Can filter by `ai-analyzed: true` label

## 🆘 If something doesn't work:

```bash
# Clean and re-run
npm run clean
npm run demo:full

# Check API key
echo $API_KEY
```

**Done!** 🎉 Now you have a fully working example of AI analysis integration with Allure reports. 