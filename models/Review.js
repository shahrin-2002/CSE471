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
      refPath: 'targetType',
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true, 
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


reviewSchema.index({ appointmentId: 1 }, { unique: true });


reviewSchema.set('autoIndex', false);

module.exports = mongoose.model('Review', reviewSchema);


