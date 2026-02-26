/**
 * Rate Limiter
 * Implements token bucket algorithm for Shopify GraphQL API rate limiting
 *
 * Shopify uses a leaky bucket:
 * - Maximum 1000 points
 * - Refills at 50 points/second
 * - Each query has a cost (returned in response)
 */

const { RATE_LIMIT } = require('../../config/shopify');
const createLogger = require('../../utils/logger');

const logger = createLogger('RateLimiter');

class RateLimiter {
  constructor() {
    // Store buckets per shop
    this.buckets = new Map();
  }

  /**
   * Gets or creates bucket for a shop
   * @param {string} shop - Shop domain
   * @returns {Object} Bucket state
   */
  getBucket(shop) {
    if (!this.buckets.has(shop)) {
      this.buckets.set(shop, {
        available: RATE_LIMIT.MAX_COST,
        lastRefill: Date.now(),
        maxCost: RATE_LIMIT.MAX_COST,
        refillRate: RATE_LIMIT.REFILL_RATE,
      });
    }

    return this.buckets.get(shop);
  }

  /**
   * Refills bucket based on time elapsed
   * @param {Object} bucket - Bucket state
   */
  refillBucket(bucket) {
    const now = Date.now();
    const elapsedSeconds = (now - bucket.lastRefill) / 1000;

    // Calculate refilled points
    const refillAmount = elapsedSeconds * bucket.refillRate;

    // Update available points (capped at max)
    bucket.available = Math.min(
      bucket.maxCost,
      bucket.available + refillAmount
    );
    bucket.lastRefill = now;
  }

  /**
   * Waits until enough points are available for request
   * @param {string} shop - Shop domain
   * @param {number} cost - Query cost
   * @returns {Promise<void>}
   */
  async waitForCapacity(shop, cost = 10) {
    const bucket = this.getBucket(shop);

    // Refill based on elapsed time
    this.refillBucket(bucket);

    // If enough points available, consume and return
    if (bucket.available >= cost) {
      bucket.available -= cost;
      return;
    }

    // Calculate wait time needed
    const pointsNeeded = cost - bucket.available;
    const waitSeconds = pointsNeeded / bucket.refillRate;
    const waitMs = Math.ceil(waitSeconds * 1000);

    logger.info('Rate limit throttling', {
      shop,
      cost,
      available: bucket.available,
      waitMs,
    });

    // Wait for bucket to refill
    await this.sleep(waitMs);

    // Refill and consume
    this.refillBucket(bucket);
    bucket.available -= cost;
  }

  /**
   * Updates bucket based on actual cost from Shopify response
   * @param {string} shop - Shop domain
   * @param {Object} throttleStatus - Throttle status from GraphQL response
   */
  updateFromResponse(shop, throttleStatus) {
    if (!throttleStatus) return;

    const bucket = this.getBucket(shop);

    // Shopify returns currentlyAvailable points
    if (typeof throttleStatus.currentlyAvailable === 'number') {
      bucket.available = throttleStatus.currentlyAvailable;
      bucket.lastRefill = Date.now();

      logger.debug('Updated rate limit from response', {
        shop,
        available: bucket.available,
      });
    }

    // If we're getting close to limit, log warning
    if (bucket.available < RATE_LIMIT.MIN_AVAILABLE) {
      logger.warn('Rate limit threshold reached', {
        shop,
        available: bucket.available,
      });
    }
  }

  /**
   * Checks if request can proceed without waiting
   * @param {string} shop - Shop domain
   * @param {number} cost - Query cost
   * @returns {boolean} True if capacity available
   */
  hasCapacity(shop, cost = 10) {
    const bucket = this.getBucket(shop);
    this.refillBucket(bucket);
    return bucket.available >= cost;
  }

  /**
   * Gets current bucket status
   * @param {string} shop - Shop domain
   * @returns {Object} Bucket status
   */
  getStatus(shop) {
    const bucket = this.getBucket(shop);
    this.refillBucket(bucket);

    return {
      available: Math.floor(bucket.available),
      max: bucket.maxCost,
      percentage: (bucket.available / bucket.maxCost) * 100,
    };
  }

  /**
   * Resets bucket (useful for testing)
   * @param {string} shop - Shop domain
   */
  reset(shop) {
    this.buckets.delete(shop);
  }

  /**
   * Sleep utility
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = new RateLimiter();
