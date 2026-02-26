-- Migration: Create webhook_events table
-- Stores incoming webhook events for processing

CREATE TABLE IF NOT EXISTS webhook_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  shop_id INT UNSIGNED NOT NULL,

  topic VARCHAR(100) NOT NULL COMMENT 'Webhook topic (e.g., orders/create)',
  shopify_webhook_id VARCHAR(255) NOT NULL COMMENT 'Unique webhook ID from X-Shopify-Webhook-Id header',

  payload JSON NOT NULL COMMENT 'Full webhook payload',

  status ENUM('pending', 'processing', 'processed', 'failed', 'duplicate') DEFAULT 'pending'
    COMMENT 'Processing status',
  retry_count INT DEFAULT 0 COMMENT 'Number of retry attempts',
  max_retries INT DEFAULT 3 COMMENT 'Maximum retry attempts',

  error_message TEXT NULL COMMENT 'Error message if processing failed',
  processed_at TIMESTAMP NULL COMMENT 'When webhook was successfully processed',

  received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When webhook was received',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  UNIQUE KEY unique_webhook_id (shopify_webhook_id),
  INDEX idx_shop_status (shop_id, status),
  INDEX idx_topic (topic),
  INDEX idx_received_at (received_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Webhook event queue for async processing';
