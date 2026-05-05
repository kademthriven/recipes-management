const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);

// Protected routes
router.get('/profile', authenticateToken, userController.getProfile);
router.put('/profile', authenticateToken, userController.updateProfile);
router.put('/profile/picture', authenticateToken, upload.single('profile_picture'), userController.updateProfilePicture);
router.put('/change-password', authenticateToken, userController.changePassword);

// Get user recipes and favorites
router.get('/recipes', authenticateToken, userController.getUserRecipes);
router.get('/recipes/:userId', userController.getUserRecipes);
router.get('/favorites', authenticateToken, userController.getUserFavorites);
router.get('/:userId/favorites', userController.getUserFavoritesById);

module.exports = router;
