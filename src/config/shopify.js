/**
 * Shopify-specific Configuration
 * API endpoints, scopes, and webhook topics
 */

const config = require('./index');

/**
 * Shopify GraphQL Admin API endpoint builder
 * @param {string} shop - Shop domain (e.g., 'example.myshopify.com')
 * @returns {string} Full GraphQL API endpoint
 */
function getGraphQLEndpoint(shop) {
  return `https://${shop}/admin/api/${config.shopify.apiVersion}/graphql.json`;
}

/**
 * Shopify REST Admin API endpoint builder
 * @param {string} shop - Shop domain
 * @param {string} resource - REST resource path
 * @returns {string} Full REST API endpoint
 */
function getRESTEndpoint(shop, resource) {
  return `https://${shop}/admin/api/${config.shopify.apiVersion}/${resource}`;
}

/**
 * Required OAuth scopes
 * read_orders: Fetch order data
 * read_customers: Customer information for attribution
 * read_products: Product details for line items
 * read_analytics: Access to analytics API (optional)
 */
const SCOPES = config.shopify.scopes;

/**
 * Webhook topics to register
 * These webhooks keep our local data synchronized with Shopify
 */
const WEBHOOK_TOPICS = {
  ORDERS_CREATE: 'orders/create',
  ORDERS_UPDATED: 'orders/updated',
  ORDERS_CANCELLED: 'orders/cancelled',
  CUSTOMERS_CREATE: 'customers/create',
  CUSTOMERS_UPDATE: 'customers/update',
  APP_UNINSTALLED: 'app/uninstalled',
};

/**
 * GraphQL query cost limits
 * Shopify uses a leaky bucket algorithm:
 * - 1000 points maximum
 * - Refills at 50 points/second
 * - Queries cost varies (simple query: ~2-10 points, complex: 50-100+)
 */
const RATE_LIMIT = {
  MAX_COST: 1000,
  REFILL_RATE: 50, // points per second
  MIN_AVAILABLE: 100, // Minimum points before throttling
};

/**
 * Pagination settings for bulk operations
 */
const PAGINATION = {
  DEFAULT_PAGE_SIZE: 50, // Orders per GraphQL request
  MAX_PAGE_SIZE: 250, // Shopify maximum
  BULK_OPERATION_POLL_INTERVAL: 1000, // ms between bulk operation status checks
};

module.exports = {
  SCOPES,
  WEBHOOK_TOPICS,
  RATE_LIMIT,
  PAGINATION,
  getGraphQLEndpoint,
  getRESTEndpoint,
};
