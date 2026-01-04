/**
 * Healthcare System REST API
 * Main Server File
 * Port: 9358
 */

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Check for required environment variables
if (!process.env.MONGODB_URI) {
  console.error('❌ ERROR: MONGODB_URI is not set in .env file');
  console.error('💡 Please create a .env file in the root directory with:');
  console.error('   MONGODB_URI=your_mongodb_connection_string');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('❌ ERROR: JWT_SECRET is not set in .env file');
  console.error('💡 Please add JWT_SECRET to your .env file');
  process.exit(1);
}

// Import models to ensure they are registered with Mongoose
// IMPORTANT: Load models in order - referenced models first, then models that reference them
require('./models/User');
require('./models/Hospital');
require('./models/Doctor');
require('./models/appointment'); // Note: file is lowercase 'appointment.js'
require('./models/Review'); // Review references User, Doctor, Hospital, Appointment
require('./models/Favorite');
require('./models/LabOrder'); // LabOrder references User, Doctor

// Import route initializers
const initAuthRoutes = require('./routes/auth');
const hospitalRoutes = require('./routes/hospitals');
const doctorRoutes = require('./routes/doctors');
const appointmentRoutes = require('./routes/appointmentRoutes');
const userRoutes = require('./routes/userRoutes');
const documentRoutes = require('./routes/documentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const medicalRecordRoutes = require('./routes/medicalRecordRoutes'); // ✅ NEW
const icuRoutes = require('./routes/icuRoutes'); // ICU Booking
const generalBedRoutes = require('./routes/generalBedRoutes'); // General Bed Booking
const cabinRoutes = require('./routes/cabinRoutes'); // Cabin Booking
const reviewRoutes = require('./routes/reviewRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const labOrderRoutes = require('./routes/labOrderRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase payload limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir));

app.use('/api/users', userRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/admin', adminRoutes);

// MongoDB Connection with timeout settings for slow internet
console.log('🔄 Attempting to connect to MongoDB...');
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 30000, // 30 seconds - wait longer for server selection
  connectTimeoutMS: 30000, // 30 seconds - wait longer to establish connection
  socketTimeoutMS: 60000, // 60 seconds - wait longer for socket operations
  maxPoolSize: 10, // Maintain up to 10 socket connections
  minPoolSize: 2, // Maintain at least 2 socket connections
  retryWrites: true,
  retryReads: true,
})
  .then(() => {
    console.log('✅ Connected to MongoDB successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);
  })
  .catch((error) => {
    console.error('❌ MongoDB connection failed!');
    console.error('📋 Error details:', error.message);
    console.error('💡 Common issues:');
    console.error('   1. Check if MONGODB_URI is correct in .env file');
    console.error('   2. Verify your internet connection');
    console.error('   3. If using MongoDB Atlas, check if your IP is whitelisted');
    console.error('   4. Verify your MongoDB credentials are correct');
    console.error('   5. Check if MongoDB service is running (for local MongoDB)');
    console.error('\n🔧 Full error:', error);
    process.exit(1);
  });

// MongoDB connection event handlers
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (error) => {
  console.error('❌ MongoDB error:', error);
});

// API Routes (MVC Pattern)
app.use('/api/auth', initAuthRoutes());
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/records', medicalRecordRoutes); // ✅ mount medical records
app.use('/api/icu', icuRoutes); // ICU Booking routes
app.use('/api/general-bed', generalBedRoutes); // General Bed Booking routes
app.use('/api/cabin', cabinRoutes); // Cabin Booking routes
app.use('/api/reviews', reviewRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/lab-orders', labOrderRoutes);
app.use('/api/notifications', notificationRoutes);

// Basic health check endpoint
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: 'Server is running',
    port: process.env.PORT,
    database: dbStatus
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  console.error('📍 Stack trace:', err.stack);
  console.error('🔍 Request details:', {
    method: req.method,
    url: req.url,
    body: req.body,
    params: req.params,
    query: req.query
  });
  
  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: isDevelopment ? err.message : 'An error occurred. Please try again later.',
    ...(isDevelopment && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server after MongoDB connection is established
const PORT = process.env.PORT || 9358;

// Wait for MongoDB connection before starting server
mongoose.connection.once('open', () => {
  const server = app.listen(PORT, (err) => {
    if (err) {
      console.error('❌ Failed to start server:', err);
      process.exit(1);
    }
    console.log(`\n🏥 Healthcare API Server running on http://127.0.0.1:${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📝 Endpoints available:`);
  console.log(`   - POST   http://127.0.0.1:${PORT}/api/auth/signup`);
  console.log(`   - POST   http://127.0.0.1:${PORT}/api/auth/login`);
  console.log(`   - GET    http://127.0.0.1:${PORT}/api/hospitals`);
  console.log(`   - GET    http://127.0.0.1:${PORT}/api/hospitals/:id`);
  console.log(`   - POST   http://127.0.0.1:${PORT}/api/hospitals`);
  console.log(`   - GET    http://127.0.0.1:${PORT}/api/doctors`);
  console.log(`   - GET    http://127.0.0.1:${PORT}/api/doctors/:id`);
  console.log(`   - POST   http://127.0.0.1:${PORT}/api/doctors`);
  console.log(`   - GET    http://127.0.0.1:${PORT}/api/users/me`);
  console.log(`   - PUT    http://127.0.0.1:${PORT}/api/users/me`);
  console.log(`   - POST   http://127.0.0.1:${PORT}/api/documents`);
  console.log(`   - GET    http://127.0.0.1:${PORT}/api/documents/preview/:filename`);
  console.log(`   - DELETE http://127.0.0.1:${PORT}/api/documents/:id`);
  console.log(`   - GET    http://127.0.0.1:${PORT}/api/admin/documents`);
  console.log(`   - PATCH  http://127.0.0.1:${PORT}/api/admin/documents/:id/verify`);
  console.log(`   - PATCH  http://127.0.0.1:${PORT}/api/admin/documents/:id/reject`);
  console.log(`   - PATCH  http://127.0.0.1:${PORT}/api/admin/users/:id/lock`);
  console.log(`   - POST   http://127.0.0.1:${PORT}/api/appointments/book`);
  console.log(`   - PATCH  http://127.0.0.1:${PORT}/api/appointments/:id/reschedule`);
  console.log(`   - DELETE http://127.0.0.1:${PORT}/api/appointments/:id/cancel`);
  console.log(`   - GET    http://127.0.0.1:${PORT}/api/appointments/mine`);
  console.log(`   - GET    http://127.0.0.1:${PORT}/api/appointments/doctor/:doctorId`);
  console.log(`   - GET    http://127.0.0.1:${PORT}/api/records/mine`);
  console.log(`   - POST   http://127.0.0.1:${PORT}/api/records`);
  console.log(`   - GET    http://127.0.0.1:${PORT}/api/records/:patientId`);
  console.log(`   - PATCH  http://127.0.0.1:${PORT}/api/records/:id`);
  console.log(`   - POST   http://127.0.0.1:${PORT}/api/records/:id/attachments`);
  console.log(`   - DELETE http://127.0.0.1:${PORT}/api/records/:id/attachments/:attachmentId`);
  console.log(`   - GET    http://127.0.0.1:${PORT}/api/icu`);
  console.log(`   - GET    http://127.0.0.1:${PORT}/api/icu/locations`);
  console.log(`   - GET    http://127.0.0.1:${PORT}/api/icu/hospital/:hospitalId`);
  console.log(`   - POST   http://127.0.0.1:${PORT}/api/icu/book`);
  console.log(`   - POST   http://127.0.0.1:${PORT}/api/icu/waitlist`);
  console.log(`   - GET    http://127.0.0.1:${PORT}/api/icu/my-bookings`);
    console.log(`   - GET    http://127.0.0.1:${PORT}/api/icu/my-waitlist`);
    console.log(`   - DELETE http://127.0.0.1:${PORT}/api/icu/booking/:bookingId`);
    console.log(`   - GET    http://127.0.0.1:${PORT}/api/lab-orders/test`);
    console.log(`   - POST   http://127.0.0.1:${PORT}/api/lab-orders/submit`);
    console.log(`   - GET    http://127.0.0.1:${PORT}/api/lab-orders/mine`);
    console.log(`   - GET    http://127.0.0.1:${PORT}/api/lab-orders/doctor/mine`);
    console.log(`   - GET    http://127.0.0.1:${PORT}/api/lab-orders/lab/mine`);
    console.log(`   - POST   http://127.0.0.1:${PORT}/api/lab-orders`);
    console.log(`   - PATCH  http://127.0.0.1:${PORT}/api/lab-orders/:id`);
    console.log(`   - PATCH  http://127.0.0.1:${PORT}/api/lab-orders/:id/upload-result`);
    console.log(`✅ Health check: http://127.0.0.1:${PORT}/health\n`);
    
    // Set server timeout to handle slow connections (5 minutes)
    server.timeout = 300000; // 5 minutes in milliseconds
    server.keepAliveTimeout = 65000; // Keep connections alive longer
    server.headersTimeout = 66000; // Wait longer for headers
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('\n✅ MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

module.exports = app;
