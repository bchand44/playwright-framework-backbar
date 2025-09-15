# 🚀 How to Use This Playwright Test Automation Framework

This guide will walk you through using the comprehensive Playwright framework we've built for robust, scalable test automation.

## 📋 Table of Contents
1. [Quick Start](#quick-start)
2. [Framework Overview](#framework-overview)
3. [Running Tests](#running-tests)
4. [Writing New Tests](#writing-new-tests)
5. [Using Page Objects](#using-page-objects)
6. [Test Data Management](#test-data-management)
7. [Configuration](#configuration)
8. [Reporting & Debugging](#reporting--debugging)
9. [CI/CD Integration](#cicd-integration)
10. [Best Practices](#best-practices)

## 🏃‍♂️ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Install Playwright Browsers
```bash
npx playwright install
```

### 3. Configure Environment
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your application URLs
# Update BASE_URL and API_BASE_URL to point to your application
```

### 4. Run Your First Test
```bash
# Run framework validation
npx playwright test framework-validation.spec.ts

# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/e2e/auth.spec.ts
```

## 🏗️ Framework Overview

### Project Structure
```
├── tests/
│   ├── e2e/           # End-to-end UI tests
│   ├── api/           # API tests
│   └── framework-validation.spec.ts
├── pages/             # Page Object Models
│   ├── base-page.ts
│   ├── login-page.ts
│   └── dashboard-page.ts
├── utils/             # Utilities & helpers
│   ├── config.ts      # Configuration management
│   ├── logger.ts      # Logging utility
│   ├── test-data-manager.ts
│   ├── api-client.ts
│   └── browser-utils.ts
├── data/              # Test data files
└── test-results/      # Test outputs & reports
```

## 🧪 Running Tests

### Basic Commands
```bash
# Run all tests
npx playwright test

# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests with specific tags
npx playwright test --grep @smoke
npx playwright test --grep @regression
npx playwright test --grep @api

# Run specific test file
npx playwright test tests/e2e/auth.spec.ts

# Run specific test by name
npx playwright test -g "should login with valid credentials"

# Run tests in debug mode
npx playwright test --debug

# Run tests with trace
npx playwright test --trace on
```

### Advanced Options
```bash
# Run tests in parallel (default)
npx playwright test --workers=4

# Run tests sequentially
npx playwright test --workers=1

# Run with retries
npx playwright test --retries=2

# Generate and view report
npx playwright test --reporter=html
npx playwright show-report
```

## ✍️ Writing New Tests

### 1. Create a New Test File
```typescript
// tests/e2e/my-feature.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login-page';
import { logger } from '../../utils/logger';

test.describe('My Feature Tests', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('should do something @smoke', async ({ page }) => {
    // Your test logic here
    await expect(page).toHaveTitle(/Expected Title/);
  });
});
```

### 2. API Test Example
```typescript
// tests/api/my-api.spec.ts
import { test, expect } from '@playwright/test';
import { ApiClient } from '../../utils/api-client';

test.describe('My API Tests', () => {
  let apiClient: ApiClient;

  test.beforeAll(async () => {
    apiClient = new ApiClient('http://localhost:3001');
  });

  test('should get data from API @api', async () => {
    const response = await apiClient.get('/api/data');
    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
  });
});
```

## 🎭 Using Page Objects

### 1. Create a New Page Object
```typescript
// pages/my-page.ts
import { BasePage } from './base-page';
import { Page, Locator } from '@playwright/test';

export class MyPage extends BasePage {
  private submitButton: Locator;
  private inputField: Locator;

  constructor(page: Page) {
    super(page);
    this.submitButton = page.locator('[data-testid="submit"]');
    this.inputField = page.locator('[data-testid="input"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/my-page');
    await this.waitForPageLoad();
  }

  async fillInput(value: string): Promise<void> {
    await this.inputField.fill(value);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}
```

### 2. Use Page Objects in Tests
```typescript
import { MyPage } from '../../pages/my-page';

test('should use page object', async ({ page }) => {
  const myPage = new MyPage(page);
  await myPage.goto();
  await myPage.fillInput('test data');
  await myPage.submit();
});
```

## 📊 Test Data Management

### 1. Using JSON Data Files
```typescript
// Load data from JSON files
const testData = await TestDataManager.loadJsonData('my-test-data.json');
```

### 2. Generate Fake Data
```typescript
// Generate fake user data
const fakeUser = TestDataManager.generateUserData(1);
const fakeUsers = TestDataManager.generateUserData(5); // Array of 5 users

// Generate fake products
const fakeProduct = TestDataManager.generateProductData(1);
```

### 3. Create Test Data Files
```json
// data/my-test-data.json
{
  "testUser": {
    "username": "testuser@example.com",
    "password": "TestPassword123!"
  },
  "apiEndpoints": {
    "users": "/api/users",
    "products": "/api/products"
  }
}
```

## ⚙️ Configuration

### Environment Variables (.env)
```bash
# Application URLs
BASE_URL=http://localhost:3000
API_BASE_URL=http://localhost:3001

# Browser Settings
BROWSER_HEADLESS=false
BROWSER_TIMEOUT=60000

# Test Settings
TEST_WORKERS=4
TEST_RETRIES=2
TEST_TIMEOUT=60000

# Logging
LOG_LEVEL=info
LOG_TO_CONSOLE=true
```

### Dynamic Configuration
```typescript
// Access config in tests
import { config } from '../../utils/config';

const baseUrl = config.get('urls.base');
const apiTimeout = config.get('api.timeout');
```

## 📈 Reporting & Debugging

### Generate Reports
```bash
# HTML Report (default)
npx playwright test --reporter=html
npx playwright show-report

# JSON Report
npx playwright test --reporter=json

# JUnit Report (for CI)
npx playwright test --reporter=junit
```

### Debug Tests
```bash
# Debug mode with Playwright Inspector
npx playwright test --debug

# Run with traces
npx playwright test --trace on

# Record video
npx playwright test --video on
```

### View Test Results
```bash
# Open HTML report
npx playwright show-report

# View traces (after running with --trace on)
npx playwright show-trace test-results/path-to-trace.zip
```

## 🔄 CI/CD Integration

### GitHub Actions (already configured)
The framework includes a GitHub Actions workflow (`.github/workflows/playwright.yml`) that:
- Runs tests on multiple browsers
- Uploads test results and reports
- Sends notifications on failure

### Docker Support
```bash
# Build and run in Docker
docker-compose up --build

# Run specific test in Docker
docker-compose run playwright npx playwright test tests/e2e/auth.spec.ts
```

## 🎯 Best Practices

### 1. Test Organization
- Use descriptive test names
- Group related tests with `test.describe()`
- Use tags (@smoke, @regression, @api) for test categorization
- Keep tests independent and isolated

### 2. Page Objects
- Create reusable page objects for UI components
- Use data-testid attributes for reliable element selection
- Implement wait strategies in page objects

### 3. Test Data
- Use external data files for test data
- Generate fake data for tests that don't require specific data
- Keep sensitive data in environment variables

### 4. Assertions
```typescript
// Good: Specific and descriptive assertions
await expect(page.locator('[data-testid="welcome-message"]')).toContainText('Welcome, John');

// Better: Use page object methods
await expect(await dashboardPage.getWelcomeMessage()).toContain('Welcome');
```

### 5. Error Handling
```typescript
// Handle expected failures gracefully
test('should handle errors', async ({ page }) => {
  try {
    await someRiskyOperation();
  } catch (error) {
    logger.info('Expected error occurred:', error);
    // Continue with test
  }
});
```

## 🚀 Next Steps

1. **Update Configuration**: Modify `.env` file with your application URLs
2. **Create Page Objects**: Build page objects for your application's pages
3. **Write Tests**: Start with smoke tests for critical user journeys
4. **Set Up CI/CD**: Configure the GitHub Actions workflow for your repository
5. **Add Test Data**: Create JSON files with your application's test data

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices Guide](https://playwright.dev/docs/best-practices)
- [Test Generator](https://playwright.dev/docs/codegen) - Generate tests by recording interactions

## 🆘 Troubleshooting

### Common Issues

1. **Tests fail with "Element not found"**
   - Use better selectors (data-testid)
   - Add wait strategies
   - Check if element exists before interaction

2. **Configuration errors**
   - Verify `.env` file exists and has correct values
   - Check that required environment variables are set

3. **Browser installation issues**
   - Run `npx playwright install` to install browsers
   - For CI environments, use `npx playwright install --with-deps`

4. **Port conflicts**
   - Ensure your application is running on the configured ports
   - Update BASE_URL and API_BASE_URL in `.env` if needed

---

**Happy Testing! 🎉**

This framework provides a solid foundation for scalable test automation. Start with simple tests and gradually build more complex scenarios as you become familiar with the structure.
