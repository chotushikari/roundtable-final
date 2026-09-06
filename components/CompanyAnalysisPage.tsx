'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient, type Session } from '@supabase/supabase-js';
import { ArrowLeft, BarChart3, LoaderCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { CompanyInterviewReportView } from '@/components/CompanyInterviewReportView';
import { RoundTableLoadingScreen } from '@/components/RoundTableLoadingScreen';
import { Button } from '@/components/ui/button';
import type { CompanyInterviewReport } from '@/types/interview';
import styles from './CompanyAnalysisPage.module.css';

export function CompanyAnalysisPage({ sessionId }: { sessionId: string }) {
  const companyAuthDisabled = process.env.NEXT_PUBLIC_DISABLE_COMPANY_AUTH === 'true';
  const supabase = useMemo(() => {
    if (companyAuthDisabled || process.env.NEXT_PUBLIC_DEMO_MODE === 'true') return null;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    return url && key ? createClient(url, key) : null;
  }, [companyAuthDisabled]);
  const [authReady, setAuthReady] = useState(!supabase);
  const [session, setSession] = useState<Session | null>(null);
  const [report, setReport] = useState<CompanyInterviewReport | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState<'load' | 'release' | 'google' | null>('load');

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => { setSession(next); setAuthReady(true); });
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  const load = useCallback(async () => {
    if (!authReady || (supabase && !session)) return;
    setPending('load');
    setError('');
    const headers: Record<string, string> = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
    try {
      const response = await fetch(`/api/sessions/${sessionId}/report`, { headers });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Could not load analysis');
      setReport(data.report ?? data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load analysis');
    } finally { setPending(null); }
  }, [authReady, session, sessionId, supabase]);

  useEffect(() => { void load(); }, [load]);

  async function googleSignIn() {
    if (!supabase) return;
    setPending('google');
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google', options: { redirectTo: window.location.href },
    });
    if (authError) { setError(authError.message); setPending(null); }
  }

  async function releaseFeedback() {
    if (!report) return;
    setPending('release');
    setError('');
    const headers: Record<string, string> = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
    try {
      const response = await fetch(`/api/sessions/${report.session.id}/release`, { method: 'POST', headers });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Could not release candidate summary');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not release candidate summary');
      setPending(null);
    }
  }

  if (!authReady || (pending === 'load' && !report && !error)) return <RoundTableLoadingScreen label="Building interview analysis" sublabel="Loading transcript and saved workspace evidence"/>;

  if (supabase && !session) return <main className={styles.gate}><div className={styles.gateCard}><BarChart3/><span>PRIVATE ANALYSIS</span><h1>Sign in to review this interview</h1><p>This report is available only to the Google interviewer workspace that created the invitation.</p><Button onClick={googleSignIn} disabled={pending === 'google'}>{pending === 'google' ? <LoaderCircle className={styles.spin} size={16}/> : <ShieldCheck size={16}/>} Continue with Google</Button>{error && <small>{error}</small>}</div></main>;

  return <div className={styles.page}>
    <header className={styles.topbar}><Link href="/company"><ArrowLeft size={15}/> Back to dashboard</Link><span><i/> RoundTable AI</span><Button variant="outline" size="sm" onClick={() => void load()} disabled={pending === 'load'}>{pending === 'load' ? <LoaderCircle className={styles.spin} size={14}/> : <RefreshCw size={14}/>} Refresh</Button></header>
    <main className={styles.shell}>
      <div className={styles.heading}><span>INTERVIEW ANALYSIS</span><h1>Evidence, not guesswork.</h1><p>Transcript findings and completed workspace artifacts are presented together for a human reviewer.</p></div>
      {error && <div className={styles.error} role="alert">{error}</div>}
      {report && <CompanyInterviewReportView report={report} onRelease={() => void releaseFeedback()} releasePending={pending === 'release'}/>} 
    </main>
  </div>;
}
