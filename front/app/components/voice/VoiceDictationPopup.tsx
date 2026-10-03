'use client';

import React from 'react';
import { Check, X, Mic, AlertCircle } from 'lucide-react';
import { VoiceWaveVisualizer } from './VoiceWaveVisualizer';

interface VoiceDictationPopupProps {
  isListening: boolean;
  audioStream: MediaStream | null;
  interimTranscript: string;
  errorMessage?: string | null;
  onFinish: () => void;
  onCancel: () => void;
}

export const VoiceDictationPopup: React.FC<VoiceDictationPopupProps> = ({
  isListening,
  audioStream,
  interimTranscript,
  errorMessage,
  onFinish,
  onCancel,
}) => {
  if (!isListening && !errorMessage) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-label="Dyktowanie zapytania"
      className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-sm z-30 animate-in fade-in slide-in-from-bottom-2 duration-200 select-none"
    >
      <div className="relative bg-white/95 backdrop-blur-xl text-stone-900 rounded-2xl p-3.5 border border-stone-200/90 shadow-[0_12px_28px_-6px_rgba(0,0,0,0.12)] flex flex-col gap-2.5">
        {/* Górna belka: Status + Akcje */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-stone-100 flex items-center justify-center text-stone-800">
              <Mic className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-stone-900 tracking-tight">
              Słucham...
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onFinish}
              className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 active:scale-95 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
              title="Zatwierdź dyktowanie"
            >
              <Check className="w-3 h-3 stroke-[2.5]" />
              <span>Gotowe</span>
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
              title="Anuluj"
              aria-label="Anuluj"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Błąd (jeśli wystąpił) */}
        {errorMessage ? (
          <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{errorMessage}</span>
          </div>
        ) : (
          <>
            {/* Fale dźwiękowe */}
            <div className="py-1 flex items-center justify-center bg-stone-50/80 rounded-xl border border-stone-100">
              <VoiceWaveVisualizer
                isListening={isListening}
                audioStream={audioStream}
                barCount={19}
              />
            </div>

            {/* Zwięzły podgląd na żywo */}
            <div className="px-2 py-1 text-center">
              {interimTranscript ? (
                <p className="text-xs font-medium text-stone-800 italic truncate leading-snug">
                  „{interimTranscript}”
                </p>
              ) : (
                <p className="text-[11px] text-stone-400 leading-snug">
                  Mów do mikrofonu...
                </p>
              )}
            </div>
          </>
        )}

        {/* Trójkącik wskazujący na pole poniżej */}
        <div
          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-stone-200/90 rotate-45"
          aria-hidden="true"
        />
      </div>
    </div>
  );
};
