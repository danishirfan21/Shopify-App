/**
 * Authentication Middleware
 * Verifies shop session for API requests
 */

const ShopRepository = require('../repositories/ShopRepository');
const { AuthenticationError } = require('../utils/errors');
const createLogger = require('../utils/logger');

const logger = createLogger('Authentication');

/**
 * Middleware to verify shop authentication
 * Expects shopId in session (set during OAuth callback)
 */
async function authenticate(req, res, next) {
  try {
    // Check if session exists and has shopId
    if (!req.session || !req.session.shopId) {
      throw new AuthenticationError('Not authenticated - please install the app');
    }

    const shopId = req.session.shopId;

    // Verify shop exists and is active
    const shop = await ShopRepository.findById(shopId);

    if (!shop || !shop.is_active) {
      throw new AuthenticationError('Shop not found or inactive');
    }

    // Attach shop info to request
    req.shopId = shop.id;
    req.shop = shop.shop_domain;

    logger.debug('Request authenticated', { shop: shop.shop_domain });

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional authentication middleware
 * Doesn't fail if not authenticated, just doesn't set shop info
 */
async function optionalAuth(req, res, next) {
  try {
    if (req.session && req.session.shopId) {
      const shop = await ShopRepository.findById(req.session.shopId);
      if (shop && shop.is_active) {
        req.shopId = shop.id;
        req.shop = shop.shop_domain;
      }
    }
    next();
  } catch (error) {
    // Don't fail on optional auth errors
    next();
  }
}

module.exports = {
  authenticate,
  optionalAuth,
};
