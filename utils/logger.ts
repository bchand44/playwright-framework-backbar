import winston from 'winston';
import path from 'path';
import fs from 'fs';

/**
 * Enhanced Logger utility with multiple transports and formatting
 */
class Logger {
  private logger: winston.Logger;
  private logDir: string;

  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.ensureLogDirectory();
    this.logger = this.createLogger();
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private createLogger(): winston.Logger {
    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.prettyPrint()
    );

    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let log = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
          log += ` ${JSON.stringify(meta, null, 2)}`;
        }
        return log;
      })
    );

    const transports: winston.transport[] = [
      // Console transport
      new winston.transports.Console({
        level: process.env.LOG_LEVEL || 'info',
        format: consoleFormat,
        silent: process.env.LOG_TO_CONSOLE === 'false'
      }),

      // File transport for all logs
      new winston.transports.File({
        filename: path.join(this.logDir, 'application.log'),
        level: 'info',
        format: logFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5
      }),

      // Error file transport
      new winston.transports.File({
        filename: path.join(this.logDir, 'error.log'),
        level: 'error',
        format: logFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5
      }),

      // Test results file transport
      new winston.transports.File({
        filename: path.join(this.logDir, 'test-results.log'),
        level: 'debug',
        format: logFormat,
        maxsize: 10485760, // 10MB
        maxFiles: 3
      })
    ];

    return winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: logFormat,
      transports,
      exitOnError: false
    });
  }

  // Test-specific logging methods
  testStart(testName: string, testFile: string): void {
    this.logger.info('🧪 Test Started', {
      testName,
      testFile,
      timestamp: new Date().toISOString(),
      event: 'TEST_START'
    });
  }

  testEnd(testName: string, status: 'passed' | 'failed' | 'skipped', duration: number): void {
    const emoji = status === 'passed' ? '✅' : status === 'failed' ? '❌' : '⏭️';
    this.logger.info(`${emoji} Test Completed`, {
      testName,
      status,
      duration: `${duration}ms`,
      event: 'TEST_END'
    });
  }

  stepStart(stepName: string): void {
    this.logger.debug('📝 Step Started', {
      stepName,
      event: 'STEP_START'
    });
  }

  stepEnd(stepName: string, success: boolean): void {
    const emoji = success ? '✓' : '✗';
    this.logger.debug(`${emoji} Step Completed`, {
      stepName,
      success,
      event: 'STEP_END'
    });
  }

  pageNavigation(url: string, title?: string): void {
    this.logger.info('🌐 Page Navigation', {
      url,
      title,
      event: 'PAGE_NAVIGATION'
    });
  }

  elementInteraction(action: string, selector: string, value?: string): void {
    this.logger.debug('🖱️ Element Interaction', {
      action,
      selector,
      value,
      event: 'ELEMENT_INTERACTION'
    });
  }

  apiRequest(method: string, url: string, status?: number): void {
    this.logger.info('🔄 API Request', {
      method,
      url,
      status,
      event: 'API_REQUEST'
    });
  }

  screenshot(path: string, reason: string): void {
    this.logger.info('📷 Screenshot Captured', {
      path,
      reason,
      event: 'SCREENSHOT'
    });
  }

  assertion(description: string, success: boolean, expected?: any, actual?: any): void {
    const emoji = success ? '✅' : '❌';
    this.logger.debug(`${emoji} Assertion`, {
      description,
      success,
      expected,
      actual,
      event: 'ASSERTION'
    });
  }

  // Standard logging methods
  info(message: string, meta?: object): void {
    this.logger.info(message, meta);
  }

  error(message: string, error?: Error | object): void {
    this.logger.error(message, error);
  }

  warn(message: string, meta?: object): void {
    this.logger.warn(message, meta);
  }

  debug(message: string, meta?: object): void {
    this.logger.debug(message, meta);
  }

  // Performance logging
  performance(action: string, duration: number, details?: object): void {
    this.logger.info('⚡ Performance Metric', {
      action,
      duration: `${duration}ms`,
      ...details,
      event: 'PERFORMANCE'
    });
  }

  // Data logging
  testData(dataType: string, data: object): void {
    this.logger.debug('📊 Test Data', {
      dataType,
      data,
      event: 'TEST_DATA'
    });
  }

  // Environment logging
  environment(env: object): void {
    this.logger.info('🔧 Environment Info', {
      ...env,
      event: 'ENVIRONMENT'
    });
  }
}

// Export singleton instance
export const logger = new Logger();
export default logger;
