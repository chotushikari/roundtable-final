'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Editor from '@monaco-editor/react';
import { ArrowUpRight, Braces, Check, CircleAlert, Copy, LoaderCircle, Network, ShieldCheck, Sparkles, UserRoundSearch } from 'lucide-react';
import type { CompanyInterviewReport, EvidenceRef, PanelRole } from '@/types/interview';

const ExcalidrawBoard = dynamic(() => import('./ExcalidrawBoard').then((module) => module.ExcalidrawBoard), {
  ssr: false,
  loading: () => <div className="grid h-full min-h-[20rem] place-items-center bg-[#171717] text-xs text-[#777]">Loading canvas preview…</div>,
});

type Tab = 'overview' | 'competencies' | 'panel' | 'transcript' | 'workspace';
const tabs: Array<{ id: Tab; label: string }> = [
  { id: 'overview', label: 'Overview' }, { id: 'competencies', label: 'Competencies' },
  { id: 'panel', label: 'Panel views' }, { id: 'transcript', label: 'Transcript' }, { id: 'workspace', label: 'Workspace' },
];
const roleLabel = (role: PanelRole) => role === 'hiring_manager' ? 'Hiring Manager' : role === 'behavioral' ? 'Behavioural' : role[0].toUpperCase() + role.slice(1).replace('_', ' ');
const duration = (seconds: number | null) => seconds === null ? 'Unavailable' : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;

function Evidence({ evidence, onJump }: { evidence: EvidenceRef[]; onJump: (reference: EvidenceRef) => void }) {
  if (!evidence.length) return <p className="mt-3 text-xs text-[#666]">No directly supported evidence.</p>;
  return <div className="mt-3 grid gap-2">{evidence.map((item, index) => <button key={`${item.turnId ?? item.artifactVersionId}-${index}`} onClick={() => onJump(item)} className="group flex w-full items-start gap-2 rounded-lg border border-[#2c2c2c] bg-[#111] p-3 text-left text-xs leading-5 text-[#aaa] transition hover:border-[#3b5f4d] hover:bg-[#151b18]"><ArrowUpRight size={13} className="mt-0.5 shrink-0 text-[#3ecf8e]"/><span>“{item.quote}”</span></button>)}</div>;
}

function InsightList({ items, kind, empty }: { items: string[]; kind: 'positive' | 'growth'; empty: string }) {
  if (!items.length) return <p className="text-sm text-[#696969]">{empty}</p>;
  return <div className="grid gap-2">{items.map((item, index) => <div key={`${item}-${index}`} className="flex gap-3 rounded-lg border border-[#292929] bg-[#111] p-3 text-sm leading-6 text-[#c4c4c4]"><span className={`mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full ${kind === 'positive' ? 'bg-[#3ecf8e18] text-[#3ecf8e]' : 'bg-[#eab75a18] text-[#eab75a]'}`}>{kind === 'positive' ? <Check size={12}/> : <CircleAlert size={12}/>}</span>{item}</div>)}</div>;
}

export function CompanyInterviewReportView({ report, onRelease, releasePending = false }: { report: CompanyInterviewReport; onRelease: () => void; releasePending?: boolean }) {
  const [tab, setTab] = useState<Tab>('overview');
  const [selectedTurnId, setSelectedTurnId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const released = Boolean(report.assessment.candidateFeedbackReleasedAt);
  const observed = report.competencies.filter((item) => item.rating !== null);
  const average = useMemo(() => observed.length ? observed.reduce((sum, item) => sum + (item.rating ?? 0), 0) / observed.length : null, [observed]);
  const jump = (reference: EvidenceRef) => { if (reference.artifactVersionId) { setSelectedTurnId(null); setTab('workspace'); } else { setSelectedTurnId(reference.turnId ?? null); setTab('transcript'); } };

  return <section className="overflow-hidden rounded-2xl border border-[#2b2b2b] bg-[#101010] text-[#ededed] shadow-[0_32px_100px_rgba(0,0,0,.3)]">
    <header className="border-b border-[#292929] bg-[radial-gradient(circle_at_90%_0%,rgba(62,207,142,.08),transparent_35%),#131313] px-6 py-7 lg:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div><span className="font-mono text-[10px] font-semibold tracking-[.14em] text-[#3ecf8e]">COMPLETED INTERVIEW</span><div className="mt-3 flex flex-wrap items-center gap-3"><h2 className="text-3xl font-medium tracking-[-.045em]">{report.candidate.name ?? 'Candidate'} analysis</h2><span className="inline-flex items-center gap-1.5 rounded-full border border-[#594c2d] bg-[#3a2d121f] px-2.5 py-1 text-[10px] font-medium text-[#eacb7a]"><ShieldCheck size={12}/>Human review required</span></div><p className="mt-2 text-sm text-[#858585]">{report.interview.roleTitle} · {report.interview.title}</p></div>
        <button onClick={onRelease} disabled={released || releasePending} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#393939] bg-[#1a1a1a] px-4 text-xs font-semibold text-[#ddd] transition hover:border-[#4a6f5b] hover:bg-[#1b241f] disabled:cursor-default disabled:opacity-50">{releasePending ? <><LoaderCircle size={14} className="animate-spin"/>Releasing…</> : released ? <><Check size={14}/>Summary released</> : 'Release candidate summary'}</button>
      </div>
      <div className="mt-7 grid grid-cols-2 gap-2 md:grid-cols-4">
        <div className="rounded-xl border border-[#292929] bg-[#161616] p-4"><span className="text-[10px] text-[#717171]">EVIDENCE SCORE</span><strong className="mt-2 block text-2xl font-medium">{average === null ? 'N/A' : `${average.toFixed(1)}/4`}</strong></div>
        <div className="rounded-xl border border-[#292929] bg-[#161616] p-4"><span className="text-[10px] text-[#717171]">OBSERVED</span><strong className="mt-2 block text-2xl font-medium">{report.coverage.covered.length}<small className="text-sm text-[#606060]"> / {report.competencies.length}</small></strong></div>
        <div className="rounded-xl border border-[#292929] bg-[#161616] p-4"><span className="text-[10px] text-[#717171]">PANEL SIGNALS</span><strong className="mt-2 block text-2xl font-medium">{report.coverage.rolesWithEvidence.length}<small className="text-sm text-[#606060]"> / {report.interview.panelRoles.length}</small></strong></div>
        <div className="rounded-xl border border-[#292929] bg-[#161616] p-4"><span className="text-[10px] text-[#717171]">DURATION</span><strong className="mt-2 block text-2xl font-medium">{duration(report.session.durationSeconds)}</strong></div>
      </div>
    </header>

    <nav className="flex gap-1 overflow-x-auto border-b border-[#292929] bg-[#121212] px-4 py-3 lg:px-7" aria-label="Report sections">{tabs.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={`whitespace-nowrap rounded-md px-3 py-2 text-xs font-medium transition ${tab === item.id ? 'bg-[#3ecf8e] text-[#07150f]' : 'text-[#7e7e7e] hover:bg-[#1d1d1d] hover:text-[#ddd]'}`}>{item.label}</button>)}</nav>

    <div className="p-5 lg:p-8">
      {tab === 'overview' && <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <div className="grid gap-5"><article className="rounded-xl border border-[#2a2a2a] bg-[#151515] p-5"><div className="flex items-center gap-2 text-sm font-semibold"><Sparkles size={16} className="text-[#3ecf8e]"/>Evidence summary</div><p className="mt-4 text-[15px] leading-7 text-[#c2c2c2]">{report.summary.overallSummary}</p><p className="mt-4 border-t border-[#292929] pt-4 text-[10px] text-[#666]">Generated from supported transcript and workspace evidence. This is not a hiring decision.</p></article><div className="grid gap-5 md:grid-cols-2"><article><h3 className="mb-3 text-sm font-semibold">Supported strengths</h3><InsightList items={report.summary.strengths} kind="positive" empty="No strength had enough supporting evidence."/></article><article><h3 className="mb-3 text-sm font-semibold">Growth areas</h3><InsightList items={report.summary.growthAreas} kind="growth" empty="No growth area was identified."/></article></div></div>
        <aside className="grid content-start gap-5"><article className="rounded-xl border border-[#2a2a2a] bg-[#151515] p-5"><h3 className="flex items-center gap-2 text-sm font-semibold"><UserRoundSearch size={16} className="text-[#3ecf8e]"/>Recommended follow-ups</h3><div className="mt-4 grid gap-3">{report.summary.suggestedHumanFollowUps.length ? report.summary.suggestedHumanFollowUps.map((item, index) => <div key={item} className="flex gap-3 text-sm leading-6 text-[#aaa]"><span className="font-mono text-[10px] text-[#3ecf8e]">0{index + 1}</span>{item}</div>) : <p className="text-xs text-[#666]">No additional follow-up suggested.</p>}</div></article><article className="rounded-xl border border-[#2a2a2a] bg-[#151515] p-5"><h3 className="text-sm font-semibold">Session integrity</h3><dl className="mt-4 grid gap-3 text-xs"><div className="flex justify-between"><dt className="text-[#707070]">Connection</dt><dd className="capitalize text-[#3ecf8e]">{report.session.connectionHealth}</dd></div><div className="flex justify-between"><dt className="text-[#707070]">Transcript turns</dt><dd>{report.transcript.length}</dd></div><div className="flex justify-between"><dt className="text-[#707070]">Assessment model</dt><dd className="max-w-48 truncate text-[#aaa]">{report.assessment.model}</dd></div></dl></article></aside>
      </div>}

      {tab === 'competencies' && <div className="grid gap-4 lg:grid-cols-2">{report.competencies.map((item) => { const percent = item.rating === null ? 0 : item.rating / 4 * 100; return <article key={item.id} className="rounded-xl border border-[#2b2b2b] bg-[#151515] p-5"><div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold">{item.name}</h3><p className="mt-1 text-[10px] text-[#707070]">Confidence {Math.round(item.confidence * 100)}%</p></div><span className="font-mono text-sm text-[#3ecf8e]">{item.rating === null ? 'Not observed' : `${item.rating} / 4`}</span></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#252525]"><i className="block h-full rounded-full bg-[#3ecf8e]" style={{ width: `${percent}%` }}/></div><p className="mt-4 text-sm leading-6 text-[#b9b9b9]">{item.summary}</p>{item.gaps.length > 0 && <p className="mt-3 text-xs leading-5 text-[#8d7955]">Gap: {item.gaps.join(' · ')}</p>}<Evidence evidence={item.evidence} onJump={jump}/></article>; })}</div>}

      {tab === 'panel' && <div className="grid gap-4 lg:grid-cols-2">{report.roleViews.map((view, index) => <article key={view.role} className="rounded-xl border border-[#2b2b2b] bg-[#151515] p-5"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg border border-[#345443] bg-[#3ecf8e12] font-mono text-[10px] text-[#3ecf8e]">0{index + 1}</span><div><h3 className="font-semibold">{roleLabel(view.role)}</h3><p className="text-[10px] text-[#666]">Panel perspective</p></div></div><p className="mt-4 text-sm leading-6 text-[#b9b9b9]">{view.summary}</p><Evidence evidence={view.evidence} onJump={jump}/></article>)}</div>}

      {tab === 'transcript' && <div className="mx-auto grid max-w-4xl gap-3">{report.transcript.map((turn) => <article id={`turn-${turn.id}`} key={turn.id} className={`rounded-xl border p-4 transition ${selectedTurnId === turn.id ? 'border-[#3ecf8e] bg-[#173326]' : 'border-[#292929] bg-[#151515]'}`}><div className="flex items-center justify-between gap-3"><span className={`text-xs font-semibold ${turn.speaker === 'candidate' ? 'text-[#dcdcdc]' : 'text-[#3ecf8e]'}`}>{turn.speaker === 'candidate' ? report.candidate.name ?? 'Candidate' : roleLabel(turn.speakerRole ?? 'technical')}</span><span className="font-mono text-[9px] text-[#666]">TURN {turn.sequence} · {turn.status.toUpperCase()}</span></div><p className="mt-3 text-sm leading-6 text-[#bdbdbd]">{turn.text}</p>{turn.evidenceReferences.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{turn.evidenceReferences.map((ref) => <span key={ref} className="rounded-full border border-[#355542] bg-[#3ecf8e0d] px-2 py-1 text-[9px] text-[#58d99d]">{ref}</span>)}</div>}</article>)}</div>}

      {tab === 'workspace' && (
        <div className="grid gap-6">
          {/* Top metadata summary cards */}
          <div className="grid gap-5 lg:grid-cols-2">
            <article className="rounded-xl border border-[#2b2b2b] bg-[#151515] p-6">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#3ecf8e12] text-[#3ecf8e]">
                  <Braces size={19}/>
                </span>
                <span className="rounded-full bg-[#202020] px-2 py-1 text-[9px] text-[#777]">
                  SAVED CODE EVIDENCE
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold">Code workspace</h3>
              {report.workspace.code.available ? (
                <>
                  <p className="mt-2 text-xs leading-5 text-[#777]">
                    The candidate&apos;s autosaved workspace was retained with immutable version history and included in assessment evidence when checkpointed or completed.
                  </p>
                  <dl className="mt-5 grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-lg bg-[#111] p-3">
                      <dt className="text-[#666]">Language</dt>
                      <dd className="mt-1.5 capitalize">{report.workspace.code.language ?? 'Unspecified'}</dd>
                    </div>
                    <div className="rounded-lg bg-[#111] p-3">
                      <dt className="text-[#666]">Saved version</dt>
                      <dd className="mt-1.5">v{report.workspace.code.version ?? '—'}</dd>
                    </div>
                    <div className="rounded-lg bg-[#111] p-3">
                      <dt className="text-[#666]">Non-empty lines</dt>
                      <dd className="mt-1.5">{report.workspace.code.nonEmptyLines}</dd>
                    </div>
                    <div className="rounded-lg bg-[#111] p-3">
                      <dt className="text-[#666]">Detected functions</dt>
                      <dd className="mt-1.5 text-[#3ecf8e]">{report.workspace.code.functions.join(', ') || 'None detected'}</dd>
                    </div>
                  </dl>
                </>
              ) : (
                <p className="mt-4 text-sm text-[#666]">No saved code workspace artifact.</p>
              )}
            </article>

            <article className="rounded-xl border border-[#2b2b2b] bg-[#151515] p-6">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#3ecf8e12] text-[#3ecf8e]">
                  <Network size={19}/>
                </span>
                <span className="rounded-full bg-[#202020] px-2 py-1 text-[9px] text-[#777]">
                  SAVED CANVAS EVIDENCE
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold">Design canvas</h3>
              {report.workspace.canvas.available ? (
                <dl className="mt-5 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg bg-[#111] p-3">
                    <dt className="text-[#666]">Elements</dt>
                    <dd className="mt-1.5">{report.workspace.canvas.elementCount}</dd>
                  </div>
                  <div className="rounded-lg bg-[#111] p-3">
                    <dt className="text-[#666]">Arrows</dt>
                    <dd className="mt-1.5">{report.workspace.canvas.arrowCount}</dd>
                  </div>
                  <div className="col-span-2 rounded-lg bg-[#111] p-3">
                    <dt className="text-[#666]">Detected labels</dt>
                    <dd className="mt-1.5 text-[#3ecf8e]">{report.workspace.canvas.labels.join(', ') || 'None detected'}</dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-4 text-sm text-[#666]">No saved canvas artifact.</p>
              )}
            </article>
          </div>

          {/* Actual Code and Canvas Visual Viewers */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Monaco Code Viewer */}
            <div className="flex flex-col overflow-hidden rounded-xl border border-[#2b2b2b] bg-[#141414] shadow-[0_12px_36px_rgba(0,0,0,0.3)]">
              <div className="flex items-center justify-between border-b border-[#262626] bg-[#181818] px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#3ecf8e]">
                    Submitted Code
                  </span>
                  {report.workspace.code.language && (
                    <span className="rounded bg-[#242424] px-2 py-0.5 font-mono text-[10px] text-[#a8a8a8] capitalize">
                      {report.workspace.code.language}
                    </span>
                  )}
                  {report.workspace.code.version && (
                    <span className="rounded bg-[#222] px-1.5 py-0.5 font-mono text-[10px] text-[#777]">
                      v{report.workspace.code.version}
                    </span>
                  )}
                </div>
                {report.workspace.code.source && (
                  <button
                    type="button"
                    onClick={() => {
                      if (report.workspace.code.source) {
                        navigator.clipboard.writeText(report.workspace.code.source);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      }
                    }}
                    className="flex items-center gap-1.5 rounded bg-[#222] px-2.5 py-1 text-[11px] font-medium text-[#ccc] hover:bg-[#2c2c2c] hover:text-white transition"
                  >
                    {copiedCode ? <Check size={12} className="text-[#3ecf8e]" /> : <Copy size={12} />}
                    {copiedCode ? 'Copied' : 'Copy code'}
                  </button>
                )}
              </div>
              <div className="h-[380px] w-full bg-[#1e1e1e]">
                {report.workspace.code.source ? (
                  <Editor
                    height="100%"
                    language={report.workspace.code.language ?? 'typescript'}
                    theme="vs-dark"
                    value={report.workspace.code.source}
                    options={{
                      readOnly: true,
                      automaticLayout: true,
                      minimap: { enabled: false },
                      fontSize: 13,
                      scrollBeyondLastLine: false,
                    }}
                  />
                ) : (
                  <div className="grid h-full place-items-center text-xs text-[#666]">
                    No code was written or checkpointed during this session.
                  </div>
                )}
              </div>
            </div>

            {/* Excalidraw Architecture Canvas Viewer */}
            <div className="flex flex-col overflow-hidden rounded-xl border border-[#2b2b2b] bg-[#141414] shadow-[0_12px_36px_rgba(0,0,0,0.3)]">
              <div className="flex items-center justify-between border-b border-[#262626] bg-[#181818] px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#3ecf8e]">
                    Architecture Diagram
                  </span>
                  {report.workspace.canvas.version && (
                    <span className="rounded bg-[#242424] px-1.5 py-0.5 font-mono text-[10px] text-[#777]">
                      v{report.workspace.canvas.version}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-[#777]">
                  {report.workspace.canvas.elementCount} elements · {report.workspace.canvas.arrowCount} arrows
                </span>
              </div>
              <div className="h-[380px] w-full overflow-hidden bg-[#f8fafc]">
                {report.workspace.canvas.available && report.workspace.canvas.elements && report.workspace.canvas.elements.length > 0 ? (
                  <ExcalidrawBoard
                    elements={report.workspace.canvas.elements}
                    disabled={true}
                    onChange={() => {}}
                  />
                ) : (
                  <div className="grid h-full place-items-center bg-[#171717] text-xs text-[#666]">
                    No architecture whiteboard diagram was submitted.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  </section>;
}
