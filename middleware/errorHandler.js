const AppError = require('../utils/appError');
const config = require('../config/env');

// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  if (err.name === 'MulterError') {
    const messages = {
      LIMIT_FILE_SIZE: 'Image must be 5MB or smaller',
      LIMIT_UNEXPECTED_FILE: 'Unexpected file field was uploaded',
    };
    err = new AppError(messages[err.code] || err.message, 400);
  }

  // Wrong MongoDB ID error
  if (err.name === 'CastError') {
    const message = `Resource not found. Invalid: ${err.path}`;
    err = new AppError(message, 400);
  }

  // Handling JWT error
  if (err.name === 'JsonWebTokenError') {
    const message = `Invalid token. Please try again.`;
    err = new AppError(message, 400);
  }

  // Handling JWT expired error
  if (err.name === 'TokenExpiredError') {
    const message = `Token expired. Please login again.`;
    err = new AppError(message, 400);
  }

  // Handling Joi validation error
  if (err.isJoi) {
    const message = err.details.map(d => d.message).join(', ');
    err = new AppError(message, 400);
  }

  // Handling unique constraint violations
  if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
    const field = err.sqlMessage?.match(/for key '.*?\.(.*?)'/)?.[1]
      || err.sqlMessage?.match(/for key '(.*?)'/)?.[1]
      || 'field';
    const message = `${field} already exists`;
    err = new AppError(message, 409);
  }

  const statusCode = err.statusCode || 500;
  const isOperational = Boolean(err.isOperational) || statusCode < 500;
  const message = config.isProduction && !isOperational
    ? 'Internal Server Error'
    : err.message;

  if (statusCode >= 500) {
    console.error(err);
  }

  res.status(err.statusCode).json({
    success: false,
    message,
    ...(!config.isProduction && { stack: err.stack }),
  });
};

module.exports = errorHandler;
