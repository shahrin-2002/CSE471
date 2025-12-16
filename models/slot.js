const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true }, // ✅ Doctor reference
  date: { type: Date, required: true },
  capacity: { type: Number, required: true },
  appointments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' }],
  waitlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // ✅ patients waiting
}, { timestamps: true });

slotSchema.index({ doctorId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Slot', slotSchema);

