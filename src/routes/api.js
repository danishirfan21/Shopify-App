/**
 * API Routes
 * Protected API endpoints for orders and attribution data
 */

const express = require('express');
const OrdersController = require('../controllers/api/OrdersController');
const AttributionController = require('../controllers/api/AttributionController');
const { sessionTokenAuth } = require('../middleware/sessionTokenAuth');
const { asyncHandler } = require('../middleware/errorHandler');
const { apiLimiter } = require('../middleware/rateLimiting');

const router = express.Router();

// Apply authentication and rate limiting to all API routes
router.use(sessionTokenAuth);
router.use(apiLimiter);

/**
 * Orders Endpoints
 */

/**
 * @route GET /api/orders
 * @desc Get paginated orders with filters
 * @query page, limit, start_date, end_date, financial_status, utm_source, email
 */
router.get('/orders', asyncHandler(OrdersController.getOrders.bind(OrdersController)));

/**
 * @route GET /api/orders/:id
 * @desc Get single order by ID
 * @param id - Order ID
 */
router.get('/orders/:id', asyncHandler(OrdersController.getOrder.bind(OrdersController)));

/**
 * @route GET /api/orders/analytics/revenue
 * @desc Get revenue analytics
 * @query start_date, end_date (required)
 */
router.get('/orders/analytics/revenue', asyncHandler(OrdersController.getRevenueAnalytics.bind(OrdersController)));

/**
 * @route GET /api/orders/analytics/top-products
 * @desc Get top products by revenue
 * @query start_date, end_date, limit
 */
router.get('/orders/analytics/top-products', asyncHandler(OrdersController.getTopProducts.bind(OrdersController)));

/**
 * Attribution Endpoints
 */

/**
 * @route GET /api/attribution/sources
 * @desc Get revenue by attribution source
 * @query start_date, end_date (required)
 */
router.get('/attribution/sources', asyncHandler(AttributionController.getRevenueBySource.bind(AttributionController)));

/**
 * @route GET /api/attribution/funnel
 * @desc Get attribution funnel analysis
 * @query start_date, end_date (required)
 */
router.get('/attribution/funnel', asyncHandler(AttributionController.getAttributionFunnel.bind(AttributionController)));

/**
 * @route GET /api/attribution/campaigns
 * @desc Get top performing campaigns
 * @query start_date, end_date, limit
 */
router.get('/attribution/campaigns', asyncHandler(AttributionController.getTopCampaigns.bind(AttributionController)));

/**
 * @route GET /api/attribution/model-comparison
 * @desc Compare first-touch vs last-touch attribution
 * @query start_date, end_date (required)
 */
router.get('/attribution/model-comparison', asyncHandler(AttributionController.getModelComparison.bind(AttributionController)));

module.exports = router;
