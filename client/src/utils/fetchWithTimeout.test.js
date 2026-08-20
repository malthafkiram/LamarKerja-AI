import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { fetchWithTimeout } from './fetchWithTimeout.js';

describe('fetchWithTimeout', () => {
  it('returns the fetch response when it finishes in time', async () => {
    const fakeRes = { ok: true, status: 200 };
    mock.method(globalThis, 'fetch', async () => fakeRes);

    const res = await fetchWithTimeout('/api/settings', {}, 1000);
    assert.equal(res, fakeRes);
    mock.restoreAll();
  });

  it('aborts and rejects when the request exceeds the timeout', async () => {
    mock.method(globalThis, 'fetch', (url, init) => new Promise((resolve, reject) => {
      init.signal.addEventListener('abort', () => {
        const err = new Error('Aborted');
        err.name = 'AbortError';
        reject(err);
      });
    }));

    await assert.rejects(
      () => fetchWithTimeout('/api/settings', {}, 20),
      (err) => err.name === 'AbortError'
    );
    mock.restoreAll();
  });
});
