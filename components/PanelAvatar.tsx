'use client';

import type { CSSProperties } from 'react';

type RoleTokens = { gradientStart: string; gradientEnd: string; border: string; glow: string; dot: string; text: string };

const ROLE_TOKENS: Record<string, RoleTokens> = {
  technical: { gradientStart: '#58dda0', gradientEnd: '#168653', border: '#35614c', glow: 'rgba(62, 207, 142, .38)', dot: '#3ecf8e', text: '#07150f' },
  product: { gradientStart: '#c084fc', gradientEnd: '#7c3aed', border: '#5b2fa0', glow: 'rgba(167, 139, 250, .38)', dot: '#a78bfa', text: '#0e0a1f' },
  hiring_manager: { gradientStart: '#fcd34d', gradientEnd: '#b45309', border: '#78450a', glow: 'rgba(251, 191, 36, .38)', dot: '#fbbf24', text: '#1c0e00' },
  behavioral: { gradientStart: '#f9a8d4', gradientEnd: '#be185d', border: '#831843', glow: 'rgba(244, 114, 182, .38)', dot: '#f472b6', text: '#1a0010' },
  customer: { gradientStart: '#7dd3fc', gradientEnd: '#0369a1', border: '#075985', glow: 'rgba(56, 189, 248, .38)', dot: '#38bdf8', text: '#041020' },
};

type PanelAvatarProps = { role: string; state: string | null };
const PROFILES: Record<string, { label: string; initials: string; tone: string; description: string }> = {
  hiring_manager: { label: 'Hiring Manager', initials: 'HM', tone: 'Professional', description: 'Background and ownership' },
  technical: { label: 'Technical Interviewer', initials: 'TI', tone: 'Precise', description: 'Implementation and trade-offs' },
  product: { label: 'Product Manager', initials: 'PM', tone: 'Outcome focused', description: 'Customer and business impact' },
  customer: { label: 'Customer', initials: 'CU', tone: 'Conversational', description: 'Clarity and real-world value' },
  behavioral: { label: 'Behavioural Interviewer', initials: 'BI', tone: 'Supportive', description: 'Collaboration and learning' },
};

function activityLabel(state: string | null) {
  const value = state?.toLowerCase() ?? '';
  if (/speak|talk/.test(value)) return 'Speaking';
  if (/think|process/.test(value)) return 'Thinking';
  if (/listen/.test(value)) return 'Listening';
  return 'Ready';
}

export function PanelAvatar({ role, state }: PanelAvatarProps) {
  const profile = PROFILES[role] ?? PROFILES.technical;
  const tokens = ROLE_TOKENS[role] ?? ROLE_TOKENS.technical;
  const activity = activityLabel(state);
  const speaking = activity === 'Speaking';
  const avatarStyle = {
    background: `radial-gradient(circle at 30% 25%, ${tokens.gradientStart}, ${tokens.gradientEnd})`,
    borderColor: tokens.border,
    color: tokens.text,
    '--avatar-glow-base': `0 12px 35px ${tokens.glow.replace('.38', '.18')}`,
    '--avatar-glow-speak': `0 18px 40px ${tokens.glow}`,
  } as CSSProperties;

  return (
    <section className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[#2b2b2b] bg-[#151515e8] p-5 shadow-[0_24px_70px_rgba(0,0,0,.28)]" aria-label={`${profile.label} AI avatar, ${activity.toLowerCase()}`}>
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${tokens.dot}, transparent)` }} />
      <div className="flex items-center gap-4">
        <div className={`relative grid h-16 w-16 shrink-0 place-items-center rounded-2xl border font-mono text-lg font-bold ${speaking ? 'panel-avatar-speaking' : ''}`} style={avatarStyle}>
          <span>{profile.initials}</span>
          <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-[3px] border-[#151515]" style={{ background: tokens.dot }} />
        </div>
        <div className="min-w-0 flex-1"><p className="font-mono text-[9px] font-semibold uppercase tracking-[.18em] text-[#707070]">Current panel perspective</p><h2 className="mt-1 truncate text-xl font-semibold tracking-[-.035em] text-[#f0f0f0]">{profile.label}</h2><p className="mt-1 text-xs text-[#777]">{profile.description}</p></div>
        <span className="hidden items-center gap-2 rounded-full border border-[#303030] bg-[#1a1a1a] px-3 py-1.5 text-[10px] text-[#999] sm:flex"><i className={`h-2 w-2 rounded-full ${speaking ? 'panel-avatar-speaking' : ''}`} style={{ background: speaking ? tokens.dot : '#777' }} />{activity}</span>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-[#292929] pt-4 text-[11px]"><span className="text-[#6f6f6f]">Interview style</span><strong className="font-medium" style={{ color: tokens.dot }}>{profile.tone}</strong></div>
    </section>
  );
}
