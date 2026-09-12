'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient, type Session } from '@supabase/supabase-js';
import {
  Activity, ArrowLeft, ArrowRight, Briefcase, BriefcaseBusiness, Check,
  CalendarDays, CheckCircle2, ChevronRight, Clipboard, Clock3, FileText,
  Link2, LoaderCircle, LogOut, Mail, MapPin, Plus, ShieldCheck,
  Sparkles, Tag, Upload, WandSparkles, X,
} from 'lucide-react';
import { DEMO_DURATION_MINUTES, DEMO_ROLES } from '@/lib/interview-demo';
import type { PanelRole } from '@/types/interview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import styles from './CompanyDashboard.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

type Job = {
  id: string; title: string; employmentType: string; locationLabel: string | null;
  status: string; createdAt: string; jdText: string; hiringBar: Record<string, unknown>;
};
type Competency = { id: string; competencyKey: string; name: string; description: string; weight: number; required: boolean };
type Interview = {
  id: string; title: string; roleTitle: string; status: string; createdAt: string;
  jobId?: string | null; panelRoles?: PanelRole[]; durationMinutes?: number; demoMode?: boolean;
};
type SessionSummary = {
  id: string; status: string; health: string; startedAt: string; completedAt: string | null; interviewId: string;
  jobCandidateId?: string | null; candidateName?: string | null;
  endReason?: 'camera_absence' | null;
};
type Candidate = { id: string; fullName: string | null; email: string | null };
type JobCandidate = { id: string; candidateId: string; stage: string; createdAt: string; candidate: Candidate };
type HumanDecision = { id: string; decision: 'advance' | 'hold' | 'decline' | 'needs_review'; rationale: string; decidedAt: string };
type InvitationSchedule = { startsAt: string };

const employmentLabels: Record<string, string> = {
  full_time: 'Full-time', part_time: 'Part-time', internship: 'Internship',
  contract: 'Contract', temporary: 'Temporary',
};
const stageColors: Record<string, string> = {
  draft: 'stage_draft', invited: 'stage_invited', in_progress: 'stage_active',
  completed: 'stage_done', review: 'stage_review', withdrawn: 'stage_grey', archived: 'stage_grey',
};
const roleNames: Record<string, string> = {
  hiring_manager: 'Hiring Manager', technical: 'Technical', product: 'Product Manager',
  customer: 'Customer', behavioral: 'Behavioural',
};
const roleDescriptions: Record<PanelRole, string> = {
  hiring_manager: 'role fit and ownership',
  technical: 'implementation and trade-offs',
  product: 'customer value and priorities',
  customer: 'adoption and support reality',
  behavioral: 'collaboration and learning',
};
const interviewTemplates = {
  backend: {
    label: 'Backend engineering',
    title: 'Backend Engineer',
    context: 'Build reliable backend services. Assess API design, data modelling, caching, observability, trade-offs, and how engineering decisions affect customers.',
    outcomes: ['System design', 'API design', 'Caching and performance', 'Customer impact'],
  },
  frontend: {
    label: 'Frontend engineering',
    title: 'Frontend Engineer',
    context: 'Build accessible, reliable product interfaces. Assess component design, state management, performance, quality, and user impact.',
    outcomes: ['Frontend architecture', 'Accessibility', 'Performance', 'Product judgement'],
  },
  product: {
    label: 'Product management',
    title: 'Product Manager',
    context: 'Own product discovery and delivery. Assess customer problem framing, prioritisation, metrics, collaboration, and decision trade-offs.',
    outcomes: ['Customer discovery', 'Prioritisation', 'Metrics', 'Cross-functional leadership'],
  },
} as const;
const focusOptions = ['System design', 'Caching & performance', 'Customer impact', 'Ownership', 'API design', 'Data modelling'];

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character);
}

function localDateTimeValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function googleCalendarDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function GoogleMark() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.googleMark}><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z"/><path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.42l-3.24-2.54c-.9.6-2.05.96-3.38.96-2.6 0-4.81-1.76-5.6-4.13H3.06v2.62A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 13.87A6 6 0 0 1 6.1 12c0-.65.11-1.28.3-1.87V7.51H3.06A10 10 0 0 0 2 12c0 1.61.39 3.14 1.06 4.49l3.34-2.62Z"/><path fill="#EA4335" d="M12 6c1.47 0 2.78.5 3.82 1.49l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.94 5.51l3.34 2.62C7.19 7.76 9.4 6 12 6Z"/></svg>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CompanyDashboard() {
  const router = useRouter();
  const companyAuthDisabled = process.env.NEXT_PUBLIC_DISABLE_COMPANY_AUTH === 'true';
  const supabase = useMemo(() => {
    if (companyAuthDisabled || process.env.NEXT_PUBLIC_DEMO_MODE === 'true') return null;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    return url && key ? createClient(url, key) : null;
  }, [companyAuthDisabled]);

  const [authReady, setAuthReady] = useState(!supabase);
  const [session, setSession] = useState<Session | null>(null);
  const [googleDeliveryToken, setGoogleDeliveryToken] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  // ── Jobs state ──────────────────────────────────────────────────────────────
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const selectedJob = jobs.find((j) => j.id === selectedJobId) ?? null;

  // ── Per-job data ─────────────────────────────────────────────────────────────
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [jobCandidates, setJobCandidates] = useState<JobCandidate[]>([]);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [decisionHistory, setDecisionHistory] = useState<Record<string, HumanDecision[]>>({});
  const [decisionRationales, setDecisionRationales] = useState<Record<string, string>>({});

  // ── Active tab inside job detail ─────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'competencies' | 'blueprint' | 'candidates' | 'pipeline'>('candidates');

  // ── Create job form ──────────────────────────────────────────────────────────
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [jobEmploymentType, setJobEmploymentType] = useState('full_time');
  const [jobLocation, setJobLocation] = useState('');
  const [jobJd, setJobJd] = useState('');

  // ── Add competency form ──────────────────────────────────────────────────────
  const [compName, setCompName] = useState('');
  const [compKey, setCompKey] = useState('');
  const [compWeight, setCompWeight] = useState('10');
  const [compDesc, setCompDesc] = useState('');

  // ── Blueprint (interview) form ───────────────────────────────────────────────
  const [roleTitle, setRoleTitle] = useState('Software Engineer Intern (0 years experience)');
  const [jdText, setJdText] = useState('Entry-level internship with no professional experience required. Use Python, JavaScript, or TypeScript. Assess basic problem solving, simple functions, a small to-do app design, communication, and willingness to learn. Accept class assignments and personal projects. Keep questions beginner-friendly; do not require distributed systems or production experience.');
  const [outcomes, setOutcomes] = useState('Write a simple function and explain an edge case\nDraw a simple app with a client, server, and database\nExplain how the app helps a user\nCommunicate clearly and learn from feedback');
  const [mustAsk, setMustAsk] = useState('');
  const [interviewMode, setInterviewMode] = useState<'showcase' | 'adaptive'>('showcase');
  const [panelRoles, setPanelRoles] = useState<PanelRole[]>([...DEMO_ROLES]);
  const [durationMinutes, setDurationMinutes] = useState(DEMO_DURATION_MINUTES);
  const [seniority, setSeniority] = useState('intern');
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>(['System design', 'Customer impact']);

  // ── Add candidate form ───────────────────────────────────────────────────────
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');

  // ── Invitation / resume per-candidate ───────────────────────────────────────
  const [inviteLinks, setInviteLinks] = useState<Record<string, string>>({});
  const [resumeTexts, setResumeTexts] = useState<Record<string, string>>({});
  const [resumeNames, setResumeNames] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [defaultInvitationStart] = useState(() => localDateTimeValue(new Date(Date.now() + 86_400_000)));
  const [invitationSchedules, setInvitationSchedules] = useState<Record<string, InvitationSchedule>>({});

  // ── UI feedback ──────────────────────────────────────────────────────────────
  const [message, setMessage] = useState('');
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const accessToken = session?.access_token;
  const authHeaders: Record<string, string> = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

  // ─── Auth ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!supabase) return;
    const cachedProviderToken = window.sessionStorage.getItem('roundtable.googleDeliveryToken');
    if (cachedProviderToken) setGoogleDeliveryToken(cachedProviderToken);
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.provider_token) {
        window.sessionStorage.setItem('roundtable.googleDeliveryToken', data.session.provider_token);
        setGoogleDeliveryToken(data.session.provider_token);
      }
      setAuthReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (next?.provider_token) {
        window.sessionStorage.setItem('roundtable.googleDeliveryToken', next.provider_token);
        setGoogleDeliveryToken(next.provider_token);
      } else if (event === 'SIGNED_OUT') {
        window.sessionStorage.removeItem('roundtable.googleDeliveryToken');
        setGoogleDeliveryToken(null);
      }
      setAuthReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  // --- Load jobs
  const loadJobs = useCallback(async () => {
    try {
      const headers: Record<string, string> = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const res = await fetch('/api/jobs', { headers });
      const data = await res.json() as { jobs: Job[]; organizationId: string };
      if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Could not load jobs');
      const nextJobs = data.jobs ?? [];
      setJobs(nextJobs);
      setSelectedJobId((current) => current && nextJobs.some((job) => job.id === current) ? current : nextJobs[0]?.id ?? null);
      setOrganizationId(data.organizationId);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not load jobs'); }
  }, [accessToken]);

  useEffect(() => {
    if (authReady && (session || !supabase)) void loadJobs();
  }, [authReady, session, supabase, loadJobs]);


  // ─── Load job detail ────────────────────────────────────────────────────────
  const loadJobDetail = useCallback(async (jobId: string | null) => {
    if (!jobId) return;
    const headers: Record<string, string> = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
    try {
      const [compRes, candRes, intRes] = await Promise.all([
        fetch(`/api/jobs/${jobId}/competencies`, { headers }),
        fetch(`/api/jobs/${jobId}/candidates`, { headers }),
        fetch('/api/interviews', { headers }),
      ]);
      const [compData, candData, intData] = await Promise.all([compRes.json(), candRes.json(), intRes.json()]);
      if (compRes.ok) setCompetencies((compData as { competencies: Competency[] }).competencies ?? []);
      if (candRes.ok) {
        const candidates = (candData as { candidates: JobCandidate[] }).candidates ?? [];
        setJobCandidates(candidates);
        const histories = await Promise.all(candidates.map(async (candidate) => {
          const response = await fetch(`/api/jobs/${jobId}/candidates/${candidate.id}/decisions`, { headers });
          const data = await response.json() as { decisions?: HumanDecision[] };
          return [candidate.id, response.ok ? data.decisions ?? [] : []] as const;
        }));
        setDecisionHistory(Object.fromEntries(histories));
      }
      if (intRes.ok) {
        const allInterviews = (intData as { interviews: Interview[] }).interviews ?? [];
        setInterviews(allInterviews.filter((i) => i.jobId === jobId));
        // Load sessions for each scoped interview
        const lists = await Promise.all(
          allInterviews.filter((i) => i.jobId === jobId).map(async (item) => {
            const r = await fetch(`/api/interviews/${item.id}/sessions`, { headers });
            const b = await r.json() as { sessions?: Omit<SessionSummary, 'interviewId'>[] };
            return r.ok ? (b.sessions ?? []).map((e) => ({ ...e, interviewId: item.id })) : [];
          }),
        );
        setSessions(lists.flat());
      }
    } catch { /* non-fatal */ }
  }, [accessToken]);

  // ─── Realtime for org channel ───────────────────────────────────────────────
  useEffect(() => {
    if (!supabase || !session || !organizationId) return;
    const channel = supabase.channel(`organization:${organizationId}:status`, { config: { private: true } })
      .on('broadcast', { event: '*' }, () => void loadJobDetail(selectedJobId))
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [supabase, session, organizationId, selectedJobId, loadJobDetail]);

  useEffect(() => { void loadJobDetail(selectedJobId); }, [selectedJobId, loadJobDetail]);

  // ─── Live session polling ───────────────────────────────────────────────────
  useEffect(() => {
    const hasLive = sessions.some((s) => ['ready', 'starting', 'active', 'in_progress', 'assessing'].includes(s.status));
    if (!hasLive) return;
    const id = window.setInterval(() => void loadJobDetail(selectedJobId), 10_000);
    return () => window.clearInterval(id);
  }, [sessions, selectedJobId, loadJobDetail]);

  // ─── Actions ────────────────────────────────────────────────────────────────

  async function googleSignIn() {
    if (!supabase) return;
    setPendingAction('google'); setMessage('Opening Google sign in…');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/company` },
    });
    if (error) { setMessage(error.message); setPendingAction(null); }
  }

  async function connectGoogleDelivery() {
    if (!supabase) return;
    setPendingAction('google-delivery'); setMessage('Requesting Google delivery permission…');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/company`,
        scopes: 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/calendar.events',
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    if (error) { setMessage(error.message); setPendingAction(null); }
  }

  async function signOut() {
    if (!supabase) return;
    setPendingAction('signout');
    const { error } = await supabase.auth.signOut();
    if (error) setMessage(error.message);
    setPendingAction(null);
  }

  async function createJob() {
    if (!jobTitle.trim()) return;
    setPendingAction('createJob');
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ title: jobTitle.trim(), employmentType: jobEmploymentType, locationLabel: jobLocation.trim() || undefined, jdText: jobJd.trim() }),
      });
      const data = await res.json() as { job: Job; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Could not create job');
      setJobs((prev) => [data.job, ...prev]);
      setSelectedJobId(data.job.id);
      setShowCreateJob(false);
      setJobTitle(''); setJobJd(''); setJobLocation('');
      setActiveTab('blueprint');
      setMessage(`"${data.job.title}" created. Now set up your interview blueprint.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not create job'); }
    finally { setPendingAction(null); }
  }

  async function addCompetency() {
    if (!selectedJobId || !compName.trim()) return;
    const key = compKey.trim() || compName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^([^a-z])/, 'c$1').slice(0, 64);
    setPendingAction('addComp');
    try {
      const res = await fetch(`/api/jobs/${selectedJobId}/competencies`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ competencyKey: key, name: compName.trim(), description: compDesc.trim(), weight: Number(compWeight) || 10 }),
      });
      const data = await res.json() as { competency: Competency; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Could not save competency');
      setCompetencies((prev) => {
        const next = prev.filter((c) => c.id !== data.competency.id);
        return [data.competency, ...next].sort((a, b) => b.weight - a.weight);
      });
      setCompName(''); setCompKey(''); setCompWeight('10'); setCompDesc('');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not save competency'); }
    finally { setPendingAction(null); }
  }

  async function deleteCompetency(id: string) {
    if (!selectedJobId) return;
    setPendingAction(`delComp:${id}`);
    try {
      const res = await fetch(`/api/jobs/${selectedJobId}/competencies`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Could not delete competency');
      setCompetencies((prev) => prev.filter((c) => c.id !== id));
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not delete competency'); }
    finally { setPendingAction(null); }
  }

  async function createBlueprint() {
    if (!selectedJobId) return;
    const isShowcase = interviewMode === 'showcase';
    const selectedRoles = isShowcase ? DEMO_ROLES : panelRoles;
    const selectedDuration = isShowcase ? DEMO_DURATION_MINUTES : durationMinutes;
    if (selectedRoles.length < 2) {
      setMessage('Choose at least two panel perspectives for an adaptive interview.');
      return;
    }
    setPendingAction('createBp'); setMessage(`Generating ${isShowcase ? 'five-perspective showcase' : 'adaptive'} interview plan…`);
    try {
      const res = await fetch('/api/interviews', {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          title: `${roleTitle.trim()} ${isShowcase ? 'Showcase' : 'Adaptive'} Interview`.slice(0, 120), roleTitle, jdText,
          desiredOutcomes: [...new Set([...outcomes.split('\n').map((s) => s.trim()).filter(Boolean), ...selectedFocusAreas])],
          mustAskQuestions: mustAsk.split('\n').map((s) => s.trim()).filter(Boolean),
          panelRoles: selectedRoles, durationMinutes: selectedDuration, demoMode: isShowcase,
          instructions: `Seniority expectation: ${seniority}. Keep questions calibrated to this level while assessing only role-relevant evidence.`,
          jobId: selectedJobId,
        }),
      });
      const data = await res.json() as { interview: Interview; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Could not create blueprint');
      const plan = await fetch(`/api/interviews/${data.interview.id}/plan`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders }, body: '{}',
      });
      const planData = await plan.json() as { error?: string };
      if (!plan.ok) throw new Error(planData.error ?? 'Could not generate plan');
      setMessage('Blueprint ready. Add candidates, then generate invite links.');
      setInterviews((prev) => [data.interview, ...prev]);
      setActiveTab('candidates');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not create blueprint'); }
    finally { setPendingAction(null); }
  }

  function chooseInterviewMode(mode: 'showcase' | 'adaptive') {
    setInterviewMode(mode);
    if (mode === 'showcase') {
      setPanelRoles([...DEMO_ROLES]);
      setDurationMinutes(DEMO_DURATION_MINUTES);
    } else if (durationMinutes === DEMO_DURATION_MINUTES) {
      setDurationMinutes(30);
    }
  }

  function togglePanelRole(role: PanelRole) {
    if (interviewMode === 'showcase') return;
    setPanelRoles((current) => {
      if (current.includes(role)) return current.length > 2 ? current.filter((item) => item !== role) : current;
      return [...current, role];
    });
  }

  function applyTemplate(templateKey: keyof typeof interviewTemplates) {
    const template = interviewTemplates[templateKey];
    setRoleTitle(template.title);
    setJdText(template.context);
    setOutcomes(template.outcomes.join('\n'));
    setSelectedFocusAreas([...template.outcomes]);
    setMessage(`${template.label} template applied. Review the context, then generate the blueprint.`);
  }

  function toggleFocusArea(focusArea: string) {
    setSelectedFocusAreas((current) => current.includes(focusArea)
      ? current.filter((item) => item !== focusArea)
      : [...current, focusArea]);
  }

  async function addCandidate() {
    if (!selectedJobId || (!candidateName.trim() && !candidateEmail.trim())) return;
    setPendingAction('addCand');
    try {
      const res = await fetch(`/api/jobs/${selectedJobId}/candidates`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ fullName: candidateName.trim() || undefined, email: candidateEmail.trim() || undefined }),
      });
      const data = await res.json() as { candidate: Candidate; jobCandidate: JobCandidate; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Could not add candidate');
      setJobCandidates((prev) => {
        const next = prev.filter((jc) => jc.id !== data.jobCandidate.id);
        return [{ ...data.jobCandidate, candidate: data.candidate }, ...next];
      });
      setCandidateName(''); setCandidateEmail('');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not add candidate'); }
    finally { setPendingAction(null); }
  }

  async function recordHumanDecision(jobCandidateId: string, decision: HumanDecision['decision']) {
    if (!selectedJobId) return;
    const rationale = decisionRationales[jobCandidateId]?.trim() ?? '';
    if (rationale.length < 3) {
      setMessage('Add a short human rationale before recording a decision.');
      return;
    }
    setPendingAction(`decision:${jobCandidateId}`);
    try {
      const response = await fetch(`/api/jobs/${selectedJobId}/candidates/${jobCandidateId}/decisions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ decision, rationale }),
      });
      const data = await response.json() as { decision?: HumanDecision; error?: string };
      if (!response.ok || !data.decision) throw new Error(data.error ?? 'Could not record human decision');
      setDecisionHistory((previous) => ({
        ...previous,
        [jobCandidateId]: [data.decision!, ...(previous[jobCandidateId] ?? [])],
      }));
      setDecisionRationales((previous) => ({ ...previous, [jobCandidateId]: '' }));
      setMessage('Human decision recorded. AI assessment remains advisory.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not record human decision'); }
    finally { setPendingAction(null); }
  }

  async function readResume(jcId: string, file?: File) {
    if (!file) return;
    if (file.size > 120_000) { setMessage('Resume is too large. Use a TXT or Markdown file under 120 KB.'); return; }
    setPendingAction(`resume:${jcId}`);
    const text = await file.text();
    setResumeTexts((prev) => ({ ...prev, [jcId]: text.slice(0, 30_000) }));
    setResumeNames((prev) => ({ ...prev, [jcId]: file.name }));
    setPendingAction(null);
  }

  async function generateInvite(jcId: string, candidateData: Candidate) {
    if (!selectedJobId || interviews.length === 0) {
      setMessage('Create a blueprint first before generating an invitation link.');
      setActiveTab('blueprint');
      return;
    }
    const blueprint = interviews[0]; // use latest blueprint for this job
    setPendingAction(`invite:${jcId}`);
    try {
      const res = await fetch(`/api/interviews/${blueprint.id}/publish`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          candidateName: candidateData.fullName ?? undefined,
          candidateEmail: candidateData.email ?? undefined,
          resumeText: resumeTexts[jcId] ?? undefined,
          jobCandidateId: jcId,
        }),
      });
      const data = await res.json() as { invitationUrl?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Could not generate invitation');
      setInviteLinks((prev) => ({ ...prev, [jcId]: data.invitationUrl! }));
      // advance stage to 'invited'
      await fetch(`/api/jobs/${selectedJobId}/candidates/${jcId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ stage: 'invited' }),
      });
      setJobCandidates((prev) => prev.map((jc) => jc.id === jcId ? { ...jc, stage: 'invited' } : jc));
      setMessage('Invitation ready. Use Copy link to share it.');
      setActiveTab('pipeline');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not generate invitation'); }
    finally { setPendingAction(null); }
  }

  async function copyLink(id: string) {
    const url = inviteLinks[id];
    if (!url) return;
    setPendingAction(`copy:${id}`);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setMessage('Link copied to clipboard.');
      window.setTimeout(() => setCopiedId(null), 2200);
    } catch { setMessage('Clipboard blocked. Select and copy manually.'); }
    finally { setPendingAction(null); }
  }

  function invitationMessage(candidateData: Candidate, link: string) {
    const candidateName = candidateData.fullName?.trim() || 'there';
    const recruiterName = String(profileName).trim() || 'the RoundTable team';
    const role = selectedJob?.title || interviews[0]?.roleTitle || 'the role';
    const mode = interviews[0]?.demoMode ? 'a focused 10-minute, five-perspective interview' : 'an adaptive interview panel';
    const subject = `Invitation: ${role} interview with ${recruiterName}`;
    const body = [
      `Hi ${candidateName},`,
      '',
      `You are invited to interview for ${role}. ${recruiterName} has prepared ${mode} so you can demonstrate both how you think and the impact of your decisions.`,
      '',
      'What to expect',
      '• You will speak with a disclosed AI interview panel representing different perspectives.',
      '• Questions adapt to your answers; you can ask the panel to pause or repeat a question.',
      '• Please use headphones and a quiet space if possible. You will have a short preparation period before the interview begins.',
      '',
      'Start your interview securely:',
      link,
      '',
      'This private link is single-use and expires in 7 days. If you need an accommodation or a different time, reply directly to this email.',
      '',
      `Best,`,
      recruiterName,
      'RoundTable AI',
    ].join('\n');
    const safeName = escapeHtml(candidateName);
    const safeRole = escapeHtml(role);
    const safeRecruiter = escapeHtml(recruiterName);
    const safeLink = escapeHtml(link);
    const html = `<!doctype html><html><body style="margin:0;background:#f4f7f5;color:#18231d;font-family:Inter,Arial,sans-serif"><div style="max-width:620px;margin:0 auto;padding:36px 20px"><div style="padding:24px 28px;border-radius:20px 20px 0 0;background:#10251a;color:#fff"><div style="font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#7ee8b0">RoundTable AI</div><h1 style="margin:18px 0 0;font-size:30px;line-height:1.15">Your interview is ready.</h1></div><div style="padding:28px;background:#fff;border:1px solid #dce8e0;border-top:0;border-radius:0 0 20px 20px"><p style="font-size:16px;line-height:1.6">Hi ${safeName},</p><p style="font-size:16px;line-height:1.6">${safeRecruiter} has invited you to interview for the <strong>${safeRole}</strong> role.</p><div style="margin:24px 0;padding:18px;border-radius:14px;background:#f2faf5"><strong style="display:block;margin-bottom:8px">What to expect</strong><span style="display:block;font-size:14px;line-height:1.6">A disclosed AI panel will explore how you think, communicate, and connect decisions to real customer impact. You can ask it to pause or repeat a question at any time.</span></div><a href="${safeLink}" style="display:inline-block;padding:14px 20px;border-radius:10px;background:#25b875;color:#062313;font-weight:800;text-decoration:none">Start interview</a><p style="margin-top:24px;font-size:13px;line-height:1.6;color:#52665a">Please use headphones and a quiet space if possible. This secure link is single-use and expires in 7 days. Need a different time or accommodation? Reply directly to this email.</p><p style="font-size:14px;line-height:1.5">Best,<br><strong>${safeRecruiter}</strong><br>RoundTable AI</p></div></div></body></html>`;
    return { subject, body, html };
  }

  function openGmailDraft(candidateData: Candidate, link: string) {
    if (!candidateData.email) {
      setMessage('Add the candidate’s email before opening a Gmail draft.');
      return;
    }
    const { subject, body } = invitationMessage(candidateData, link);
    const params = new URLSearchParams({ view: 'cm', fs: '1', to: candidateData.email, su: subject, body });
    window.open(`https://mail.google.com/mail/?${params.toString()}`, '_blank', 'noopener,noreferrer');
    setMessage('Opened a personalised Gmail draft. Review it, then send from your Google account.');
  }

  function openCalendarHold(jcId: string, candidateData: Candidate, link: string) {
    if (!candidateData.email) {
      setMessage('Add the candidate’s email before preparing a calendar invitation.');
      return;
    }
    const rawStart = invitationSchedules[jcId]?.startsAt;
    const start = new Date(rawStart ?? defaultInvitationStart);
    if (Number.isNaN(start.getTime())) {
      setMessage('Choose a valid interview time before opening Google Calendar.');
      return;
    }
    const end = new Date(start.getTime() + Math.max((interviews[0]?.durationMinutes ?? 30), 30) * 60_000);
    const role = selectedJob?.title || interviews[0]?.roleTitle || 'RoundTable interview';
    const { body } = invitationMessage(candidateData, link);
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `RoundTable interview · ${role}`,
      dates: `${googleCalendarDate(start)}/${googleCalendarDate(end)}`,
      details: body,
      add: candidateData.email,
    });
    window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank', 'noopener,noreferrer');
    setMessage('Opened a Google Calendar event with the candidate and secure interview link prefilled.');
  }

  async function sendInvitationEmail(jcId: string, candidateData: Candidate, link: string) {
    if (!candidateData.email) {
      setMessage('Add the candidate’s email before sending an invitation.');
      return;
    }
    const providerToken = googleDeliveryToken;
    if (!providerToken) {
      openGmailDraft(candidateData, link);
      return;
    }
    setPendingAction(`send:${jcId}`);
    try {
      const { subject, body, html } = invitationMessage(candidateData, link);
      const response = await fetch('/api/delivery/google', {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_email', providerToken, to: candidateData.email, subject, body, html }),
      });
      if (!response.ok) {
        openGmailDraft(candidateData, link);
        return;
      }
      setMessage(`Invitation sent to ${candidateData.email}.`);
    } catch {
      openGmailDraft(candidateData, link);
    } finally {
      setPendingAction(null);
    }
  }

  async function createCalendarEvent(jcId: string, candidateData: Candidate, link: string) {
    if (!candidateData.email) {
      setMessage('Add the candidate’s email before creating an interview event.');
      return;
    }
    const providerToken = googleDeliveryToken;
    if (!providerToken) {
      openCalendarHold(jcId, candidateData, link);
      return;
    }
    const rawStart = invitationSchedules[jcId]?.startsAt;
    const start = new Date(rawStart ?? defaultInvitationStart);
    if (Number.isNaN(start.getTime())) {
      setMessage('Choose a valid interview time before creating the calendar event.');
      return;
    }
    const end = new Date(start.getTime() + Math.max((interviews[0]?.durationMinutes ?? 30), 30) * 60_000);
    const role = selectedJob?.title || interviews[0]?.roleTitle || 'RoundTable interview';
    const { body } = invitationMessage(candidateData, link);
    setPendingAction(`calendar:${jcId}`);
    try {
      const response = await fetch('/api/delivery/google', {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_calendar_event',
          providerToken,
          attendeeEmail: candidateData.email,
          title: `RoundTable interview / ${role}`,
          description: body,
          startsAt: start.toISOString(),
          endsAt: end.toISOString(),
        }),
      });
      if (!response.ok) {
        openCalendarHold(jcId, candidateData, link);
        return;
      }
      setMessage(`Calendar invitation created and sent to ${candidateData.email}.`);
    } catch {
      openCalendarHold(jcId, candidateData, link);
    } finally {
      setPendingAction(null);
    }
  }

  // ─── Auth screens ────────────────────────────────────────────────────────────

  if (!authReady) return (
    <main className={styles.authPage}>
      <div className={styles.authLoader}><LoaderCircle className={styles.spin}/><span>Checking your workspace</span></div>
    </main>
  );

  if (supabase && !session) return (
    <main className={styles.authPage}>
      <Link href="/" className={styles.backLink}><ArrowLeft size={15}/> Back to RoundTable</Link>
      <Card className={styles.authCard}>
        <CardHeader>
          <span className={styles.brand}><i/> RoundTable AI</span>
          <span className={styles.authEyebrow}>RECRUITER PORTAL</span>
          <CardTitle className={styles.authTitle}>Your hiring workspace</CardTitle>
          <p className={styles.muted}>Sign in with Google to manage jobs, candidates, and evidence-backed interviews.</p>
        </CardHeader>
        <CardContent>
          <Button onClick={googleSignIn} disabled={pendingAction === 'google'} className={styles.googleButton}>
            {pendingAction === 'google' ? <LoaderCircle className={styles.spin} size={18}/> : <GoogleMark/>}
            {pendingAction === 'google' ? 'Connecting…' : 'Continue with Google'}
          </Button>
          <p className={styles.authFoot}><ShieldCheck size={13}/> Candidate accounts are never required.</p>
          {message && <p className={styles.authMessage}>{message}</p>}
        </CardContent>
      </Card>
    </main>
  );

  const profileName = session?.user.user_metadata?.full_name ?? session?.user.user_metadata?.name ?? session?.user.email ?? 'Demo recruiter';
  const nextStep = competencies.length < 3
    ? { tab: 'competencies' as const, label: 'Set hiring bar', detail: 'Add at least three weighted competencies before you launch.' }
    : interviews.length === 0
      ? { tab: 'blueprint' as const, label: 'Create interview', detail: 'Choose the panel and the evidence the interview should collect.' }
      : jobCandidates.length === 0
        ? { tab: 'candidates' as const, label: 'Add candidate', detail: 'Create a private candidate record, then generate a single-use link.' }
        : { tab: 'pipeline' as const, label: 'Review pipeline', detail: 'Monitor completed interviews and open evidence reports for human review.' };
  // ─── Main dashboard ──────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/" className={styles.brand}><i/> RoundTable AI</Link>
        <div className={styles.topActions}>
          <span className={styles.userChip}>
            <span><b>{profileName}</b><small>Recruiter</small></span>
          </span>
          {supabase && (
            <Button variant="outline" size="sm" disabled={pendingAction === 'signout'} onClick={signOut}>
              {pendingAction === 'signout' ? <LoaderCircle className={styles.spin} size={14}/> : <LogOut size={14}/>} Sign out
            </Button>
          )}
        </div>
      </header>

      <main className={styles.shell}>
        {message && <div className={styles.notice} role="status"><Sparkles size={16}/><span>{message}</span></div>}

        {/* Two-panel layout */}
        <section className={styles.workbench}>
          {/* Left — Job list */}
          <aside className={styles.sidebar}>
            <div className={styles.sidebarHead}>
              <span className={styles.sectionLabel}>JOBS</span>
              <Button size="sm" variant="outline" className={styles.newJobBtn} onClick={() => setShowCreateJob(true)}>
                <Plus size={13}/> New job
              </Button>
            </div>

            {/* Create job inline form */}
            {showCreateJob && (
              <div className={styles.createJobForm}>
                <div className={styles.createJobFormHead}>
                  <span>New job posting</span>
                  <button className={styles.closeBtn} onClick={() => setShowCreateJob(false)} aria-label="Close"><X size={14}/></button>
                </div>
                <label className={styles.field}>
                  <span>Job title *</span>
                  <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Frontend Engineer"/>
                </label>
                <label className={styles.field}>
                  <span>Type</span>
                  <select value={jobEmploymentType} onChange={(e) => setJobEmploymentType(e.target.value)} className={styles.select}>
                    {Object.entries(employmentLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </label>
                <label className={styles.field}>
                  <span>Location <small>optional</small></span>
                  <input value={jobLocation} onChange={(e) => setJobLocation(e.target.value)} placeholder="e.g. Remote / London"/>
                </label>
                <label className={styles.field}>
                  <span>Job description <small>optional</small></span>
                  <textarea value={jobJd} onChange={(e) => setJobJd(e.target.value)} rows={4} placeholder="Paste or type role context…"/>
                </label>
                <Button className={styles.createButton} onClick={createJob} disabled={!jobTitle.trim() || pendingAction === 'createJob'}>
                  {pendingAction === 'createJob' ? <><Activity className={styles.spin} size={15}/> Creating…</> : <><Plus size={15}/> Create job</>}
                </Button>
              </div>
            )}

            {/* Job list */}
            {jobs.length === 0 && !showCreateJob && (
              <div className={styles.sidebarEmpty}>
                <Briefcase size={22}/>
                <strong>No jobs yet</strong>
                <span>Create your first job posting to start the hiring pipeline.</span>
              </div>
            )}
            {jobs.map((job) => (
              <button
                key={job.id}
                className={`${styles.jobRow} ${selectedJobId === job.id ? styles.jobRowActive : ''}`}
                onClick={() => { setSelectedJobId(job.id); setActiveTab('candidates'); }}
              >
                <div className={styles.jobRowInner}>
                  <strong>{job.title}</strong>
                  <div className={styles.jobMeta}>
                    <span><Tag size={10}/> {employmentLabels[job.employmentType] ?? job.employmentType}</span>
                    {job.locationLabel && <span><MapPin size={10}/> {job.locationLabel}</span>}
                  </div>
                </div>
                <span className={`${styles.jobStatus} ${styles[`jobStatus_${job.status}`] ?? ''}`}>{job.status}</span>
                <ChevronRight size={13} className={styles.jobChevron}/>
              </button>
            ))}
          </aside>

          {/* Right — Job detail */}
          <div className={styles.jobDetail}>
            {!selectedJob ? (
              <div className={styles.detailEmpty}>
                <BriefcaseBusiness size={32}/>
                <strong>Select a job</strong>
                <span>Choose a job from the left panel to manage its competencies, blueprint, and candidate pipeline.</span>
                {jobs.length === 0 && (
                  <Button className={styles.createButton} style={{ marginTop: 12 }} onClick={() => setShowCreateJob(true)}>
                    <Plus size={15}/> Create your first job
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Job header */}
                <div className={styles.jobHeader}>
                  <div>
                    <h2>{selectedJob.title}</h2>
                    <div className={styles.jobMeta}>
                      <span><Tag size={11}/> {employmentLabels[selectedJob.employmentType] ?? selectedJob.employmentType}</span>
                      {selectedJob.locationLabel && <span><MapPin size={11}/> {selectedJob.locationLabel}</span>}
                      <span><Clock3 size={11}/> Created {new Date(selectedJob.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className={styles.jobHeaderActions}>
                    <span className={`${styles.jobStatus} ${styles[`jobStatus_${selectedJob.status}`] ?? ''}`}>{selectedJob.status}</span>
                    <Button size="sm" className={styles.detailPrimary} onClick={() => setActiveTab(nextStep.tab)}>
                      <WandSparkles size={13}/> {nextStep.label}
                    </Button>
                  </div>
                </div>

                {/* Tabs */}
                <nav className={styles.tabs}>
                  {(['competencies', 'blueprint', 'candidates', 'pipeline'] as const).map((tab, i) => (
                    <button
                      key={tab}
                      className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
                      onClick={() => setActiveTab(tab)}
                    >
                      <span className={styles.tabNum}>0{i + 1}</span>
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      {tab === 'candidates' && jobCandidates.length > 0 && (
                        <span className={styles.tabBadge}>{jobCandidates.length}</span>
                      )}
                      {tab === 'pipeline' && sessions.length > 0 && (
                        <span className={styles.tabBadge}>{sessions.length}</span>
                      )}
                    </button>
                  ))}
                </nav>

                {/* ── Tab: Competencies ─────────────────────────────── */}
                {activeTab === 'competencies' && (
                  <div className={styles.tabPanel}>
                    <div className={styles.tabIntro}>
                      <strong>Hiring bar</strong>
                      <span>Define weighted competencies. The interview controller targets gaps against this bar.</span>
                    </div>
                    {/* Add form */}
                    <Card className={styles.inlineCard}>
                      <CardContent className={styles.compForm}>
                        <div className={styles.compRow}>
                          <label className={styles.field}>
                            <span>Competency name *</span>
                            <input value={compName} onChange={(e) => setCompName(e.target.value)} placeholder="e.g. System Design"/>
                          </label>
                          <label className={styles.field} style={{ maxWidth: 90 }}>
                            <span>Weight (1–100)</span>
                            <input type="number" min={1} max={100} value={compWeight} onChange={(e) => setCompWeight(e.target.value)}/>
                          </label>
                        </div>
                        <label className={styles.field}>
                          <span>Description <small>optional</small></span>
                          <input value={compDesc} onChange={(e) => setCompDesc(e.target.value)} placeholder="What does mastery look like?"/>
                        </label>
                        <Button size="sm" className={styles.addBtn} onClick={addCompetency}
                          disabled={!compName.trim() || pendingAction === 'addComp'}>
                          {pendingAction === 'addComp' ? <LoaderCircle className={styles.spin} size={13}/> : <Plus size={13}/>} Add competency
                        </Button>
                      </CardContent>
                    </Card>
                    {/* List */}
                    {competencies.length === 0 && (
                      <div className={styles.listEmpty}><span>No competencies yet — add your first above.</span></div>
                    )}
                    {competencies.map((c) => (
                      <div key={c.id} className={styles.compItem}>
                        <div className={styles.compItemInfo}>
                          <strong>{c.name}</strong>
                          <span>{c.description || c.competencyKey}</span>
                        </div>
                        <div className={styles.compItemRight}>
                          <span className={styles.weightBadge}>{c.weight}%</span>
                          <button className={styles.deleteBtn} aria-label="Remove" onClick={() => void deleteCompetency(c.id)}
                            disabled={pendingAction === `delComp:${c.id}`}>
                            {pendingAction === `delComp:${c.id}` ? <LoaderCircle className={styles.spin} size={12}/> : <X size={12}/>}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Tab: Blueprint ────────────────────────────────── */}
                {activeTab === 'blueprint' && (
                  <div className={styles.tabPanel}>
                    <div className={styles.tabIntro}>
                      <strong>Interview blueprint</strong>
                      <span>Choose a finale-ready showcase or a role-specific adaptive interview. The server owns every handoff and assessment decision.</span>
                    </div>
                    {interviews.length > 0 ? (
                      <div className={styles.blueprintList}>
                        {interviews.map((item) => (
                          <Card key={item.id} className={styles.blueprintCard}>
                            <div className={styles.blueprintCardInner}>
                              <div>
                                <strong>{item.title}</strong>
                                <span>{item.roleTitle}</span>
                                <span className={styles.bpDate}>{new Date(item.createdAt).toLocaleDateString()}</span>
                              </div>
                              <span className={`${styles.status} ${item.status === 'ready' ? styles.status_ready : ''}`}>{item.status}</span>
                            </div>
                            <div className={styles.roleChips}>
                              {(item.panelRoles ?? DEMO_ROLES).map((r, i) => (
                                <span key={r}><b>{i + 1}</b>{roleNames[r] ?? r}</span>
                              ))}
                            </div>
                            <div className={styles.bpMeta}><Clock3 size={11}/> {item.durationMinutes ?? DEMO_DURATION_MINUTES} min · {item.demoMode ? 'finale showcase' : 'adaptive interview'}</div>
                          </Card>
                        ))}
                        <p className={styles.bpNote}>To create a new blueprint for this job, fill the form below.</p>
                      </div>
                    ) : null}
                    <Card className={`${styles.panel} ${styles.inlineCard}`}>
                      <CardContent className={styles.form}>
                        <div className={styles.builderHeader}>
                          <div><span className={styles.sectionLabel}>INTERVIEW SETUP</span><strong>Configure the evidence you need</strong></div>
                          <small>All panel handoffs and ratings remain server-owned.</small>
                        </div>
                        <div className={styles.templateRow} aria-label="Role templates">
                          {Object.entries(interviewTemplates).map(([key, template]) => <button key={key} type="button" onClick={() => applyTemplate(key as keyof typeof interviewTemplates)}>{template.label}</button>)}
                        </div>
                        <div className={styles.formSplit}>
                          <label className={styles.field}><span>Role title</span><input value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} placeholder="e.g. Frontend Engineer"/></label>
                          <label className={styles.field}><span>Seniority</span><select value={seniority} onChange={(e) => setSeniority(e.target.value)} className={styles.select}><option value="intern">Intern / graduate</option><option value="junior">Junior</option><option value="mid">Mid-level</option><option value="senior">Senior</option><option value="staff">Staff / principal</option></select></label>
                        </div>
                        <label className={styles.field}><span>Role context and requirements</span><textarea value={jdText} onChange={(e) => setJdText(e.target.value)} rows={5}/></label>
                        <label className={styles.field}><span>Focus areas and outcomes <small>one per line</small></span><textarea value={outcomes} onChange={(e) => setOutcomes(e.target.value)} rows={4}/></label>
                        <div className={styles.focusBlock}><span>Quick focus areas</span><div>{focusOptions.map((focusArea) => <button key={focusArea} type="button" className={selectedFocusAreas.includes(focusArea) ? styles.focusActive : ''} onClick={() => toggleFocusArea(focusArea)}>{selectedFocusAreas.includes(focusArea) && <Check size={11}/>} {focusArea}</button>)}</div></div>
                        <label className={styles.field}><span>Must-ask questions <small>optional, one per line</small></span><textarea value={mustAsk} onChange={(e) => setMustAsk(e.target.value)} rows={3} placeholder="Add questions the panel must cover"/></label>
                        <div className={styles.modePicker} aria-label="Interview mode">
                          <button type="button" className={`${styles.modeCard} ${interviewMode === 'showcase' ? styles.modeCardActive : ''}`} onClick={() => chooseInterviewMode('showcase')}>
                            <strong>Finale showcase</strong><span>Five perspectives · 10 min · one answer per role</span>
                          </button>
                          <button type="button" className={`${styles.modeCard} ${interviewMode === 'adaptive' ? styles.modeCardActive : ''}`} onClick={() => chooseInterviewMode('adaptive')}>
                            <strong>Adaptive interview</strong><span>Choose 2–5 perspectives and a 5–90 min budget</span>
                          </button>
                        </div>
                        <div className={styles.panelBlock}>
                          <span>Panel perspectives <small>{interviewMode === 'showcase' ? 'Showcase includes every role.' : 'Select at least two. The panel adapts by evidence gaps, not a timer.'}</small></span>
                          <div className={styles.roleSelector}>{DEMO_ROLES.map((role) => {
                            const selected = panelRoles.includes(role);
                            return <button key={role} type="button" disabled={interviewMode === 'showcase'} onClick={() => togglePanelRole(role)} className={`${styles.roleOption} ${selected ? styles.roleOptionActive : ''}`} aria-pressed={selected}>
                              <b>{selected ? <Check size={11}/> : ''}</b><span><strong>{roleNames[role]}</strong><small>{roleDescriptions[role]}</small></span>
                            </button>;
                          })}</div>
                        </div>
                        <label className={styles.durationControl}>
                          <span><Clock3 size={12}/> Time budget <b>{interviewMode === 'showcase' ? DEMO_DURATION_MINUTES : durationMinutes} min</b></span>
                          <input type="range" min="5" max="90" step="5" value={interviewMode === 'showcase' ? DEMO_DURATION_MINUTES : durationMinutes} disabled={interviewMode === 'showcase'} onChange={(e) => setDurationMinutes(Number(e.target.value))}/>
                          <small>{interviewMode === 'showcase' ? 'The finale demo is deliberately bounded.' : 'The interview may finish earlier only after enough evidence is collected.'}</small>
                        </label>
                        <Button className={styles.createButton} onClick={createBlueprint}
                          disabled={pendingAction === 'createBp' || !roleTitle.trim() || !jdText.trim()}>
                          {pendingAction === 'createBp' ? <><Activity className={styles.spin} size={15}/> Generating plan…</> : <><Plus size={15}/> {interviews.length > 0 ? 'Create new blueprint' : 'Generate blueprint'}</>}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* ── Tab: Candidates ───────────────────────────────── */}
                {activeTab === 'candidates' && (
                  <div className={styles.tabPanel}>
                    <div className={styles.tabIntro}>
                      <strong>Candidates</strong>
                      <span>Add candidates, attach resumes, and generate private interview links.</span>
                    </div>
                    {/* Add candidate form */}
                    <Card className={styles.inlineCard}>
                      <CardContent className={styles.candidateAddForm}>
                        <div className={styles.compRow}>
                          <label className={styles.field}>
                            <span>Full name <small>optional</small></span>
                            <input value={candidateName} onChange={(e) => setCandidateName(e.target.value)} placeholder="Aarav Shah"/>
                          </label>
                          <label className={styles.field}>
                            <span>Email <small>optional</small></span>
                            <input type="email" value={candidateEmail} onChange={(e) => setCandidateEmail(e.target.value)} placeholder="aarav@example.com"/>
                          </label>
                        </div>
                        <Button size="sm" className={styles.addBtn} onClick={addCandidate}
                          disabled={(!candidateName.trim() && !candidateEmail.trim()) || pendingAction === 'addCand'}>
                          {pendingAction === 'addCand' ? <LoaderCircle className={styles.spin} size={13}/> : <Plus size={13}/>} Add candidate
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Candidate list */}
                    {jobCandidates.length === 0 && (
                      <div className={styles.listEmpty}><span>No candidates yet — add the first one above.</span></div>
                    )}
                    {jobCandidates.map((jc) => {
                      const link = inviteLinks[jc.id];
                      const latestDecision = decisionHistory[jc.id]?.[0];
                      return (
                        <div key={jc.id} className={styles.candidateCard}>
                          <div className={styles.candidateCardTop}>
                            <div className={styles.candidateInfo}>
                              <strong>{jc.candidate.fullName ?? '—'}</strong>
                              <span>{jc.candidate.email ?? 'No email'}</span>
                            </div>
                            <span className={`${styles.stageBadge} ${styles[stageColors[jc.stage] ?? '']}`}>{jc.stage.replace('_', ' ')}</span>
                          </div>

                          {(jc.stage === 'completed' || jc.stage === 'review' || Boolean(latestDecision)) && <div className={styles.decisionBox}>
                            <div className={styles.decisionHead}>
                              <span>Human decision</span>
                              {latestDecision ? <small>{latestDecision.decision.replace('_', ' ')} · {new Date(latestDecision.decidedAt).toLocaleDateString()}</small> : <small>AI advises; people decide</small>}
                            </div>
                            {latestDecision && <p>{latestDecision.rationale}</p>}
                            <textarea
                              aria-label={`Decision rationale for ${jc.candidate.fullName ?? 'candidate'}`}
                              value={decisionRationales[jc.id] ?? ''}
                              onChange={(event) => setDecisionRationales((previous) => ({ ...previous, [jc.id]: event.target.value }))}
                              placeholder="Record the evidence and rationale behind your decision…"
                              rows={2}
                            />
                            <div className={styles.decisionActions}>
                              {(['advance', 'hold', 'needs_review', 'decline'] as const).map((decision) => (
                                <button key={decision} type="button" disabled={pendingAction === `decision:${jc.id}`} onClick={() => void recordHumanDecision(jc.id, decision)}>
                                  {decision.replace('_', ' ')}
                                </button>
                              ))}
                            </div>
                          </div>}

                          {/* Resume attach */}
                          <label className={styles.resumeUpload}>
                            <span className={styles.resumeIcon}>
                              {pendingAction === `resume:${jc.id}` ? <LoaderCircle className={styles.spin} size={14}/> : <Upload size={14}/>}
                            </span>
                            <span>
                              <strong>{resumeNames[jc.id] ?? 'Attach resume'}</strong>
                              <small>Optional TXT/Markdown · max 120 KB</small>
                            </span>
                            <input type="file" accept=".txt,.md,text/plain,text/markdown" onChange={(e) => void readResume(jc.id, e.target.files?.[0])}/>
                          </label>

                          {/* Invite actions */}
                          {!link && (
                            <Button size="sm" variant="outline" className={styles.inviteBtn}
                              disabled={pendingAction === `invite:${jc.id}`}
                              onClick={() => void generateInvite(jc.id, jc.candidate)}>
                              {pendingAction === `invite:${jc.id}` ? <><LoaderCircle className={styles.spin} size={13}/> Generating…</> : <><Link2 size={13}/> Generate link</>}
                            </Button>
                          )}
                          {link && (
                            <div className={styles.inviteBox}>
                              <div className={styles.inviteBoxHead}><CheckCircle2 size={13}/><strong>Invitation ready</strong><small>7 days · single-use</small></div>
                              <div className={styles.linkRow}>
                                <input readOnly value={link} onFocus={(e) => e.currentTarget.select()}/>
                                <Button size="sm" onClick={() => void copyLink(jc.id)} disabled={pendingAction === `copy:${jc.id}`}>
                                  {pendingAction === `copy:${jc.id}` ? <LoaderCircle className={styles.spin} size={13}/> : copiedId === jc.id ? <Check size={13}/> : <Clipboard size={13}/>}
                                  {copiedId === jc.id ? 'Copied' : 'Copy'}
                                </Button>
                              </div>
                              <div className={styles.inviteDelivery}>
                                <div className={styles.deliveryCopy}>
                                  <span>Deliver invitation</span>
                                  <small>{googleDeliveryToken ? 'Send directly from your connected Google account, or use a reviewable draft.' : 'Connect Google delivery once to enable direct email and calendar invitations.'}</small>
                                </div>
                                <div className={styles.deliveryActions}>
                                  {session && !googleDeliveryToken && (
                                    <Button size="sm" className={styles.connectGoogleButton} onClick={() => void connectGoogleDelivery()} disabled={pendingAction === 'google-delivery'}>
                                      {pendingAction === 'google-delivery' ? <LoaderCircle className={styles.spin} size={13}/> : <GoogleMark/>} Connect Google delivery
                                    </Button>
                                  )}
                                  <Button size="sm" className={styles.sendButton}
                                    disabled={!jc.candidate.email || pendingAction === `send:${jc.id}`}
                                    title={googleDeliveryToken ? 'Send this personalised invitation now' : 'Send invitation via Google'}
                                    onClick={() => void sendInvitationEmail(jc.id, jc.candidate, link)}>
                                    {pendingAction === `send:${jc.id}` ? <LoaderCircle className={styles.spin} size={13}/> : <Mail size={13}/>} Send invitation
                                  </Button>
                                  <Button size="sm" className={styles.sendButton}
                                    disabled={!jc.candidate.email || pendingAction === `calendar:${jc.id}`}
                                    title={googleDeliveryToken ? 'Create and send a calendar invitation now' : 'Schedule calendar invite'}
                                    onClick={() => void createCalendarEvent(jc.id, jc.candidate, link)}>
                                    {pendingAction === `calendar:${jc.id}` ? <LoaderCircle className={styles.spin} size={13}/> : <CalendarDays size={13}/>} Send calendar invite
                                  </Button>
                                  <Button size="sm" variant="outline" className={styles.gmailButton}
                                    disabled={!jc.candidate.email}
                                    title={jc.candidate.email ? 'Open a personalised email draft for review' : 'Add an email address to send an invitation'}
                                    onClick={() => openGmailDraft(jc.candidate, link)}>
                                    <Mail size={13}/> Review draft
                                  </Button>
                                  <Button size="sm" variant="outline" className={styles.calendarButton}
                                    disabled={!jc.candidate.email}
                                    title={jc.candidate.email ? 'Open a calendar event for review' : 'Add an email address to schedule an invitation'}
                                    onClick={() => openCalendarHold(jc.id, jc.candidate, link)}>
                                    <CalendarDays size={13}/> Review calendar
                                  </Button>
                                </div>
                              </div>
                              <label className={styles.scheduleField}>
                                <span>Suggested interview time <small>optional — used only for the calendar hold</small></span>
                                <input
                                  type="datetime-local"
                                  value={invitationSchedules[jc.id]?.startsAt ?? defaultInvitationStart}
                                  onChange={(event) => setInvitationSchedules((previous) => ({
                                    ...previous,
                                    [jc.id]: { startsAt: event.target.value },
                                  }))}
                                />
                              </label>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── Tab: Pipeline ─────────────────────────────────── */}
                {activeTab === 'pipeline' && (
                  <div className={styles.tabPanel}>
                    <div className={styles.tabIntro}>
                      <strong>Interview pipeline</strong>
                      <span>Track live and completed sessions for all candidates in this job.</span>
                    </div>
                    {sessions.length === 0 && (
                      <div className={styles.listEmpty}><span>No sessions yet. Candidates will appear here once they start.</span></div>
                    )}
                    {sessions.map((s) => (
                      <div key={s.id} className={styles.sessionCard}>
                        <span className={styles.sessionStatus}>
                          <i className={s.status === 'completed' || s.health === 'connected' || s.health === 'healthy' ? styles.healthy : styles.warning}/>
                          <b>{s.status === 'completed'
                            ? s.endReason === 'camera_absence' ? 'Ended after camera absence · human review' : 'Completed · analysis ready'
                            : s.status.replace('_', ' ')}</b>
                          <small>{new Date(s.startedAt).toLocaleString()}</small>
                        </span>
                        {s.status === 'completed' && (
                          <button className={styles.analysisButton}
                            disabled={pendingAction === `analysis:${s.id}`}
                            onClick={() => { setPendingAction(`analysis:${s.id}`); router.push(`/company/analysis/${s.id}`); }}>
                            {pendingAction === `analysis:${s.id}` ? <LoaderCircle className={styles.spin} size={14}/> : <FileText size={14}/>}
                            Open analysis <ArrowRight size={14}/>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <footer className={styles.dashboardFoot}>
          <ShieldCheck size={14}/> Every job, candidate, invitation, session, and report is scoped to your private Google workspace.
        </footer>
      </main>
    </div>
  );
}
