/**
 * Shopify API Client
 * Handles GraphQL and REST API requests to Shopify with rate limiting
 */

const axios = require('axios');
const config = require('../../config');
const { getGraphQLEndpoint, getRESTEndpoint } = require('../../config/shopify');
const RateLimiter = require('./RateLimiter');
const { ShopifyAPIError, RateLimitError } = require('../../utils/errors');
const createLogger = require('../../utils/logger');

const logger = createLogger('ShopifyAPIClient');

class ShopifyAPIClient {
  constructor(shop, accessToken) {
    this.shop = shop;
    this.accessToken = accessToken;
    this.graphqlEndpoint = getGraphQLEndpoint(shop);
  }

  /**
   * Executes GraphQL query with automatic rate limiting
   * @param {string} query - GraphQL query string
   * @param {Object} variables - Query variables
   * @param {number} estimatedCost - Estimated query cost (default 10)
   * @returns {Promise<Object>} Query response data
   */
  async graphql(query, variables = {}, estimatedCost = 10) {
    // Wait for rate limit capacity
    await RateLimiter.waitForCapacity(this.shop, estimatedCost);

    const payload = {
      query,
      variables,
    };

    try {
      const response = await axios.post(this.graphqlEndpoint, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': this.accessToken,
        },
        timeout: config.api.requestTimeout,
      });

      // Check for GraphQL errors
      if (response.data.errors) {
        logger.error('GraphQL query returned errors', {
          shop: this.shop,
          errors: response.data.errors,
        });

        throw new ShopifyAPIError(
          `GraphQL errors: ${JSON.stringify(response.data.errors)}`,
          500,
          response.data
        );
      }

      // Update rate limiter with actual cost
      if (response.data.extensions?.cost?.throttleStatus) {
        RateLimiter.updateFromResponse(
          this.shop,
          response.data.extensions.cost.throttleStatus
        );
      }

      logger.debug('GraphQL query successful', {
        shop: this.shop,
        cost: response.data.extensions?.cost?.requestedQueryCost,
      });

      return response.data.data;
    } catch (error) {
      return this._handleAPIError(error, 'GraphQL');
    }
  }

  /**
   * Makes REST API request
   * @param {string} resource - Resource path (e.g., 'orders.json')
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async rest(resource, options = {}) {
    const { method = 'GET', data = null, params = {} } = options;

    const url = getRESTEndpoint(this.shop, resource);

    try {
      const response = await axios({
        method,
        url,
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': this.accessToken,
        },
        params,
        data,
        timeout: config.api.requestTimeout,
      });

      // Check rate limit headers
      const callLimit = response.headers['x-shopify-shop-api-call-limit'];
      if (callLimit) {
        logger.debug('REST API rate limit', {
          shop: this.shop,
          limit: callLimit,
        });
      }

      return response.data;
    } catch (error) {
      return this._handleAPIError(error, 'REST');
    }
  }

  /**
   * Handles API errors consistently
   * @private
   */
  _handleAPIError(error, apiType) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      // Rate limit errors (429)
      if (status === 429) {
        const retryAfter = error.response.headers['retry-after'];
        logger.warn(`${apiType} API rate limit exceeded`, {
          shop: this.shop,
          retryAfter,
        });

        throw new RateLimitError(
          'API rate limit exceeded',
          retryAfter ? parseInt(retryAfter, 10) : null
        );
      }

      // Authentication errors (401, 403)
      if (status === 401 || status === 403) {
        logger.error(`${apiType} API authentication failed`, {
          shop: this.shop,
          status,
        });

        throw new ShopifyAPIError(
          'Authentication failed - invalid or expired token',
          status,
          data
        );
      }

      // Other API errors
      logger.error(`${apiType} API request failed`, {
        shop: this.shop,
        status,
        error: data,
      });

      throw new ShopifyAPIError(
        data?.errors || error.message,
        status,
        data
      );
    }

    // Network errors
    logger.error(`${apiType} API network error`, {
      shop: this.shop,
      error: error.message,
    });

    throw new ShopifyAPIError(`Network error: ${error.message}`, 500);
  }

  /**
   * Gets shop information
   * @returns {Promise<Object>} Shop data
   */
  async getShop() {
    const query = `
      query {
        shop {
          id
          name
          email
          currencyCode
          ianaTimezone
          plan {
            displayName
          }
        }
      }
    `;

    const data = await this.graphql(query, {}, 2);
    return data.shop;
  }

  /**
   * Tests if API credentials are valid
   * @returns {Promise<boolean>} True if valid
   */
  async testConnection() {
    try {
      await this.getShop();
      return true;
    } catch (error) {
      logger.error('API connection test failed', {
        shop: this.shop,
        error: error.message,
      });
      return false;
    }
  }
}

module.exports = ShopifyAPIClient;
