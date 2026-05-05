const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, authenticateAdmin } = require('../middleware/auth');

// User management routes
router.get('/users', authenticateToken, authenticateAdmin, adminController.getAllUsers);
router.get('/users/stats', authenticateToken, authenticateAdmin, adminController.getUserStats);
router.post('/users/:userId/ban', authenticateToken, authenticateAdmin, adminController.banUser);
router.post('/users/:userId/unban', authenticateToken, authenticateAdmin, adminController.unbanUser);
router.post('/users/:userId/approve', authenticateToken, authenticateAdmin, adminController.verifyUser);
router.post('/users/:userId/verify', authenticateToken, authenticateAdmin, adminController.verifyUser);

// Recipe management routes
router.get('/recipes', authenticateToken, authenticateAdmin, adminController.getAllRecipes);
router.get('/recipes/stats', authenticateToken, authenticateAdmin, adminController.getRecipeStats);
router.get('/recipes/:recipeId', authenticateToken, authenticateAdmin, adminController.getRecipe);
router.delete('/recipes/:recipeId', authenticateToken, authenticateAdmin, adminController.deleteRecipe);
router.post('/recipes/:recipeId/publish', authenticateToken, authenticateAdmin, adminController.publishRecipe);
router.post('/recipes/:recipeId/unpublish', authenticateToken, authenticateAdmin, adminController.unpublishRecipe);

// Category management routes
router.post('/categories', authenticateToken, authenticateAdmin, adminController.createCategory);

// Difficulty level management routes
router.post('/difficulty-levels', authenticateToken, authenticateAdmin, adminController.createDifficultyLevel);

// Dietary preference management routes
router.post('/dietary-preferences', authenticateToken, authenticateAdmin, adminController.createDietaryPreference);

// Platform stats route
router.get('/stats', authenticateToken, authenticateAdmin, adminController.getPlatformStats);

module.exports = router;
