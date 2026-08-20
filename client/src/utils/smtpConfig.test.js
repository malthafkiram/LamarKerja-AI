import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hasSmtpCredentials, normalizeAppPassword, pickSmtpFields } from './smtpConfig.js';

describe('normalizeAppPassword', () => {
  it('strips spaces from Google App Passwords', () => {
    assert.equal(normalizeAppPassword('abcd efgh ijkl mnop'), 'abcdefghijklmnop');
  });

  it('returns empty string for missing values', () => {
    assert.equal(normalizeAppPassword(''), '');
    assert.equal(normalizeAppPassword(null), '');
    assert.equal(normalizeAppPassword(undefined), '');
  });
});

describe('hasSmtpCredentials', () => {
  it('prefers profile SMTP over empty global settings', () => {
    assert.equal(
      hasSmtpCredentials(
        { smtp_user: 'me@gmail.com', smtp_pass: 'abcdefghijklmnop' },
        { smtp_user: '', smtp_pass: '' }
      ),
      true
    );
  });

  it('falls back to settings when profile SMTP is empty', () => {
    assert.equal(
      hasSmtpCredentials(
        { smtp_user: '', smtp_pass: '' },
        { smtp_user: 'sys@gmail.com', smtp_pass: 'abcdefghijklmnop' }
      ),
      true
    );
  });

  it('is false when both profile and settings lack user or pass', () => {
    assert.equal(hasSmtpCredentials({}, {}), false);
    assert.equal(
      hasSmtpCredentials({ smtp_user: 'me@gmail.com' }, {}),
      false
    );
    assert.equal(
      hasSmtpCredentials({ smtp_user: 'me@gmail.com', smtp_pass: '   ' }, {}),
      false
    );
  });
});

describe('pickSmtpFields', () => {
  it('returns only sender SMTP fields from a mixed form payload', () => {
    assert.deepEqual(
      pickSmtpFields({
        smtp_user: 'me@gmail.com',
        smtp_pass: 'abcd efgh ijkl mnop',
        sender_name: 'Siti',
        groq_api_key: 'should-not-leak',
        daily_limit: 30
      }),
      {
        smtp_user: 'me@gmail.com',
        smtp_pass: 'abcdefghijklmnop',
        sender_name: 'Siti'
      }
    );
  });
});
