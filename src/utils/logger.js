/**
 * Centralized Logging Utility
 * Using Winston for structured logging with daily rotation
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const config = require('../config');

/**
 * Custom log format with timestamp and JSON structure
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

/**
 * Console format for development (human-readable)
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

/**
 * Transport configuration
 */
const transports = [
  // Console output
  new winston.transports.Console({
    format: config.app.isDevelopment ? consoleFormat : logFormat,
    level: config.logging.level,
  }),

  // Daily rotating file for all logs
  new DailyRotateFile({
    filename: config.logging.filePath.replace('.log', '-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxFiles: config.logging.maxFiles,
    format: logFormat,
    level: config.logging.level,
  }),

  // Separate file for errors
  new DailyRotateFile({
    filename: config.logging.filePath.replace('.log', '-error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxFiles: config.logging.maxFiles,
    format: logFormat,
    level: 'error',
  }),
];

/**
 * Create logger instance
 */
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports,
  exitOnError: false,
});

/**
 * Wrapper methods with context support
 */
const createLogger = (context = '') => {
  return {
    debug: (message, meta = {}) => {
      logger.debug(message, { context, ...meta });
    },
    info: (message, meta = {}) => {
      logger.info(message, { context, ...meta });
    },
    warn: (message, meta = {}) => {
      logger.warn(message, { context, ...meta });
    },
    error: (message, meta = {}) => {
      // If meta is an Error object, extract stack trace
      if (meta instanceof Error) {
        meta = {
          message: meta.message,
          stack: meta.stack,
          name: meta.name,
        };
      }
      logger.error(message, { context, ...meta });
    },
  };
};

module.exports = createLogger;
module.exports.logger = logger; // Export base logger for direct access
