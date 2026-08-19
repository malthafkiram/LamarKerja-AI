/**
 * Prefix /api and /uploads with VITE_API_URL when the SPA is on Vercel
 * and Express lives on another host (EC2). Empty base = same-origin / Vite proxy.
 */
export function resolveApiUrl(path, baseUrl = '') {
  if (path == null) return path;
  const raw = String(path);
  if (/^https?:\/\//i.test(raw)) return raw;
  const p = raw.startsWith('/') ? raw : `/${raw}`;
  const base = String(baseUrl || '').replace(/\/$/, '');
  return `${base}${p}`;
}

export function getApiBase() {
  try {
    return String(import.meta.env?.VITE_API_URL || '').replace(/\/$/, '');
  } catch {
    return '';
  }
}

export function apiUrl(path) {
  return resolveApiUrl(path, getApiBase());
}

function shouldRewrite(path) {
  if (typeof path !== 'string') return false;
  if (/^https?:\/\//i.test(path)) return false;
  return path.startsWith('/api') || path.startsWith('/uploads');
}

/**
 * Point relative /api and /uploads requests at VITE_API_URL in the browser.
 */
export function installApiOriginPatch() {
  if (typeof window === 'undefined') return;
  if (window.__lkApiPatched) return;
  window.__lkApiPatched = true;

  const origFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    if (typeof input === 'string' && shouldRewrite(input)) {
      return origFetch(apiUrl(input), init);
    }
    return origFetch(input, init);
  };

  if (typeof window.EventSource !== 'function') return;
  const OrigES = window.EventSource;
  function PatchedEventSource(url, config) {
    const next = typeof url === 'string' && shouldRewrite(url) ? apiUrl(url) : url;
    return new OrigES(next, config);
  }
  PatchedEventSource.prototype = OrigES.prototype;
  PatchedEventSource.CONNECTING = OrigES.CONNECTING;
  PatchedEventSource.OPEN = OrigES.OPEN;
  PatchedEventSource.CLOSED = OrigES.CLOSED;
  window.EventSource = PatchedEventSource;
}
