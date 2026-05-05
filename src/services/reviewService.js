const pool = require('../config/database');
const AppError = require('../utils/appError');
const socialService = require('./socialService');

class ReviewService {
  async createReview(recipeId, userId, rating, comment) {
    try {
      // Check if recipe exists
      const recipeResult = await pool.query('SELECT id FROM recipes WHERE id = $1', [recipeId]);

      if (recipeResult.rows.length === 0) {
        throw new AppError('Recipe not found', 404);
      }

      const result = await pool.query(
        'INSERT INTO reviews (recipe_id, user_id, rating, comment) VALUES ($1, $2, $3, $4) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), rating = VALUES(rating), comment = VALUES(comment), updated_at = CURRENT_TIMESTAMP',
        [recipeId, userId, rating, comment || null]
      );

      const review = await pool.query('SELECT * FROM reviews WHERE id = $1', [result.insertId]);

      await socialService.addActivityForFollowers(userId, 'recipe_reviewed', recipeId);

      return review.rows[0];
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw error;
    }
  }

  async deleteReview(reviewId, userId) {
    try {
      // Check if review exists and belongs to user
      const existingReview = await pool.query(
        'SELECT id, user_id FROM reviews WHERE id = $1',
        [reviewId]
      );

      if (existingReview.rows.length === 0) {
        throw new AppError('Review not found', 404);
      }

      if (String(existingReview.rows[0].user_id) !== String(userId)) {
        throw new AppError('You do not have permission to delete this review', 403);
      }

      await pool.query('DELETE FROM reviews WHERE id = $1', [reviewId]);

      return { message: 'Review deleted successfully' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw error;
    }
  }

  async getRecipeReviews(recipeId, limit = 10, offset = 0) {
    try {
      const result = await pool.query(
        'SELECT r.id, r.rating, r.comment, r.created_at, r.updated_at, u.id as user_id, u.username, u.first_name, u.last_name, u.profile_picture_url FROM reviews r INNER JOIN users u ON r.user_id = u.id WHERE r.recipe_id = $1 ORDER BY r.created_at DESC LIMIT $2 OFFSET $3',
        [recipeId, Number(limit), Number(offset)]
      );

      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  async getRecipeStats(recipeId) {
    try {
      const result = await pool.query(
        'SELECT COUNT(*) as total_reviews, COALESCE(AVG(rating), 0) as average_rating, COALESCE(SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END), 0) as five_star, COALESCE(SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END), 0) as four_star, COALESCE(SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END), 0) as three_star, COALESCE(SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END), 0) as two_star, COALESCE(SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END), 0) as one_star FROM reviews WHERE recipe_id = $1',
        [recipeId]
      );

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  async getUserReviews(userId, limit = 10, offset = 0) {
    try {
      const result = await pool.query(
        'SELECT r.id, r.rating, r.comment, r.created_at, rc.id as recipe_id, rc.title as recipe_title, rc.featured_image_url FROM reviews r INNER JOIN recipes rc ON r.recipe_id = rc.id WHERE r.user_id = $1 ORDER BY r.created_at DESC LIMIT $2 OFFSET $3',
        [userId, Number(limit), Number(offset)]
      );

      return result.rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ReviewService();
