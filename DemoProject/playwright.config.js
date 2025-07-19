import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['allure-playwright', {
      detail: true,
      outputFolder: 'allure-results',
      suiteTitle: false,
      links: [
        {
          type: 'issue',
          urlTemplate: 'https://github.com/lunin-vadim/playwright-ai-auto-debug/issues/%s'
        },
        {
          type: 'tms',
          urlTemplate: 'https://github.com/lunin-vadim/playwright-ai-auto-debug/issues/%s'
        }
      ],
      environmentInfo: {
        'Demo Project': 'playwright-ai-auto-debug',
        'Node.js': process.version,
        'OS': process.platform
      }
    }]
  ],
  
  use: {
    baseURL: 'https://playwright.dev',
    actionTimeout: 10000,
    navigationTimeout: 30000,
    
    // Автоматическое покрытие UI - включается одной строкой!
    autoCoverage: {
      enabled: true,
      outputDir: './coverage-reports',
      generateReports: true,
      trackAllPages: true
    }
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
    },
    // {
    //   name: 'firefox',
    //   use: { 
    //     ...devices['Desktop Firefox'],
    //     viewport: { width: 1280, height: 720 }
    //   },
    // },
    // {
    //   name: 'webkit',
    //   use: { 
    //     ...devices['Desktop Safari'],
    //     viewport: { width: 1280, height: 720 }
    //   },
    // }
  ],
}); 