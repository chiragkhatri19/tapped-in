/**
 * Crash-safe wrapper around expo-speech-recognition.
 * Lazy-required so Expo Go / web / pre-prebuild builds don't crash on import.
 */

import { Platform } from 'react-native';

export type VoiceAvailability =
  | { available: true }
  | { available: false; reason: 'unsupported_os' | 'no_module' | 'not_allowed' };

export interface VoiceListeners {
  onPartial: (transcript: string) => void;
  /** Called when a final result arrives (isFinal === true). */
  onFinal: (transcript: string) => void;
  onError: (code: string, message: string) => void;
  /** Called when recognition ends for any reason (after stop() or abort()). */
  onEnd?: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getModule(): any | null {
  try {
    return require('expo-speech-recognition');
  } catch {
    return null;
  }
}

export async function isVoiceAvailable(): Promise<VoiceAvailability> {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
    return { available: false, reason: 'unsupported_os' };
  }
  const mod = getModule();
  if (!mod) return { available: false, reason: 'no_module' };
  return { available: true };
}

export async function requestVoicePermissions(): Promise<boolean> {
  const mod = getModule();
  if (!mod) return false;
  try {
    const result = await mod.ExpoSpeechRecognitionModule.requestPermissionsAsync();
    return result.granted === true;
  } catch {
    return false;
  }
}

// Active subscriptions so we can clean them up
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _subs: Array<{ remove: () => void }> = [];

function clearSubs() {
  while (_subs.length) _subs.pop()!.remove();
}

export function startListening(listeners: VoiceListeners): void {
  const mod = getModule();
  if (!mod) {
    listeners.onError('no_module', 'Speech recognition is not available in this build.');
    return;
  }

  clearSubs();

  const { ExpoSpeechRecognitionModule } = mod;

  _subs.push(
    ExpoSpeechRecognitionModule.addListener('result', (event: { isFinal: boolean; results: Array<{ transcript: string }> }) => {
      const transcript = event.results[0]?.transcript ?? '';
      if (event.isFinal) {
        listeners.onFinal(transcript);
      } else {
        listeners.onPartial(transcript);
      }
    }),
  );

  _subs.push(
    ExpoSpeechRecognitionModule.addListener('error', (event: { error: string; message: string }) => {
      // "no-speech" / "aborted" are expected end conditions, not errors
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        listeners.onError(event.error, event.message);
      }
    }),
  );

  _subs.push(
    ExpoSpeechRecognitionModule.addListener('end', () => {
      clearSubs();
      listeners.onEnd?.();
    }),
  );

  try {
    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      continuous: false, // single utterance; the hook restarts after each reply
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to start recognition';
    listeners.onError('start_failed', msg);
  }
}

export function stopListening(): void {
  const mod = getModule();
  if (!mod) return;
  try {
    mod.ExpoSpeechRecognitionModule.stop();
  } catch { /* ignore */ }
}

export function abortListening(): void {
  const mod = getModule();
  if (!mod) return;
  try {
    mod.ExpoSpeechRecognitionModule.abort();
  } catch { /* ignore */ }
  clearSubs();
}
