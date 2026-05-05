const userService = require('../services/userService');
const { uploadToS3 } = require('../utils/s3');
const { userRegistrationSchema, userLoginSchema, userProfileUpdateSchema } = require('../validators/schemas');
const AppError = require('../utils/appError');

class UserController {
  async register(req, res, next) {
    try {
      const { error, value } = userRegistrationSchema.validate(req.body);

      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }

      const { user, token } = await userService.register(
        value.username,
        value.email,
        value.password,
        value.first_name,
        value.last_name
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: { user, token },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { error, value } = userLoginSchema.validate(req.body);

      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }

      const { user, token } = await userService.login(value.email, value.password, value.role);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: { user, token },
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const user = await userService.getUserProfile(req.user.id);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const { error, value } = userProfileUpdateSchema.validate(req.body);

      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }

      const user = await userService.updateProfile(req.user.id, value);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserRecipes(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const userId = req.params.userId || req.user.id;

      const recipes = await userService.getUserRecipes(userId, limit, offset);

      res.status(200).json({
        success: true,
        data: recipes,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfilePicture(req, res, next) {
    try {
      if (!req.file) {
        return next(new AppError('No file uploaded', 400));
      }
      if (!req.file.size || !req.file.buffer) {
        return next(new AppError('Please choose a valid image file', 400));
      }

      const imageUrl = await uploadToS3(req.file, 'profiles');
      const user = await userService.updateProfilePicture(req.user.id, imageUrl);

      res.status(200).json({
        success: true,
        message: 'Profile picture updated successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserFavorites(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const favorites = await userService.getUserFavorites(req.user.id, limit, offset);

      res.status(200).json({
        success: true,
        data: favorites,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserFavoritesById(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const favorites = await userService.getUserFavorites(req.params.userId, limit, offset);

      res.status(200).json({
        success: true,
        data: favorites,
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { old_password, new_password, confirm_password } = req.body;

      if (!old_password || !new_password || !confirm_password) {
        return next(new AppError('All fields are required', 400));
      }

      if (new_password !== confirm_password) {
        return next(new AppError('Passwords do not match', 400));
      }

      const result = await userService.changePassword(req.user.id, old_password, new_password);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
