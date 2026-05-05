require('express-async-errors');

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { Readable } = require('stream');

const config = require('./config/env');
const pool = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const createRateLimiter = require('./middleware/rateLimiter');
const AppError = require('./utils/appError');
const { getS3Object } = require('./utils/s3');

const userRoutes = require('./routes/userRoutes');
const recipeRoutes = require('./routes/recipeRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const socialRoutes = require('./routes/socialRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const frontendPath = path.join(__dirname, 'frontend');
const uploadsPath = path.join(__dirname, 'uploads');
const cspDirectives = {
  defaultSrc: ["'self'"],
  baseUri: ["'self'"],
  fontSrc: ["'self'", 'https:', 'data:'],
  formAction: ["'self'"],
  frameAncestors: ["'self'"],
  imgSrc: ["'self'", 'https:', 'data:', 'blob:'],
  objectSrc: ["'none'"],
  scriptSrc: ["'self'"],
  scriptSrcAttr: ["'none'"],
  styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
};
const allowedOrigins = new Set([
  config.appUrl,
  config.frontendUrl,
  ...config.allowedOrigins,
].filter(Boolean));

if (config.isProduction) {
  cspDirectives.upgradeInsecureRequests = [];
}

app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: cspDirectives,
  },
  crossOriginResourcePolicy: { policy: 'same-origin' },
}));

app.use(cors({
  origin(origin, callback) {
    if (!origin || !config.isProduction || allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    return callback(new AppError('Origin not allowed by CORS', 403));
  },
  credentials: true,
}));

app.use(compression());
app.use(morgan(config.isProduction ? 'combined' : 'dev'));
app.use(express.json({ limit: config.bodyLimit }));
app.use(express.urlencoded({ limit: config.bodyLimit, extended: true }));
app.use('/api', createRateLimiter(config.rateLimit));
app.use(express.static(frontendPath, {
  etag: true,
  maxAge: config.isProduction ? '1h' : 0,
}));
app.use('/uploads', express.static(uploadsPath, {
  etag: true,
  maxAge: config.isProduction ? '1d' : 0,
}));

app.get('/api/files/s3/*', async (req, res, next) => {
  try {
    const key = req.params[0];

    if (!key) {
      return next(new AppError('File key is required', 400));
    }

    const object = await getS3Object(key);

    if (object.ContentType) {
      res.type(object.ContentType);
    }

    res.set('Cache-Control', 'public, max-age=3600');

    if (object.ContentLength !== undefined) {
      res.set('Content-Length', String(object.ContentLength));
    }

    if (object.Body instanceof Readable || typeof object.Body?.pipe === 'function') {
      object.Body.on('error', next);
      return object.Body.pipe(res);
    }

    return res.send(object.Body);
  } catch (error) {
    return next(new AppError(`Unable to load S3 file: ${error.message}`, 404));
  }
});

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    environment: config.env,
    uptime: process.uptime(),
  });
});

app.get('/', (req, res) => {
  res.set('Cache-Control', 'no-cache');
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.use('/api/users', userRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/admin', adminRoutes);

app.all('/api/*', (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

app.get('*', (req, res) => {
  res.set('Cache-Control', 'no-cache');
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.use(errorHandler);

let server;

const shutdown = async signal => {
  console.log(`${signal} received. Shutting down gracefully...`);

  if (!server) {
    await pool.end();
    process.exit(0);
  }

  server.close(async () => {
    try {
      await pool.end();
      console.log('Shutdown complete');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  });
};

const start = () => {
  if (server) return server;

  server = app.listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);
  });

  return server;
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', error => {
  console.error('Unhandled rejection:', error);
  shutdown('unhandledRejection');
});

process.on('uncaughtException', error => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

if (require.main === module) {
  start();
}

app.start = start;

module.exports = app;
