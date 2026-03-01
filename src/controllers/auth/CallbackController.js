/**
 * OAuth Callback Controller
 * Handles OAuth callback from Shopify
 */

const OAuthService = require('../../services/auth/OAuthService');
const SyncOrchestrator = require('../../services/sync/SyncOrchestrator');
const { AuthenticationError } = require('../../utils/errors');
const createLogger = require('../../utils/logger');

const logger = createLogger('CallbackController');

class CallbackController {
  /**
   * Handles OAuth callback
   * GET /auth/callback?code=xxx&shop=xxx&state=xxx&hmac=xxx
   */
  async callback(req, res, next) {
    try {
      const { code, shop, state, hmac } = req.query;

      // Verify nonce matches (CSRF protection)
      if (!req.session || state !== req.session.nonce) {
        throw new AuthenticationError('Invalid state parameter - possible CSRF attack');
      }

      // Verify shop matches session
      if (shop !== req.session.shop) {
        throw new AuthenticationError('Shop mismatch');
      }

      // Validate callback parameters and HMAC
      OAuthService.validateCallback(req.query);

      logger.info('OAuth callback received', { shop });

      // Exchange code for access token
      const { access_token, scope } = await OAuthService.exchangeCodeForToken(
        shop,
        code
      );

      // Install shop (create/update shop record)
      const shopId = await OAuthService.installShop(shop, access_token, scope);

      logger.info('Shop installed successfully', { shop, shopId });

      // Clear session
      delete req.session.nonce;
      delete req.session.shop;

      // Store shop in session for authentication
      req.session.shopId = shopId;
      req.session.shopDomain = shop;

      // Trigger initial sync in background (don't await)
      SyncOrchestrator.fullSync(shopId).catch((error) => {
        logger.error('Initial sync failed', { shop, error: error.message });
      });

      // Redirect to app dashboard (embedded app URL)
      const host = Buffer.from(`${shop}/admin`).toString('base64');
      const redirectUrl = `https://${shop}/admin/apps/${process.env.SHOPIFY_API_KEY}?host=${host}`;

      res.redirect(redirectUrl);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CallbackController();
