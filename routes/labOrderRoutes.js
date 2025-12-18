const express = require('express');
const multer = require('multer');
const { verifyToken, checkRole } = require('../middleware/auth');
const labOrderController = require('../controllers/labOrderController');

// Multer config for lab results
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

const router = express.Router();

// Doctor creates a new lab order
router.post('/', verifyToken, checkRole('doctor'), labOrderController.createOrder);

// Doctor updates status / results
router.patch('/:id', verifyToken, checkRole('doctor'), labOrderController.updateOrder);

// Patient views own lab orders
router.get('/mine', verifyToken, checkRole('patient'), labOrderController.listForPatient);

// Doctor views own lab orders
router.get('/doctor/mine', verifyToken, checkRole('doctor'), labOrderController.listForDoctor);

// Patient uploads result
router.patch('/:id/upload-result', verifyToken, checkRole('patient'), upload.single('result'), labOrderController.uploadResult);

// Lab views orders
router.get('/lab/mine', verifyToken, checkRole('lab'), labOrderController.listForLab);

// Lab updates status
router.patch('/:id/lab-update', verifyToken, checkRole('lab'), labOrderController.labUpdateStatus);

// Lab uploads result
router.patch('/:id/lab-upload', verifyToken, checkRole('lab'), upload.single('result'), labOrderController.labUploadResult);

module.exports = router;


