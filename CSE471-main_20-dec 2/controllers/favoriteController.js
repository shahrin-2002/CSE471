const Favorite = require('../models/Favorite');
const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');

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

    const favorites = await Favorite.find(query).lean();
    
    // Manually populate based on targetType
    const populatedFavorites = await Promise.all(
      favorites.map(async (favorite) => {
        let targetData = null;
        
        if (favorite.targetType === 'doctor') {
          targetData = await Doctor.findById(favorite.targetId).lean();
        } else if (favorite.targetType === 'hospital') {
          targetData = await Hospital.findById(favorite.targetId).lean();
        }
        
        return {
          ...favorite,
          targetId: targetData
        };
      })
    );
    
    res.json({ favorites: populatedFavorites });
  } catch (err) {
    console.error('Error loading favorites:', err);
    res.status(500).json({ error: err.message || 'Failed to load favorites' });
  }
};

// GET /api/favorites/check/:targetType/:targetId
exports.checkFavorite = async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    const userId = req.user.id;

    const existing = await Favorite.findOne({ userId, targetType, targetId });
    res.json({ isFavorited: !!existing });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to check favorite status' });
  }
};


