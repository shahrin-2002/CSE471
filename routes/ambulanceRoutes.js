const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const controller = require('../controllers/ambulanceController');

router.post('/book', verifyToken, controller.bookAmbulance);
router.get('/status/:id', verifyToken, controller.getStatus);

module.exports = router;