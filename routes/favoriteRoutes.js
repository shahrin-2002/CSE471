const express = require('express');
const { verifyToken } = require('../middleware/auth');
const favoriteController = require('../controllers/favoriteController');

const router = express.Router();

router.post('/toggle', verifyToken, favoriteController.toggleFavorite);
router.get('/mine', verifyToken, favoriteController.listFavorites);

module.exports = router;


