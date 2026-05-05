const pool = require('../config/database');
const AppError = require('../utils/appError');
const socialService = require('./socialService');

class RecipeService {
  async createRecipe(userId, recipeData, imageUrl) {
    try {
      const result = await pool.query(
        'INSERT INTO recipes (user_id, title, description, ingredients, instructions, cooking_time, preparation_time, food_type, servings, difficulty_level_id, category_id, featured_image_url, is_published) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)',
        [
          userId,
          recipeData.title,
          recipeData.description,
          recipeData.ingredients,
          recipeData.instructions,
          recipeData.cooking_time || null,
          recipeData.preparation_time || null,
          recipeData.food_type || 'veg',
          recipeData.servings || null,
          recipeData.difficulty_level_id || null,
          recipeData.category_id || null,
          imageUrl || null,
          true,
        ]
      );

      const recipeResult = await pool.query('SELECT * FROM recipes WHERE id = $1', [result.insertId]);
      const recipe = recipeResult.rows[0];

      // Add dietary preferences if provided
      if (recipeData.dietary_preferences && recipeData.dietary_preferences.length > 0) {
        for (const prefId of recipeData.dietary_preferences) {
          await pool.query(
            'INSERT IGNORE INTO recipe_dietary_preferences (recipe_id, dietary_preference_id) VALUES ($1, $2)',
            [recipe.id, prefId]
          );
        }
      }

      await socialService.addActivityForFollowers(userId, 'recipe_created', recipe.id);

      return recipe;
    } catch (error) {
      throw error;
    }
  }

  async getRecipeById(recipeId) {
    try {
      const recipeResult = await pool.query(
        'SELECT r.*, u.username, u.id as user_id, c.name as category_name, d.name as difficulty_name FROM recipes r LEFT JOIN users u ON r.user_id = u.id LEFT JOIN categories c ON r.category_id = c.id LEFT JOIN difficulty_levels d ON r.difficulty_level_id = d.id WHERE r.id = $1 AND r.is_published = TRUE',
        [recipeId]
      );

      if (recipeResult.rows.length === 0) {
        throw new AppError('Recipe not found', 404);
      }

      const recipe = recipeResult.rows[0];

      // Increment view count
      await pool.query('UPDATE recipes SET view_count = view_count + 1 WHERE id = $1', [recipeId]);

      // Get dietary preferences
      const dietaryResult = await pool.query(
        'SELECT dp.id, dp.name FROM dietary_preferences dp INNER JOIN recipe_dietary_preferences rdp ON dp.id = rdp.dietary_preference_id WHERE rdp.recipe_id = $1',
        [recipeId]
      );

      // Get images
      const imagesResult = await pool.query(
        'SELECT id, image_url FROM recipe_images WHERE recipe_id = $1',
        [recipeId]
      );

      // Get reviews
      const reviewsResult = await pool.query(
        'SELECT r.id, r.rating, r.comment, r.created_at, r.user_id, u.username, u.profile_picture_url FROM reviews r INNER JOIN users u ON r.user_id = u.id WHERE r.recipe_id = $1 ORDER BY r.created_at DESC LIMIT 5',
        [recipeId]
      );

      recipe.dietary_preferences = dietaryResult.rows;
      recipe.images = imagesResult.rows;
      recipe.recent_reviews = reviewsResult.rows;

      return recipe;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw error;
    }
  }

  async updateRecipe(recipeId, userId, updateData) {
    try {
      // Check if recipe exists and belongs to user
      const existingRecipe = await pool.query(
        'SELECT id, user_id FROM recipes WHERE id = $1',
        [recipeId]
      );

      if (existingRecipe.rows.length === 0) {
        throw new AppError('Recipe not found', 404);
      }

      if (String(existingRecipe.rows[0].user_id) !== String(userId)) {
        throw new AppError('You do not have permission to update this recipe', 403);
      }

      const fields = [];
      const values = [];
      let paramCount = 1;

      if (updateData.title) {
        fields.push(`title = $${paramCount}`);
        values.push(updateData.title);
        paramCount++;
      }
      if (updateData.description) {
        fields.push(`description = $${paramCount}`);
        values.push(updateData.description);
        paramCount++;
      }
      if (updateData.ingredients) {
        fields.push(`ingredients = $${paramCount}`);
        values.push(updateData.ingredients);
        paramCount++;
      }
      if (updateData.instructions) {
        fields.push(`instructions = $${paramCount}`);
        values.push(updateData.instructions);
        paramCount++;
      }
      if (updateData.cooking_time !== undefined) {
        fields.push(`cooking_time = $${paramCount}`);
        values.push(updateData.cooking_time);
        paramCount++;
      }
      if (updateData.preparation_time !== undefined) {
        fields.push(`preparation_time = $${paramCount}`);
        values.push(updateData.preparation_time);
        paramCount++;
      }
      if (updateData.food_type !== undefined) {
        fields.push(`food_type = $${paramCount}`);
        values.push(updateData.food_type);
        paramCount++;
      }
      if (updateData.servings) {
        fields.push(`servings = $${paramCount}`);
        values.push(updateData.servings);
        paramCount++;
      }
      if (updateData.difficulty_level_id) {
        fields.push(`difficulty_level_id = $${paramCount}`);
        values.push(updateData.difficulty_level_id);
        paramCount++;
      }
      if (updateData.category_id) {
        fields.push(`category_id = $${paramCount}`);
        values.push(updateData.category_id);
        paramCount++;
      }
      if (updateData.featured_image_url !== undefined) {
        fields.push(`featured_image_url = $${paramCount}`);
        values.push(updateData.featured_image_url);
        paramCount++;
      }

      fields.push(`updated_at = $${paramCount}`);
      values.push(new Date());
      paramCount++;

      values.push(recipeId);

      const query = `UPDATE recipes SET ${fields.join(', ')} WHERE id = $${paramCount}`;

      await pool.query(query, values);

      // Update dietary preferences if provided
      if (updateData.dietary_preferences) {
        await pool.query('DELETE FROM recipe_dietary_preferences WHERE recipe_id = $1', [recipeId]);

        for (const prefId of updateData.dietary_preferences) {
          await pool.query(
            'INSERT IGNORE INTO recipe_dietary_preferences (recipe_id, dietary_preference_id) VALUES ($1, $2)',
            [recipeId, prefId]
          );
        }
      }

      const result = await pool.query('SELECT * FROM recipes WHERE id = $1', [recipeId]);

      return result.rows[0];
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw error;
    }
  }

  async deleteRecipe(recipeId, userId) {
    try {
      // Check if recipe exists and belongs to user
      const existingRecipe = await pool.query(
        'SELECT id, user_id FROM recipes WHERE id = $1',
        [recipeId]
      );

      if (existingRecipe.rows.length === 0) {
        throw new AppError('Recipe not found', 404);
      }

      if (String(existingRecipe.rows[0].user_id) !== String(userId)) {
        throw new AppError('You do not have permission to delete this recipe', 403);
      }

      await pool.query('DELETE FROM recipes WHERE id = $1', [recipeId]);

      return { message: 'Recipe deleted successfully' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw error;
    }
  }

  async searchRecipes(filters, limit = 10, offset = 0) {
    try {
      let query = 'SELECT r.id, r.title, r.description, r.featured_image_url, r.cooking_time, r.preparation_time, r.food_type, r.view_count, r.created_at, c.name as category_name, d.name as difficulty_name, u.username, AVG(rv.rating) as average_rating FROM recipes r LEFT JOIN users u ON r.user_id = u.id LEFT JOIN categories c ON r.category_id = c.id LEFT JOIN difficulty_levels d ON r.difficulty_level_id = d.id LEFT JOIN reviews rv ON r.id = rv.recipe_id WHERE r.is_published = TRUE';
      const values = [];
      let paramCount = 1;

      if (filters.search) {
        query += ` AND (LOWER(r.title) LIKE LOWER($${paramCount}) OR LOWER(r.description) LIKE LOWER($${paramCount}) OR LOWER(r.ingredients) LIKE LOWER($${paramCount}) OR LOWER(c.name) LIKE LOWER($${paramCount}) OR LOWER(d.name) LIKE LOWER($${paramCount}) OR LOWER(r.food_type) LIKE LOWER($${paramCount}))`;
        values.push(`%${filters.search}%`);
        paramCount++;
      }

      if (filters.category_id) {
        query += ` AND r.category_id = $${paramCount}`;
        values.push(filters.category_id);
        paramCount++;
      }

      if (filters.difficulty_level_id) {
        query += ` AND r.difficulty_level_id = $${paramCount}`;
        values.push(filters.difficulty_level_id);
        paramCount++;
      }

      if (filters.food_type) {
        query += ` AND r.food_type = $${paramCount}`;
        values.push(filters.food_type);
        paramCount++;
      }

      if (filters.dietary_preference_id) {
        query += ` AND r.id IN (SELECT recipe_id FROM recipe_dietary_preferences WHERE dietary_preference_id = $${paramCount})`;
        values.push(filters.dietary_preference_id);
        paramCount++;
      }

      if (filters.min_preparation_time !== undefined) {
        query += ` AND r.preparation_time >= $${paramCount}`;
        values.push(filters.min_preparation_time);
        paramCount++;
      }

      if (filters.max_preparation_time !== undefined) {
        query += ` AND r.preparation_time <= $${paramCount}`;
        values.push(filters.max_preparation_time);
        paramCount++;
      }

      query += ` GROUP BY r.id, r.title, r.description, r.featured_image_url, r.cooking_time, r.preparation_time, r.food_type, r.view_count, r.created_at, c.name, d.name, u.username`;

      if (filters.sort_by === 'rating') {
        query += ` ORDER BY average_rating IS NULL, average_rating DESC`;
      } else if (filters.sort_by === 'popularity') {
        query += ` ORDER BY r.view_count DESC`;
      } else {
        query += ` ORDER BY r.created_at DESC`;
      }

      query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      values.push(limit, offset);

      const result = await pool.query(query, values);

      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  async getRecipeOptions() {
    try {
      const [categoriesResult, difficultyResult, dietaryResult] = await Promise.all([
        pool.query('SELECT id, name FROM categories ORDER BY name'),
        pool.query('SELECT id, name FROM difficulty_levels ORDER BY id'),
        pool.query('SELECT id, name FROM dietary_preferences ORDER BY name'),
      ]);

      return {
        categories: categoriesResult.rows,
        difficulty_levels: difficultyResult.rows,
        dietary_preferences: dietaryResult.rows,
        food_types: [
          { value: 'veg', label: 'Veg' },
          { value: 'non_veg', label: 'Non-veg' },
        ],
      };
    } catch (error) {
      throw error;
    }
  }

  async getTrendingRecipes(limit = 10) {
    try {
      const result = await pool.query(
        'SELECT r.id, r.title, r.description, r.featured_image_url, r.view_count, u.username FROM recipes r INNER JOIN users u ON r.user_id = u.id WHERE r.is_published = TRUE ORDER BY r.view_count DESC, r.created_at DESC LIMIT $1',
        [limit]
      );

      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  async getRecipesByCategory(categoryId, limit = 10, offset = 0) {
    try {
      const result = await pool.query(
        'SELECT r.id, r.title, r.description, r.featured_image_url FROM recipes r WHERE r.category_id = $1 AND r.is_published = TRUE ORDER BY r.created_at DESC LIMIT $2 OFFSET $3',
        [categoryId, limit, offset]
      );

      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  async addRecipeImage(recipeId, imageUrl) {
    try {
      const result = await pool.query(
        'INSERT INTO recipe_images (recipe_id, image_url) VALUES ($1, $2)',
        [recipeId, imageUrl]
      );

      const imageResult = await pool.query('SELECT id, image_url FROM recipe_images WHERE id = $1', [result.insertId]);

      return imageResult.rows[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new RecipeService();
