const DUMMY_HEADLINES = ['Software Developer / Professional', 'Kandidat Pelamar'];
const DUMMY_NAMES = ['Kandidat Pelamar'];

/**
 * Coerce API/DB skills (array, JSON string, or comma-separated) into a chip list.
 * Never return [] just because the value was not already an array.
 */
export function normalizeSkills(skills) {
  if (Array.isArray(skills)) {
    return skills.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof skills === 'string') {
    const trimmed = skills.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return normalizeSkills(parsed);
      } catch {
        // fall through to comma split
      }
    }
    const inner =
      trimmed.startsWith('{') && trimmed.endsWith('}')
        ? trimmed.slice(1, -1)
        : trimmed;
    return inner
      .split(',')
      .map((item) => item.trim().replace(/^["']|["']$/g, ''))
      .filter(Boolean);
  }
  return [];
}

function filled(value) {
  return Boolean(value && String(value).trim());
}

/**
 * True when the row still looks like a never-edited dummy identity
 * (old default name/headline). Uploaded CV and saved skills do not count —
 * those persist independently and must not trigger stripping.
 */
function looksLikeDummyIdentity(profile = {}) {
  const name = profile.full_name || '';
  const headline = profile.headline || '';
  const hasRealIdentity =
    (filled(name) && !DUMMY_NAMES.includes(name)) ||
    (filled(headline) && !DUMMY_HEADLINES.includes(headline));
  const hasOtherContent = Boolean(
    filled(profile.city) ||
    filled(profile.summary) ||
    filled(profile.linkedin_url) ||
    filled(profile.portfolio_url) ||
    filled(profile.github_url) ||
    filled(profile.phone) ||
    filled(profile.email)
  );
  return !hasRealIdentity && !hasOtherContent;
}

/**
 * Map a DB/API profile onto the Profil & CV form.
 * Keep user-saved city, summary, links, skills, and identity.
 * Do not auto-fill empty skills. Do not strip skills that are already saved,
 * even if they match the old JavaScript/React seed list.
 */
export function toFormProfile(profile = {}) {
  const next = {
    ...profile,
    full_name: profile.full_name || '',
    email: profile.email || '',
    phone: profile.phone || '',
    city: profile.city || '',
    headline: profile.headline || '',
    summary: profile.summary || '',
    linkedin_url: profile.linkedin_url || '',
    portfolio_url: profile.portfolio_url || '',
    github_url: profile.github_url || '',
    skills: normalizeSkills(profile.skills)
  };

  if (looksLikeDummyIdentity(profile)) {
    if (DUMMY_NAMES.includes(next.full_name)) next.full_name = '';
    if (DUMMY_HEADLINES.includes(next.headline)) next.headline = '';
  }

  return next;
}

/** Fields the Profil form is allowed to persist (never send id/smtp/cv path). */
export function buildProfilePayload(formData = {}) {
  return {
    full_name: formData.full_name || '',
    email: formData.email || '',
    phone: formData.phone || '',
    city: formData.city || '',
    headline: formData.headline || '',
    summary: formData.summary || '',
    linkedin_url: formData.linkedin_url || '',
    portfolio_url: formData.portfolio_url || '',
    github_url: formData.github_url || '',
    skills: normalizeSkills(formData.skills)
  };
}
