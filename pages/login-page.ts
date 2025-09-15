import { BasePage } from './base-page';
import { Page } from '@playwright/test';

/**
 * Login Page Object
 */
export class LoginPage extends BasePage {
  // Selectors
  private readonly selectors = {
    usernameInput: '[data-testid="username"], #username, input[name="username"]',
    passwordInput: '[data-testid="password"], #password, input[name="password"]',
    loginButton: '[data-testid="login-button"], #login-btn, button[type="submit"]',
    forgotPasswordLink: '[data-testid="forgot-password"], a[href*="forgot"]',
    errorMessage: '[data-testid="error-message"], .error, .alert-danger',
    rememberMeCheckbox: '[data-testid="remember-me"], #remember-me',
    signUpLink: '[data-testid="signup-link"], a[href*="signup"]'
  };

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to login page
   */
  async goto(): Promise<void> {
    await super.goto('/login');
  }

  /**
   * Login with credentials
   */
  async login(username: string, password: string, rememberMe: boolean = false): Promise<void> {
    await this.enterUsername(username);
    await this.enterPassword(password);
    
    if (rememberMe) {
      await this.checkRememberMe();
    }
    
    await this.clickLoginButton();
  }

  /**
   * Enter username
   */
  async enterUsername(username: string): Promise<void> {
    await this.type(this.selectors.usernameInput, username);
  }

  /**
   * Enter password
   */
  async enterPassword(password: string): Promise<void> {
    await this.type(this.selectors.passwordInput, password);
  }

  /**
   * Click login button
   */
  async clickLoginButton(): Promise<void> {
    await this.click(this.selectors.loginButton);
  }

  /**
   * Check remember me checkbox
   */
  async checkRememberMe(): Promise<void> {
    const checkbox = this.page.locator(this.selectors.rememberMeCheckbox);
    if (!(await checkbox.isChecked())) {
      await this.click(this.selectors.rememberMeCheckbox);
    }
  }

  /**
   * Click forgot password link
   */
  async clickForgotPassword(): Promise<void> {
    await this.click(this.selectors.forgotPasswordLink);
  }

  /**
   * Click sign up link
   */
  async clickSignUp(): Promise<void> {
    await this.click(this.selectors.signUpLink);
  }

  /**
   * Get error message
   */
  async getErrorMessage(): Promise<string> {
    return await this.getText(this.selectors.errorMessage);
  }

  /**
   * Check if error message is visible
   */
  async isErrorMessageVisible(): Promise<boolean> {
    return await this.isVisible(this.selectors.errorMessage);
  }

  /**
   * Validate login form elements
   */
  async validateLoginForm(): Promise<void> {
    await this.assertElementVisible(this.selectors.usernameInput);
    await this.assertElementVisible(this.selectors.passwordInput);
    await this.assertElementVisible(this.selectors.loginButton);
  }

  /**
   * Clear login form
   */
  async clearForm(): Promise<void> {
    await this.page.locator(this.selectors.usernameInput).clear();
    await this.page.locator(this.selectors.passwordInput).clear();
  }
}
