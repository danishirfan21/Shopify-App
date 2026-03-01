import React, { useState, useEffect } from 'react';
import { Page, Layout, BlockStack, Banner, Box, Text, LegacyCard } from '@shopify/polaris';
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch';
import RevenueSummary from '../components/RevenueSummary';
import AttributionChart from '../components/AttributionChart';

/**
 * Main dashboard view showing high-level metrics and attribution trends.
 */
export default function Dashboard() {
  const fetch = useAuthenticatedFetch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState({});
  const [attribution, setAttribution] = useState([]);
  const [modelComparison, setModelComparison] = useState([]);
  const [revenueHistory, setRevenueHistory] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [revenueData, sourcesData, comparisonData] = await Promise.all([
          fetch('/orders/analytics/revenue?start_date=2024-01-01&end_date=2024-12-31'),
          fetch('/attribution/sources?start_date=2024-01-01&end_date=2024-12-31'),
          fetch('/attribution/model-comparison?start_date=2024-01-01&end_date=2024-12-31')
        ]);

        setAnalytics(revenueData.data || {});
        setAttribution(sourcesData.data || []);
        setModelComparison(comparisonData.data || []);

        // Mock revenue history from analytics if not explicitly provided
        // In a real app, this would be a separate endpoint or part of revenue analytics
        setRevenueHistory(revenueData.data?.history || [
          { date: '2024-01', revenue: 4500 },
          { date: '2024-02', revenue: 5200 },
          { date: '2024-03', revenue: 4800 },
          { date: '2024-04', revenue: 6100 },
          { date: '2024-05', revenue: 5900 },
          { date: '2024-06', revenue: 7200 },
        ]);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Error loading analytics. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fetch]);

  return (
    <Page title="Overview">
      <BlockStack gap="500">
        {error && (
          <Banner status="critical" onDismiss={() => setError(null)}>
            {error}
          </Banner>
        )}

        <RevenueSummary data={analytics} loading={loading} />

        <Layout>
          <Layout.Section>
            <AttributionChart
              title="Revenue Over Time"
              data={revenueHistory}
              loading={loading}
              type="line"
              dataKey="revenue"
              nameKey="date"
            />
          </Layout.Section>

          <Layout.Section variant="oneHalf">
            <AttributionChart
              title="Revenue by UTM Source"
              data={attribution}
              loading={loading}
              dataKey="revenue"
              nameKey="utm_source"
            />
          </Layout.Section>
          <Layout.Section variant="oneHalf">
            <AttributionChart
              title="Model Comparison"
              data={modelComparison}
              loading={loading}
              type="bar"
              dataKey="revenue"
              nameKey="model"
            />
          </Layout.Section>
        </Layout>

        <Layout>
          <Layout.Section>
            <LegacyCard sectioned title="Revenue Forecast">
              <Box padding="400">
                <Text variant="bodyMd" color="subdued">
                  Real-time analytics processing for current billing cycle.
                </Text>
              </Box>
            </LegacyCard>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
