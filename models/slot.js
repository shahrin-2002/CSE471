const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true }, // specific time block
  capacity: { type: Number, required: true }, // max patients
  appointments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' }],
  waitlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

slotSchema.index({ doctorId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Slot', slotSchema);
