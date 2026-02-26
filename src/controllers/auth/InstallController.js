/**
 * Install Controller
 * Handles app installation OAuth flow initiation
 */

const OAuthService = require('../../services/auth/OAuthService');
const { validateShopDomain } = require('../../utils/validators');
const { ValidationError } = require('../../utils/errors');
const createLogger = require('../../utils/logger');

const logger = createLogger('InstallController');

class InstallController {
  /**
   * Initiates OAuth flow
   * GET /auth/install?shop=store.myshopify.com
   */
  async install(req, res, next) {
    try {
      const { shop } = req.query;

      if (!shop) {
        throw new ValidationError('Missing shop parameter');
      }

      // Validate shop domain
      validateShopDomain(shop);

      // Generate nonce for CSRF protection
      const nonce = OAuthService.generateNonce();

      // Store nonce in session
      req.session = req.session || {};
      req.session.nonce = nonce;
      req.session.shop = shop;

      // Generate authorization URL
      const authUrl = OAuthService.generateAuthUrl(shop, nonce);

      logger.info('Initiating OAuth flow', { shop });

      // Redirect to Shopify authorization page
      res.redirect(authUrl);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new InstallController();
