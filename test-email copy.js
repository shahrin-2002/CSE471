/**
 * Test Email Service
 * Run this to test if your email configuration is working
 */

require('dotenv').config();
const sendEmail = require('./utils/emailService');

async function testEmail() {
  console.log('🧪 Testing email service...\n');

  // Check configuration
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Email service not configured!');
    console.error('Please set EMAIL_USER and EMAIL_PASS in your .env file');
    process.exit(1);
  }

  console.log(`📧 Sending test email to: ${process.env.EMAIL_USER}`);
  console.log('⏳ This may take up to 30 seconds if your internet is slow...\n');

  try {
    await sendEmail(
      process.env.EMAIL_USER,
      'Test Email from HealthConnect',
      'This is a test email. If you receive this, your email service is working correctly!'
    );
    console.log('\n✅ Email sent successfully!');
    console.log('💡 Check your inbox (and spam folder) for the test email.');
  } catch (error) {
    console.error('\n❌ Email test failed!');
    console.error('Error:', error.message);
    
    if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      console.error('\n💡 This is a connection timeout issue.');
      console.error('Solutions:');
      console.error('  1. Check your internet connection speed');
      console.error('  2. Try using a different network (mobile hotspot)');
      console.error('  3. Check if port 465 is blocked by firewall');
      console.error('  4. For development, use SKIP_OTP=true in .env to bypass email');
    } else if (error.message.includes('Invalid login')) {
      console.error('\n💡 Email credentials are incorrect.');
      console.error('Solutions:');
      console.error('  1. Verify EMAIL_USER and EMAIL_PASS in .env');
      console.error('  2. For Gmail, use an App Password (not your regular password)');
      console.error('  3. Enable "Less secure app access" or use App Passwords');
    } else {
      console.error('\n💡 Unknown error. Check the error message above for details.');
    }
    
    process.exit(1);
  }
}

testEmail();


