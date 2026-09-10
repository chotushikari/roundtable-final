import { NextResponse } from 'next/server';
import { requireCandidateSession } from '@/lib/api-auth';
import { apiError } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SIMLI_API = 'https://api.simli.ai';

type SimliTokenResponse = { session_token?: unknown };

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await requireCandidateSession(request, id);
    if (!['ready', 'in_progress'].includes(session.status)) {
      return NextResponse.json({ enabled: false, reason: 'Avatar presentation is available only during an active interview.' }, { status: 409 });
    }

    const apiKey = process.env.SIMLI_API_KEY?.trim();
    const faceId = process.env.SIMLI_FACE_ID?.trim();
    if (!apiKey || !faceId) {
      return NextResponse.json(
        { enabled: false, reason: 'Avatar presentation is not configured.' },
        { status: 503 },
      );
    }

    const headers = { 'Content-Type': 'application/json', 'x-simli-api-key': apiKey };
    const [tokenResponse, iceResponse] = await Promise.all([
      fetch(`${SIMLI_API}/compose/token`, {
        method: 'POST', headers, cache: 'no-store',
        body: JSON.stringify({ faceId, handleSilence: true, maxSessionLength: 720, maxIdleTime: 90, model: 'fasttalk' }),
      }),
      fetch(`${SIMLI_API}/compose/ice`, { method: 'GET', headers, cache: 'no-store' }),
    ]);

    if (!tokenResponse.ok || !iceResponse.ok) {
      console.error('Simli avatar bootstrap failed', { tokenStatus: tokenResponse.status, iceStatus: iceResponse.status });
      return NextResponse.json({ enabled: false, reason: 'Avatar presentation is temporarily unavailable.' }, { status: 502 });
    }
    const token = await tokenResponse.json() as SimliTokenResponse;
    const iceServers: unknown = await iceResponse.json();
    if (typeof token.session_token !== 'string' || !Array.isArray(iceServers)) {
      return NextResponse.json({ enabled: false, reason: 'Avatar presentation returned an invalid session.' }, { status: 502 });
    }

    // This short-lived token is deliberately scoped to the visual avatar session.
    // The Simli account key never leaves this server.
    return NextResponse.json({ enabled: true, sessionToken: token.session_token, iceServers });
  } catch (error) {
    return apiError(error, 'Could not prepare avatar presentation');
  }
}
