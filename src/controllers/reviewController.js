const reviewService = require('../services/reviewService');
const { reviewSchema } = require('../validators/schemas');
const AppError = require('../utils/appError');

function pagination(query) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const offset = (page - 1) * limit;

  return { limit, offset };
}

class ReviewController {
  async createReview(req, res, next) {
    try {
      const { recipeId } = req.params;
      const { error, value } = reviewSchema.validate(req.body);

      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }

      const review = await reviewService.createReview(recipeId, req.user.id, value.rating, value.comment);

      res.status(201).json({
        success: true,
        message: 'Review created successfully',
        data: review,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteReview(req, res, next) {
    try {
      const { reviewId } = req.params;

      await reviewService.deleteReview(reviewId, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Review deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecipeReviews(req, res, next) {
    try {
      const { recipeId } = req.params;
      const { limit, offset } = pagination(req.query);

      const reviews = await reviewService.getRecipeReviews(recipeId, limit, offset);

      res.status(200).json({
        success: true,
        data: reviews,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecipeStats(req, res, next) {
    try {
      const { recipeId } = req.params;

      const stats = await reviewService.getRecipeStats(recipeId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserReviews(req, res, next) {
    try {
      const { limit, offset } = pagination(req.query);

      const reviews = await reviewService.getUserReviews(req.user.id, limit, offset);

      res.status(200).json({
        success: true,
        data: reviews,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReviewController();
