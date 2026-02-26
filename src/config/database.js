/**
 * Database Configuration
 * MySQL connection pool settings
 */

const config = require('./index');

const databaseConfig = {
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database,
  connectionLimit: config.database.connectionLimit,
  connectTimeout: config.database.connectTimeout,
  charset: config.database.charset,

  // Additional production-ready settings
  waitForConnections: true,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,

  // Timezone handling - store as UTC, convert in application
  timezone: 'Z',

  // Date handling - prevent automatic date string conversion
  dateStrings: false,

  // Support big numbers (Shopify IDs can be large)
  supportBigNumbers: true,
  bigNumberStrings: false,

  // Multiple statement execution (for migrations)
  multipleStatements: false,
};

module.exports = databaseConfig;
