const pool = require('../config/database');
const AppError = require('../utils/appError');

class SocialService {
  async searchUsers(query, currentUserId = null, limit = 10) {
    try {
      const trimmedQuery = String(query || '').trim();

      if (trimmedQuery.length < 2) {
        throw new AppError('Enter at least 2 characters to search users', 400);
      }

      const result = await pool.query(
        `SELECT
          u.id,
          u.username,
          u.first_name,
          u.last_name,
          u.profile_picture_url,
          u.bio,
          EXISTS(
            SELECT 1
            FROM follows f
            WHERE f.follower_id = $3 AND f.following_id = u.id
          ) as is_following
        FROM users u
        WHERE u.is_banned = FALSE
          AND ($3 IS NULL OR u.id <> $3)
          AND (
            u.username LIKE $1
            OR u.first_name LIKE $1
            OR u.last_name LIKE $1
            OR CONCAT_WS(' ', u.first_name, u.last_name) LIKE $1
            OR u.email LIKE $1
          )
        ORDER BY u.username ASC
        LIMIT $2`,
        [`%${trimmedQuery}%`, limit, currentUserId]
      );

      return result.rows;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw error;
    }
  }

  async followUser(followerId, followingId) {
    try {
      if (String(followerId) === String(followingId)) {
        throw new AppError('You cannot follow yourself', 400);
      }

      // Check if user exists
      const userResult = await pool.query('SELECT id FROM users WHERE id = $1', [followingId]);

      if (userResult.rows.length === 0) {
        throw new AppError('User not found', 404);
      }

      const result = await pool.query(
        'INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)',
        [followerId, followingId]
      );

      const follow = await pool.query('SELECT * FROM follows WHERE id = $1', [result.insertId]);

      return follow.rows[0];
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        throw new AppError('Already following this user', 409);
      }
      throw error;
    }
  }

  async unfollowUser(followerId, followingId) {
    try {
      const result = await pool.query(
        'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
        [followerId, followingId]
      );

      if (result.rowCount === 0) {
        throw new AppError('Not following this user', 404);
      }

      return { message: 'Unfollowed successfully' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw error;
    }
  }

  async getFollowers(userId, limit = 10, offset = 0) {
    try {
      const result = await pool.query(
        'SELECT u.id, u.username, u.profile_picture_url, u.bio FROM users u INNER JOIN follows f ON u.id = f.follower_id WHERE f.following_id = $1 ORDER BY f.created_at DESC LIMIT $2 OFFSET $3',
        [userId, limit, offset]
      );

      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  async getFollowing(userId, limit = 10, offset = 0) {
    try {
      const result = await pool.query(
        'SELECT u.id, u.username, u.profile_picture_url, u.bio FROM users u INNER JOIN follows f ON u.id = f.following_id WHERE f.follower_id = $1 ORDER BY f.created_at DESC LIMIT $2 OFFSET $3',
        [userId, limit, offset]
      );

      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  async getFollowStats(userId) {
    try {
      const result = await pool.query(
        'SELECT (SELECT COUNT(*) FROM follows WHERE following_id = $1) as followers, (SELECT COUNT(*) FROM follows WHERE follower_id = $1) as following',
        [userId]
      );

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  async isFollowing(followerId, followingId) {
    try {
      const result = await pool.query(
        'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2',
        [followerId, followingId]
      );

      return result.rows.length > 0;
    } catch (error) {
      throw error;
    }
  }

  async getActivityFeed(userId, limit = 20, offset = 0) {
    try {
      const result = await pool.query(
        'SELECT af.id, af.activity_type, af.created_at, u.id as user_id, u.username, u.profile_picture_url, r.id as recipe_id, r.title as recipe_title, r.featured_image_url FROM activity_feed af INNER JOIN users u ON af.actor_id = u.id LEFT JOIN recipes r ON af.recipe_id = r.id WHERE af.user_id = $1 ORDER BY af.created_at DESC LIMIT $2 OFFSET $3',
        [userId, limit, offset]
      );

      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  async addActivityFeed(userId, actorId, activityType, recipeId = null) {
    try {
      const result = await pool.query(
        'INSERT INTO activity_feed (user_id, actor_id, activity_type, recipe_id) VALUES ($1, $2, $3, $4)',
        [userId, actorId, activityType, recipeId || null]
      );

      const activity = await pool.query('SELECT * FROM activity_feed WHERE id = $1', [result.insertId]);

      return activity.rows[0];
    } catch (error) {
      throw error;
    }
  }

  async addActivityForFollowers(actorId, activityType, recipeId = null) {
    try {
      const followers = await pool.query(
        'SELECT follower_id FROM follows WHERE following_id = $1',
        [actorId]
      );

      for (const follower of followers.rows) {
        await this.addActivityFeed(follower.follower_id, actorId, activityType, recipeId);
      }

      return { inserted: followers.rows.length };
    } catch (error) {
      throw error;
    }
  }

  async removeActivityFeed(activityId) {
    try {
      await pool.query('DELETE FROM activity_feed WHERE id = $1', [activityId]);

      return { message: 'Activity removed' };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new SocialService();
