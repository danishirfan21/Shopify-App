/**
 * Session Token Authentication Middleware
 * Verifies Shopify JWT session tokens sent in the Authorization header.
 */

const { shopifyApi, LATEST_API_VERSION } = require('@shopify/shopify-api');
require('@shopify/shopify-api/adapters/node');
const config = require('../config');
const ShopRepository = require('../repositories/ShopRepository');
const { AuthenticationError } = require('../utils/errors');
const createLogger = require('../utils/logger');

const logger = createLogger('SessionTokenAuth');

// Initialize Shopify API
const shopify = shopifyApi({
  apiKey: config.shopify.apiKey,
  apiSecretKey: config.shopify.apiSecret,
  scopes: config.shopify.scopes,
  hostName: config.app.url.replace(/https?:\/\//, ''),
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: true,
});

/**
 * Middleware to verify Shopify App Bridge session tokens
 */
async function sessionTokenAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No session token provided');
    }

    const token = authHeader.split(' ')[1];

    // Verify the JWT session token
    // Using the shopify-api library to validate the token
    const payload = await shopify.session.decodeSessionToken(token);

    // The payload contains 'dest' which is the shop URL (e.g., https://store.myshopify.com)
    const shopDomain = payload.dest.replace('https://', '');

    // Verify shop exists and is active in our database
    const shop = await ShopRepository.findByDomain(shopDomain);

    if (!shop || !shop.is_active) {
      throw new AuthenticationError('Shop not found or inactive');
    }

    // Attach shop info to request
    req.shopId = shop.id;
    req.shop = shop.shop_domain;

    logger.debug('Session token authenticated', { shop: shop.shop_domain });

    next();
  } catch (error) {
    logger.warn('Session token authentication failed', { error: error.message });
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired session token'
    });
  }
}

module.exports = {
  sessionTokenAuth,
};
