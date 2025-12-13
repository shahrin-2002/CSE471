const router = require('express').Router();
// FIX: Destructure verifyToken from the auth middleware
const { verifyToken } = require('../middleware/auth');
const UserController = require('../controllers/userController');

// FIX: Use verifyToken instead of auth
router.get('/me', verifyToken, (req, res) => UserController.getProfile(req, res));
router.put('/me', verifyToken, (req, res) => UserController.updateProfile(req, res));

module.exports = router;
