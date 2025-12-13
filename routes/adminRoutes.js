const router = require('express').Router();
// FIX: Import both functions specifically
const { verifyToken, checkRole } = require('../middleware/auth');
const AdminController = require('../controllers/adminController');

// FIX: Use verifyToken and checkRole directly
router.get('/documents', verifyToken, checkRole('Hospital_Admin'), (req, res) => AdminController.listPending(req, res));
router.patch('/documents/:id/verify', verifyToken, checkRole('Hospital_Admin'), (req, res) => AdminController.verifyDocument(req, res));
router.patch('/documents/:id/reject', verifyToken, checkRole('Hospital_Admin'), (req, res) => AdminController.rejectDocument(req, res));
router.patch('/users/:id/lock', verifyToken, checkRole('Hospital_Admin'), (req, res) => AdminController.lockUser(req, res));

module.exports = router;