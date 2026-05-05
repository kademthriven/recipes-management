const pool = require('../config/database');
const AppError = require('../utils/appError');
const socialService = require('./socialService');

class FavoriteService {
  async addFavorite(userId, recipeId) {
    try {
      // Check if recipe exists
      const recipeResult = await pool.query('SELECT id FROM recipes WHERE id = $1', [recipeId]);

      if (recipeResult.rows.length === 0) {
        throw new AppError('Recipe not found', 404);
      }

      const result = await pool.query(
        'INSERT INTO favorites (user_id, recipe_id) VALUES ($1, $2) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)',
        [userId, recipeId]
      );

      const favorite = await pool.query('SELECT * FROM favorites WHERE id = $1', [result.insertId]);

      if (result.affectedRows === 1) {
        await socialService.addActivityForFollowers(userId, 'recipe_favorited', recipeId);
      }

      return favorite.rows[0];
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        throw new AppError('Recipe already in favorites', 409);
      }
      throw error;
    }
  }

  async removeFavorite(userId, recipeId) {
    try {
      const result = await pool.query(
        'DELETE FROM favorites WHERE user_id = $1 AND recipe_id = $2',
        [userId, recipeId]
      );

      if (result.rowCount === 0) {
        throw new AppError('Favorite not found', 404);
      }

      return { message: 'Recipe removed from favorites' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw error;
    }
  }

  async getUserFavorites(userId, limit = 10, offset = 0) {
    try {
      const result = await pool.query(
        'SELECT r.id, r.title, r.description, r.featured_image_url, r.cooking_time, f.created_at FROM recipes r INNER JOIN favorites f ON r.id = f.recipe_id WHERE f.user_id = $1 AND r.is_published = TRUE ORDER BY f.created_at DESC LIMIT $2 OFFSET $3',
        [userId, limit, offset]
      );

      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  async isFavorite(userId, recipeId) {
    try {
      const result = await pool.query(
        'SELECT id FROM favorites WHERE user_id = $1 AND recipe_id = $2',
        [userId, recipeId]
      );

      return result.rows.length > 0;
    } catch (error) {
      throw error;
    }
  }

  async createCollection(userId, name, description, isPublic = false) {
    try {
      const result = await pool.query(
        'INSERT INTO collections (user_id, name, description, is_public) VALUES ($1, $2, $3, $4)',
        [userId, name, description, isPublic]
      );

      const collection = await pool.query('SELECT * FROM collections WHERE id = $1', [result.insertId]);

      return collection.rows[0];
    } catch (error) {
      throw error;
    }
  }

  async updateCollection(collectionId, userId, updateData) {
    try {
      // Check if collection exists and belongs to user
      const existingCollection = await pool.query(
        'SELECT id, user_id FROM collections WHERE id = $1',
        [collectionId]
      );

      if (existingCollection.rows.length === 0) {
        throw new AppError('Collection not found', 404);
      }

      if (String(existingCollection.rows[0].user_id) !== String(userId)) {
        throw new AppError('You do not have permission to update this collection', 403);
      }

      const fields = [];
      const values = [];
      let paramCount = 1;

      if (updateData.name) {
        fields.push(`name = $${paramCount}`);
        values.push(updateData.name);
        paramCount++;
      }
      if (updateData.description !== undefined) {
        fields.push(`description = $${paramCount}`);
        values.push(updateData.description);
        paramCount++;
      }
      if (updateData.is_public !== undefined) {
        fields.push(`is_public = $${paramCount}`);
        values.push(updateData.is_public);
        paramCount++;
      }

      fields.push(`updated_at = $${paramCount}`);
      values.push(new Date());
      paramCount++;

      values.push(collectionId);

      const query = `UPDATE collections SET ${fields.join(', ')} WHERE id = $${paramCount}`;

      await pool.query(query, values);

      const result = await pool.query('SELECT * FROM collections WHERE id = $1', [collectionId]);

      return result.rows[0];
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw error;
    }
  }

  async deleteCollection(collectionId, userId) {
    try {
      // Check if collection exists and belongs to user
      const existingCollection = await pool.query(
        'SELECT id, user_id FROM collections WHERE id = $1',
        [collectionId]
      );

      if (existingCollection.rows.length === 0) {
        throw new AppError('Collection not found', 404);
      }

      if (String(existingCollection.rows[0].user_id) !== String(userId)) {
        throw new AppError('You do not have permission to delete this collection', 403);
      }

      await pool.query('DELETE FROM collections WHERE id = $1', [collectionId]);

      return { message: 'Collection deleted successfully' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw error;
    }
  }

  async getCollections(userId, limit = 10, offset = 0) {
    try {
      const result = await pool.query(
        'SELECT c.id, c.name, c.description, c.is_public, COUNT(cr.id) as recipe_count FROM collections c LEFT JOIN collection_recipes cr ON c.id = cr.collection_id WHERE c.user_id = $1 GROUP BY c.id, c.name, c.description, c.is_public, c.created_at ORDER BY c.created_at DESC LIMIT $2 OFFSET $3',
        [userId, limit, offset]
      );

      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  async getCollectionRecipes(collectionId, userId, limit = 10, offset = 0) {
    try {
      const collection = await pool.query(
        'SELECT id, user_id FROM collections WHERE id = $1',
        [collectionId]
      );

      if (collection.rows.length === 0) {
        throw new AppError('Collection not found', 404);
      }

      if (String(collection.rows[0].user_id) !== String(userId)) {
        throw new AppError('You do not have permission to view this collection', 403);
      }

      const result = await pool.query(
        'SELECT r.id, r.title, r.description, r.featured_image_url FROM recipes r INNER JOIN collection_recipes cr ON r.id = cr.recipe_id WHERE cr.collection_id = $1 LIMIT $2 OFFSET $3',
        [collectionId, limit, offset]
      );

      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  async addRecipeToCollection(collectionId, recipeId, userId) {
    try {
      // Verify collection belongs to user
      const collection = await pool.query(
        'SELECT id, user_id FROM collections WHERE id = $1',
        [collectionId]
      );

      if (collection.rows.length === 0) {
        throw new AppError('Collection not found', 404);
      }

      if (String(collection.rows[0].user_id) !== String(userId)) {
        throw new AppError('You do not have permission to add recipes to this collection', 403);
      }

      const recipe = await pool.query('SELECT id FROM recipes WHERE id = $1', [recipeId]);

      if (recipe.rows.length === 0) {
        throw new AppError('Recipe not found', 404);
      }

      const favorite = await pool.query(
        'SELECT id FROM favorites WHERE user_id = $1 AND recipe_id = $2',
        [userId, recipeId]
      );

      if (favorite.rows.length === 0) {
        throw new AppError('Add this recipe to favorites before adding it to a collection', 400);
      }

      const result = await pool.query(
        'INSERT INTO collection_recipes (collection_id, recipe_id) VALUES ($1, $2) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)',
        [collectionId, recipeId]
      );

      const collectionRecipe = await pool.query('SELECT * FROM collection_recipes WHERE id = $1', [result.insertId]);

      return collectionRecipe.rows[0];
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw error;
    }
  }

  async removeRecipeFromCollection(collectionId, recipeId, userId) {
    try {
      // Verify collection belongs to user
      const collection = await pool.query(
        'SELECT id, user_id FROM collections WHERE id = $1',
        [collectionId]
      );

      if (collection.rows.length === 0) {
        throw new AppError('Collection not found', 404);
      }

      if (String(collection.rows[0].user_id) !== String(userId)) {
        throw new AppError('You do not have permission to remove recipes from this collection', 403);
      }

      const result = await pool.query(
        'DELETE FROM collection_recipes WHERE collection_id = $1 AND recipe_id = $2',
        [collectionId, recipeId]
      );

      if (result.rowCount === 0) {
        throw new AppError('Recipe not in collection', 404);
      }

      return { message: 'Recipe removed from collection' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw error;
    }
  }
}

module.exports = new FavoriteService();
