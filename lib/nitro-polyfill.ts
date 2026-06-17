// Polyfill for react-native-nitro-modules
// Runs before any module initialisation — keeps the runtime stable on all targets.

// structuredClone — available in RN 0.74+ and Hermes; this is a safety net for
// older environments or jest test runners where the global may be absent.
if (typeof structuredClone === 'undefined') {
  (globalThis as Record<string, unknown>).structuredClone = <T>(v: T): T =>
    JSON.parse(JSON.stringify(v));
}
