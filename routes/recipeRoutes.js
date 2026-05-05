const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipeController');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.get('/', recipeController.searchRecipes);
router.get('/search', recipeController.searchRecipes);
router.get('/options', recipeController.getRecipeOptions);
router.get('/trending', recipeController.getTrendingRecipes);
router.get('/category/:categoryId', recipeController.getRecipesByCategory);
router.get('/:id', recipeController.getRecipe);

// Protected routes
router.post('/', authenticateToken, upload.single('featured_image'), recipeController.createRecipe);
router.put('/:id', authenticateToken, upload.single('featured_image'), recipeController.updateRecipe);
router.delete('/:id', authenticateToken, recipeController.deleteRecipe);
router.post('/:recipeId/images', authenticateToken, upload.single('image'), recipeController.addRecipeImage);

module.exports = router;
