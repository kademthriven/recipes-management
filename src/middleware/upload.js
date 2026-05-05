const multer = require('multer');
const path = require('path');
const AppError = require('../utils/appError');

// Set storage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed', 400));
  }
};

// Multer upload middleware
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

module.exports = upload;
