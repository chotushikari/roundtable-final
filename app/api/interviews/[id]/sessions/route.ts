import { NextResponse } from 'next/server';
import { apiError } from '@/lib/http';
import { interviewStore } from '@/lib/interview-store';
import { requireCompanyContext } from '@/lib/supabase-admin';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const company = await requireCompanyContext(request);
    const { id } = await params;
    const interview = await interviewStore.getInterview(id, company.organizationId);
    if (!interview) throw new Error('Interview not found');
    const sessions = await interviewStore.listSessionsForInterview(id, company.organizationId);
    return NextResponse.json({
      sessions: await Promise.all(sessions.map(async (session) => {
        const invitation = await interviewStore.getInvitation(session.invitationId, company.organizationId);
        return {
        id: session.id,
        status: session.status,
        health: session.status === 'failed' ? 'error' : session.connectionHealth,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        jobCandidateId: invitation?.jobCandidateId ?? null,
        candidateName: invitation?.candidateName ?? null,
        };
      })),
    });
  } catch (error) {
    return apiError(error, 'Failed to list sessions');
  }
}
