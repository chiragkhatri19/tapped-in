/**
 * Sound playback wrapper for workout feedback.
 * Uses expo-audio (SDK 54). No-op on web and if playback fails.
 */
import { Platform } from 'react-native';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let createAudioPlayer: ((source: any) => any) | null = null;

if (Platform.OS !== 'web') {
  try {
    const audio = require('expo-audio');
    if (typeof audio?.createAudioPlayer === 'function') {
      createAudioPlayer = audio.createAudioPlayer;
    }
  } catch {
    // expo-audio not available until native rebuild
  }
}

let restPlayer: { seekTo: (ms: number) => void; play: () => void } | null = null;

function getRestPlayer() {
  if (!createAudioPlayer) return null;
  try {
    if (!restPlayer) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      restPlayer = createAudioPlayer(require('@/assets/sounds/rest-complete.wav'));
    }
    return restPlayer;
  } catch {
    return null;
  }
}

/** Play the rest-complete beep. Call after haptic.warning() at rest-timer zero. */
export function playRestComplete(): void {
  try {
    const player = getRestPlayer();
    if (!player) return;
    player.seekTo(0);
    player.play();
  } catch {
    // Ignore all audio errors — feedback is secondary to workout logging
  }
}
