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

      // Redirect to app dashboard or success page
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Installation Successful</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: #f6f6f7;
            }
            .container {
              text-align: center;
              background: white;
              padding: 40px;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            h1 { color: #5c6ac4; margin-bottom: 16px; }
            p { color: #637381; margin-bottom: 24px; }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background: #5c6ac4;
              color: white;
              text-decoration: none;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✓ Installation Successful!</h1>
            <p>Your Shopify Attribution & Order Inspector app has been installed.</p>
            <p>Initial data sync is running in the background.</p>
            <a href="/api/orders" class="button">View API Documentation</a>
          </div>
        </body>
        </html>
      `);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CallbackController();
