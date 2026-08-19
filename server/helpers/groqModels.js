/**
 * Model Groq yang masih aktif setelah Llama 3.x di-decommission (16 Agu 2026).
 */
const DEPRECATED_GROQ_MODELS = new Set([
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'llama-3.1-70b-versatile',
  'mixtral-8x7b-32768',
  'gemma2-9b-it',
  'llama3-70b-8192',
  'llama3-8b-8192',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'meta-llama/llama-4-maverick-17b-128e-instruct',
  'qwen/qwen3-32b'
]);

export const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-120b';

export const GROQ_FALLBACK_MODELS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.6-27b'
];

export function resolveGroqModel(preferred) {
  if (preferred && !DEPRECATED_GROQ_MODELS.has(preferred)) return preferred;
  return DEFAULT_GROQ_MODEL;
}
