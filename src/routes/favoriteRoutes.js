const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { authenticateToken } = require('../middleware/auth');

// Collections routes
router.post('/collections', authenticateToken, favoriteController.createCollection);
router.put('/collections/:collectionId', authenticateToken, favoriteController.updateCollection);
router.delete('/collections/:collectionId', authenticateToken, favoriteController.deleteCollection);
router.get('/collections', authenticateToken, favoriteController.getCollections);
router.get('/collections/:collectionId/recipes', authenticateToken, favoriteController.getCollectionRecipes);

// Collection recipes routes
router.post('/collections/:collectionId/recipes/:recipeId', authenticateToken, favoriteController.addRecipeToCollection);
router.delete('/collections/:collectionId/recipes/:recipeId', authenticateToken, favoriteController.removeRecipeFromCollection);

// Favorites routes
router.post('/:recipeId', authenticateToken, favoriteController.addFavorite);
router.delete('/:recipeId', authenticateToken, favoriteController.removeFavorite);
router.get('/check/:recipeId', authenticateToken, favoriteController.isFavorite);
router.get('/', authenticateToken, favoriteController.getUserFavorites);

module.exports = router;
