/**
 * Global Error Handler Middleware
 * Handles all errors and formats responses consistently
 */

const config = require('../config');
const { isOperationalError } = require('../utils/errors');
const createLogger = require('../utils/logger');

const logger = createLogger('ErrorHandler');

/**
 * Error handler middleware
 * Must be last middleware in the chain
 */
function errorHandler(err, req, res, next) {
  // Log error
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  // Determine status code
  const statusCode = err.statusCode || 500;

  // Build error response
  const errorResponse = {
    success: false,
    error: {
      message: err.message || 'Internal server error',
      code: err.name || 'Error',
    },
  };

  // Include stack trace in development
  if (config.app.isDevelopment) {
    errorResponse.error.stack = err.stack;
  }

  // Include validation errors if available
  if (err.errors) {
    errorResponse.error.details = err.errors;
  }

  // Include retry-after header for rate limit errors
  if (err.retryAfter) {
    res.setHeader('Retry-After', err.retryAfter);
  }

  // Send response
  res.status(statusCode).json(errorResponse);

  // If non-operational error, exit process (should be restarted by process manager)
  if (!isOperationalError(err) && config.app.isProduction) {
    logger.error('Non-operational error detected - shutting down', { error: err });
    process.exit(1);
  }
}

/**
 * 404 Not Found handler
 */
function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: {
      message: 'Endpoint not found',
      code: 'NotFound',
      path: req.originalUrl,
    },
  });
}

/**
 * Async route handler wrapper
 * Catches errors in async route handlers
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
};
