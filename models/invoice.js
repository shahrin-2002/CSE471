const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true },
  invoiceNumber: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'BDT' },
  userSnapshot: { type: Object },
  doctorSnapshot: { type: Object },
  lineItems: [{ description: String, amount: Number }],
  tax: { type: Number, default: 0 },
  total: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
