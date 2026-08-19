/**
 * Static city/country geocoding + globe aggregation for remote / luar negeri jobs.
 * No Google Maps. Unknown locations are skipped — never invented.
 */

export const WORLDWIDE_BUCKET = {
  key: 'remote-anywhere',
  label: 'Remote / Anywhere',
  lat: 0,
  lng: -30
};

const LOCAL_PLATFORMS = new Set([
  'KarirJakarta',
  'Dealls',
  'Disnakerja',
  'Karirhub',
  'Toploker',
  'Karirlink',
  'LinkedIn'
]);

const SOURCE_COLORS = {
  Remotive: '#06B6D4',
  Arbeitnow: '#818CF8',
  Jobicy: '#34D399',
  Himalayas: '#22D3EE',
  'Remote OK': '#FF4742',
  Remote: '#38BDF8'
};

const SOURCE_ALIASES = [
  ['remote ok', 'Remote OK'],
  ['remoteok', 'Remote OK'],
  ['remotive', 'Remotive'],
  ['arbeitnow', 'Arbeitnow'],
  ['jobicy', 'Jobicy'],
  ['himalayas', 'Himalayas']
];

const WORLDWIDE_RE = /\b(worldwide|world[\s-]?wide|anywhere|global|emea|apac|latam|am[eé]ricas|european friendly|eu friendly)\b/i;

/** City dictionary: normalized name → { lat, lng, label } */
const CITY_COORDS = {
  berlin: { lat: 52.52, lng: 13.405, label: 'Berlin' },
  london: { lat: 51.5074, lng: -0.1278, label: 'London' },
  singapore: { lat: 1.3521, lng: 103.8198, label: 'Singapore' },
  jakarta: { lat: -6.2088, lng: 106.8456, label: 'Jakarta' },
  amsterdam: { lat: 52.3676, lng: 4.9041, label: 'Amsterdam' },
  'new york': { lat: 40.7128, lng: -74.006, label: 'New York' },
  nyc: { lat: 40.7128, lng: -74.006, label: 'New York' },
  'new york city': { lat: 40.7128, lng: -74.006, label: 'New York' },
  'san francisco': { lat: 37.7749, lng: -122.4194, label: 'San Francisco' },
  'los angeles': { lat: 34.0522, lng: -118.2437, label: 'Los Angeles' },
  seattle: { lat: 47.6062, lng: -122.3321, label: 'Seattle' },
  austin: { lat: 30.2672, lng: -97.7431, label: 'Austin' },
  chicago: { lat: 41.8781, lng: -87.6298, label: 'Chicago' },
  boston: { lat: 42.3601, lng: -71.0589, label: 'Boston' },
  toronto: { lat: 43.6532, lng: -79.3832, label: 'Toronto' },
  vancouver: { lat: 49.2827, lng: -123.1207, label: 'Vancouver' },
  montreal: { lat: 45.5017, lng: -73.5673, label: 'Montreal' },
  paris: { lat: 48.8566, lng: 2.3522, label: 'Paris' },
  munich: { lat: 48.1351, lng: 11.582, label: 'Munich' },
  hamburg: { lat: 53.5511, lng: 9.9937, label: 'Hamburg' },
  frankfurt: { lat: 50.1109, lng: 8.6821, label: 'Frankfurt' },
  cologne: { lat: 50.9375, lng: 6.9603, label: 'Cologne' },
  koln: { lat: 50.9375, lng: 6.9603, label: 'Cologne' },
  'köln': { lat: 50.9375, lng: 6.9603, label: 'Cologne' },
  madrid: { lat: 40.4168, lng: -3.7038, label: 'Madrid' },
  barcelona: { lat: 41.3874, lng: 2.1686, label: 'Barcelona' },
  lisbon: { lat: 38.7223, lng: -9.1393, label: 'Lisbon' },
  lisboa: { lat: 38.7223, lng: -9.1393, label: 'Lisbon' },
  dublin: { lat: 53.3498, lng: -6.2603, label: 'Dublin' },
  edinburgh: { lat: 55.9533, lng: -3.1883, label: 'Edinburgh' },
  manchester: { lat: 53.4808, lng: -2.2426, label: 'Manchester' },
  zurich: { lat: 47.3769, lng: 8.5417, label: 'Zurich' },
  geneva: { lat: 46.2044, lng: 6.1432, label: 'Geneva' },
  vienna: { lat: 48.2082, lng: 16.3738, label: 'Vienna' },
  wien: { lat: 48.2082, lng: 16.3738, label: 'Vienna' },
  prague: { lat: 50.0755, lng: 14.4378, label: 'Prague' },
  warsaw: { lat: 52.2297, lng: 21.0122, label: 'Warsaw' },
  krakow: { lat: 50.0647, lng: 19.945, label: 'Krakow' },
  stockholm: { lat: 59.3293, lng: 18.0686, label: 'Stockholm' },
  oslo: { lat: 59.9139, lng: 10.7522, label: 'Oslo' },
  copenhagen: { lat: 55.6761, lng: 12.5683, label: 'Copenhagen' },
  helsinki: { lat: 60.1699, lng: 24.9384, label: 'Helsinki' },
  tallinn: { lat: 59.437, lng: 24.7536, label: 'Tallinn' },
  vilnius: { lat: 54.6872, lng: 25.2797, label: 'Vilnius' },
  riga: { lat: 56.9496, lng: 24.1052, label: 'Riga' },
  rome: { lat: 41.9028, lng: 12.4964, label: 'Rome' },
  milan: { lat: 45.4642, lng: 9.19, label: 'Milan' },
  brussels: { lat: 50.8503, lng: 4.3517, label: 'Brussels' },
  rotterdam: { lat: 51.9244, lng: 4.4777, label: 'Rotterdam' },
  utrecht: { lat: 52.0907, lng: 5.1214, label: 'Utrecht' },
  budapest: { lat: 47.4979, lng: 19.0402, label: 'Budapest' },
  bucharest: { lat: 44.4268, lng: 26.1025, label: 'Bucharest' },
  sofia: { lat: 42.6977, lng: 23.3219, label: 'Sofia' },
  athens: { lat: 37.9838, lng: 23.7275, label: 'Athens' },
  istanbul: { lat: 41.0082, lng: 28.9784, label: 'Istanbul' },
  'tel aviv': { lat: 32.0853, lng: 34.7818, label: 'Tel Aviv' },
  dubai: { lat: 25.2048, lng: 55.2708, label: 'Dubai' },
  'abu dhabi': { lat: 24.4539, lng: 54.3773, label: 'Abu Dhabi' },
  tokyo: { lat: 35.6762, lng: 139.6503, label: 'Tokyo' },
  osaka: { lat: 34.6937, lng: 135.5023, label: 'Osaka' },
  seoul: { lat: 37.5665, lng: 126.978, label: 'Seoul' },
  beijing: { lat: 39.9042, lng: 116.4074, label: 'Beijing' },
  shanghai: { lat: 31.2304, lng: 121.4737, label: 'Shanghai' },
  'hong kong': { lat: 22.3193, lng: 114.1694, label: 'Hong Kong' },
  taipei: { lat: 25.033, lng: 121.5654, label: 'Taipei' },
  manila: { lat: 14.5995, lng: 120.9842, label: 'Manila' },
  'kuala lumpur': { lat: 3.139, lng: 101.6869, label: 'Kuala Lumpur' },
  bangkok: { lat: 13.7563, lng: 100.5018, label: 'Bangkok' },
  'ho chi minh': { lat: 10.8231, lng: 106.6297, label: 'Ho Chi Minh City' },
  'ho chi minh city': { lat: 10.8231, lng: 106.6297, label: 'Ho Chi Minh City' },
  hanoi: { lat: 21.0278, lng: 105.8342, label: 'Hanoi' },
  bangalore: { lat: 12.9716, lng: 77.5946, label: 'Bangalore' },
  bengaluru: { lat: 12.9716, lng: 77.5946, label: 'Bangalore' },
  mumbai: { lat: 19.076, lng: 72.8777, label: 'Mumbai' },
  delhi: { lat: 28.6139, lng: 77.209, label: 'Delhi' },
  'new delhi': { lat: 28.6139, lng: 77.209, label: 'Delhi' },
  hyderabad: { lat: 17.385, lng: 78.4867, label: 'Hyderabad' },
  pune: { lat: 18.5204, lng: 73.8567, label: 'Pune' },
  sydney: { lat: -33.8688, lng: 151.2093, label: 'Sydney' },
  melbourne: { lat: -37.8136, lng: 144.9631, label: 'Melbourne' },
  auckland: { lat: -36.8485, lng: 174.7633, label: 'Auckland' },
  'cape town': { lat: -33.9249, lng: 18.4241, label: 'Cape Town' },
  johannesburg: { lat: -26.2041, lng: 28.0473, label: 'Johannesburg' },
  lagos: { lat: 6.5244, lng: 3.3792, label: 'Lagos' },
  nairobi: { lat: -1.2921, lng: 36.8219, label: 'Nairobi' },
  'sao paulo': { lat: -23.5558, lng: -46.6396, label: 'São Paulo' },
  'são paulo': { lat: -23.5558, lng: -46.6396, label: 'São Paulo' },
  'rio de janeiro': { lat: -22.9068, lng: -43.1729, label: 'Rio de Janeiro' },
  'mexico city': { lat: 19.4326, lng: -99.1332, label: 'Mexico City' },
  'buenos aires': { lat: -34.6037, lng: -58.3816, label: 'Buenos Aires' },
  bogota: { lat: 4.711, lng: -74.0721, label: 'Bogotá' },
  lima: { lat: -12.0464, lng: -77.0428, label: 'Lima' },
  santiago: { lat: -33.4489, lng: -70.6693, label: 'Santiago' },
  bandung: { lat: -6.9175, lng: 107.6191, label: 'Bandung' },
  surabaya: { lat: -7.2575, lng: 112.7521, label: 'Surabaya' },
  bali: { lat: -8.4095, lng: 115.1889, label: 'Bali' },
  denpasar: { lat: -8.6705, lng: 115.2126, label: 'Denpasar' }
};

/** Country-level strings map to a capital/centroid, labeled as the country — not a fake city. */
const COUNTRY_COORDS = {
  usa: { lat: 39.8283, lng: -98.5795, label: 'United States' },
  us: { lat: 39.8283, lng: -98.5795, label: 'United States' },
  'united states': { lat: 39.8283, lng: -98.5795, label: 'United States' },
  'united states of america': { lat: 39.8283, lng: -98.5795, label: 'United States' },
  america: { lat: 39.8283, lng: -98.5795, label: 'United States' },
  uk: { lat: 54.7024, lng: -3.2766, label: 'United Kingdom' },
  'united kingdom': { lat: 54.7024, lng: -3.2766, label: 'United Kingdom' },
  'great britain': { lat: 54.7024, lng: -3.2766, label: 'United Kingdom' },
  england: { lat: 52.3555, lng: -1.1743, label: 'England' },
  germany: { lat: 51.1657, lng: 10.4515, label: 'Germany' },
  deutschland: { lat: 51.1657, lng: 10.4515, label: 'Germany' },
  netherlands: { lat: 52.1326, lng: 5.2913, label: 'Netherlands' },
  holland: { lat: 52.1326, lng: 5.2913, label: 'Netherlands' },
  canada: { lat: 56.1304, lng: -106.3468, label: 'Canada' },
  australia: { lat: -25.2744, lng: 133.7751, label: 'Australia' },
  india: { lat: 20.5937, lng: 78.9629, label: 'India' },
  indonesia: { lat: -2.5489, lng: 118.0149, label: 'Indonesia' },
  france: { lat: 46.2276, lng: 2.2137, label: 'France' },
  spain: { lat: 40.4637, lng: -3.7492, label: 'Spain' },
  poland: { lat: 51.9194, lng: 19.1451, label: 'Poland' },
  portugal: { lat: 39.3999, lng: -8.2245, label: 'Portugal' },
  ireland: { lat: 53.1424, lng: -7.6921, label: 'Ireland' },
  brazil: { lat: -14.235, lng: -51.9253, label: 'Brazil' },
  mexico: { lat: 23.6345, lng: -102.5528, label: 'Mexico' },
  japan: { lat: 36.2048, lng: 138.2529, label: 'Japan' },
  'south korea': { lat: 35.9078, lng: 127.7669, label: 'South Korea' },
  korea: { lat: 35.9078, lng: 127.7669, label: 'South Korea' },
  uae: { lat: 23.4241, lng: 53.8478, label: 'UAE' },
  philippines: { lat: 12.8797, lng: 121.774, label: 'Philippines' },
  vietnam: { lat: 14.0583, lng: 108.2772, label: 'Vietnam' },
  malaysia: { lat: 4.2105, lng: 101.9758, label: 'Malaysia' },
  thailand: { lat: 15.87, lng: 100.9925, label: 'Thailand' },
  sweden: { lat: 60.1282, lng: 18.6435, label: 'Sweden' },
  norway: { lat: 60.472, lng: 8.4689, label: 'Norway' },
  denmark: { lat: 56.2639, lng: 9.5018, label: 'Denmark' },
  finland: { lat: 61.9241, lng: 25.7482, label: 'Finland' },
  switzerland: { lat: 46.8182, lng: 8.2275, label: 'Switzerland' },
  austria: { lat: 47.5162, lng: 14.5501, label: 'Austria' },
  italy: { lat: 41.8719, lng: 12.5674, label: 'Italy' },
  belgium: { lat: 50.5039, lng: 4.4699, label: 'Belgium' },
  'czech republic': { lat: 49.8175, lng: 15.473, label: 'Czech Republic' },
  czechia: { lat: 49.8175, lng: 15.473, label: 'Czech Republic' },
  romania: { lat: 45.9432, lng: 24.9668, label: 'Romania' },
  ukraine: { lat: 48.3794, lng: 31.1656, label: 'Ukraine' },
  israel: { lat: 31.0461, lng: 34.8516, label: 'Israel' },
  'south africa': { lat: -30.5595, lng: 22.9375, label: 'South Africa' },
  argentina: { lat: -38.4161, lng: -63.6167, label: 'Argentina' },
  chile: { lat: -35.6751, lng: -71.543, label: 'Chile' },
  colombia: { lat: 4.5709, lng: -74.2973, label: 'Colombia' },
  'new zealand': { lat: -40.9006, lng: 174.886, label: 'New Zealand' },
  estonia: { lat: 58.5953, lng: 25.0136, label: 'Estonia' },
  lithuania: { lat: 55.1694, lng: 23.8813, label: 'Lithuania' },
  latvia: { lat: 56.8796, lng: 24.6032, label: 'Latvia' },
  hungary: { lat: 47.1625, lng: 19.5033, label: 'Hungary' },
  greece: { lat: 39.0742, lng: 21.8243, label: 'Greece' },
  turkey: { lat: 38.9637, lng: 35.2433, label: 'Turkey' },
  taiwan: { lat: 23.6978, lng: 120.9605, label: 'Taiwan' },
  china: { lat: 35.8617, lng: 104.1954, label: 'China' },
  egypt: { lat: 26.8206, lng: 30.8025, label: 'Egypt' },
  nigeria: { lat: 9.082, lng: 8.6753, label: 'Nigeria' },
  kenya: { lat: -0.0236, lng: 37.9062, label: 'Kenya' },
  pakistan: { lat: 30.3753, lng: 69.3451, label: 'Pakistan' },
  bangladesh: { lat: 23.685, lng: 90.3563, label: 'Bangladesh' }
};

function normalizeKey(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripRemotePrefix(raw) {
  return String(raw || '')
    .replace(/100%\s*/gi, '')
    .replace(/\b(remote|wfh|work from home|work from anywhere)\b/gi, ' ')
    .replace(/^[/\-–,|:\s]+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function lookupPlace(token) {
  const key = normalizeKey(token);
  if (!key) return null;
  if (CITY_COORDS[key]) {
    const city = CITY_COORDS[key];
    return { ...city, key: `city:${city.label.toLowerCase()}`, worldwide: false };
  }
  if (COUNTRY_COORDS[key]) {
    const country = COUNTRY_COORDS[key];
    return { ...country, key: `country:${country.label.toLowerCase()}`, worldwide: false };
  }
  return null;
}

export function geocodeLocation(location) {
  if (location == null) return null;
  const raw = String(location).trim();
  if (!raw) return null;

  const normalized = normalizeKey(raw);
  if (!normalized) return null;

  if (WORLDWIDE_RE.test(raw) || WORLDWIDE_RE.test(normalized)) {
    return { ...WORLDWIDE_BUCKET, worldwide: true };
  }

  const stripped = stripRemotePrefix(raw);
  const strippedNorm = normalizeKey(stripped);
  if (!stripped || !strippedNorm) {
    return { ...WORLDWIDE_BUCKET, worldwide: true };
  }
  if (WORLDWIDE_RE.test(stripped) || WORLDWIDE_RE.test(strippedNorm)) {
    return { ...WORLDWIDE_BUCKET, worldwide: true };
  }

  const parts = stripped
    .split(/[,|/]| - /)
    .map((part) => part.trim())
    .filter(Boolean);

  for (const part of parts) {
    const hit = lookupPlace(part);
    if (hit) return hit;
  }

  const firstComma = stripped.match(/^([^,]+),\s*(.+)$/);
  if (firstComma) {
    const cityHit = lookupPlace(firstComma[1]);
    if (cityHit) return cityHit;
    const countryHit = lookupPlace(firstComma[2]);
    if (countryHit) return countryHit;
  }

  return lookupPlace(stripped);
}

export function remoteSourceLabel(job) {
  const tags = Array.isArray(job?.tags) ? job.tags.map((t) => String(t).toLowerCase()) : [];
  const blob = tags.join(' | ');
  for (const [needle, label] of SOURCE_ALIASES) {
    if (blob.includes(needle)) return label;
  }
  if (job?.platform === 'Remote') return 'Remote';
  return job?.platform || 'Remote';
}

export function isGlobeEligibleJob(job) {
  if (!job) return false;
  const platform = String(job.platform || '');
  if (LOCAL_PLATFORMS.has(platform)) return false;

  if (platform === 'Remote') return true;

  const tags = Array.isArray(job.tags) ? job.tags.map((t) => String(t).toLowerCase()) : [];
  const tagBlob = tags.join(' ');
  if (SOURCE_ALIASES.some(([needle]) => tagBlob.includes(needle))) return true;
  if (tags.includes('luar negeri') || tags.includes('remote')) return true;

  const work = String(job.work_type || '').toLowerCase();
  const loc = String(job.location || '').toLowerCase();
  if (work.includes('remote') && (loc.includes('luar') || WORLDWIDE_RE.test(loc))) return true;

  return false;
}

function pointSize(count) {
  return Math.min(1.15, 0.28 + Math.sqrt(count) * 0.22);
}

function dominantSource(jobs) {
  const tallies = new Map();
  for (const job of jobs) {
    const source = remoteSourceLabel(job);
    tallies.set(source, (tallies.get(source) || 0) + 1);
  }
  let best = 'Remote';
  let bestCount = 0;
  for (const [source, count] of tallies) {
    if (count > bestCount) {
      best = source;
      bestCount = count;
    }
  }
  return best;
}

export function aggregateGlobePoints(jobs = []) {
  const buckets = new Map();

  for (const job of jobs) {
    if (!isGlobeEligibleJob(job)) continue;
    const geo = geocodeLocation(job.location);
    if (!geo) continue;

    const existing = buckets.get(geo.key);
    if (existing) {
      existing.jobs.push(job);
      existing.count += 1;
    } else {
      buckets.set(geo.key, {
        key: geo.key,
        label: geo.label,
        lat: geo.lat,
        lng: geo.lng,
        worldwide: Boolean(geo.worldwide),
        jobs: [job],
        count: 1
      });
    }
  }

  return [...buckets.values()].map((point) => {
    const source = dominantSource(point.jobs);
    const intensity = Math.min(1, 0.45 + point.count / 12);
    const base = SOURCE_COLORS[source] || SOURCE_COLORS.Remote;
    return {
      ...point,
      source,
      color: point.worldwide ? '#FBBF24' : base,
      size: point.worldwide ? Math.max(0.55, pointSize(point.count)) : pointSize(point.count),
      intensity
    };
  }).sort((a, b) => b.count - a.count);
}

export function canUseWebGL() {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}

export function isVerySmallScreen() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 560px)').matches;
}
