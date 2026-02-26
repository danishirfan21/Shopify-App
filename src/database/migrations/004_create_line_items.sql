-- Migration: Create line_items table
-- Stores individual products/items within orders

CREATE TABLE IF NOT EXISTS line_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  shopify_line_item_id BIGINT UNSIGNED NOT NULL COMMENT 'Shopify line item ID',

  -- Product information
  product_id BIGINT UNSIGNED NULL COMMENT 'Shopify product ID',
  variant_id BIGINT UNSIGNED NULL COMMENT 'Shopify variant ID',
  title VARCHAR(255) NOT NULL COMMENT 'Product title',
  variant_title VARCHAR(255) NULL COMMENT 'Variant title (e.g., Size: Large)',
  sku VARCHAR(255) NULL COMMENT 'Stock keeping unit',

  -- Pricing
  quantity INT NOT NULL COMMENT 'Quantity purchased',
  price DECIMAL(10, 2) NOT NULL COMMENT 'Unit price',
  total_discount DECIMAL(10, 2) DEFAULT 0 COMMENT 'Total discount on this item',

  -- Fulfillment
  fulfillment_status ENUM('fulfilled', 'partial', 'unfulfilled') NULL,
  requires_shipping BOOLEAN DEFAULT TRUE,

  -- Flags
  is_gift_card BOOLEAN DEFAULT FALSE,
  taxable BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  UNIQUE KEY unique_order_line_item (order_id, shopify_line_item_id),
  INDEX idx_product (product_id),
  INDEX idx_variant (variant_id),
  INDEX idx_sku (sku)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Order line items (products purchased)';
