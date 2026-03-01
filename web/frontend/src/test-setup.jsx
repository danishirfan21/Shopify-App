import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

// Mock App Bridge
vi.mock('@shopify/app-bridge-react', () => ({
  useAppBridge: vi.fn(() => ({})),
  AppBridgeProvider: ({ children }) => <div>{children}</div>,
  NavigationMenu: () => null,
}));

vi.mock('@shopify/app-bridge/utilities', () => ({
  getSessionToken: vi.fn(() => Promise.resolve('mock-token')),
}));
