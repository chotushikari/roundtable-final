import { NextResponse } from 'next/server';
import { requireCandidateSession } from '@/lib/api-auth';
import { apiError } from '@/lib/http';
import { endTavusConversation } from '@/lib/tavus-service';
import { tavusSessionStore } from '@/lib/tavus-session-store';

export async function POST(request: Request) {
  try {
    if (process.env.ENABLE_TAVUS_AVATAR !== 'true') {
      return NextResponse.json({ stopped: true }, { status: 200 });
    }

    const session = await requireCandidateSession(request);
    const entry = tavusSessionStore.get(session.id);

    if (!entry) {
      // Already stopped or never started — idempotent
      console.info('[avatar] Tavus stop requested but no active session for', session.id);
      return NextResponse.json({ stopped: true, reason: 'not_found' });
    }

    console.info('[avatar] stopping Tavus session', {
      sessionId: session.id,
      conversationId: entry.conversationId,
    });

    await endTavusConversation(entry.conversationId);
    tavusSessionStore.delete(session.id);

    console.info('[avatar] Tavus session stopped', { sessionId: session.id });
    return NextResponse.json({ stopped: true });
  } catch (error) {
    // A stop failure must never crash the interview — log and return success
    console.error('[avatar] Failed to stop Tavus session (non-fatal)', error);
    return NextResponse.json({ stopped: true, error: 'stop_failed_non_fatal' });
  }
}
