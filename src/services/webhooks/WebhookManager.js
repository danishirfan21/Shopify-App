/**
 * Webhook Manager
 * Registers webhooks with Shopify
 */

const ShopifyAPIClient = require('../shopify/ShopifyAPIClient');
const { WEBHOOK_TOPICS } = require('../../config/shopify');
const config = require('../../config');
const createLogger = require('../../utils/logger');

const logger = createLogger('WebhookManager');

class WebhookManager {
  constructor(shop, accessToken) {
    this.client = new ShopifyAPIClient(shop, accessToken);
    this.shop = shop;
  }

  /**
   * Registers all required webhooks
   * @returns {Promise<Array>} Registered webhooks
   */
  async registerAll() {
    const webhooks = [];

    const topics = [
      WEBHOOK_TOPICS.ORDERS_CREATE,
      WEBHOOK_TOPICS.ORDERS_UPDATED,
      WEBHOOK_TOPICS.ORDERS_CANCELLED,
      WEBHOOK_TOPICS.CUSTOMERS_CREATE,
      WEBHOOK_TOPICS.CUSTOMERS_UPDATE,
      WEBHOOK_TOPICS.APP_UNINSTALLED,
    ];

    for (const topic of topics) {
      try {
        const webhook = await this.register(topic);
        webhooks.push(webhook);
        logger.info('Webhook registered', { shop: this.shop, topic });
      } catch (error) {
        logger.error('Failed to register webhook', {
          shop: this.shop,
          topic,
          error: error.message,
        });
      }
    }

    return webhooks;
  }

  /**
   * Registers a single webhook
   * @param {string} topic - Webhook topic
   * @returns {Promise<Object>} Webhook data
   */
  async register(topic) {
    const address = `${config.app.url}/webhooks/${topic.replace('/', '-')}`;

    const mutation = `
      mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
        webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
          webhookSubscription {
            id
            topic
            endpoint {
              __typename
              ... on WebhookHttpEndpoint {
                callbackUrl
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      topic: topic.toUpperCase().replace('/', '_'),
      webhookSubscription: {
        callbackUrl: address,
        format: 'JSON',
      },
    };

    const data = await this.client.graphql(mutation, variables, 10);

    if (data.webhookSubscriptionCreate.userErrors.length > 0) {
      throw new Error(
        data.webhookSubscriptionCreate.userErrors[0].message
      );
    }

    return data.webhookSubscriptionCreate.webhookSubscription;
  }

  /**
   * Lists all registered webhooks
   * @returns {Promise<Array>} Webhooks
   */
  async list() {
    const query = `
      query {
        webhookSubscriptions(first: 50) {
          edges {
            node {
              id
              topic
              endpoint {
                __typename
                ... on WebhookHttpEndpoint {
                  callbackUrl
                }
              }
            }
          }
        }
      }
    `;

    const data = await this.client.graphql(query, {}, 5);
    return data.webhookSubscriptions.edges.map((edge) => edge.node);
  }

  /**
   * Deletes a webhook
   * @param {string} webhookId - Webhook ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(webhookId) {
    const mutation = `
      mutation webhookSubscriptionDelete($id: ID!) {
        webhookSubscriptionDelete(id: $id) {
          deletedWebhookSubscriptionId
          userErrors {
            field
            message
          }
        }
      }
    `;

    const data = await this.client.graphql(mutation, { id: webhookId }, 10);

    if (data.webhookSubscriptionDelete.userErrors.length > 0) {
      throw new Error(
        data.webhookSubscriptionDelete.userErrors[0].message
      );
    }

    logger.info('Webhook deleted', { shop: this.shop, webhookId });
    return true;
  }
}

module.exports = WebhookManager;
