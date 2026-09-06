type RoundTableLoadingScreenProps = {
  label?: string;
  sublabel?: string;
  reassurance?: string;
  overlay?: boolean;
};

export function RoundTableLoadingScreen({
  label = 'Preparing your experience',
  sublabel = 'Secure voice session · Powered by Agora',
  reassurance = "Be yourself, don't stress out.",
  overlay = false,
}: RoundTableLoadingScreenProps) {
  return (
    <div className={`roundtable-loading ${overlay ? 'roundtable-loading--overlay' : ''}`} role="status" aria-live="polite">
      <div className="roundtable-loading__brand"><i /> RoundTable AI</div>
      <div className="roundtable-loading__mark" aria-hidden="true"><span /><span /><span /></div>
      <div className="roundtable-loading__copy">
        <strong>{label}</strong>
        {reassurance && <p className="text-xs text-[#3ecf8e] font-medium tracking-wide mt-1">{reassurance}</p>}
        <span>{sublabel}</span>
      </div>
      <div className="roundtable-loading__bar" aria-hidden="true"><i /></div>
    </div>
  );
}
