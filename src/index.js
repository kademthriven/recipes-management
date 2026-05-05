const app = require('./app');
const config = require('./config/env');
const pool = require('./config/database');

const server = app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port} (${config.env})`);
});

const shutdown = async signal => {
  console.log(`${signal} received. Shutting down gracefully...`);

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

module.exports = server;
