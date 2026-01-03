const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, text, html = null) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'HealthConnect <onboarding@resend.dev>', // Free tier uses resend.dev domain
      to: [to],
      subject: subject,
      text: text,
      html: html || undefined,
    });

    if (error) {
      console.error('[Email Error]', error);
      throw new Error(error.message);
    }

    console.log(`[Email Sent] To: ${to} | ID: ${data.id}`);
    return data;
  } catch (error) {
    console.error('[Email Error]', error);
    throw error;
  }
};

module.exports = sendEmail;
