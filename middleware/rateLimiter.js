const AppError = require('../utils/appError');

const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 300,
  message = 'Too many requests. Please try again later.',
} = {}) => {
  const hits = new Map();

  setInterval(() => {
    const now = Date.now();

    hits.forEach((entry, key) => {
      if (entry.resetAt <= now) {
        hits.delete(key);
      }
    });
  }, Math.min(windowMs, 60 * 1000)).unref();

  return (req, res, next) => {
    const key = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const current = hits.get(key);

    if (!current || current.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    current.count += 1;
    const remaining = Math.max(max - current.count, 0);

    res.set('RateLimit-Limit', String(max));
    res.set('RateLimit-Remaining', String(remaining));
    res.set('RateLimit-Reset', String(Math.ceil(current.resetAt / 1000)));

    if (current.count > max) {
      return next(new AppError(message, 429));
    }

    return next();
  };
};

module.exports = createRateLimiter;
