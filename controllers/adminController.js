const adminService = require('../services/adminService');
const AppError = require('../utils/appError');

function pagination(query) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const offset = (page - 1) * limit;

  return { limit, offset };
}

class AdminController {
  async getAllUsers(req, res, next) {
    try {
      const { limit, offset } = pagination(req.query);

      const users = await adminService.getAllUsers(limit, offset);

      res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserStats(req, res, next) {
    try {
      const stats = await adminService.getUserStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  async banUser(req, res, next) {
    try {
      const { userId } = req.params;
      const { reason } = req.body || {};

      const user = await adminService.banUser(userId, req.user.id, reason);

      res.status(200).json({
        success: true,
        message: 'User banned successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async unbanUser(req, res, next) {
    try {
      const { userId } = req.params;

      const user = await adminService.unbanUser(userId);

      res.status(200).json({
        success: true,
        message: 'User unbanned successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyUser(req, res, next) {
    try {
      const { userId } = req.params;

      const user = await adminService.verifyUser(userId);

      res.status(200).json({
        success: true,
        message: 'User verified successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllRecipes(req, res, next) {
    try {
      const { limit, offset } = pagination(req.query);

      const recipes = await adminService.getAllRecipes(limit, offset);

      res.status(200).json({
        success: true,
        data: recipes,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecipeStats(req, res, next) {
    try {
      const stats = await adminService.getRecipeStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecipe(req, res, next) {
    try {
      const { recipeId } = req.params;

      const recipe = await adminService.getRecipeById(recipeId);

      res.status(200).json({
        success: true,
        data: recipe,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteRecipe(req, res, next) {
    try {
      const { recipeId } = req.params;

      await adminService.deleteRecipe(recipeId);

      res.status(200).json({
        success: true,
        message: 'Recipe deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async publishRecipe(req, res, next) {
    try {
      const { recipeId } = req.params;

      const recipe = await adminService.publishRecipe(recipeId);

      res.status(200).json({
        success: true,
        message: 'Recipe published successfully',
        data: recipe,
      });
    } catch (error) {
      next(error);
    }
  }

  async unpublishRecipe(req, res, next) {
    try {
      const { recipeId } = req.params;

      const recipe = await adminService.unpublishRecipe(recipeId);

      res.status(200).json({
        success: true,
        message: 'Recipe unpublished successfully',
        data: recipe,
      });
    } catch (error) {
      next(error);
    }
  }

  async createCategory(req, res, next) {
    try {
      const { name, description } = req.body;

      if (!name) {
        return next(new AppError('Category name is required', 400));
      }

      const category = await adminService.createCategory(name, description);

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async createDifficultyLevel(req, res, next) {
    try {
      const { name, description } = req.body;

      if (!name) {
        return next(new AppError('Difficulty level name is required', 400));
      }

      const level = await adminService.createDifficultyLevel(name, description);

      res.status(201).json({
        success: true,
        message: 'Difficulty level created successfully',
        data: level,
      });
    } catch (error) {
      next(error);
    }
  }

  async createDietaryPreference(req, res, next) {
    try {
      const { name, description } = req.body;

      if (!name) {
        return next(new AppError('Dietary preference name is required', 400));
      }

      const preference = await adminService.createDietaryPreference(name, description);

      res.status(201).json({
        success: true,
        message: 'Dietary preference created successfully',
        data: preference,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPlatformStats(req, res, next) {
    try {
      const stats = await adminService.getPlatformStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();
