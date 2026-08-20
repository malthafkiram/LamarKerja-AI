import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  shouldBypassServiceWorker,
  useNetworkFirst,
} from './swCachePolicy.js';

describe('shouldBypassServiceWorker', () => {
  it('lets API traffic hit the network without cache', () => {
    assert.equal(shouldBypassServiceWorker('https://app.example/api/settings'), true);
    assert.equal(shouldBypassServiceWorker('/api/directory/jobs?limit=12'), true);
  });

  it('does not bypass HTML and hashed assets', () => {
    assert.equal(shouldBypassServiceWorker('https://app.example/'), false);
    assert.equal(shouldBypassServiceWorker('https://app.example/assets/index-abc.js'), false);
  });

  it('bypasses non-GET requests', () => {
    assert.equal(shouldBypassServiceWorker('https://app.example/', 'POST'), true);
  });
});

describe('useNetworkFirst', () => {
  it('uses network-first for navigations so index.html is never stale after deploy', () => {
    assert.equal(
      useNetworkFirst({ mode: 'navigate', destination: 'document', url: 'https://app.example/' }),
      true
    );
  });

  it('uses network-first for JS and CSS so hashed Vite files are not served after a 404', () => {
    assert.equal(
      useNetworkFirst({ mode: 'cors', destination: 'script', url: 'https://app.example/assets/index-old.js' }),
      true
    );
    assert.equal(
      useNetworkFirst({ mode: 'cors', destination: 'style', url: 'https://app.example/assets/index-old.css' }),
      true
    );
  });

  it('can cache-first images and icons', () => {
    assert.equal(
      useNetworkFirst({ mode: 'no-cors', destination: 'image', url: 'https://app.example/logo.png' }),
      false
    );
  });
});
