/**
 * Orders API Controller
 * Handles order-related API endpoints
 */

const OrderRepository = require('../../repositories/OrderRepository');
const {
  validatePagination,
  validateDateRange,
  validateFinancialStatus,
} = require('../../utils/validators');
const { formatOrderForAPI } = require('../../utils/transformers');
const { query } = require('../../database/connection');
const createLogger = require('../../utils/logger');

const logger = createLogger('OrdersController');

class OrdersController {
  /**
   * Get paginated orders with filters
   * GET /api/orders?page=1&limit=50&start_date=2024-01-01&utm_source=google
   */
  async getOrders(req, res, next) {
    try {
      const shopId = req.shopId; // Set by authentication middleware

      // Validate pagination
      const { page, limit, offset } = validatePagination(
        req.query.page,
        req.query.limit
      );

      // Build filters
      const filters = {};

      if (req.query.start_date && req.query.end_date) {
        const { start, end } = validateDateRange(
          req.query.start_date,
          req.query.end_date
        );
        filters.start_date = start;
        filters.end_date = end;
      }

      if (req.query.financial_status) {
        validateFinancialStatus(req.query.financial_status);
        filters.financial_status = req.query.financial_status;
      }

      if (req.query.utm_source) {
        filters.utm_source = req.query.utm_source;
      }

      if (req.query.email) {
        filters.email = req.query.email;
      }

      if (req.query.sort_by) {
        filters.sort_by = req.query.sort_by;
      }

      if (req.query.sort_order) {
        filters.sort_order = req.query.sort_order;
      }

      // Fetch orders
      const result = await OrderRepository.getOrders(
        shopId,
        filters,
        { page, limit }
      );

      logger.info('Orders fetched', {
        shopId,
        page,
        limit,
        total: result.meta.total,
      });

      // Format response
      res.json({
        success: true,
        data: result.data.map((order) => formatOrderForAPI(order)),
        meta: result.meta,
        links: {
          self: req.originalUrl,
          next: result.meta.has_more
            ? `${req.baseUrl}${req.path}?page=${page + 1}&limit=${limit}`
            : null,
          prev: page > 1
            ? `${req.baseUrl}${req.path}?page=${page - 1}&limit=${limit}`
            : null,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single order by ID
   * GET /api/orders/:id
   */
  async getOrder(req, res, next) {
    try {
      const shopId = req.shopId;
      const orderId = parseInt(req.params.id, 10);

      // Fetch order with line items
      const order = await OrderRepository.getOrderWithLineItems(orderId);

      if (!order || order.shop_id !== shopId) {
        return res.status(404).json({
          success: false,
          error: 'Order not found',
        });
      }

      logger.info('Order fetched', { shopId, orderId });

      res.json({
        success: true,
        data: formatOrderForAPI(order, order.line_items),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get revenue analytics
   * GET /api/orders/analytics/revenue?start_date=2024-01-01&end_date=2024-01-31
   */
  async getRevenueAnalytics(req, res, next) {
    try {
      const shopId = req.shopId;

      const { start, end } = validateDateRange(
        req.query.start_date,
        req.query.end_date
      );

      // Get daily revenue
      const dailyRevenue = await OrderRepository.getDailyRevenue(
        shopId,
        start,
        end
      );

      // Calculate totals
      const totals = dailyRevenue.reduce(
        (acc, day) => {
          acc.total_revenue += parseFloat(day.revenue || 0);
          acc.total_orders += day.order_count;
          acc.unique_customers += day.unique_customers;
          return acc;
        },
        { total_revenue: 0, total_orders: 0, unique_customers: 0 }
      );

      totals.average_order_value =
        totals.total_orders > 0
          ? totals.total_revenue / totals.total_orders
          : 0;

      res.json({
        success: true,
        data: {
          period: {
            start_date: start,
            end_date: end,
          },
          totals,
          daily: dailyRevenue,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get top products
   * GET /api/orders/analytics/top-products?start_date=2024-01-01&end_date=2024-01-31&limit=10
   */
  async getTopProducts(req, res, next) {
    try {
      const shopId = req.shopId;
      const limit = parseInt(req.query.limit, 10) || 10;

      const { start, end } = validateDateRange(
        req.query.start_date,
        req.query.end_date
      );

      const products = await OrderRepository.getTopProducts(
        shopId,
        start,
        end,
        limit
      );

      res.json({
        success: true,
        data: products.map((p) => ({
          title: p.title,
          sku: p.sku,
          total_quantity: p.total_quantity,
          total_revenue: parseFloat(p.total_revenue),
        })),
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrdersController();
