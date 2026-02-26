/**
 * Attribution Analytics Service
 * Analyzes attribution data for revenue insights
 */

const OrderRepository = require('../../repositories/OrderRepository');
const { query } = require('../../database/connection');
const createLogger = require('../../utils/logger');

const logger = createLogger('AttributionAnalytics');

class AttributionAnalytics {
  /**
   * Gets revenue by attribution source
   * @param {number} shopId - Internal shop ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Attribution sources with revenue
   */
  async getRevenueBySource(shopId, startDate, endDate) {
    return await OrderRepository.getRevenueBySource(shopId, startDate, endDate);
  }

  /**
   * Gets attribution funnel (UTM source -> orders -> revenue)
   * @param {number} shopId - Internal shop ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Funnel data
   */
  async getAttributionFunnel(shopId, startDate, endDate) {
    const sql = `
      SELECT
        COALESCE(utm_source, 'Direct') as source,
        COUNT(*) as total_orders,
        COUNT(CASE WHEN financial_status IN ('paid', 'partially_paid') THEN 1 END) as paid_orders,
        SUM(CASE WHEN financial_status IN ('paid', 'partially_paid') THEN total_price ELSE 0 END) as revenue,
        AVG(CASE WHEN financial_status IN ('paid', 'partially_paid') THEN total_price END) as avg_order_value,
        (COUNT(CASE WHEN financial_status IN ('paid', 'partially_paid') THEN 1 END) * 100.0 / COUNT(*)) as conversion_rate
      FROM orders
      WHERE shop_id = ?
        AND shopify_created_at >= ?
        AND shopify_created_at <= ?
      GROUP BY utm_source
      ORDER BY revenue DESC
    `;

    const results = await query(sql, [shopId, startDate, endDate]);

    return results.map((row) => ({
      source: row.source,
      metrics: {
        total_orders: row.total_orders,
        paid_orders: row.paid_orders,
        revenue: parseFloat(row.revenue || 0),
        avg_order_value: parseFloat(row.avg_order_value || 0),
        conversion_rate: parseFloat(row.conversion_rate || 0),
      },
    }));
  }

  /**
   * Gets top performing campaigns
   * @param {number} shopId - Internal shop ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {number} limit - Number of results
   * @returns {Promise<Array>} Top campaigns
   */
  async getTopCampaigns(shopId, startDate, endDate, limit = 10) {
    const sql = `
      SELECT
        utm_campaign,
        utm_source,
        utm_medium,
        COUNT(*) as order_count,
        SUM(total_price) as total_revenue,
        AVG(total_price) as avg_order_value,
        COUNT(DISTINCT customer_id) as unique_customers
      FROM orders
      WHERE shop_id = ?
        AND shopify_created_at >= ?
        AND shopify_created_at <= ?
        AND financial_status IN ('paid', 'partially_paid')
        AND utm_campaign IS NOT NULL
      GROUP BY utm_campaign, utm_source, utm_medium
      ORDER BY total_revenue DESC
      LIMIT ?
    `;

    return await query(sql, [shopId, startDate, endDate, limit]);
  }

  /**
   * Gets customer acquisition cost by source
   * @param {number} shopId - Internal shop ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} CAC by source
   */
  async getCustomerAcquisitionBySource(shopId, startDate, endDate) {
    const sql = `
      SELECT
        c.first_order_utm_source as source,
        COUNT(DISTINCT c.id) as new_customers,
        SUM(o.total_price) as total_revenue,
        AVG(o.total_price) as avg_first_order_value,
        SUM(c.total_spent) as lifetime_value
      FROM customers c
      LEFT JOIN orders o ON o.customer_id = c.id
      WHERE c.shop_id = ?
        AND c.shopify_created_at >= ?
        AND c.shopify_created_at <= ?
      GROUP BY c.first_order_utm_source
      ORDER BY new_customers DESC
    `;

    return await query(sql, [shopId, startDate, endDate]);
  }

  /**
   * Gets attribution model comparison (first-touch vs last-touch)
   * @param {number} shopId - Internal shop ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Model comparison
   */
  async getAttributionModelComparison(shopId, startDate, endDate) {
    // Last-touch attribution (from orders table)
    const lastTouch = await this.getRevenueBySource(shopId, startDate, endDate);

    // First-touch attribution (from customers table)
    const firstTouchSql = `
      SELECT
        c.first_order_utm_source as utm_source,
        c.first_order_utm_medium as utm_medium,
        c.first_order_utm_campaign as utm_campaign,
        COUNT(DISTINCT c.id) as customer_count,
        SUM(c.total_spent) as total_revenue,
        AVG(c.total_spent) as average_ltv
      FROM customers c
      WHERE c.shop_id = ?
        AND c.shopify_created_at >= ?
        AND c.shopify_created_at <= ?
      GROUP BY c.first_order_utm_source, c.first_order_utm_medium, c.first_order_utm_campaign
      ORDER BY total_revenue DESC
    `;

    const firstTouch = await query(firstTouchSql, [shopId, startDate, endDate]);

    return {
      last_touch: lastTouch,
      first_touch: firstTouch,
    };
  }
}

module.exports = new AttributionAnalytics();
