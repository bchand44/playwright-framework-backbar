# Backbarr Playwright Test Automation Framework

A **production-ready**, robust, and scalable test automation framework built with Playwright, TypeScript, and industry best practices. This framework provides everything you need to implement comprehensive automated testing for web applications and APIs.

## ⭐ Why Choose This Framework?

✅ **Battle-tested** - 158+ comprehensive test scenarios  
✅ **Production-ready** - Complete with sample applications  
✅ **Developer-friendly** - TypeScript, clear documentation, easy setup  
✅ **Enterprise-grade** - Logging, reporting, CI/CD integration  
✅ **Best practices** - Page Object Model, proper error handling, retry mechanisms  

## 🚀 Quick Start

```bash
# 1. Clone and setup
git clone <repository-url>
cd backbarr-playwright-framework
npm install

# 2. Install browsers
npm run install:browsers

# 3. Start sample applications (for testing the framework)
npm run start:apps

# 4. Run tests (in a new terminal)
npm run test

# 5. View reports
npm run report
```

## 🎯 Core Features

### 🔧 **Framework Architecture**
- **TypeScript**: Full type safety and IntelliSense support
- **Page Object Model**: Maintainable and reusable page objects
- **Modular Design**: Easily extensible and customizable
- **Configuration-driven**: Environment-specific settings

### 🌐 **Multi-Browser & Device Support**
- **Desktop Browsers**: Chromium, Firefox, WebKit
- **Mobile Devices**: iOS Safari, Android Chrome
- **Headless & Headed**: Run tests with or without UI
- **Parallel Execution**: Faster test execution

### 🧪 **Comprehensive Testing**
- **E2E Testing**: Complete user journey testing
- **API Testing**: REST API validation and integration tests
- **Visual Testing**: Screenshot comparisons and UI validation
- **Performance Testing**: Load time and response time monitoring

### 📊 **Advanced Reporting & Debugging**
- **Multiple Formats**: HTML, JSON, JUnit, Allure reports
- **Rich Logging**: Winston-based structured logging
- **Visual Evidence**: Screenshots, videos, and execution traces
- **Test Artifacts**: Automatic capture on failures

### 🔄 **CI/CD Ready**
- **GitHub Actions**: Pre-configured workflows
- **Docker Support**: Containerized test execution
- **Notifications**: Slack and email integration
- **Artifact Management**: Test results and reports storage

## 📁 Project Structure

```
backbarr-playwright-framework/
├── config/                     # Configuration files
├── data/                      # Test data files
│   ├── test-credentials.json  # User credentials
│   └── *.json                 # Other test data
├── logs/                      # Log files
├── pages/                     # Page Object Model
│   ├── base-page.ts          # Base page class
│   ├── login-page.ts         # Login page object
│   └── dashboard-page.ts     # Dashboard page object
├── tests/                     # Test files
│   ├── api/                  # API tests
│   ├── e2e/                  # End-to-end tests
│   ├── setup/                # Setup and teardown
│   └── *.setup.ts            # Global setup files
├── utils/                     # Utility classes
│   ├── api-client.ts         # API testing utilities
│   ├── browser-utils.ts      # Browser management
│   ├── config.ts             # Configuration management
│   ├── logger.ts             # Logging utilities
│   ├── test-data-manager.ts  # Test data handling
│   ├── global-setup.ts       # Global setup
│   └── global-teardown.ts    # Global teardown
├── test-results/             # Test execution results
├── playwright-report/        # HTML reports
├── allure-results/          # Allure report data
├── playwright.config.ts     # Playwright configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies and scripts
└── README.md              # This file
```

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or yarn
- **Git**

### Step-by-Step Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backbarr-playwright-framework
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Playwright browsers**
   ```bash
   npm run install:browsers
   ```

4. **Verify installation**
   ```bash
   npm run test:validation
   ```

### 🎮 Try the Framework with Sample Apps

To see the framework in action, we've included sample applications:

1. **Start sample applications**
   ```bash
   npm run start:apps
   ```
   This starts:
   - Web app on `http://localhost:3000`
   - API server on `http://localhost:3001`

2. **Run sample tests** (in a new terminal)
   ```bash
   # Run all tests
   npm test

   # Run specific test types
   npm run test:e2e          # Web application tests
   npm run test:api          # API tests
   npm run test:smoke        # Smoke tests only
   ```

3. **View test reports**
   ```bash
   npm run report            # HTML report
   npm run report:allure     # Allure report (if installed)
   ```

## 🔧 Configuration

### Framework Configuration

The framework is configured through multiple files for flexibility:

- **`playwright.config.ts`** - Main Playwright configuration
- **`config/config.json`** - Framework-specific settings
- **`.env`** - Environment variables (create from `.env.example`)

```javascript
// playwright.config.ts example
export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  retries: 2,
  workers: 4,
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ]
});
```
API_BASE_URL=https://api.example.com
HEADLESS=true
WORKERS=4
RETRIES=2
```

### Playwright Configuration

Key configuration options in `playwright.config.ts`:

```typescript
export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  use: {
    baseURL: process.env.BASE_URL,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
```

## 📝 Writing Tests

### 🏗️ Framework Architecture

The framework follows the **Page Object Model** pattern for maintainability:

```
tests/
├── e2e/                 # End-to-end web tests
├── api/                 # API integration tests
└── framework-validation.spec.ts  # Framework health check

pages/
├── base-page.ts         # Base page with common methods
├── login-page.ts        # Login page object
└── dashboard-page.ts    # Dashboard page object

utils/
├── api-client.ts        # API testing utilities
├── config.ts           # Configuration management
└── logger.ts           # Logging utilities
```

### ✍️ Writing Your First Test

1. **Create a new test file** in `tests/e2e/`:

```typescript
// tests/e2e/my-feature.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login-page';
import { DashboardPage } from '../../pages/dashboard-page';

test.describe('My Feature Tests', () => {
  test('should complete user workflow', async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    
    // Act
    await loginPage.goto();
    await loginPage.login('testuser@example.com', 'password123');
    
    // Assert
    await expect(page).toHaveURL(/dashboard/);
    await dashboardPage.validateDashboardLoaded();
  });
});
```

2. **Create page objects** in `pages/`:

```typescript
// pages/my-feature-page.ts
import { BasePage } from './base-page';

export class MyFeaturePage extends BasePage {
  private readonly selectors = {
    submitButton: '[data-testid="submit-btn"]',
    resultMessage: '[data-testid="result"]',
  };

  async submitForm(): Promise<void> {
    await this.click(this.selectors.submitButton);
    await this.waitForElement(this.selectors.resultMessage);
  }

  async getResultMessage(): Promise<string> {
    return await this.getText(this.selectors.resultMessage);
  }
}
```

### 🔌 API Testing

```typescript
// tests/api/my-api.spec.ts
import { test, expect } from '@playwright/test';
import { ApiClient } from '../../utils/api-client';

test.describe('API Tests', () => {
  let apiClient: ApiClient;

  test.beforeEach(async () => {
    apiClient = new ApiClient();
  });

  test('should create user via API', async () => {
    const response = await apiClient.post('/users', {
      name: 'John Doe',
      email: 'john@example.com'
    });

    expect(response.status).toBe(201);
    expect(response.data).toHaveProperty('id');
  });
});
```

### 🎯 Test Data Management

```typescript
// Use test data from JSON files
import testData from '../../data/test-credentials.json';

test('should login with test data', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const user = testData.validUser;
  
  await loginPage.login(user.email, user.password);
});
```
  }
}
```

### API Testing

```typescript
import { apiClient } from '../utils/api-client';

test('should get users via API', async () => {
  const response = await apiClient.get('/users');
  
  expect(response.status).toBe(200);
  expect(Array.isArray(response.data)).toBeTruthy();
});
```

### Test Data Management

```typescript
import { TestDataManager } from '../utils/test-data-manager';

## 🎯 Test Execution

### 🚀 Available Commands

```bash
# Basic execution
npm test                    # Run all tests
npm run test:headed        # Run with visible browser
npm run test:debug         # Debug mode with developer tools

# Browser-specific
npm run test:chromium      # Chrome/Chromium only
npm run test:firefox       # Firefox only  
npm run test:webkit        # Safari/WebKit only
npm run test:mobile        # Mobile device tests

# Test categories
npm run test:e2e           # End-to-end web tests
npm run test:api           # API integration tests
npm run test:smoke         # Smoke tests (@smoke tag)
npm run test:regression    # Regression tests (@regression tag)

# Performance & parallel
npm run test:parallel      # Run tests in parallel
npm run test:ui           # Playwright UI mode (interactive)

# Framework validation
npm run test:validation    # Verify framework setup
```

### 🏷️ Test Organization with Tags

Organize tests using descriptive tags:

```typescript
test('user login flow @smoke @auth @critical', async ({ page }) => {
  // Critical authentication test
});

test('advanced search @regression @search', async ({ page }) => {
  // Comprehensive search functionality
});

test('mobile responsive layout @mobile @ui', async ({ page }) => {
  // Mobile-specific test
});
```

**Run tests by tags:**
```bash
npm run test:smoke         # Only @smoke tests
npm run test:regression    # Only @regression tests
npx playwright test --grep "@auth"  # Custom tag filtering
```

### 📊 Reports and Debugging

```bash
# View reports
npm run report            # Open HTML report
npm run report:allure     # Allure report (if configured)

# Debug failed tests
npx playwright show-report           # Interactive report
npx playwright test --debug         # Step-by-step debugging
npx playwright test --trace=on      # Full trace recording
```

### 🔄 Continuous Integration

The framework is CI/CD ready with pre-configured GitHub Actions:

```yaml
# .github/workflows/playwright.yml
name: Playwright Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm test
```
```bash
npx playwright test --grep @smoke
npx playwright test --grep "@regression|@critical"
```

## 📊 Reporting

### HTML Reports
```bash
npm run report
```

### Allure Reports
## 🗂️ Project Structure & Sample Applications

This framework includes **working sample applications** to demonstrate testing capabilities:

### 📁 Framework Structure
```
backbarr-playwright-framework/
├── 📁 config/                  # Configuration files
├── 📁 data/                   # Test data & credentials
│   └── test-credentials.json   # Sample user accounts
├── 📁 pages/                  # Page Object Model
│   ├── base-page.ts           # Base page class
│   ├── login-page.ts          # Login functionality
│   └── dashboard-page.ts      # Dashboard interactions
├── 📁 tests/                  # Test suites (158+ tests)
│   ├── e2e/                   # End-to-end web tests
│   ├── api/                   # API integration tests
│   └── framework-validation.spec.ts
├── 📁 sample-apps/            # Demo applications
│   ├── web-app/               # Sample web application
│   └── api-server/            # Sample REST API
├── 📁 utils/                  # Helper utilities
├── 📁 logs/                   # Application logs
└── 📁 test-results/           # Test artifacts
```

### 🎮 Sample Applications

#### Web Application (Port 3000)
- **Login Page** - Authentication with test users
- **Dashboard** - Post-login user interface  
- **Forms** - Input validation and submission
- **Responsive Design** - Mobile and desktop layouts

#### API Server (Port 3001)
- **User Management** - CRUD operations for users
- **Product Catalog** - Product listing and search
- **Error Simulation** - Testing error scenarios
- **Performance Endpoints** - Load testing scenarios

### 🚀 Demo Usage
```bash
# 1. Start sample applications
npm run start:apps

# 2. Run framework against samples
npm test

# 3. Explore test results
npm run report
```

## 📊 Reporting & Analytics

### 📈 Built-in Reports
```bash
npm run report              # HTML report with screenshots
npm run report:allure       # Advanced Allure reporting
npx playwright show-report  # Interactive report browser
```

### 📸 Visual Evidence
- **Screenshots**: Automatic capture on test failures
- **Videos**: Full test execution recordings  
- **Traces**: Detailed step-by-step execution logs
- **Network Logs**: API calls and responses

### 📋 Report Features
- ✅ Test execution timeline
- ✅ Cross-browser compatibility matrix  
- ✅ Performance metrics and trends
- ✅ Flaky test identification
- ✅ Historical test data tracking

## � Debugging & Development

### 🔍 Debug Tools
```bash
npm run test:debug          # Step-by-step debugging
npm run test:ui             # Playwright UI mode
npm run test:headed         # Visual browser execution
```

### 🛠️ Development Features
```bash
npm run test:ui             # Interactive test development
npx playwright codegen      # Auto-generate test code
npm run lint:fix            # Auto-fix code issues
npm run format              # Code formatting
```

### 💡 VSCode Integration
Install the **Playwright Extension** for enhanced development:
- Integrated test running
- Debug breakpoints  
- Test generation
- Element inspector

## 📈 Best Practices

### Test Organization
- Group related tests using `test.describe()`
- Use meaningful test names
- Keep tests independent and isolated
- Use appropriate test tags

### Page Objects
- Keep page objects focused on a single page/component
- Use data-testid attributes for reliable element selection
- Implement proper error handling
- Add assertions in page objects when appropriate

### Data Management
- Keep test data separate from test logic
- Use faker for dynamic data generation
- Implement data cleanup strategies
- Secure sensitive test data

### Performance
- Use appropriate waits (`waitForLoadState`, `waitFor`)
- Minimize unnecessary interactions
- Implement proper resource cleanup
- Monitor test execution times

## 🚀 CI/CD Integration

### GitHub Actions

```yaml
name: Playwright Tests
## 📈 Best Practices & Guidelines

### 🎯 Test Development
- **Test Independence**: Each test should run independently
- **Descriptive Names**: Use clear, business-focused test names
- **Page Object Pattern**: Maintain separation of concerns
- **Data-Driven Testing**: Use external test data files
- **Proper Assertions**: Include meaningful validation checks

### 🚀 Performance Optimization
- **Parallel Execution**: Leverage multiple workers
- **Selective Testing**: Use tags for targeted test runs
- **Efficient Waits**: Use explicit waits over fixed delays
- **Resource Management**: Clean up test data and sessions

### 🛡️ Reliability & Maintenance
- **Retry Strategy**: Configure appropriate retry mechanisms
- **Flaky Test Handling**: Identify and fix unstable tests
- **Regular Updates**: Keep dependencies current
- **Code Reviews**: Maintain code quality standards

## 🤝 Support & Contributing

### 📚 Documentation
- **README.md** - Comprehensive framework guide
- **QUICK_START.md** - Fast setup and basic usage
- **HOW_TO_USE.md** - Detailed implementation guide
- **FRAMEWORK_READY.md** - Technical specifications

### 🐛 Issue Reporting
When reporting issues, please include:
- Framework version
- Test environment details
- Reproduction steps
- Expected vs actual behavior
- Log files and screenshots

### 💬 Community
- Share test patterns and best practices
- Contribute new page objects and utilities
- Report bugs and suggest improvements
- Help others with implementation questions

## 🔗 Related Resources

### 📖 Official Documentation
- [Playwright Documentation](https://playwright.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Node.js Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

### 🛠️ Recommended Tools
- **VS Code** + Playwright Extension
- **Allure TestOps** for advanced reporting
- **GitHub Actions** for CI/CD
- **Docker** for containerized testing

---

## 🎉 Ready to Start Testing!

You now have a **production-ready test automation framework** with:

✅ **158+ sample tests** demonstrating best practices  
✅ **Working sample applications** to test against  
✅ **Comprehensive documentation** and guides  
✅ **CI/CD integration** and reporting  
✅ **Cross-browser and mobile support**  

**Start building your test suite today!**

```bash
npm run start:apps    # Launch demo apps
npm test             # Run sample tests  
npm run report       # View results
```

Happy Testing! 🚀

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
CMD ["npm", "test"]
```

## 🔧 Troubleshooting

### Common Issues

1. **Browser Installation**
   ```bash
   npx playwright install --with-deps
   ```

2. **Timeout Issues**
   - Increase timeouts in configuration
   - Use proper waits instead of fixed delays
   - Check network conditions

3. **Flaky Tests**
   - Implement proper waits
   - Use retry mechanisms
   - Check for race conditions

4. **Environment Issues**
   - Verify environment variables
   - Check URL accessibility
   - Validate test data

### Logging

Check logs in the `logs/` directory:
- `application.log` - General application logs
- `error.log` - Error logs
- `test-results.log` - Detailed test execution logs

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest Matchers](https://jestjs.io/docs/expect)
- [Allure Reporting](https://docs.qameta.io/allure/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Create a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Support

For questions and support:
- Create an issue in the repository
- Check the documentation
- Review existing issues and discussions

---

**Happy Testing! 🎭**
