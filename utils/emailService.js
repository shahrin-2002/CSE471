const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Built-in service for Gmail
      auth: {
        user: process.env.EMAIL_USER, // Load from .env
        pass: process.env.EMAIL_PASS, // Load from .env
      },
    });

    const info = await transporter.sendMail({
      from: `"HealthConnect" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });

    console.log(`[Email Sent] To: ${to} | ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('[Email Error]', error);
    throw error; // Rethrow so the controller knows it failed
  }
};

module.exports = sendEmail;