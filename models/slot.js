const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  // ✅ Changed: reference Doctor instead of User
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },

  date: { type: Date, required: true }, // specific time block
  capacity: { type: Number, required: true }, // max patients

  appointments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' }],
  waitlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

// Ensure uniqueness per doctor/date
slotSchema.index({ doctorId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Slot', slotSchema);
