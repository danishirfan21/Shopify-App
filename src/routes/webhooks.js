/**
 * Webhook Routes
 * Shopify webhook endpoints
 */

const express = require('express');
const OrdersWebhookController = require('../controllers/webhooks/OrdersWebhookController');
const { asyncHandler } = require('../middleware/errorHandler');
const { webhookLimiter } = require('../middleware/rateLimiting');

const router = express.Router();

// Apply rate limiting to all webhook routes
router.use(webhookLimiter);

/**
 * @route POST /webhooks/orders-create
 * @desc Handles orders/create webhook from Shopify
 */
router.post('/orders-create', asyncHandler(OrdersWebhookController.ordersCreate.bind(OrdersWebhookController)));

/**
 * @route POST /webhooks/orders-updated
 * @desc Handles orders/updated webhook from Shopify
 */
router.post('/orders-updated', asyncHandler(OrdersWebhookController.ordersUpdated.bind(OrdersWebhookController)));

/**
 * @route POST /webhooks/orders-cancelled
 * @desc Handles orders/cancelled webhook from Shopify
 */
router.post('/orders-cancelled', asyncHandler(OrdersWebhookController.ordersCancelled.bind(OrdersWebhookController)));

/**
 * @route POST /webhooks/app-uninstalled
 * @desc Handles app/uninstalled webhook from Shopify
 */
router.post('/app-uninstalled', asyncHandler(OrdersWebhookController.appUninstalled.bind(OrdersWebhookController)));

module.exports = router;
