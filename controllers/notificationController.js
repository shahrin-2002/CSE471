const User = require('../models/User');
const notificationService = require('../utils/notificationService');

// Send OTP for verification
exports.sendOtp = async (req, res) => {
  try {
    const { email, phone } = req.body;
    
    if (!email && !phone) {
      return res.status(400).json({ error: 'Email or phone is required' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let user;
    if (email) {
      user = await User.findOne({ email });
    } else {
      user = await User.findOne({ phone });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user with OTP
    user.otp = otp;
    user.otpExpires = otpExpiry;
    await user.save();

    // Send OTP via notification service
    await notificationService.sendOtp(user, otp);

    res.json({ message: 'OTP sent successfully', expiresIn: 10 * 60 }); // 10 minutes in seconds
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to send OTP' });
  }
};

// Send booking confirmation
exports.sendBookingConfirmation = async (req, res) => {
  try {
    const { bookingId, bookingType, userId } = req.body;
    
    if (!bookingId || !bookingType || !userId) {
      return res.status(400).json({ error: 'Booking ID, type, and user ID are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create mock booking object for notification
    const booking = {
      _id: bookingId,
      date: new Date().toISOString(),
      type: bookingType
    };

    const result = await notificationService.sendBookingConfirmation(booking, user, bookingType);
    
    res.json({ 
      message: 'Booking confirmation sent', 
      notificationResult: result 
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to send booking confirmation' });
  }
};

// Send appointment reminder
exports.sendAppointmentReminder = async (req, res) => {
  try {
    const { appointmentId, userId } = req.body;
    
    if (!appointmentId || !userId) {
      return res.status(400).json({ error: 'Appointment ID and user ID are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create mock appointment object for notification
    const appointment = {
      _id: appointmentId,
      date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      time: '10:00 AM'
    };

    const result = await notificationService.sendAppointmentReminder(appointment, user);
    
    res.json({ 
      message: 'Appointment reminder sent', 
      notificationResult: result 
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to send appointment reminder' });
  }
};

// Send status update notification
exports.sendStatusUpdate = async (req, res) => {
  try {
    const { userId, statusType, statusData } = req.body;
    
    if (!userId || !statusType || !statusData) {
      return res.status(400).json({ error: 'User ID, status type, and status data are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = await notificationService.sendStatusUpdate(user, statusType, statusData);
    
    res.json({ 
      message: 'Status update notification sent', 
      notificationResult: result 
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to send status update notification' });
  }
};

// Send lab results notification
exports.sendLabResultNotification = async (req, res) => {
  try {
    const { userId, labOrderId, testName } = req.body;
    
    if (!userId || !labOrderId || !testName) {
      return res.status(400).json({ error: 'User ID, lab order ID, and test name are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create mock lab order object for notification
    const labOrder = {
      _id: labOrderId,
      testName
    };

    const result = await notificationService.sendLabResultNotification(user, labOrder);
    
    res.json({ 
      message: 'Lab result notification sent', 
      notificationResult: result 
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to send lab result notification' });
  }
};

// Send prescription notification
exports.sendPrescriptionNotification = async (req, res) => {
  try {
    const { userId, prescriptionId, doctorName } = req.body;
    
    if (!userId || !prescriptionId || !doctorName) {
      return res.status(400).json({ error: 'User ID, prescription ID, and doctor name are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create mock prescription object for notification
    const prescription = {
      _id: prescriptionId,
      doctorName
    };

    const result = await notificationService.sendPrescriptionNotification(user, prescription);
    
    res.json({ 
      message: 'Prescription notification sent', 
      notificationResult: result 
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to send prescription notification' });
  }
};

// Bulk notification sending (admin only)
exports.sendBulkNotification = async (req, res) => {
  try {
    const { userIds, subject, message, type = 'general' } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'Valid user IDs array is required' });
    }

    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }

    const users = await User.find({ _id: { $in: userIds } });
    const results = [];

    for (const user of users) {
      try {
        const result = await notificationService.notifyUser({
          email: user.email,
          phone: user.phone,
          userId: user._id,
          subject,
          text: message,
          title: subject,
          pushData: { type, bulk: true }
        });
        results.push({ userId: user._id, success: true, result });
      } catch (error) {
        results.push({ userId: user._id, success: false, error: error.message });
      }
    }

    res.json({ 
      message: 'Bulk notification completed', 
      results,
      totalUsers: users.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to send bulk notification' });
  }
};