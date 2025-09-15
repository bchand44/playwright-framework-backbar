import { FullConfig } from '@playwright/test';
import { logger } from './logger';
import { config } from './config';
import { TestDataManager } from './test-data-manager';
import fs from 'fs';
import path from 'path';

/**
 * Global setup - runs once before all tests
 */
async function globalSetup(config: FullConfig): Promise<void> {
  try {
    logger.info('🚀 Starting Global Setup...');

    // Validate configuration
    validateConfiguration();

    // Setup test directories
    await setupTestDirectories();

    // Initialize test data
    await initializeTestData();

    // Setup environment
    await setupEnvironment();

    // Health checks
    await performHealthChecks();

    logger.info('✅ Global Setup Completed Successfully');
  } catch (error) {
    logger.error('❌ Global Setup Failed:', error as Error);
    throw error;
  }
}

/**
 * Validate required configuration
 */
function validateConfiguration(): void {
  logger.stepStart('Validating configuration');
  
  const configInstance = require('./config').config;
  const isValid = configInstance.validateConfig();
  
  if (!isValid) {
    throw new Error('Configuration validation failed');
  }
  
  logger.stepEnd('Validating configuration', true);
}

/**
 * Setup test directories
 */
async function setupTestDirectories(): Promise<void> {
  logger.stepStart('Setting up test directories');
  
  const directories = [
    'test-results',
    'test-results/screenshots',
    'test-results/videos',
    'test-results/traces',
    'logs',
    'data',
    'downloads',
    'uploads'
  ];

  for (const dir of directories) {
    const dirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      logger.debug(`Created directory: ${dir}`);
    }
  }
  
  logger.stepEnd('Setting up test directories', true);
}

/**
 * Initialize test data
 */
async function initializeTestData(): Promise<void> {
  logger.stepStart('Initializing test data');
  
  try {
    // Initialize data manager
    TestDataManager.initializeDataDirectory();

    // Generate sample test data if needed
    if (process.env.GENERATE_SAMPLE_DATA === 'true') {
      await generateSampleData();
    }

    // Load existing test data
    await loadTestData();
    
    logger.stepEnd('Initializing test data', true);
  } catch (error) {
    logger.stepEnd('Initializing test data', false);
    throw error;
  }
}

/**
 * Generate sample test data
 */
async function generateSampleData(): Promise<void> {
  logger.info('Generating sample test data...');
  
  // Generate users
  const users = TestDataManager.generateUserData(10);
  await TestDataManager.saveDataToFile(users, 'sample-users.json');

  // Generate products
  const products = TestDataManager.generateProductData(50);
  await TestDataManager.saveDataToFile(products, 'sample-products.json');

  // Generate orders
  const orders = TestDataManager.generateOrderData(25);
  await TestDataManager.saveDataToFile(orders, 'sample-orders.json');

  logger.info('Sample test data generated');
}

/**
 * Load test data
 */
async function loadTestData(): Promise<void> {
  const dataFiles = [
    'users.json',
    'products.json',
    'test-credentials.json'
  ];

  for (const file of dataFiles) {
    try {
      const filePath = path.join(process.cwd(), 'data', file);
      if (fs.existsSync(filePath)) {
        await TestDataManager.loadJsonData(file);
        logger.debug(`Loaded test data: ${file}`);
      }
    } catch (error) {
      logger.warn(`Failed to load test data file: ${file}`, error as object);
    }
  }
}

/**
 * Setup environment
 */
async function setupEnvironment(): Promise<void> {
  logger.stepStart('Setting up environment');
  
  try {
    // Set environment variables
    process.env.PLAYWRIGHT_TEST_BASE_URL = config.get('urls.base');
    process.env.PLAYWRIGHT_TEST_API_URL = config.get('urls.api');

    // Log environment info
    const envInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      environment: config.getEnvironment(),
      baseUrl: config.get('urls.base'),
      apiUrl: config.get('urls.api'),
      workers: config.get('test.workers'),
      retries: config.get('test.retries'),
      timeout: config.get('test.timeout')
    };

    logger.environment(envInfo);
    logger.stepEnd('Setting up environment', true);
  } catch (error) {
    logger.stepEnd('Setting up environment', false);
    throw error;
  }
}

/**
 * Perform health checks
 */
async function performHealthChecks(): Promise<void> {
  logger.stepStart('Performing health checks');
  
  try {
    const baseUrl = config.get('urls.base');
    const apiUrl = config.get('urls.api');

    // Skip health checks in development or if URLs are not real
    if (config.isDevelopment() || !baseUrl.startsWith('http')) {
      logger.info('Skipping health checks for development environment');
      logger.stepEnd('Performing health checks', true);
      return;
    }

    // Basic connectivity check
    logger.info(`Checking connectivity to: ${baseUrl}`);
    
    // You can implement actual health checks here using the API client
    // const apiClient = new ApiClient(apiUrl);
    // const isHealthy = await apiClient.healthCheck();
    
    logger.stepEnd('Performing health checks', true);
  } catch (error) {
    logger.warn('Health checks failed, but continuing with tests', error as object);
    logger.stepEnd('Performing health checks', false);
    // Don't throw error for health checks to avoid blocking tests
  }
}

/**
 * Create default test credentials file if it doesn't exist
 */
function createDefaultCredentials(): void {
  const credentialsPath = path.join(process.cwd(), 'data', 'test-credentials.json');
  
  if (!fs.existsSync(credentialsPath)) {
    const defaultCredentials = {
      validUser: {
        username: 'testuser@example.com',
        password: 'TestPassword123!'
      },
      adminUser: {
        username: 'admin@example.com',
        password: 'AdminPassword123!'
      },
      invalidUser: {
        username: 'invalid@example.com',
        password: 'wrongpassword'
      }
    };

    fs.writeFileSync(credentialsPath, JSON.stringify(defaultCredentials, null, 2));
    logger.info('Created default test credentials file');
  }
}

export default globalSetup;
