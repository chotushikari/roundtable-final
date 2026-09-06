'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient, type Session } from '@supabase/supabase-js';
import {
  Activity, ArrowLeft, ArrowRight, BriefcaseBusiness, Check, CheckCircle2,
  Clipboard, Clock3, FileCheck2, FileText, Link2, LoaderCircle, LogOut, Plus,
  Radio, RefreshCw, ShieldCheck, Sparkles, Upload, Users,
} from 'lucide-react';
import { DEMO_DURATION_MINUTES, DEMO_ROLES } from '@/lib/interview-demo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import styles from './CompanyDashboard.module.css';

type Interview = { id: string; title: string; roleTitle: string; status: string; createdAt: string };
type SessionSummary = { id: string; status: string; health: string; startedAt: string; completedAt: string | null; interviewId: string };
type CandidateDetails = { name: string; email: string };

const roleNames: Record<string, string> = {
  hiring_manager: 'Hiring Manager', technical: 'Technical', product: 'Product Manager',
  customer: 'Customer', behavioral: 'Behavioural',
};

function GoogleMark() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.googleMark}><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z"/><path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.42l-3.24-2.54c-.9.6-2.05.96-3.38.96-2.6 0-4.81-1.76-5.6-4.13H3.06v2.62A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 13.87A6 6 0 0 1 6.1 12c0-.65.11-1.28.3-1.87V7.51H3.06A10 10 0 0 0 2 12c0 1.61.39 3.14 1.06 4.49l3.34-2.62Z"/><path fill="#EA4335" d="M12 6c1.47 0 2.78.5 3.82 1.49l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.94 5.51l3.34 2.62C7.19 7.76 9.4 6 12 6Z"/></svg>;
}

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
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [roleTitle, setRoleTitle] = useState('Software Engineer Intern (0 years experience)');
  const [jdText, setJdText] = useState('Entry-level internship with no professional experience required. Use Python, JavaScript, or TypeScript. Assess basic problem solving, simple functions, a small to-do app design, communication, and willingness to learn. Accept class assignments and personal projects. Keep questions beginner-friendly; do not require distributed systems or production experience.');
  const [outcomes, setOutcomes] = useState('Write a simple function and explain an edge case\nDraw a simple app with a client, server, and database\nExplain how the app helps a user\nCommunicate clearly and learn from feedback');
  const [mustAsk, setMustAsk] = useState('');
  const [message, setMessage] = useState('');
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [resumeTexts, setResumeTexts] = useState<Record<string, string>>({});
  const [resumeNames, setResumeNames] = useState<Record<string, string>>({});
  const [candidateDetails, setCandidateDetails] = useState<Record<string, CandidateDetails>>({});
  const [invitationLinks, setInvitationLinks] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const accessToken = session?.access_token;
  const authHeaders: Record<string, string> = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setPendingAction('load');
    try {
      const headers: Record<string, string> = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const response = await fetch('/api/interviews', { headers });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Could not load interviews');
      const nextInterviews = data.interviews as Interview[];
      setInterviews(nextInterviews);
      setOrganizationId(data.organizationId);
      const lists = await Promise.all(nextInterviews.map(async (item) => {
        const result = await fetch(`/api/interviews/${item.id}/sessions`, { headers });
        const body = await result.json();
        return result.ok ? (body.sessions as Omit<SessionSummary, 'interviewId'>[]).map((entry) => ({ ...entry, interviewId: item.id })) : [];
      }));
      setSessions(lists.flat());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load interviews');
    } finally {
      if (!quiet) setPendingAction(null);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => { setSession(next); setAuthReady(true); });
    return () => data.subscription.unsubscribe();
  }, [supabase]);
  useEffect(() => { if (authReady && (session || !supabase)) void load(); }, [authReady, load, session, supabase]);
  useEffect(() => {
    if (!supabase || !session || !organizationId) return;
    const channel = supabase.channel(`organization:${organizationId}:status`, { config: { private: true } }).on('broadcast', { event: '*' }, () => void load(true)).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [load, organizationId, session, supabase]);
  useEffect(() => {
    const hasLiveSession = sessions.some((item) => ['ready', 'starting', 'active', 'in_progress', 'assessing'].includes(item.status));
    if (!hasLiveSession) return;
    const pollId = window.setInterval(() => void load(true), 10_000);
    return () => window.clearInterval(pollId);
  }, [load, sessions]);

  const stats = useMemo(() => ({
    active: sessions.filter((item) => ['starting', 'active', 'in_progress'].includes(item.status)).length,
    completed: sessions.filter((item) => item.status === 'completed').length,
  }), [sessions]);

  async function googleSignIn() {
    if (!supabase) return;
    setPendingAction('google');
    setMessage('Opening Google sign in…');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google', options: { redirectTo: `${window.location.origin}/company` },
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

  async function createInterview() {
    setPendingAction('create');
    setMessage('Generating the five-perspective interview plan…');
    try {
      const response = await fetch('/api/interviews', {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          title: `${roleTitle.trim()} Interview`.slice(0, 120), roleTitle, jdText,
          desiredOutcomes: outcomes.split('\n').map((item) => item.trim()).filter(Boolean),
          mustAskQuestions: mustAsk.split('\n').map((item) => item.trim()).filter(Boolean),
          panelRoles: DEMO_ROLES, durationMinutes: DEMO_DURATION_MINUTES, demoMode: true,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Could not create interview');
      const plan = await fetch(`/api/interviews/${data.interview.id}/plan`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders }, body: '{}' });
      const planData = await plan.json();
      if (!plan.ok) throw new Error(planData.error ?? 'Could not generate interview plan');
      setMessage('Interview plan ready. Add candidate details or a resume, then generate a private link.');
      await load(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not create interview');
    } finally { setPendingAction(null); }
  }

  async function readResume(id: string, file?: File) {
    if (!file) return;
    if (file.size > 120_000) { setMessage('Resume is too large. Use a TXT or Markdown file under 120 KB.'); return; }
    setPendingAction(`resume:${id}`);
    try {
      const text = await file.text();
      setResumeTexts((current) => ({ ...current, [id]: text.slice(0, 30_000) }));
      setResumeNames((current) => ({ ...current, [id]: file.name }));
      setMessage(`${file.name} is attached and will be stored privately when you generate the link.`);
    } finally { setPendingAction(null); }
  }

  async function publish(id: string) {
    setPendingAction(`publish:${id}`);
    try {
      const details = candidateDetails[id] ?? { name: '', email: '' };
      const response = await fetch(`/api/interviews/${id}/publish`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ candidateName: details.name.trim() || undefined, candidateEmail: details.email.trim() || undefined, resumeText: resumeTexts[id] || undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Could not generate invitation');
      setInvitationLinks((current) => ({ ...current, [id]: data.invitationUrl }));
      setMessage('Private interview link created. Use Copy link when you are ready to share it.');
      await load(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not generate invitation');
    } finally { setPendingAction(null); }
  }

  async function copyInvitation(id: string) {
    const url = invitationLinks[id];
    if (!url) return;
    setPendingAction(`copy:${id}`);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setMessage('Invitation link copied to clipboard.');
      window.setTimeout(() => setCopiedId(null), 2200);
    } catch { setMessage('Clipboard access was blocked. Select the link and copy it manually.'); }
    finally { setPendingAction(null); }
  }

  function openAnalysis(id: string) {
    setPendingAction(`analysis:${id}`);
    router.push(`/company/analysis/${id}`);
  }

  if (!authReady) return <main className={styles.authPage}><div className={styles.authLoader}><LoaderCircle className={styles.spin}/><span>Checking your workspace</span></div></main>;

  if (supabase && !session) return <main className={styles.authPage}>
    <Link href="/" className={styles.backLink}><ArrowLeft size={15}/> Back to RoundTable</Link>
    <Card className={styles.authCard}>
      <CardHeader><span className={styles.brand}><i/> RoundTable AI</span><span className={styles.authEyebrow}>INTERVIEWER PORTAL</span><CardTitle className={styles.authTitle}>Your private hiring workspace</CardTitle><p className={styles.muted}>Sign in with Google to create interviews, manage candidate links, and review evidence-backed reports.</p></CardHeader>
      <CardContent><Button onClick={googleSignIn} disabled={pendingAction === 'google'} className={styles.googleButton}>{pendingAction === 'google' ? <LoaderCircle className={styles.spin} size={18}/> : <GoogleMark/>}{pendingAction === 'google' ? 'Connecting…' : 'Continue with Google'}</Button><p className={styles.authFoot}><ShieldCheck size={13}/> Candidate accounts are never required.</p>{message && <p className={styles.authMessage}>{message}</p>}</CardContent>
    </Card>
  </main>;

  const profileName = session?.user.user_metadata?.full_name ?? session?.user.user_metadata?.name ?? session?.user.email ?? 'Demo interviewer';
  return <div className={styles.page}>
    <header className={styles.topbar}><Link href="/" className={styles.brand}><i/> RoundTable AI</Link><div className={styles.topActions}><span className={styles.userChip}><span><b>{profileName}</b><small>Interviewer</small></span></span>{supabase && <Button variant="outline" size="sm" disabled={pendingAction === 'signout'} onClick={signOut}>{pendingAction === 'signout' ? <LoaderCircle className={styles.spin} size={14}/> : <LogOut size={14}/>} Sign out</Button>}</div></header>
    <main className={styles.shell}>
      <section className={styles.hero}><div><span className={styles.eyebrow}>PRIVATE COMPANY WORKSPACE</span><h1>Interview command center</h1><p>Build one structured panel, share one secure candidate link, then review transcript and workspace evidence on a dedicated analysis page.</p></div><Button variant="outline" onClick={() => void load()} disabled={pendingAction === 'load'}>{pendingAction === 'load' ? <LoaderCircle className={styles.spin} size={15}/> : <RefreshCw size={15}/>} Refresh</Button></section>
      <section className={styles.metrics} aria-label="Interview statistics">
        <Card className={styles.metricCard}><BriefcaseBusiness/><div><strong>{interviews.length}</strong><span>Interview plans</span></div></Card>
        <Card className={styles.metricCard}><Radio/><div><strong>{stats.active}</strong><span>Live now</span></div></Card>
        <Card className={styles.metricCard}><FileCheck2/><div><strong>{stats.completed}</strong><span>Ready to review</span></div></Card>
        <Card className={styles.metricCard}><Users/><div><strong>5</strong><span>Panel perspectives</span></div></Card>
      </section>
      {message && <div className={styles.notice} role="status"><Sparkles size={16}/><span>{message}</span></div>}
      <section className={styles.dashboardGrid}>
        <Card className={styles.panel}><CardHeader className={styles.cardHeading}><div><span className={styles.sectionLabel}>01 · CREATE</span><CardTitle>Design an interview</CardTitle><p>RoundTable generates a fixed five-role, ten-minute showcase plan.</p></div><span className={styles.duration}><Clock3 size={11}/> {DEMO_DURATION_MINUTES} min</span></CardHeader><CardContent className={styles.form}>
          <label className={styles.field}><span>Role title</span><input value={roleTitle} onChange={(event) => setRoleTitle(event.target.value)} placeholder="e.g. Frontend Engineer"/></label>
          <label className={styles.field}><span>Role context and requirements</span><textarea value={jdText} onChange={(event) => setJdText(event.target.value)} rows={6}/></label>
          <label className={styles.field}><span>Desired outcomes <small>one per line</small></span><textarea value={outcomes} onChange={(event) => setOutcomes(event.target.value)} rows={4}/></label>
          <label className={styles.field}><span>Must-ask questions <small>optional, one per line</small></span><textarea value={mustAsk} onChange={(event) => setMustAsk(event.target.value)} rows={3} placeholder="Add questions the panel must cover"/></label>
          <div className={styles.panelBlock}><span>Server-controlled panel sequence</span><div className={styles.roleChips}>{DEMO_ROLES.map((role, index) => <span key={role}><b>{index + 1}</b>{roleNames[role] ?? role}</span>)}</div></div>
          <Button onClick={createInterview} disabled={pendingAction === 'create' || !roleTitle.trim() || !jdText.trim()} className={styles.createButton}>{pendingAction === 'create' ? <><Activity className={styles.spin} size={17}/> Generating plan…</> : <><Plus size={17}/> Create interview plan</>}</Button>
        </CardContent></Card>

        <Card className={styles.panel}><CardHeader className={styles.cardHeading}><div><span className={styles.sectionLabel}>02 · INVITE & TRACK</span><CardTitle>Candidate pipeline</CardTitle><p>Attach candidate context, create a link, and follow live status.</p></div><span className={styles.duration}>{interviews.length} total</span></CardHeader><CardContent className={styles.interviewList}>
          {pendingAction === 'load' && interviews.length === 0 && <div className={styles.emptyState}><LoaderCircle className={styles.spin}/><strong>Loading workspace</strong><span>Fetching your private interviews.</span></div>}
          {pendingAction !== 'load' && interviews.length === 0 && <div className={styles.emptyState}><BriefcaseBusiness/><strong>No interviews yet</strong><span>Create a plan to start your candidate pipeline.</span></div>}
          {interviews.map((item) => {
            const itemSessions = sessions.filter((entry) => entry.interviewId === item.id);
            const details = candidateDetails[item.id] ?? { name: '', email: '' };
            const invitationUrl = invitationLinks[item.id];
            return <article key={item.id} className={styles.interviewItem}>
              <div className={styles.interviewTitleRow}><div><strong>{item.title}</strong><span>{new Date(item.createdAt).toLocaleDateString()}</span></div><span className={`${styles.status} ${styles[`status_${item.status}`] ?? ''}`}>{item.status}</span></div>
              <p>{item.roleTitle}</p>
              {item.status === 'ready' && <div className={styles.inviteSetup}>
                <div className={styles.candidateFields}><input value={details.name} onChange={(event) => setCandidateDetails((current) => ({ ...current, [item.id]: { ...details, name: event.target.value } }))} placeholder="Candidate name (optional)"/><input type="email" value={details.email} onChange={(event) => setCandidateDetails((current) => ({ ...current, [item.id]: { ...details, email: event.target.value } }))} placeholder="Candidate email (optional)"/></div>
                <label className={styles.resumeUpload}><span className={styles.resumeIcon}>{pendingAction === `resume:${item.id}` ? <LoaderCircle className={styles.spin} size={16}/> : <Upload size={16}/>}</span><span><strong>{resumeNames[item.id] || 'Attach candidate resume'}</strong><small>Optional TXT or Markdown · private · max 120 KB</small></span><input type="file" accept=".txt,.md,text/plain,text/markdown" onChange={(event) => void readResume(item.id, event.target.files?.[0])}/></label>
                <Button variant="outline" size="sm" disabled={pendingAction === `publish:${item.id}`} onClick={() => void publish(item.id)}>{pendingAction === `publish:${item.id}` ? <><LoaderCircle className={styles.spin} size={14}/> Creating secure link…</> : <><Link2 size={14}/> Generate candidate link</>}</Button>
              </div>}
              {invitationUrl && <div className={styles.invitationBox}><div><CheckCircle2 size={15}/><span><strong>Invitation ready</strong><small>Single-use · expires in 7 days</small></span></div><div className={styles.linkRow}><input readOnly value={invitationUrl} onFocus={(event) => event.currentTarget.select()}/><Button size="sm" onClick={() => void copyInvitation(item.id)} disabled={pendingAction === `copy:${item.id}`}>{pendingAction === `copy:${item.id}` ? <LoaderCircle className={styles.spin} size={14}/> : copiedId === item.id ? <Check size={14}/> : <Clipboard size={14}/>} {copiedId === item.id ? 'Copied' : 'Copy link'}</Button></div></div>}
              {itemSessions.length > 0 && <div className={styles.sessionList}>{itemSessions.map((entry) => <div key={entry.id} className={styles.sessionRow}><span><i className={entry.status === 'completed' || entry.health === 'connected' || entry.health === 'healthy' ? styles.healthy : styles.warning}/><span><b>{entry.status === 'completed' ? 'Completed · analysis ready' : entry.status.replace('_', ' ')}</b><small>{new Date(entry.startedAt).toLocaleString()}</small></span></span>{entry.status === 'completed' && <button className={styles.analysisButton} disabled={pendingAction === `analysis:${entry.id}`} onClick={() => openAnalysis(entry.id)}>{pendingAction === `analysis:${entry.id}` ? <LoaderCircle className={styles.spin} size={15}/> : <FileText size={15}/>} Open full analysis <ArrowRight size={15}/></button>}</div>)}</div>}
            </article>;
          })}
        </CardContent></Card>
      </section>
      <footer className={styles.dashboardFoot}><ShieldCheck size={14}/> Every interview, invitation, session, resume, transcript, and artifact is scoped to this Google interviewer workspace.</footer>
    </main>
  </div>;
}
