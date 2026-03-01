import React, { useState, useEffect } from 'react';
import { Page, BlockStack, Banner, Layout } from '@shopify/polaris';
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch';
import OrdersTable from '../components/OrdersTable';

/**
 * Detailed view for listing and managing synchronized orders.
 */
export default function Orders() {
  const fetch = useAuthenticatedFetch();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true);
      const data = await fetch(`/orders?page=${page}&limit=${pagination.limit}`);

      setOrders(data.data || []);
      setPagination(prev => ({
        ...prev,
        page,
        total: data.pagination?.total || 0,
        hasNext: data.pagination?.has_next || false,
        hasPrevious: page > 1
      }));
      setError(null);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Error loading orders. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [fetch]);

  return (
    <Page title="Orders" subtitle="Track revenue and attribution for every order">
      <BlockStack gap="500">
        {error && (
          <Banner status="critical" onDismiss={() => setError(null)}>
            {error}
          </Banner>
        )}

        <Layout>
          <Layout.Section>
            <OrdersTable
              orders={orders}
              loading={loading}
              onNextPage={() => fetchOrders(pagination.page + 1)}
              onPreviousPage={() => fetchOrders(pagination.page - 1)}
              hasNext={pagination.hasNext}
              hasPrevious={pagination.hasPrevious}
            />
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
