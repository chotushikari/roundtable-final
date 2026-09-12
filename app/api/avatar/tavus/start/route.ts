import { NextResponse } from 'next/server';
import { requireCandidateSession } from '@/lib/api-auth';
import { apiError } from '@/lib/http';
import { startTavusConversation } from '@/lib/tavus-service';
import { tavusSessionStore } from '@/lib/tavus-session-store';

export async function POST(request: Request) {
  try {
    if (process.env.ENABLE_TAVUS_AVATAR !== 'true') {
      return NextResponse.json(
        { error: 'Tavus avatar is not enabled on this deployment.' },
        { status: 503 },
      );
    }

    const session = await requireCandidateSession(request);

    // Idempotency guard: return existing session if already started.
    const existing = tavusSessionStore.get(session.id);
    if (existing) {
      console.info('[avatar] Tavus session already active for session', session.id);
      return NextResponse.json({
        conversationUrl: existing.conversationUrl,
        status: 'active',
      });
    }

    console.info('[avatar] starting Tavus session for interview session', session.id);
    const result = await startTavusConversation(session.id);

    tavusSessionStore.set(session.id, {
      conversationId: result.conversationId,
      conversationUrl: result.conversationUrl,
    });

    console.info('[avatar] Tavus session started', {
      sessionId: session.id,
      conversationId: result.conversationId,
    });

    return NextResponse.json({
      conversationUrl: result.conversationUrl,
      status: result.status,
    });
  } catch (error) {
    console.error('[avatar] Failed to start Tavus session', error);
    return apiError(error, 'Failed to start avatar session');
  }
}
