/**
 * Server Configuration Diagnostic Tool
 * Run this to check if your server is properly configured
 */

require('dotenv').config();

console.log('🔍 Checking server configuration...\n');

let hasErrors = false;

// Check environment variables
console.log('📋 Environment Variables:');
if (!process.env.MONGODB_URI) {
  console.error('  ❌ MONGODB_URI: NOT SET');
  hasErrors = true;
} else {
  // Mask password in connection string
  const maskedUri = process.env.MONGODB_URI.replace(/:[^:@]+@/, ':****@');
  console.log(`  ✅ MONGODB_URI: ${maskedUri}`);
}

if (!process.env.JWT_SECRET) {
  console.error('  ❌ JWT_SECRET: NOT SET');
  hasErrors = true;
} else {
  console.log(`  ✅ JWT_SECRET: Set (${process.env.JWT_SECRET.length} characters)`);
}

if (!process.env.EMAIL_USER) {
  console.warn('  ⚠️  EMAIL_USER: NOT SET (OTP emails will fail)');
} else {
  console.log(`  ✅ EMAIL_USER: ${process.env.EMAIL_USER}`);
}

if (!process.env.EMAIL_PASS) {
  console.warn('  ⚠️  EMAIL_PASS: NOT SET (OTP emails will fail)');
} else {
  console.log(`  ✅ EMAIL_PASS: Set`);
}

if (process.env.SKIP_OTP === 'true') {
  console.log('  ℹ️  SKIP_OTP: Enabled (OTP verification disabled)');
}

console.log(`  ℹ️  PORT: ${process.env.PORT || '9358 (default)'}`);

// Test MongoDB connection
console.log('\n🔌 Testing MongoDB Connection:');
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
})
  .then(() => {
    console.log('  ✅ MongoDB connection: SUCCESS');
    console.log(`  📊 Database: ${mongoose.connection.name}`);
    console.log(`  🌐 Host: ${mongoose.connection.host}`);
    
    mongoose.connection.close().then(() => {
      console.log('\n✅ All checks passed! Your server should work correctly.');
      if (hasErrors) {
        console.log('\n⚠️  Some configuration issues found. Please fix them before starting the server.');
        process.exit(1);
      } else {
        process.exit(0);
      }
    });
  })
  .catch((error) => {
    console.error('  ❌ MongoDB connection: FAILED');
    console.error(`  📋 Error: ${error.message}`);
    console.error('\n💡 Common fixes:');
    console.error('  1. Check if MONGODB_URI is correct');
    console.error('  2. Verify your internet connection');
    console.error('  3. If using MongoDB Atlas, check IP whitelist');
    console.error('  4. Verify MongoDB credentials');
    process.exit(1);
  });

