const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth');
const controller = require('../controllers/prescriptionController');

router.post('/create', verifyToken, checkRole('doctor'), controller.createPrescription);
router.get('/:id', verifyToken, controller.getPrescription);

module.exports = router;