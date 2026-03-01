import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AppProvider } from '@shopify/polaris';
import en from '@shopify/polaris/locales/en.json';
import Dashboard from './Dashboard';
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the hook
vi.mock('../hooks/useAuthenticatedFetch');

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

describe('Dashboard Route', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    useAuthenticatedFetch.mockReturnValue(mockFetch);
    mockFetch.mockReset();
  });

  it('renders dashboard with fetched data', async () => {
    const mockRevenue = {
      data: {
        totalRevenue: 5000,
        totalOrders: 50,
        aov: 100,
        history: [{ date: '2024-01', revenue: 5000 }]
      }
    };
    const mockSources = {
      data: [{ utm_source: 'google', revenue: 3000 }, { utm_source: 'facebook', revenue: 2000 }]
    };
    const mockComparison = {
      data: [{ model: 'First Touch', revenue: 4800 }, { model: 'Last Touch', revenue: 5000 }]
    };

    mockFetch
      .mockResolvedValueOnce(mockRevenue)
      .mockResolvedValueOnce(mockSources)
      .mockResolvedValueOnce(mockComparison);

    renderWithApp(<Dashboard />);

    // Initially loading
    expect(screen.getAllByText('Loading chart data...').length).toBeGreaterThan(0);

    // Wait for data to be displayed
    await waitFor(() => {
      expect(screen.getByText('$5,000.00')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('$100.00')).toBeInTheDocument();
    });

    // Check charts
    expect(screen.getAllByText('Revenue Over Time').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Revenue by UTM Source').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Model Comparison').length).toBeGreaterThan(0);
  });

  it('renders error banner when fetch fails', async () => {
    mockFetch.mockRejectedValue(new Error('Fetch failed'));

    renderWithApp(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Error loading analytics. Please try again later.')).toBeInTheDocument();
    });
  });
});
