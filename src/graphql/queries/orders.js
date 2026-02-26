/**
 * GraphQL Queries for Orders
 * Production-ready queries with all necessary fields for attribution
 */

/**
 * Fetches orders with pagination
 * Includes customer, line items, and attribution data
 */
const FETCH_ORDERS = `
  query fetchOrders($first: Int!, $after: String) {
    orders(first: $first, after: $after, sortKey: CREATED_AT) {
      edges {
        cursor
        node {
          id
          name
          createdAt
          updatedAt
          processedAt
          cancelledAt
          closedAt
          email
          phone
          orderNumber

          displayFinancialStatus
          displayFulfillmentStatus

          currencyCode

          totalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }

          subtotalPriceSet {
            shopMoney {
              amount
            }
          }

          totalTaxSet {
            shopMoney {
              amount
            }
          }

          totalDiscountsSet {
            shopMoney {
              amount
            }
          }

          totalShippingPriceSet {
            shopMoney {
              amount
            }
          }

          customer {
            id
            email
            firstName
            lastName
            phone
            numberOfOrders
            amountSpent {
              amount
            }
            createdAt
            acceptsMarketing
            state
          }

          lineItems(first: 50) {
            edges {
              node {
                id
                title
                variantTitle
                sku
                quantity

                originalUnitPriceSet {
                  shopMoney {
                    amount
                  }
                }

                totalDiscountSet {
                  shopMoney {
                    amount
                  }
                }

                fulfillmentStatus
                requiresShipping
                taxable
                giftCard

                product {
                  id
                }

                variant {
                  id
                }
              }
            }
          }

          customAttributes {
            key
            value
          }

          note
          noteAttributes {
            name
            value
          }

          clientDetails {
            acceptLanguage
            browserIp
            userAgent
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

/**
 * Fetches a single order by ID
 */
const FETCH_ORDER_BY_ID = `
  query fetchOrderById($id: ID!) {
    order(id: $id) {
      id
      name
      createdAt
      updatedAt
      email

      displayFinancialStatus
      displayFulfillmentStatus

      totalPriceSet {
        shopMoney {
          amount
          currencyCode
        }
      }

      customer {
        id
        email
        firstName
        lastName
      }

      lineItems(first: 250) {
        edges {
          node {
            id
            title
            quantity
            originalUnitPriceSet {
              shopMoney {
                amount
              }
            }
          }
        }
      }

      customAttributes {
        key
        value
      }
    }
  }
`;

/**
 * Fetches orders updated after a specific date (for incremental sync)
 */
const FETCH_ORDERS_UPDATED_SINCE = `
  query fetchOrdersUpdatedSince($updatedAtMin: DateTime!, $first: Int!, $after: String) {
    orders(
      first: $first
      after: $after
      query: "updated_at:>='${updatedAtMin}'"
      sortKey: UPDATED_AT
    ) {
      edges {
        cursor
        node {
          id
          name
          updatedAt
          displayFinancialStatus
          totalPriceSet {
            shopMoney {
              amount
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

module.exports = {
  FETCH_ORDERS,
  FETCH_ORDER_BY_ID,
  FETCH_ORDERS_UPDATED_SINCE,
};
