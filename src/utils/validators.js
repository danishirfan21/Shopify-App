/**
 * Validation Utilities
 * Common validation functions for requests and data
 */

const { ValidationError } = require('./errors');

/**
 * Validates Shopify shop domain format
 * @param {string} shop - Shop domain
 * @returns {boolean} True if valid
 * @throws {ValidationError} If invalid
 */
function validateShopDomain(shop) {
  if (!shop || typeof shop !== 'string') {
    throw new ValidationError('Shop domain is required');
  }

  // Shopify shop domains must match: store-name.myshopify.com
  const shopPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;

  if (!shopPattern.test(shop)) {
    throw new ValidationError(
      'Invalid shop domain format. Expected: store-name.myshopify.com'
    );
  }

  return true;
}

/**
 * Validates HMAC signature from Shopify OAuth callback
 * @param {Object} query - Query parameters from callback
 * @param {string} hmac - HMAC signature to verify
 * @param {string} secret - Shopify API secret
 * @returns {boolean} True if valid
 */
function validateHMAC(query, hmac, secret) {
  const crypto = require('crypto');

  // Create a copy and remove hmac and signature
  const params = { ...query };
  delete params.hmac;
  delete params.signature;

  // Sort keys and build query string
  const message = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  // Calculate HMAC
  const calculatedHmac = crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');

  // Constant-time comparison
  return crypto.timingSafeEqual(
    Buffer.from(hmac),
    Buffer.from(calculatedHmac)
  );
}

/**
 * Validates date range for analytics queries
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Object} Validated date objects
 */
function validateDateRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime())) {
    throw new ValidationError('Invalid start date format. Use YYYY-MM-DD');
  }

  if (isNaN(end.getTime())) {
    throw new ValidationError('Invalid end date format. Use YYYY-MM-DD');
  }

  if (start > end) {
    throw new ValidationError('Start date must be before end date');
  }

  // Limit to 1 year range
  const maxRange = 365 * 24 * 60 * 60 * 1000; // 1 year in ms
  if (end - start > maxRange) {
    throw new ValidationError('Date range cannot exceed 1 year');
  }

  return { start, end };
}

/**
 * Validates pagination parameters
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Object} Validated pagination params
 */
function validatePagination(page = 1, limit = 50) {
  const validatedPage = parseInt(page, 10);
  const validatedLimit = parseInt(limit, 10);

  if (isNaN(validatedPage) || validatedPage < 1) {
    throw new ValidationError('Page must be a positive integer');
  }

  if (isNaN(validatedLimit) || validatedLimit < 1 || validatedLimit > 250) {
    throw new ValidationError('Limit must be between 1 and 250');
  }

  return {
    page: validatedPage,
    limit: validatedLimit,
    offset: (validatedPage - 1) * validatedLimit,
  };
}

/**
 * Validates order financial status
 * @param {string} status - Financial status
 * @returns {boolean} True if valid
 */
function validateFinancialStatus(status) {
  const validStatuses = [
    'pending',
    'authorized',
    'partially_paid',
    'paid',
    'partially_refunded',
    'refunded',
    'voided',
  ];

  if (!validStatuses.includes(status)) {
    throw new ValidationError(
      `Invalid financial status. Must be one of: ${validStatuses.join(', ')}`
    );
  }

  return true;
}

/**
 * Sanitizes user input (prevents XSS)
 * @param {string} input - User input
 * @returns {string} Sanitized input
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return input;
  }

  return input
    .replace(/[<>]/g, '') // Remove < and >
    .trim()
    .slice(0, 1000); // Limit length
}

/**
 * Validates Shopify webhook signature
 * @param {string} body - Raw request body
 * @param {string} hmacHeader - X-Shopify-Hmac-SHA256 header
 * @param {string} secret - Webhook secret
 * @returns {boolean} True if valid
 */
function validateWebhookHMAC(body, hmacHeader, secret) {
  const crypto = require('crypto');

  const calculatedHmac = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(hmacHeader),
    Buffer.from(calculatedHmac)
  );
}

module.exports = {
  validateShopDomain,
  validateHMAC,
  validateDateRange,
  validatePagination,
  validateFinancialStatus,
  sanitizeInput,
  validateWebhookHMAC,
};
