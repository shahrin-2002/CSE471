const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const lockedGuard = require('../middleware/lock');
const userController = require('../controllers/user.controller');

// Get logged-in user's profile
router.get('/me', verifyToken, (req, res) => userController.getProfile(req, res));

// Update logged-in user's profile (blocked if locked)
router.put('/me', verifyToken, lockedGuard, (req, res) => userController.updateProfile(req, res));

module.exports = router;
