/**
 * Medical Record Routes
 * Patients can view their own records
 * Doctors can create, update, and view patient records
 */
const express = require('express');
const { verifyToken, checkRole } = require('../middleware/auth');
const medicalRecordController = require('../controllers/medicalRecordController');

const router = express.Router();

/**
 * GET /api/records/mine
 * Patient: view their own medical records
 */
router.get(
  '/mine',
  verifyToken,
  checkRole('patient'),
  medicalRecordController.listMine
);

/**
 * POST /api/records
 * Doctor: create a new medical record for a patient
 */
router.post(
  '/',
  verifyToken,
  checkRole('doctor'),
  medicalRecordController.createRecord
);

/**
 * GET /api/records/:patientId
 * Doctor: view records for a specific patient
 */
router.get(
  '/:patientId',
  verifyToken,
  checkRole('doctor'),
  medicalRecordController.listForPatient
);

/**
 * PATCH /api/records/:id
 * Doctor: update an existing medical record
 */
router.patch(
  '/:id',
  verifyToken,
  checkRole('doctor'),
  medicalRecordController.updateRecord
);

/**
 * POST /api/records/:id/attachments
 * Doctor: add an attachment (metadata only)
 */
router.post(
  '/:id/attachments',
  verifyToken,
  checkRole('doctor'),
  medicalRecordController.addAttachment
);

/**
 * DELETE /api/records/:id/attachments/:attachmentId
 * Doctor: remove an attachment
 */
router.delete(
  '/:id/attachments/:attachmentId',
  verifyToken,
  checkRole('doctor'),
  medicalRecordController.removeAttachment
);

module.exports = router;
