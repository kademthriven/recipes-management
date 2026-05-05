try {
  require('../config/env');
  console.log('Environment configuration is valid.');
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
