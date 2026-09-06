'use client';

import React from 'react';
import type { AgentVisualizerState } from 'agora-agent-uikit';

export interface AgentVisualizerProps {
  state?: AgentVisualizerState | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const STATE_LABELS: Record<string, string> = {
  talking: 'AI Speaking',
  speaking: 'AI Speaking',
  listening: 'Listening to you',
  analyzing: 'Thinking...',
  thinking: 'Thinking...',
  ambient: 'Ready',
  idle: 'Ready',
  joining: 'Connecting to agent...',
  'not-joined': 'Connecting voice...',
  disconnected: 'Disconnected',
};

export function AgentVisualizer({
  state = 'ambient',
  size = 'lg',
  className = '',
}: AgentVisualizerProps) {
  const normState = (state || 'ambient').toLowerCase();
  const isSpeaking = normState === 'talking' || normState === 'speaking';
  const isListening = normState === 'listening';
  const isThinking = normState === 'analyzing' || normState === 'thinking';
  const isConnecting = normState === 'joining' || normState === 'not-joined';
  const isDisconnected = normState === 'disconnected';

  const label = STATE_LABELS[normState] || 'Ready';

  // Size dimensions
  const containerSize =
    size === 'sm' ? 'w-32 h-32' : size === 'md' ? 'w-44 h-44' : 'w-56 h-56 sm:w-64 sm:h-64';
  const orbSize =
    size === 'sm' ? 'w-20 h-20' : size === 'md' ? 'w-28 h-28' : 'w-36 h-36 sm:w-40 sm:h-40';

  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 ${className}`}
      role="img"
      aria-label={`AI agent status: ${label}`}
    >
      {/* Outer visualization sphere container */}
      <div className={`relative flex items-center justify-center ${containerSize}`}>
        {/* Animated outer aura ripple rings when speaking or listening */}
        {isSpeaking && (
          <>
            <span className="absolute inset-0 animate-ping rounded-full bg-[#3ecf8e]/15 duration-1000" />
            <span className="absolute inset-2 animate-pulse rounded-full border border-[#3ecf8e]/30 bg-[#3ecf8e]/10 duration-700" />
          </>
        )}

        {isListening && (
          <>
            <span className="absolute inset-2 animate-pulse rounded-full border border-[#3ecf8e]/25 bg-[#3ecf8e]/5 duration-1000" />
            <span className="absolute inset-6 animate-ping rounded-full bg-[#3ecf8e]/10 duration-1500" />
          </>
        )}

        {/* Orbiting ring when thinking */}
        {isThinking && (
          <div className="absolute inset-2 animate-spin rounded-full border-2 border-dashed border-[#3ecf8e]/40 duration-3000" />
        )}

        {/* Central glowing orb */}
        <div
          className={`relative flex items-center justify-center rounded-full transition-all duration-500 ${orbSize} ${
            isSpeaking
              ? 'bg-[radial-gradient(circle_at_35%_35%,#68f0b0,#15803d)] shadow-[0_0_50px_rgba(62,207,142,0.45)] scale-105'
              : isThinking
                ? 'bg-[radial-gradient(circle_at_35%_35%,#5eead4,#047857)] shadow-[0_0_40px_rgba(45,212,191,0.35)] animate-pulse'
                : isListening
                  ? 'bg-[radial-gradient(circle_at_35%_35%,#3ecf8e,#065f46)] shadow-[0_0_35px_rgba(62,207,142,0.3)]'
                  : isConnecting
                    ? 'bg-[radial-gradient(circle_at_35%_35%,#64748b,#1e293b)] shadow-[0_0_20px_rgba(100,116,139,0.2)] animate-pulse'
                    : isDisconnected
                      ? 'bg-[radial-gradient(circle_at_35%_35%,#f87171,#991b1b)] shadow-[0_0_25px_rgba(239,68,68,0.3)]'
                      : 'bg-[radial-gradient(circle_at_35%_35%,#34d399,#064e3b)] shadow-[0_0_30px_rgba(52,211,153,0.25)]'
          }`}
        >
          {/* Inner core glow */}
          <div className="absolute inset-1 rounded-full bg-gradient-to-b from-white/20 to-transparent blur-[1px]" />

          {/* Dynamic Graphic Inside Orb */}
          {isSpeaking && (
            <div className="flex items-center gap-1.5 z-10">
              <span className="w-1.5 h-6 rounded-full bg-[#052e16] animate-[pulse_0.4s_ease-in-out_infinite]" />
              <span className="w-1.5 h-10 rounded-full bg-[#052e16] animate-[pulse_0.6s_ease-in-out_infinite_0.1s]" />
              <span className="w-1.5 h-7 rounded-full bg-[#052e16] animate-[pulse_0.5s_ease-in-out_infinite_0.2s]" />
              <span className="w-1.5 h-11 rounded-full bg-[#052e16] animate-[pulse_0.7s_ease-in-out_infinite_0.15s]" />
              <span className="w-1.5 h-5 rounded-full bg-[#052e16] animate-[pulse_0.45s_ease-in-out_infinite_0.05s]" />
            </div>
          )}

          {isListening && (
            <div className="flex items-center justify-center z-10">
              <span className="w-4 h-4 rounded-full bg-[#052e16]/80 animate-ping" />
            </div>
          )}

          {isThinking && (
            <div className="flex items-center justify-center z-10">
              <span className="w-8 h-8 rounded-full border-2 border-[#052e16] border-t-transparent animate-spin" />
            </div>
          )}

          {isConnecting && (
            <div className="flex items-center justify-center z-10">
              <span className="w-7 h-7 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
            </div>
          )}

          {!isSpeaking && !isListening && !isThinking && !isConnecting && (
            <div className="w-3 h-3 rounded-full bg-[#052e16]/70 z-10" />
          )}
        </div>
      </div>

      {/* State label pill */}
      <div className="flex items-center gap-2 rounded-full border border-[#2b2b2b] bg-[#171717]/90 px-3.5 py-1.5 text-xs text-[#d4d4d4] shadow-sm backdrop-blur-sm">
        <span
          className={`h-2 w-2 rounded-full ${
            isSpeaking
              ? 'bg-[#3ecf8e] animate-ping'
              : isThinking
                ? 'bg-amber-400 animate-pulse'
                : isListening
                  ? 'bg-emerald-400 animate-pulse'
                  : isConnecting
                    ? 'bg-slate-400 animate-pulse'
                    : isDisconnected
                      ? 'bg-red-400'
                      : 'bg-emerald-500'
          }`}
        />
        <span className="font-mono text-[11px] font-medium tracking-wide">{label}</span>
      </div>
    </div>
  );
}
