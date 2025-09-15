import { Page, Locator, expect } from '@playwright/test';
import { PageUtils } from '../utils/browser-utils';
import { logger } from '../utils/logger';
import { config } from '../utils/config';

/**
 * Base Page Object class with common functionality
 */
export abstract class BasePage {
  protected page: Page;
  protected pageUtils: PageUtils;
  protected baseUrl: string;

  constructor(page: Page) {
    this.page = page;
    this.pageUtils = new PageUtils(page);
    this.baseUrl = config.get('urls.base');
  }

  /**
   * Navigate to a specific URL
   */
  async goto(url: string, options?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' }): Promise<void> {
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    logger.stepStart(`Navigate to ${fullUrl}`);
    
    try {
      await this.page.goto(fullUrl, {
        waitUntil: options?.waitUntil || 'domcontentloaded',
        timeout: config.get('browser.timeout')
      });
      await this.pageUtils.waitForPageLoad();
      
      const title = await this.page.title();
      logger.pageNavigation(fullUrl, title);
      logger.stepEnd(`Navigate to ${fullUrl}`, true);
    } catch (error) {
      logger.stepEnd(`Navigate to ${fullUrl}`, false);
      throw error;
    }
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Get current URL
   */
  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  /**
   * Wait for element to be visible
   */
  async waitForElement(selector: string, timeout?: number): Promise<Locator> {
    const element = this.page.locator(selector);
    await element.waitFor({ 
      state: 'visible', 
      timeout: timeout || config.get('test.expectTimeout') 
    });
    return element;
  }

  /**
   * Click element with retry mechanism
   */
  async click(selector: string, options?: { timeout?: number; force?: boolean }): Promise<void> {
    logger.stepStart(`Click element: ${selector}`);
    
    try {
      await this.pageUtils.safeClick(selector, options);
      logger.stepEnd(`Click element: ${selector}`, true);
    } catch (error) {
      logger.stepEnd(`Click element: ${selector}`, false);
      throw error;
    }
  }

  /**
   * Type text into element
   */
  async type(selector: string, text: string, options?: { timeout?: number; delay?: number }): Promise<void> {
    logger.stepStart(`Type text into: ${selector}`);
    
    try {
      await this.pageUtils.safeType(selector, text, options);
      logger.stepEnd(`Type text into: ${selector}`, true);
    } catch (error) {
      logger.stepEnd(`Type text into: ${selector}`, false);
      throw error;
    }
  }

  /**
   * Get text content of element
   */
  async getText(selector: string): Promise<string> {
    const element = await this.waitForElement(selector);
    const text = await element.textContent() || '';
    logger.elementInteraction('get text', selector, text);
    return text.trim();
  }

  /**
   * Get attribute value
   */
  async getAttribute(selector: string, attribute: string): Promise<string | null> {
    const element = await this.waitForElement(selector);
    const value = await element.getAttribute(attribute);
    logger.elementInteraction('get attribute', selector, `${attribute}=${value}`);
    return value;
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector: string): Promise<boolean> {
    try {
      const element = this.page.locator(selector);
      const isVisible = await element.isVisible();
      logger.elementInteraction('check visibility', selector, isVisible.toString());
      return isVisible;
    } catch {
      return false;
    }
  }

  /**
   * Check if element is enabled
   */
  async isEnabled(selector: string): Promise<boolean> {
    try {
      const element = this.page.locator(selector);
      const isEnabled = await element.isEnabled();
      logger.elementInteraction('check enabled', selector, isEnabled.toString());
      return isEnabled;
    } catch {
      return false;
    }
  }

  /**
   * Select option from dropdown
   */
  async selectOption(selector: string, option: string | number): Promise<void> {
    logger.stepStart(`Select option: ${option} from ${selector}`);
    
    try {
      const element = await this.waitForElement(selector);
      await element.selectOption(option.toString());
      logger.stepEnd(`Select option: ${option} from ${selector}`, true);
    } catch (error) {
      logger.stepEnd(`Select option: ${option} from ${selector}`, false);
      throw error;
    }
  }

  /**
   * Upload file
   */
  async uploadFile(selector: string, filePath: string): Promise<void> {
    logger.stepStart(`Upload file: ${filePath} to ${selector}`);
    
    try {
      const element = await this.waitForElement(selector);
      await element.setInputFiles(filePath);
      logger.stepEnd(`Upload file: ${filePath} to ${selector}`, true);
    } catch (error) {
      logger.stepEnd(`Upload file: ${filePath} to ${selector}`, false);
      throw error;
    }
  }

  /**
   * Scroll to element
   */
  async scrollToElement(selector: string): Promise<void> {
    await this.pageUtils.scrollToElement(selector);
  }

  /**
   * Take screenshot
   */
  async takeScreenshot(name?: string): Promise<string> {
    return await this.pageUtils.takeScreenshot(name);
  }

  /**
   * Wait for specific time
   */
  async wait(milliseconds: number): Promise<void> {
    await this.page.waitForTimeout(milliseconds);
    logger.debug(`Waited for ${milliseconds}ms`);
  }

  /**
   * Wait for page load
   */
  async waitForPageLoad(): Promise<void> {
    await this.pageUtils.waitForPageLoad();
  }

  /**
   * Refresh page
   */
  async refresh(): Promise<void> {
    logger.stepStart('Refresh page');
    
    try {
      await this.page.reload({ waitUntil: 'domcontentloaded' });
      await this.waitForPageLoad();
      logger.stepEnd('Refresh page', true);
    } catch (error) {
      logger.stepEnd('Refresh page', false);
      throw error;
    }
  }

  /**
   * Go back in browser history
   */
  async goBack(): Promise<void> {
    logger.stepStart('Navigate back');
    
    try {
      await this.page.goBack({ waitUntil: 'domcontentloaded' });
      await this.waitForPageLoad();
      logger.stepEnd('Navigate back', true);
    } catch (error) {
      logger.stepEnd('Navigate back', false);
      throw error;
    }
  }

  /**
   * Go forward in browser history
   */
  async goForward(): Promise<void> {
    logger.stepStart('Navigate forward');
    
    try {
      await this.page.goForward({ waitUntil: 'domcontentloaded' });
      await this.waitForPageLoad();
      logger.stepEnd('Navigate forward', true);
    } catch (error) {
      logger.stepEnd('Navigate forward', false);
      throw error;
    }
  }

  /**
   * Execute JavaScript
   */
  async executeScript(script: string, ...args: any[]): Promise<any> {
    logger.stepStart('Execute JavaScript');
    
    try {
      const result = await this.page.evaluate(script, ...args);
      logger.stepEnd('Execute JavaScript', true);
      return result;
    } catch (error) {
      logger.stepEnd('Execute JavaScript', false);
      throw error;
    }
  }

  /**
   * Get all elements matching selector
   */
  async getAllElements(selector: string): Promise<Locator[]> {
    const elements = await this.page.locator(selector).all();
    logger.elementInteraction('get all elements', selector, `Found ${elements.length} elements`);
    return elements;
  }

  /**
   * Assert element text
   */
  async assertElementText(selector: string, expectedText: string): Promise<void> {
    const element = await this.waitForElement(selector);
    await expect(element).toHaveText(expectedText);
    logger.assertion(`Element text equals "${expectedText}"`, true, expectedText);
  }

  /**
   * Assert element visibility
   */
  async assertElementVisible(selector: string): Promise<void> {
    const element = this.page.locator(selector);
    await expect(element).toBeVisible();
    logger.assertion(`Element is visible: ${selector}`, true);
  }

  /**
   * Assert element not visible
   */
  async assertElementNotVisible(selector: string): Promise<void> {
    const element = this.page.locator(selector);
    await expect(element).not.toBeVisible();
    logger.assertion(`Element is not visible: ${selector}`, true);
  }

  /**
   * Assert page title
   */
  async assertPageTitle(expectedTitle: string): Promise<void> {
    await expect(this.page).toHaveTitle(expectedTitle);
    logger.assertion(`Page title equals "${expectedTitle}"`, true, expectedTitle);
  }

  /**
   * Assert page URL
   */
  async assertPageUrl(expectedUrl: string): Promise<void> {
    await expect(this.page).toHaveURL(expectedUrl);
    logger.assertion(`Page URL equals "${expectedUrl}"`, true, expectedUrl);
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(): Promise<object> {
    return await this.pageUtils.getPerformanceMetrics();
  }
}
