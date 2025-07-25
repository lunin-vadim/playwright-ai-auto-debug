// src/infrastructure/legacy/LegacySendToAI.js

/**
 * Временная заглушка для старого модуля sendToAI
 * TODO: Реализовать новые AI провайдеры в рамках Clean Architecture
 */

export async function sendToAI(prompt, config, domSnapshot = null) {
  console.log('🤖 Sending request to AI (legacy mode)...');
  
  // Имитируем задержку AI запроса
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Генерируем mock ответ
  const mockResponse = `
# AI Analysis (Mock Response)

## Problem Analysis
The test appears to be failing due to a common issue in Playwright tests.

## Suggested Solution
1. **Check selector**: Verify that the element selector is correct
2. **Wait for element**: Add proper wait conditions
3. **Handle async operations**: Ensure all promises are properly awaited

## Code Example
\`\`\`javascript
// Wait for element to be visible
await page.waitForSelector('.login-button', { state: 'visible' });

// Click with retry logic
await page.click('.login-button');
\`\`\`

## Additional Recommendations
- Add error handling for network requests
- Use more specific selectors
- Consider adding retry logic for flaky tests

---
*This is a mock response from the legacy AI integration.*
*The new architecture will provide more accurate analysis.*
  `.trim();

  console.log('✅ AI response generated (mock)');
  
  return mockResponse;
} 