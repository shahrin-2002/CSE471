const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: {
      type: String,
      enum: ['doctor', 'hospital'],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      // Note: refPath won't work directly for 'patient' since model is 'User'
      // We'll handle population manually in the controller
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: false, // Optional - allow reviews without appointments
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    isApproved: {
      type: Boolean,
      default: true, // ✅ Admin moderation - default approved
    },
  },
  { 
    timestamps: true,
    collection: 'reviews'
  }
);


// Only create unique index if appointmentId exists
reviewSchema.index({ appointmentId: 1 }, { unique: true, sparse: true });


reviewSchema.set('autoIndex', false);

// Prevent model overwrite error - check if model already exists
module.exports = mongoose.models.Review || mongoose.model('Review', reviewSchema);


