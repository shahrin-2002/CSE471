/**
 * Document Model - MongoDB (Mongoose)
 * Handles all database operations for documents
 */

const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    filename: { type: String, required: true },
    type: { type: String, required: true }, // e.g. NID, Passport, License
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    },
    notes: { type: String }
  },
  { timestamps: true }
);

// ✅ Static helper methods (mirror your old SQL methods)
documentSchema.statics.createDocument = async function ({ user, filename, type }) {
  const doc = new this({ user, filename, type });
  return await doc.save();
};

documentSchema.statics.findByUser = async function (userId) {
  return await this.find({ user: userId });
};

documentSchema.statics.findByIdDoc = async function (id) {
  return await this.findById(id);
};

documentSchema.statics.deleteDoc = async function (id) {
  return await this.findByIdAndDelete(id);
};

documentSchema.statics.updateStatus = async function (id, status, notes = null) {
  return await this.findByIdAndUpdate(id, { status, notes }, { new: true });
};

documentSchema.statics.findPending = async function () {
  return await this.find({ status: 'pending' });
};

module.exports = mongoose.model('Document', documentSchema);
