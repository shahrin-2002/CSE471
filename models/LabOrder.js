const mongoose = require('mongoose');

const labOrderSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    testName: {
      type: String,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['ordered', 'in-progress', 'completed'],
      default: 'ordered',
    },
    // For simplicity we store a single result URL / filename.
    resultUrl: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

labOrderSchema.index({ patientId: 1, doctorId: 1, status: 1 });

module.exports = mongoose.model('LabOrder', labOrderSchema);


