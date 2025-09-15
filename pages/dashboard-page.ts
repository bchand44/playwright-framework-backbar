import { BasePage } from './base-page';
import { Page } from '@playwright/test';

/**
 * Dashboard Page Object
 */
export class DashboardPage extends BasePage {
  // Selectors
  private selectors = {
    welcomeMessage: '[data-testid="welcome-message"], .welcome-message',
    navigationMenu: '[data-testid="nav-links"], .nav-links',
    userProfile: '[data-testid="logout-button"], .logout-btn', // Using logout button as user profile indicator
    logoutButton: '[data-testid="logout-button"], .logout-btn',
    notificationBell: '[data-testid="notifications"], .notifications',
    settingsButton: '[data-testid="settings"], .settings-btn',
    dashboardCards: '[data-testid="dashboard-content"], .dashboard-content',
    statsContainer: '[data-testid="stats"], .stats-container',
    searchBox: '[data-testid="search"], .search-input'
  };

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to dashboard
   */
  async goto(): Promise<void> {
    await super.goto('/dashboard');
  }

  /**
   * Get welcome message
   */
  async getWelcomeMessage(): Promise<string> {
    return await this.getText(this.selectors.welcomeMessage);
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    await this.click(this.selectors.logoutButton);
  }

  /**
   * Search for item
   */
  async search(query: string): Promise<void> {
    await this.type(this.selectors.searchBox, query);
    await this.page.keyboard.press('Enter');
  }

  /**
   * Click user profile
   */
  async clickUserProfile(): Promise<void> {
    await this.click(this.selectors.userProfile);
  }

  /**
   * Click notifications
   */
  async clickNotifications(): Promise<void> {
    await this.click(this.selectors.notificationBell);
  }

  /**
   * Click settings
   */
  async clickSettings(): Promise<void> {
    await this.click(this.selectors.settingsButton);
  }

  /**
   * Get dashboard cards count
   */
  async getDashboardCardsCount(): Promise<number> {
    const cards = await this.getAllElements(this.selectors.dashboardCards);
    return cards.length;
  }

  /**
   * Navigate to specific section
   */
  async navigateToSection(sectionName: string): Promise<void> {
    const selector = `${this.selectors.navigationMenu} a[href*="${sectionName.toLowerCase()}"]`;
    await this.click(selector);
  }

  /**
   * Validate dashboard loaded
   */
  async validateDashboardLoaded(): Promise<void> {
    await this.assertElementVisible(this.selectors.welcomeMessage);
    await this.assertElementVisible(this.selectors.navigationMenu);
    await this.assertElementVisible(this.selectors.userProfile);
  }

  /**
   * Get user stats
   */
  async getUserStats(): Promise<Record<string, string>> {
    const statsElements = await this.getAllElements(`${this.selectors.statsContainer} .stat-item`);
    const stats: Record<string, string> = {};

    for (const element of statsElements) {
      const label = await element.locator('.stat-label').textContent();
      const value = await element.locator('.stat-value').textContent();
      if (label && value) {
        stats[label.trim()] = value.trim();
      }
    }

    return stats;
  }
}
