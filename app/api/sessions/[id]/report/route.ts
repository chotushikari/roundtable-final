import { NextResponse } from 'next/server';
import { buildCompanyInterviewReport } from '@/lib/company-report';
import { apiError } from '@/lib/http';
import { interviewStore } from '@/lib/interview-store';
import { requireCompanyContext } from '@/lib/supabase-admin';
import { EVIDENCE_ASSESSMENT_VERSION, finalizeSessionAssessment } from '@/lib/assessment';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const company = await requireCompanyContext(request);
    const session = await interviewStore.getSession(id);
    if (!session || session.organizationId !== company.organizationId) throw new Error('Session not found');
    if (session.status !== 'completed') {
      return NextResponse.json({ session: { id: session.id, status: session.status }, report: null });
    }
    const [loadedAssessment, version, invitation, turns, analyses, code, canvas, toolRuns] = await Promise.all([
      interviewStore.getAssessment(id),
      interviewStore.getInterviewVersion(session.interviewVersionId),
      interviewStore.getInvitation(session.invitationId),
      interviewStore.listTurns(id),
      interviewStore.listAnalyses(id),
      interviewStore.getArtifact(id, 'code'),
      interviewStore.getArtifact(id, 'canvas'),
      interviewStore.listToolRuns(id),
    ]);
    let assessment = loadedAssessment;
    if (!assessment || !version) throw new Error('Completed interview report is not available yet');
    // Backfill reports created before the current evidence-attribution rules so
    // completed demos immediately benefit without requiring a new interview.
    if (!assessment.assessment.model.startsWith(EVIDENCE_ASSESSMENT_VERSION)) {
      await finalizeSessionAssessment(id);
      assessment = await interviewStore.getAssessment(id);
      if (!assessment) throw new Error('Completed interview report is not available yet');
    }
    return NextResponse.json({ report: buildCompanyInterviewReport({ session, invitation, version, assessment, turns, analyses, artifacts: { code, canvas }, toolRuns }) });
  } catch (error) {
    return apiError(error, 'Failed to load company interview report');
  }
}
