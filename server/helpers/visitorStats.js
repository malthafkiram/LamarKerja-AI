/**
 * Cookie uniqueness, bot skip, and SSE framing for public social-proof counts.
 * No PII — visitor id is anonymous and is not a login.
 */
export const VISITOR_COOKIE = 'lk_vid';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const BOT_UA_RE =
  /bot|crawler|spider|crawling|slurp|bingpreview|facebookexternalhit|wget|curl|python-requests/i;

const COOKIE_MAX_AGE_MS = 400 * 24 * 60 * 60 * 1000;

export function isBotUserAgent(ua) {
  if (!ua) return false;
  return BOT_UA_RE.test(ua);
}

export function parseCookieValue(cookieHeader, name) {
  if (!cookieHeader || !name) return null;
  const parts = String(cookieHeader).split(';');
  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    if (key !== name) continue;
    try {
      return decodeURIComponent(part.slice(idx + 1).trim());
    } catch {
      return part.slice(idx + 1).trim();
    }
  }
  return null;
}

export function isValidVisitorId(id) {
  return typeof id === 'string' && UUID_RE.test(id);
}

export function formatSseEvent(event, data) {
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  return `event: ${event}\ndata: ${payload}\n\n`;
}

export function formatSseComment(text) {
  return `:${text}\n\n`;
}

export function visitorCookieOptions({
  secure = false,
  crossSite = false,
  maxAgeMs = COOKIE_MAX_AGE_MS
} = {}) {
  return {
    httpOnly: true,
    sameSite: crossSite ? 'none' : 'lax',
    secure: crossSite ? true : secure,
    path: '/',
    maxAge: maxAgeMs
  };
}

export function createSseHub({ heartbeatMs = 20_000 } = {}) {
  const clients = new Set();
  let heartbeatTimer = null;

  function startHeartbeat() {
    if (heartbeatTimer) return;
    heartbeatTimer = setInterval(() => {
      const msg = formatSseComment('heartbeat');
      for (const res of clients) {
        try {
          res.write(msg);
        } catch {
          clients.delete(res);
        }
      }
    }, heartbeatMs);
    if (typeof heartbeatTimer.unref === 'function') heartbeatTimer.unref();
  }

  function stopHeartbeat() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  }

  return {
    add(res) {
      clients.add(res);
      startHeartbeat();
    },
    remove(res) {
      clients.delete(res);
      if (clients.size === 0) stopHeartbeat();
    },
    broadcast(payload) {
      const msg = formatSseEvent('stats', payload);
      for (const res of clients) {
        try {
          res.write(msg);
        } catch {
          clients.delete(res);
        }
      }
    },
    get size() {
      return clients.size;
    },
    stopHeartbeat
  };
}
