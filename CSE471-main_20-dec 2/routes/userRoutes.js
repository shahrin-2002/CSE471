const router = require('express').Router();
// FIX: Destructure verifyToken from the auth middleware
const { verifyToken } = require('../middleware/auth');
const UserController = require('../controllers/userController');
const User = require('../models/User');

// FIX: Use verifyToken instead of auth
router.get('/me', verifyToken, (req, res) => UserController.getProfile(req, res));
router.put('/me', verifyToken, (req, res) => UserController.updateProfile(req, res));

// GET /api/users/search - Search users (for patient reviews)
router.get('/search', async (req, res) => {
  try {
    const { search, role, limit = 10, offset = 0 } = req.query;

    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.role = role;
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('name email role phone')
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .sort({ name: 1 })
      .lean();

    res.status(200).json({
      message: 'Users retrieved successfully',
      total,
      count: users.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
      data: users
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

module.exports = router;
