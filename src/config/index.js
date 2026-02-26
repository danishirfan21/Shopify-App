/**
 * Central Configuration Loader
 * Loads and validates all environment variables
 */

require('dotenv').config();

/**
 * Validates that required environment variables are present
 * @throws {Error} If required variables are missing
 */
function validateConfig() {
  const required = [
    'SHOPIFY_API_KEY',
    'SHOPIFY_API_SECRET',
    'SHOPIFY_SCOPES',
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'ENCRYPTION_KEY',
    'SESSION_SECRET',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please check your .env file against .env.example'
    );
  }

  // Validate encryption key length (must be 32 bytes = 64 hex chars)
  if (process.env.ENCRYPTION_KEY.length !== 64) {
    throw new Error(
      'ENCRYPTION_KEY must be 64 hexadecimal characters (32 bytes)\n' +
        'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
}

validateConfig();

const config = {
  // Application
  app: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 3000,
    url: process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`,
    isDevelopment: process.env.NODE_ENV !== 'production',
    isProduction: process.env.NODE_ENV === 'production',
  },

  // Shopify
  shopify: {
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecret: process.env.SHOPIFY_API_SECRET,
    scopes: process.env.SHOPIFY_SCOPES.split(',').map((s) => s.trim()),
    appUrl: process.env.SHOPIFY_APP_URL || process.env.APP_URL,
    apiVersion: '2024-01', // Shopify API version
    webhookSecret: process.env.WEBHOOK_SECRET,
  },

  // Database
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: parseInt(process.env.DB_POOL_MAX, 10) || 20,
    connectTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT, 10) || 10000,
    charset: 'utf8mb4',
  },

  // Security
  security: {
    encryptionKey: process.env.ENCRYPTION_KEY,
    sessionSecret: process.env.SESSION_SECRET,
    webhookSecret: process.env.WEBHOOK_SECRET,
  },

  // Rate Limiting
  rateLimiting: {
    maxTokens: parseInt(process.env.RATE_LIMIT_MAX_TOKENS, 10) || 1000,
    refillRate: parseInt(process.env.RATE_LIMIT_REFILL_RATE, 10) || 50,
    minThreshold: parseInt(process.env.RATE_LIMIT_MIN_THRESHOLD, 10) || 100,
  },

  // Queue Configuration
  queue: {
    webhookConcurrency: parseInt(process.env.WEBHOOK_QUEUE_CONCURRENCY, 10) || 5,
    syncConcurrency: parseInt(process.env.SYNC_QUEUE_CONCURRENCY, 10) || 2,
    webhookMaxRetries: parseInt(process.env.WEBHOOK_RETRY_MAX_ATTEMPTS, 10) || 3,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs/app.log',
    maxFiles: process.env.LOG_MAX_FILES || '14d',
  },

  // API Configuration
  api: {
    requestTimeout: parseInt(process.env.API_REQUEST_TIMEOUT, 10) || 30000,
    maxRetries: parseInt(process.env.API_MAX_RETRIES, 10) || 3,
  },

  // Monitoring
  monitoring: {
    sentryDsn: process.env.SENTRY_DSN,
    datadogApiKey: process.env.DATADOG_API_KEY,
  },
};

module.exports = config;
