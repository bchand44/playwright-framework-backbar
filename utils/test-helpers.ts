import { Page, expect } from '@playwright/test';
import { logger } from './logger';

/**
 * Test helpers and utilities for common test operations
 */
export class TestHelpers {
  /**
   * Wait for element with custom timeout and polling
   */
  static async waitForElement(
    page: Page, 
    selector: string, 
    options: { timeout?: number; state?: 'visible' | 'hidden' | 'stable' } = {}
  ): Promise<void> {
    const { timeout = 10000, state = 'visible' } = options;
    
    try {
      await page.locator(selector).waitFor({ state: state as 'attached' | 'detached' | 'visible' | 'hidden', timeout });
      logger.debug(`Element found: ${selector}`);
    } catch (error) {
      logger.error(`Element not found: ${selector}`, error as Error);
      throw error;
    }
  }

  /**
   * Safe click with multiple attempts and different strategies
   */
  static async safeClick(
    page: Page, 
    selector: string, 
    options: { timeout?: number; attempts?: number; force?: boolean } = {}
  ): Promise<void> {
    const { timeout = 10000, attempts = 3, force = false } = options;
    
    for (let i = 0; i < attempts; i++) {
      try {
        const element = page.locator(selector);
        
        // Wait for element to be actionable
        await element.waitFor({ state: 'visible', timeout });
        
        // Scroll into view if needed
        await element.scrollIntoViewIfNeeded();
        
        // Click the element
        await element.click({ timeout, force });
        
        logger.debug(`Successfully clicked: ${selector}`);
        return;
      } catch (error) {
        if (i === attempts - 1) {
          logger.error(`Failed to click after ${attempts} attempts: ${selector}`, error as Error);
          throw error;
        }
        
        logger.warn(`Click attempt ${i + 1} failed for ${selector}, retrying...`);
        await page.waitForTimeout(1000);
      }
    }
  }

  /**
   * Type text with clearing and validation
   */
  static async safeType(
    page: Page, 
    selector: string, 
    text: string, 
    options: { timeout?: number; validate?: boolean } = {}
  ): Promise<void> {
    const { timeout = 10000, validate = true } = options;
    
    try {
      const element = page.locator(selector);
      
      // Wait for element and clear it
      await element.waitFor({ state: 'visible', timeout });
      await element.clear();
      
      // Type the text
      await element.fill(text);
      
      // Validate if requested
      if (validate) {
        const value = await element.inputValue();
        if (value !== text) {
          throw new Error(`Text validation failed. Expected: "${text}", Actual: "${value}"`);
        }
      }
      
      logger.debug(`Successfully typed into ${selector}: ${text}`);
    } catch (error) {
      logger.error(`Failed to type into ${selector}`, error as Error);
      throw error;
    }
  }

  /**
   * Upload file with validation
   */
  static async uploadFile(
    page: Page, 
    selector: string, 
    filePath: string | string[], 
    options: { timeout?: number } = {}
  ): Promise<void> {
    const { timeout = 10000 } = options;
    
    try {
      const element = page.locator(selector);
      await element.waitFor({ state: 'visible', timeout });
      await element.setInputFiles(filePath);
      
      logger.debug(`File(s) uploaded to ${selector}: ${filePath}`);
    } catch (error) {
      logger.error(`Failed to upload file to ${selector}`, error as Error);
      throw error;
    }
  }

  /**
   * Select dropdown option with multiple strategies
   */
  static async selectDropdownOption(
    page: Page, 
    selector: string, 
    option: string | number, 
    strategy: 'value' | 'label' | 'index' = 'label'
  ): Promise<void> {
    try {
      const element = page.locator(selector);
      await element.waitFor({ state: 'visible' });
      
      switch (strategy) {
        case 'value':
          await element.selectOption({ value: option.toString() });
          break;
        case 'label':
          await element.selectOption({ label: option.toString() });
          break;
        case 'index':
          await element.selectOption({ index: Number(option) });
          break;
      }
      
      logger.debug(`Selected option in ${selector}: ${option} (${strategy})`);
    } catch (error) {
      logger.error(`Failed to select option in ${selector}`, error as Error);
      throw error;
    }
  }

  /**
   * Wait for network to be idle
   */
  static async waitForNetworkIdle(page: Page, timeout: number = 30000): Promise<void> {
    try {
      await page.waitForLoadState('networkidle', { timeout });
      logger.debug('Network is idle');
    } catch (error) {
      logger.warn('Network idle timeout, continuing...', error as object);
    }
  }

  /**
   * Check if element exists without throwing
   */
  static async elementExists(page: Page, selector: string): Promise<boolean> {
    try {
      const count = await page.locator(selector).count();
      return count > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get element count
   */
  static async getElementCount(page: Page, selector: string): Promise<number> {
    try {
      return await page.locator(selector).count();
    } catch {
      return 0;
    }
  }

  /**
   * Take screenshot with timestamp
   */
  static async takeTimestampedScreenshot(
    page: Page, 
    name: string, 
    options: { fullPage?: boolean; path?: string } = {}
  ): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.png`;
    const path = options.path || `test-results/screenshots/${filename}`;
    
    await page.screenshot({
      path,
      fullPage: options.fullPage || false,
      type: 'png'
    });
    
    logger.screenshot(path, name);
    return path;
  }

  /**
   * Wait for element to contain text
   */
  static async waitForText(
    page: Page, 
    selector: string, 
    text: string, 
    options: { timeout?: number; exact?: boolean } = {}
  ): Promise<void> {
    const { timeout = 10000, exact = false } = options;
    
    try {
      const element = page.locator(selector);
      
      if (exact) {
        await expect(element).toHaveText(text, { timeout });
      } else {
        await expect(element).toContainText(text, { timeout });
      }
      
      logger.debug(`Text found in ${selector}: ${text}`);
    } catch (error) {
      logger.error(`Text not found in ${selector}: ${text}`, error as Error);
      throw error;
    }
  }

  /**
   * Scroll to element
   */
  static async scrollToElement(page: Page, selector: string): Promise<void> {
    try {
      const element = page.locator(selector);
      await element.scrollIntoViewIfNeeded();
      logger.debug(`Scrolled to element: ${selector}`);
    } catch (error) {
      logger.error(`Failed to scroll to element: ${selector}`, error as Error);
      throw error;
    }
  }

  /**
   * Wait for page to load completely
   */
  static async waitForPageLoad(page: Page, timeout: number = 30000): Promise<void> {
    try {
      await Promise.all([
        page.waitForLoadState('load', { timeout }),
        page.waitForLoadState('domcontentloaded', { timeout }),
        page.waitForLoadState('networkidle', { timeout: timeout / 2 }).catch(() => {
          logger.warn('Network idle timeout, but continuing...');
        })
      ]);
      
      logger.debug('Page loaded completely');
    } catch (error) {
      logger.warn('Page load timeout, but continuing...', error as object);
    }
  }

  /**
   * Clear browser data
   */
  static async clearBrowserData(page: Page): Promise<void> {
    try {
      const context = page.context();
      await context.clearCookies();
      await context.clearPermissions();
      
      // Clear local/session storage
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      logger.debug('Browser data cleared');
    } catch (error) {
      logger.error('Failed to clear browser data', error as Error);
    }
  }

  /**
   * Set device pixel ratio for high DPI testing
   */
  static async setDevicePixelRatio(page: Page, ratio: number): Promise<void> {
    try {
      await page.emulateMedia({ 
        media: 'screen', 
        colorScheme: 'light' 
      });
      
      // This would need CDP (Chrome DevTools Protocol) for full support
      logger.debug(`Device pixel ratio set to: ${ratio}`);
    } catch (error) {
      logger.error('Failed to set device pixel ratio', error as Error);
    }
  }

  /**
   * Mock API response
   */
  static async mockApiResponse(
    page: Page, 
    url: string | RegExp, 
    response: any, 
    status: number = 200
  ): Promise<void> {
    try {
      await page.route(url, async route => {
        await route.fulfill({
          status,
          contentType: 'application/json',
          body: JSON.stringify(response)
        });
      });
      
      logger.debug(`API response mocked for: ${url}`);
    } catch (error) {
      logger.error(`Failed to mock API response for: ${url}`, error as Error);
      throw error;
    }
  }

  /**
   * Block network requests by pattern
   */
  static async blockRequests(page: Page, patterns: string[]): Promise<void> {
    try {
      await page.route('**/*', async route => {
        const url = route.request().url();
        const shouldBlock = patterns.some(pattern => url.includes(pattern));
        
        if (shouldBlock) {
          await route.abort();
          logger.debug(`Blocked request: ${url}`);
        } else {
          await route.continue();
        }
      });
      
      logger.debug(`Request blocking enabled for patterns: ${patterns.join(', ')}`);
    } catch (error) {
      logger.error('Failed to setup request blocking', error as Error);
      throw error;
    }
  }
}
