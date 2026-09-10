'use client';

import { useEffect, useRef, useState } from 'react';
import { PanelAvatar } from './PanelAvatar';

type Bootstrap = { enabled: true; sessionToken: string; iceServers: RTCIceServer[] } | { enabled: false; reason: string };

type Props = {
  sessionId?: string;
  role: string;
  state: string | null;
  audioTrack?: { getMediaStreamTrack: () => MediaStreamTrack };
  interruptionVersion: number;
  warmup?: boolean;
};

export function SimliAvatarStage({ sessionId, role, state, audioTrack, interruptionVersion, warmup = true }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const clientRef = useRef<{ stop: () => Promise<void>; ClearBuffer: () => void } | null>(null);
  const audioTrackRef = useRef<Props['audioTrack']>(undefined);
  const attachedTrackRef = useRef<MediaStreamTrack | null>(null);
  const attachAgentAudioRef = useRef<() => void>(() => {});
  const [status, setStatus] = useState<'idle' | 'connecting' | 'live' | 'fallback'>('idle');
  const [detail, setDetail] = useState('Voice-first interview panel');

  useEffect(() => {
    if (!sessionId || !warmup || !videoRef.current || !audioRef.current) return;
    let cancelled = false;
    setStatus('connecting');
    setDetail('Preparing AI interviewer video…');

    void (async () => {
      try {
        const response = await fetch(`/api/sessions/${sessionId}/avatar/simli`, { method: 'POST' });
        const bootstrap = await response.json() as Bootstrap;
        if (!response.ok || !bootstrap.enabled) throw new Error('reason' in bootstrap ? bootstrap.reason : 'Avatar is unavailable.');

        // simli-client's package root currently has a case-sensitive export
        // defect. Its documented browser implementation is intact at this
        // build-safe entry point; importing it directly keeps Vercel/Linux
        // production builds reliable.
        const { SimliClient, LogLevel } = await import('simli-client/dist/client.js');
        if (cancelled || !videoRef.current || !audioRef.current) return;
        const simli = new SimliClient(bootstrap.sessionToken, videoRef.current, audioRef.current, bootstrap.iceServers, LogLevel.ERROR, 'p2p');
        simli.on('start', () => { if (!cancelled) { setStatus('live'); setDetail('Live AI interviewer video'); } });
        simli.on('error', () => { if (!cancelled) { setStatus('fallback'); setDetail('Voice interview continues without video'); } });
        clientRef.current = simli;
        attachAgentAudioRef.current = () => {
          const track = audioTrackRef.current?.getMediaStreamTrack();
          if (track && attachedTrackRef.current !== track) {
            simli.listenToMediastreamTrack(track);
            attachedTrackRef.current = track;
          }
        };
        // Simli resolves start only after its first rendered video frame. Feed
        // the already-subscribed Agora agent track immediately so an idle
        // frame is not waiting on the very audio that follows start().
        const startPromise = simli.start();
        attachAgentAudioRef.current();
        await startPromise;
      } catch (error) {
        console.warn('[SimliAvatar] visual session unavailable', error);
        if (!cancelled) { setStatus('fallback'); setDetail(error instanceof Error ? error.message : 'Voice interview continues without video'); }
      }
    })();

    return () => {
      cancelled = true;
      const client = clientRef.current;
      clientRef.current = null;
      attachedTrackRef.current = null;
      attachAgentAudioRef.current = () => {};
      if (client) void client.stop().catch(() => {});
    };
  }, [sessionId, warmup]);

  useEffect(() => {
    audioTrackRef.current = audioTrack;
    attachAgentAudioRef.current();
  }, [audioTrack]);

  useEffect(() => {
    if (interruptionVersion > 0) clientRef.current?.ClearBuffer();
  }, [interruptionVersion]);

  const isLive = status === 'live';
  return (
    <section className="relative w-full max-w-4xl shrink-0 overflow-hidden rounded-3xl border border-[#2e4137] bg-[#101513] shadow-[0_30px_90px_rgba(0,0,0,.35)]" aria-label="AI interviewer video stage">
      <div className="flex items-center justify-between border-b border-[#26352e] bg-[#151d19] px-4 py-3">
        <div><p className="font-mono text-[9px] font-semibold uppercase tracking-[.18em] text-[#67d99c]">AI interviewer • disclosed</p><p className="mt-1 text-sm font-semibold text-[#f2f7f4]">{role.replaceAll('_', ' ')} perspective</p></div>
        <span className={`rounded-full border px-3 py-1 font-mono text-[10px] ${isLive ? 'border-[#2d7654] bg-[#143a28] text-[#8bf0bc]' : status === 'connecting' ? 'border-[#785f2c] bg-[#2b2515] text-[#f0ce7a]' : 'border-[#3a403c] bg-[#1b211e] text-[#b8c1bb]'}`}>{isLive ? 'VIDEO LIVE' : status === 'connecting' ? 'VIDEO CONNECTING' : 'VOICE FALLBACK'}</span>
      </div>
      <div className="relative grid min-h-[20rem] place-items-center bg-[radial-gradient(circle_at_50%_20%,rgba(62,207,142,.16),transparent_36%),linear-gradient(145deg,#17241e,#0d100f_65%)] p-5">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onLoadedData={() => { setStatus('live'); setDetail('Live AI interviewer video'); }}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${isLive ? 'opacity-100' : 'opacity-0'}`}
        />
        <audio ref={audioRef} autoPlay muted />
        {!isLive && <div className="relative z-10"><PanelAvatar role={role} state={state} /></div>}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl border border-white/10 bg-[#0a0d0bcc] px-3 py-2 text-xs text-[#c7d1cb] backdrop-blur"><span>{detail}</span><span className="capitalize text-[#76dca4]">{state ?? 'ready'}</span></div>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-[#26352e] px-4 py-3 text-[11px] text-[#9eaaa3]"><span className="rounded-full bg-[#1a2420] px-3 py-1">Shared interview context</span><span className="rounded-full bg-[#1a2420] px-3 py-1">Interruptible voice</span><span className="rounded-full bg-[#1a2420] px-3 py-1">Human decision required</span></div>
    </section>
  );
}
