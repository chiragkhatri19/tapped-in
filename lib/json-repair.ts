/**
 * Shared JSON repair utilities — used by both the coach client and the
 * workout generator to handle truncated / markdown-wrapped model output.
 */

export function repairTruncatedJSON(input: string): string {
  const start = input.indexOf('{');
  const s = start === -1 ? input : input.slice(start);
  let inStr = false, escaped = false, lastSafe = -1;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') { inStr = false; lastSafe = i + 1; }
      continue;
    }
    if (ch === '"') { inStr = true; continue; }
    if (ch === '{' || ch === '[') continue;
    if (ch === '}' || ch === ']') { lastSafe = i + 1; continue; }
    if ((ch >= '0' && ch <= '9') || ch === 'e') lastSafe = i + 1;
  }
  let out = (lastSafe > 0 ? s.slice(0, lastSafe) : s).replace(/[\s,]*$/, '');
  const closers: string[] = [];
  let inS = false, esc = false;
  for (let i = 0; i < out.length; i++) {
    const ch = out[i];
    if (inS) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inS = false; continue; }
    if (ch === '"') inS = true;
    else if (ch === '{') closers.push('}');
    else if (ch === '[') closers.push(']');
    else if (ch === '}' || ch === ']') closers.pop();
  }
  return out + closers.reverse().join('');
}

/** Strip markdown fences then parse; falls back to slice-repair.
 *  Returns `unknown` — use the throwing variant `parseModelJSONStrict` if you
 *  need to surface an error to the user. */
export function parseModelJSON(raw: string): unknown {
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try { return JSON.parse(cleaned); } catch { /* fall through */ }
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { /* fall through */ }
  }
  if (start !== -1) {
    try { return JSON.parse(repairTruncatedJSON(cleaned)); } catch { /* fall through */ }
  }
  return raw;
}

/** Same as parseModelJSON but throws on final failure — for callers that surface the error. */
export function parseModelJSONStrict(raw: string): unknown {
  const result = parseModelJSON(raw);
  if (typeof result === 'string' && result === raw) {
    throw new Error('The plan came back malformed. Tap generate again.');
  }
  return result;
}
