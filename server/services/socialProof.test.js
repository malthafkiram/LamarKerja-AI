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
  it('does not persist a visitor until the browser sends back the cookie id', async () => {
    const { visitorStore, userStore } = memoryStores();
    let n = 0;
    const service = createSocialProofService({
      visitorStore,
      userStore,
      randomUUID: () => `00000000-0000-4000-8000-00000000000${++n}`,
      now: () => new Date('2026-08-19T03:00:00.000Z')
    });

    const minted = await service.touchVisitor({ userAgent: 'Mozilla/5.0 Chrome' });
    assert.equal(minted.isNew, false);
    assert.equal(minted.persisted, false);
    assert.equal(minted.visitorId, '00000000-0000-4000-8000-000000000001');
    assert.equal((await service.getCounts()).visitors, 0);

    const first = await service.touchVisitor({
      visitorId: minted.visitorId,
      userAgent: 'Mozilla/5.0 Chrome'
    });
    assert.equal(first.isNew, true);
    assert.equal(first.persisted, true);

    const refresh = await service.touchVisitor({
      visitorId: minted.visitorId,
      userAgent: 'Mozilla/5.0 Chrome'
    });
    assert.equal(refresh.isNew, false);
    assert.equal(refresh.visitorId, minted.visitorId);

    const counts = await service.getCounts();
    assert.equal(counts.visitors, 1);
    assert.equal(counts.registered, 0);
  });

  it('does not count parallel cookie-less hits as extra people', async () => {
    const { visitorStore, userStore } = memoryStores();
    let n = 0;
    const service = createSocialProofService({
      visitorStore,
      userStore,
      randomUUID: () => `00000000-0000-4000-8000-00000000000${++n}`
    });

    await Promise.all([
      service.touchVisitor({ userAgent: 'Mozilla/5.0' }),
      service.touchVisitor({ userAgent: 'Mozilla/5.0' }),
      service.touchVisitor({ userAgent: 'Mozilla/5.0' })
    ]);
    assert.equal((await service.getCounts()).visitors, 0);
  });

  it('treats a second anonymous cookie as +1 and reports real registered count', async () => {
    const { visitorStore, userStore } = memoryStores();
    const service = createSocialProofService({
      visitorStore,
      userStore,
      randomUUID: () => '00000000-0000-4000-8000-000000000099'
    });

    await service.touchVisitor({
      visitorId: '00000000-0000-4000-8000-000000000001',
      userAgent: 'Mozilla/5.0'
    });
    await service.touchVisitor({
      visitorId: '00000000-0000-4000-8000-000000000002',
      userAgent: 'Mozilla/5.0'
    });
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
