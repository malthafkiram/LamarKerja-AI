import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cacheControlForStaticFile } from './staticCache.js';

describe('cacheControlForStaticFile', () => {
  it('never caches SPA shell or the service worker', () => {
    assert.equal(
      cacheControlForStaticFile('/app/client/dist/index.html'),
      'no-store, no-cache, must-revalidate'
    );
    assert.equal(
      cacheControlForStaticFile('/app/client/dist/sw.js'),
      'no-store, no-cache, must-revalidate'
    );
  });

  it('allows long cache for hashed Vite assets', () => {
    assert.equal(
      cacheControlForStaticFile('/app/client/dist/assets/index-xfM3RWyM.js'),
      'public, max-age=31536000, immutable'
    );
  });

  it('leaves other files to Express defaults', () => {
    assert.equal(cacheControlForStaticFile('/app/client/dist/logo.png'), undefined);
  });
});
