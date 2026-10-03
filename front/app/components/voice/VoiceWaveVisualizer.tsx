'use client';

import React, { useEffect, useRef, useState } from 'react';

interface VoiceWaveVisualizerProps {
  isListening: boolean;
  audioStream?: MediaStream | null;
  barCount?: number;
}

export const VoiceWaveVisualizer: React.FC<VoiceWaveVisualizerProps> = ({
  isListening,
  audioStream,
  barCount = 17,
}) => {
  const [barHeights, setBarHeights] = useState<number[]>(() =>
    Array(barCount).fill(6)
  );

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const currentHeightsRef = useRef<number[]>(Array(barCount).fill(6));

  useEffect(() => {
    if (!isListening) {
      setBarHeights(Array(barCount).fill(5));
      currentHeightsRef.current = Array(barCount).fill(5);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    let isCancelled = false;
    let t = 0;

    // Web Audio API setup with microphone
    if (audioStream && typeof window !== 'undefined') {
      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          audioContextRef.current = ctx;

          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          analyser.smoothingTimeConstant = 0.82;
          analyserRef.current = analyser;

          const source = ctx.createMediaStreamSource(audioStream);
          source.connect(analyser);
          sourceRef.current = source;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          const loop = () => {
            if (isCancelled) return;
            analyser.getByteFrequencyData(dataArray);

            t += 0.08;
            const step = Math.max(1, Math.floor(dataArray.length / barCount));

            const targetHeights = Array.from({ length: barCount }, (_, i) => {
              const rawVal = dataArray[i * step] || 0;
              // Gaussian/bell-curve envelope
              const centerDist = Math.abs(i - (barCount - 1) / 2) / ((barCount - 1) / 2);
              const envelope = Math.exp(-2.2 * centerDist * centerDist);

              // Organic idle wave ripple
              const idleWave = Math.sin(t + i * 0.45) * 2.5 + Math.cos(t * 1.3 - i * 0.3) * 1.5;

              // Voice amplitude contribution
              const voiceHeight = (rawVal / 255) * 26 * envelope;

              // Combined height clamped between 5px and 30px
              return Math.max(5, Math.min(30, 6 * envelope + idleWave * envelope + voiceHeight));
            });

            // Smooth interpolation (lerp) to avoid jitter
            const nextHeights = currentHeightsRef.current.map((curr, idx) => {
              const target = targetHeights[idx];
              return curr + (target - curr) * 0.32;
            });

            currentHeightsRef.current = nextHeights;
            setBarHeights(nextHeights);

            animationFrameRef.current = requestAnimationFrame(loop);
          };

          animationFrameRef.current = requestAnimationFrame(loop);
          return;
        }
      } catch {
        // Fallback below
      }
    }

    // Procedural smooth wave when stream is not directly accessible
    const loopSimulated = () => {
      if (isCancelled) return;
      t += 0.1;

      const targetHeights = Array.from({ length: barCount }, (_, i) => {
        const centerDist = Math.abs(i - (barCount - 1) / 2) / ((barCount - 1) / 2);
        const envelope = Math.exp(-2 * centerDist * centerDist);
        const wave =
          Math.sin(t + i * 0.45) * 8 +
          Math.sin(t * 1.7 + i * 0.25) * 5 +
          14;
        return Math.max(5, Math.min(28, wave * envelope));
      });

      const nextHeights = currentHeightsRef.current.map((curr, idx) => {
        const target = targetHeights[idx];
        return curr + (target - curr) * 0.28;
      });

      currentHeightsRef.current = nextHeights;
      setBarHeights(nextHeights);

      animationFrameRef.current = requestAnimationFrame(loopSimulated);
    };

    animationFrameRef.current = requestAnimationFrame(loopSimulated);

    return () => {
      isCancelled = true;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, [isListening, audioStream, barCount]);

  return (
    <div className="flex items-center justify-center gap-1 h-9 px-3 py-1 select-none">
      {barHeights.map((height, index) => {
        const distFromCenter = Math.abs(index - (barCount - 1) / 2);
        // Tonal colors matching Hubmi's warm stone palette
        let barColor = 'bg-stone-300';
        if (distFromCenter <= 2) {
          barColor = 'bg-stone-900';
        } else if (distFromCenter <= 4) {
          barColor = 'bg-stone-700';
        } else if (distFromCenter <= 6) {
          barColor = 'bg-stone-500';
        }

        return (
          <div
            key={index}
            className={`w-1 rounded-full ${barColor} transition-transform ease-out`}
            style={{
              height: `${Math.round(height)}px`,
              minHeight: '4px',
            }}
          />
        );
      })}
    </div>
  );
};
