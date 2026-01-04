const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  // Patient reference
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Doctor reference (clinician)
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },

  // Encounter details
  visitDate: {
    type: Date,
    default: Date.now
  },
  reason: {
    type: String,
    required: true
  },
  notes: String,

  // Diagnoses
  diagnoses: [{
    code: String,          // ICD-10 or internal code
    description: String    // Human-readable diagnosis
  }],

  // Vitals
  vitals: {
    bloodPressure: String,
    heartRate: Number,
    temperature: Number,
    weight: Number,
    height: Number
  },

  // Prescriptions
  prescriptions: [{
    medication: String,
    dosage: String,
    frequency: String,
    duration: String
  }],

  // Attachments (lab reports, scans, etc.)
  attachments: [{
    filename: String,
    url: String, // Cloud storage URL
    uploadedAt: { type: Date, default: Date.now }
  }],

  // Access control
  access: {
    patient: { type: Boolean, default: true },
    doctors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }]
  }
}, {
  timestamps: true
});

// Index for search by patient and doctor
medicalRecordSchema.index({ patientId: 1, doctorId: 1 });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
