const isBrowser = typeof window !== 'undefined';
const host = isBrowser ? window.location.hostname : 'localhost';
const port = isBrowser ? window.location.port : '3001';
const protocol = isBrowser ? window.location.protocol : 'http:';

let baseUrl = '/api/v1';
if (isBrowser) {
  // If running on Angular dev server (4200) or IIS (8080), route to port 3001 directly
  if (port === '8080' || port === '4200') {
    baseUrl = `${protocol}//${host}:3001/api/v1`;
  } else if (port === '3001') {
    baseUrl = `${protocol}//${host}:3001/api/v1`;
  } else {
    // If accessed via public tunnel (loca.lt, ngrok, cloudflare) or custom domain
    baseUrl = `/api/v1`;
  }
}

export const environment = {
  apiBaseUrl: baseUrl,
  production: true,
} as const;