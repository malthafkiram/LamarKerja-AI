import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  WORLDWIDE_BUCKET,
  geocodeLocation,
  isGlobeEligibleJob,
  aggregateGlobePoints,
  remoteSourceLabel
} from './jobGlobeGeo.js';

describe('geocodeLocation', () => {
  it('maps common job cities to real coordinates', () => {
    const berlin = geocodeLocation('Berlin');
    assert.equal(berlin.label, 'Berlin');
    assert.ok(Math.abs(berlin.lat - 52.52) < 0.2);
    assert.ok(Math.abs(berlin.lng - 13.4) < 0.2);

    const london = geocodeLocation('London, UK');
    assert.equal(london.label, 'London');
    assert.ok(london.lat > 50 && london.lat < 53);

    const singapore = geocodeLocation('Singapore');
    assert.equal(singapore.label, 'Singapore');
    assert.ok(singapore.lat > 1 && singapore.lat < 2);

    const jakarta = geocodeLocation('Jakarta, Indonesia');
    assert.equal(jakarta.label, 'Jakarta');

    const amsterdam = geocodeLocation('Amsterdam, Netherlands');
    assert.equal(amsterdam.label, 'Amsterdam');

    const nyc = geocodeLocation('New York, USA');
    assert.equal(nyc.label, 'New York');

    const remoteBerlin = geocodeLocation('Remote / Berlin');
    assert.equal(remoteBerlin.label, 'Berlin');
  });

  it('buckets Worldwide, EMEA, Remote, Anywhere into one honest Remote / Anywhere pin', () => {
    const labels = ['Worldwide', 'EMEA', 'Remote', 'Anywhere', '100% Worldwide Remote', 'Remote / Anywhere'];
    for (const loc of labels) {
      const geo = geocodeLocation(loc);
      assert.equal(geo.key, WORLDWIDE_BUCKET.key, loc);
      assert.equal(geo.label, 'Remote / Anywhere');
      assert.equal(geo.lat, WORLDWIDE_BUCKET.lat);
      assert.equal(geo.lng, WORLDWIDE_BUCKET.lng);
      assert.equal(geo.worldwide, true);
    }
  });

  it('does not invent coordinates for unknown cities', () => {
    assert.equal(geocodeLocation('Xharnhorst-on-Sea'), null);
    assert.equal(geocodeLocation(''), null);
    assert.equal(geocodeLocation(null), null);
  });
});

describe('isGlobeEligibleJob', () => {
  it('includes Remote platform jobs from Remotive, Arbeitnow, Jobicy, Himalayas, Remote OK', () => {
    assert.equal(isGlobeEligibleJob({
      platform: 'Remote',
      location: 'Berlin',
      tags: ['Remote', 'Luar Negeri', 'Remotive']
    }), true);
    assert.equal(isGlobeEligibleJob({
      platform: 'Remote',
      location: 'Worldwide',
      tags: ['Remote', 'Himalayas']
    }), true);
    assert.equal(isGlobeEligibleJob({
      platform: 'Remote',
      location: 'USA',
      tags: ['Remote OK']
    }), true);
  });

  it('excludes KarirJakarta, Dealls, and Disnakerja even if location is a known city', () => {
    assert.equal(isGlobeEligibleJob({
      platform: 'KarirJakarta',
      location: 'Jakarta',
      tags: ['KarirJakarta']
    }), false);
    assert.equal(isGlobeEligibleJob({
      platform: 'Dealls',
      location: 'Jakarta',
      tags: ['Dealls', 'Indonesia']
    }), false);
    assert.equal(isGlobeEligibleJob({
      platform: 'Disnakerja',
      location: 'Surabaya',
      tags: ['BUMN']
    }), false);
  });
});

describe('aggregateGlobePoints', () => {
  it('aggregates eligible jobs by city and sizes points by job count', () => {
    const points = aggregateGlobePoints([
      { id: 1, title: 'FE', company: 'A', job_url: 'https://a.dev/1', platform: 'Remote', location: 'Berlin', tags: ['Remotive'] },
      { id: 2, title: 'BE', company: 'B', job_url: 'https://a.dev/2', platform: 'Remote', location: 'Berlin, Germany', tags: ['Arbeitnow'] },
      { id: 3, title: 'PM', company: 'C', job_url: 'https://a.dev/3', platform: 'Remote', location: 'London', tags: ['Jobicy'] }
    ]);
    const berlin = points.find((p) => p.label === 'Berlin');
    const london = points.find((p) => p.label === 'London');
    assert.equal(berlin.count, 2);
    assert.equal(berlin.jobs.length, 2);
    assert.equal(london.count, 1);
    assert.ok(berlin.size > london.size);
  });

  it('does not scatter worldwide jobs across random cities', () => {
    const points = aggregateGlobePoints([
      { id: 1, title: 'Dev', company: 'X', job_url: 'https://x.dev/1', platform: 'Remote', location: 'Worldwide', tags: ['Himalayas'] },
      { id: 2, title: 'Des', company: 'Y', job_url: 'https://x.dev/2', platform: 'Remote', location: 'EMEA', tags: ['Remote OK'] },
      { id: 3, title: 'Ops', company: 'Z', job_url: 'https://x.dev/3', platform: 'Dealls', location: 'Jakarta', tags: ['Dealls'] }
    ]);
    assert.equal(points.length, 1);
    assert.equal(points[0].key, WORLDWIDE_BUCKET.key);
    assert.equal(points[0].count, 2);
    assert.equal(points[0].label, 'Remote / Anywhere');
  });

  it('colors points from the dominant remote source tag', () => {
    const points = aggregateGlobePoints([
      { id: 1, title: 'A', company: 'A', job_url: 'https://a.dev/1', platform: 'Remote', location: 'Amsterdam', tags: ['Remotive'] },
      { id: 2, title: 'B', company: 'B', job_url: 'https://a.dev/2', platform: 'Remote', location: 'Amsterdam', tags: ['Remotive'] },
      { id: 3, title: 'C', company: 'C', job_url: 'https://a.dev/3', platform: 'Remote', location: 'Amsterdam', tags: ['Jobicy'] }
    ]);
    assert.equal(points[0].source, 'Remotive');
    assert.equal(typeof points[0].color, 'string');
    assert.match(points[0].color, /^#/);
  });
});

describe('remoteSourceLabel', () => {
  it('reads Remotive / Arbeitnow / Jobicy / Himalayas / Remote OK from tags', () => {
    assert.equal(remoteSourceLabel({ tags: ['Remote', 'Luar Negeri', 'Remotive'] }), 'Remotive');
    assert.equal(remoteSourceLabel({ tags: ['Arbeitnow'] }), 'Arbeitnow');
    assert.equal(remoteSourceLabel({ tags: ['Jobicy'] }), 'Jobicy');
    assert.equal(remoteSourceLabel({ tags: ['Himalayas'] }), 'Himalayas');
    assert.equal(remoteSourceLabel({ tags: ['Remote OK'] }), 'Remote OK');
  });
});
