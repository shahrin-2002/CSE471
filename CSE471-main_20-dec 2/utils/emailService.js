const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text, html = null, retries = 2) => {
  // Check if email credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Email service not configured: EMAIL_USER or EMAIL_PASS missing in .env');
    throw new Error('Email service is not configured. Please set EMAIL_USER and EMAIL_PASS in your .env file.');
  }

  // Retry logic for slow internet connections
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail', // Built-in service for Gmail
        auth: {
          user: process.env.EMAIL_USER, // Load from .env
          pass: process.env.EMAIL_PASS, // Load from .env
        },
        // Add timeout settings for slow internet
        connectionTimeout: 30000, // 30 seconds to establish connection
        greetingTimeout: 30000, // 30 seconds for SMTP greeting
        socketTimeout: 30000, // 30 seconds for socket operations
        // Use secure connection
        secure: true,
        port: 465,
        tls: {
          rejectUnauthorized: false, // Allow self-signed certificates if needed
        },
      });

      const mailOptions = {
        from: `"HealthConnect" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
      };

      // Add HTML if provided
      if (html) {
        mailOptions.html = html;
      }

      const info = await transporter.sendMail(mailOptions);

      console.log(`📧 Email sent successfully to ${to}, Message ID: ${info.messageId}`);
      return info;
    } catch (error) {
      const isTimeoutError = error.code === 'ETIMEDOUT' || 
                            error.code === 'ECONNRESET' || 
                            error.code === 'ESOCKETTIMEDOUT' ||
                            error.message.includes('timeout') ||
                            error.message.includes('ETIMEDOUT');

      if (isTimeoutError && attempt < retries) {
        const waitTime = attempt * 2000; // Wait 2s, 4s, etc.
        console.warn(`⚠️ Email connection timeout (attempt ${attempt}/${retries}). Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue; // Retry
      }

      // If it's a timeout error and we've exhausted retries, provide helpful message
      if (isTimeoutError) {
        console.error(`❌ Email sending failed after ${retries} attempts: Connection timeout to Gmail SMTP`);
        console.error('💡 This is likely due to slow internet connection or network restrictions.');
        console.error('💡 Solutions:');
        console.error('   1. Check your internet connection speed');
        console.error('   2. Try using a different network (mobile hotspot, etc.)');
        console.error('   3. Add SKIP_OTP=true to .env to bypass OTP for development');
        console.error('   4. Check if port 465 is blocked by firewall');
        throw new Error('Email service timeout. Please check your internet connection or use SKIP_OTP=true for development.');
      }

      // For other errors, throw immediately
      console.error('❌ Email sending failed:', error.message);
      throw error;
    }
  }
};

module.exports = sendEmail;