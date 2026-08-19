import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveApiUrl } from './apiUrl.js';

describe('resolveApiUrl', () => {
  it('leaves relative paths unchanged when no API host is set', () => {
    assert.equal(resolveApiUrl('/api/profile', ''), '/api/profile');
    assert.equal(resolveApiUrl('/uploads/cvs/a.pdf', ''), '/uploads/cvs/a.pdf');
  });

  it('prefixes Vercel→EC2 API host without doubling slashes', () => {
    assert.equal(
      resolveApiUrl('/api/stats', 'https://api.example.com/'),
      'https://api.example.com/api/stats'
    );
    assert.equal(
      resolveApiUrl('/uploads/flyers/x.jpg', 'https://api.example.com'),
      'https://api.example.com/uploads/flyers/x.jpg'
    );
  });

  it('does not rewrite already-absolute URLs', () => {
    assert.equal(
      resolveApiUrl('https://cdn.example.com/x', 'https://api.example.com'),
      'https://cdn.example.com/x'
    );
  });
});
