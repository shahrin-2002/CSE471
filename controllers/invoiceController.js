const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const PDFDocument = require('pdfkit');

exports.downloadInvoice = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId).populate('userId doctorId');
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    const invoiceNumber = `INV-${Date.now()}`;
    const invoice = await Invoice.create({
      paymentId,
      invoiceNumber,
      amount: payment.amount,
      currency: payment.currency,
      userSnapshot: payment.userId,
      doctorSnapshot: payment.doctorId,
      lineItems: [{ description: 'Consultation Fee', amount: payment.amount }],
      total: payment.amount,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${invoiceNumber}.pdf`);

    const doc = new PDFDocument();
    doc.pipe(res);
    doc.fontSize(20).text('Healthcare Invoice', { align: 'center' });
    doc.text(`Invoice Number: ${invoiceNumber}`);
    doc.text(`Patient: ${payment.userId.name}`);
    doc.text(`Doctor: ${payment.doctorId.name}`);
    doc.text(`Amount: ${payment.amount} ${payment.currency}`);
    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
