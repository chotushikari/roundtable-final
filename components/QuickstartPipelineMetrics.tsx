'use client';

export type QuickstartAgentMetric = {
  type: string;
  name: string;
  value: number;
  timestamp: number;
};

type QuickstartPipelineMetricsProps = {
  metrics: QuickstartAgentMetric[];
};

const PIPELINE = [
  { key: 'stt', label: 'Deepgram STT', metricTypes: ['stt', 'asr'] },
  { key: 'llm', label: 'OpenAI LLM', metricTypes: ['llm', 'mllm'] },
  // The selected provider is server-owned (Sarvam when configured, otherwise
  // MiniMax). Do not misrepresent the active voice from a browser-only label.
  { key: 'tts', label: 'Interview TTS', metricTypes: ['tts'] },
] as const;

function formatMetricName(name: string) {
  return name.replace(/[_-]+/g, ' ');
}

export function QuickstartPipelineMetrics({
  metrics,
}: QuickstartPipelineMetricsProps) {
  const latestByType = new Map<string, QuickstartAgentMetric>();
  for (const metric of metrics) {
    latestByType.set(metric.type.toLowerCase(), metric);
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center justify-center gap-2">
      <span className="font-mono text-[9px] font-medium uppercase tracking-wider text-[#666]">
        Voice pipeline
      </span>
      {PIPELINE.map((step, index) => {
        const metric = step.metricTypes
          .map((type) => latestByType.get(type))
          .find(Boolean);

        return (
          <div key={step.key} className="flex items-center gap-2">
            {index > 0 && (
              <span className="text-[9px] text-[#444]" aria-hidden="true">·</span>
            )}
            <span className="rounded-full border border-[#2e2e2e] bg-[#171717] px-2.5 py-1 font-mono text-[9px] font-medium leading-4 text-[#888]">
              {step.label}
              {metric && (
                <span
                  className="ml-2 text-primary"
                  title={new Date(metric.timestamp).toLocaleTimeString()}
                >
                  {formatMetricName(metric.name)} {Math.round(metric.value)}ms
                </span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
