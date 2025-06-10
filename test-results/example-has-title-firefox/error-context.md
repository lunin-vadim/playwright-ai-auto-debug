# Test info

- Name: has title
- Location: /Users/lunin/tests/tests/example.spec.js:4:5

# Error details

```
Error: page.goto: NS_ERROR_UNKNOWN_HOST
Call log:
  - navigating to "https://playwright1.dev/", waiting until "load"

    at /Users/lunin/tests/tests/example.spec.js:5:14
```

# Page snapshot

```yaml
- heading [level=1]
- paragraph
- paragraph
```

# Test source

```ts
   1 | // @ts-check
   2 | import { test, expect } from '@playwright/test';
   3 |
   4 | test('has title', async ({ page }) => {
>  5 |   await page.goto('https://playwright1.dev/');
     |              ^ Error: page.goto: NS_ERROR_UNKNOWN_HOST
   6 |
   7 |   // Expect a title "to contain" a substring.
   8 |   await expect(page).toHaveTitle(/Playwright/);
   9 | });
  10 |
  11 | test('get started link', async ({ page }) => {
  12 |   await page.goto('https://playwright.dev/');
  13 |
  14 |   // Click the get started link.
  15 |   await page.getByRole('link', { name: 'Get started' }).click();
  16 |
  17 |   // Expects page to have a heading with the name of Installation.
  18 |   await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
  19 | });
  20 |
``` 