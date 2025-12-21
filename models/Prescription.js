const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  medications: [{
    drug: String,
    dosage: String,
    frequency: String,
    duration: String
  }],
  diagnosis: String,
  notes: String,
  verificationCode: { type: String, unique: true }, // For QR Code
  pdfPath: String // Path to generated PDF
}, { timestamps: true });

module.exports = mongoose.model('Prescription', prescriptionSchema);