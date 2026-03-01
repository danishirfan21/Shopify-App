import React from 'react';
import { Page, Navigation } from '@shopify/polaris';
import { HomeIcon, OrderIcon } from '@shopify/polaris-icons';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Common Layout component that wraps all pages.
 * Includes top-level navigation.
 */
export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const navigationMarkup = (
    <Navigation location={location.pathname}>
      <Navigation.Section
        items={[
          {
            label: 'Dashboard',
            icon: HomeIcon,
            onClick: () => navigate('/'),
            selected: location.pathname === '/',
          },
          {
            label: 'Orders',
            icon: OrderIcon,
            onClick: () => navigate('/orders'),
            selected: location.pathname === '/orders',
          },
        ]}
      />
    </Navigation>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <div style={{ width: '240px', borderRight: '1px solid #dfe3e8', backgroundColor: '#f6f6f7' }}>
        {navigationMarkup}
      </div>
      <div style={{ flex: 1 }}>
        <Page fullWidth>
          {children}
        </Page>
      </div>
    </div>
  );
}
