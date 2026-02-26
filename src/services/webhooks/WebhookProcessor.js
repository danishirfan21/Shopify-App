/**
 * Webhook Processor
 * Processes webhook events asynchronously
 */

const OrderFetcher = require('../shopify/OrderFetcher');
const ShopRepository = require('../../repositories/ShopRepository');
const { query } = require('../../database/connection');
const createLogger = require('../../utils/logger');

const logger = createLogger('WebhookProcessor');

class WebhookProcessor {
  /**
   * Processes a webhook event
   * @param {number} eventId - Webhook event ID
   * @returns {Promise<void>}
   */
  async processWebhook(eventId) {
    // Fetch webhook event
    const sql = 'SELECT * FROM webhook_events WHERE id = ?';
    const results = await query(sql, [eventId]);

    if (results.length === 0) {
      logger.warn('Webhook event not found', { eventId });
      return;
    }

    const event = results[0];

    // Mark as processing
    await query(
      'UPDATE webhook_events SET status = ?, processed_at = NOW() WHERE id = ?',
      ['processing', eventId]
    );

    try {
      // Route to appropriate handler based on topic
      switch (event.topic) {
        case 'orders/create':
        case 'orders/updated':
          await this.handleOrderWebhook(event);
          break;

        case 'orders/cancelled':
          await this.handleOrderCancelled(event);
          break;

        case 'customers/create':
        case 'customers/update':
          await this.handleCustomerWebhook(event);
          break;

        case 'app/uninstalled':
          await this.handleAppUninstalled(event);
          break;

        default:
          logger.warn('Unknown webhook topic', { topic: event.topic });
      }

      // Mark as processed
      await query('UPDATE webhook_events SET status = ? WHERE id = ?', [
        'processed',
        eventId,
      ]);

      logger.info('Webhook processed successfully', {
        eventId,
        topic: event.topic,
      });
    } catch (error) {
      logger.error('Webhook processing failed', {
        eventId,
        topic: event.topic,
        error: error.message,
      });

      // Update retry count
      const retryCount = event.retry_count + 1;

      if (retryCount >= event.max_retries) {
        // Max retries reached, mark as failed
        await query(
          'UPDATE webhook_events SET status = ?, retry_count = ?, error_message = ? WHERE id = ?',
          ['failed', retryCount, error.message, eventId]
        );
      } else {
        // Reset to pending for retry
        await query(
          'UPDATE webhook_events SET status = ?, retry_count = ?, error_message = ? WHERE id = ?',
          ['pending', retryCount, error.message, eventId]
        );
      }

      throw error;
    }
  }

  /**
   * Handles order create/update webhook
   */
  async handleOrderWebhook(event) {
    const payload = JSON.parse(event.payload);

    // Get shop
    const shop = await ShopRepository.findById(event.shop_id);
    if (!shop) {
      throw new Error('Shop not found');
    }

    // Transform webhook payload to GraphQL format
    // Note: Webhook payloads use REST format, need to convert
    const shopifyOrder = this.transformRESTOrderToGraphQL(payload);

    // Process order using OrderFetcher
    const fetcher = new OrderFetcher(shop.shop_domain, shop.access_token);
    await fetcher.processOrder(shop.id, shopifyOrder);

    logger.info('Order webhook processed', {
      shopifyOrderId: payload.id,
      orderName: payload.name,
    });
  }

  /**
   * Handles order cancelled webhook
   */
  async handleOrderCancelled(event) {
    const payload = JSON.parse(event.payload);

    // Update order status
    await query(
      'UPDATE orders SET cancelled_at = ?, financial_status = ? WHERE shop_id = ? AND shopify_order_id = ?',
      [new Date(payload.cancelled_at), 'voided', event.shop_id, payload.id]
    );

    logger.info('Order cancelled', { shopifyOrderId: payload.id });
  }

  /**
   * Handles customer webhook
   */
  async handleCustomerWebhook(event) {
    const payload = JSON.parse(event.payload);

    logger.info('Customer webhook received', {
      customerId: payload.id,
      email: payload.email,
    });

    // Customer processing can be implemented similar to orders
    // For now, we log it
  }

  /**
   * Handles app uninstalled webhook
   */
  async handleAppUninstalled(event) {
    logger.info('App uninstalled', { shopId: event.shop_id });

    // Mark shop as inactive and clear token
    await ShopRepository.markUninstalled(event.shop_id);
  }

  /**
   * Transforms REST API order to GraphQL format
   * This is a simplified transformation - webhook payloads use REST format
   * @private
   */
  transformRESTOrderToGraphQL(restOrder) {
    return {
      id: `gid://shopify/Order/${restOrder.id}`,
      name: restOrder.name,
      email: restOrder.email,
      createdAt: restOrder.created_at,
      updatedAt: restOrder.updated_at,
      processedAt: restOrder.processed_at,
      cancelledAt: restOrder.cancelled_at,
      closedAt: restOrder.closed_at,
      orderNumber: restOrder.order_number,
      displayFinancialStatus: restOrder.financial_status?.toUpperCase(),
      displayFulfillmentStatus: restOrder.fulfillment_status?.toUpperCase(),
      currencyCode: restOrder.currency,

      totalPriceSet: {
        shopMoney: {
          amount: restOrder.total_price,
          currencyCode: restOrder.currency,
        },
      },

      subtotalPriceSet: {
        shopMoney: { amount: restOrder.subtotal_price },
      },

      totalTaxSet: {
        shopMoney: { amount: restOrder.total_tax },
      },

      totalDiscountsSet: {
        shopMoney: { amount: restOrder.total_discounts },
      },

      totalShippingPriceSet: {
        shopMoney: { amount: restOrder.total_shipping_price_set?.shop_money?.amount || '0' },
      },

      customer: restOrder.customer
        ? {
            id: `gid://shopify/Customer/${restOrder.customer.id}`,
            email: restOrder.customer.email,
            firstName: restOrder.customer.first_name,
            lastName: restOrder.customer.last_name,
            phone: restOrder.customer.phone,
            numberOfOrders: restOrder.customer.orders_count || 0,
            amountSpent: {
              amount: restOrder.customer.total_spent || '0',
            },
            createdAt: restOrder.customer.created_at,
            acceptsMarketing: restOrder.customer.accepts_marketing,
            state: restOrder.customer.state,
          }
        : null,

      lineItems: {
        edges: (restOrder.line_items || []).map((item) => ({
          node: {
            id: `gid://shopify/LineItem/${item.id}`,
            title: item.title,
            variantTitle: item.variant_title,
            sku: item.sku,
            quantity: item.quantity,
            originalUnitPriceSet: {
              shopMoney: { amount: item.price },
            },
            totalDiscountSet: {
              shopMoney: { amount: item.total_discount || '0' },
            },
            fulfillmentStatus: item.fulfillment_status?.toUpperCase(),
            requiresShipping: item.requires_shipping,
            taxable: item.taxable,
            giftCard: item.gift_card,
            product: item.product_id
              ? { id: `gid://shopify/Product/${item.product_id}` }
              : null,
            variant: item.variant_id
              ? { id: `gid://shopify/ProductVariant/${item.variant_id}` }
              : null,
          },
        })),
      },

      customAttributes: restOrder.note_attributes || [],
      noteAttributes: restOrder.note_attributes || [],
    };
  }
}

module.exports = new WebhookProcessor();
