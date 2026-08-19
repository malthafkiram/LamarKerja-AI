import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatSocialProofLine } from './socialProof.js';

describe('formatSocialProofLine', () => {
  it('renders an honest Indonesian public line', () => {
    assert.equal(
      formatSocialProofLine({ visitors: 12, registered: 5 }, 'id'),
      '12 orang sudah berkunjung · 5 sudah daftar'
    );
  });

  it('renders the English line and treats missing counts as zero', () => {
    assert.equal(
      formatSocialProofLine({ visitors: 1, registered: 0 }, 'en'),
      '1 person has visited · 0 registered'
    );
    assert.equal(
      formatSocialProofLine({}, 'id'),
      '0 orang sudah berkunjung · 0 sudah daftar'
    );
  });
});
