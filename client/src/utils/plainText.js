/** Strip leftover markdown so coding-test copy does not show **stars**. */
export function stripMarkdownForPlainText(text) {
  if (!text) return '';
  return String(text)
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[ \t]*\*\s+(?=\S)/gm, '')
    .replace(/\*\*\*([^*\n]+)\*\*\*/g, '$1')
    .replace(/\*\*([^*\n]+)\*\*/g, '$1')
    .replace(/__([^_\n]+)__/g, '$1')
    .replace(/(^|[^*\\])\*([A-Za-zÀ-ÿ0-9][^*\n]{0,80}[A-Za-zÀ-ÿ0-9])\*(?!\*)/g, '$1$2')
    .replace(/`([^`]+)`/g, '"$1"')
    .trim();
}
