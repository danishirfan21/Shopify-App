import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAppBridge } from '@shopify/app-bridge-react';
import { getSessionToken } from '@shopify/app-bridge/utilities';

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const app = useAppBridge();
  const [sessionToken, setSessionToken] = useState(null);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const token = await getSessionToken(app);
        setSessionToken(token);
      } catch (error) {
        console.error('Failed to get session token:', error);
      }
    };

    if (app) {
      fetchToken();
      // Tokens expire every minute, so we need to refresh
      const interval = setInterval(fetchToken, 50000);
      return () => clearInterval(interval);
    }
  }, [app]);

  return (
    <AuthContext.Provider value={{ sessionToken, app }}>
      {children}
    </AuthContext.Provider>
  );
};
