const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true },
  date: { type: Date, required: true },

  // Appointment lifecycle
  status: { 
    type: String, 
    enum: ['booked', 'cancelled', 'rescheduled', 'waitlisted'], 
    default: 'booked' 
  },

  // Optional notes (e.g., cancellation reason, reschedule reason)
  notes: { type: String },

  // Track when patient was promoted from waitlist
  promotedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);

