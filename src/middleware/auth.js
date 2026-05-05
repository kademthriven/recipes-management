const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const pool = require('../config/database');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next(new AppError('No token provided', 401));
    }

    const user = jwt.verify(token, process.env.JWT_SECRET);
    const userResult = await pool.query(
      'SELECT id, is_banned FROM users WHERE id = $1',
      [user.id]
    );

    if (userResult.rows.length === 0) {
      return next(new AppError('User account no longer exists', 401));
    }

    if (userResult.rows[0].is_banned) {
      return next(new AppError('This account has been banned', 403));
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new AppError('Invalid or expired token', 403));
    }

    next(error);
  }
};

const authenticateAdmin = (req, res, next) => {
  try {
    if (!req.user || !req.user.is_admin) {
      return next(new AppError('Access denied. Admin privileges required', 403));
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticateToken,
  authenticateAdmin,
};
