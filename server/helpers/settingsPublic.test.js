import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { toClientSettings } from './settingsPublic.js';

const FULL = {
  groq_api_key: 'gsk_secret',
  kimi_api_key: 'kimi_secret',
  gemini_api_key: 'gem_secret',
  database_url: 'postgres://secret',
  mongodb_uri: 'mongodb://secret',
  smtp_pass: 'abcdefghijklmnop',
  smtp_user: 'me@gmail.com',
  daily_limit: 30,
  ai_model: 'llama-3.3-70b-versatile',
  ai_provider: 'groq'
};

describe('toClientSettings', () => {
  it('strips secrets for non-admin callers', () => {
    const publicSettings = toClientSettings(FULL, { isAdmin: false });
    assert.equal(publicSettings.groq_api_key, undefined);
    assert.equal(publicSettings.smtp_pass, undefined);
    assert.equal(publicSettings.daily_limit, 30);
    assert.equal(publicSettings.smtp_user, 'me@gmail.com');
    assert.ok(publicSettings.smtp_pass_masked);
  });

  it('keeps admin keys while still masking smtp_pass', () => {
    const adminSettings = toClientSettings(FULL, { isAdmin: true });
    assert.equal(adminSettings.groq_api_key, 'gsk_secret');
    assert.equal(adminSettings.smtp_pass, 'abcdefghijklmnop');
    assert.ok(adminSettings.smtp_pass_masked);
  });
});
