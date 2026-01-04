const express = require('express');
const { verifyToken, checkRole } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Send OTP for verification
router.post('/send-otp', notificationController.sendOtp);

// Send booking confirmation
router.post('/booking-confirmation', notificationController.sendBookingConfirmation);

// Send appointment reminder
router.post('/appointment-reminder', notificationController.sendAppointmentReminder);

// Send status update notification
router.post('/status-update', notificationController.sendStatusUpdate);

// Send lab results notification
router.post('/lab-result', notificationController.sendLabResultNotification);

// Send prescription notification
router.post('/prescription', notificationController.sendPrescriptionNotification);

// Bulk notification (admin only)
router.post('/bulk', checkRole('admin'), notificationController.sendBulkNotification);

module.exports = router;