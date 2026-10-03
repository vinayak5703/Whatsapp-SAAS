const isBrowser = typeof window !== 'undefined';
const host = isBrowser ? window.location.hostname : 'localhost';
const protocol = isBrowser ? window.location.protocol : 'http:';

// Connect directly to NestJS backend on port 3001 dynamically
export const environment = {
  apiBaseUrl: `${protocol}//${host}:3001/api/v1`,
  production: true,
} as const;