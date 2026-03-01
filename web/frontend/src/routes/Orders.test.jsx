import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AppProvider } from '@shopify/polaris';
import en from '@shopify/polaris/locales/en.json';
import Orders from './Orders';
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the hook
vi.mock('../hooks/useAuthenticatedFetch');

const renderWithApp = (ui) => {
  return render(<AppProvider i18n={en}>{ui}</AppProvider>);
};

describe('Orders Route', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    useAuthenticatedFetch.mockReturnValue(mockFetch);
    mockFetch.mockReset();
  });

  it('renders orders route with data', async () => {
    const mockData = {
      data: [
        {
          order_number: '1001',
          customer_email: 'test@example.com',
          total_price: '125.00',
          utm_source: 'google',
          created_at: '2024-01-01T10:00:00Z',
          financial_status: 'paid',
        },
      ],
      pagination: {
        total: 1,
        page: 1,
        limit: 10,
        has_next: false,
      },
    };

    mockFetch.mockResolvedValue(mockData);

    renderWithApp(<Orders />);

    // Check for a heading that should be present
    expect(screen.getByText('Orders')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('#1001')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('$125.00')).toBeInTheDocument();
      expect(screen.getByText('google')).toBeInTheDocument();
    });
  });

  it('handles empty state when no orders returned', async () => {
    mockFetch.mockResolvedValue({ data: [], pagination: { total: 0 } });

    renderWithApp(<Orders />);

    await waitFor(() => {
      expect(screen.getByText('No orders found')).toBeInTheDocument();
    });
  });

  it('renders error banner when fetch fails', async () => {
    mockFetch.mockRejectedValue(new Error('Fetch failed'));

    renderWithApp(<Orders />);

    await waitFor(() => {
      expect(screen.getByText('Error loading orders. Please check your connection.')).toBeInTheDocument();
    });
  });
});
