import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Playwright Configuration
 * This configuration supports multiple environments, browsers, and test types
 */
export default defineConfig({
  // Global test directory
  testDir: './tests',
  
  // Global timeout for each test
  timeout: 60000,
  
  // Expect timeout for assertions
  expect: {
    timeout: 10000,
  },

  // Run tests in files in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : 4,
  
  // Reporter configuration
  reporter: [
    ['html', { 
      outputFolder: 'playwright-report', 
      open: 'never',
      attachments: {
        mode: 'always',
        includeTraces: true
      }
    }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['allure-playwright', { 
      detail: true, 
      outputFolder: 'allure-results',
      suiteTitle: false 
    }],
    ['list']
  ],
  
  // Global setup and teardown
  // globalSetup: require.resolve('./utils/global-setup.ts'),
  // globalTeardown: require.resolve('./utils/global-teardown.ts'),
  
  // Shared settings for all projects
  use: {
    // Base URL for tests
    baseURL: process.env.BASE_URL || 'https://example.com',
    
    // Browser headless mode (controlled by environment variable)
    headless: process.env.BROWSER_HEADLESS === 'true',
    
    // Browser context options
    viewport: { width: 1920, height: 1080 },
    
    // Collect trace when retrying the failed test
    trace: 'retain-on-failure', // Options: 'off' | 'on' | 'retain-on-failure' | 'on-first-retry'
    
    // Record video for failed tests
    video: 'retain-on-failure',
    
    // Take screenshot on failure
    screenshot: 'only-on-failure',
    
    // Default navigation timeout
    navigationTimeout: 30000,
    
    // Default action timeout
    actionTimeout: 10000,
    
    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,
    
    // Accept downloads
    acceptDownloads: true,
    
    // Extra HTTP headers
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9'
    }
  },

  // Test output directory
  outputDir: 'test-results/',

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Use chromium instead of chrome channel for CI compatibility
        // channel: 'chrome', // Commented out for Jenkins CI
        launchOptions: {
          slowMo: process.env.BROWSER_SLOW_MO ? parseInt(process.env.BROWSER_SLOW_MO) : 0,
        },
      },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
    {
      name: 'microsoft-edge',
      use: { 
        ...devices['Desktop Edge'], 
        channel: 'msedge' 
      },
    },
    // API testing project
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        baseURL: process.env.API_BASE_URL || 'https://api.example.com',
      },
    },
  ],

  // Web server configuration for local development (disabled by default)
  // webServer: process.env.CI ? undefined : {
  //   command: 'npm run start:dev',
  //   port: 3000,
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120000,
  // },
});
