/**
 * fetch() that cannot hang the boot overlay forever on a stalled Railway/DB call.
 */
export async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const timeout = Number(timeoutMs);
  if (!Number.isFinite(timeout) || timeout <= 0) {
    return fetch(url, options);
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);

  if (options.signal) {
    if (options.signal.aborted) {
      ctrl.abort();
    } else {
      options.signal.addEventListener('abort', () => ctrl.abort(), { once: true });
    }
  }

  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}
