import React from 'react';
import {
  LegacyCard,
  BlockStack,
  Text,
  EmptyState,
  Box,
} from '@shopify/polaris';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';

/**
 * Recharts component for displaying revenue breakdown and over-time trends.
 */
export default function AttributionChart({
  title,
  data = [],
  type = 'bar',
  loading,
  dataKey = 'revenue',
  nameKey = 'source'
}) {
  if (loading) {
    return (
      <LegacyCard title={title} sectioned>
        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Text variant="bodyMd" color="subdued">Loading chart data...</Text>
        </div>
      </LegacyCard>
    );
  }

  if (!data || data.length === 0) {
    return (
      <LegacyCard title={title} sectioned>
        <EmptyState
          heading="No data available"
          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        >
          <p>There is no attribution data for this period.</p>
        </EmptyState>
      </LegacyCard>
    );
  }

  return (
    <LegacyCard title={title} sectioned>
      <Box paddingBlockEnd="400">
        <Text variant="headingMd" as="h2">{title}</Text>
      </Box>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          {type === 'bar' ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey={nameKey} />
              <YAxis />
              <Tooltip
                formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
              />
              <Bar dataKey={dataKey} fill="#5c6ac4" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey={nameKey} />
              <YAxis />
              <Tooltip
                formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke="#5c6ac4"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </LegacyCard>
  );
}
