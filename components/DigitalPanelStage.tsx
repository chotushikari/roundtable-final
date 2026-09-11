'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

type DigitalPanelStageProps = {
  role: string;
  state: string | null;
  currentUtterance?: string;
  avatarVideoTrack?: { play: (element: string | HTMLElement) => void };
};

type RoleProfile = {
  label: string;
  lens: string;
  color: string;
  accent: string;
};

const ROLES: Record<string, RoleProfile> = {
  hiring_manager: {
    label: 'Hiring Manager',
    lens: 'Ownership, judgment and collaboration',
    color: 'text-amber-200',
    accent: 'bg-amber-300',
  },
  technical: {
    label: 'Technical Interviewer',
    lens: 'Implementation, depth and trade-offs',
    color: 'text-emerald-200',
    accent: 'bg-emerald-300',
  },
  product: {
    label: 'Product Interviewer',
    lens: 'Customer value and business impact',
    color: 'text-violet-200',
    accent: 'bg-violet-300',
  },
  customer: {
    label: 'Customer Perspective',
    lens: 'Clarity, adoption and real-world outcomes',
    color: 'text-sky-200',
    accent: 'bg-sky-300',
  },
  behavioral: {
    label: 'Behavioural Interviewer',
    lens: 'Teamwork, learning and decision making',
    color: 'text-rose-200',
    accent: 'bg-rose-300',
  },
};

const PANEL_ORDER = ['hiring_manager', 'technical', 'product', 'customer', 'behavioral'];

function activity(state: string | null) {
  const normalized = state?.toLowerCase() ?? '';
  if (/speak|talk/.test(normalized)) return { label: 'AI is speaking', active: true };
  if (/think|analy/.test(normalized)) return { label: 'Panel is considering your answer', active: true };
  if (/listen/.test(normalized)) return { label: 'Panel is listening', active: false };
  return { label: 'Panel is ready', active: false };
}

/**
 * A local, presentational AI panel host. It intentionally does not claim to be
 * live video or lip-synced media: Agora audio and server-owned interview state
 * remain the authoritative experience.
 */
export function DigitalPanelStage({ role, state, currentUtterance, avatarVideoTrack }: DigitalPanelStageProps) {
  const profile = ROLES[role] ?? ROLES.technical;
  const status = activity(state);
  const avatarMountRef = useRef<HTMLDivElement>(null);
  const [hasLiveAvatar, setHasLiveAvatar] = useState(false);

  useEffect(() => {
    const mount = avatarMountRef.current;
    if (!avatarVideoTrack || !mount) {
      setHasLiveAvatar(false);
      return;
    }
    try {
      avatarVideoTrack.play(mount);
      setHasLiveAvatar(true);
    } catch {
      setHasLiveAvatar(false);
    }
  }, [avatarVideoTrack]);

  return (
    <section className="w-full max-w-5xl overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#101411] shadow-[0_28px_100px_rgba(0,0,0,.42)]" aria-label="RoundTable AI panel stage">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#151a17] px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[.2em] text-emerald-300">AI interview panel · disclosed</p>
          <p className="mt-1 truncate text-sm font-semibold text-white">{profile.label}</p>
        </div>
        <span className="ml-3 inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[10px] font-medium text-[#d6e1db]">
          <span className={`h-2 w-2 rounded-full ${profile.accent} ${status.active ? 'animate-pulse' : ''}`} />
          {status.label}
        </span>
      </div>

      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.55fr)_minmax(13rem,.7fr)]">
        <div className="relative min-h-[17rem] overflow-hidden bg-[#0c0f0d] sm:min-h-[23rem]">
          <Image
            src="/images/roundtable-panel-host.png"
            alt="Illustrated RoundTable AI panel host"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 68vw"
            className={`object-cover object-center transition-opacity duration-500 ${hasLiveAvatar ? 'opacity-0' : 'opacity-100'}`}
          />
          <div ref={avatarMountRef} className={`absolute inset-0 [&_video]:h-full [&_video]:w-full [&_video]:object-cover ${hasLiveAvatar ? 'opacity-100' : 'pointer-events-none opacity-0'}`} aria-label={hasLiveAvatar ? 'Live AI avatar video' : undefined} />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,8,6,.38),transparent_45%,rgba(4,8,6,.16)),linear-gradient(0deg,rgba(4,8,6,.78),transparent_48%)]" />
          <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 sm:inset-x-5 sm:bottom-5">
            <div className="max-w-[78%] rounded-2xl border border-white/15 bg-[#0a0e0c]/80 px-3.5 py-2.5 backdrop-blur-md">
              <p className="font-mono text-[9px] uppercase tracking-[.16em] text-emerald-200">{hasLiveAvatar ? 'Live AI avatar · disclosed' : 'Current perspective'}</p>
              <p className={`mt-1 text-sm font-semibold ${profile.color}`}>{profile.lens}</p>
            </div>
            <div className="flex h-10 items-end gap-1 rounded-xl border border-white/10 bg-black/35 px-2.5 py-2 backdrop-blur-md" aria-hidden="true">
              {[13, 23, 17, 29, 14].map((height, index) => (
                <span key={index} className={`w-1 rounded-full ${profile.accent} ${status.active ? 'animate-pulse' : ''}`} style={{ height: `${height}px`, animationDelay: `${index * 100}ms` }} />
              ))}
            </div>
          </div>
        </div>

        <aside className="border-t border-white/10 bg-[#131815] p-4 lg:border-l lg:border-t-0 lg:p-5">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[.18em] text-[#839189]">Panel table</p>
          <div className="mt-3 space-y-2">
            {PANEL_ORDER.map((panelRole) => {
              const panel = ROLES[panelRole];
              const isActive = panelRole === role;
              return (
                <div key={panelRole} className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors ${isActive ? 'border-emerald-400/35 bg-emerald-400/10' : 'border-white/5 bg-black/10'}`}>
                  <span className={`h-2 w-2 rounded-full ${isActive ? panel.accent : 'bg-[#4b5750]'}`} />
                  <span className={`text-xs ${isActive ? 'font-medium text-white' : 'text-[#96a29b]'}`}>{panel.label}</span>
                  {isActive && <span className="ml-auto font-mono text-[8px] uppercase tracking-[.14em] text-emerald-200">active</span>}
                </div>
              );
            })}
          </div>
          <div className="mt-4 rounded-xl border border-white/10 bg-black/15 p-3">
            <p className="font-mono text-[9px] uppercase tracking-[.14em] text-[#8da097]">Shared context</p>
            <p className="mt-1.5 text-xs leading-5 text-[#c1cbc5]">Each perspective responds to the same interview evidence, then adds its own lens.</p>
          </div>
        </aside>
      </div>

      <div className="border-t border-white/10 bg-[#0e120f] px-4 py-3 sm:px-5">
        <p className="line-clamp-2 text-sm leading-6 text-[#dce6e0]" aria-live="polite">
          {currentUtterance || (status.active ? 'The panel is preparing its next question.' : 'Your response stays in the transcript as evidence for human review.')}
        </p>
      </div>
    </section>
  );
}
