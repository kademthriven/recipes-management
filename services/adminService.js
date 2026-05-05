const pool = require('../config/database');
const AppError = require('../utils/appError');

class AdminService {
  async getAllUsers(limit = 10, offset = 0) {
    try {
      const result = await pool.query(
        'SELECT id, username, email, first_name, last_name, is_verified, is_banned, created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [Number(limit), Number(offset)]
      );

      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  async getUserStats() {
    try {
      const result = await pool.query(
        'SELECT COUNT(*) as total_users, SUM(CASE WHEN is_verified THEN 1 ELSE 0 END) as verified_users, SUM(CASE WHEN is_banned THEN 1 ELSE 0 END) as banned_users FROM users'
      );

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  async banUser(userId, actorUserId = null, reason = null) {
    try {
      if (String(userId) === String(actorUserId)) {
        throw new AppError('You cannot ban your own admin account', 400);
      }

      const existingUser = await pool.query(
        'SELECT id FROM users WHERE id = $1',
        [userId]
      );

      if (existingUser.rows.length === 0) {
        throw new AppError('User not found', 404);
      }

      await pool.query(
        'UPDATE users SET is_banned = TRUE WHERE id = $1',
        [userId]
      );

      const result = await pool.query(
        'SELECT id, username, email, is_banned FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        throw new AppError('User not found', 404);
      }

      return result.rows[0];
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw error;
    }
  }

  async unbanUser(userId) {
    try {
      await pool.query(
        'UPDATE users SET is_banned = FALSE WHERE id = $1',
        [userId]
      );

      const result = await pool.query(
        'SELECT id, username, email, is_banned FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        throw new AppError('User not found', 404);
      }

      return result.rows[0];
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw error;
    }
  }

  async verifyUser(userId) {
    try {
      await pool.query(
        'UPDATE users SET is_verified = TRUE WHERE id = $1',
        [userId]
      );

      const result = await pool.query(
        'SELECT id, username, email, is_verified FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        throw new AppError('User not found', 404);
      }

      return result.rows[0];
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw error;
    }
  }

  async getAllRecipes(limit = 10, offset = 0) {
    try {
      const result = await pool.query(
        'SELECT r.id, r.title, r.description, r.featured_image_url, r.food_type, r.cooking_time, r.preparation_time, r.user_id, u.username, r.is_published, r.created_at, COUNT(rv.id) as review_count FROM recipes r INNER JOIN users u ON r.user_id = u.id LEFT JOIN reviews rv ON r.id = rv.recipe_id GROUP BY r.id, r.title, r.description, r.featured_image_url, r.food_type, r.cooking_time, r.preparation_time, r.user_id, u.username, r.is_published, r.created_at ORDER BY r.created_at DESC LIMIT $1 OFFSET $2',
        [Number(limit), Number(offset)]
      );

      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  async getRecipeById(recipeId) {
    try {
      const recipeResult = await pool.query(
        'SELECT r.*, u.username, c.name as category_name, d.name as difficulty_name FROM recipes r LEFT JOIN users u ON r.user_id = u.id LEFT JOIN categories c ON r.category_id = c.id LEFT JOIN difficulty_levels d ON r.difficulty_level_id = d.id WHERE r.id = $1',
        [recipeId]
      );

      if (recipeResult.rows.length === 0) {
        throw new AppError('Recipe not found', 404);
      }

      const recipe = recipeResult.rows[0];

      const dietaryResult = await pool.query(
        'SELECT dp.id, dp.name FROM dietary_preferences dp INNER JOIN recipe_dietary_preferences rdp ON dp.id = rdp.dietary_preference_id WHERE rdp.recipe_id = $1',
        [recipeId]
      );

      const imagesResult = await pool.query(
        'SELECT id, image_url FROM recipe_images WHERE recipe_id = $1',
        [recipeId]
      );

      const reviewsResult = await pool.query(
        'SELECT id, rating, comment, created_at, user_id FROM reviews WHERE recipe_id = $1 ORDER BY created_at DESC LIMIT 5',
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

  async getRecipeStats() {
    try {
      const result = await pool.query(
        'SELECT COUNT(*) as total_recipes, SUM(CASE WHEN is_published THEN 1 ELSE 0 END) as published_recipes, AVG(view_count) as avg_views FROM recipes'
      );

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  async deleteRecipe(recipeId) {
    try {
      const result = await pool.query(
        'DELETE FROM recipes WHERE id = $1',
        [recipeId]
      );

      if (result.rowCount === 0) {
        throw new AppError('Recipe not found', 404);
      }

      return { message: 'Recipe deleted successfully' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw error;
    }
  }

  async publishRecipe(recipeId) {
    try {
      await pool.query(
        'UPDATE recipes SET is_published = TRUE WHERE id = $1',
        [recipeId]
      );

      const result = await pool.query(
        'SELECT id, title, is_published FROM recipes WHERE id = $1',
        [recipeId]
      );

      if (result.rows.length === 0) {
        throw new AppError('Recipe not found', 404);
      }

      return result.rows[0];
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw error;
    }
  }

  async unpublishRecipe(recipeId) {
    try {
      await pool.query(
        'UPDATE recipes SET is_published = FALSE WHERE id = $1',
        [recipeId]
      );

      const result = await pool.query(
        'SELECT id, title, is_published FROM recipes WHERE id = $1',
        [recipeId]
      );

      if (result.rows.length === 0) {
        throw new AppError('Recipe not found', 404);
      }

      return result.rows[0];
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw error;
    }
  }

  async createCategory(name, description) {
    try {
      const result = await pool.query(
        'INSERT INTO categories (name, description) VALUES ($1, $2)',
        [name, description || null]
      );

      const category = await pool.query('SELECT * FROM categories WHERE id = $1', [result.insertId]);

      return category.rows[0];
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        throw new AppError('Category already exists', 409);
      }
      throw error;
    }
  }

  async createDifficultyLevel(name, description) {
    try {
      const result = await pool.query(
        'INSERT INTO difficulty_levels (name, description) VALUES ($1, $2)',
        [name, description || null]
      );

      const difficultyLevel = await pool.query('SELECT * FROM difficulty_levels WHERE id = $1', [result.insertId]);

      return difficultyLevel.rows[0];
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        throw new AppError('Difficulty level already exists', 409);
      }
      throw error;
    }
  }

  async createDietaryPreference(name, description) {
    try {
      const result = await pool.query(
        'INSERT INTO dietary_preferences (name, description) VALUES ($1, $2)',
        [name, description || null]
      );

      const dietaryPreference = await pool.query('SELECT * FROM dietary_preferences WHERE id = $1', [result.insertId]);

      return dietaryPreference.rows[0];
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        throw new AppError('Dietary preference already exists', 409);
      }
      throw error;
    }
  }

  async getPlatformStats() {
    try {
      const userStats = await this.getUserStats();
      const recipeStats = await this.getRecipeStats();

      const reviewResult = await pool.query(
        'SELECT COUNT(*) as total_reviews, AVG(rating) as avg_rating FROM reviews'
      );

      const favoriteResult = await pool.query(
        'SELECT COUNT(*) as total_favorites FROM favorites'
      );

      return {
        users: userStats,
        recipes: recipeStats,
        reviews: reviewResult.rows[0],
        favorites: favoriteResult.rows[0],
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AdminService();
