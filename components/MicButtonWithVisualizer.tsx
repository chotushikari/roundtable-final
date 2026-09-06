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
}

export function MicButtonWithVisualizer({
  isEnabled,
  setIsEnabled,
  track,
  onToggle,
  className = '',
  enabledColor = 'hsl(var(--primary))',
  disabledColor: _disabledColor = 'hsl(var(--destructive))',
  'aria-label': ariaLabel,
}: MicButtonWithVisualizerProps) {
  const [volume, setVolume] = useState(0);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isEnabled || !track || typeof track.getVolumeLevel !== 'function') {
      setVolume(0);
      return;
    }

    const checkVolume = () => {
      try {
        const level = track.getVolumeLevel?.() ?? 0;
        setVolume(level);
      } catch {
        setVolume(0);
      }
      animFrameRef.current = requestAnimationFrame(checkVolume);
    };

    animFrameRef.current = requestAnimationFrame(checkVolume);
    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isEnabled, track]);

  const handleClick = () => {
    if (onToggle) {
      void onToggle();
    } else if (setIsEnabled) {
      setIsEnabled(!isEnabled);
    }
  };

  const pulseScale = isEnabled ? 1 + Math.min(volume * 0.4, 0.3) : 1;
  const glowOpacity = isEnabled ? Math.max(0.12, Math.min(volume * 2, 0.75)) : 0;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Audio volume glow */}
      {isEnabled && (
        <span
          className="absolute inset-0 rounded-full transition-transform duration-75 pointer-events-none"
          style={{
            transform: `scale(${pulseScale})`,
            backgroundColor: enabledColor,
            opacity: glowOpacity,
            filter: 'blur(8px)',
          }}
          aria-hidden="true"
        />
      )}

      {/* Gentle ambient ring when active */}
      {isEnabled && (
        <span
          className="absolute -inset-1 rounded-full border border-primary/20 pointer-events-none opacity-50"
          aria-hidden="true"
        />
      )}

      {/* Button icon */}
      <button
        type="button"
        onClick={handleClick}
        aria-label={ariaLabel ?? (isEnabled ? 'Mute microphone' : 'Unmute microphone')}
        aria-pressed={isEnabled}
        className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
          isEnabled
            ? 'border-primary/40 bg-[#161616] text-[#3ecf8e] shadow-[0_0_20px_rgba(62,207,142,0.2)] hover:bg-[#1f1f1f] hover:border-primary/60 active:scale-95'
            : 'border-destructive/40 bg-destructive/10 text-destructive shadow-[0_0_15px_rgba(239,68,68,0.15)] hover:bg-destructive/20 active:scale-95'
        }`}
      >
        {isEnabled ? (
          <Mic className="h-5 w-5 transition-transform duration-150" />
        ) : (
          <MicOff className="h-5 w-5 transition-transform duration-150" />
        )}
      </button>
    </div>
  );
}

export default MicButtonWithVisualizer;
