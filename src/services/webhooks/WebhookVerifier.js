/**
 * Webhook Verifier
 * Verifies HMAC signatures on incoming webhooks from Shopify
 */

const crypto = require('crypto');
const config = require('../../config');
const { WebhookVerificationError } = require('../../utils/errors');
const createLogger = require('../../utils/logger');

const logger = createLogger('WebhookVerifier');

class WebhookVerifier {
  /**
   * Verifies webhook HMAC signature
   * @param {string} body - Raw request body
   * @param {string} hmacHeader - X-Shopify-Hmac-SHA256 header
   * @returns {boolean} True if valid
   * @throws {WebhookVerificationError} If verification fails
   */
  verify(body, hmacHeader) {
    if (!hmacHeader) {
      logger.warn('Webhook received without HMAC header');
      throw new WebhookVerificationError('Missing HMAC header');
    }

    if (!body) {
      throw new WebhookVerificationError('Missing request body');
    }

    // Calculate expected HMAC
    const calculatedHmac = crypto
      .createHmac('sha256', config.security.webhookSecret)
      .update(body, 'utf8')
      .digest('base64');

    // Constant-time comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(hmacHeader),
      Buffer.from(calculatedHmac)
    );

    if (!isValid) {
      logger.warn('Webhook HMAC verification failed');
      throw new WebhookVerificationError('Invalid HMAC signature');
    }

    logger.debug('Webhook HMAC verified successfully');
    return true;
  }

  /**
   * Extracts webhook metadata from headers
   * @param {Object} headers - Request headers
   * @returns {Object} Webhook metadata
   */
  extractMetadata(headers) {
    return {
      webhookId: headers['x-shopify-webhook-id'],
      topic: headers['x-shopify-topic'],
      shop: headers['x-shopify-shop-domain'],
      apiVersion: headers['x-shopify-api-version'],
    };
  }

  /**
   * Validates webhook metadata
   * @param {Object} metadata - Webhook metadata
   * @returns {boolean} True if valid
   */
  validateMetadata(metadata) {
    if (!metadata.webhookId) {
      throw new WebhookVerificationError('Missing webhook ID');
    }

    if (!metadata.topic) {
      throw new WebhookVerificationError('Missing webhook topic');
    }

    if (!metadata.shop) {
      throw new WebhookVerificationError('Missing shop domain');
    }

    return true;
  }
}

module.exports = new WebhookVerifier();
