const nodemailer = require('nodemailer');


const sendEmail = async (arg1, arg2, arg3, arg4 = null, arg5 = []) => {
  try {
    let to, subject, text, html, attachments;


    if (typeof arg1 === 'object' && arg1 !== null && !Array.isArray(arg1)) {
      ({ to, subject, text, html, attachments } = arg1);
    } 
    else {
      to = arg1;
      subject = arg2;
      text = arg3;
      html = arg4;
      attachments = arg5;
    }

    // Configure Transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Setup Mail Options
    const mailOptions = {
      from: `"HealthConnect" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    };

    // Add HTML if present
    if (html) {
      mailOptions.html = html;
    }

    // Add Attachments if present (The new feature)
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      mailOptions.attachments = attachments;
    }

    // Send Email
    const info = await transporter.sendMail(mailOptions);

    console.log(`[Email Sent] To: ${to} | ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('[Email Error]', error);
    // We throw the error so the calling controller knows something went wrong
    throw error;
  }
};

module.exports = sendEmail;