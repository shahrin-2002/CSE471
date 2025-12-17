// backend/routes/medicalRecordRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth');
const medicalRecordController = require('../controllers/medicalRecordController');

// Patient routes
router.get('/mine', verifyToken, checkRole('patient'), medicalRecordController.listMine);

// Doctor routes
router.post('/', verifyToken, checkRole('doctor'), medicalRecordController.createRecord);
router.get('/:patientId', verifyToken, checkRole('doctor'), medicalRecordController.listForPatient);
router.patch('/:id', verifyToken, checkRole('doctor'), medicalRecordController.updateRecord);

// Attachments
router.post('/:id/attachments', verifyToken, checkRole('doctor'), medicalRecordController.addAttachment);
router.delete('/:id/attachments/:attachmentId', verifyToken, checkRole('doctor'), medicalRecordController.removeAttachment);

module.exports = router;
