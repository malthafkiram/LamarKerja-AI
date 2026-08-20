import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hasSmtpCredentials, normalizeAppPassword, pickSmtpFields, formatSmtpTestError, gmailSmtpGuard } from './smtpConfig.js';

describe('normalizeAppPassword', () => {
  it('strips spaces from Google App Passwords', () => {
    assert.equal(normalizeAppPassword('abcd efgh ijkl mnop'), 'abcdefghijklmnop');
  });

  it('strips copy-paste NBSP and zero-width characters, then lowercases', () => {
    assert.equal(
      normalizeAppPassword('abcd\u00A0efgh\u200Bijkl mnop'),
      'abcdefghijklmnop'
    );
    assert.equal(normalizeAppPassword('ABCD EFGH IJKL MNOP'), 'abcdefghijklmnop');
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

describe('formatSmtpTestError', () => {
  it('maps Firefox NetworkError to a Railway SMTP block explanation', () => {
    const msg = formatSmtpTestError({ message: 'NetworkError when attempting to fetch resource.' });
    assert.match(msg, /Railway/i);
    assert.match(msg, /SMTP/i);
    assert.doesNotMatch(msg, /NetworkError when attempting to fetch resource/);
  });

  it('maps Chrome Failed to fetch the same way', () => {
    const msg = formatSmtpTestError({ message: 'Failed to fetch' });
    assert.match(msg, /Railway/i);
  });

  it('leaves Gmail 535 credential errors intact', () => {
    const raw = 'Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to 535 5.7.8 https://support.google.com/mail/?p=BadCredentials';
    assert.equal(formatSmtpTestError({ message: raw }), raw);
  });
});

describe('gmailSmtpGuard', () => {
  it('rejects a normal Google account password before hitting Gmail', () => {
    const msg = gmailSmtpGuard('saya@gmail.com', 'RahasiaSaya123!');
    assert.match(msg, /16/);
    assert.match(msg, /App Password/i);
  });

  it('rejects a missing @ in the Gmail field', () => {
    assert.match(gmailSmtpGuard('namasaya', 'abcdefghijklmnop'), /@/);
  });

  it('accepts a 16-letter App Password with or without spaces', () => {
    assert.equal(gmailSmtpGuard('saya@gmail.com', 'abcd efgh ijkl mnop'), null);
    assert.equal(gmailSmtpGuard('saya@gmail.com', 'abcdefghijklmnop'), null);
  });
});
