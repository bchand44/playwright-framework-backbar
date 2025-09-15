import { test, expect } from '@playwright/test';
import { apiClient, ApiValidator } from '../../utils/api-client';
import { TestDataManager } from '../../utils/test-data-manager';
import { logger } from '../../utils/logger';

test.describe('API Tests', () => {
  let testData: any;
  let authToken: string;

  test.beforeAll(async () => {
    // Load test data
    testData = await TestDataManager.loadJsonData('test-credentials.json');
    
    // Authenticate and get token (if needed)
    // authToken = await getAuthToken();
    // apiClient.setAuthToken(authToken);
    
    logger.info('API test setup completed');
  });

  test.describe('User API', () => {
    test('should get users list @api @smoke', async () => {
      const response = await apiClient.get('/users');
      
      // Validate response
      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBeTruthy();
      
      // Validate using API validator
      ApiValidator.validateStatus(response, 200);
      
      logger.info('Users list retrieved successfully', {
        count: response.data.length,
        status: response.status
      });
    });

    test('should create new user @api @regression', async () => {
      const newUser = TestDataManager.generateUserData(1) as any;
      
      const response = await apiClient.post('/users', {
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        phone: newUser.phone
      });
      
      expect(response.status).toBe(201);
      expect(response.data.id).toBeDefined();
      expect(response.data.email).toBe(newUser.email);
      
      // Store created user ID for cleanup
      test.info().annotations.push({
        type: 'cleanup',
        description: `Created user ID: ${response.data.id}`
      });
    });

    test('should get user by ID @api', async () => {
      // Assuming we have a test user ID
      const userId = '1';
      
      const response = await apiClient.get(`/users/${userId}`);
      
      expect(response.status).toBe(200);
      expect(response.data.id).toBe(userId);
      expect(response.data.email).toBeDefined();
    });

    test('should update user @api', async () => {
      const userId = '1';
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name'
      };
      
      const response = await apiClient.put(`/users/${userId}`, updateData);
      
      expect(response.status).toBe(200);
      expect(response.data.firstName).toBe(updateData.firstName);
      expect(response.data.lastName).toBe(updateData.lastName);
    });

    test('should handle invalid user ID @api @negative', async () => {
      const invalidUserId = '999999';
      
      try {
        await apiClient.get(`/users/${invalidUserId}`);
        // If we reach here, the test should fail
        expect(true).toBeFalsy();
      } catch (error: any) {
        expect(error.status).toBe(404);
      }
    });
  });

  test.describe('Product API', () => {
    test('should get products with pagination @api', async () => {
      const response = await apiClient.get('/products?page=1&limit=10');
      
      expect(response.status).toBe(200);
      expect(response.data.items).toBeDefined();
      expect(response.data.pagination).toBeDefined();
      expect(response.data.pagination.page).toBe(1);
      expect(response.data.pagination.limit).toBe(10);
    });

    test('should search products @api', async () => {
      const searchTerm = testData.testData.searchTerms[0];
      
      const response = await apiClient.get(`/products/search?q=${searchTerm}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBeTruthy();
      
      // Verify search results contain the search term
      if (response.data.length > 0) {
        const firstProduct = response.data[0];
        const productText = `${firstProduct.name} ${firstProduct.description}`.toLowerCase();
        expect(productText).toContain(searchTerm.toLowerCase());
      }
    });

    test('should create product @api @regression', async () => {
      const newProduct = TestDataManager.generateProductData(1) as any;
      
      const response = await apiClient.post('/products', newProduct);
      
      expect(response.status).toBe(201);
      expect(response.data.id).toBeDefined();
      expect(response.data.name).toBe(newProduct.name);
      expect(response.data.price).toBe(newProduct.price);
    });
  });

  test.describe('Performance Tests', () => {
    test('should respond within acceptable time @api @performance', async () => {
      const startTime = Date.now();
      
      const response = await apiClient.get('/products');
      
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      ApiValidator.validateResponseTime(responseTime, 2000); // 2 seconds max
      
      logger.performance('Products API response time', responseTime);
    });

    test('should handle concurrent requests @api @performance', async () => {
      const concurrentRequests = Array(5).fill(null).map(() => 
        () => apiClient.get('/users')
      );
      
      const startTime = Date.now();
      const responses = await apiClient.batchRequests(concurrentRequests);
      const totalTime = Date.now() - startTime;
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      logger.performance('Concurrent requests completed', totalTime, {
        requestCount: concurrentRequests.length,
        averageTime: totalTime / concurrentRequests.length
      });
    });
  });

  test.describe('Error Handling', () => {
    test('should handle server errors gracefully @api @negative', async () => {
      try {
        // Assuming this endpoint triggers a server error
        await apiClient.get('/error/500');
      } catch (error: any) {
        expect(error.status).toBe(500);
        expect(error.message).toContain('API Error');
      }
    });

    test('should handle network timeouts @api @negative', async () => {
      // This would need a slow endpoint or timeout configuration
      const startTime = Date.now();
      
      try {
        await apiClient.get('/slow-endpoint');
      } catch (error: any) {
        const duration = Date.now() - startTime;
        // Should timeout before 30 seconds (default timeout)
        expect(duration).toBeLessThan(35000);
      }
    });
  });

  test.describe('Data Validation', () => {
    test('should validate response schema @api @validation', async () => {
      const response = await apiClient.get('/users/1');
      
      const expectedSchema = {
        id: 'string',
        firstName: 'string',
        lastName: 'string',
        email: 'string',
        createdAt: 'string'
      };
      
      expect(response.status).toBe(200);
      ApiValidator.validateSchema(response.data, expectedSchema);
    });

    test('should reject invalid data @api @validation', async () => {
      const invalidUser = {
        firstName: '', // Empty required field
        lastName: 'Test',
        email: 'invalid-email' // Invalid email format
      };
      
      try {
        await apiClient.post('/users', invalidUser);
        expect(true).toBeFalsy(); // Should not reach here
      } catch (error: any) {
        expect(error.status).toBe(400);
      }
    });
  });
});
