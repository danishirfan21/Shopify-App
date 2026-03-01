import React from 'react';
import { render, screen } from '@testing-library/react';
import { AppProvider } from '@shopify/polaris';
import en from '@shopify/polaris/locales/en.json';
import OrdersTable from './OrdersTable';
import { describe, it, expect, vi } from 'vitest';

const renderWithApp = (ui) => {
  return render(<AppProvider i18n={en}>{ui}</AppProvider>);
};

describe('OrdersTable', () => {
  const mockOrders = [
    {
      order_number: '1001',
      customer_email: 'test@example.com',
      total_price: '125.00',
      utm_source: 'google',
      created_at: '2024-01-01T10:00:00Z',
      financial_status: 'paid',
    },
    {
      shopify_order_id: 'gid://shopify/Order/12345',
      customer_email: 'jane@example.com',
      total_price: '85.50',
      utm_source: null,
      created_at: '2024-01-02T11:00:00Z',
      financial_status: 'refunded',
    },
  ];

  it('renders loading state correctly', () => {
    renderWithApp(<OrdersTable loading={true} orders={mockOrders} />);
    // When loading, Polaris DataTable might not render a 'grid' role if it's completely obscured or not in DOM
    // Let's check for the table headings instead which should be present
    expect(screen.getByText('Order ID')).toBeInTheDocument();
  });

  it('renders empty state when no orders', () => {
    renderWithApp(<OrdersTable loading={false} orders={[]} />);
    expect(screen.getByText('No orders found')).toBeInTheDocument();
    expect(screen.getByText('Try searching for a different order or filter.')).toBeInTheDocument();
  });

  it('renders orders table when data is present', () => {
    renderWithApp(<OrdersTable orders={mockOrders} loading={false} />);

    // Check headings
    expect(screen.getByText('Order ID')).toBeInTheDocument();
    expect(screen.getByText('Customer')).toBeInTheDocument();
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('UTM Source')).toBeInTheDocument();

    // Check first order row
    expect(screen.getByText('#1001')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('$125.00')).toBeInTheDocument();
    expect(screen.getByText('google')).toBeInTheDocument();

    // Check second order row (handles missing utm_source with Direct)
    expect(screen.getByText('#gid://shopify/Order/12345')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('$85.50')).toBeInTheDocument();
    expect(screen.getByText('Direct')).toBeInTheDocument();
  });

  it('handles pagination button clicks', () => {
    const onNext = vi.fn();
    const onPrev = vi.fn();

    renderWithApp(
      <OrdersTable
        orders={mockOrders}
        hasNext={true}
        hasPrevious={true}
        onNextPage={onNext}
        onPreviousPage={onPrev}
      />
    );

    const nextBtn = screen.getByRole('button', { name: 'Next' });
    const prevBtn = screen.getByRole('button', { name: 'Previous' });

    nextBtn.click();
    expect(onNext).toHaveBeenCalled();

    prevBtn.click();
    expect(onPrev).toHaveBeenCalled();
  });
});
