const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verifyToken, checkRole } = require('../middleware/auth');
const labOrderController = require('../controllers/labOrderController');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config for lab results
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '_');
    cb(null, `${Date.now()}-${base}${ext}`);
  }
});
const upload = multer({ storage });

const router = express.Router();

// Test route to verify routing is working
router.get('/test', (req, res) => {
  res.json({ message: 'Lab orders routes are working', timestamp: new Date().toISOString() });
});

// ============================================
// SPECIFIC ROUTES - Must come BEFORE parameterized routes
// ============================================

// Patient submits lab report (creates new order with file upload)
router.post('/submit', verifyToken, checkRole('patient'), upload.single('report'), labOrderController.submitLabReport);

// Patient views own lab orders
router.get('/mine', verifyToken, checkRole('patient'), labOrderController.listForPatient);

// Doctor views own lab orders
router.get('/doctor/mine', verifyToken, checkRole('doctor'), labOrderController.listForDoctor);

// Lab views orders
router.get('/lab/mine', verifyToken, checkRole('lab'), labOrderController.listForLab);

// ============================================
// PARAMETERIZED ROUTES - Must come AFTER specific routes
// ============================================

// Patient uploads result to existing order
router.patch('/:id/upload-result', verifyToken, checkRole('patient'), upload.single('result'), labOrderController.uploadResult);

// Lab uploads result
router.patch('/:id/lab-upload', verifyToken, checkRole('lab'), upload.single('result'), labOrderController.labUploadResult);

// Lab updates status
router.patch('/:id/lab-update', verifyToken, checkRole('lab'), labOrderController.labUpdateStatus);

// Doctor updates status / results
router.patch('/:id', verifyToken, checkRole('doctor'), labOrderController.updateOrder);

// Doctor creates a new lab order
router.post('/', verifyToken, checkRole('doctor'), labOrderController.createOrder);

module.exports = router;


