const express = require('express');
const { verifyToken, checkRole } = require('../middleware/auth');
const invoiceController = require('../controllers/invoiceController');

const router = express.Router();

router.get('/:paymentId/pdf', verifyToken, checkRole('patient'), invoiceController.downloadInvoice);

module.exports = router;
