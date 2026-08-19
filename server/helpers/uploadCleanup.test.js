import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  unlinkQuiet,
  hasStoredCvFile,
  sweepStaleFlyers
} from './uploadCleanup.js';

describe('unlinkQuiet', () => {
  it('deletes an existing file and ignores missing paths', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lk-unlink-'));
    const file = path.join(dir, 'flyer.jpg');
    fs.writeFileSync(file, 'x');
    assert.equal(unlinkQuiet(file), true);
    assert.equal(fs.existsSync(file), false);
    assert.equal(unlinkQuiet(file), false);
    assert.equal(unlinkQuiet(''), false);
    assert.equal(unlinkQuiet(null), false);
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

describe('hasStoredCvFile', () => {
  it('is true only when cv_path points at a real file', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lk-cv-'));
    const file = path.join(dir, 'cv.pdf');
    fs.writeFileSync(file, 'pdf');
    assert.equal(hasStoredCvFile({ cv_path: file }), true);
    assert.equal(hasStoredCvFile({ cv_path: path.join(dir, 'missing.pdf') }), false);
    assert.equal(hasStoredCvFile({ cv_path: '' }), false);
    assert.equal(hasStoredCvFile(null), false);
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

describe('sweepStaleFlyers', () => {
  let dir;

  before(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lk-flyers-'));
  });

  after(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('deletes files older than maxAgeMs and keeps recent ones', () => {
    const oldFile = path.join(dir, 'old.jpg');
    const newFile = path.join(dir, 'new.jpg');
    fs.writeFileSync(oldFile, 'old');
    fs.writeFileSync(newFile, 'new');
    const now = Date.now();
    fs.utimesSync(oldFile, new Date(now - 7200_000), new Date(now - 7200_000));
    fs.utimesSync(newFile, new Date(now), new Date(now));

    const result = sweepStaleFlyers({ dir, maxAgeMs: 3600_000, now });
    assert.equal(result.deleted, 1);
    assert.equal(fs.existsSync(oldFile), false);
    assert.equal(fs.existsSync(newFile), true);
  });
});
