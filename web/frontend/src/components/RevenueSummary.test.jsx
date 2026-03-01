import React from 'react';
import { render, screen } from '@testing-library/react';
import { AppProvider } from '@shopify/polaris';
import en from '@shopify/polaris/locales/en.json';
import RevenueSummary from './RevenueSummary';
import { describe, it, expect } from 'vitest';

const renderWithApp = (ui) => {
  return render(<AppProvider i18n={en}>{ui}</AppProvider>);
};

describe('RevenueSummary', () => {
  const mockData = {
    totalRevenue: 1250.50,
    totalOrders: 15,
    aov: 83.37,
  };

  it('renders correctly with data', () => {
    renderWithApp(<RevenueSummary data={mockData} loading={false} />);

    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('$1,250.50')).toBeInTheDocument();

    expect(screen.getByText('Total Orders')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();

    expect(screen.getByText('Average Order Value')).toBeInTheDocument();
    expect(screen.getByText('$83.37')).toBeInTheDocument();
  });

  it('renders loading placeholder when loading', () => {
    renderWithApp(<RevenueSummary data={{}} loading={true} />);

    const placeholders = screen.getAllByText('---');
    expect(placeholders).toHaveLength(3);
  });

  it('handles empty data by showing default zero values', () => {
    renderWithApp(<RevenueSummary data={null} loading={false} />);

    const zeros = screen.getAllByText('$0.00');
    expect(zeros).toHaveLength(2); // Total Revenue and AOV
    expect(screen.getByText('0')).toBeInTheDocument(); // Total Orders
  });
});
