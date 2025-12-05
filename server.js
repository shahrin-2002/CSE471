/**
 * Healthcare System REST API
 * Main Server File
 * Port: 9358
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mysql = require('mysql2/promise');

// Import route initializers
const initAuthRoutes = require('./routes/auth');
const hospitalRoutes = require('./routes/hospitals');
const doctorRoutes = require('./routes/doctors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Make pool accessible to routes
app.use((req, res, next) => {
  req.pool = pool;
  next();
});

// API Routes (MVC Pattern)
app.use('/api/auth', initAuthRoutes(pool));
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/doctors', doctorRoutes);

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running', port: process.env.PORT });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
const PORT = process.env.PORT || 9358;
app.listen(PORT, () => {
  console.log(`\n🏥 Healthcare API Server running on http://127.0.0.1:${PORT}`);
  console.log(`📝 Endpoints available:`);
  console.log(`   - POST   http://127.0.0.1:${PORT}/api/auth/signup`);
  console.log(`   - POST   http://127.0.0.1:${PORT}/api/auth/login`);
  console.log(`   - GET    http://127.0.0.1:${PORT}/api/hospitals`);
  console.log(`   - GET    http://127.0.0.1:${PORT}/api/hospitals/:id`);
  console.log(`   - POST   http://127.0.0.1:${PORT}/api/hospitals`);
  console.log(`   - GET    http://127.0.0.1:${PORT}/api/doctors`);
  console.log(`   - GET    http://127.0.0.1:${PORT}/api/doctors/:id`);
  console.log(`   - POST   http://127.0.0.1:${PORT}/api/doctors`);
  console.log(`✅ Health check: http://127.0.0.1:${PORT}/health\n`);
});

module.exports = app;
