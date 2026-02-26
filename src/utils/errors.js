/**
 * Custom Error Classes
 * Structured error handling for different failure scenarios
 */

/**
 * Base application error
 */
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * OAuth/Authentication errors
 */
class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, true);
  }
}

/**
 * Authorization errors (valid auth, insufficient permissions)
 */
class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, true);
  }
}

/**
 * Resource not found
 */
class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, true);
  }
}

/**
 * Invalid input/validation errors
 */
class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors = []) {
    super(message, 400, true);
    this.errors = errors;
  }
}

/**
 * Shopify API errors
 */
class ShopifyAPIError extends AppError {
  constructor(message, statusCode = 500, response = null) {
    super(message, statusCode, true);
    this.response = response;
  }
}

/**
 * Rate limit exceeded
 */
class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded', retryAfter = null) {
    super(message, 429, true);
    this.retryAfter = retryAfter;
  }
}

/**
 * Database errors
 */
class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', originalError = null) {
    super(message, 500, true);
    this.originalError = originalError;
  }
}

/**
 * Webhook verification errors
 */
class WebhookVerificationError extends AppError {
  constructor(message = 'Webhook verification failed') {
    super(message, 401, true);
  }
}

/**
 * Configuration errors (non-operational - app cannot continue)
 */
class ConfigurationError extends AppError {
  constructor(message = 'Configuration error') {
    super(message, 500, false);
  }
}

/**
 * Checks if error is operational (expected) vs programming error
 * @param {Error} error
 * @returns {boolean}
 */
function isOperationalError(error) {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

module.exports = {
  AppError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  ShopifyAPIError,
  RateLimitError,
  DatabaseError,
  WebhookVerificationError,
  ConfigurationError,
  isOperationalError,
};
