const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateToken } = require('../middleware/auth');

// Create review
router.post('/:recipeId', authenticateToken, reviewController.createReview);

// Delete review
router.delete('/:reviewId', authenticateToken, reviewController.deleteReview);

// Get reviews
router.get('/recipe/:recipeId', reviewController.getRecipeReviews);
router.get('/recipe/:recipeId/stats', reviewController.getRecipeStats);
router.get('/user/reviews', authenticateToken, reviewController.getUserReviews);

module.exports = router;
