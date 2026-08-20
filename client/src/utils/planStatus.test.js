import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isPaidPlan,
  daysRemaining,
  remainingSendQuota,
  effectiveSendLimit,
  buildPlanNotices
} from './planStatus.js';

describe('isPaidPlan', () => {
  it('treats pro, vip, and admin as paid', () => {
    assert.equal(isPaidPlan({ plan: 'pro' }), true);
    assert.equal(isPaidPlan({ plan: 'vip' }), true);
    assert.equal(isPaidPlan({ plan: 'free', role: 'admin' }), true);
    assert.equal(isPaidPlan({ plan: 'free' }), false);
  });
});

describe('daysRemaining', () => {
  it('returns remaining whole days until expiry', () => {
    const now = new Date('2026-08-20T00:00:00.000Z');
    assert.equal(daysRemaining('2026-09-09T00:00:00.000Z', now), 20);
  });

  it('returns 0 when already expired and null when there is no expiry', () => {
    const now = new Date('2026-08-20T00:00:00.000Z');
    assert.equal(daysRemaining('2026-08-19T00:00:00.000Z', now), 0);
    assert.equal(daysRemaining(null, now), null);
  });
});

describe('quota helpers', () => {
  it('adds bonus quota on top of the daily limit', () => {
    assert.equal(effectiveSendLimit(30, 5), 35);
    assert.equal(remainingSendQuota(34, 30, 5), 1);
  });

  it('never returns a negative remaining quota', () => {
    assert.equal(remainingSendQuota(40, 30, 0), 0);
  });
});

describe('buildPlanNotices', () => {
  it('tells a PRO user how many days and send slots remain', () => {
    const notices = buildPlanNotices({
      user: { plan: 'pro', plan_expires_at: '2026-09-09T00:00:00.000Z', bonus_quota: 0 },
      sentToday: 29,
      dailyLimit: 30,
      lang: 'id',
      now: new Date('2026-08-20T00:00:00.000Z')
    });
    assert.equal(notices.daysLeft, 20);
    assert.equal(notices.quotaRemaining, 1);
    assert.match(notices.expiryText, /20 hari/);
    assert.match(notices.quotaText, /1/);
    assert.equal(notices.expiryTone, 'ok');
    assert.equal(notices.quotaTone, 'urgent');
  });
});
