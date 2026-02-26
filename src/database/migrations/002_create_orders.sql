-- Migration: Create orders table
-- Stores order data fetched from Shopify with attribution information

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  shop_id INT UNSIGNED NOT NULL,
  shopify_order_id BIGINT UNSIGNED NOT NULL COMMENT 'Shopify numeric order ID',
  shopify_order_gid VARCHAR(255) NOT NULL COMMENT 'Shopify GraphQL global ID',
  order_number VARCHAR(50) NOT NULL COMMENT 'Human-readable order number',
  name VARCHAR(50) NOT NULL COMMENT 'Order name (e.g., #1001)',

  -- Financial data
  total_price DECIMAL(10, 2) NOT NULL COMMENT 'Total order amount',
  subtotal_price DECIMAL(10, 2) NOT NULL COMMENT 'Subtotal before tax/shipping',
  total_tax DECIMAL(10, 2) DEFAULT 0 COMMENT 'Total tax amount',
  total_discounts DECIMAL(10, 2) DEFAULT 0 COMMENT 'Total discounts applied',
  total_shipping DECIMAL(10, 2) DEFAULT 0 COMMENT 'Shipping cost',
  currency VARCHAR(3) DEFAULT 'USD' COMMENT 'Currency code',

  -- Customer information
  customer_id BIGINT UNSIGNED NULL COMMENT 'FK to customers table',
  email VARCHAR(255) NULL COMMENT 'Customer email (denormalized for quick access)',
  customer_shopify_id BIGINT UNSIGNED NULL COMMENT 'Shopify customer ID',

  -- Order status
  financial_status ENUM('pending', 'authorized', 'partially_paid', 'paid',
                        'partially_refunded', 'refunded', 'voided') NOT NULL
    COMMENT 'Payment status',
  fulfillment_status ENUM('fulfilled', 'partial', 'unfulfilled', 'restocked') NULL
    COMMENT 'Fulfillment status',
  cancelled_at TIMESTAMP NULL COMMENT 'When order was cancelled',
  closed_at TIMESTAMP NULL COMMENT 'When order was closed',

  -- Attribution data (extracted from order attributes/note_attributes)
  utm_source VARCHAR(255) NULL COMMENT 'UTM source parameter',
  utm_medium VARCHAR(255) NULL COMMENT 'UTM medium parameter',
  utm_campaign VARCHAR(255) NULL COMMENT 'UTM campaign parameter',
  utm_content VARCHAR(255) NULL COMMENT 'UTM content parameter',
  utm_term VARCHAR(255) NULL COMMENT 'UTM term parameter',
  landing_page TEXT NULL COMMENT 'Landing page URL',
  referrer TEXT NULL COMMENT 'Referrer URL or source',

  -- Timestamps
  processed_at TIMESTAMP NULL COMMENT 'When Shopify processed the order',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  shopify_created_at TIMESTAMP NOT NULL COMMENT 'Order creation time in Shopify',
  shopify_updated_at TIMESTAMP NOT NULL COMMENT 'Last update time in Shopify',

  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  UNIQUE KEY unique_shop_order (shop_id, shopify_order_id),
  INDEX idx_shop_date (shop_id, shopify_created_at),
  INDEX idx_customer (customer_id),
  INDEX idx_financial_status (financial_status),
  INDEX idx_utm_source (utm_source),
  INDEX idx_processed_at (processed_at),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Order data with attribution tracking';
