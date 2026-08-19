import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  VISITOR_COOKIE,
  isBotUserAgent,
  parseCookieValue,
  isValidVisitorId,
  formatSseEvent,
  formatSseComment,
  visitorCookieOptions,
  createSseHub
} from './visitorStats.js';

describe('isBotUserAgent', () => {
  it('skips obvious crawlers and leaves browsers alone', () => {
    assert.equal(isBotUserAgent('Mozilla/5.0 (compatible; Googlebot/2.1)'), true);
    assert.equal(isBotUserAgent('Mozilla/5.0 AppleWebKit crawler'), true);
    assert.equal(isBotUserAgent('facebookexternalhit/1.1'), true);
    assert.equal(isBotUserAgent('python-requests/2.31.0'), true);
    assert.equal(
      isBotUserAgent(
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0'
      ),
      false
    );
    assert.equal(isBotUserAgent(''), false);
    assert.equal(isBotUserAgent(undefined), false);
  });
});

describe('parseCookieValue', () => {
  it('reads the visitor cookie without treating other cookies as the id', () => {
    const header = 'theme=dark; lk_vid=11111111-1111-4111-8111-111111111111; other=1';
    assert.equal(
      parseCookieValue(header, VISITOR_COOKIE),
      '11111111-1111-4111-8111-111111111111'
    );
    assert.equal(parseCookieValue('a=b', VISITOR_COOKIE), null);
    assert.equal(parseCookieValue('', VISITOR_COOKIE), null);
  });
});

describe('isValidVisitorId', () => {
  it('accepts UUID v4-shaped ids and rejects junk', () => {
    assert.equal(isValidVisitorId('a1b2c3d4-e5f6-4789-8abc-def012345678'), true);
    assert.equal(isValidVisitorId('not-a-uuid'), false);
    assert.equal(isValidVisitorId(''), false);
    assert.equal(isValidVisitorId(null), false);
  });
});

describe('SSE helpers', () => {
  it('formats a stats event as text/event-stream', () => {
    const raw = formatSseEvent('stats', { visitors: 12, registered: 5 });
    assert.equal(raw, 'event: stats\ndata: {"visitors":12,"registered":5}\n\n');
    assert.equal(formatSseComment('heartbeat'), ':heartbeat\n\n');
  });
});

describe('visitorCookieOptions', () => {
  it('returns an httpOnly first-party cookie that is not a login', () => {
    const opts = visitorCookieOptions({ secure: false });
    assert.equal(opts.httpOnly, true);
    assert.equal(opts.sameSite, 'lax');
    assert.equal(opts.path, '/');
    assert.equal(opts.secure, false);
    assert.ok(opts.maxAge > 30 * 24 * 60 * 60 * 1000);
  });

  it('uses SameSite=None and Secure when the SPA is on another origin', () => {
    const opts = visitorCookieOptions({ secure: false, crossSite: true });
    assert.equal(opts.sameSite, 'none');
    assert.equal(opts.secure, true);
  });
});

describe('createSseHub', () => {
  it('broadcasts stats to every connected client', () => {
    const hub = createSseHub({ heartbeatMs: 60_000 });
    const a = { chunks: [], write(data) { this.chunks.push(data); return true; } };
    const b = { chunks: [], write(data) { this.chunks.push(data); return true; } };

    hub.add(a);
    hub.add(b);
    hub.broadcast({ visitors: 3, registered: 1 });

    assert.equal(hub.size, 2);
    assert.equal(a.chunks[0], formatSseEvent('stats', { visitors: 3, registered: 1 }));
    assert.equal(b.chunks[0], a.chunks[0]);

    hub.remove(a);
    hub.broadcast({ visitors: 4, registered: 1 });
    assert.equal(a.chunks.length, 1);
    assert.equal(b.chunks.length, 2);
    hub.remove(b);
    hub.stopHeartbeat();
  });
});
