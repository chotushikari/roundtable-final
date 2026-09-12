import { NextResponse } from 'next/server';
import { requireCandidateSession } from '@/lib/api-auth';
import { stopInterviewAgents } from '@/lib/agora-server';
import { finalizeSessionAssessment } from '@/lib/assessment';
import { apiError } from '@/lib/http';
import { interviewStore } from '@/lib/interview-store';
import { z } from 'zod';

export const maxDuration = 60;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await requireCandidateSession(request, id);
    const body = await request.json().catch(() => ({}));
    const { endReason } = z.object({
      endReason: z.enum(['candidate', 'camera_absence']).optional(),
    }).parse(body);
    if (endReason === 'camera_absence') {
      const events = await interviewStore.listEvents(id);
      if (!events.some((event) => event.type === 'camera.presence_timeout')) {
        await interviewStore.appendEvent(id, 'camera.presence_timeout', { action: 'timeout' });
      }
    }
    if (session.agoraAgentId && !['completed', 'assessing'].includes(session.status)) {
      const events = await interviewStore.listEvents(id);
      const pool = [...events].reverse().find((event) => event.type === 'session.agent_pool')?.payload.agentIds as Record<string, string> | undefined;
      await stopInterviewAgents(pool ? Object.values(pool) : [session.agoraAgentId]);
      const fresh = (await interviewStore.getSession(id)) ?? session;
      await interviewStore.updateSession(id, {
        status: 'assessing',
        stateVersion: fresh.stateVersion + 1,
      }, fresh.stateVersion);
    }
    await finalizeSessionAssessment(id);
    return NextResponse.json({ success: true, status: 'completed', humanReviewRequired: true });
  } catch (error) {
    return apiError(error, 'Failed to finalize interview');
  }
}
