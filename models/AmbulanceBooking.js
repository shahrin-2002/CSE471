const mongoose = require('mongoose');

const ambulanceBookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['ALS', 'BLS'], required: true },
  pickupLocation: {
    address: String,
    lat: Number,
    lng: Number
  },
  status: { type: String, enum: ['pending', 'assigned', 'en-route', 'arrived', 'completed'], default: 'pending' },
  eta: String, // E.g., "15 mins"
  ambulanceId: { type: String }, // Placeholder for real ambulance ID
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AmbulanceBooking', ambulanceBookingSchema);