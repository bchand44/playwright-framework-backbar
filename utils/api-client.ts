import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { logger } from './logger';
import { config } from './config';

/**
 * API Client utility for handling HTTP requests
 */
export class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || config.get('urls.api');
    this.client = this.createAxiosInstance();
  }

  private createAxiosInstance(): AxiosInstance {
    const instance = axios.create({
      baseURL: this.baseURL,
      timeout: config.get('api.timeout') || 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Playwright-Test-Framework/1.0'
      }
    });

    // Request interceptor
    instance.interceptors.request.use(
      (config) => {
        logger.apiRequest(config.method?.toUpperCase() || 'GET', config.url || '');
        return config;
      },
      (error) => {
        logger.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    instance.interceptors.response.use(
      (response) => {
        logger.apiRequest(
          response.config.method?.toUpperCase() || 'GET',
          response.config.url || '',
          response.status
        );
        return response;
      },
      (error) => {
        const status = error.response?.status;
        const url = error.config?.url;
        const method = error.config?.method?.toUpperCase();
        
        logger.error(`API Error [${method} ${url}]:`, {
          status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });
        
        return Promise.reject(error);
      }
    );

    return instance;
  }

  /**
   * Set authorization header
   */
  setAuthToken(token: string, type: 'Bearer' | 'Basic' = 'Bearer'): void {
    this.client.defaults.headers.common['Authorization'] = `${type} ${token}`;
    logger.info('Authorization token set');
  }

  /**
   * Remove authorization header
   */
  removeAuthToken(): void {
    delete this.client.defaults.headers.common['Authorization'];
    logger.info('Authorization token removed');
  }

  /**
   * Set custom headers
   */
  setHeaders(headers: Record<string, string>): void {
    Object.assign(this.client.defaults.headers.common, headers);
    logger.info('Custom headers set', headers);
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    try {
      const response = await this.client.get<T>(url, config);
      this.logResponseDetails(response);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * POST request
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    try {
      const response = await this.client.post<T>(url, data, config);
      this.logResponseDetails(response);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    try {
      const response = await this.client.put<T>(url, data, config);
      this.logResponseDetails(response);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * PATCH request
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    try {
      const response = await this.client.patch<T>(url, data, config);
      this.logResponseDetails(response);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    try {
      const response = await this.client.delete<T>(url, config);
      this.logResponseDetails(response);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Upload file
   */
  async uploadFile(url: string, file: Buffer | string, fieldName: string = 'file', additionalFields?: Record<string, any>): Promise<AxiosResponse> {
    try {
      const formData = new FormData();
      
      if (typeof file === 'string') {
        // File path
        const fs = require('fs');
        const fileBuffer = fs.readFileSync(file);
        formData.append(fieldName, new Blob([fileBuffer]), file.split('/').pop());
      } else {
        // Buffer
        formData.append(fieldName, new Blob([Buffer.from(file)]));
      }

      // Add additional fields if provided
      if (additionalFields) {
        Object.entries(additionalFields).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }

      const response = await this.client.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      this.logResponseDetails(response);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Download file
   */
  async downloadFile(url: string, config?: AxiosRequestConfig): Promise<Buffer> {
    try {
      const response = await this.client.get(url, {
        ...config,
        responseType: 'arraybuffer'
      });

      logger.info(`File downloaded: ${url}`, {
        size: response.data.byteLength,
        contentType: response.headers['content-type']
      });

      return Buffer.from(response.data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Health check
   */
  async healthCheck(endpoint: string = '/health'): Promise<boolean> {
    try {
      const response = await this.get(endpoint);
      const isHealthy = response.status >= 200 && response.status < 300;
      logger.info(`Health check ${endpoint}:`, { status: response.status, healthy: isHealthy });
      return isHealthy;
    } catch (error) {
      logger.error(`Health check failed ${endpoint}:`, error as Error);
      return false;
    }
  }

  /**
   * Batch requests
   */
  async batchRequests(requests: Array<() => Promise<AxiosResponse>>): Promise<AxiosResponse[]> {
    try {
      const responses = await Promise.all(requests.map(request => request()));
      logger.info(`Batch requests completed`, { count: responses.length });
      return responses;
    } catch (error) {
      logger.error('Batch requests failed:', error as Error);
      throw error;
    }
  }

  /**
   * Log response details
   */
  private logResponseDetails(response: AxiosResponse): void {
    logger.debug('API Response Details', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      dataSize: JSON.stringify(response.data).length
    });
  }

  /**
   * Handle and format errors
   */
  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const apiError = new Error(`API Error: ${error.message}`);
      (apiError as any).status = error.response?.status;
      (apiError as any).data = error.response?.data;
      (apiError as any).url = error.config?.url;
      (apiError as any).method = error.config?.method;
      return apiError;
    }
    return error;
  }
}

/**
 * API Response validation utilities
 */
export class ApiValidator {
  /**
   * Validate response status
   */
  static validateStatus(response: AxiosResponse, expectedStatus: number | number[]): boolean {
    const expected = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
    const isValid = expected.includes(response.status);
    
    logger.assertion(
      `Response status is ${expected.join(' or ')}`,
      isValid,
      expected,
      response.status
    );
    
    return isValid;
  }

  /**
   * Validate response schema
   */
  static validateSchema(data: any, schema: object): boolean {
    // Basic schema validation - in a real project, use a library like Joi or Ajv
    try {
      const isValid = this.matchesSchema(data, schema);
      logger.assertion('Response matches schema', isValid, schema, typeof data);
      return isValid;
    } catch (error) {
      logger.assertion('Response matches schema', false, schema, error);
      return false;
    }
  }

  /**
   * Validate response time
   */
  static validateResponseTime(responseTime: number, maxTime: number): boolean {
    const isValid = responseTime <= maxTime;
    logger.assertion(
      `Response time is under ${maxTime}ms`,
      isValid,
      `<= ${maxTime}ms`,
      `${responseTime}ms`
    );
    return isValid;
  }

  /**
   * Basic schema matching
   */
  private static matchesSchema(data: any, schema: any): boolean {
    if (typeof schema !== typeof data) {
      return false;
    }

    if (schema === null || data === null) {
      return schema === data;
    }

    if (Array.isArray(schema)) {
      return Array.isArray(data) && data.every(item => this.matchesSchema(item, schema[0]));
    }

    if (typeof schema === 'object') {
      if (typeof data !== 'object') return false;
      
      for (const key in schema) {
        if (!(key in data)) return false;
        if (!this.matchesSchema(data[key], schema[key])) return false;
      }
    }

    return true;
  }
}

// Export default API client instance
export const apiClient = new ApiClient();
