const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
// FIX: Destructure verifyToken
const { verifyToken } = require('../middleware/auth');
const DocumentController = require('../controllers/documentController');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '_');
    cb(null, `${Date.now()}_${base}${ext}`);
  }
});

const upload = multer({ storage });

// FIX: Use verifyToken instead of auth
router.post('/', verifyToken, upload.single('file'), (req, res) => DocumentController.upload(req, res));

// Preview document file (Public or Protected? Usually protected, but preview might be public if obfuscated)
// Keeping it public as per original code, but often this should be protected too.
router.get('/preview/:filename', (req, res) => DocumentController.preview(req, res));

// FIX: Use verifyToken instead of auth
router.delete('/:id', verifyToken, (req, res) => DocumentController.remove(req, res));

module.exports = router;