/**
 * Request Logger Middleware
 * Logs HTTP requests for debugging and monitoring
 */

const createLogger = require('../utils/logger');

const logger = createLogger('HTTP');

/**
 * Logs incoming HTTP requests
 */
function requestLogger(req, res, next) {
  const startTime = Date.now();

  // Log request
  logger.info('Incoming request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  // Capture response
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    logger.info('Request completed', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
}

/**
 * Captures raw body for webhook verification
 * Must be used before JSON body parser
 */
function rawBodyCapture(req, res, next) {
  if (req.path.startsWith('/webhooks')) {
    let data = '';
    req.setEncoding('utf8');

    req.on('data', (chunk) => {
      data += chunk;
    });

    req.on('end', () => {
      req.rawBody = data;
      next();
    });
  } else {
    next();
  }
}

module.exports = {
  requestLogger,
  rawBodyCapture,
};
