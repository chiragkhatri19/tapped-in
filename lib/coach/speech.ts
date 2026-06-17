/**
 * Crash-safe TTS wrapper — lazy-requires expo-speech so Expo Go and web don't crash.
 * `onDone` is critical for the talk-mode loop: it signals when the coach finishes
 * speaking so the mic can be re-opened without risk of self-transcription.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeakOptions = { rate?: number; onDone?: () => void; onStopped?: () => void; onError?: (e: Error) => void };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _expo: { speak: (t: string, o?: any) => void; stop: () => void } | null = null;

function getExpoSpeech() {
  if (_expo) return _expo;
  try {
    const mod = require('expo-speech');
    _expo = {
      speak: (text: string, options?: SpeakOptions) => {
        try { mod.speak(text, options); } catch { /* ignore */ }
      },
      stop: () => {
        try { mod.stop(); } catch { /* ignore */ }
      },
    };
  } catch {
    _expo = { speak: () => {}, stop: () => {} };
  }
  return _expo!;
}

export function speak(text: string, options?: SpeakOptions): void {
  getExpoSpeech().speak(text, options);
}

export function stopSpeech(): void {
  getExpoSpeech().stop();
}
