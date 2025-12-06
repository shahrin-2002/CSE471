const router = require('express').Router();
const multer = require('multer');
const { verifyToken } = require('../middleware/auth');
const lockedGuard = require('../middleware/lock');
const docController = require('../controllers/document.controller');

const uploadMw = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Upload document (protected, blocked if locked)
router.post('/', verifyToken, lockedGuard, uploadMw.single('file'), (req, res) => docController.upload(req, res));

// Preview document by filename (public)
router.get('/preview/:filename', (req, res) => docController.preview(req, res));

// Delete document (protected)
router.delete('/:id', verifyToken, (req, res) => docController.remove(req, res));

module.exports = router;
