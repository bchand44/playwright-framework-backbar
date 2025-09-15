const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Simple session storage (in production, use proper session management)
let sessions = new Map();

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/forgot-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'forgot-password.html'));
});

app.get('/reset-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'forgot-password.html'));
});

// Login API endpoint
app.post('/api/login', (req, res) => {
  const { username, password, rememberMe } = req.body;
  
  // Valid test credentials (matching our test data)
  const validCredentials = [
    { username: 'testuser@example.com', password: 'TestPassword123!' },
    { username: 'admin@example.com', password: 'AdminPassword123!' },
    { username: 'user@example.com', password: 'UserPassword123!' }
  ];
  
  const isValid = validCredentials.some(cred => 
    cred.username === username && cred.password === password
  );
  
  if (isValid) {
    const sessionId = 'session_' + Date.now();
    sessions.set(sessionId, { username, rememberMe });
    
    res.json({ 
      success: true, 
      message: 'Login successful',
      sessionId,
      redirectUrl: '/dashboard'
    });
  } else {
    res.status(401).json({ 
      success: false, 
      message: 'Invalid username or password' 
    });
  }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
  const { sessionId } = req.body;
  sessions.delete(sessionId);
  res.json({ success: true, message: 'Logged out successfully' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🌐 Sample Web App running on http://localhost:${PORT}`);
  console.log(`📋 Available pages:`);
  console.log(`   • Login: http://localhost:${PORT}/login`);
  console.log(`   • Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`   • Forgot Password: http://localhost:${PORT}/forgot-password`);
});