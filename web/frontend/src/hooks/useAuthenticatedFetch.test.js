import { renderHook } from '@testing-library/react';
import { useAuthenticatedFetch } from './useAuthenticatedFetch';
import { useAppBridge } from '@shopify/app-bridge-react';
import { getSessionToken } from '@shopify/app-bridge/utilities';
import api from '../services/api';
import { describe, it, expect, vi } from 'vitest';

// Mock the dependencies
vi.mock('@shopify/app-bridge-react');
vi.mock('@shopify/app-bridge/utilities');
vi.mock('../services/api');

describe('useAuthenticatedFetch', () => {
  it('should call api with Authorization header', async () => {
    const mockToken = 'test-token';
    const mockApp = {};
    const mockResponse = { data: { success: true } };

    useAppBridge.mockReturnValue(mockApp);
    getSessionToken.mockResolvedValue(mockToken);
    api.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAuthenticatedFetch());
    const fetch = result.current;

    const data = await fetch('/test-endpoint');

    expect(getSessionToken).toHaveBeenCalledWith(mockApp);
    expect(api).toHaveBeenCalledWith(expect.objectContaining({
      url: '/test-endpoint',
      headers: expect.objectContaining({
        Authorization: `Bearer ${mockToken}`,
      }),
    }));
    expect(data).toEqual(mockResponse.data);
  });

  it('should handle unauthorized error', async () => {
    const mockToken = 'test-token';
    const mockApp = {};
    const mockError = {
      response: { status: 401 },
    };

    useAppBridge.mockReturnValue(mockApp);
    getSessionToken.mockResolvedValue(mockToken);
    api.mockRejectedValue(mockError);

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useAuthenticatedFetch());
    const fetch = result.current;

    await expect(fetch('/unauthorized')).rejects.toEqual(mockError);
    expect(consoleSpy).toHaveBeenCalledWith('Unauthorized access. Session may have expired.');

    consoleSpy.mockRestore();
  });
});
