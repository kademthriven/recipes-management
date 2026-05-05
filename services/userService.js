const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { generateToken } = require('../utils/jwt');
const AppError = require('../utils/appError');

class UserService {
  async register(username, email, password, firstName, lastName) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await pool.query(
        'INSERT INTO users (username, email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4, $5)',
        [username, email, hashedPassword, firstName, lastName]
      );

      const userResult = await pool.query(
        'SELECT id, username, email, first_name, last_name FROM users WHERE id = $1',
        [result.insertId]
      );
      const user = userResult.rows[0];
      const token = generateToken(user.id, false);
      user.is_admin = false;
      user.role = 'user';

      return { user, token };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        const field = error.message.includes('username') ? 'username' : 'email';
        throw new AppError(`This ${field} is already registered`, 409);
      }
      throw error;
    }
  }

  async login(email, password, role = 'user') {
    try {
      const result = await pool.query(
        'SELECT id, username, email, password_hash, first_name, last_name, is_banned FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        throw new AppError('Invalid email or password', 401);
      }

      const user = result.rows[0];

      if (user.is_banned) {
        throw new AppError('This account has been banned', 403);
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);

      if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 401);
      }

      const isAdminSession = role === 'admin';
      const token = generateToken(user.id, isAdminSession);

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          is_admin: isAdminSession,
          role: isAdminSession ? 'admin' : 'user',
        },
        token,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Login failed', 500);
    }
  }

  async getUserProfile(userId) {
    try {
      const result = await pool.query(
        'SELECT id, username, email, first_name, last_name, bio, profile_picture_url, created_at FROM users WHERE id = $1 AND is_banned = FALSE',
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

  async updateProfile(userId, updateData) {
    try {
      const fields = [];
      const values = [];
      let paramCount = 1;

      if (updateData.first_name !== undefined) {
        fields.push(`first_name = $${paramCount}`);
        values.push(updateData.first_name);
        paramCount++;
      }
      if (updateData.last_name !== undefined) {
        fields.push(`last_name = $${paramCount}`);
        values.push(updateData.last_name);
        paramCount++;
      }
      if (updateData.bio !== undefined) {
        fields.push(`bio = $${paramCount}`);
        values.push(updateData.bio);
        paramCount++;
      }
      if (updateData.username !== undefined) {
        fields.push(`username = $${paramCount}`);
        values.push(updateData.username);
        paramCount++;
      }

      fields.push(`updated_at = $${paramCount}`);
      values.push(new Date());
      paramCount++;

      values.push(userId);

      const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount}`;

      await pool.query(query, values);

      const userResult = await pool.query(
        'SELECT id, username, email, first_name, last_name, bio, profile_picture_url FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new AppError('User not found', 404);
      }

      return userResult.rows[0];
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        throw new AppError('Username already taken', 409);
      }
      if (error instanceof AppError) throw error;
      throw error;
    }
  }

  async updateProfilePicture(userId, imageUrl) {
    try {
      await pool.query(
        'UPDATE users SET profile_picture_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [imageUrl, userId]
      );

      const result = await pool.query(
        'SELECT id, username, email, profile_picture_url FROM users WHERE id = $1',
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

  async getUserRecipes(userId, limit = 10, offset = 0) {
    try {
      const result = await pool.query(
        'SELECT id, title, description, featured_image_url, food_type, cooking_time, preparation_time, created_at FROM recipes WHERE user_id = $1 AND is_published = TRUE ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [userId, limit, offset]
      );

      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  async getUserFavorites(userId, limit = 10, offset = 0) {
    try {
      const result = await pool.query(
        'SELECT r.id, r.title, r.description, r.featured_image_url FROM recipes r INNER JOIN favorites f ON r.id = f.recipe_id WHERE f.user_id = $1 AND r.is_published = TRUE ORDER BY f.created_at DESC LIMIT $2 OFFSET $3',
        [userId, limit, offset]
      );

      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  async changePassword(userId, oldPassword, newPassword) {
    try {
      const result = await pool.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        throw new AppError('User not found', 404);
      }

      const isPasswordValid = await bcrypt.compare(oldPassword, result.rows[0].password_hash);

      if (!isPasswordValid) {
        throw new AppError('Current password is incorrect', 401);
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await pool.query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [hashedPassword, userId]
      );

      return { message: 'Password changed successfully' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw error;
    }
  }
}

module.exports = new UserService();
