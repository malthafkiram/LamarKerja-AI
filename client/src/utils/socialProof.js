export function formatSocialProofLine(counts, lang = 'id') {
  const visitors = Number(counts?.visitors) || 0;
  const registered = Number(counts?.registered) || 0;
  if (lang === 'en') {
    const people = visitors === 1 ? 'person has' : 'people have';
    return `${visitors} ${people} visited · ${registered} registered`;
  }
  return `${visitors} orang sudah berkunjung · ${registered} sudah daftar`;
}
