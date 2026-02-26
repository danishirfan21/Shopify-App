/**
 * Data Transformers
 * Transform Shopify API responses to our database schema
 */

/**
 * Transforms Shopify GraphQL Order to database format
 * @param {Object} shopifyOrder - Order from Shopify GraphQL API
 * @param {number} shopId - Internal shop ID
 * @returns {Object} Normalized order data
 */
function transformOrderFromShopify(shopifyOrder, shopId) {
  // Extract numeric ID from GraphQL global ID (gid://shopify/Order/123456)
  const shopifyOrderId = extractIdFromGID(shopifyOrder.id);

  // Parse UTM parameters from order attributes or note attributes
  const utmData = extractUTMFromOrder(shopifyOrder);

  return {
    shop_id: shopId,
    shopify_order_id: shopifyOrderId,
    shopify_order_gid: shopifyOrder.id,
    order_number: shopifyOrder.orderNumber || shopifyOrder.name?.replace('#', ''),
    name: shopifyOrder.name,

    // Financial data
    total_price: parseFloat(shopifyOrder.totalPriceSet?.shopMoney?.amount || 0),
    subtotal_price: parseFloat(shopifyOrder.subtotalPriceSet?.shopMoney?.amount || 0),
    total_tax: parseFloat(shopifyOrder.totalTaxSet?.shopMoney?.amount || 0),
    total_discounts: parseFloat(shopifyOrder.totalDiscountsSet?.shopMoney?.amount || 0),
    total_shipping: parseFloat(shopifyOrder.totalShippingPriceSet?.shopMoney?.amount || 0),
    currency: shopifyOrder.currencyCode || 'USD',

    // Customer data (will be linked after customer is created)
    email: shopifyOrder.email,
    customer_shopify_id: shopifyOrder.customer?.id ? extractIdFromGID(shopifyOrder.customer.id) : null,

    // Status
    financial_status: (shopifyOrder.displayFinancialStatus || 'pending').toLowerCase(),
    fulfillment_status: shopifyOrder.displayFulfillmentStatus?.toLowerCase() || null,
    cancelled_at: shopifyOrder.cancelledAt ? new Date(shopifyOrder.cancelledAt) : null,
    closed_at: shopifyOrder.closedAt ? new Date(shopifyOrder.closedAt) : null,

    // Attribution
    ...utmData,

    // Timestamps
    processed_at: shopifyOrder.processedAt ? new Date(shopifyOrder.processedAt) : null,
    shopify_created_at: new Date(shopifyOrder.createdAt),
    shopify_updated_at: new Date(shopifyOrder.updatedAt),
  };
}

/**
 * Transforms Shopify line items to database format
 * @param {Array} lineItems - Line items from Shopify
 * @param {number} orderId - Internal order ID
 * @returns {Array} Normalized line items
 */
function transformLineItemsFromShopify(lineItems, orderId) {
  return lineItems.map((item) => ({
    order_id: orderId,
    shopify_line_item_id: extractIdFromGID(item.id),
    product_id: item.product?.id ? extractIdFromGID(item.product.id) : null,
    variant_id: item.variant?.id ? extractIdFromGID(item.variant.id) : null,
    title: item.title,
    variant_title: item.variantTitle || null,
    sku: item.sku || null,
    quantity: item.quantity,
    price: parseFloat(item.originalUnitPriceSet?.shopMoney?.amount || 0),
    total_discount: parseFloat(item.totalDiscountSet?.shopMoney?.amount || 0),
    fulfillment_status: item.fulfillmentStatus?.toLowerCase() || null,
    requires_shipping: item.requiresShipping || false,
    is_gift_card: item.giftCard || false,
    taxable: item.taxable || false,
  }));
}

/**
 * Transforms Shopify Customer to database format
 * @param {Object} shopifyCustomer - Customer from Shopify GraphQL API
 * @param {number} shopId - Internal shop ID
 * @returns {Object} Normalized customer data
 */
function transformCustomerFromShopify(shopifyCustomer, shopId) {
  const shopifyCustomerId = extractIdFromGID(shopifyCustomer.id);

  return {
    shop_id: shopId,
    shopify_customer_id: shopifyCustomerId,
    shopify_customer_gid: shopifyCustomer.id,
    email: shopifyCustomer.email,
    first_name: shopifyCustomer.firstName || null,
    last_name: shopifyCustomer.lastName || null,
    phone: shopifyCustomer.phone || null,
    total_orders: shopifyCustomer.numberOfOrders || 0,
    total_spent: parseFloat(shopifyCustomer.amountSpent?.amount || 0),
    accepts_marketing: shopifyCustomer.acceptsMarketing || false,
    state: shopifyCustomer.state?.toLowerCase() || 'enabled',
    shopify_created_at: new Date(shopifyCustomer.createdAt),
  };
}

/**
 * Extracts numeric ID from Shopify GraphQL global ID
 * @param {string} gid - Global ID (e.g., "gid://shopify/Order/123456")
 * @returns {number} Numeric ID
 */
function extractIdFromGID(gid) {
  if (!gid) return null;
  const parts = gid.split('/');
  return parseInt(parts[parts.length - 1], 10);
}

/**
 * Extracts UTM parameters from order attributes
 * Shopify stores custom attributes in customAttributes or noteAttributes
 * @param {Object} order - Shopify order
 * @returns {Object} UTM parameters
 */
function extractUTMFromOrder(order) {
  const utmData = {
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_content: null,
    utm_term: null,
    landing_page: null,
    referrer: null,
  };

  const attributes = [
    ...(order.customAttributes || []),
    ...(order.noteAttributes || []),
  ];

  attributes.forEach((attr) => {
    const key = attr.key.toLowerCase();
    if (key === 'utm_source') utmData.utm_source = attr.value;
    if (key === 'utm_medium') utmData.utm_medium = attr.value;
    if (key === 'utm_campaign') utmData.utm_campaign = attr.value;
    if (key === 'utm_content') utmData.utm_content = attr.value;
    if (key === 'utm_term') utmData.utm_term = attr.value;
    if (key === 'landing_page') utmData.landing_page = attr.value;
    if (key === 'referrer') utmData.referrer = attr.value;
  });

  // Also check clientDetails if available (Shopify Plus)
  if (order.clientDetails) {
    if (!utmData.referrer && order.clientDetails.acceptLanguage) {
      // Store browser info as fallback
      utmData.referrer = order.clientDetails.acceptLanguage;
    }
  }

  return utmData;
}

/**
 * Formats order data for API response
 * @param {Object} order - Order from database
 * @param {Array} lineItems - Line items from database
 * @returns {Object} Formatted API response
 */
function formatOrderForAPI(order, lineItems = []) {
  return {
    id: order.id,
    shopify_order_id: order.shopify_order_id.toString(),
    order_number: order.order_number,
    name: order.name,
    financial: {
      total_price: parseFloat(order.total_price),
      subtotal_price: parseFloat(order.subtotal_price),
      total_tax: parseFloat(order.total_tax),
      total_discounts: parseFloat(order.total_discounts),
      total_shipping: parseFloat(order.total_shipping),
      currency: order.currency,
      status: order.financial_status,
    },
    customer: {
      email: order.email,
      shopify_customer_id: order.customer_shopify_id?.toString(),
    },
    status: {
      financial: order.financial_status,
      fulfillment: order.fulfillment_status,
      cancelled_at: order.cancelled_at,
      closed_at: order.closed_at,
    },
    attribution: {
      utm_source: order.utm_source,
      utm_medium: order.utm_medium,
      utm_campaign: order.utm_campaign,
      utm_content: order.utm_content,
      utm_term: order.utm_term,
      landing_page: order.landing_page,
      referrer: order.referrer,
    },
    line_items: lineItems.map((item) => ({
      id: item.id,
      title: item.title,
      variant_title: item.variant_title,
      sku: item.sku,
      quantity: item.quantity,
      price: parseFloat(item.price),
      total_discount: parseFloat(item.total_discount),
    })),
    timestamps: {
      created_at: order.shopify_created_at,
      updated_at: order.shopify_updated_at,
      processed_at: order.processed_at,
    },
  };
}

module.exports = {
  transformOrderFromShopify,
  transformLineItemsFromShopify,
  transformCustomerFromShopify,
  extractIdFromGID,
  extractUTMFromOrder,
  formatOrderForAPI,
};
