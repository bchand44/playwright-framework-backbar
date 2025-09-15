# 🎯 Practical Usage Examples

## 1. 🏃‍♂️ Quick Start Commands

### Run Different Test Types
```bash
# Run just smoke tests (critical functionality)
npx playwright test --grep @smoke

# Run regression tests
npx playwright test --grep @regression  

# Run API tests only
npx playwright test --grep @api

# Run E2E tests only
npx playwright test tests/e2e/

# Run specific test file
npx playwright test tests/e2e/auth.spec.ts

# Run in different browsers
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Debug and Development
```bash
# Run in headed mode (see the browser)
npx playwright test --headed

# Debug specific test
npx playwright test --debug tests/e2e/auth.spec.ts

# Generate test code by recording
npx playwright codegen http://localhost:3000
```

## 2. 🔧 Customizing for Your Application

### Step 1: Update Configuration
```bash
# Edit .env file with your application details
BASE_URL=http://localhost:3000     # Your app URL
API_BASE_URL=http://localhost:8080  # Your API URL
```

### Step 2: Create Page Objects for Your App
```typescript
// pages/your-app-page.ts
import { BasePage } from './base-page';
import { Page, Locator } from '@playwright/test';

export class YourAppPage extends BasePage {
  private menuButton: Locator;
  private searchInput: Locator;
  private resultsList: Locator;

  constructor(page: Page) {
    super(page);
    this.menuButton = page.locator('[data-testid="menu-button"]');
    this.searchInput = page.locator('#search-input');
    this.resultsList = page.locator('.results-list');
  }

  async goto(): Promise<void> {
    await this.page.goto('/your-page');
    await this.waitForPageLoad();
  }

  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
    await this.waitForResults();
  }

  private async waitForResults(): Promise<void> {
    await this.resultsList.waitFor({ state: 'visible' });
  }

  async getResultCount(): Promise<number> {
    return await this.resultsList.locator('.result-item').count();
  }
}
```

### Step 3: Write Tests for Your Features
```typescript
// tests/e2e/your-feature.spec.ts
import { test, expect } from '@playwright/test';
import { YourAppPage } from '../../pages/your-app-page';
import { logger } from '../../utils/logger';

test.describe('Your Feature Tests', () => {
  let yourPage: YourAppPage;

  test.beforeEach(async ({ page }) => {
    yourPage = new YourAppPage(page);
    await yourPage.goto();
  });

  test('should search and show results @smoke', async ({ page }) => {
    await yourPage.search('test query');
    
    const resultCount = await yourPage.getResultCount();
    expect(resultCount).toBeGreaterThan(0);
    
    logger.info(\`Found \${resultCount} results\`);
  });
});
```

## 3. 📊 Working with Test Data

### Example: Create Test Data for Your App
```json
// data/your-app-data.json
{
  "users": {
    "admin": {
      "email": "admin@yourapp.com",
      "password": "AdminPass123!",
      "role": "administrator"
    },
    "regular": {
      "email": "user@yourapp.com", 
      "password": "UserPass123!",
      "role": "user"
    }
  },
  "products": [
    {
      "name": "Test Product",
      "price": 29.99,
      "category": "electronics"
    }
  ]
}
```

### Using Test Data in Tests
```typescript
import { TestDataManager } from '../../utils/test-data-manager';

test('should login with test user', async ({ page }) => {
  const testData = await TestDataManager.loadJsonData('your-app-data.json');
  const adminUser = testData.users.admin;
  
  await loginPage.login(adminUser.email, adminUser.password);
  // Rest of test...
});
```

## 4. 🔍 Real-World Test Examples

### E2E User Journey Test
```typescript
test('complete user journey @regression', async ({ page }) => {
  // 1. Login
  await loginPage.goto();
  await loginPage.login('user@test.com', 'password123');
  
  // 2. Navigate to products
  await dashboardPage.navigateToProducts();
  
  // 3. Search for product
  await productsPage.search('laptop');
  
  // 4. Add to cart
  await productsPage.addFirstItemToCart();
  
  // 5. Checkout
  await cartPage.proceedToCheckout();
  await checkoutPage.completeOrder();
  
  // 6. Verify success
  await expect(page.locator('.success-message')).toBeVisible();
});
```

### API Integration Test
```typescript
test('API and UI sync test @integration', async ({ page }) => {
  const apiClient = new ApiClient(config.get('urls.api'));
  
  // Create data via API
  const newUser = await apiClient.post('/api/users', {
    name: 'Test User',
    email: 'test@example.com'
  });
  
  // Verify in UI
  await usersPage.goto();
  await usersPage.searchUser(newUser.data.email);
  
  const userRow = page.locator(\`[data-email="\${newUser.data.email}"]\`);
  await expect(userRow).toBeVisible();
});
```

## 5. 🎭 Advanced Usage Patterns

### Data-Driven Testing
```typescript
const testCases = [
  { input: 'valid@email.com', expected: 'success' },
  { input: 'invalid-email', expected: 'error' },
  { input: '', expected: 'required' }
];

testCases.forEach(({ input, expected }) => {
  test(\`should handle email: \${input}\`, async ({ page }) => {
    await emailForm.enterEmail(input);
    await emailForm.submit();
    
    if (expected === 'success') {
      await expect(page.locator('.success')).toBeVisible();
    } else {
      await expect(page.locator('.error')).toContainText(expected);
    }
  });
});
```

### Cross-Browser Testing
```typescript
// Run the same test across multiple browsers
['chromium', 'firefox', 'webkit'].forEach(browserName => {
  test(\`should work in \${browserName}\`, async ({ page }, testInfo) => {
    // Your test logic here
    await yourPage.performAction();
    await expect(page.locator('.result')).toBeVisible();
  });
});
```

## 6. 📈 Monitoring and Reporting

### Custom Logging in Tests
```typescript
test('with detailed logging', async ({ page }) => {
  logger.testStart('Custom test with logging', __filename);
  
  logger.step('Step 1: Navigate to page');
  await page.goto('/your-page');
  
  logger.step('Step 2: Perform action');
  await page.click('.action-button');
  
  logger.step('Step 3: Verify result');
  await expect(page.locator('.result')).toBeVisible();
  
  logger.testEnd('Custom test completed', 'passed', Date.now());
});
```

### Performance Testing
```typescript
test('page load performance @performance', async ({ page }) => {
  const startTime = Date.now();
  
  await page.goto('/your-heavy-page');
  await page.waitForLoadState('networkidle');
  
  const loadTime = Date.now() - startTime;
  
  expect(loadTime).toBeLessThan(3000); // Should load in under 3 seconds
  logger.performance(\`Page loaded in \${loadTime}ms\`);
});
```

## 7. 🚀 Integration with Your Workflow

### Pre-commit Hook
```bash
# Add to package.json scripts
"test:smoke": "npx playwright test --grep @smoke",
"test:quick": "npx playwright test --workers=1 --grep @smoke",
"test:ci": "npx playwright test --reporter=junit"
```

### IDE Integration
- Install Playwright extension in VS Code
- Use test runner to run individual tests
- Debug tests with breakpoints

## 8. 🔧 Troubleshooting Your Application

### Common Adaptations Needed

1. **Update Selectors**: Replace the example selectors with your app's actual selectors
2. **Adjust Timeouts**: Some apps need longer timeouts
3. **Handle Authentication**: Implement your app's specific login flow
4. **Add Waits**: Add appropriate waits for your app's loading patterns

### Environment-Specific Configuration
```typescript
// For different environments
const config = {
  development: {
    baseUrl: 'http://localhost:3000',
    slowMo: 1000 // Slower for debugging
  },
  staging: {
    baseUrl: 'https://staging.yourapp.com',
    retries: 3
  },
  production: {
    baseUrl: 'https://yourapp.com',
    retries: 2,
    workers: 2 // Less aggressive on prod
  }
};
```

---

## 🎯 Your Next Steps:

1. **Start Small**: Begin with one simple test for your most critical user journey
2. **Build Page Objects**: Create page objects for your main pages
3. **Add Test Data**: Create JSON files with your application's test data
4. **Run and Iterate**: Run tests, fix issues, and gradually expand coverage
5. **Integrate CI/CD**: Set up automated testing in your deployment pipeline

The framework is designed to be flexible and adaptable to any web application. Start with the basics and expand as your testing needs grow! 🚀
