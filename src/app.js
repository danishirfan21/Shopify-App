/**
 * Main Application File
 * Shopify Attribution & Order Inspector
 */

const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const session = require('express-session');
const config = require('./config');
const { requestLogger, rawBodyCapture } = require('./middleware/requestLogger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { healthCheck } = require('./database/connection');
const createLogger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const webhookRoutes = require('./routes/webhooks');

const logger = createLogger('App');

// Create Express app
const app = express();

/**
 * Security Middleware
 */
app.use(helmet({
  contentSecurityPolicy: false, // Disable for OAuth redirects
}));

app.use(cors({
  origin: config.app.isDevelopment ? '*' : config.app.url,
  credentials: true,
}));

/**
 * Performance Middleware
 */
app.use(compression());

/**
 * Session Management
 */
app.use(session({
  secret: config.security.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.app.isProduction, // HTTPS only in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax',
  },
}));

/**
 * Request Logging
 */
app.use(requestLogger);

/**
 * Raw Body Capture (for webhook verification)
 * Must come before JSON parser
 */
app.use(rawBodyCapture);

/**
 * Body Parsing
 */
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for webhook routes
    if (req.path.startsWith('/webhooks')) {
      req.rawBody = buf.toString('utf8');
    }
  },
}));

app.use(express.urlencoded({ extended: true }));

/**
 * Health Check Endpoint
 */
app.get('/health', async (req, res) => {
  const dbHealthy = await healthCheck();

  const health = {
    status: dbHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbHealthy ? 'connected' : 'disconnected',
  };

  res.status(dbHealthy ? 200 : 503).json(health);
});

/**
 * Root Endpoint
 */
app.get('/', (req, res) => {
  res.json({
    name: 'Shopify Attribution & Order Inspector',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: {
        install: '/auth/install?shop=your-store.myshopify.com',
        callback: '/auth/callback',
      },
      api: {
        orders: '/api/orders',
        attribution: '/api/attribution/sources',
      },
      webhooks: {
        orders_create: '/webhooks/orders-create',
        orders_updated: '/webhooks/orders-updated',
      },
      health: '/health',
    },
  });
});

/**
 * Routes
 */
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/webhooks', webhookRoutes);

/**
 * 404 Handler
 */
app.use(notFoundHandler);

/**
 * Error Handler (must be last)
 */
app.use(errorHandler);

/**
 * Server Startup
 */
const PORT = config.app.port;

app.listen(PORT, () => {
  logger.info(`🚀 Shopify Attribution App running on port ${PORT}`, {
    environment: config.app.env,
    url: config.app.url,
  });

  logger.info('Available endpoints:', {
    auth: `${config.app.url}/auth/install`,
    api: `${config.app.url}/api/orders`,
    health: `${config.app.url}/health`,
  });
});

/**
 * Graceful Shutdown
 */
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');

  const { closePool } = require('./database/connection');
  await closePool();

  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');

  const { closePool } = require('./database/connection');
  await closePool();

  process.exit(0);
});

/**
 * Unhandled Promise Rejection Handler
 */
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', {
    reason,
    promise,
  });

  if (config.app.isProduction) {
    process.exit(1);
  }
});

module.exports = app;
