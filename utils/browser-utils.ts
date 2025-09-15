import { Page, Browser, BrowserContext } from '@playwright/test';
import { logger } from './logger';

/**
 * Enhanced Browser Management utility
 */
export class BrowserManager {
  private static browsers: Map<string, Browser> = new Map();
  private static contexts: Map<string, BrowserContext> = new Map();
  private static pages: Map<string, Page> = new Map();

  /**
   * Register browser instance
   */
  static registerBrowser(name: string, browser: Browser): void {
    this.browsers.set(name, browser);
    logger.info(`Browser registered: ${name}`);
  }

  /**
   * Register context instance
   */
  static registerContext(name: string, context: BrowserContext): void {
    this.contexts.set(name, context);
    logger.info(`Context registered: ${name}`);
  }

  /**
   * Register page instance
   */
  static registerPage(name: string, page: Page): void {
    this.pages.set(name, page);
    logger.info(`Page registered: ${name}`);
  }

  /**
   * Get browser by name
   */
  static getBrowser(name: string): Browser | undefined {
    return this.browsers.get(name);
  }

  /**
   * Get context by name
   */
  static getContext(name: string): BrowserContext | undefined {
    return this.contexts.get(name);
  }

  /**
   * Get page by name
   */
  static getPage(name: string): Page | undefined {
    return this.pages.get(name);
  }

  /**
   * Close all resources
   */
  static async closeAll(): Promise<void> {
    logger.info('Closing all browser resources...');
    
    // Close all pages
    for (const [name, page] of this.pages.entries()) {
      try {
        await page.close();
        logger.info(`Page closed: ${name}`);
      } catch (error) {
        logger.error(`Error closing page ${name}:`, error as Error);
      }
    }

    // Close all contexts
    for (const [name, context] of this.contexts.entries()) {
      try {
        await context.close();
        logger.info(`Context closed: ${name}`);
      } catch (error) {
        logger.error(`Error closing context ${name}:`, error as Error);
      }
    }

    // Close all browsers
    for (const [name, browser] of this.browsers.entries()) {
      try {
        await browser.close();
        logger.info(`Browser closed: ${name}`);
      } catch (error) {
        logger.error(`Error closing browser ${name}:`, error as Error);
      }
    }

    // Clear all maps
    this.pages.clear();
    this.contexts.clear();
    this.browsers.clear();
  }
}

/**
 * Page utilities for enhanced page interactions
 */
export class PageUtils {
  constructor(private page: Page) {}

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad(timeout: number = 30000): Promise<void> {
    try {
      await this.page.waitForLoadState('networkidle', { timeout });
      await this.page.waitForLoadState('domcontentloaded', { timeout });
      logger.stepEnd('Page fully loaded', true);
    } catch (error) {
      logger.error('Page load timeout', error as Error);
      throw error;
    }
  }

  /**
   * Safe click with retry mechanism
   */
  async safeClick(selector: string, options?: { timeout?: number; retries?: number }): Promise<void> {
    const timeout = options?.timeout || 10000;
    const retries = options?.retries || 3;

    for (let i = 0; i < retries; i++) {
      try {
        await this.page.locator(selector).click({ timeout });
        logger.elementInteraction('click', selector);
        return;
      } catch (error) {
        if (i === retries - 1) {
          logger.error(`Failed to click element after ${retries} retries: ${selector}`, error as Error);
          throw error;
        }
        logger.warn(`Click attempt ${i + 1} failed for ${selector}, retrying...`);
        await this.page.waitForTimeout(1000);
      }
    }
  }

  /**
   * Safe type with clear and retry
   */
  async safeType(selector: string, text: string, options?: { timeout?: number; retries?: number }): Promise<void> {
    const timeout = options?.timeout || 10000;
    const retries = options?.retries || 3;

    for (let i = 0; i < retries; i++) {
      try {
        const element = this.page.locator(selector);
        await element.clear({ timeout });
        await element.fill(text, { timeout });
        logger.elementInteraction('type', selector, text);
        return;
      } catch (error) {
        if (i === retries - 1) {
          logger.error(`Failed to type in element after ${retries} retries: ${selector}`, error as Error);
          throw error;
        }
        logger.warn(`Type attempt ${i + 1} failed for ${selector}, retrying...`);
        await this.page.waitForTimeout(1000);
      }
    }
  }

  /**
   * Take screenshot with automatic naming
   */
  async takeScreenshot(name?: string, fullPage: boolean = false): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotName = name || `screenshot-${timestamp}`;
    const path = `test-results/screenshots/${screenshotName}.png`;
    
    await this.page.screenshot({ 
      path, 
      fullPage,
      type: 'png'
    });
    
    logger.screenshot(path, screenshotName);
    return path;
  }

  /**
   * Scroll to element
   */
  async scrollToElement(selector: string): Promise<void> {
    try {
      await this.page.locator(selector).scrollIntoViewIfNeeded();
      logger.elementInteraction('scroll', selector);
    } catch (error) {
      logger.error(`Failed to scroll to element: ${selector}`, error as Error);
      throw error;
    }
  }

  /**
   * Wait for element to be visible
   */
  async waitForVisible(selector: string, timeout: number = 10000): Promise<void> {
    try {
      await this.page.locator(selector).waitFor({ state: 'visible', timeout });
      logger.elementInteraction('wait for visible', selector);
    } catch (error) {
      logger.error(`Element not visible within timeout: ${selector}`, error as Error);
      throw error;
    }
  }

  /**
   * Get page performance metrics
   */
  async getPerformanceMetrics(): Promise<object> {
    const metrics = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
        largestContentfulPaint: performance.getEntriesByName('largest-contentful-paint')[0]?.startTime || 0,
      };
    });
    
    logger.performance('Page metrics collected', 0, metrics);
    return metrics;
  }
}
