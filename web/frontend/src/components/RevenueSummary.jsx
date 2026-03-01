import React from 'react';
import { LegacyCard, Grid, Text, BlockStack } from '@shopify/polaris';

/**
 * Metric summary cards for the main dashboard.
 */
export default function RevenueSummary({ data, loading }) {
  const { totalRevenue = 0, totalOrders = 0, aov = 0 } = data || {};

  const metrics = [
    {
      label: 'Total Revenue',
      value: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      loading,
    },
    {
      label: 'Total Orders',
      value: totalOrders.toLocaleString(),
      loading,
    },
    {
      label: 'Average Order Value',
      value: `$${aov.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      loading,
    },
  ];

  return (
    <Grid>
      {metrics.map((metric, index) => (
        <Grid.Cell key={index} columnSpan={{ xs: 6, sm: 3, md: 3, lg: 4, xl: 4 }}>
          <LegacyCard sectioned subdued={metric.loading}>
            <BlockStack gap="200">
              <Text variant="headingSm" as="h6" color="subdued">
                {metric.label}
              </Text>
              <Text variant="headingLg" as="p">
                {metric.loading ? '---' : metric.value}
              </Text>
            </BlockStack>
          </LegacyCard>
        </Grid.Cell>
      ))}
    </Grid>
  );
}
