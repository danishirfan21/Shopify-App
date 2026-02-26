/**
 * Orders Webhook Controller
 * Handles order-related webhooks from Shopify
 */

const WebhookVerifier = require('../../services/webhooks/WebhookVerifier');
const WebhookProcessor = require('../../services/webhooks/WebhookProcessor');
const ShopRepository = require('../../repositories/ShopRepository');
const { query } = require('../../database/connection');
const createLogger = require('../../utils/logger');

const logger = createLogger('OrdersWebhookController');

class OrdersWebhookController {
  /**
   * Handles orders/create webhook
   * POST /webhooks/orders-create
   */
  async ordersCreate(req, res, next) {
    try {
      // Verify webhook HMAC
      const hmac = req.headers['x-shopify-hmac-sha256'];
      WebhookVerifier.verify(req.rawBody, hmac);

      // Extract metadata
      const metadata = WebhookVerifier.extractMetadata(req.headers);
      WebhookVerifier.validateMetadata(metadata);

      logger.info('Orders create webhook received', {
        shop: metadata.shop,
        webhookId: metadata.webhookId,
      });

      // Get shop
      const shop = await ShopRepository.findByDomain(metadata.shop);
      if (!shop) {
        logger.warn('Webhook received for unknown shop', {
          shop: metadata.shop,
        });
        // Return 200 to prevent Shopify from retrying
        return res.status(200).send('OK');
      }

      // Check for duplicate webhook
      const existing = await query(
        'SELECT id FROM webhook_events WHERE shopify_webhook_id = ?',
        [metadata.webhookId]
      );

      if (existing.length > 0) {
        logger.info('Duplicate webhook ignored', {
          webhookId: metadata.webhookId,
        });
        return res.status(200).send('OK');
      }

      // Store webhook event for async processing
      const eventId = await this.storeWebhookEvent(
        shop.id,
        metadata,
        req.body
      );

      // Respond immediately (< 200ms for Shopify)
      res.status(200).send('OK');

      // Process webhook asynchronously
      WebhookProcessor.processWebhook(eventId).catch((error) => {
        logger.error('Webhook processing failed', {
          eventId,
          error: error.message,
        });
      });
    } catch (error) {
      // Log error but return 200 to prevent retries for verification failures
      logger.error('Webhook handling failed', { error: error.message });
      res.status(200).send('OK');
    }
  }

  /**
   * Handles orders/updated webhook
   * POST /webhooks/orders-updated
   */
  async ordersUpdated(req, res, next) {
    // Same logic as ordersCreate
    return this.ordersCreate(req, res, next);
  }

  /**
   * Handles orders/cancelled webhook
   * POST /webhooks/orders-cancelled
   */
  async ordersCancelled(req, res, next) {
    // Same logic as ordersCreate
    return this.ordersCreate(req, res, next);
  }

  /**
   * Handles app/uninstalled webhook
   * POST /webhooks/app-uninstalled
   */
  async appUninstalled(req, res, next) {
    try {
      const hmac = req.headers['x-shopify-hmac-sha256'];
      WebhookVerifier.verify(req.rawBody, hmac);

      const metadata = WebhookVerifier.extractMetadata(req.headers);

      logger.info('App uninstalled webhook received', {
        shop: metadata.shop,
      });

      const shop = await ShopRepository.findByDomain(metadata.shop);
      if (shop) {
        await this.storeWebhookEvent(shop.id, metadata, req.body);
      }

      res.status(200).send('OK');
    } catch (error) {
      logger.error('App uninstall webhook failed', {
        error: error.message,
      });
      res.status(200).send('OK');
    }
  }

  /**
   * Stores webhook event in database for async processing
   * @private
   */
  async storeWebhookEvent(shopId, metadata, payload) {
    const sql = `
      INSERT INTO webhook_events (
        shop_id, topic, shopify_webhook_id, payload, status, received_at
      ) VALUES (?, ?, ?, ?, 'pending', NOW())
    `;

    const result = await query(sql, [
      shopId,
      metadata.topic,
      metadata.webhookId,
      JSON.stringify(payload),
    ]);

    return result.insertId;
  }
}

module.exports = new OrdersWebhookController();
