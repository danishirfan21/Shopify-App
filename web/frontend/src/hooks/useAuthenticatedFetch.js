import { useCallback } from 'react';
import { useAppBridge } from '@shopify/app-bridge-react';
import { getSessionToken } from '@shopify/app-bridge/utilities';
import api from '../services/api';

/**
 * Custom hook to perform authenticated API requests to the backend.
 * Automatically attaches the Shopify Session Token (JWT) to the Authorization header.
 */
export function useAuthenticatedFetch() {
  const app = useAppBridge();

  const authenticatedFetch = useCallback(
    async (url, options = {}) => {
      try {
        const token = await getSessionToken(app);

        const headers = {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        };

        const response = await api({
          url,
          ...options,
          headers,
        });

        return response.data;
      } catch (error) {
        if (error.response?.status === 401) {
          // Redirect or handle unauthorized access
          console.error('Unauthorized access. Session may have expired.');
        }
        throw error;
      }
    },
    [app]
  );

  return authenticatedFetch;
}
