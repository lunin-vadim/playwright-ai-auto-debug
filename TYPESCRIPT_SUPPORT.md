# TypeScript Configuration Support

## Problem

The `Unknown file extension ".ts"` error occurs when Node.js tries to import a TypeScript configuration file without the appropriate tools.

## Solutions

### Option 1: Install tsx (Recommended)

```bash
npm install tsx
```

After installing `tsx`, your `playwright.config.ts` will be automatically supported.

### Option 2: Rename to JavaScript

1. Rename `playwright.config.ts` to `playwright.config.js`
2. Remove TypeScript types from the configuration:

```javascript
// Before (TypeScript)
import { defineConfig, PlaywrightTestConfig } from '@playwright/test';

export default defineConfig({
  // configuration
});

// After (JavaScript)
import { defineConfig } from '@playwright/test';

export default defineConfig({
  // configuration
});
```

### Option 3: Use Ready Example

Copy `playwright.config.example.js` to `playwright.config.js`:

```bash
cp playwright.config.example.js playwright.config.js
```

## Verification

After applying any of the solutions, run:

```bash
npx playwright-ai
```

You should see the message:
```
✅ AI configuration loaded from playwright.config.js
```
or
```
✅ AI configuration loaded from playwright.config.ts
```

## Automatic Detection

The tool automatically:
1. Searches for `playwright.config.ts` first
2. If not found, searches for `playwright.config.js`
3. For TypeScript files, checks `tsx` availability
4. Provides clear error messages 