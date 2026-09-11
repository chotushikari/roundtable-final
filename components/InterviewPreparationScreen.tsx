'use client';

type InterviewPreparationScreenProps = {
  phase: 'bootstrapping' | 'connecting';
  secondsRemaining?: number;
  roomReady?: boolean;
  onLeave?: () => void;
  overlay?: boolean;
  candidateName?: string;
  panelRoleCount?: number;
};

/** The single truthful cold-start surface shown before a candidate can speak. */
export function InterviewPreparationScreen({
  phase,
  secondsRemaining,
  roomReady = false,
  onLeave,
  overlay = false,
  candidateName,
  panelRoleCount = 5,
}: InterviewPreparationScreenProps) {
  const seconds = Math.max(0, secondsRemaining ?? 0);
  const stillConnecting = phase === 'connecting' && seconds === 0 && !roomReady;
  const displayName = candidateName?.trim().replace(/\s+/g, ' ');

  return (
    <main className={`${overlay ? 'fixed inset-0 z-50' : 'relative min-h-dvh'} flex items-center justify-center overflow-hidden bg-[#0d0d0d] px-5 text-[#ededed] before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_50%_0%,rgba(62,207,142,.14),transparent_34%),linear-gradient(rgba(255,255,255,.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.018)_1px,transparent_1px)] before:bg-[size:auto,48px_48px,48px_48px]`}>
      <section className="relative z-10 flex w-full max-w-sm flex-col items-center rounded-3xl border border-[#2b3930] bg-[#121513ee] px-6 py-8 text-center shadow-[0_28px_100px_rgba(0,0,0,.42)] sm:px-9" aria-live="polite">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[.18em] text-[#57d592]">RoundTable AI / your panel is preparing</span>
        <div className="mt-7 grid h-36 w-36 place-items-center rounded-full border-[6px] border-[#244534] bg-[radial-gradient(circle_at_50%_35%,rgba(62,207,142,.2),transparent_55%),#101512] shadow-[0_0_0_10px_rgba(62,207,142,.06)]">
          <div>
            <strong className="block font-mono text-5xl font-semibold tracking-[-.08em] text-white">{seconds}</strong>
            <span className="mt-1 block font-mono text-[10px] uppercase tracking-[.18em] text-[#8ab99e]">seconds</span>
          </div>
        </div>
        <p className="mt-7 text-base font-semibold text-[#edf4ef]">{displayName ? `Hello, ${displayName}.` : 'Hello.'} Welcome to RoundTable AI.</p>
        <p className="mt-2 text-sm leading-6 text-[#9caaa1]">You’ll meet {panelRoleCount} panel {panelRoleCount === 1 ? 'perspective' : 'perspectives'} in one shared interview. Take your time and answer naturally—your interviewer will begin when this countdown ends.</p>
        <p className="mt-4 text-xs leading-5 text-[#708178]">You are speaking with an AI panel. Your microphone stays off until the interview begins.</p>
        <div className="mt-6 flex items-center gap-2 text-xs text-[#a3b4aa]">
          <i className={`h-2 w-2 rounded-full ${roomReady ? 'bg-[#3ecf8e] shadow-[0_0_0_4px_rgba(62,207,142,.12)]' : 'bg-[#d5a44c]'}`} />
          {stillConnecting ? 'Panel is still connecting - your time has not started.' : roomReady ? 'Panel connected' : 'Connecting the panel'}
        </div>
        {stillConnecting && onLeave && (
          <button type="button" onClick={onLeave} className="mt-5 rounded-md border border-[#414a44] px-3 py-2 text-[11px] font-medium text-[#c7cec9] hover:bg-[#202520]">
            Leave interview
          </button>
        )}
      </section>
    </main>
  );
}
