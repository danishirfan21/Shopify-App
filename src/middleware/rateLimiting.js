/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse
 */

const rateLimit = require('express-rate-limit');
const createLogger = require('../utils/logger');

const logger = createLogger('RateLimiting');

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later',
      code: 'RateLimitExceeded',
    },
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      url: req.originalUrl,
    });

    res.status(429).json({
      success: false,
      error: {
        message: 'Too many requests, please try again later',
        code: 'RateLimitExceeded',
      },
    });
  },
});

/**
 * OAuth/Auth rate limiter (stricter)
 * 10 requests per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts, please try again later',
      code: 'AuthRateLimitExceeded',
    },
  },
  skipSuccessfulRequests: false,
});

/**
 * Webhook rate limiter (very permissive - Shopify is trusted)
 * 1000 requests per minute
 */
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000,
  message: {
    success: false,
    error: {
      message: 'Webhook rate limit exceeded',
      code: 'WebhookRateLimitExceeded',
    },
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  webhookLimiter,
};
