const favoriteService = require('../services/favoriteService');
const { collectionSchema } = require('../validators/schemas');
const AppError = require('../utils/appError');

class FavoriteController {
  async addFavorite(req, res, next) {
    try {
      const { recipeId } = req.params;

      const favorite = await favoriteService.addFavorite(req.user.id, recipeId);

      res.status(201).json({
        success: true,
        message: 'Recipe added to favorites',
        data: favorite,
      });
    } catch (error) {
      next(error);
    }
  }

  async removeFavorite(req, res, next) {
    try {
      const { recipeId } = req.params;

      await favoriteService.removeFavorite(req.user.id, recipeId);

      res.status(200).json({
        success: true,
        message: 'Recipe removed from favorites',
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserFavorites(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const favorites = await favoriteService.getUserFavorites(req.user.id, limit, offset);

      res.status(200).json({
        success: true,
        data: favorites,
      });
    } catch (error) {
      next(error);
    }
  }

  async isFavorite(req, res, next) {
    try {
      const { recipeId } = req.params;

      const isFavorite = await favoriteService.isFavorite(req.user.id, recipeId);

      res.status(200).json({
        success: true,
        data: { is_favorite: isFavorite },
      });
    } catch (error) {
      next(error);
    }
  }

  async createCollection(req, res, next) {
    try {
      const { error, value } = collectionSchema.validate(req.body);

      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }

      const collection = await favoriteService.createCollection(
        req.user.id,
        value.name,
        value.description,
        value.is_public
      );

      res.status(201).json({
        success: true,
        message: 'Collection created successfully',
        data: collection,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCollection(req, res, next) {
    try {
      const { collectionId } = req.params;
      const { error, value } = collectionSchema.validate(req.body);

      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }

      const collection = await favoriteService.updateCollection(collectionId, req.user.id, value);

      res.status(200).json({
        success: true,
        message: 'Collection updated successfully',
        data: collection,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCollection(req, res, next) {
    try {
      const { collectionId } = req.params;

      await favoriteService.deleteCollection(collectionId, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Collection deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getCollections(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const collections = await favoriteService.getCollections(req.user.id, limit, offset);

      res.status(200).json({
        success: true,
        data: collections,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCollectionRecipes(req, res, next) {
    try {
      const { collectionId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const recipes = await favoriteService.getCollectionRecipes(collectionId, req.user.id, limit, offset);

      res.status(200).json({
        success: true,
        data: recipes,
      });
    } catch (error) {
      next(error);
    }
  }

  async addRecipeToCollection(req, res, next) {
    try {
      const { collectionId, recipeId } = req.params;

      const result = await favoriteService.addRecipeToCollection(collectionId, recipeId, req.user.id);

      res.status(201).json({
        success: true,
        message: 'Recipe added to collection',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async removeRecipeFromCollection(req, res, next) {
    try {
      const { collectionId, recipeId } = req.params;

      await favoriteService.removeRecipeFromCollection(collectionId, recipeId, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Recipe removed from collection',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FavoriteController();
