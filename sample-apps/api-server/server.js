const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory data storage (in production, use a real database)
let users = [
  { id: 1, name: 'John Doe', email: 'john.doe@example.com', role: 'user', createdAt: '2024-01-01T00:00:00Z' },
  { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', role: 'admin', createdAt: '2024-01-02T00:00:00Z' },
  { id: 3, name: 'Bob Johnson', email: 'bob.johnson@example.com', role: 'user', createdAt: '2024-01-03T00:00:00Z' }
];

let products = [
  { id: 1, name: 'Laptop Pro', price: 1299.99, category: 'electronics', stock: 50, description: 'High-performance laptop' },
  { id: 2, name: 'Smartphone X', price: 799.99, category: 'electronics', stock: 100, description: 'Latest smartphone model' },
  { id: 3, name: 'Office Chair', price: 249.99, category: 'furniture', stock: 25, description: 'Ergonomic office chair' }
];

let orders = [
  { id: 1, userId: 1, productId: 1, quantity: 1, status: 'completed', total: 1299.99, createdAt: '2024-01-01T10:00:00Z' },
  { id: 2, userId: 2, productId: 2, quantity: 2, status: 'pending', total: 1599.98, createdAt: '2024-01-02T11:00:00Z' }
];

// Utility function to simulate delays (for testing timeouts)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to validate request data
const validateUser = (userData) => {
  const errors = [];
  if (!userData.name || userData.name.length < 2) errors.push('Name must be at least 2 characters');
  if (!userData.email || !userData.email.includes('@')) errors.push('Valid email is required');
  return errors;
};

const validateProduct = (productData) => {
  const errors = [];
  if (!productData.name || productData.name.length < 3) errors.push('Product name must be at least 3 characters');
  if (!productData.price || productData.price <= 0) errors.push('Price must be greater than 0');
  if (!productData.category) errors.push('Category is required');
  return errors;
};

// Logging middleware
app.use((req, res, next) => {
  console.log(`🔄 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// API Info endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Sample API Server for Playwright Testing',
    version: '1.0.0',
    endpoints: {
      users: '/users',
      products: '/products',
      orders: '/orders',
      health: '/health'
    },
    documentation: 'This API provides endpoints for testing the Playwright framework'
  });
});

// ========== USER ENDPOINTS ==========

// Get all users with pagination
app.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedUsers = users.slice(startIndex, endIndex);
    
    res.json({
      data: paginatedUsers,
      pagination: {
        page,
        limit,
        total: users.length,
        pages: Math.ceil(users.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Get user by ID
app.get('/users/:id', (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ data: user });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Create new user
app.post('/users', (req, res) => {
  try {
    const userData = req.body;
    const errors = validateUser(userData);
    
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    
    // Check if email already exists
    const existingUser = users.find(u => u.email === userData.email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    
    const newUser = {
      id: users.length + 1,
      name: userData.name,
      email: userData.email,
      role: userData.role || 'user',
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    
    res.status(201).json({ 
      message: 'User created successfully', 
      data: newUser 
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Update user
app.put('/users/:id', (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = req.body;
    const errors = validateUser(userData);
    
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    
    users[userIndex] = { 
      ...users[userIndex], 
      ...userData, 
      updatedAt: new Date().toISOString() 
    };
    
    res.json({ 
      message: 'User updated successfully', 
      data: users[userIndex] 
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Delete user
app.delete('/users/:id', (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    users.splice(userIndex, 1);
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// ========== PRODUCT ENDPOINTS ==========

// Get all products with pagination and search
app.get('/products', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.q || '';
    
    let filteredProducts = products;
    
    // Search functionality
    if (search) {
      filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
    
    res.json({
      data: paginatedProducts,
      pagination: {
        page,
        limit,
        total: filteredProducts.length,
        pages: Math.ceil(filteredProducts.length / limit)
      },
      search: search || null
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Search products (alternative endpoint)
app.get('/products/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const searchResults = products.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.description.toLowerCase().includes(query.toLowerCase()) ||
      p.category.toLowerCase().includes(query.toLowerCase())
    );
    
    res.json({
      data: searchResults,
      query,
      count: searchResults.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Get product by ID
app.get('/products/:id', (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const product = products.find(p => p.id === productId);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ data: product });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Create new product
app.post('/products', (req, res) => {
  try {
    const productData = req.body;
    const errors = validateProduct(productData);
    
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    
    const newProduct = {
      id: products.length + 1,
      name: productData.name,
      price: parseFloat(productData.price),
      category: productData.category,
      stock: parseInt(productData.stock) || 0,
      description: productData.description || '',
      createdAt: new Date().toISOString()
    };
    
    products.push(newProduct);
    
    res.status(201).json({ 
      message: 'Product created successfully', 
      data: newProduct 
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Update product
app.put('/products/:id', (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const productIndex = products.findIndex(p => p.id === productId);
    
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const productData = req.body;
    const errors = validateProduct(productData);
    
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    
    products[productIndex] = { 
      ...products[productIndex], 
      ...productData,
      price: parseFloat(productData.price),
      stock: parseInt(productData.stock),
      updatedAt: new Date().toISOString() 
    };
    
    res.json({ 
      message: 'Product updated successfully', 
      data: products[productIndex] 
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Delete product
app.delete('/products/:id', (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const productIndex = products.findIndex(p => p.id === productId);
    
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    products.splice(productIndex, 1);
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// ========== TEST ENDPOINTS FOR ERROR HANDLING ==========

// Simulate server errors
app.get('/error/500', (req, res) => {
  res.status(500).json({ error: 'Internal server error', message: 'Simulated server error for testing' });
});

app.get('/error/404', (req, res) => {
  res.status(404).json({ error: 'Not found', message: 'Simulated 404 error for testing' });
});

app.get('/error/401', (req, res) => {
  res.status(401).json({ error: 'Unauthorized', message: 'Simulated authorization error for testing' });
});

// Slow endpoint for timeout testing
app.get('/slow-endpoint', async (req, res) => {
  const delayMs = parseInt(req.query.delay) || 5000; // Default 5 second delay
  await delay(delayMs);
  res.json({ message: 'This endpoint has a delay', delay: delayMs });
});

// Performance test endpoint
app.get('/performance-test', async (req, res) => {
  const start = Date.now();
  
  // Simulate some processing
  await delay(100);
  
  const end = Date.now();
  const processingTime = end - start;
  
  res.json({
    message: 'Performance test endpoint',
    processingTime: `${processingTime}ms`,
    timestamp: new Date().toISOString(),
    load: Math.random() * 100 // Simulate server load
  });
});

// ========== ERROR HANDLING ==========

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not Found', 
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: ['/users', '/products', '/health', '/']
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('🚨 Error:', error);
  res.status(500).json({ 
    error: 'Internal Server Error', 
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Sample API Server running on http://localhost:${PORT}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   • GET  /health - Health check`);
  console.log(`   • GET  /users - List users`);
  console.log(`   • POST /users - Create user`);
  console.log(`   • GET  /products - List products`);
  console.log(`   • POST /products - Create product`);
  console.log(`   • GET  /products/search?q=query - Search products`);
  console.log(`   • GET  /error/500 - Test server error`);
  console.log(`   • GET  /slow-endpoint - Test timeout (5s delay)`);
  console.log(`   • GET  /performance-test - Performance testing`);
});