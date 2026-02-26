/**
 * Shop Repository
 * Data access layer for shops table
 */

const BaseRepository = require('./BaseRepository');
const { query } = require('../database/connection');
const { encrypt, decrypt } = require('../utils/encryption');

class ShopRepository extends BaseRepository {
  constructor() {
    super('shops');
  }

  /**
   * Find shop by domain
   */
  async findByDomain(shopDomain) {
    const shop = await this.findOne({ shop_domain: shopDomain });
    if (shop && shop.access_token) {
      // Decrypt access token
      shop.access_token = decrypt(shop.access_token);
    }
    return shop;
  }

  /**
   * Create new shop with encrypted token
   */
  async createShop(shopData) {
    const data = { ...shopData };

    // Encrypt access token before storing
    if (data.access_token) {
      data.access_token = encrypt(data.access_token);
    }

    return await this.create(data);
  }

  /**
   * Update shop access token
   */
  async updateAccessToken(shopId, accessToken) {
    const encryptedToken = encrypt(accessToken);
    return await this.update(shopId, { access_token: encryptedToken });
  }

  /**
   * Update shop sync status
   */
  async updateSyncStatus(shopId, status, lastSyncAt = null) {
    const data = { sync_status: status };
    if (lastSyncAt) {
      data.last_sync_at = lastSyncAt;
    }
    return await this.update(shopId, data);
  }

  /**
   * Mark shop as uninstalled
   */
  async markUninstalled(shopId) {
    return await this.update(shopId, {
      is_active: false,
      access_token: '', // Clear token
    });
  }

  /**
   * Get all active shops for batch operations
   */
  async getActiveShops() {
    const shops = await this.findAll({ is_active: true });

    // Decrypt access tokens
    return shops.map((shop) => ({
      ...shop,
      access_token: shop.access_token ? decrypt(shop.access_token) : null,
    }));
  }

  /**
   * Get shops that need syncing (idle and last sync > 1 hour ago)
   */
  async getShopsNeedingSync() {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE is_active = true
        AND sync_status = 'idle'
        AND (last_sync_at IS NULL OR last_sync_at < DATE_SUB(NOW(), INTERVAL 1 HOUR))
    `;

    const shops = await query(sql);

    // Decrypt access tokens
    return shops.map((shop) => ({
      ...shop,
      access_token: shop.access_token ? decrypt(shop.access_token) : null,
    }));
  }
}

module.exports = new ShopRepository();
