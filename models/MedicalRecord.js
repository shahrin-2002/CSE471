// backend/models/MedicalRecord.js
const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clinicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true }, // ✅ clinic is hospital

  visitDate: { type: Date, default: Date.now },
  reason: { type: String, required: true },
  notes: { type: String },

  diagnoses: [{ code: String, description: String }],
  vitals: {
    bloodPressure: String,
    heartRate: Number,
    temperature: Number,
    weight: Number,
    height: Number
  },
  prescriptions: [{
    medication: String,
    dosage: String,
    frequency: String,
    duration: String
  }],

  attachments: [{
    filename: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],

  access: {
    patient: { type: Boolean, default: true },
    clinicians: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }]
  }
}, { timestamps: true });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
