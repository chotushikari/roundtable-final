'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { avatarAssetPath } from '@/lib/avatar-presentation';

type RoundTablePanelProps = { role: string; state: string | null; currentUtterance?: string };

type Member = {
  role: 'technical' | 'product' | 'customer' | 'hiring_manager' | 'behavioral';
  name: string;
  title: string;
  position: string;
};

const MEMBERS: Member[] = [
  { role: 'technical', name: 'Alex', title: 'Technical', position: 'left-[12%] top-[31%]' },
  { role: 'product', name: 'Maya', title: 'Product', position: 'left-1/2 top-[8%] -translate-x-1/2' },
  { role: 'customer', name: 'Priya', title: 'Customer', position: 'right-[12%] top-[31%]' },
  { role: 'hiring_manager', name: 'Rahul', title: 'Hiring manager', position: 'bottom-[10%] left-[27%]' },
  { role: 'behavioral', name: 'Arjun', title: 'Behavioural', position: 'bottom-[10%] right-[27%]' },
];

const ROLE_LABELS: Record<string, string> = {
  technical: 'Technical interviewer', product: 'Product interviewer', customer: 'Customer perspective',
  hiring_manager: 'Hiring manager', behavioral: 'Behavioural interviewer',
};

function activity(state: string | null) {
  const value = state?.toLowerCase() ?? '';
  if (/speak|talk/.test(value)) return 'speaking';
  if (/think|analy|process/.test(value)) return 'thinking';
  if (/listen/.test(value)) return 'listening';
  return 'ready';
}

/** Presentation-only. The Agora agent and server own voice, transcript, and role handoffs. */
export function RoundTablePanel({ role, state, currentUtterance }: RoundTablePanelProps) {
  const activeRole = MEMBERS.some((member) => member.role === role) ? role : 'technical';
  const activeMember = MEMBERS.find((member) => member.role === activeRole) ?? MEMBERS[0];
  const previousRole = useRef(activeRole);
  const [handoffFrom, setHandoffFrom] = useState<string | null>(null);
  const currentActivity = activity(state);

  useEffect(() => {
    if (previousRole.current === activeRole) return;
    setHandoffFrom(previousRole.current);
    previousRole.current = activeRole;
    const timeout = window.setTimeout(() => setHandoffFrom(null), 700);
    return () => window.clearTimeout(timeout);
  }, [activeRole]);

  return <section className="relative w-full max-w-5xl overflow-hidden rounded-[1.75rem] border border-emerald-300/15 bg-[radial-gradient(circle_at_50%_48%,rgba(54,211,145,.13),transparent_30%),linear-gradient(180deg,#101713,#090d0b)] px-3 py-4 shadow-[0_30px_100px_rgba(0,0,0,.45)] sm:px-6 sm:py-5" aria-label="RoundTable AI interviewer panel">
    <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
      <span className="rounded-full border border-emerald-300/35 bg-emerald-400/10 px-3 py-1 font-mono text-[9px] font-semibold uppercase tracking-[.18em] text-emerald-200">Shared interview context</span>
      <span className="flex items-center gap-2 text-[10px] text-[#a4b4aa]"><i className={`h-2 w-2 rounded-full bg-emerald-300 ${currentActivity === 'speaking' ? 'animate-pulse' : ''}`} />{currentActivity === 'speaking' ? 'Panel speaking' : currentActivity === 'thinking' ? 'Panel considering' : 'Panel ready'}</span>
    </div>

    <div className="relative mx-auto mt-1 h-[25rem] max-w-3xl sm:h-[28rem]" aria-live="polite">
      <div className="absolute left-1/2 top-1/2 h-[56%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-emerald-300/25 bg-[radial-gradient(ellipse_at_center,rgba(42,170,112,.18),rgba(5,13,9,.1)_63%,transparent_68%)] shadow-[0_0_90px_rgba(52,207,143,.12)]" aria-hidden="true" />
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {[['18', '35'], ['50', '15'], ['82', '35'], ['32', '76'], ['68', '76']].map(([x, y], index) => {
          const member = MEMBERS[index];
          const active = member.role === activeRole;
          return <g key={member.role}><line x1={x} y1={y} x2="50" y2="52" className={active ? 'roundtable-connection roundtable-connection-active' : 'roundtable-connection'} />{active && <circle className="roundtable-signal" cx={x} cy={y} r="1.1"><animateMotion dur="1.25s" repeatCount="indefinite" path={`M ${x} ${y} L 50 52`} /></circle>}</g>;
        })}
      </svg>

      <div className="absolute left-1/2 top-1/2 z-10 flex h-24 w-52 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-[1.4rem] border border-emerald-200/25 bg-[#102219]/90 px-4 text-center shadow-[0_15px_45px_rgba(0,0,0,.36)] backdrop-blur-md sm:h-28 sm:w-60">
        <span className="font-mono text-[8px] font-semibold uppercase tracking-[.2em] text-emerald-200">Now leading</span><strong className="mt-1 text-sm font-semibold text-white sm:text-base">{ROLE_LABELS[activeRole]}</strong><span className="mt-1 text-[10px] text-[#afc2b6]">One shared conversation</span>
      </div>

      {MEMBERS.map((member) => {
        const isActive = member.role === activeRole;
        return <div key={member.role} className={`absolute z-20 -translate-x-1/2 ${member.position} ${isActive ? 'roundtable-node-active' : ''} ${handoffFrom === member.role ? 'roundtable-node-leaving' : ''}`}>
          <div className="flex w-[5.4rem] flex-col items-center text-center sm:w-24">
            <div className={`relative h-[4.45rem] w-[4.45rem] overflow-hidden rounded-full border bg-[#18241e] p-[3px] shadow-[0_8px_26px_rgba(0,0,0,.4)] sm:h-[5.2rem] sm:w-[5.2rem] ${isActive ? 'border-emerald-300 ring-4 ring-emerald-300/15' : 'border-white/20'}`}>
              <Image src={avatarAssetPath(member.role, 'portrait.png')} alt={`${member.name}, ${member.title}`} fill sizes="84px" unoptimized className="rounded-full object-cover" />
              {isActive && <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-[3px] border-[#0d1510] bg-emerald-300" />}
            </div>
            <span className={`mt-1.5 font-mono text-[9px] font-semibold uppercase tracking-[.12em] ${isActive ? 'text-emerald-200' : 'text-[#d1ddd5]'}`}>{member.name}</span><span className="mt-0.5 text-[8px] uppercase tracking-[.08em] text-[#7f9185]">{member.title}</span>
          </div>
        </div>;
      })}
    </div>

    <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-black/25 px-4 py-3 sm:px-5"><p className="font-mono text-[9px] font-semibold uppercase tracking-[.16em] text-emerald-200">{activeMember.name} · {activeMember.title}</p><p className="mt-1 line-clamp-2 text-sm leading-6 text-[#e5eee8]">{currentUtterance || (currentActivity === 'thinking' ? 'The panel is preparing the next question from your shared interview context.' : 'Your answers remain visible in the live transcript for human review.')}</p></div>
  </section>;
}
