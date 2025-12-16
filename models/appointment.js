const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // ✅ Changed: reference Doctor instead of User
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },

  slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true },
  date: { type: Date, required: true },

  // Appointment lifecycle
  status: {
    type: String,
    enum: ['booked', 'cancelled', 'rescheduled', 'waitlisted'],
    default: 'booked'
  },

  notes: { type: String },
  promotedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
