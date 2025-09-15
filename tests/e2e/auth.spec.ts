import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login-page';
import { DashboardPage } from '../../pages/dashboard-page';
import { TestDataManager } from '../../utils/test-data-manager';
import { logger } from '../../utils/logger';

test.describe('Authentication Tests', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let testCredentials: any;

  test.beforeAll(async () => {
    // Load test data
    testCredentials = await TestDataManager.loadJsonData('test-credentials.json');
    logger.info('Test data loaded for authentication tests');
  });

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    
    logger.testStart(test.info().title, test.info().file);
    await loginPage.goto();
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status === 'failed') {
      await page.screenshot({ 
        path: `test-results/screenshots/${testInfo.title}-${Date.now()}.png`,
        fullPage: true 
      });
    }
    
    logger.testEnd(
      testInfo.title, 
      testInfo.status as 'passed' | 'failed' | 'skipped', 
      testInfo.duration
    );
  });

  test('should login with valid credentials @smoke', async ({ page }) => {
    const validUser = testCredentials.validUser;
    
    // Validate login form is displayed
    await loginPage.validateLoginForm();
    
    // Perform login
    await loginPage.login(validUser.username, validUser.password);
    
    // Verify successful login
    await dashboardPage.validateDashboardLoaded();
    await expect(page).toHaveURL(/.*dashboard/);
    
    const welcomeMessage = await dashboardPage.getWelcomeMessage();
    expect(welcomeMessage).toContain('Welcome');
  });

  test('should not login with invalid credentials @negative', async ({ page }) => {
    const invalidUser = testCredentials.invalidUser;
    
    // Attempt login with invalid credentials
    await loginPage.login(invalidUser.username, invalidUser.password);
    
    // Verify error message is displayed
    await expect(async () => {
      const isErrorVisible = await loginPage.isErrorMessageVisible();
      expect(isErrorVisible).toBeTruthy();
    }).toPass();
    
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toMatch(/invalid|incorrect|wrong/i);
  });

  test('should show validation for empty fields @validation', async ({ page }) => {
    // Try to login with empty fields
    await loginPage.clickLoginButton();
    
    // Verify validation messages or form doesn't submit
    const currentUrl = await loginPage.getCurrentUrl();
    expect(currentUrl).toContain('/login');
  });

  test('should navigate to forgot password page', async ({ page }) => {
    await loginPage.clickForgotPassword();
    
    const currentUrl = await loginPage.getCurrentUrl();
    expect(currentUrl).toMatch(/forgot|reset/);
  });

  test('should login with remember me checked @functionality', async ({ page }) => {
    const validUser = testCredentials.validUser;
    
    await loginPage.login(validUser.username, validUser.password, true);
    
    // Verify successful login
    await dashboardPage.validateDashboardLoaded();
    
    // Check if remember me functionality worked (this would need actual implementation)
    // For now, just verify we reached the dashboard
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should clear form fields', async ({ page }) => {
    const testUser = testCredentials.validUser;
    
    // Fill form
    await loginPage.enterUsername(testUser.username);
    await loginPage.enterPassword(testUser.password);
    
    // Clear form
    await loginPage.clearForm();
    
    // Verify fields are empty
    const usernameValue = await loginPage.getAttribute('[data-testid="username"]', 'value');
    const passwordValue = await loginPage.getAttribute('[data-testid="password"]', 'value');
    
    expect(usernameValue || '').toBe('');
    expect(passwordValue || '').toBe('');
  });

  test.describe('Multiple User Types', () => {
    const userTypes = ['validUser', 'adminUser'];
    
    userTypes.forEach(userType => {
      test(`should login as ${userType} @regression`, async ({ page }) => {
        const user = testCredentials[userType];
        
        await loginPage.login(user.username, user.password);
        await dashboardPage.validateDashboardLoaded();
        
        // Add user-specific validations here
        const welcomeMessage = await dashboardPage.getWelcomeMessage();
        expect(welcomeMessage).toContain('Welcome');
      });
    });
  });

  test('should handle login with special characters in password @edge-case', async ({ page }) => {
    // Generate a user with special characters in password
    const specialUser = TestDataManager.generateUserData(1) as any;
    specialUser.password = 'Test@#$%^&*()123!';
    
    // This test assumes the application can handle special characters
    await loginPage.enterUsername(specialUser.email);
    await loginPage.enterPassword(specialUser.password);
    await loginPage.clickLoginButton();
    
    // Since this is a generated user, we expect it to fail
    // but the application should handle it gracefully
    const isErrorVisible = await loginPage.isErrorMessageVisible();
    expect(isErrorVisible).toBeTruthy();
  });
});
