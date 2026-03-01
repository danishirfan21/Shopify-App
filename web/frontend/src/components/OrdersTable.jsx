import React from 'react';
import {
  DataTable,
  LegacyCard,
  EmptyState,
  Pagination,
  Box,
} from '@shopify/polaris';

/**
 * Table component for displaying the list of orders with attribution data.
 */
export default function OrdersTable({
  orders = [],
  loading,
  onNextPage,
  onPreviousPage,
  hasNext,
  hasPrevious
}) {
  if (!loading && orders.length === 0) {
    return (
      <LegacyCard sectioned>
        <EmptyState
          heading="No orders found"
          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        >
          <p>Try searching for a different order or filter.</p>
        </EmptyState>
      </LegacyCard>
    );
  }

  const rows = orders.map((order) => [
    `#${order.order_number || order.shopify_order_id}`,
    order.customer_email || 'No email',
    `$${Number(order.total_price).toFixed(2)}`,
    order.utm_source || 'Direct',
    new Date(order.created_at).toLocaleDateString(),
    order.financial_status || 'N/A',
  ]);

  const headings = [
    'Order ID',
    'Customer',
    'Revenue',
    'UTM Source',
    'Created At',
    'Status',
  ];

  return (
    <LegacyCard>
      <DataTable
        columnContentTypes={['text', 'text', 'numeric', 'text', 'text', 'text']}
        headings={headings}
        rows={rows}
        loading={loading}
      />
      <Box padding="400" borderBlockStart="1px solid #dfe3e8" display="flex" justifyContent="center">
        <Pagination
          hasPrevious={hasPrevious}
          hasNext={hasNext}
          onPrevious={onPreviousPage}
          onNext={onNextPage}
        />
      </Box>
    </LegacyCard>
  );
}
