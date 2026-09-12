'use client';

import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { avatarAssetPath } from '@/lib/avatar-presentation';

interface AvatarOverlayProps {
  role: string;
  agentState: string | null;
  isVisible: boolean;
}

const ROLE_NAMES: Record<string, string> = {
  hiring_manager: 'Hiring Manager',
  technical: 'Technical Interviewer',
  product: 'Product Interviewer',
  customer: 'Customer Perspective',
  behavioral: 'Behavioural Interviewer',
};

export function AvatarOverlay({ role, agentState, isVisible }: AvatarOverlayProps) {
  const [position, setPosition] = useState({ x: 24, y: 24 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);

  const normalizedState = agentState?.toLowerCase() ?? '';
  const isSpeaking = /speak|talk/.test(normalizedState);
  const isThinking = /think|analy/.test(normalizedState);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPosition({
        x: Math.max(10, dragRef.current.initialX + dx),
        y: Math.max(10, dragRef.current.initialY + dy),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragRef.current = null;
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (!isVisible) return null;

  const roleName = ROLE_NAMES[role] ?? 'AI Interviewer';
  const portraitSrc = avatarAssetPath(role, 'portrait.png');

  return (
    <div
      style={{ top: `${position.y}px`, right: `${position.x}px` }}
      className="fixed z-50 flex cursor-grab items-center gap-3 rounded-2xl border border-white/20 bg-[#0c100d]/90 p-2.5 shadow-[0_16px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-shadow active:cursor-grabbing hover:border-emerald-400/40"
      onMouseDown={handleMouseDown}
      aria-label={`${roleName} avatar overlay`}
    >
      <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-emerald-500/30 bg-black/40">
        <Image
          src={portraitSrc}
          alt={roleName}
          fill
          className={`object-cover ${isSpeaking ? 'animate-pulse scale-105' : ''} transition-transform duration-300`}
          sizes="56px"
          unoptimized
        />
        {isSpeaking && (
          <span className="absolute bottom-1 right-1 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
        )}
      </div>

      <div className="pr-2 text-left">
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${isSpeaking ? 'bg-emerald-400 animate-pulse' : isThinking ? 'bg-amber-400 animate-pulse' : 'bg-slate-400'}`} />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
            {roleName}
          </span>
        </div>
        <p className="text-xs text-slate-300">
          {isSpeaking ? 'Speaking...' : isThinking ? 'Considering...' : 'Listening'}
        </p>
      </div>
    </div>
  );
}
