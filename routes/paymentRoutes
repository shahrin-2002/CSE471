const express = require('express');
const { verifyToken, checkRole } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

const router = express.Router();

router.post('/checkout', verifyToken, checkRole('patient'), paymentController.checkout);
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), paymentController.stripeWebhook);

module.exports = router;
