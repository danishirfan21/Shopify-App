-- Migration: Create customers table
-- Note: This must be created before orders table due to FK constraint

CREATE TABLE IF NOT EXISTS customers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  shop_id INT UNSIGNED NOT NULL,
  shopify_customer_id BIGINT UNSIGNED NOT NULL COMMENT 'Shopify numeric customer ID',
  shopify_customer_gid VARCHAR(255) NOT NULL COMMENT 'Shopify GraphQL global ID',

  -- Customer details
  email VARCHAR(255) NULL,
  first_name VARCHAR(100) NULL,
  last_name VARCHAR(100) NULL,
  phone VARCHAR(50) NULL,

  -- Aggregated metrics (denormalized for performance)
  total_orders INT DEFAULT 0 COMMENT 'Total number of orders',
  total_spent DECIMAL(10, 2) DEFAULT 0 COMMENT 'Total amount spent',

  -- First-touch attribution
  first_order_utm_source VARCHAR(255) NULL COMMENT 'UTM source from first order',
  first_order_utm_medium VARCHAR(255) NULL COMMENT 'UTM medium from first order',
  first_order_utm_campaign VARCHAR(255) NULL COMMENT 'UTM campaign from first order',

  -- Status
  accepts_marketing BOOLEAN DEFAULT FALSE,
  state VARCHAR(50) DEFAULT 'enabled' COMMENT 'Customer account state',

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  shopify_created_at TIMESTAMP NOT NULL COMMENT 'Customer creation time in Shopify',

  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  UNIQUE KEY unique_shop_customer (shop_id, shopify_customer_id),
  INDEX idx_email (email),
  INDEX idx_total_spent (total_spent),
  INDEX idx_first_utm (first_order_utm_source),
  INDEX idx_shop_id (shop_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Customer data and attribution';
