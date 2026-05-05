require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const getNumber = (name, fallback) => {
  const value = process.env[name];
  if (value === undefined || value === '') return fallback;

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`${name} must be a number`);
  }

  return parsed;
};

const getList = value => (value || '')
  .split(',')
  .map(item => item.trim())
  .filter(Boolean);

const requiredInProduction = [
  'DB_HOST',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_SECRET',
];

const validate = () => {
  if (!isProduction) return;

  const missing = requiredInProduction.filter(name => !process.env[name]);

  if (missing.length) {
    throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
  }

  const jwtSecret = process.env.JWT_SECRET || '';
  const weakSecrets = [
    'secret',
    'your_super_secret_jwt_key_here_change_in_production',
    'change_me',
  ];

  if (jwtSecret.length < 32 || weakSecrets.includes(jwtSecret)) {
    throw new Error('JWT_SECRET must be a strong production secret with at least 32 characters');
  }
};

validate();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  isProduction,
  port: getNumber('PORT', 5000),
  appUrl: process.env.APP_URL || 'http://localhost:5000',
  frontendUrl: process.env.FRONTEND_URL || '',
  allowedOrigins: getList(process.env.ALLOWED_ORIGINS),
  bodyLimit: process.env.BODY_LIMIT || '1mb',
  rateLimit: {
    windowMs: getNumber('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
    max: getNumber('RATE_LIMIT_MAX', 300),
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: getNumber('DB_PORT', 3306),
    name: process.env.DB_NAME || 'recipe_management',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    connectionLimit: getNumber('DB_CONNECTION_LIMIT', 10),
  },
};
