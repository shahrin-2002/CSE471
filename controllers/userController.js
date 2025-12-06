const User = require('../models/User');
const Document = require('../models/Document');

class UserController {
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id).lean();
      if (!user) return res.status(404).json({ error: 'User Not Found' });

      const documents = await Document.find({ user: req.user.id }).lean();
      res.json({ user, documents });
    } catch (err) {
      res.status(500).json({ error: 'Error fetching profile' });
    }
  }

  async updateProfile(req, res) {
    try {
      const updates = req.body;
      await User.findByIdAndUpdate(req.user.id, updates);
      const updated = await User.findById(req.user.id).lean();
      res.json({ message: 'Profile updated', user: updated });
    } catch (err) {
      res.status(500).json({ error: 'Error updating profile' });
    }
  }
}

module.exports = new UserController();


