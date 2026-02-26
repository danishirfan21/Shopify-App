# API Response Examples

Complete examples of API responses from the Shopify Attribution & Order Inspector.

## Orders API

### Get Orders (Paginated)

**Request:**
```http
GET /api/orders?page=1&limit=2&start_date=2024-01-01&end_date=2024-12-31&utm_source=google
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "shopify_order_id": "5678901234",
      "order_number": "1001",
      "name": "#1001",
      "financial": {
        "total_price": 149.99,
        "subtotal_price": 139.99,
        "total_tax": 10.00,
        "total_discounts": 15.00,
        "total_shipping": 25.00,
        "currency": "USD",
        "status": "paid"
      },
      "customer": {
        "email": "customer@example.com",
        "shopify_customer_id": "1234567890"
      },
      "status": {
        "financial": "paid",
        "fulfillment": "fulfilled",
        "cancelled_at": null,
        "closed_at": null
      },
      "attribution": {
        "utm_source": "google",
        "utm_medium": "cpc",
        "utm_campaign": "summer_sale",
        "utm_content": "ad_variant_a",
        "utm_term": "running shoes",
        "landing_page": "https://store.com/products/shoes",
        "referrer": "https://google.com"
      },
      "line_items": [
        {
          "id": 1,
          "title": "Running Shoes",
          "variant_title": "Size: 10 / Color: Blue",
          "sku": "SHOES-RUN-10-BLU",
          "quantity": 1,
          "price": 99.99,
          "total_discount": 10.00
        },
        {
          "id": 2,
          "title": "Sports Socks",
          "variant_title": "Size: L",
          "sku": "SOCKS-SPT-L",
          "quantity": 2,
          "price": 19.99,
          "total_discount": 5.00
        }
      ],
      "timestamps": {
        "created_at": "2024-01-15T14:30:00.000Z",
        "updated_at": "2024-01-15T15:00:00.000Z",
        "processed_at": "2024-01-15T14:32:00.000Z"
      }
    },
    {
      "id": 2,
      "shopify_order_id": "5678901235",
      "order_number": "1002",
      "name": "#1002",
      "financial": {
        "total_price": 79.99,
        "subtotal_price": 69.99,
        "total_tax": 5.60,
        "total_discounts": 0.00,
        "total_shipping": 4.40,
        "currency": "USD",
        "status": "paid"
      },
      "customer": {
        "email": "john@example.com",
        "shopify_customer_id": "1234567891"
      },
      "status": {
        "financial": "paid",
        "fulfillment": "unfulfilled",
        "cancelled_at": null,
        "closed_at": null
      },
      "attribution": {
        "utm_source": "google",
        "utm_medium": "cpc",
        "utm_campaign": "winter_collection",
        "utm_content": null,
        "utm_term": "winter jacket",
        "landing_page": "https://store.com/collections/winter",
        "referrer": null
      },
      "line_items": [
        {
          "id": 3,
          "title": "Winter Jacket",
          "variant_title": "Size: M / Color: Black",
          "sku": "JACKET-WIN-M-BLK",
          "quantity": 1,
          "price": 69.99,
          "total_discount": 0.00
        }
      ],
      "timestamps": {
        "created_at": "2024-01-16T10:15:00.000Z",
        "updated_at": "2024-01-16T10:15:00.000Z",
        "processed_at": "2024-01-16T10:16:00.000Z"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 2,
    "total": 45,
    "total_pages": 23,
    "has_more": true
  },
  "links": {
    "self": "/api/orders?page=1&limit=2&start_date=2024-01-01&utm_source=google",
    "next": "/api/orders?page=2&limit=2",
    "prev": null
  }
}
```

### Get Single Order

**Request:**
```http
GET /api/orders/1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "shopify_order_id": "5678901234",
    "order_number": "1001",
    "name": "#1001",
    "financial": {
      "total_price": 149.99,
      "subtotal_price": 139.99,
      "total_tax": 10.00,
      "total_discounts": 15.00,
      "total_shipping": 25.00,
      "currency": "USD",
      "status": "paid"
    },
    "customer": {
      "email": "customer@example.com",
      "shopify_customer_id": "1234567890"
    },
    "status": {
      "financial": "paid",
      "fulfillment": "fulfilled",
      "cancelled_at": null,
      "closed_at": null
    },
    "attribution": {
      "utm_source": "google",
      "utm_medium": "cpc",
      "utm_campaign": "summer_sale",
      "utm_content": "ad_variant_a",
      "utm_term": "running shoes",
      "landing_page": "https://store.com/products/shoes",
      "referrer": "https://google.com"
    },
    "line_items": [
      {
        "id": 1,
        "title": "Running Shoes",
        "variant_title": "Size: 10 / Color: Blue",
        "sku": "SHOES-RUN-10-BLU",
        "quantity": 1,
        "price": 99.99,
        "total_discount": 10.00
      },
      {
        "id": 2,
        "title": "Sports Socks",
        "variant_title": "Size: L",
        "sku": "SOCKS-SPT-L",
        "quantity": 2,
        "price": 19.99,
        "total_discount": 5.00
      }
    ],
    "timestamps": {
      "created_at": "2024-01-15T14:30:00.000Z",
      "updated_at": "2024-01-15T15:00:00.000Z",
      "processed_at": "2024-01-15T14:32:00.000Z"
    }
  }
}
```

### Revenue Analytics

**Request:**
```http
GET /api/orders/analytics/revenue?start_date=2024-01-01&end_date=2024-01-31
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "start_date": "2024-01-01T00:00:00.000Z",
      "end_date": "2024-01-31T23:59:59.999Z"
    },
    "totals": {
      "total_revenue": 45678.90,
      "total_orders": 234,
      "unique_customers": 189,
      "average_order_value": 195.20
    },
    "daily": [
      {
        "date": "2024-01-01",
        "order_count": 8,
        "revenue": 1456.32,
        "unique_customers": 7
      },
      {
        "date": "2024-01-02",
        "order_count": 12,
        "revenue": 2134.56,
        "unique_customers": 10
      },
      {
        "date": "2024-01-03",
        "order_count": 6,
        "revenue": 987.45,
        "unique_customers": 6
      }
    ]
  }
}
```

### Top Products

**Request:**
```http
GET /api/orders/analytics/top-products?start_date=2024-01-01&end_date=2024-01-31&limit=5
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "title": "Running Shoes",
      "sku": "SHOES-RUN-10-BLU",
      "total_quantity": 45,
      "total_revenue": 4499.55
    },
    {
      "title": "Winter Jacket",
      "sku": "JACKET-WIN-M-BLK",
      "total_quantity": 32,
      "total_revenue": 2239.68
    },
    {
      "title": "Sports Socks",
      "sku": "SOCKS-SPT-L",
      "total_quantity": 67,
      "total_revenue": 1339.33
    },
    {
      "title": "Yoga Mat",
      "sku": "MAT-YOGA-BLU",
      "total_quantity": 28,
      "total_revenue": 839.72
    },
    {
      "title": "Water Bottle",
      "sku": "BOTTLE-WATER-500",
      "total_quantity": 54,
      "total_revenue": 539.46
    }
  ]
}
```

## Attribution API

### Revenue by Source

**Request:**
```http
GET /api/attribution/sources?start_date=2024-01-01&end_date=2024-01-31
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "source": {
        "utm_source": "google",
        "utm_medium": "cpc",
        "utm_campaign": "summer_sale"
      },
      "metrics": {
        "order_count": 87,
        "total_revenue": 17456.78,
        "average_order_value": 200.65
      }
    },
    {
      "source": {
        "utm_source": "facebook",
        "utm_medium": "paid",
        "utm_campaign": "retargeting"
      },
      "metrics": {
        "order_count": 56,
        "total_revenue": 11234.90,
        "average_order_value": 200.62
      }
    },
    {
      "source": {
        "utm_source": "instagram",
        "utm_medium": "social",
        "utm_campaign": "influencer_collab"
      },
      "metrics": {
        "order_count": 34,
        "total_revenue": 6789.12,
        "average_order_value": 199.68
      }
    },
    {
      "source": {
        "utm_source": null,
        "utm_medium": null,
        "utm_campaign": null
      },
      "metrics": {
        "order_count": 57,
        "total_revenue": 10198.10,
        "average_order_value": 178.91
      }
    }
  ]
}
```

### Attribution Funnel

**Request:**
```http
GET /api/attribution/funnel?start_date=2024-01-01&end_date=2024-01-31
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "source": "google",
      "metrics": {
        "total_orders": 87,
        "paid_orders": 82,
        "revenue": 17456.78,
        "avg_order_value": 212.89,
        "conversion_rate": 94.25
      }
    },
    {
      "source": "facebook",
      "metrics": {
        "total_orders": 56,
        "paid_orders": 53,
        "revenue": 11234.90,
        "avg_order_value": 211.98,
        "conversion_rate": 94.64
      }
    },
    {
      "source": "Direct",
      "metrics": {
        "total_orders": 57,
        "paid_orders": 55,
        "revenue": 10198.10,
        "avg_order_value": 185.42,
        "conversion_rate": 96.49
      }
    }
  ]
}
```

### Top Campaigns

**Request:**
```http
GET /api/attribution/campaigns?start_date=2024-01-01&end_date=2024-01-31&limit=5
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "campaign": "summer_sale",
      "source": "google",
      "medium": "cpc",
      "metrics": {
        "order_count": 87,
        "total_revenue": 17456.78,
        "avg_order_value": 200.65,
        "unique_customers": 73
      }
    },
    {
      "campaign": "retargeting",
      "source": "facebook",
      "medium": "paid",
      "metrics": {
        "order_count": 56,
        "total_revenue": 11234.90,
        "avg_order_value": 200.62,
        "unique_customers": 48
      }
    },
    {
      "campaign": "influencer_collab",
      "source": "instagram",
      "medium": "social",
      "metrics": {
        "order_count": 34,
        "total_revenue": 6789.12,
        "avg_order_value": 199.68,
        "unique_customers": 31
      }
    },
    {
      "campaign": "newsletter_jan",
      "source": "email",
      "medium": "email",
      "metrics": {
        "order_count": 29,
        "total_revenue": 5234.67,
        "avg_order_value": 180.51,
        "unique_customers": 27
      }
    },
    {
      "campaign": "winter_collection",
      "source": "google",
      "medium": "cpc",
      "metrics": {
        "order_count": 23,
        "total_revenue": 4567.89,
        "avg_order_value": 198.60,
        "unique_customers": 21
      }
    }
  ]
}
```

### Attribution Model Comparison

**Request:**
```http
GET /api/attribution/model-comparison?start_date=2024-01-01&end_date=2024-01-31
```

**Response:**
```json
{
  "success": true,
  "data": {
    "description": "Comparison of first-touch vs last-touch attribution models",
    "last_touch": [
      {
        "utm_source": "google",
        "utm_medium": "cpc",
        "utm_campaign": "summer_sale",
        "order_count": 87,
        "total_revenue": 17456.78,
        "average_order_value": 200.65
      },
      {
        "utm_source": "facebook",
        "utm_medium": "paid",
        "utm_campaign": "retargeting",
        "order_count": 56,
        "total_revenue": 11234.90,
        "average_order_value": 200.62
      }
    ],
    "first_touch": [
      {
        "utm_source": "instagram",
        "utm_medium": "social",
        "utm_campaign": "influencer_collab",
        "customer_count": 45,
        "total_revenue": 9876.54,
        "average_ltv": 219.48
      },
      {
        "utm_source": "google",
        "utm_medium": "organic",
        "utm_campaign": null,
        "customer_count": 38,
        "total_revenue": 8234.12,
        "average_ltv": 216.69
      }
    ]
  }
}
```

## Error Responses

### Validation Error

**Response:**
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "ValidationError",
    "details": [
      "Start date must be before end date"
    ]
  }
}
```

### Authentication Error

**Response:**
```json
{
  "success": false,
  "error": {
    "message": "Not authenticated - please install the app",
    "code": "AuthenticationError"
  }
}
```

### Rate Limit Error

**Response:**
```json
{
  "success": false,
  "error": {
    "message": "Too many requests, please try again later",
    "code": "RateLimitExceeded"
  }
}
```

### Not Found Error

**Response:**
```json
{
  "success": false,
  "error": {
    "message": "Order not found",
    "code": "NotFoundError"
  }
}
```
