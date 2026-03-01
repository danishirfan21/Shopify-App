import React from 'react';
import { render, screen } from '@testing-library/react';
import { AppProvider } from '@shopify/polaris';
import en from '@shopify/polaris/locales/en.json';
import AttributionChart from './AttributionChart';
import { describe, it, expect, vi } from 'vitest';

// Mock Recharts to avoid issues with SVG rendering in JSDOM
vi.mock('recharts', async () => {
  const original = await vi.importActual('recharts');
  return {
    ...original,
    ResponsiveContainer: ({ children }) => <div style={{ width: '100%', height: '300px' }}>{children}</div>,
    BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
    LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Bar: () => null,
    Line: () => null,
    Legend: () => null,
  };
});

const renderWithApp = (ui) => {
  return render(<AppProvider i18n={en}>{ui}</AppProvider>);
};

describe('AttributionChart', () => {
  const mockData = [
    { source: 'google', revenue: 1000 },
    { source: 'facebook', revenue: 500 },
  ];

  it('renders loading state', () => {
    renderWithApp(<AttributionChart title="Test Chart" loading={true} />);
    expect(screen.getByText('Loading chart data...')).toBeInTheDocument();
  });

  it('renders empty state when no data', () => {
    renderWithApp(<AttributionChart title="Test Chart" data={[]} />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
    expect(screen.getByText('There is no attribution data for this period.')).toBeInTheDocument();
  });

  it('renders bar chart by default', () => {
    renderWithApp(<AttributionChart title="Test Chart Bar" data={mockData} />);
    // Use getAllByText and check for at least one since Polaris might duplicate it
    expect(screen.getAllByText('Test Chart Bar').length).toBeGreaterThan(0);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('renders line chart when specified', () => {
    renderWithApp(<AttributionChart title="Test Chart Line" data={mockData} type="line" nameKey="source" />);
    expect(screen.getAllByText('Test Chart Line').length).toBeGreaterThan(0);
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });
});
