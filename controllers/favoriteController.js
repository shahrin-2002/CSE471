const Favorite = require('../models/Favorite');

// POST /api/favorites/toggle
exports.toggleFavorite = async (req, res) => {
  try {
    const { targetType, targetId } = req.body;
    const userId = req.user.id;

    if (!targetType || !targetId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existing = await Favorite.findOne({ userId, targetType, targetId });
    if (existing) {
      await Favorite.deleteOne({ _id: existing._id });
      return res.json({ favorited: false });
    }

    await Favorite.create({ userId, targetType, targetId });
    return res.json({ favorited: true });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Failed to update favorite' });
  }
};

// GET /api/favorites/mine
exports.listFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { targetType } = req.query;

    const query = { userId };
    if (targetType) query.targetType = targetType;

    const favorites = await Favorite.find(query).populate('targetId', 'name');
    res.json({ favorites });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load favorites' });
  }
};


