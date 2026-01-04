const sendEmail = require('./emailService');

// Simple SMS stub – extend with real provider later
async function sendSms(to, message) {
  console.log(`[SMS Stub] To: ${to} | Message: ${message}`);
  // TODO: Integrate with actual SMS provider (Twilio, etc.)
  return { success: true, messageId: 'sms_' + Date.now() };
}

// Push notification stub
async function sendPushNotification(userId, title, body, data = {}) {
  console.log(`[Push Notification Stub] User: ${userId} | Title: ${title} | Body: ${body}`);
  // TODO: Integrate with Firebase Cloud Messaging or similar
  return { success: true, messageId: 'push_' + Date.now() };
}

// Enhanced notification helper for appointments & system events
async function notifyUser({ email, phone, userId, subject, text, title, pushData = {} }) {
  const results = { email: null, sms: null, push: null };
  
  // Email notification
  if (email) {
    try {
      await sendEmail(email, subject || title, text);
      results.email = { success: true, message: 'Email sent successfully' };
    } catch (e) {
      results.email = { success: false, message: 'Failed to send email', error: e.message };
    }
  }
  
  // SMS notification
  if (phone) {
    try {
      const smsResult = await sendSms(phone, text);
      results.sms = { success: smsResult.success, message: 'SMS sent successfully' };
    } catch (e) {
      results.sms = { success: false, message: 'Failed to send SMS', error: e.message };
    }
  }
  
  // Push notification
  if (userId && title) {
    try {
      const pushResult = await sendPushNotification(userId, title, text, pushData);
      results.push = { success: pushResult.success, message: 'Push notification sent successfully' };
    } catch (e) {
      results.push = { success: false, message: 'Failed to send push notification', error: e.message };
    }
  }
  
  return results;
}

// Appointment-specific notifications
async function sendAppointmentReminder(appointment, user) {
  const subject = 'Appointment Reminder';
  const text = `Dear ${user.name}, this is a reminder for your appointment scheduled for ${appointment.date} at ${appointment.time}. Please arrive 15 minutes early.`;
  const title = 'Appointment Reminder';
  
  return await notifyUser({
    email: user.email,
    phone: user.phone,
    userId: user._id,
    subject,
    text,
    title,
    pushData: { type: 'appointment_reminder', appointmentId: appointment._id }
  });
}

async function sendBookingConfirmation(booking, user, bookingType) {
  const subject = `${bookingType} Booking Confirmed`;
  const text = `Dear ${user.name}, your ${bookingType.toLowerCase()} booking has been confirmed for ${booking.date}. Booking ID: ${booking._id}`;
  const title = `${bookingType} Booking Confirmed`;
  
  return await notifyUser({
    email: user.email,
    phone: user.phone,
    userId: user._id,
    subject,
    text,
    title,
    pushData: { type: 'booking_confirmation', bookingId: booking._id, bookingType }
  });
}

async function sendStatusUpdate(user, statusType, statusData) {
  const { oldStatus, newStatus, entityType, entityId } = statusData;
  const subject = `${entityType} Status Updated`;
  const text = `Dear ${user.name}, your ${entityType.toLowerCase()} status has been updated from ${oldStatus} to ${newStatus}.`;
  const title = 'Status Updated';
  
  return await notifyUser({
    email: user.email,
    phone: user.phone,
    userId: user._id,
    subject,
    text,
    title,
    pushData: { type: 'status_update', entityType, entityId, oldStatus, newStatus }
  });
}

async function sendOtp(user, otp) {
  const subject = 'Verification Code';
  const text = `Your verification code is: ${otp}. This code will expire in 10 minutes. Do not share this code with anyone.`;
  const title = 'Verification Code';
  
  return await notifyUser({
    email: user.email,
    phone: user.phone,
    userId: user._id,
    subject,
    text,
    title,
    pushData: { type: 'otp_verification', otp }
  });
}

async function sendLabResultNotification(user, labOrder) {
  const subject = 'Lab Results Available';
  const text = `Dear ${user.name}, your lab results for ${labOrder.testName} are now available. Please log in to view your results.`;
  const title = 'Lab Results Available';
  
  return await notifyUser({
    email: user.email,
    phone: user.phone,
    userId: user._id,
    subject,
    text,
    title,
    pushData: { type: 'lab_results', labOrderId: labOrder._id }
  });
}

async function sendPrescriptionNotification(user, prescription) {
  const subject = 'New Prescription Available';
  const text = `Dear ${user.name}, you have a new prescription from Dr. ${prescription.doctorName}. Please review your prescription details.`;
  const title = 'New Prescription';
  
  return await notifyUser({
    email: user.email,
    phone: user.phone,
    userId: user._id,
    subject,
    text,
    title,
    pushData: { type: 'prescription', prescriptionId: prescription._id }
  });
}

module.exports = {
  notifyUser,
  sendAppointmentReminder,
  sendBookingConfirmation,
  sendStatusUpdate,
  sendOtp,
  sendLabResultNotification,
  sendPrescriptionNotification,
};


