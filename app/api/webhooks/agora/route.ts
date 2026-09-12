import { createHmac } from 'crypto';
import { NextResponse } from 'next/server';
import { stopInterviewAgent } from '@/lib/agora-server';
import { finalizeSessionAssessment } from '@/lib/assessment';
import { apiError } from '@/lib/http';
import { interviewStore } from '@/lib/interview-store';
import { constantTimeTextEqual } from '@/lib/security';

export async function POST(request: Request) {
  try {
    const secret = process.env.AGORA_WEBHOOK_SECRET;
    if (!secret) throw new Error('AGORA_WEBHOOK_SECRET is required');
    const raw = await request.text();
    const supplied = request.headers.get('x-agora-signature') ?? '';
    const expected = createHmac('sha256', secret).update(raw).digest('hex');
    if (!constantTimeTextEqual(supplied, expected)) throw new Error('Invalid webhook signature');
    const event = JSON.parse(raw) as { agent_id?: string; state?: string; eventType?: string };
    if (!event.agent_id) throw new Error('agent_id is required');
    const session = await interviewStore.getSessionByAgentId(event.agent_id);
    if (!session) return NextResponse.json({ accepted: true });
    await interviewStore.appendEvent(session.id, 'agora.webhook', { state: event.state, eventType: event.eventType });
    if (['STOPPED', 'FAILED', 'IDLE_TIMEOUT'].includes(String(event.state).toUpperCase()) && session.status === 'in_progress') {
      if (session.agoraAgentId && event.state !== 'STOPPED') await stopInterviewAgent(session.agoraAgentId).catch(() => {});
      await interviewStore.updateSession(session.id, { status: 'assessing', stateVersion: session.stateVersion + 1 }, session.stateVersion);
      await finalizeSessionAssessment(session.id);
    }
    return NextResponse.json({ accepted: true });
  } catch (error) {
    return apiError(error, 'Agora webhook failed');
  }
}
