import { FullConfig } from '@playwright/test';
import { logger } from './logger';
import { BrowserManager } from './browser-utils';
import { TestDataManager } from './test-data-manager';
import fs from 'fs';
import path from 'path';

/**
 * Global teardown - runs once after all tests
 */
async function globalTeardown(config: FullConfig): Promise<void> {
  try {
    logger.info('🧹 Starting Global Teardown...');

    // Close all browser resources
    await closeBrowserResources();

    // Cleanup test data
    await cleanupTestData();

    // Generate final reports
    await generateFinalReports();

    // Cleanup temporary files
    await cleanupTempFiles();

    // Archive test results
    await archiveTestResults();

    // Send notifications
    await sendNotifications();

    logger.info('✅ Global Teardown Completed Successfully');
  } catch (error) {
    logger.error('❌ Global Teardown Failed:', error as Error);
    // Don't throw error to avoid masking test results
  }
}

/**
 * Close all browser resources
 */
async function closeBrowserResources(): Promise<void> {
  logger.stepStart('Closing browser resources');
  
  try {
    await BrowserManager.closeAll();
    logger.stepEnd('Closing browser resources', true);
  } catch (error) {
    logger.stepEnd('Closing browser resources', false);
    logger.error('Failed to close browser resources:', error as Error);
  }
}

/**
 * Cleanup test data
 */
async function cleanupTestData(): Promise<void> {
  logger.stepStart('Cleaning up test data');
  
  try {
    // Clear test data cache
    TestDataManager.clearCache();

    // Remove temporary test data files if needed
    if (process.env.CLEANUP_TEMP_DATA === 'true') {
      await removeTempDataFiles();
    }

    logger.stepEnd('Cleaning up test data', true);
  } catch (error) {
    logger.stepEnd('Cleaning up test data', false);
    logger.error('Failed to cleanup test data:', error as Error);
  }
}

/**
 * Remove temporary data files
 */
async function removeTempDataFiles(): Promise<void> {
  const tempFiles = [
    'sample-users.json',
    'sample-products.json',
    'sample-orders.json'
  ];

  for (const file of tempFiles) {
    try {
      const filePath = path.join(process.cwd(), 'data', file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.debug(`Removed temp file: ${file}`);
      }
    } catch (error) {
      logger.warn(`Failed to remove temp file: ${file}`, error as object);
    }
  }
}

/**
 * Generate final reports
 */
async function generateFinalReports(): Promise<void> {
  logger.stepStart('Generating final reports');
  
  try {
    // Create test summary
    await createTestSummary();

    // Create performance report
    await createPerformanceReport();

    logger.stepEnd('Generating final reports', true);
  } catch (error) {
    logger.stepEnd('Generating final reports', false);
    logger.error('Failed to generate final reports:', error as Error);
  }
}

/**
 * Create test summary
 */
async function createTestSummary(): Promise<void> {
  const summaryPath = path.join(process.cwd(), 'test-results', 'test-summary.json');
  
  try {
    // Read Playwright results if available
    const resultsPath = path.join(process.cwd(), 'test-results', 'results.json');
    let testResults = null;
    
    if (fs.existsSync(resultsPath)) {
      const resultsContent = fs.readFileSync(resultsPath, 'utf-8');
      testResults = JSON.parse(resultsContent);
    }

    const summary = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      testResults: testResults ? {
        totalTests: testResults.stats?.total || 0,
        passed: testResults.stats?.passed || 0,
        failed: testResults.stats?.failed || 0,
        skipped: testResults.stats?.skipped || 0,
        duration: testResults.stats?.duration || 0
      } : null,
      testRun: {
        startTime: process.env.TEST_START_TIME,
        endTime: new Date().toISOString(),
        duration: process.env.TEST_START_TIME ? 
          Date.now() - new Date(process.env.TEST_START_TIME).getTime() : 0
      },
      configuration: {
        workers: process.env.WORKERS || '4',
        retries: process.env.RETRIES || '2',
        timeout: process.env.TEST_TIMEOUT || '60000',
        baseUrl: process.env.BASE_URL
      }
    };

    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    logger.info('Test summary created', { path: summaryPath });
  } catch (error) {
    logger.error('Failed to create test summary:', error as Error);
  }
}

/**
 * Create performance report
 */
async function createPerformanceReport(): Promise<void> {
  const performancePath = path.join(process.cwd(), 'test-results', 'performance-report.json');
  
  try {
    // This would be populated during test execution
    const performanceData = {
      timestamp: new Date().toISOString(),
      averagePageLoadTime: 0,
      slowestPages: [],
      apiResponseTimes: [],
      memoryUsage: process.memoryUsage ? process.memoryUsage() : null
    };

    fs.writeFileSync(performancePath, JSON.stringify(performanceData, null, 2));
    logger.info('Performance report created', { path: performancePath });
  } catch (error) {
    logger.error('Failed to create performance report:', error as Error);
  }
}

/**
 * Cleanup temporary files
 */
async function cleanupTempFiles(): Promise<void> {
  logger.stepStart('Cleaning up temporary files');
  
  try {
    const tempDirs = ['downloads', 'uploads'];
    
    for (const dir of tempDirs) {
      const dirPath = path.join(process.cwd(), dir);
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
          const filePath = path.join(dirPath, file);
          try {
            fs.unlinkSync(filePath);
          } catch (error) {
            logger.warn(`Failed to remove temp file: ${filePath}`, error as object);
          }
        }
      }
    }

    logger.stepEnd('Cleaning up temporary files', true);
  } catch (error) {
    logger.stepEnd('Cleaning up temporary files', false);
    logger.error('Failed to cleanup temporary files:', error as Error);
  }
}

/**
 * Archive test results
 */
async function archiveTestResults(): Promise<void> {
  if (process.env.ARCHIVE_RESULTS !== 'true') {
    return;
  }

  logger.stepStart('Archiving test results');
  
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archiveDir = path.join(process.cwd(), 'archives', `test-run-${timestamp}`);
    
    // Create archive directory
    fs.mkdirSync(archiveDir, { recursive: true });

    // Copy important files
    const filesToArchive = [
      'test-results/results.json',
      'test-results/test-summary.json',
      'test-results/performance-report.json',
      'logs/test-results.log'
    ];

    for (const file of filesToArchive) {
      const sourcePath = path.join(process.cwd(), file);
      if (fs.existsSync(sourcePath)) {
        const destPath = path.join(archiveDir, path.basename(file));
        fs.copyFileSync(sourcePath, destPath);
      }
    }

    logger.stepEnd('Archiving test results', true);
    logger.info(`Test results archived to: ${archiveDir}`);
  } catch (error) {
    logger.stepEnd('Archiving test results', false);
    logger.error('Failed to archive test results:', error as Error);
  }
}

/**
 * Send notifications
 */
async function sendNotifications(): Promise<void> {
  if (!process.env.SEND_NOTIFICATIONS || process.env.SEND_NOTIFICATIONS !== 'true') {
    return;
  }

  logger.stepStart('Sending notifications');
  
  try {
    // Read test summary for notification content
    const summaryPath = path.join(process.cwd(), 'test-results', 'test-summary.json');
    let summary = null;
    
    if (fs.existsSync(summaryPath)) {
      const summaryContent = fs.readFileSync(summaryPath, 'utf-8');
      summary = JSON.parse(summaryContent);
    }

    // Send Slack notification if configured
    if (process.env.SLACK_WEBHOOK_URL && summary) {
      await sendSlackNotification(summary);
    }

    // Send email notification if configured
    if (process.env.SMTP_HOST && summary) {
      await sendEmailNotification(summary);
    }

    logger.stepEnd('Sending notifications', true);
  } catch (error) {
    logger.stepEnd('Sending notifications', false);
    logger.error('Failed to send notifications:', error as Error);
  }
}

/**
 * Send Slack notification
 */
async function sendSlackNotification(summary: any): Promise<void> {
  try {
    const { default: axios } = await import('axios');
    
    const message = {
      text: `Test Run Completed - ${summary.environment}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Test Run Summary*\n` +
                  `Environment: ${summary.environment}\n` +
                  `Total Tests: ${summary.testResults?.totalTests || 'N/A'}\n` +
                  `Passed: ${summary.testResults?.passed || 'N/A'}\n` +
                  `Failed: ${summary.testResults?.failed || 'N/A'}\n` +
                  `Duration: ${summary.testRun?.duration ? `${Math.round(summary.testRun.duration / 1000)}s` : 'N/A'}`
          }
        }
      ]
    };

    await axios.post(process.env.SLACK_WEBHOOK_URL!, message);
    logger.info('Slack notification sent');
  } catch (error) {
    logger.error('Failed to send Slack notification:', error as Error);
  }
}

/**
 * Send email notification
 */
async function sendEmailNotification(summary: any): Promise<void> {
  try {
    // Email implementation would go here using nodemailer or similar
    logger.info('Email notification would be sent here');
  } catch (error) {
    logger.error('Failed to send email notification:', error as Error);
  }
}

export default globalTeardown;
