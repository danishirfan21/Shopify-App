/**
 * Authentication Routes
 * OAuth flow endpoints
 */

const express = require('express');
const InstallController = require('../controllers/auth/InstallController');
const CallbackController = require('../controllers/auth/CallbackController');
const { asyncHandler } = require('../middleware/errorHandler');
const { authLimiter } = require('../middleware/rateLimiting');

const router = express.Router();

/**
 * @route GET /auth/install
 * @desc Initiates OAuth flow
 * @query shop - Shop domain (required)
 */
router.get('/install', authLimiter, asyncHandler(InstallController.install.bind(InstallController)));

/**
 * @route GET /auth/callback
 * @desc OAuth callback from Shopify
 * @query code, shop, state, hmac
 */
router.get('/callback', authLimiter, asyncHandler(CallbackController.callback.bind(CallbackController)));

module.exports = router;
