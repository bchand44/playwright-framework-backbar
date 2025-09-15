import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { faker } from '@faker-js/faker';
import { logger } from './logger';

/**
 * Test Data Management utility
 */
export class TestDataManager {
  private static data: Map<string, any> = new Map();
  private static readonly DATA_DIR = path.join(process.cwd(), 'data');

  /**
   * Initialize data directory
   */
  static initializeDataDirectory(): void {
    if (!fs.existsSync(this.DATA_DIR)) {
      fs.mkdirSync(this.DATA_DIR, { recursive: true });
      logger.info('Data directory created');
    }
  }

  /**
   * Load JSON test data
   */
  static async loadJsonData(fileName: string): Promise<any> {
    try {
      const filePath = path.join(this.DATA_DIR, fileName);
      const rawData = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(rawData);
      this.data.set(fileName, data);
      logger.testData('JSON loaded', { fileName, recordCount: Array.isArray(data) ? data.length : 1 });
      return data;
    } catch (error) {
      logger.error(`Failed to load JSON data: ${fileName}`, error as Error);
      throw error;
    }
  }

  /**
   * Load CSV test data
   */
  static async loadCsvData(fileName: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const filePath = path.join(this.DATA_DIR, fileName);
      const results: any[] = [];

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          this.data.set(fileName, results);
          logger.testData('CSV loaded', { fileName, recordCount: results.length });
          resolve(results);
        })
        .on('error', (error) => {
          logger.error(`Failed to load CSV data: ${fileName}`, error);
          reject(error);
        });
    });
  }

  /**
   * Get data by key
   */
  static getData(key: string): any {
    return this.data.get(key);
  }

  /**
   * Set data by key
   */
  static setData(key: string, value: any): void {
    this.data.set(key, value);
    logger.testData('Data set', { key, type: typeof value });
  }

  /**
   * Generate fake user data
   */
  static generateUserData(count: number = 1): any {
    const users = [];
    for (let i = 0; i < count; i++) {
      users.push({
        id: faker.string.uuid(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        address: {
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          zipCode: faker.location.zipCode(),
          country: faker.location.country()
        },
        dateOfBirth: faker.date.past({ years: 50 }),
        company: faker.company.name(),
        jobTitle: faker.person.jobTitle(),
        username: faker.internet.userName(),
        password: faker.internet.password({ length: 12 }),
        avatar: faker.image.avatar(),
        website: faker.internet.url(),
        bio: faker.person.bio()
      });
    }
    
    logger.testData('Fake users generated', { count });
    return count === 1 ? users[0] : users;
  }

  /**
   * Generate fake product data
   */
  static generateProductData(count: number = 1): any {
    const products = [];
    for (let i = 0; i < count; i++) {
      products.push({
        id: faker.string.uuid(),
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        price: parseFloat(faker.commerce.price()),
        category: faker.commerce.department(),
        brand: faker.company.name(),
        sku: faker.string.alphanumeric(8).toUpperCase(),
        inStock: faker.datatype.boolean(),
        stockQuantity: faker.number.int({ min: 0, max: 1000 }),
        rating: faker.number.float({ min: 1, max: 5, multipleOf: 0.1 }),
        images: [
          faker.image.url(),
          faker.image.url(),
          faker.image.url()
        ],
        tags: faker.helpers.arrayElements([
          'electronics', 'clothing', 'home', 'sports', 'books', 'toys', 'beauty', 'automotive'
        ], { min: 1, max: 3 }),
        dimensions: {
          length: faker.number.float({ min: 1, max: 100, multipleOf: 0.1 }),
          width: faker.number.float({ min: 1, max: 100, multipleOf: 0.1 }),
          height: faker.number.float({ min: 1, max: 100, multipleOf: 0.1 }),
          weight: faker.number.float({ min: 0.1, max: 50, multipleOf: 0.1 })
        }
      });
    }
    
    logger.testData('Fake products generated', { count });
    return count === 1 ? products[0] : products;
  }

  /**
   * Generate fake order data
   */
  static generateOrderData(count: number = 1): any {
    const orders = [];
    for (let i = 0; i < count; i++) {
      const itemCount = faker.number.int({ min: 1, max: 5 });
      const items = [];
      let total = 0;

      for (let j = 0; j < itemCount; j++) {
        const price = parseFloat(faker.commerce.price());
        const quantity = faker.number.int({ min: 1, max: 3 });
        const itemTotal = price * quantity;
        total += itemTotal;

        items.push({
          productId: faker.string.uuid(),
          productName: faker.commerce.productName(),
          price,
          quantity,
          total: itemTotal
        });
      }

      orders.push({
        id: faker.string.uuid(),
        orderNumber: faker.string.numeric(8),
        customerId: faker.string.uuid(),
        status: faker.helpers.arrayElement(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
        orderDate: faker.date.recent(),
        items,
        subtotal: total,
        tax: total * 0.08,
        shipping: faker.number.float({ min: 0, max: 25, multipleOf: 0.01 }),
        total: total * 1.08 + faker.number.float({ min: 0, max: 25, multipleOf: 0.01 }),
        shippingAddress: {
          name: faker.person.fullName(),
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          zipCode: faker.location.zipCode(),
          country: faker.location.country()
        },
        paymentMethod: faker.helpers.arrayElement(['credit_card', 'debit_card', 'paypal', 'apple_pay', 'google_pay'])
      });
    }
    
    logger.testData('Fake orders generated', { count });
    return count === 1 ? orders[0] : orders;
  }

  /**
   * Save generated data to file
   */
  static async saveDataToFile(data: any, fileName: string, format: 'json' | 'csv' = 'json'): Promise<void> {
    try {
      this.initializeDataDirectory();
      const filePath = path.join(this.DATA_DIR, fileName);

      if (format === 'json') {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      } else if (format === 'csv') {
        // Basic CSV implementation for simple objects
        if (Array.isArray(data) && data.length > 0) {
          const headers = Object.keys(data[0]);
          const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
          ].join('\n');
          fs.writeFileSync(filePath, csvContent);
        }
      }

      logger.testData('Data saved to file', { fileName, format, recordCount: Array.isArray(data) ? data.length : 1 });
    } catch (error) {
      logger.error(`Failed to save data to file: ${fileName}`, error as Error);
      throw error;
    }
  }

  /**
   * Get random element from array
   */
  static getRandomElement<T>(array: T[]): T {
    return faker.helpers.arrayElement(array);
  }

  /**
   * Get multiple random elements from array
   */
  static getRandomElements<T>(array: T[], count: number): T[] {
    return faker.helpers.arrayElements(array, count);
  }

  /**
   * Clear all cached data
   */
  static clearCache(): void {
    this.data.clear();
    logger.info('Test data cache cleared');
  }
}
