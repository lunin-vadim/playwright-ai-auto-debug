/**
 * Мок-версия MCP интеграции для демонстрации детального покрытия
 * Генерирует реалистичные accessibility tree данные
 */
export class MockMCPIntegration {
  constructor() {
    this.mockData = {
      'playwright-homepage': this.generateHomepageMockData(),
      'playwright-docs': this.generateDocsMockData()
    };
  }

  /**
   * Мок получения MCP snapshot
   */
  async getMCPSnapshot(page, options = {}) {
    // Получаем URL для определения типа страницы
    const url = page.url();
    
    if (url.includes('docs')) {
      return this.mockData['playwright-docs'];
    } else {
      return this.mockData['playwright-homepage'];
    }
  }

  /**
   * Генерация мок-данных для главной страницы
   */
  generateHomepageMockData() {
    return `# Accessibility Tree for playwright.dev

- navigation: "Main navigation"
  - link: "Home" /url: "/"
  - link: "Docs" /url: "/docs"
  - link: "API" /url: "/docs/api"
  - link: "Community" /url: "/community"
  - button: "Theme toggle"

- region: "Hero section"
  - heading: "Playwright" level: 1
  - text: "Fast and reliable end-to-end testing for modern web apps"
  - button: "Get started" /url: "/docs/intro"
  - button: "View on GitHub" /url: "https://github.com/microsoft/playwright"

- region: "Features section"
  - heading: "Why Playwright?" level: 2
  - region: "Feature cards"
    - region: "Cross-browser testing"
      - heading: "Cross-browser" level: 3
      - text: "Test across all modern browsers"
      - img: "Cross-browser icon"
    - region: "Auto-wait"
      - heading: "Auto-wait" level: 3
      - text: "Playwright waits for elements to be ready"
      - img: "Auto-wait icon"
    - region: "Mobile testing"
      - heading: "Mobile" level: 3
      - text: "Test mobile web apps"
      - img: "Mobile icon"

- region: "Code examples"
  - heading: "Write tests with confidence" level: 2
  - region: "Code snippet"
    - text: "test('basic test', async ({ page }) => {"
    - text: "  await page.goto('https://playwright.dev/');"
    - text: "  await page.click('text=Get started');"
    - text: "});"

- region: "Getting started"
  - heading: "Get started in seconds" level: 2
  - text: "Install Playwright and run your first test"
  - button: "Install Playwright"
  - link: "Read documentation" /url: "/docs"

- form: "Newsletter signup"
  - heading: "Stay updated" level: 3
  - input: "Email address" type: "email"
  - button: "Subscribe"

- navigation: "Footer navigation"
  - region: "Footer links"
    - heading: "Docs" level: 4
    - link: "Getting started" /url: "/docs/intro"
    - link: "Installation" /url: "/docs/installation"
    - link: "Writing tests" /url: "/docs/writing-tests"
  - region: "Community links"
    - heading: "Community" level: 4
    - link: "GitHub" /url: "https://github.com/microsoft/playwright"
    - link: "Discord" /url: "https://discord.gg/playwright"
    - link: "Stack Overflow" /url: "https://stackoverflow.com/questions/tagged/playwright"
  - region: "Legal"
    - link: "Privacy" /url: "/privacy"
    - link: "Terms" /url: "/terms"

- button: "Back to top"`;
  }

  /**
   * Генерация мок-данных для страницы документации
   */
  generateDocsMockData() {
    return `# Accessibility Tree for playwright.dev/docs

- navigation: "Main navigation"
  - link: "Home" /url: "/"
  - link: "Docs" /url: "/docs"
  - link: "API" /url: "/docs/api"
  - button: "Search docs"
  - input: "Search" type: "search" placeholder: "Search docs"

- navigation: "Sidebar navigation"
  - heading: "Getting Started" level: 2
  - link: "Introduction" /url: "/docs/intro"
  - link: "Installation" /url: "/docs/installation"
  - link: "Writing tests" /url: "/docs/writing-tests"
  - heading: "Guides" level: 2
  - link: "Auto-waiting" /url: "/docs/auto-waiting"
  - link: "Selectors" /url: "/docs/selectors"
  - link: "Actions" /url: "/docs/actions"
  - heading: "Advanced" level: 2
  - link: "Configuration" /url: "/docs/test-configuration"
  - link: "Fixtures" /url: "/docs/test-fixtures"

- region: "Main content"
  - heading: "Introduction" level: 1
  - text: "Playwright is a framework for Web Testing and Automation"
  - text: "It allows testing Chromium, Firefox and WebKit browsers"
  
  - region: "Installation section"
    - heading: "Installation" level: 2
    - text: "Get started by installing Playwright"
    - region: "Code block"
      - text: "npm init playwright@latest"
    - button: "Copy code"
  
  - region: "First test section"
    - heading: "First test" level: 2
    - text: "Create your first test file"
    - region: "Code block"
      - text: "import { test, expect } from '@playwright/test';"
      - text: "test('homepage', async ({ page }) => {"
      - text: "  await page.goto('https://playwright.dev/');"
      - text: "});"
    - button: "Copy code"

- region: "Page navigation"
  - button: "Previous" /url: "/docs"
  - button: "Next" /url: "/docs/installation"

- region: "Page utilities"
  - button: "Edit this page"
  - button: "Share"
  - region: "Table of contents"
    - heading: "On this page" level: 3
    - link: "Installation" /url: "#installation"
    - link: "First test" /url: "#first-test"
    - link: "Running tests" /url: "#running-tests"

- region: "Feedback"
  - heading: "Was this helpful?" level: 3
  - button: "Yes"
  - button: "No"
  - button: "Suggest improvements"`;
  }
}

export default MockMCPIntegration; 