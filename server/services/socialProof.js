/**
 * Unique visitors + registered-user counts. Numbers come from real tables.
 */
import { createSseHub, isBotUserAgent, isValidVisitorId } from '../helpers/visitorStats.js';

const sseHub = createSseHub({ heartbeatMs: 20_000 });
let servicePromise = null;

export function createSocialProofService({
  visitorStore,
  userStore,
  randomUUID,
  now
} = {}) {
  const uuid = randomUUID || (() => crypto.randomUUID());
  const getNow = now || (() => new Date());

  async function touchVisitor({ visitorId, userAgent } = {}) {
    if (isBotUserAgent(userAgent)) {
      return { skipped: true, isNew: false, visitorId: null };
    }

    const knownId = isValidVisitorId(visitorId) ? visitorId : null;
    const at = getNow();

    if (knownId) {
      const existing = await visitorStore.findById(knownId);
      if (existing) {
        await visitorStore.updateLastSeen(knownId, at);
        return { skipped: false, isNew: false, visitorId: knownId };
      }
    }

    const id = knownId || uuid();
    await visitorStore.create({
      visitor_id: id,
      first_seen: at,
      last_seen: at
    });
    return { skipped: false, isNew: true, visitorId: id };
  }

  async function getCounts() {
    const [visitors, registered] = await Promise.all([
      visitorStore.count(),
      userStore.count()
    ]);
    return { visitors, registered };
  }

  return { touchVisitor, getCounts };
}

function sequelizeVisitorStore(Visitor) {
  return {
    findById: (id) => Visitor.findByPk(id),
    async create(record) {
      try {
        return await Visitor.create(record);
      } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
          await Visitor.update(
            { last_seen: record.last_seen },
            { where: { visitor_id: record.visitor_id } }
          );
          return Visitor.findByPk(record.visitor_id);
        }
        throw err;
      }
    },
    updateLastSeen: (id, at) =>
      Visitor.update({ last_seen: at }, { where: { visitor_id: id } }),
    count: () => Visitor.count()
  };
}

async function getLiveService() {
  if (!servicePromise) {
    servicePromise = (async () => {
      const { Visitor, User } = await import('../models/index.js');
      return createSocialProofService({
        visitorStore: sequelizeVisitorStore(Visitor),
        userStore: { count: () => User.count() }
      });
    })();
  }
  return servicePromise;
}

export async function touchLiveVisitor(input) {
  const service = await getLiveService();
  return service.touchVisitor(input);
}

export async function getSocialProofCounts() {
  const service = await getLiveService();
  return service.getCounts();
}

export async function broadcastSocialProof() {
  const counts = await getSocialProofCounts();
  sseHub.broadcast(counts);
  return counts;
}

export function getSocialProofHub() {
  return sseHub;
}
