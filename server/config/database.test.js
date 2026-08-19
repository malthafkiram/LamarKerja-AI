import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { needsPostgresSsl, sequelizeClientOptions } from '../config/database.js';

describe('needsPostgresSsl', () => {
  it('enables SSL for Supabase and sslmode=require, not for local Postgres', () => {
    assert.equal(
      needsPostgresSsl(
        'postgresql://postgres.abc:x@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres'
      ),
      true
    );
    assert.equal(
      needsPostgresSsl('postgres://postgres:postgres@localhost:5432/lamarkerja?sslmode=require'),
      true
    );
    assert.equal(
      needsPostgresSsl('postgres://postgres:postgres@localhost:5432/lamarkerja'),
      false
    );
  });
});

describe('sequelizeClientOptions', () => {
  it('sets dialectOptions.ssl only when SSL is required', () => {
    const remote = sequelizeClientOptions(
      'postgresql://postgres.abc:x@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres'
    );
    assert.equal(remote.dialectOptions.ssl.require, true);
    const local = sequelizeClientOptions('postgres://postgres:postgres@localhost:5432/lamarkerja');
    assert.equal(local.dialectOptions, undefined);
  });
});
