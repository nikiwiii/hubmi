'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

// Speech Recognition API Types
interface SpeechRecognitionResultItem {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionResultItem;
}

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
  message?: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: ISpeechRecognition, ev: SpeechRecognitionEventLike) => void) | null;
  onerror: ((this: ISpeechRecognition, ev: SpeechRecognitionErrorEventLike) => void) | null;
  onend: ((this: ISpeechRecognition, ev: Event) => void) | null;
}

interface UseSpeechToTextOptions {
  lang?: string;
  onTranscriptChange?: (text: string) => void;
}

export function useSpeechToText({
  lang = 'pl-PL',
  onTranscriptChange,
}: UseSpeechToTextOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const baseTextRef = useRef('');
  const finalAccumulatedRef = useRef('');
  const isIntentionalStopRef = useRef(false);

  // Check support on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSpeech =
        'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
      setIsSupported(Boolean(hasSpeech));
    }
  }, []);

  const stopAudioStream = useCallback(() => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      audioStreamRef.current = null;
    }
    setAudioStream(null);
  }, []);

  const stopListening = useCallback(() => {
    isIntentionalStopRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    stopAudioStream();
    setIsListening(false);
    setInterimTranscript('');
  }, [stopAudioStream]);

  const cancelListening = useCallback(
    (initialValue?: string) => {
      isIntentionalStopRef.current = true;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
      stopAudioStream();
      setIsListening(false);
      setInterimTranscript('');
      if (initialValue !== undefined && onTranscriptChange) {
        onTranscriptChange(initialValue);
      }
    },
    [stopAudioStream, onTranscriptChange]
  );

  const startListening = useCallback(
    async (currentText: string = '') => {
      setErrorMessage(null);
      isIntentionalStopRef.current = false;
      baseTextRef.current = currentText.trim();
      finalAccumulatedRef.current = '';
      setInterimTranscript('');

      if (typeof window === 'undefined') return;

      const SpeechRecognitionConstructor =
        (window as unknown as { SpeechRecognition?: new () => ISpeechRecognition }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: new () => ISpeechRecognition }).webkitSpeechRecognition;

      if (!SpeechRecognitionConstructor) {
        setIsSupported(false);
        setErrorMessage(
          'Twoja przeglądarka nie obsługuje dyktowania głosowego (Speech Recognition). Zalecamy Google Chrome lub Microsoft Edge.'
        );
        return;
      }

      // Try acquiring microphone stream for live sound wave visualization
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          audioStreamRef.current = stream;
          setAudioStream(stream);
        }
      } catch {
        // Even if getUserMedia fails, SpeechRecognition might still work with browser default
      }

      try {
        const recognition = new SpeechRecognitionConstructor();
        recognitionRef.current = recognition;

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = lang;

        recognition.onstart = () => {
          setIsListening(true);
          setErrorMessage(null);
        };

        recognition.onresult = (event: SpeechRecognitionEventLike) => {
          let currentInterim = '';
          let newlyFinalized = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const result = event.results[i];
            const transcript = result[0]?.transcript || '';
            if (result.isFinal) {
              newlyFinalized += transcript;
            } else {
              currentInterim += transcript;
            }
          }

          if (newlyFinalized) {
            finalAccumulatedRef.current = (
              finalAccumulatedRef.current + ' ' + newlyFinalized
            ).trim();
          }

          setInterimTranscript(currentInterim || newlyFinalized);

          // Calculate composite text (base + finalized + interim)
          const parts = [
            baseTextRef.current,
            finalAccumulatedRef.current,
            currentInterim,
          ].filter(Boolean);

          const composite = parts.join(' ').replace(/\s+/g, ' ');
          if (onTranscriptChange) {
            onTranscriptChange(composite);
          }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
          if (event.error === 'no-speech') {
            // Silence detected, no need to show scary error
            return;
          }
          if (event.error === 'not-allowed') {
            setErrorMessage(
              'Brak dostępu do mikrofonu. Kliknij ikonę kłódki przy adresie strony i zezwól na mikrofon.'
            );
            stopListening();
            return;
          }
          if (event.error === 'network') {
            setErrorMessage('Wystąpił problem z połączeniem sieciowym usługi rozpoznawania mowy.');
            stopListening();
            return;
          }
          if (event.error !== 'aborted') {
            setErrorMessage(`Błąd dyktowania: ${event.error}`);
            stopListening();
          }
        };

        recognition.onend = () => {
          if (!isIntentionalStopRef.current) {
            // User or browser ended session
            setIsListening(false);
            stopAudioStream();
          }
        };

        recognition.start();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setErrorMessage(`Nie udało się uruchomić mikrofonu: ${msg}`);
        stopListening();
      }
    },
    [lang, onTranscriptChange, stopListening, stopAudioStream]
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isIntentionalStopRef.current = true;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
      stopAudioStream();
    };
  }, [stopAudioStream]);

  return {
    isListening,
    interimTranscript,
    errorMessage,
    isSupported,
    audioStream,
    startListening,
    stopListening,
    cancelListening,
  };
}
