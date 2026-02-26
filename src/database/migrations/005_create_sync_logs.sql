-- Migration: Create sync_logs table
-- Tracks data synchronization operations

CREATE TABLE IF NOT EXISTS sync_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  shop_id INT UNSIGNED NOT NULL,
  sync_type ENUM('full', 'incremental', 'webhook') NOT NULL
    COMMENT 'Type of sync operation',
  entity_type ENUM('orders', 'customers', 'products') NOT NULL
    COMMENT 'What entity was synced',

  status ENUM('started', 'in_progress', 'completed', 'failed') NOT NULL,

  -- Metrics
  records_processed INT DEFAULT 0 COMMENT 'Total records processed',
  records_created INT DEFAULT 0 COMMENT 'New records created',
  records_updated INT DEFAULT 0 COMMENT 'Existing records updated',
  records_failed INT DEFAULT 0 COMMENT 'Failed records',

  -- Details
  cursor_position VARCHAR(255) NULL COMMENT 'GraphQL cursor for resuming pagination',
  error_message TEXT NULL COMMENT 'Error message if failed',
  error_details JSON NULL COMMENT 'Structured error details',

  -- Timing
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP NULL,
  duration_seconds INT NULL COMMENT 'Total sync duration',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  INDEX idx_shop_status (shop_id, status),
  INDEX idx_entity_type (entity_type),
  INDEX idx_started_at (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Data synchronization audit log';
