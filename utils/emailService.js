const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text, html = null) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: `"HealthConnect" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    };

    if (html) {
      mailOptions.html = html;
    }

    const info = await transporter.sendMail(mailOptions);

    console.log(`[Email Sent] To: ${to} | ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('[Email Error]', error);
    throw error;
  }
};

module.exports = sendEmail;
