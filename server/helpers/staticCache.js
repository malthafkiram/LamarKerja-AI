/**
 * Cache-Control for the Vite SPA. index.html and sw.js must never be cached
 * across Railway deploys; hashed /assets/* can be immutable.
 */
export function cacheControlForStaticFile(filePath) {
  const lower = String(filePath || '').replace(/\\/g, '/').toLowerCase();
  if (
    lower.endsWith('/index.html') ||
    lower.endsWith('index.html') ||
    lower.endsWith('/sw.js') ||
    lower.endsWith('sw.js')
  ) {
    return 'no-store, no-cache, must-revalidate';
  }
  if (lower.includes('/assets/')) {
    return 'public, max-age=31536000, immutable';
  }
  return undefined;
}
