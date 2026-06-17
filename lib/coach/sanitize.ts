/**
 * Deterministic output sanitizer — runs on every coach message before display and TTS.
 * Guarantees no em/en-dashes, markdown formatting, or filler regardless of model output.
 */

export function sanitizeCoachMessage(text: string): string {
  return text
    // em-dash and en-dash → comma space (unless at start of bullet line → keep as hyphen)
    .replace(/(\S)\s*[—–]\s*/g, '$1, ')
    .replace(/^[—–]\s*/gm, '- ')
    // markdown bold/italic
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // backtick code spans (keep content)
    .replace(/`([^`]+)`/g, '$1')
    // collapse multiple spaces
    .replace(/ {2,}/g, ' ')
    // collapse 3+ newlines to double
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
