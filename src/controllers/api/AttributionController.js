/**
 * Attribution API Controller
 * Handles attribution analytics endpoints
 */

const AttributionAnalytics = require('../../services/analytics/AttributionAnalytics');
const { validateDateRange } = require('../../utils/validators');
const createLogger = require('../../utils/logger');

const logger = createLogger('AttributionController');

class AttributionController {
  /**
   * Get revenue by attribution source
   * GET /api/attribution/sources?start_date=2024-01-01&end_date=2024-01-31
   */
  async getRevenueBySource(req, res, next) {
    try {
      const shopId = req.shopId;

      const { start, end } = validateDateRange(
        req.query.start_date,
        req.query.end_date
      );

      const sources = await AttributionAnalytics.getRevenueBySource(
        shopId,
        start,
        end
      );

      res.json({
        success: true,
        data: sources.map((s) => ({
          source: {
            utm_source: s.utm_source,
            utm_medium: s.utm_medium,
            utm_campaign: s.utm_campaign,
          },
          metrics: {
            order_count: s.order_count,
            total_revenue: parseFloat(s.total_revenue || 0),
            average_order_value: parseFloat(s.average_order_value || 0),
          },
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get attribution funnel
   * GET /api/attribution/funnel?start_date=2024-01-01&end_date=2024-01-31
   */
  async getAttributionFunnel(req, res, next) {
    try {
      const shopId = req.shopId;

      const { start, end } = validateDateRange(
        req.query.start_date,
        req.query.end_date
      );

      const funnel = await AttributionAnalytics.getAttributionFunnel(
        shopId,
        start,
        end
      );

      res.json({
        success: true,
        data: funnel,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get top campaigns
   * GET /api/attribution/campaigns?start_date=2024-01-01&end_date=2024-01-31&limit=10
   */
  async getTopCampaigns(req, res, next) {
    try {
      const shopId = req.shopId;
      const limit = parseInt(req.query.limit, 10) || 10;

      const { start, end } = validateDateRange(
        req.query.start_date,
        req.query.end_date
      );

      const campaigns = await AttributionAnalytics.getTopCampaigns(
        shopId,
        start,
        end,
        limit
      );

      res.json({
        success: true,
        data: campaigns.map((c) => ({
          campaign: c.utm_campaign,
          source: c.utm_source,
          medium: c.utm_medium,
          metrics: {
            order_count: c.order_count,
            total_revenue: parseFloat(c.total_revenue),
            avg_order_value: parseFloat(c.avg_order_value),
            unique_customers: c.unique_customers,
          },
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get attribution model comparison
   * GET /api/attribution/model-comparison?start_date=2024-01-01&end_date=2024-01-31
   */
  async getModelComparison(req, res, next) {
    try {
      const shopId = req.shopId;

      const { start, end } = validateDateRange(
        req.query.start_date,
        req.query.end_date
      );

      const comparison = await AttributionAnalytics.getAttributionModelComparison(
        shopId,
        start,
        end
      );

      res.json({
        success: true,
        data: {
          description: 'Comparison of first-touch vs last-touch attribution models',
          last_touch: comparison.last_touch,
          first_touch: comparison.first_touch,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AttributionController();
