/**
 * OAuth Service
 * Handles Shopify OAuth 2.0 flow
 */

const axios = require('axios');
const crypto = require('crypto');
const config = require('../../config');
const { SCOPES } = require('../../config/shopify');
const ShopRepository = require('../../repositories/ShopRepository');
const { validateShopDomain, validateHMAC } = require('../../utils/validators');
const { AuthenticationError } = require('../../utils/errors');
const createLogger = require('../../utils/logger');

const logger = createLogger('OAuthService');

class OAuthService {
  /**
   * Generates OAuth authorization URL
   * @param {string} shop - Shop domain
   * @param {string} nonce - Random state parameter
   * @returns {string} Authorization URL
   */
  generateAuthUrl(shop, nonce) {
    validateShopDomain(shop);

    const params = new URLSearchParams({
      client_id: config.shopify.apiKey,
      scope: SCOPES.join(','),
      redirect_uri: `${config.app.url}/auth/callback`,
      state: nonce,
      'grant_options[]': 'per-user', // Optional: for online access tokens
    });

    return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
  }

  /**
   * Validates OAuth callback parameters
   * @param {Object} query - Query parameters from callback
   * @returns {boolean} True if valid
   * @throws {AuthenticationError} If validation fails
   */
  validateCallback(query) {
    const { code, hmac, state, shop } = query;

    // Verify required parameters
    if (!code || !hmac || !shop) {
      throw new AuthenticationError('Missing required OAuth parameters');
    }

    // Validate shop domain
    validateShopDomain(shop);

    // Verify HMAC signature
    if (!validateHMAC(query, hmac, config.shopify.apiSecret)) {
      logger.warn('HMAC validation failed', { shop });
      throw new AuthenticationError('Invalid HMAC signature');
    }

    return true;
  }

  /**
   * Exchanges authorization code for access token
   * @param {string} shop - Shop domain
   * @param {string} code - Authorization code
   * @returns {Promise<Object>} Token response
   */
  async exchangeCodeForToken(shop, code) {
    validateShopDomain(shop);

    const url = `https://${shop}/admin/oauth/access_token`;
    const payload = {
      client_id: config.shopify.apiKey,
      client_secret: config.shopify.apiSecret,
      code,
    };

    try {
      logger.info('Exchanging authorization code for access token', { shop });

      const response = await axios.post(url, payload);
      const { access_token, scope } = response.data;

      if (!access_token) {
        throw new AuthenticationError('No access token received');
      }

      // Verify granted scopes match requested scopes
      const grantedScopes = scope.split(',').map((s) => s.trim());
      const missingScopes = SCOPES.filter((s) => !grantedScopes.includes(s));

      if (missingScopes.length > 0) {
        logger.warn('Missing required scopes', { shop, missingScopes });
      }

      logger.info('Access token obtained successfully', { shop });

      return {
        access_token,
        scope: grantedScopes.join(','),
      };
    } catch (error) {
      logger.error('Failed to exchange code for token', {
        shop,
        error: error.message,
      });

      if (error.response) {
        throw new AuthenticationError(
          `OAuth token exchange failed: ${error.response.data?.error || error.message}`
        );
      }

      throw new AuthenticationError('OAuth token exchange failed');
    }
  }

  /**
   * Installs app for a shop (creates shop record)
   * @param {string} shopDomain - Shop domain
   * @param {string} accessToken - OAuth access token
   * @param {string} scope - Granted scopes
   * @returns {Promise<number>} Shop ID
   */
  async installShop(shopDomain, accessToken, scope) {
    try {
      // Check if shop already exists
      const existingShop = await ShopRepository.findByDomain(shopDomain);

      if (existingShop) {
        // Update existing installation
        logger.info('Updating existing shop installation', {
          shop: shopDomain,
        });

        await ShopRepository.update(existingShop.id, {
          access_token: accessToken, // Will be encrypted in repository
          scope,
          is_active: true,
          installation_date: new Date(),
        });

        return existingShop.id;
      } else {
        // Create new installation
        logger.info('Creating new shop installation', { shop: shopDomain });

        const shopId = await ShopRepository.createShop({
          shop_domain: shopDomain,
          access_token: accessToken, // Will be encrypted in repository
          scope,
          is_active: true,
          installation_date: new Date(),
        });

        return shopId;
      }
    } catch (error) {
      logger.error('Failed to install shop', {
        shop: shopDomain,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Generates secure random nonce for OAuth state parameter
   * @returns {string} Random nonce
   */
  generateNonce() {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Verifies shop has valid access token
   * @param {string} shopDomain - Shop domain
   * @returns {Promise<boolean>} True if shop has valid token
   */
  async verifyShopAccess(shopDomain) {
    const shop = await ShopRepository.findByDomain(shopDomain);

    if (!shop || !shop.is_active || !shop.access_token) {
      return false;
    }

    return true;
  }
}

module.exports = new OAuthService();
