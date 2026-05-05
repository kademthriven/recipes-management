const recipeService = require('../services/recipeService');
const { uploadToS3 } = require('../utils/s3');
const { recipeCreateSchema, recipeUpdateSchema, searchFilterSchema } = require('../validators/schemas');
const AppError = require('../utils/appError');

function normalizeRecipeBody(body) {
  const normalized = { ...body };

  Object.keys(normalized).forEach(key => {
    if (normalized[key] === '') {
      delete normalized[key];
    }
  });

  if (typeof normalized.dietary_preferences === 'string') {
    normalized.dietary_preferences = normalized.dietary_preferences
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
  }

  return normalized;
}

class RecipeController {
  async createRecipe(req, res, next) {
    try {
      const { error, value } = recipeCreateSchema.validate(normalizeRecipeBody(req.body));

      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }

      let imageUrl = null;
      if (req.file) {
        if (!req.file.size || !req.file.buffer) {
          return next(new AppError('Please choose a valid image file', 400));
        }
        imageUrl = await uploadToS3(req.file, 'recipes');
      }

      const recipe = await recipeService.createRecipe(req.user.id, value, imageUrl);

      res.status(201).json({
        success: true,
        message: 'Recipe created successfully',
        data: recipe,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecipe(req, res, next) {
    try {
      const { id } = req.params;

      const recipe = await recipeService.getRecipeById(id);

      res.status(200).json({
        success: true,
        data: recipe,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateRecipe(req, res, next) {
    try {
      const { id } = req.params;
      const { error, value } = recipeUpdateSchema.validate(normalizeRecipeBody(req.body));

      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }

      if (req.file) {
        if (!req.file.size || !req.file.buffer) {
          return next(new AppError('Please choose a valid image file', 400));
        }
        value.featured_image_url = await uploadToS3(req.file, 'recipes');
      }

      const recipe = await recipeService.updateRecipe(id, req.user.id, value);

      res.status(200).json({
        success: true,
        message: 'Recipe updated successfully',
        data: recipe,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteRecipe(req, res, next) {
    try {
      const { id } = req.params;

      await recipeService.deleteRecipe(id, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Recipe deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async searchRecipes(req, res, next) {
    try {
      const { error, value } = searchFilterSchema.validate(req.query);

      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }

      const limit = value.limit || 10;
      const offset = (value.page - 1) * limit || 0;

      const recipes = await recipeService.searchRecipes(value, limit, offset);

      res.status(200).json({
        success: true,
        data: recipes,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecipeOptions(req, res, next) {
    try {
      const options = await recipeService.getRecipeOptions();

      res.status(200).json({
        success: true,
        data: options,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTrendingRecipes(req, res, next) {
    try {
      const { limit = 10 } = req.query;

      const recipes = await recipeService.getTrendingRecipes(limit);

      res.status(200).json({
        success: true,
        data: recipes,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecipesByCategory(req, res, next) {
    try {
      const { categoryId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const recipes = await recipeService.getRecipesByCategory(categoryId, limit, offset);

      res.status(200).json({
        success: true,
        data: recipes,
      });
    } catch (error) {
      next(error);
    }
  }

  async addRecipeImage(req, res, next) {
    try {
      const { recipeId } = req.params;

      if (!req.file) {
        return next(new AppError('No file uploaded', 400));
      }
      if (!req.file.size || !req.file.buffer) {
        return next(new AppError('Please choose a valid image file', 400));
      }

      const imageUrl = await uploadToS3(req.file, 'recipes');
      const image = await recipeService.addRecipeImage(recipeId, imageUrl);

      res.status(201).json({
        success: true,
        message: 'Image added successfully',
        data: image,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RecipeController();
