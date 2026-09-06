'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';

export interface MicButtonWithVisualizerProps {
  isEnabled: boolean;
  setIsEnabled?: (enabled: boolean) => void;
  track?: { getVolumeLevel?: () => number } | null;
  onToggle?: () => void | Promise<void>;
  className?: string;
  enabledColor?: string;
  disabledColor?: string;
  'aria-label'?: string;
  localMicrophoneTrack?: unknown;
  showWaveform?: boolean;
}

export function MicButtonWithVisualizer({
  isEnabled,
  setIsEnabled,
  track,
  onToggle,
  className = '',
  enabledColor: _enabledColor = 'hsl(var(--primary))',
  disabledColor: _disabledColor = 'hsl(var(--destructive))',
  'aria-label': ariaLabel,
  localMicrophoneTrack,
  showWaveform = false,
}: MicButtonWithVisualizerProps) {
  const [volume, setVolume] = useState(0);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const micTrack = (track ?? localMicrophoneTrack) as { getVolumeLevel?: () => number } | null | undefined;
    if (!isEnabled || !micTrack || typeof micTrack.getVolumeLevel !== 'function') {
      setVolume(0);
      return;
    }

    let isMounted = true;
    let smoothed = 0;

    const checkVolume = () => {
      if (!isMounted) return;
      try {
        const rawLevel = micTrack.getVolumeLevel?.() ?? 0;
        // Amplify speech levels slightly so normal conversational speaking creates active visual movement
        const amplified = Math.min(1, Math.max(0, rawLevel * 2.8));
        // Exponential moving average for smooth liquid motion (prevents jitter)
        smoothed = smoothed * 0.72 + amplified * 0.28;
        setVolume(smoothed);
      } catch {
        setVolume(0);
      }
      animFrameRef.current = requestAnimationFrame(checkVolume);
    };

    animFrameRef.current = requestAnimationFrame(checkVolume);
    return () => {
      isMounted = false;
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isEnabled, track, localMicrophoneTrack]);

  const handleClick = () => {
    if (onToggle) {
      void onToggle();
    } else if (setIsEnabled) {
      setIsEnabled(!isEnabled);
    }
  };

  const isSpeaking = isEnabled && volume > 0.04;
  const pulseScale = isEnabled ? 1 + Math.min(volume * 0.35, 0.25) : 1;
  const glowOpacity = isEnabled ? Math.max(0.1, Math.min(volume * 2.2, 0.8)) : 0;

  // Circumference for r = 21 in a 48x48 box: 2 * Math.PI * 21 ≈ 131.95
  const circumference = 131.95;
  const strokeOffset = circumference * (1 - Math.min(1, Math.max(0, volume * 1.7)));

  // Dynamic heights for 4 equalizer bars modulated slightly
  const barHeights = [
    Math.max(3, Math.min(16, Math.round(volume * 22))),
    Math.max(3, Math.min(22, Math.round(volume * 28 * 1.1))),
    Math.max(3, Math.min(24, Math.round(volume * 30 * 1.15))),
    Math.max(3, Math.min(16, Math.round(volume * 22 * 0.9))),
  ];

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Mic Button with Radial Audio Level Ring */}
      <div className="relative inline-flex items-center justify-center">
        {/* Dynamic audio volume glow aura */}
        {isEnabled && (
          <span
            className="absolute inset-0 rounded-full transition-transform duration-75 pointer-events-none"
            style={{
              transform: `scale(${pulseScale})`,
              backgroundColor: '#3ecf8e',
              opacity: glowOpacity,
              filter: 'blur(10px)',
            }}
            aria-hidden="true"
          />
        )}

        {/* Circular SVG Voice Level Meter Ring */}
        <svg
          className="absolute -inset-1 h-14 w-14 -rotate-90 pointer-events-none transition-opacity duration-200"
          viewBox="0 0 48 48"
          aria-hidden="true"
        >
          {/* Base background ring */}
          <circle
            cx="24"
            cy="24"
            r="21"
            fill="none"
            stroke={isEnabled ? '#262626' : '#3d1c1c'}
            strokeWidth="2"
          />
          {/* Active volume level ring */}
          {isEnabled && (
            <circle
              cx="24"
              cy="24"
              r="21"
              fill="none"
              stroke="#3ecf8e"
              strokeWidth="2.5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              strokeLinecap="round"
              className="transition-[stroke-dashoffset] duration-75"
            />
          )}
        </svg>

        {/* Button icon */}
        <button
          type="button"
          onClick={handleClick}
          aria-label={ariaLabel ?? (isEnabled ? 'Mute microphone' : 'Unmute microphone')}
          aria-pressed={isEnabled}
          className={`relative z-10 flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3ecf8e] focus-visible:ring-offset-2 ${
            isEnabled
              ? isSpeaking
                ? 'border-[#3ecf8e] bg-[#141414] text-[#3ecf8e] shadow-[0_0_24px_rgba(62,207,142,0.35)] active:scale-95'
                : 'border-[#333] bg-[#161616] text-[#b4b4b4] hover:text-[#3ecf8e] hover:border-[#3ecf8e]/50 active:scale-95'
              : 'border-destructive/50 bg-destructive/15 text-destructive shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:bg-destructive/25 active:scale-95'
          }`}
        >
          {isEnabled ? (
            <Mic className={`h-5 w-5 transition-transform duration-150 ${isSpeaking ? 'scale-110 text-[#3ecf8e]' : ''}`} />
          ) : (
            <MicOff className="h-5 w-5 transition-transform duration-150 text-destructive" />
          )}
        </button>
      </div>

      {/* Live Speaking Waveform Equalizer Bar & Status Pill */}
      {showWaveform && (
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#2b2b2b] bg-[#141414e6] backdrop-blur-sm shadow-[0_4px_16px_rgba(0,0,0,0.25)] select-none"
          aria-live="polite"
        >
          {/* Animated 4-bar equalizer */}
          <div className="flex items-center gap-1 h-5 w-11 justify-center" aria-hidden="true">
            <span
              className={`w-1 rounded-full transition-all duration-75 ${
                !isEnabled
                  ? 'bg-destructive/40 h-1'
                  : isSpeaking
                    ? 'bg-[#3ecf8e] shadow-[0_0_6px_#3ecf8e]'
                    : 'bg-[#3ecf8e]/30 h-1.5'
              }`}
              style={{ height: isEnabled && isSpeaking ? `${barHeights[0]}px` : undefined }}
            />
            <span
              className={`w-1 rounded-full transition-all duration-75 ${
                !isEnabled
                  ? 'bg-destructive/40 h-1'
                  : isSpeaking
                    ? 'bg-[#3ecf8e] shadow-[0_0_8px_#3ecf8e]'
                    : 'bg-[#3ecf8e]/30 h-1.5'
              }`}
              style={{ height: isEnabled && isSpeaking ? `${barHeights[1]}px` : undefined }}
            />
            <span
              className={`w-1 rounded-full transition-all duration-75 ${
                !isEnabled
                  ? 'bg-destructive/40 h-1'
                  : isSpeaking
                    ? 'bg-[#3ecf8e] shadow-[0_0_8px_#3ecf8e]'
                    : 'bg-[#3ecf8e]/30 h-1.5'
              }`}
              style={{ height: isEnabled && isSpeaking ? `${barHeights[2]}px` : undefined }}
            />
            <span
              className={`w-1 rounded-full transition-all duration-75 ${
                !isEnabled
                  ? 'bg-destructive/40 h-1'
                  : isSpeaking
                    ? 'bg-[#3ecf8e] shadow-[0_0_6px_#3ecf8e]'
                    : 'bg-[#3ecf8e]/30 h-1.5'
              }`}
              style={{ height: isEnabled && isSpeaking ? `${barHeights[3]}px` : undefined }}
            />
          </div>

          {/* Text status indicator */}
          <span className="font-mono text-[10px] tracking-wider uppercase min-w-[54px] text-left">
            {!isEnabled ? (
              <span className="text-destructive font-medium">Muted</span>
            ) : isSpeaking ? (
              <span className="text-[#3ecf8e] font-semibold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#3ecf8e] animate-ping" />
                Live
              </span>
            ) : (
              <span className="text-[#777]">Mic On</span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}

export default MicButtonWithVisualizer;
