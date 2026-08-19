import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createSocialProofService } from './socialProof.js';

function memoryStores() {
  const visitors = new Map();
  const visitorStore = {
    async findById(id) {
      return visitors.get(id) || null;
    },
    async create(record) {
      visitors.set(record.visitor_id, { ...record });
      return visitors.get(record.visitor_id);
    },
    async updateLastSeen(id, at) {
      const row = visitors.get(id);
      if (row) row.last_seen = at;
    },
    async count() {
      return visitors.size;
    }
  };
  let registered = 0;
  const userStore = {
    async count() {
      return registered;
    },
    setCount(n) {
      registered = n;
    }
  };
  return { visitorStore, userStore, visitors };
}

describe('createSocialProofService', () => {
  it('counts a first cookie as a unique visitor and ignores the same id on refresh', async () => {
    const { visitorStore, userStore } = memoryStores();
    let n = 0;
    const service = createSocialProofService({
      visitorStore,
      userStore,
      randomUUID: () => `00000000-0000-4000-8000-00000000000${++n}`,
      now: () => new Date('2026-08-19T03:00:00.000Z')
    });

    const first = await service.touchVisitor({ userAgent: 'Mozilla/5.0 Chrome' });
    assert.equal(first.isNew, true);
    assert.equal(first.visitorId, '00000000-0000-4000-8000-000000000001');

    const refresh = await service.touchVisitor({
      visitorId: first.visitorId,
      userAgent: 'Mozilla/5.0 Chrome'
    });
    assert.equal(refresh.isNew, false);
    assert.equal(refresh.visitorId, first.visitorId);

    const counts = await service.getCounts();
    assert.equal(counts.visitors, 1);
    assert.equal(counts.registered, 0);
  });

  it('treats a second anonymous visitor as +1 and reports real registered count', async () => {
    const { visitorStore, userStore } = memoryStores();
    let n = 0;
    const service = createSocialProofService({
      visitorStore,
      userStore,
      randomUUID: () => `00000000-0000-4000-8000-00000000000${++n}`
    });

    await service.touchVisitor({ userAgent: 'Mozilla/5.0' });
    await service.touchVisitor({ userAgent: 'Mozilla/5.0' });
    userStore.setCount(5);

    const counts = await service.getCounts();
    assert.equal(counts.visitors, 2);
    assert.equal(counts.registered, 5);
  });

  it('does not store bots as visitors', async () => {
    const { visitorStore, userStore } = memoryStores();
    const service = createSocialProofService({
      visitorStore,
      userStore,
      randomUUID: () => '00000000-0000-4000-8000-000000000099'
    });

    const bot = await service.touchVisitor({
      userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
    });
    assert.equal(bot.skipped, true);
    assert.equal(bot.isNew, false);
    assert.equal((await service.getCounts()).visitors, 0);
  });
});
