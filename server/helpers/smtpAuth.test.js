import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { gmailSmtpGuard, normalizeAppPassword } from './smtpAuth.js';

describe('normalizeAppPassword', () => {
  it('strips grouped App Password spaces', () => {
    assert.equal(normalizeAppPassword('abcd efgh ijkl mnop'), 'abcdefghijklmnop');
  });
});

describe('gmailSmtpGuard', () => {
  it('blocks a normal account password that would otherwise become Gmail 535', () => {
    assert.match(gmailSmtpGuard('saya@gmail.com', 'RahasiaSaya123!'), /16/);
  });

  it('allows a 16-character App Password', () => {
    assert.equal(gmailSmtpGuard('saya@gmail.com', 'abcdefghijklmnop'), null);
  });
});
