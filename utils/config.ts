import dotenv from 'dotenv';
import { logger } from './logger';

// Load environment variables
dotenv.config();

/**
 * Configuration management for different environments
 */
export class Config {
  private static instance: Config;
  private config: any;

  private constructor() {
    this.config = this.loadConfig();
  }

  static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  private loadConfig(): any {
    const env = process.env.NODE_ENV || 'development';
    
    const baseConfig = {
      environment: env,
      browser: {
        headless: process.env.HEADLESS === 'true',
        slowMo: parseInt(process.env.SLOW_MO || '0'),
        timeout: parseInt(process.env.BROWSER_TIMEOUT || '60000'),
        viewport: {
          width: parseInt(process.env.VIEWPORT_WIDTH || '1920'),
          height: parseInt(process.env.VIEWPORT_HEIGHT || '1080')
        }
      },
      test: {
        workers: parseInt(process.env.WORKERS || '4'),
        retries: parseInt(process.env.RETRIES || '2'),
        timeout: parseInt(process.env.TEST_TIMEOUT || '60000'),
        expectTimeout: parseInt(process.env.EXPECT_TIMEOUT || '10000')
      },
      urls: {
        base: process.env.BASE_URL || 'https://example.com',
        api: process.env.API_BASE_URL || 'https://api.example.com',
        staging: process.env.STAGING_URL,
        production: process.env.PRODUCTION_URL
      },
      database: {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432'),
        name: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
      },
      api: {
        key: process.env.API_KEY,
        jwtSecret: process.env.JWT_SECRET,
        timeout: parseInt(process.env.API_TIMEOUT || '30000')
      },
      reporting: {
        allureResultsDir: process.env.ALLURE_RESULTS_DIR || 'allure-results',
        playwrightReportDir: process.env.PLAYWRIGHT_REPORT_DIR || 'playwright-report',
        screenshotMode: process.env.SCREENSHOT_MODE || 'only-on-failure',
        videoMode: process.env.VIDEO_MODE || 'retain-on-failure',
        traceMode: process.env.TRACE_MODE || 'on-first-retry'
      },
      logging: {
        level: process.env.LOG_LEVEL || 'info',
        toFile: process.env.LOG_TO_FILE === 'true',
        toConsole: process.env.LOG_TO_CONSOLE !== 'false'
      },
      email: {
        smtp: {
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          user: process.env.SMTP_USER,
          password: process.env.SMTP_PASSWORD
        }
      },
      notifications: {
        slack: {
          webhookUrl: process.env.SLACK_WEBHOOK_URL
        }
      },
      testData: {
        useFaker: process.env.USE_FAKER_DATA === 'true',
        dataPath: process.env.TEST_DATA_PATH || './data/testdata.json'
      }
    };

    // Environment-specific overrides
    const envConfigs = {
      development: {
        urls: {
          base: 'http://localhost:3000',
          api: 'http://localhost:3001'
        },
        browser: {
          headless: false,
          slowMo: 100
        }
      },
      staging: {
        urls: {
          base: process.env.STAGING_URL || 'https://staging.example.com',
          api: process.env.STAGING_API_URL || 'https://staging-api.example.com'
        }
      },
      production: {
        urls: {
          base: process.env.PRODUCTION_URL || 'https://example.com',
          api: process.env.PRODUCTION_API_URL || 'https://api.example.com'
        },
        browser: {
          headless: true,
          slowMo: 0
        },
        test: {
          retries: 3
        }
      }
    };

    // Merge environment-specific config
    const envSpecificConfig = envConfigs[env as keyof typeof envConfigs];
    const config = { ...baseConfig, ...envSpecificConfig };
    
    logger.environment(config);
    return config;
  }

  get(key: string): any {
    return this.getNestedProperty(this.config, key);
  }

  getAll(): any {
    return this.config;
  }

  getBrowserConfig(): any {
    return this.config.browser;
  }

  getTestConfig(): any {
    return this.config.test;
  }

  getUrls(): any {
    return this.config.urls;
  }

  getApiConfig(): any {
    return this.config.api;
  }

  getDatabaseConfig(): any {
    return this.config.database;
  }

  getReportingConfig(): any {
    return this.config.reporting;
  }

  getLoggingConfig(): any {
    return this.config.logging;
  }

  getEmailConfig(): any {
    return this.config.email;
  }

  getNotificationConfig(): any {
    return this.config.notifications;
  }

  getTestDataConfig(): any {
    return this.config.testData;
  }

  getEnvironment(): string {
    return this.config.environment;
  }

  isProduction(): boolean {
    return this.config.environment === 'production';
  }

  isStaging(): boolean {
    return this.config.environment === 'staging';
  }

  isDevelopment(): boolean {
    return this.config.environment === 'development';
  }

  private getNestedProperty(obj: any, key: string): any {
    return key.split('.').reduce((o, i) => o?.[i], obj);
  }

  /**
   * Validate required configuration
   */
  validateConfig(): boolean {
    const required = [
      'urls.base',
      'browser.timeout',
      'test.timeout'
    ];

    const missing = required.filter(key => !this.get(key));
    
    if (missing.length > 0) {
      logger.error('Missing required configuration:', { missing });
      return false;
    }

    logger.info('Configuration validation passed');
    return true;
  }
}

// Export singleton instance
export const config = Config.getInstance();
