const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  hospital_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  specialization: {
    type: String,
    required: true
  },
  license_number: {
    type: String,
    unique: true,
    sparse: true
  },
  experience_years: {
    type: Number,
    default: 0
  },
  qualifications: String,
  consultation_fee: {
    type: Number,
    default: 500
  },
  availability_status: {
    type: String,
    enum: ['Available', 'Busy', 'On_Leave'],
    default: 'Available'
  },
  phone: String,
  email: String
}, {
  timestamps: true
});

// Add index for search
doctorSchema.index({ name: 'text', specialization: 'text' });

module.exports = mongoose.model('Doctor', doctorSchema);
