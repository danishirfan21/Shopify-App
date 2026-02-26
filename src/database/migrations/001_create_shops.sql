-- Migration: Create shops table
-- Stores Shopify shop credentials and metadata

CREATE TABLE IF NOT EXISTS shops (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  shop_domain VARCHAR(255) NOT NULL UNIQUE COMMENT 'Shopify shop domain (e.g., store.myshopify.com)',
  access_token TEXT NOT NULL COMMENT 'Encrypted OAuth access token',
  scope TEXT NOT NULL COMMENT 'Granted OAuth scopes (comma-separated)',
  is_active BOOLEAN DEFAULT TRUE COMMENT 'Whether shop is active and installed',
  installation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When app was installed',
  last_sync_at TIMESTAMP NULL COMMENT 'Last successful data sync',
  sync_status ENUM('idle', 'syncing', 'error') DEFAULT 'idle' COMMENT 'Current sync status',
  shopify_plan VARCHAR(50) NULL COMMENT 'Shopify plan tier',
  currency VARCHAR(3) DEFAULT 'USD' COMMENT 'Shop currency code',
  timezone VARCHAR(50) DEFAULT 'UTC' COMMENT 'Shop timezone',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_shop_domain (shop_domain),
  INDEX idx_is_active (is_active),
  INDEX idx_sync_status (sync_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Shopify shop installations and OAuth credentials';
