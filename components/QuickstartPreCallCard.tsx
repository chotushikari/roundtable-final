'use client';

import { useEffect, useRef } from 'react';
import { ArrowRight, Camera, CheckCircle2, Clock3, Loader2, ShieldCheck, Users, VideoOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CameraPresenceStatus } from '@/lib/camera-presence';

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
  cameraRequired?: boolean;
  cameraStatus?: CameraPresenceStatus;
  cameraStream?: MediaStream | null;
  cameraError?: string | null;
  onEnableCamera?: () => Promise<void>;
};

function CameraPreview({ stream }: { stream: MediaStream | null }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    if (stream) void video.play().catch(() => {});
    return () => { video.srcObject = null; };
  }, [stream]);
  return <video ref={videoRef} muted playsInline aria-label="Your camera preview" className="aspect-video w-full rounded-lg bg-black object-cover [transform:scaleX(-1)]" />;
}

export function QuickstartPreCallCard({ isLoading, error, onStartConversation, interview, requiresConsent = false, consent = false, onConsentChange, candidateName = '', onCandidateNameChange, cameraRequired = false, cameraStatus = 'idle', cameraStream = null, cameraError = null, onEnableCamera }: Props) {
  const cameraReady = !cameraRequired || cameraStatus === 'present';
  const cameraBusy = cameraStatus === 'requesting' || cameraStatus === 'checking';
  return (
    <div className="relative mx-auto grid max-h-[calc(100dvh-2rem)] w-[min(94vw,64rem)] animate-fade-up overflow-y-auto rounded-3xl border border-[#292929] bg-[#121212] shadow-[0_30px_100px_rgba(0,0,0,.45)] lg:max-h-[calc(100dvh-4rem)] lg:grid-cols-[1fr_.92fr] lg:overflow-hidden">
      <section className="relative flex min-h-[25rem] flex-col justify-between overflow-hidden border-b border-[#292929] p-8 text-left lg:min-h-[38rem] lg:border-b-0 lg:border-r lg:p-11">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(62,207,142,.12),transparent_35%)]" />
        <div className="relative">
          {/* <span className="inline-flex items-center gap-2 rounded-full border border-[#2f493c] bg-[#3ecf8e0f] px-3 py-1.5 font-mono text-[10px] font-semibold tracking-[.12em] text-[#52d99b]"><Sparkles size={12} /> PRIVATE AI INTERVIEW</span> */}
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

      <section className="flex flex-col justify-start p-8 text-left lg:justify-center lg:p-11">
        <span className="font-mono text-[10px] font-semibold tracking-[.12em] text-[#3ecf8e]">READY WHEN YOU ARE</span>
        <h2 className="mt-3 text-2xl font-medium tracking-[-.035em] text-white">Take your time. Answer naturally.</h2>
        <p className="mt-3 text-sm leading-6 text-[#7c7c7c]">Answer naturally and ask for a repeat or a hint whenever you need one. Your work autosaves during coding and design tasks.</p>

        {requiresConsent && <div className="mt-8 grid gap-5">
          <label className="grid gap-2 text-xs font-medium text-[#a5a5a5]">Your name<input value={candidateName} onChange={(event) => onCandidateNameChange?.(event.target.value)} className="h-12 rounded-lg border border-[#303030] bg-[#191919] px-4 text-sm text-white outline-none transition focus:border-[#3ecf8e] focus:ring-2 focus:ring-[#3ecf8e18]" placeholder="Name shown on the interview report" autoComplete="name" maxLength={160}/></label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#292929] bg-[#171717] p-4 text-xs leading-5 text-[#898989]"><input type="checkbox" checked={consent} onChange={(event) => onConsentChange?.(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#3ecf8e]"/><span>I understand this is an AI interview. Transcript and workspace evidence are retained for 30 days. Camera frames are checked on this device for face presence only and are never recorded or uploaded. A human review is always required.</span></label>
        </div>}

        {cameraRequired && <div className="mt-5 rounded-xl border border-[#315142] bg-[#102018] p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#3ecf8e12] text-[#3ecf8e]">
              {cameraStatus === 'present' ? <CheckCircle2 size={18}/> : cameraStatus === 'unavailable' ? <VideoOff size={18}/> : <Camera size={18}/>} 
            </span>
            <div className="min-w-0 flex-1">
              <strong className="block text-sm font-semibold text-[#e8f5ed]">Camera presence is required</strong>
              <p className="mt-1 text-xs leading-5 text-[#8da096]">Keep one clearly visible face in frame. If you leave for 10 seconds, the interview pauses; after 60 seconds it ends for human review.</p>
            </div>
          </div>
          {cameraStream && <div className="relative mt-3 overflow-hidden rounded-lg border border-[#2b4437]">
            <CameraPreview stream={cameraStream}/>
            <span className={`absolute bottom-2 left-2 rounded-full px-2.5 py-1 text-[10px] font-semibold ${cameraStatus === 'present' ? 'bg-emerald-950/90 text-emerald-300' : 'bg-amber-950/90 text-amber-200'}`}>
              {cameraStatus === 'present' ? 'Face detected' : 'Move fully into frame'}
            </span>
          </div>}
          {cameraError && <p className="mt-3 text-xs leading-5 text-amber-200">{cameraError}</p>}
          {cameraStatus !== 'present' && <Button type="button" variant="outline" disabled={cameraBusy || (requiresConsent && (!consent || !candidateName.trim()))} onClick={() => void onEnableCamera?.()} className="mt-3 h-10 w-full border-[#426c55] bg-[#17251c] text-xs text-[#d9f4e4] hover:bg-[#1d3024]">
            {cameraBusy ? <><Loader2 className="h-4 w-4 animate-spin"/>Checking camera</> : <><Camera size={15}/>{cameraStatus === 'unavailable' ? 'Try camera again' : 'Enable camera'}</>}
          </Button>}
          <a href="mailto:?subject=Request%20an%20alternate%20RoundTable%20interview%20format" className="mt-3 block text-center text-[11px] text-[#7f9588] underline-offset-4 hover:text-[#b8c9bf] hover:underline">Request an alternate interview format</a>
        </div>}

        <Button onClick={onStartConversation} disabled={isLoading || !cameraReady || (requiresConsent && (!consent || !candidateName.trim()))} className="mt-8 h-12 w-full rounded-lg bg-[#3ecf8e] text-sm font-bold text-[#07150f] hover:bg-[#50d99c] disabled:bg-[#285a43]">
          {isLoading ? <><Loader2 className="h-4 w-4 animate-spin"/>Securing voice room</> : <>{interview ? 'Enter interview' : 'Start conversation'}<ArrowRight size={16}/></>}
        </Button>
        {cameraRequired && !cameraReady && <p className="mt-3 text-center text-xs text-[#7d8d84]">Enable the camera and remain in frame to enter.</p>}
        {error && <p className="mt-3 rounded-lg border border-red-900/40 bg-red-950/20 p-3 text-xs text-red-300">{error}</p>}
      </section>
    </div>
  );
}
