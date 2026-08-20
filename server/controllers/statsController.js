/**
 * Public social-proof counts: unique visitors + registered users.
 * GET JSON is public (no PII). SSE pushes when either number changes.
 */
import {
  VISITOR_COOKIE,
  formatSseEvent,
  isValidVisitorId,
  parseCookieValue,
  visitorCookieOptions
} from '../helpers/visitorStats.js';
import {
  getSocialProofCounts,
  getSocialProofHub,
  touchLiveVisitor
} from '../services/socialProof.js';
import { ok, fail } from '../helpers/response.js';

function cookieSecure(req) {
  return req.secure === true || req.headers['x-forwarded-proto'] === 'https';
}

function setVisitorCookie(req, res, visitorId) {
  if (!visitorId) return;
  const crossSite =
    Boolean(process.env.CLIENT_URL) && process.env.NODE_ENV === 'production';
  res.cookie(
    VISITOR_COOKIE,
    visitorId,
    visitorCookieOptions({ secure: cookieSecure(req), crossSite })
  );
}

export async function getStats(req, res) {
  try {
    const cookieId = parseCookieValue(req.headers.cookie, VISITOR_COOKIE);
    const touched = await touchLiveVisitor({
      visitorId: cookieId,
      userAgent: req.get('user-agent')
    });
    setVisitorCookie(req, res, touched.visitorId);
    const counts = await getSocialProofCounts();
    if (touched.isNew) {
      getSocialProofHub().broadcast(counts);
    }
    return ok(res, counts);
  } catch (error) {
    return fail(res, error.message);
  }
}

export async function streamStats(req, res) {
  try {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (typeof res.flushHeaders === 'function') res.flushHeaders();

    const cookieId = parseCookieValue(req.headers.cookie, VISITOR_COOKIE);
    const touched = isValidVisitorId(cookieId)
      ? await touchLiveVisitor({
          visitorId: cookieId,
          userAgent: req.get('user-agent')
        }).catch(() => null)
      : null;

    const counts = await getSocialProofCounts();
    res.write(formatSseEvent('stats', counts));
    if (touched?.isNew) {
      getSocialProofHub().broadcast(counts);
    }

    const hub = getSocialProofHub();
    hub.add(res);
    req.on('close', () => {
      hub.remove(res);
    });
  } catch (error) {
    if (!res.headersSent) return fail(res, error.message);
    res.end();
  }
}
