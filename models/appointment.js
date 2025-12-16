const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true }, // ✅ Doctor reference
  slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true },
  date: { type: Date, required: true },
  status: {
    type: String,
    enum: ['booked', 'cancelled', 'rescheduled', 'waitlisted'],
    default: 'booked'
  },
  notes: { type: String },
  promotedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);

module.exports = mongoose.model('Appointment', appointmentSchema);
