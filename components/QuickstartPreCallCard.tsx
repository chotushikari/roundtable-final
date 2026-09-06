'use client';

import { ArrowRight, Clock3, Loader2, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  isLoading: boolean;
  error: string | null;
  onStartConversation: () => void;
  interview?: { roleTitle: string; companyName?: string; durationMinutes: number; panelRoles: string[]; demoMode?: boolean } | null;
  requiresConsent?: boolean;
  consent?: boolean;
  onConsentChange?: (consent: boolean) => void;
  candidateName?: string;
  onCandidateNameChange?: (candidateName: string) => void;
};

export function QuickstartPreCallCard({ isLoading, error, onStartConversation, interview, requiresConsent = false, consent = false, onConsentChange, candidateName = '', onCandidateNameChange }: Props) {
  return (
    <div className="relative mx-auto grid w-[min(94vw,64rem)] animate-fade-up overflow-hidden rounded-3xl border border-[#292929] bg-[#121212] shadow-[0_30px_100px_rgba(0,0,0,.45)] lg:grid-cols-[1fr_.92fr]">
      <section className="relative flex min-h-[38rem] flex-col justify-between overflow-hidden border-b border-[#292929] p-8 text-left lg:border-b-0 lg:border-r lg:p-11">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(62,207,142,.12),transparent_35%)]" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#2f493c] bg-[#3ecf8e0f] px-3 py-1.5 font-mono text-[10px] font-semibold tracking-[.12em] text-[#52d99b]"><Sparkles size={12} /> PRIVATE AI INTERVIEW</span>
          <h1 className="mt-8 max-w-xl text-[clamp(2rem,4vw,3.5rem)] font-medium leading-[1.02] tracking-[-.055em] text-[#f1f1f1]">
            {interview?.roleTitle ?? 'Experience a voice-native interview'}
          </h1>
          <p className="mt-5 text-sm text-[#858585]">with {interview?.companyName ?? 'the hiring company'}</p>
        </div>
        <div className="relative grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          <div className="rounded-xl border border-[#292929] bg-[#171717] p-4"><Clock3 size={17} className="text-[#3ecf8e]"/><strong className="mt-4 block text-sm font-medium">Up to {interview?.durationMinutes ?? 10} min</strong><span className="mt-1 block text-xs text-[#737373]">Take your time</span></div>
          <div className="rounded-xl border border-[#292929] bg-[#171717] p-4"><Users size={17} className="text-[#3ecf8e]"/><strong className="mt-4 block text-sm font-medium">{interview?.panelRoles.length ?? 5} perspectives</strong><span className="mt-1 block text-xs text-[#737373]">One shared context</span></div>
          <div className="rounded-xl border border-[#292929] bg-[#171717] p-4"><ShieldCheck size={17} className="text-[#3ecf8e]"/><strong className="mt-4 block text-sm font-medium">Human reviewed</strong><span className="mt-1 block text-xs text-[#737373]">No automatic decision</span></div>
        </div>
      </section>

      <section className="flex flex-col justify-center p-8 text-left lg:p-11">
        <span className="font-mono text-[10px] font-semibold tracking-[.12em] text-[#3ecf8e]">READY WHEN YOU ARE</span>
        <h2 className="mt-3 text-2xl font-medium tracking-[-.035em] text-white">Take your time. Answer naturally.</h2>
        <p className="mt-3 text-sm leading-6 text-[#7c7c7c]">Answer naturally and ask for a repeat or a hint whenever you need one. Your work autosaves during coding and design tasks.</p>

        {requiresConsent && <div className="mt-8 grid gap-5">
          <label className="grid gap-2 text-xs font-medium text-[#a5a5a5]">Your name<input value={candidateName} onChange={(event) => onCandidateNameChange?.(event.target.value)} className="h-12 rounded-lg border border-[#303030] bg-[#191919] px-4 text-sm text-white outline-none transition focus:border-[#3ecf8e] focus:ring-2 focus:ring-[#3ecf8e18]" placeholder="Name shown on the interview report" autoComplete="name" maxLength={160}/></label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#292929] bg-[#171717] p-4 text-xs leading-5 text-[#898989]"><input type="checkbox" checked={consent} onChange={(event) => onConsentChange?.(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#3ecf8e]"/><span>I understand this is an AI interview. Transcript and workspace evidence are retained for 30 days, raw audio and video are not recorded, and a human review is required.</span></label>
        </div>}

        <Button onClick={onStartConversation} disabled={isLoading || (requiresConsent && (!consent || !candidateName.trim()))} className="mt-8 h-12 w-full rounded-lg bg-[#3ecf8e] text-sm font-bold text-[#07150f] hover:bg-[#50d99c] disabled:bg-[#285a43]">
          {isLoading ? <><Loader2 className="h-4 w-4 animate-spin"/>Securing voice room</> : <>{interview ? 'Enter interview' : 'Start conversation'}<ArrowRight size={16}/></>}
        </Button>
        {error && <p className="mt-3 rounded-lg border border-red-900/40 bg-red-950/20 p-3 text-xs text-red-300">{error}</p>}
      </section>
    </div>
  );
}
