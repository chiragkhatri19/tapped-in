import { useCallback, useEffect, useRef, useState } from 'react';
import { speak, stopSpeech } from '@/lib/coach/speech';
import {
  isVoiceAvailable,
  requestVoicePermissions,
  startListening,
  stopListening,
  abortListening,
} from '@/lib/coach/voice-recognition';
import type { CoachResponse } from '@/lib/coach/actions';

export type TalkPhase = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

interface UseTalkModeOptions {
  /** Calls the full coach pipeline and returns the response. Must be stable (useCallback). */
  askCoach: (text: string) => Promise<CoachResponse>;
  onOpen?: () => void;
  onClose?: () => void;
}

interface UseTalkModeReturn {
  phase: TalkPhase;
  partialTranscript: string;
  lastCoachText: string;
  errorMessage: string;
  isActive: boolean;
  /** Start a talk-mode session. Requests permissions if needed. */
  enter: () => Promise<void>;
  /** Stop the current session and reset. */
  exit: () => void;
}

const SILENCE_TIMEOUT_MS = 2200;
// Android throws a "busy"/"client" error if start() is called while the previous
// recognition session is still tearing down. A short gap before re-arming the mic
// keeps the listen → think → speak → listen loop from racing the native module.
const RESTART_DELAY_MS = 350;
// Error codes we can silently recover from by restarting the mic.
const TRANSIENT_ERRORS = new Set(['no-speech', 'speech-timeout', 'network', 'busy', 'client', 'no-match']);

export function useTalkMode({ askCoach, onOpen, onClose }: UseTalkModeOptions): UseTalkModeReturn {
  const [phase, setPhase] = useState<TalkPhase>('idle');
  const [partialTranscript, setPartialTranscript] = useState('');
  const [lastCoachText, setLastCoachText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const activeRef = useRef(false);          // true while session is running
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transcriptRef = useRef('');         // accumulates the latest partial

  function clearSilenceTimer() {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }

  function clearRestartTimer() {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      activeRef.current = false;
      clearSilenceTimer();
      clearRestartTimer();
      abortListening();
      stopSpeech();
    };
  }, []);

  // Re-arm the mic after a short gap so the native recogniser has fully reset.
  function relisten() {
    clearRestartTimer();
    restartTimerRef.current = setTimeout(() => {
      if (activeRef.current) listenOnce();
    }, RESTART_DELAY_MS);
  }

  // ── Core loop step: listen for one utterance ───────────────────────────────
  const listenOnce = useCallback(() => {
    if (!activeRef.current) return;
    clearRestartTimer();
    transcriptRef.current = '';
    setPartialTranscript('');
    setPhase('listening');

    startListening({
      onPartial: (t) => {
        if (!activeRef.current) return;
        transcriptRef.current = t;
        setPartialTranscript(t);

        // Reset silence timer on every new word
        clearSilenceTimer();
        silenceTimerRef.current = setTimeout(() => {
          if (!activeRef.current) return;
          stopListening(); // triggers onEnd → sends the accumulated transcript
        }, SILENCE_TIMEOUT_MS);
      },

      onFinal: (t) => {
        if (!activeRef.current) return;
        clearSilenceTimer();
        transcriptRef.current = t;
        setPartialTranscript(t);
        // onEnd will fire right after; we send from there to avoid double-send
      },

      onError: (code, msg) => {
        if (!activeRef.current) return;
        clearSilenceTimer();
        // Transient errors: just restart listening (after a short reset gap)
        if (TRANSIENT_ERRORS.has(code)) {
          relisten();
          return;
        }
        activeRef.current = false;
        setPhase('error');
        setErrorMessage(msg || `Speech error: ${code}`);
        onClose?.();
      },

      onEnd: () => {
        if (!activeRef.current) return;
        clearSilenceTimer();
        const transcript = transcriptRef.current.trim();

        if (!transcript) {
          // Silence with no speech — restart listening
          relisten();
          return;
        }

        // ── Ask the coach ──────────────────────────────────────────────────
        setPhase('thinking');
        setPartialTranscript('');

        askCoach(transcript)
          .then((res: CoachResponse) => {
            if (!activeRef.current) return;
            const replyText = res.message;
            setLastCoachText(replyText);
            setPhase('speaking');

            speak(replyText, {
              rate: 0.95,
              onDone: () => {
                if (!activeRef.current) return;
                relisten(); // loop
              },
              onStopped: () => {
                // User exited mid-speech — cleanup handled by exit()
              },
              onError: () => {
                if (!activeRef.current) return;
                relisten(); // TTS failure is non-fatal; keep looping
              },
            });
          })
          .catch(() => {
            if (!activeRef.current) return;
            // Network / guardrail error is already added to message history by askCoach
            // Just resume listening
            relisten();
          });
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [askCoach, onClose]);

  // ── enter ──────────────────────────────────────────────────────────────────
  const enter = useCallback(async () => {
    if (activeRef.current) return;

    const availability = await isVoiceAvailable();
    if (!availability.available) {
      const messages: Record<string, string> = {
        unsupported_os: 'Voice is available on Android and iPhone only.',
        no_module: 'This build doesn\'t include voice recognition. Run a dev build to use this feature.',
        not_allowed: 'Microphone permission was denied. Enable it in device settings.',
      };
      setErrorMessage(messages[availability.reason] ?? 'Voice recognition is not available.');
      setPhase('error');
      return;
    }

    const granted = await requestVoicePermissions();
    if (!granted) {
      setErrorMessage('Microphone permission is required to use voice. Enable it in Settings.');
      setPhase('error');
      return;
    }

    activeRef.current = true;
    onOpen?.();
    listenOnce();
  }, [listenOnce, onOpen]);

  // ── exit ───────────────────────────────────────────────────────────────────
  const exit = useCallback(() => {
    activeRef.current = false;
    clearSilenceTimer();
    clearRestartTimer();
    abortListening();
    stopSpeech();
    setPhase('idle');
    setPartialTranscript('');
    setErrorMessage('');
    onClose?.();
  }, [onClose]);

  return {
    phase,
    partialTranscript,
    lastCoachText,
    errorMessage,
    isActive: activeRef.current,
    enter,
    exit,
  };
}
