/**
 * Service-worker routing rules.
 * Vite hashes JS/CSS on each Railway deploy. Cache-first HTML points at deleted
 * /assets/index-OLDHASH.js and the page stays a blank white #root.
 */
export function shouldBypassServiceWorker(url, method = 'GET') {
  if (String(method || 'GET').toUpperCase() !== 'GET') return true;
  try {
    const parsed = new URL(url, 'https://lamarkerja.invalid');
    return parsed.pathname.startsWith('/api/');
  } catch {
    return String(url).includes('/api/');
  }
}

export function useNetworkFirst(request) {
  if (!request) return true;
  if (request.mode === 'navigate' || request.destination === 'document') return true;
  const dest = request.destination;
  if (dest === 'script' || dest === 'style') return true;
  try {
    const parsed = new URL(request.url, 'https://lamarkerja.invalid');
    const path = parsed.pathname;
    if (path === '/' || path.endsWith('.html') || path.endsWith('.js') || path.endsWith('.css')) {
      return true;
    }
  } catch {
    return true;
  }
  return false;
}
