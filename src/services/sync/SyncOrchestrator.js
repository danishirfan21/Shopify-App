/**
 * Sync Orchestrator
 * Coordinates data synchronization between Shopify and local database
 */

const OrderFetcher = require('../shopify/OrderFetcher');
const WebhookManager = require('../webhooks/WebhookManager');
const ShopRepository = require('../../repositories/ShopRepository');
const { query } = require('../../database/connection');
const createLogger = require('../../utils/logger');

const logger = createLogger('SyncOrchestrator');

class SyncOrchestrator {
  /**
   * Performs full sync for a shop
   * @param {number} shopId - Internal shop ID
   * @returns {Promise<Object>} Sync results
   */
  async fullSync(shopId) {
    const shop = await ShopRepository.findById(shopId);
    if (!shop) {
      throw new Error('Shop not found');
    }

    logger.info('Starting full sync', { shop: shop.shop_domain });

    // Create sync log
    const logId = await this.createSyncLog(shopId, 'full', 'orders');

    try {
      // Update shop sync status
      await ShopRepository.updateSyncStatus(shopId, 'syncing');

      // Fetch all orders
      const fetcher = new OrderFetcher(shop.shop_domain, shop.access_token);

      const stats = await fetcher.fetchAllOrders(shopId, (progress) => {
        // Update sync log with progress
        this.updateSyncLog(logId, {
          records_processed: progress.processed,
          records_created: progress.created,
          records_updated: progress.updated,
        });
      });

      // Complete sync log
      await this.completeSyncLog(logId, stats);

      // Update shop sync status
      await ShopRepository.updateSyncStatus(shopId, 'idle', new Date());

      // Register webhooks (if not already registered)
      await this.ensureWebhooksRegistered(shop);

      logger.info('Full sync completed', {
        shop: shop.shop_domain,
        stats,
      });

      return {
        success: true,
        ...stats,
      };
    } catch (error) {
      logger.error('Full sync failed', {
        shop: shop.shop_domain,
        error: error.message,
      });

      // Mark sync as failed
      await this.failSyncLog(logId, error.message);
      await ShopRepository.updateSyncStatus(shopId, 'error');

      throw error;
    }
  }

  /**
   * Performs incremental sync (orders updated since last sync)
   * @param {number} shopId - Internal shop ID
   * @returns {Promise<Object>} Sync results
   */
  async incrementalSync(shopId) {
    const shop = await ShopRepository.findById(shopId);
    if (!shop || !shop.last_sync_at) {
      // No previous sync, perform full sync
      return await this.fullSync(shopId);
    }

    logger.info('Starting incremental sync', { shop: shop.shop_domain });

    const logId = await this.createSyncLog(shopId, 'incremental', 'orders');

    try {
      await ShopRepository.updateSyncStatus(shopId, 'syncing');

      // Fetch orders updated since last sync
      // For simplicity, we'll fetch all orders in this implementation
      // In production, you'd use FETCH_ORDERS_UPDATED_SINCE query
      const fetcher = new OrderFetcher(shop.shop_domain, shop.access_token);
      const stats = await fetcher.fetchAllOrders(shopId);

      await this.completeSyncLog(logId, stats);
      await ShopRepository.updateSyncStatus(shopId, 'idle', new Date());

      logger.info('Incremental sync completed', {
        shop: shop.shop_domain,
        stats,
      });

      return {
        success: true,
        ...stats,
      };
    } catch (error) {
      logger.error('Incremental sync failed', {
        shop: shop.shop_domain,
        error: error.message,
      });

      await this.failSyncLog(logId, error.message);
      await ShopRepository.updateSyncStatus(shopId, 'error');

      throw error;
    }
  }

  /**
   * Ensures webhooks are registered for a shop
   * @param {Object} shop - Shop object
   */
  async ensureWebhooksRegistered(shop) {
    try {
      const manager = new WebhookManager(shop.shop_domain, shop.access_token);

      // Check existing webhooks
      const existing = await manager.list();

      if (existing.length === 0) {
        logger.info('Registering webhooks', { shop: shop.shop_domain });
        await manager.registerAll();
      }
    } catch (error) {
      logger.error('Failed to ensure webhooks', {
        shop: shop.shop_domain,
        error: error.message,
      });
      // Don't throw - webhook registration failure shouldn't stop sync
    }
  }

  /**
   * Creates sync log entry
   * @private
   */
  async createSyncLog(shopId, syncType, entityType) {
    const sql = `
      INSERT INTO sync_logs (
        shop_id, sync_type, entity_type, status, started_at
      ) VALUES (?, ?, ?, 'started', NOW())
    `;

    const result = await query(sql, [shopId, syncType, entityType]);
    return result.insertId;
  }

  /**
   * Updates sync log with progress
   * @private
   */
  async updateSyncLog(logId, data) {
    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      updates.push(`${key} = ?`);
      values.push(value);
    }

    values.push(logId);

    const sql = `
      UPDATE sync_logs
      SET ${updates.join(', ')}, status = 'in_progress'
      WHERE id = ?
    `;

    await query(sql, values);
  }

  /**
   * Marks sync log as completed
   * @private
   */
  async completeSyncLog(logId, stats) {
    const sql = `
      UPDATE sync_logs
      SET
        status = 'completed',
        records_processed = ?,
        records_created = ?,
        records_updated = ?,
        completed_at = NOW(),
        duration_seconds = TIMESTAMPDIFF(SECOND, started_at, NOW())
      WHERE id = ?
    `;

    await query(sql, [
      stats.processed,
      stats.created,
      stats.updated,
      logId,
    ]);
  }

  /**
   * Marks sync log as failed
   * @private
   */
  async failSyncLog(logId, errorMessage) {
    const sql = `
      UPDATE sync_logs
      SET
        status = 'failed',
        error_message = ?,
        completed_at = NOW(),
        duration_seconds = TIMESTAMPDIFF(SECOND, started_at, NOW())
      WHERE id = ?
    `;

    await query(sql, [errorMessage, logId]);
  }
}

module.exports = new SyncOrchestrator();
