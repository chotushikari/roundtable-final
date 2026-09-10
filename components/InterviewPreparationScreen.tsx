'use client';

type InterviewPreparationScreenProps = {
  phase: 'bootstrapping' | 'connecting';
  secondsRemaining?: number;
  roomReady?: boolean;
  onLeave?: () => void;
  overlay?: boolean;
};

export function InterviewPreparationScreen({
  phase,
  secondsRemaining,
  roomReady = false,
  onLeave,
  overlay = false,
}: InterviewPreparationScreenProps) {
  const stillConnecting = phase === 'connecting' && secondsRemaining === 0 && !roomReady;
  const status = roomReady
    ? 'Your room is ready'
    : phase === 'bootstrapping'
      ? 'Preparing your secure voice room'
      : 'Waiting for the AI interview panel';

  return (
    <main className={`${overlay ? 'fixed inset-0 z-50' : 'relative min-h-dvh'} flex items-center justify-center overflow-hidden bg-[#0d0d0d] px-5 text-[#ededed] before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_50%_0%,rgba(62,207,142,.14),transparent_34%),linear-gradient(rgba(255,255,255,.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.018)_1px,transparent_1px)] before:bg-[size:auto,48px_48px,48px_48px]`}>
      <section className="relative z-10 w-full max-w-xl rounded-2xl border border-[#2b3930] bg-[#121513ee] p-6 shadow-[0_28px_100px_rgba(0,0,0,.42)] sm:p-8" aria-live="polite">
        <div className="flex items-center justify-between gap-4"><span className="font-mono text-[10px] font-semibold uppercase tracking-[.16em] text-[#57d592]">RoundTable AI · Interview preparation</span><span className="rounded-full border border-[#355344] bg-[#163123] px-3 py-1 font-mono text-[10px] text-[#81dfac]">{roomReady ? 'Room ready' : secondsRemaining === undefined ? 'Setting up' : `${secondsRemaining}s setup`}</span></div>
        <h1 className="mt-7 text-3xl font-semibold tracking-[-.045em] text-[#f2f2f2]">Take a moment to prepare.</h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-[#9caaa1]">You&apos;ll meet an AI interview panel. It adapts to your answers, and you may pause, ask for a repeat, or interrupt a question naturally.</p>
        <div className="mt-7 grid gap-3">
          {[
            ['AI disclosure', 'You are speaking with an AI panel, not a human interviewer.'],
            ['Voice check', 'Speak normally once the interviewer begins; your microphone is prepared now.'],
            ['How you are assessed', 'Only your interview answers and deliberate workspace checkpoints become evidence.'],
          ].map(([title, detail], index) => <div key={title} className="flex gap-3 rounded-xl border border-[#2a302c] bg-[#171a18] p-3.5"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#1d4a31] font-mono text-[10px] font-bold text-[#8ee8b8]">0{index + 1}</span><div><strong className="block text-xs font-semibold text-[#d9dfdb]">{title}</strong><span className="mt-1 block text-[11px] leading-5 text-[#7f8b84]">{detail}</span></div></div>)}
        </div>
        <div className="mt-7 flex items-center justify-between gap-4 border-t border-[#29312d] pt-5"><span className="flex items-center gap-2 text-xs text-[#a3b4aa]"><i className={`h-2 w-2 rounded-full ${roomReady ? 'bg-[#3ecf8e] shadow-[0_0_0_4px_rgba(62,207,142,.12)]' : 'bg-[#d5a44c]'}`}/>{stillConnecting ? 'Still connecting safely — this is not interview time.' : status}</span>{stillConnecting && onLeave && <button type="button" onClick={onLeave} className="rounded-md border border-[#414a44] px-3 py-2 text-[11px] font-medium text-[#c7cec9] hover:bg-[#202520]">Leave setup</button>}</div>
      </section>
    </main>
  );
}
