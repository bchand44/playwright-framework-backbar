import fs from 'fs';
import path from 'path';
import { logger } from './logger';

/**
 * Test Report Generator utility
 */
export class ReportGenerator {
  private static readonly REPORTS_DIR = path.join(process.cwd(), 'test-results');

  /**
   * Generate comprehensive test summary
   */
  static async generateTestSummary(): Promise<void> {
    try {
      logger.info('Generating test summary...');

      const summary = {
        metadata: await this.getTestMetadata(),
        results: await this.getTestResults(),
        performance: await this.getPerformanceMetrics(),
        environment: await this.getEnvironmentInfo(),
        coverage: await this.getCoverageInfo(),
        artifacts: await this.getArtifactInfo()
      };

      const summaryPath = path.join(this.REPORTS_DIR, 'comprehensive-summary.json');
      fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

      // Generate HTML summary
      await this.generateHtmlSummary(summary);

      logger.info('Test summary generated successfully', { path: summaryPath });
    } catch (error) {
      logger.error('Failed to generate test summary', error as Error);
    }
  }

  /**
   * Get test metadata
   */
  private static async getTestMetadata(): Promise<object> {
    return {
      timestamp: new Date().toISOString(),
      framework: 'Playwright',
      version: '1.40.0',
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      ci: !!process.env.CI,
      branch: process.env.GITHUB_REF?.replace('refs/heads/', '') || 'unknown',
      commit: process.env.GITHUB_SHA || 'unknown',
      runId: process.env.GITHUB_RUN_ID || Date.now().toString()
    };
  }

  /**
   * Get test execution results
   */
  private static async getTestResults(): Promise<object> {
    try {
      const resultsPath = path.join(this.REPORTS_DIR, 'results.json');
      
      if (fs.existsSync(resultsPath)) {
        const resultsContent = fs.readFileSync(resultsPath, 'utf-8');
        const results = JSON.parse(resultsContent);
        
        return {
          summary: results.stats || {},
          suites: results.suites?.length || 0,
          tests: results.tests?.length || 0,
          duration: results.stats?.duration || 0,
          passed: results.stats?.passed || 0,
          failed: results.stats?.failed || 0,
          skipped: results.stats?.skipped || 0,
          flaky: results.stats?.flaky || 0
        };
      }
      
      return { error: 'Results file not found' };
    } catch (error) {
      return { error: 'Failed to parse results' };
    }
  }

  /**
   * Get performance metrics
   */
  private static async getPerformanceMetrics(): Promise<object> {
    try {
      const performancePath = path.join(this.REPORTS_DIR, 'performance-report.json');
      
      if (fs.existsSync(performancePath)) {
        const performanceContent = fs.readFileSync(performancePath, 'utf-8');
        return JSON.parse(performanceContent);
      }
      
      return {
        averageTestDuration: 0,
        slowestTests: [],
        memoryUsage: process.memoryUsage(),
        note: 'Detailed performance data not available'
      };
    } catch (error) {
      return { error: 'Failed to load performance metrics' };
    }
  }

  /**
   * Get environment information
   */
  private static async getEnvironmentInfo(): Promise<object> {
    return {
      baseUrl: process.env.BASE_URL || 'Not set',
      apiBaseUrl: process.env.API_BASE_URL || 'Not set',
      environment: process.env.NODE_ENV || 'development',
      workers: process.env.WORKERS || 'default',
      retries: process.env.RETRIES || 'default',
      timeout: process.env.TEST_TIMEOUT || 'default',
      headless: process.env.HEADLESS || 'true',
      browser: process.env.BROWSER || 'all'
    };
  }

  /**
   * Get coverage information (if available)
   */
  private static async getCoverageInfo(): Promise<object> {
    try {
      const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
      
      if (fs.existsSync(coveragePath)) {
        const coverageContent = fs.readFileSync(coveragePath, 'utf-8');
        return JSON.parse(coverageContent);
      }
      
      return { message: 'Coverage data not available' };
    } catch (error) {
      return { error: 'Failed to load coverage information' };
    }
  }

  /**
   * Get artifact information
   */
  private static async getArtifactInfo(): Promise<object> {
    const artifacts: {
      screenshots: number;
      videos: number;
      traces: number;
      logs: number;
      reports: string[];
    } = {
      screenshots: 0,
      videos: 0,
      traces: 0,
      logs: 0,
      reports: []
    };

    try {
      // Count screenshots
      const screenshotsDir = path.join(this.REPORTS_DIR, 'screenshots');
      if (fs.existsSync(screenshotsDir)) {
        artifacts.screenshots = fs.readdirSync(screenshotsDir).length;
      }

      // Count videos
      const videosDir = path.join(this.REPORTS_DIR, 'videos');
      if (fs.existsSync(videosDir)) {
        artifacts.videos = fs.readdirSync(videosDir).length;
      }

      // Count traces
      const tracesDir = path.join(this.REPORTS_DIR, 'traces');
      if (fs.existsSync(tracesDir)) {
        artifacts.traces = fs.readdirSync(tracesDir).length;
      }

      // Count logs
      const logsDir = path.join(process.cwd(), 'logs');
      if (fs.existsSync(logsDir)) {
        artifacts.logs = fs.readdirSync(logsDir).length;
      }

      // List available reports
      const reportDirs = ['playwright-report', 'allure-results'];
      artifacts.reports = reportDirs.filter(dir => 
        fs.existsSync(path.join(process.cwd(), dir))
      );

    } catch (error) {
      logger.warn('Failed to collect artifact information', error as object);
    }

    return artifacts;
  }

  /**
   * Generate HTML summary report
   */
  private static async generateHtmlSummary(summary: any): Promise<void> {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Execution Summary</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header .subtitle { opacity: 0.9; margin-top: 10px; }
        .content { padding: 30px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { background: #f8f9fa; border-radius: 6px; padding: 20px; border-left: 4px solid #667eea; }
        .card h3 { margin-top: 0; color: #333; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; margin: 20px 0; }
        .stat { text-align: center; padding: 15px; background: white; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stat-value { font-size: 2em; font-weight: bold; }
        .stat-label { color: #666; font-size: 0.9em; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .skipped { color: #ffc107; }
        .flaky { color: #fd7e14; }
        .metadata { background: #e9ecef; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .metadata table { width: 100%; border-collapse: collapse; }
        .metadata td { padding: 8px; border-bottom: 1px solid #dee2e6; }
        .metadata td:first-child { font-weight: bold; width: 30%; }
        .footer { text-align: center; padding: 20px; color: #666; border-top: 1px solid #dee2e6; }
        .artifact-list { list-style: none; padding: 0; }
        .artifact-list li { padding: 8px; background: white; margin: 5px 0; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎭 Test Execution Summary</h1>
            <div class="subtitle">Playwright Test Automation Framework</div>
            <div class="subtitle">Generated: ${summary.metadata.timestamp}</div>
        </div>
        
        <div class="content">
            <div class="stats">
                <div class="stat">
                    <div class="stat-value">${summary.results.tests || 0}</div>
                    <div class="stat-label">Total Tests</div>
                </div>
                <div class="stat">
                    <div class="stat-value passed">${summary.results.passed || 0}</div>
                    <div class="stat-label">Passed</div>
                </div>
                <div class="stat">
                    <div class="stat-value failed">${summary.results.failed || 0}</div>
                    <div class="stat-label">Failed</div>
                </div>
                <div class="stat">
                    <div class="stat-value skipped">${summary.results.skipped || 0}</div>
                    <div class="stat-label">Skipped</div>
                </div>
                <div class="stat">
                    <div class="stat-value flaky">${summary.results.flaky || 0}</div>
                    <div class="stat-label">Flaky</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${Math.round((summary.results.duration || 0) / 1000)}s</div>
                    <div class="stat-label">Duration</div>
                </div>
            </div>

            <div class="grid">
                <div class="card">
                    <h3>📊 Test Results</h3>
                    <div class="metadata">
                        <table>
                            <tr><td>Total Suites</td><td>${summary.results.suites || 0}</td></tr>
                            <tr><td>Total Tests</td><td>${summary.results.tests || 0}</td></tr>
                            <tr><td>Pass Rate</td><td>${summary.results.tests ? Math.round((summary.results.passed / summary.results.tests) * 100) : 0}%</td></tr>
                            <tr><td>Execution Time</td><td>${Math.round((summary.results.duration || 0) / 1000)} seconds</td></tr>
                        </table>
                    </div>
                </div>

                <div class="card">
                    <h3>🔧 Environment</h3>
                    <div class="metadata">
                        <table>
                            <tr><td>Environment</td><td>${summary.environment.environment}</td></tr>
                            <tr><td>Base URL</td><td>${summary.environment.baseUrl}</td></tr>
                            <tr><td>Platform</td><td>${summary.metadata.platform}</td></tr>
                            <tr><td>Node Version</td><td>${summary.metadata.nodeVersion}</td></tr>
                            <tr><td>CI</td><td>${summary.metadata.ci ? 'Yes' : 'No'}</td></tr>
                        </table>
                    </div>
                </div>

                <div class="card">
                    <h3>📁 Artifacts</h3>
                    <div class="metadata">
                        <table>
                            <tr><td>Screenshots</td><td>${summary.artifacts.screenshots}</td></tr>
                            <tr><td>Videos</td><td>${summary.artifacts.videos}</td></tr>
                            <tr><td>Traces</td><td>${summary.artifacts.traces}</td></tr>
                            <tr><td>Log Files</td><td>${summary.artifacts.logs}</td></tr>
                        </table>
                    </div>
                    <h4>Available Reports:</h4>
                    <ul class="artifact-list">
                        ${summary.artifacts.reports.map((report: string) => `<li>📊 ${report}</li>`).join('')}
                    </ul>
                </div>

                <div class="card">
                    <h3>⚡ Performance</h3>
                    <div class="metadata">
                        <table>
                            <tr><td>Memory Used</td><td>${Math.round((summary.performance.memoryUsage?.heapUsed || 0) / 1024 / 1024)} MB</td></tr>
                            <tr><td>Memory Total</td><td>${Math.round((summary.performance.memoryUsage?.heapTotal || 0) / 1024 / 1024)} MB</td></tr>
                            <tr><td>Avg Test Duration</td><td>${summary.performance.averageTestDuration || 'N/A'}</td></tr>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>Generated by Backbarr Playwright Framework • ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>`;

    const htmlPath = path.join(this.REPORTS_DIR, 'test-summary.html');
    fs.writeFileSync(htmlPath, htmlContent);
    logger.info('HTML summary generated', { path: htmlPath });
  }

  /**
   * Send summary via webhook (Slack, Teams, etc.)
   */
  static async sendWebhookSummary(webhookUrl: string, summary: any): Promise<void> {
    try {
      const message = this.formatWebhookMessage(summary);
      
      // This would use fetch or axios to send the webhook
      logger.info('Webhook summary prepared', { url: webhookUrl });
      // await fetch(webhookUrl, { method: 'POST', body: JSON.stringify(message) });
    } catch (error) {
      logger.error('Failed to send webhook summary', error as Error);
    }
  }

  /**
   * Format message for webhook
   */
  private static formatWebhookMessage(summary: any): object {
    const passRate = summary.results.tests ? 
      Math.round((summary.results.passed / summary.results.tests) * 100) : 0;
    
    const emoji = passRate >= 95 ? '✅' : passRate >= 80 ? '⚠️' : '❌';
    
    return {
      text: `${emoji} Test Execution Complete`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Test Results Summary*\n` +
                  `Total Tests: ${summary.results.tests || 0}\n` +
                  `Passed: ${summary.results.passed || 0}\n` +
                  `Failed: ${summary.results.failed || 0}\n` +
                  `Pass Rate: ${passRate}%\n` +
                  `Duration: ${Math.round((summary.results.duration || 0) / 1000)}s\n` +
                  `Environment: ${summary.environment.environment}`
          }
        }
      ]
    };
  }
}
