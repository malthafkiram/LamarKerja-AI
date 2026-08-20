import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { effectiveSendLimit, isSmtpCountedSend } from './quota.js';

describe('effectiveSendLimit', () => {
  it('adds bonus quota to the daily Gmail cap', () => {
    assert.equal(effectiveSendLimit(30, 20), 50);
    assert.equal(effectiveSendLimit(undefined, 5), 35);
  });
});

describe('isSmtpCountedSend', () => {
  it('counts only sent rows that actually emailed HRD', () => {
    assert.equal(
      isSmtpCountedSend({ status: 'sent', recipient_email: 'hr@pt.com' }),
      true
    );
    assert.equal(
      isSmtpCountedSend({ status: 'sent', recipient_email: '' }),
      false
    );
    assert.equal(
      isSmtpCountedSend({ status: 'draft', recipient_email: 'hr@pt.com' }),
      false
    );
  });
});
