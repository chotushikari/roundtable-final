import { NextResponse } from 'next/server';
import { requireCandidateSession } from '@/lib/api-auth';
import { stopInterviewAgents } from '@/lib/agora-server';
import { apiError } from '@/lib/http';
import { interviewStore } from '@/lib/interview-store';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await requireCandidateSession(request, id);
    if (['assessing', 'completed'].includes(session.status)) return NextResponse.json({ success: true, status: session.status });
    if (session.agoraAgentId) {
      const events = await interviewStore.listEvents(id);
      const pool = [...events].reverse().find((event) => event.type === 'session.agent_pool')?.payload.agentIds as Record<string, string> | undefined;
      await stopInterviewAgents(pool ? Object.values(pool) : [session.agoraAgentId]);
    }
    const updated = await interviewStore.updateSession(id, {
      status: 'assessing',
      stateVersion: session.stateVersion + 1,
    }, session.stateVersion);
    await interviewStore.appendEvent(id, 'session.stopped', {});
    return NextResponse.json({ success: true, status: updated.status });
  } catch (error) {
    return apiError(error, 'Failed to stop interview session');
  }
}
