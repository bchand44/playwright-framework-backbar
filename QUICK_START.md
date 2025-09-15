# 🚀 Quick Start Guide

Get up and running with the Backbarr Playwright Framework in under 5 minutes!

## ⚡ Instant Setup

### 1. Prerequisites Check
```bash
node --version    # Should be v18+
npm --version     # Should be v8+
```

### 2. Clone & Install
```bash
git clone <repository-url>
cd backbarr-playwright-framework
npm install
npm run install:browsers
```

### 3. Verify Installation
```bash
npm run test:validation
```
✅ If this passes, you're ready to go!

## 🎮 Try It Out (Demo Mode)

See the framework in action with our sample applications:

### 1. Start Sample Apps
```bash
npm run start:apps
```
This launches:
- 🌐 Web App: http://localhost:3000
- 🔌 API Server: http://localhost:3001

### 2. Run Demo Tests (New Terminal)
```bash
# Run all sample tests
npm test

# Or run specific types
npm run test:e2e          # Web application tests
npm run test:api          # API tests  
npm run test:smoke        # Quick smoke tests
```

### 3. View Results
```bash
npm run report            # Open HTML report in browser
```

## 📋 Essential Commands

### 🧪 Test Execution
```bash
# Basic runs
npm test                  # All tests, headless
npm run test:headed      # With visible browser
npm run test:debug       # Step-by-step debugging

# Browser-specific  
npm run test:chromium    # Chrome only
npm run test:firefox     # Firefox only
npm run test:webkit      # Safari only
npm run test:mobile      # Mobile devices

# Test categories
npm run test:smoke       # Quick validation (@smoke)
npm run test:regression  # Full test suite (@regression)
npm run test:ui          # Interactive mode
```

### 📊 Reports & Analysis
```bash
npm run report           # HTML report
npm run report:allure    # Allure report (advanced)
npx playwright show-report  # Interactive report browser
```

### 🛠️ Development Tools
```bash
npm run lint             # Code quality check
npm run lint:fix         # Auto-fix issues  
npm run format           # Prettier formatting
npm run type-check       # TypeScript validation
npm run clean            # Clear test artifacts
```

## 📋 Test Writing Checklist

### ✅ Before Writing Tests
- [ ] Understand the feature requirements
- [ ] Identify test scenarios (positive, negative, edge cases)
- [ ] Plan test data requirements
- [ ] Choose appropriate test level (unit, integration, e2e)

## ✍️ Your First Custom Test

### 1. Create Test File
```bash
# Create your test file
touch tests/e2e/my-feature.spec.ts
```

### 2. Write Your Test
```typescript
// tests/e2e/my-feature.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login-page';

test.describe('My Feature Tests', () => {
  test('should handle my specific workflow @smoke', async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    
    // Act  
    await loginPage.goto();
    await loginPage.login('testuser@example.com', 'password123');
    
    // Assert
    await expect(page).toHaveURL(/dashboard/);
  });
});
```

### 3. Run Your Test
```bash
npx playwright test tests/e2e/my-feature.spec.ts --headed
```

## 🎯 Adapting to Your Application

### 1. Update Configuration
```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    baseURL: 'https://your-app.com',  // Your app URL
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Add/remove browsers as needed
  ],
});
```

### 2. Create Your Page Objects
```typescript
// pages/your-page.ts
import { BasePage } from './base-page';

export class YourPage extends BasePage {
  private readonly selectors = {
    yourButton: '[data-testid="your-button"]',  // Use your selectors
    yourInput: '#your-input-id',
  };

  async performYourAction(): Promise<void> {
    await this.click(this.selectors.yourButton);
    await this.waitForElement(this.selectors.yourInput);
  }
}
```

### 3. Update Test Data
```json
// data/test-credentials.json
{
  "validUser": {
    "email": "your-test-user@example.com",
    "password": "your-test-password"
  },
  "adminUser": {
    "email": "admin@example.com", 
    "password": "admin-password"
  }
}
```

## 📋 Test Development Checklist

### ✅ Before Writing Tests
- [ ] Identify test scenarios and user journeys
- [ ] Set up test data and credentials
- [ ] Define page objects for new pages
- [ ] Choose appropriate test tags (@smoke, @regression)

### ✅ Writing Tests  
- [ ] Use descriptive test names
- [ ] Follow AAA pattern (Arrange, Act, Assert)
- [ ] Add proper waits and error handling
- [ ] Include meaningful assertions
- [ ] Use data-testid selectors when possible

### ✅ After Writing Tests
- [ ] Run tests locally (headed and headless)
- [ ] Verify tests pass and fail appropriately  
- [ ] Check test execution time (< 30s ideal)
- [ ] Review logs and screenshots
- [ ] Update documentation as needed

## 🔧 Advanced Configuration

### Environment Setup
```bash
# .env (create from .env.example)
NODE_ENV=development
BASE_URL=https://your-staging.com
API_BASE_URL=https://api-staging.com
HEADLESS=false
WORKERS=2
RETRIES=1
LOG_LEVEL=debug
```

### Browser Customization  
```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-safari', 
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'firefox-desktop',
      use: { ...devices['Desktop Firefox'] },
    }
  ]
});
```

### Test Organization
```typescript
// Use descriptive tags for filtering
test('user login flow @smoke @auth @critical', async ({ page }) => {
  // Critical authentication test
});

test('bulk data import @regression @admin @slow', async ({ page }) => {
  // Long-running admin test
});
```

## 🐛 Debugging & Troubleshooting

### 🔍 Visual Debugging
```bash
npm run test:headed         # Watch tests in browser
npm run test:debug          # Step-by-step debugging
npm run test:ui             # Interactive Playwright UI
```

### 📊 Analyzing Failures
```bash
npm run report              # View detailed HTML report
npx playwright show-report  # Interactive failure analysis

# Check specific test artifacts
ls test-results/            # Screenshots, videos, traces
```

### 🛠️ Common Issues

**Tests timing out?**
```typescript
// Increase timeout for slow operations
test.setTimeout(120000);  // 2 minutes

// Or use custom waits
await page.waitForLoadState('networkidle');
```

**Element not found?**
```typescript
// Use better waits
await page.waitForSelector('[data-testid="element"]');

// Check if element exists
const element = page.locator('[data-testid="element"]');
await expect(element).toBeVisible();
```

**Flaky tests?**
```bash
# Run with retries
npx playwright test --retries=3

# Or increase retry in config
retries: process.env.CI ? 2 : 1
```

## � Next Steps

### 1. Explore Sample Tests
```bash
# Study the included examples
cat tests/e2e/auth.spec.ts         # Web testing patterns  
cat tests/api/api.spec.ts          # API testing patterns
cat pages/base-page.ts             # Page object patterns
```

### 2. Customize for Your App
- Update `playwright.config.ts` with your URLs
- Create page objects for your application pages
- Add your test data to `data/` directory
- Write tests following the established patterns

### 3. Set Up CI/CD
- Use the included GitHub Actions workflow
- Configure environment variables in your CI system
- Set up notification integrations (Slack/Email)

### 4. Advanced Features
- Explore visual testing capabilities
- Set up performance monitoring
- Integrate with test management tools
- Configure custom reporting
npm run test:ui      # Interactive mode
```

### 2. Screenshots & Videos
```typescript
// Automatic on failure
await page.screenshot({ path: 'debug.png' });

// Videos are recorded automatically
// Check test-results/ folder
```

### 3. Trace Files
```bash
npx playwright show-trace test-results/trace.zip
```

### 4. Logging
```typescript
import { logger } from '../utils/logger';

logger.info('Starting test step');
logger.debug('Element found', { selector: '.button' });
logger.error('Test failed', error);
```

## 📊 Understanding Reports

### HTML Report
- Overall test summary
- Test results by browser
- Screenshots and videos
- Trace files for debugging

### Allure Report
- Detailed test execution
- Historical trends
- Test categorization
- Rich attachments

## 🚨 Common Issues & Solutions

### Issue: Tests are flaky
**Solutions:**
- Add proper waits instead of timeouts
- Use data-testid attributes
- Implement retry mechanisms
- Check for race conditions

### Issue: Slow test execution
**Solutions:**
- Increase parallel workers
- Optimize selectors
- Remove unnecessary waits
- Use API for data setup

### Issue: Element not found
**Solutions:**
- Verify selector accuracy
- Add explicit waits
- Check element timing
- Use browser dev tools

### Issue: Authentication failures
**Solutions:**
- Verify test credentials
- Check session management
- Implement proper login flow
- Handle token expiration

## 🔄 CI/CD Integration

### GitHub Actions
```yaml
# Already configured in .github/workflows/playwright.yml
# Runs on push, PR, and scheduled basis
```

### Local Docker
```bash
docker-compose up playwright-tests
```

### Report Publishing
```bash
# Automatic GitHub Pages deployment
# Available at: https://username.github.io/repo/reports/
```

## 📈 Best Practices Summary

### 🎯 Test Strategy
- Start with smoke tests
- Cover critical user journeys
- Add regression tests for bugs
- Include API testing
- Test across browsers

### 🏗️ Code Organization
- Use Page Object Model
- Keep tests independent
- Implement proper data management
- Add comprehensive logging
- Follow naming conventions

### 🔧 Maintenance
- Regular dependency updates
- Monitor test execution times
- Clean up obsolete tests
- Update selectors when UI changes
- Review and improve flaky tests

### 🚀 Performance
- Run tests in parallel
- Use appropriate timeouts
- Optimize test data setup
- Monitor resource usage
- Cache dependencies

---

**Need Help?** 
- Check the full README.md
- Review example tests
- Check logs in logs/ directory
- Create an issue for bugs
