/**
 * Order Fetcher Service
 * Fetches orders from Shopify GraphQL API with pagination
 */

const ShopifyAPIClient = require('./ShopifyAPIClient');
const { FETCH_ORDERS } = require('../../graphql/queries/orders');
const { PAGINATION } = require('../../config/shopify');
const {
  transformOrderFromShopify,
  transformLineItemsFromShopify,
  transformCustomerFromShopify,
} = require('../../utils/transformers');
const OrderRepository = require('../../repositories/OrderRepository');
const CustomerRepository = require('../../repositories/CustomerRepository');
const { query } = require('../../database/connection');
const createLogger = require('../../utils/logger');

const logger = createLogger('OrderFetcher');

class OrderFetcher {
  constructor(shop, accessToken) {
    this.client = new ShopifyAPIClient(shop, accessToken);
    this.shop = shop;
  }

  /**
   * Fetches all orders with pagination
   * @param {number} shopId - Internal shop ID
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Sync stats
   */
  async fetchAllOrders(shopId, onProgress = null) {
    let hasNextPage = true;
    let cursor = null;
    let totalProcessed = 0;
    let totalCreated = 0;
    let totalUpdated = 0;

    logger.info('Starting full order fetch', { shop: this.shop });

    while (hasNextPage) {
      try {
        // Fetch page of orders
        const data = await this.client.graphql(
          FETCH_ORDERS,
          {
            first: PAGINATION.DEFAULT_PAGE_SIZE,
            after: cursor,
          },
          50 // Estimated cost for order query
        );

        const orders = data.orders.edges;
        hasNextPage = data.orders.pageInfo.hasNextPage;
        cursor = data.orders.pageInfo.endCursor;

        logger.info(`Fetched ${orders.length} orders`, {
          shop: this.shop,
          hasNextPage,
        });

        // Process each order
        for (const edge of orders) {
          const shopifyOrder = edge.node;

          try {
            const stats = await this.processOrder(shopId, shopifyOrder);
            totalProcessed++;
            if (stats.created) totalCreated++;
            if (stats.updated) totalUpdated++;
          } catch (error) {
            logger.error('Failed to process order', {
              shop: this.shop,
              orderId: shopifyOrder.id,
              error: error.message,
            });
          }
        }

        // Progress callback
        if (onProgress) {
          onProgress({
            processed: totalProcessed,
            created: totalCreated,
            updated: totalUpdated,
            hasMore: hasNextPage,
          });
        }
      } catch (error) {
        logger.error('Failed to fetch orders page', {
          shop: this.shop,
          cursor,
          error: error.message,
        });
        throw error;
      }
    }

    logger.info('Order fetch completed', {
      shop: this.shop,
      totalProcessed,
      totalCreated,
      totalUpdated,
    });

    return {
      processed: totalProcessed,
      created: totalCreated,
      updated: totalUpdated,
    };
  }

  /**
   * Processes a single order (upsert with customer and line items)
   * @param {number} shopId - Internal shop ID
   * @param {Object} shopifyOrder - Order from Shopify API
   * @returns {Promise<Object>} Processing stats
   */
  async processOrder(shopId, shopifyOrder) {
    // Transform order data
    const orderData = transformOrderFromShopify(shopifyOrder, shopId);

    // Process customer if exists
    let customerId = null;
    if (shopifyOrder.customer) {
      customerId = await this.processCustomer(shopId, shopifyOrder.customer);
      orderData.customer_id = customerId;
    }

    // Check if order exists
    const existingOrder = await OrderRepository.findByShopifyId(
      shopId,
      orderData.shopify_order_id
    );

    // Upsert order
    const orderId = await OrderRepository.upsertOrder(orderData);

    // Process line items
    const lineItems = shopifyOrder.lineItems?.edges || [];
    if (lineItems.length > 0) {
      await this.processLineItems(
        existingOrder ? existingOrder.id : orderId,
        lineItems
      );
    }

    // Update customer aggregates if customer exists
    if (customerId) {
      await CustomerRepository.updateAggregates(customerId);

      // Update first-touch attribution if this is first order
      if (orderData.utm_source) {
        await CustomerRepository.updateFirstTouchAttribution(customerId, {
          utm_source: orderData.utm_source,
          utm_medium: orderData.utm_medium,
          utm_campaign: orderData.utm_campaign,
        });
      }
    }

    return {
      orderId: existingOrder ? existingOrder.id : orderId,
      created: !existingOrder,
      updated: !!existingOrder,
    };
  }

  /**
   * Processes customer (upsert)
   * @param {number} shopId - Internal shop ID
   * @param {Object} shopifyCustomer - Customer from Shopify
   * @returns {Promise<number>} Customer ID
   */
  async processCustomer(shopId, shopifyCustomer) {
    const customerData = transformCustomerFromShopify(shopifyCustomer, shopId);

    // Check if customer exists
    const existing = await CustomerRepository.findByShopifyId(
      shopId,
      customerData.shopify_customer_id
    );

    if (existing) {
      await CustomerRepository.update(existing.id, customerData);
      return existing.id;
    } else {
      return await CustomerRepository.create(customerData);
    }
  }

  /**
   * Processes line items for an order
   * @param {number} orderId - Internal order ID
   * @param {Array} lineItemEdges - Line items from Shopify
   */
  async processLineItems(orderId, lineItemEdges) {
    const lineItems = lineItemEdges.map((edge) => edge.node);
    const transformedItems = transformLineItemsFromShopify(lineItems, orderId);

    // Delete existing line items for this order
    await query('DELETE FROM line_items WHERE order_id = ?', [orderId]);

    // Insert new line items
    for (const item of transformedItems) {
      await query(
        `INSERT INTO line_items (
          order_id, shopify_line_item_id, product_id, variant_id,
          title, variant_title, sku, quantity, price, total_discount,
          fulfillment_status, requires_shipping, is_gift_card, taxable
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.order_id,
          item.shopify_line_item_id,
          item.product_id,
          item.variant_id,
          item.title,
          item.variant_title,
          item.sku,
          item.quantity,
          item.price,
          item.total_discount,
          item.fulfillment_status,
          item.requires_shipping,
          item.is_gift_card,
          item.taxable,
        ]
      );
    }
  }
}

module.exports = OrderFetcher;
