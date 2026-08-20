import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { describeSmtpError } from './smtpError.js';

describe('describeSmtpError', () => {
  it('keeps Gmail 535 bad-credentials text so the user can fix the App Password', () => {
    const err = new Error(
      'Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to 535 5.7.8 https://support.google.com/mail/?p=BadCredentials d2e1a72fcca58-851d3668afasm1319992b3a.48 - gsmtp'
    );
    const msg = describeSmtpError(err);
    assert.match(msg, /535/);
    assert.match(msg, /App Password/i);
  });

  it('explains Railway Hobby SMTP port blocks instead of a hang/timeout', () => {
    const err = Object.assign(new Error('Connection timeout'), { code: 'ETIMEDOUT' });
    const msg = describeSmtpError(err);
    assert.match(msg, /Railway/i);
    assert.match(msg, /465|587/);
  });

  it('treats connection refused the same as a blocked SMTP port', () => {
    const err = Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNECTION' });
    assert.match(describeSmtpError(err), /Railway/i);
  });
});
