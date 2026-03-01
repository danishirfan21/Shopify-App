import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppBridgeProvider, NavigationMenu } from '@shopify/app-bridge-react';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './routes/Dashboard';
import Orders from './routes/Orders';

/**
 * Main application component.
 * Configures Shopify App Bridge, AuthContext, and React Router.
 */
export default function App() {
  const host = new URLSearchParams(location.search).get('host');
  const apiKey = import.meta.env.VITE_SHOPIFY_API_KEY || '';

  return (
    <Router>
      <AppBridgeProvider
        config={{
          apiKey,
          host,
          forceRedirect: true,
        }}
      >
        <AuthProvider>
          <NavigationMenu
            navigationLinks={[
              {
                label: 'Dashboard',
                destination: '/',
              },
              {
                label: 'Orders',
                destination: '/orders',
              },
            ]}
          />
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/orders" element={<Orders />} />
            </Routes>
          </Layout>
        </AuthProvider>
      </AppBridgeProvider>
    </Router>
  );
}
