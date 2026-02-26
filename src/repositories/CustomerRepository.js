/**
 * Customer Repository
 * Data access layer for customers table
 */

const BaseRepository = require('./BaseRepository');
const { query } = require('../database/connection');

class CustomerRepository extends BaseRepository {
  constructor() {
    super('customers');
  }

  /**
   * Find customer by Shopify customer ID
   */
  async findByShopifyId(shopId, shopifyCustomerId) {
    return await this.findOne({
      shop_id: shopId,
      shopify_customer_id: shopifyCustomerId,
    });
  }

  /**
   * Upsert customer (create or update if exists)
   */
  async upsertCustomer(customerData) {
    return await this.upsert(customerData, ['shop_id', 'shopify_customer_id']);
  }

  /**
   * Update customer aggregates (total_orders, total_spent)
   * Called after order processing
   */
  async updateAggregates(customerId) {
    const sql = `
      UPDATE ${this.tableName}
      SET
        total_orders = (
          SELECT COUNT(*)
          FROM orders
          WHERE customer_id = ?
        ),
        total_spent = (
          SELECT COALESCE(SUM(total_price), 0)
          FROM orders
          WHERE customer_id = ?
            AND financial_status IN ('paid', 'partially_paid')
        )
      WHERE id = ?
    `;

    await query(sql, [customerId, customerId, customerId]);
  }

  /**
   * Update first-touch attribution for customer
   */
  async updateFirstTouchAttribution(customerId, utmData) {
    // Only update if not already set
    const customer = await this.findById(customerId);
    if (customer && !customer.first_order_utm_source) {
      await this.update(customerId, {
        first_order_utm_source: utmData.utm_source,
        first_order_utm_medium: utmData.utm_medium,
        first_order_utm_campaign: utmData.utm_campaign,
      });
    }
  }

  /**
   * Get customer lifetime value (LTV) segments
   */
  async getLTVSegments(shopId) {
    const sql = `
      SELECT
        CASE
          WHEN total_spent = 0 THEN 'Zero'
          WHEN total_spent < 100 THEN 'Low (< $100)'
          WHEN total_spent < 500 THEN 'Medium ($100-$500)'
          WHEN total_spent < 1000 THEN 'High ($500-$1000)'
          ELSE 'VIP ($1000+)'
        END as segment,
        COUNT(*) as customer_count,
        AVG(total_spent) as avg_ltv,
        AVG(total_orders) as avg_orders
      FROM ${this.tableName}
      WHERE shop_id = ?
      GROUP BY segment
      ORDER BY avg_ltv DESC
    `;

    return await query(sql, [shopId]);
  }

  /**
   * Get customer cohort analysis
   */
  async getCohortAnalysis(shopId) {
    const sql = `
      SELECT
        DATE_FORMAT(shopify_created_at, '%Y-%m') as cohort_month,
        COUNT(*) as customer_count,
        SUM(total_orders) as total_orders,
        SUM(total_spent) as total_revenue,
        AVG(total_spent) as avg_ltv
      FROM ${this.tableName}
      WHERE shop_id = ?
      GROUP BY cohort_month
      ORDER BY cohort_month DESC
      LIMIT 12
    `;

    return await query(sql, [shopId]);
  }

  /**
   * Get top customers by spend
   */
  async getTopCustomers(shopId, limit = 10) {
    const sql = `
      SELECT
        email,
        first_name,
        last_name,
        total_orders,
        total_spent,
        first_order_utm_source
      FROM ${this.tableName}
      WHERE shop_id = ?
      ORDER BY total_spent DESC
      LIMIT ?
    `;

    return await query(sql, [shopId, limit]);
  }
}

module.exports = new CustomerRepository();
