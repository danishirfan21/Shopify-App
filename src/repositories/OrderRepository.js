/**
 * Order Repository
 * Data access layer for orders table
 */

const BaseRepository = require('./BaseRepository');
const { query } = require('../database/connection');

class OrderRepository extends BaseRepository {
  constructor() {
    super('orders');
  }

  /**
   * Find order by Shopify order ID
   */
  async findByShopifyId(shopId, shopifyOrderId) {
    return await this.findOne({
      shop_id: shopId,
      shopify_order_id: shopifyOrderId,
    });
  }

  /**
   * Upsert order (create or update if exists)
   */
  async upsertOrder(orderData) {
    return await this.upsert(orderData, ['shop_id', 'shopify_order_id']);
  }

  /**
   * Get orders with pagination and filters
   */
  async getOrders(shopId, filters = {}, pagination = {}) {
    const { page = 1, limit = 50 } = pagination;
    const offset = (page - 1) * limit;

    // Build WHERE clause with filters
    const conditions = ['shop_id = ?'];
    const params = [shopId];

    if (filters.financial_status) {
      conditions.push('financial_status = ?');
      params.push(filters.financial_status);
    }

    if (filters.utm_source) {
      conditions.push('utm_source = ?');
      params.push(filters.utm_source);
    }

    if (filters.start_date) {
      conditions.push('shopify_created_at >= ?');
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      conditions.push('shopify_created_at <= ?');
      params.push(filters.end_date);
    }

    if (filters.email) {
      conditions.push('email = ?');
      params.push(filters.email);
    }

    const whereClause = conditions.join(' AND ');
    const orderBy = filters.sort_by || 'shopify_created_at';
    const orderDir = filters.sort_order || 'DESC';

    // Get total count
    const countSql = `
      SELECT COUNT(*) as total
      FROM ${this.tableName}
      WHERE ${whereClause}
    `;
    const countResults = await query(countSql, params);
    const total = countResults[0].total;

    // Get paginated results
    const sql = `
      SELECT *
      FROM ${this.tableName}
      WHERE ${whereClause}
      ORDER BY ${orderBy} ${orderDir}
      LIMIT ? OFFSET ?
    `;

    const orders = await query(sql, [...params, limit, offset]);

    return {
      data: orders,
      meta: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
        has_more: page * limit < total,
      },
    };
  }

  /**
   * Get order with line items
   */
  async getOrderWithLineItems(orderId) {
    const order = await this.findById(orderId);
    if (!order) return null;

    const lineItemsSql = `
      SELECT * FROM line_items WHERE order_id = ?
    `;
    const lineItems = await query(lineItemsSql, [orderId]);

    return {
      ...order,
      line_items: lineItems,
    };
  }

  /**
   * Get revenue by attribution source
   */
  async getRevenueBySource(shopId, startDate, endDate) {
    const sql = `
      SELECT
        utm_source,
        utm_medium,
        utm_campaign,
        COUNT(*) as order_count,
        SUM(total_price) as total_revenue,
        AVG(total_price) as average_order_value
      FROM ${this.tableName}
      WHERE shop_id = ?
        AND shopify_created_at >= ?
        AND shopify_created_at <= ?
        AND financial_status IN ('paid', 'partially_paid')
      GROUP BY utm_source, utm_medium, utm_campaign
      ORDER BY total_revenue DESC
    `;

    return await query(sql, [shopId, startDate, endDate]);
  }

  /**
   * Get daily revenue trend
   */
  async getDailyRevenue(shopId, startDate, endDate) {
    const sql = `
      SELECT
        DATE(shopify_created_at) as date,
        COUNT(*) as order_count,
        SUM(total_price) as revenue,
        COUNT(DISTINCT customer_id) as unique_customers
      FROM ${this.tableName}
      WHERE shop_id = ?
        AND shopify_created_at >= ?
        AND shopify_created_at <= ?
        AND financial_status IN ('paid', 'partially_paid')
      GROUP BY DATE(shopify_created_at)
      ORDER BY date ASC
    `;

    return await query(sql, [shopId, startDate, endDate]);
  }

  /**
   * Get top products by revenue
   */
  async getTopProducts(shopId, startDate, endDate, limit = 10) {
    const sql = `
      SELECT
        li.title,
        li.sku,
        SUM(li.quantity) as total_quantity,
        SUM(li.price * li.quantity) as total_revenue
      FROM line_items li
      INNER JOIN ${this.tableName} o ON li.order_id = o.id
      WHERE o.shop_id = ?
        AND o.shopify_created_at >= ?
        AND o.shopify_created_at <= ?
        AND o.financial_status IN ('paid', 'partially_paid')
      GROUP BY li.title, li.sku
      ORDER BY total_revenue DESC
      LIMIT ?
    `;

    return await query(sql, [shopId, startDate, endDate, limit]);
  }
}

module.exports = new OrderRepository();
