/**
 * Database Seeding Script
 * Populates the database with sample data for development and testing
 */

// Support running with mock DB if environment variable is set
const { query, closePool } = require('../src/database/connection');
const createLogger = require('../src/utils/logger');
const { encrypt } = require('../src/utils/encryption');

const logger = createLogger('Seeding');

const SAMPLE_SHOP = {
  shop_domain: 'test-store.myshopify.com',
  access_token: 'shp_sample_token',
  is_active: true,
  sync_status: 'idle',
};

async function seed() {
  try {
    logger.info('Starting database seeding...');

    // 1. Create Sample Shop
    logger.info('Seeding shops...');
    const encryptedToken = encrypt(SAMPLE_SHOP.access_token);
    const shopResult = await query(
      'INSERT INTO shops (shop_domain, access_token, is_active, sync_status) VALUES (?, ?, ?, ?)',
      [SAMPLE_SHOP.shop_domain, encryptedToken, SAMPLE_SHOP.is_active, SAMPLE_SHOP.sync_status]
    );
    const shopId = shopResult.insertId || 1;

    // 2. Create Sample Orders
    logger.info('Seeding orders...');
    const orders = [
      {
        shopify_order_id: 1001,
        order_number: '#1001',
        total_price: 150.00,
        currency: 'USD',
        financial_status: 'paid',
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'summer_sale',
        shopify_created_at: '2024-01-10 10:00:00',
      },
      {
        shopify_order_id: 1002,
        order_number: '#1002',
        total_price: 85.50,
        currency: 'USD',
        financial_status: 'paid',
        utm_source: 'facebook',
        utm_medium: 'social',
        utm_campaign: 'retargeting',
        shopify_created_at: '2024-01-12 14:30:00',
      },
      {
        shopify_order_id: 1003,
        order_number: '#1003',
        total_price: 210.00,
        currency: 'USD',
        financial_status: 'paid',
        utm_source: 'google',
        utm_medium: 'organic',
        utm_campaign: null,
        shopify_created_at: '2024-01-15 09:15:00',
      },
    ];

    for (const order of orders) {
      await query(
        `INSERT INTO orders (
          shop_id, shopify_order_id, order_number, total_price, currency,
          financial_status, utm_source, utm_medium, utm_campaign, shopify_created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          shopId, order.shopify_order_id, order.order_number, order.total_price, order.currency,
          order.financial_status, order.utm_source, order.utm_medium, order.utm_campaign, order.shopify_created_at
        ]
      );
    }

    logger.info('✓ Seeding completed successfully');
  } catch (error) {
    logger.error('Seeding process failed', error);
    // If we're being required, don't exit the process
    if (require.main === module) {
      process.exit(1);
    }
    throw error;
  } finally {
    await closePool();
  }
}

// Run if called directly
if (require.main === module) {
  seed();
}

module.exports = { seed };
