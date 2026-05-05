const socialService = require('../services/socialService');
const AppError = require('../utils/appError');

class SocialController {
  async searchUsers(req, res, next) {
    try {
      const { query = '', limit = 10 } = req.query;
      const users = await socialService.searchUsers(query, req.user.id, Number(limit) || 10);

      res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  async followUser(req, res, next) {
    try {
      const { userId } = req.params;

      const follow = await socialService.followUser(req.user.id, userId);

      res.status(201).json({
        success: true,
        message: 'User followed successfully',
        data: follow,
      });
    } catch (error) {
      next(error);
    }
  }

  async unfollowUser(req, res, next) {
    try {
      const { userId } = req.params;

      await socialService.unfollowUser(req.user.id, userId);

      res.status(200).json({
        success: true,
        message: 'User unfollowed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getFollowers(req, res, next) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const followers = await socialService.getFollowers(userId, limit, offset);

      res.status(200).json({
        success: true,
        data: followers,
      });
    } catch (error) {
      next(error);
    }
  }

  async getFollowing(req, res, next) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const following = await socialService.getFollowing(userId, limit, offset);

      res.status(200).json({
        success: true,
        data: following,
      });
    } catch (error) {
      next(error);
    }
  }

  async getFollowStats(req, res, next) {
    try {
      const { userId } = req.params;

      const stats = await socialService.getFollowStats(userId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  async isFollowing(req, res, next) {
    try {
      const { userId } = req.params;

      const isFollowing = await socialService.isFollowing(req.user.id, userId);

      res.status(200).json({
        success: true,
        data: { is_following: isFollowing },
      });
    } catch (error) {
      next(error);
    }
  }

  async getActivityFeed(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const activities = await socialService.getActivityFeed(req.user.id, limit, offset);

      res.status(200).json({
        success: true,
        data: activities,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SocialController();
