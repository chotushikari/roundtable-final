import { NextResponse } from 'next/server';
import { requireCandidateSession } from '@/lib/api-auth';
import { apiError } from '@/lib/http';
import { getTavusConversationStatus } from '@/lib/tavus-service';
import { tavusSessionStore } from '@/lib/tavus-session-store';

export async function GET(request: Request) {
  try {
    if (process.env.ENABLE_TAVUS_AVATAR !== 'true') {
      return NextResponse.json({ status: 'disabled', conversationUrl: null });
    }

    const session = await requireCandidateSession(request);
    const entry = tavusSessionStore.get(session.id);

    if (!entry) {
      return NextResponse.json({ status: 'idle', conversationUrl: null });
    }

    const remote = await getTavusConversationStatus(entry.conversationId);
    return NextResponse.json({
      status: remote?.status ?? 'unknown',
      conversationUrl: entry.conversationUrl,
    });
  } catch (error) {
    return apiError(error, 'Failed to get avatar status');
  }
}
