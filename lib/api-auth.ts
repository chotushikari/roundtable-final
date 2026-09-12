import { candidateCookieName, hashToken, verifyCandidateGrant } from '@/lib/security';
import { interviewStore } from '@/lib/interview-store';
import type { InterviewSessionRecord } from '@/types/interview';

function cookieValue(request: Request, name: string): string | null {
  const cookie = request.headers.get('cookie') ?? '';
  for (const item of cookie.split(';')) {
    const [key, ...parts] = item.trim().split('=');
    if (key === name) return decodeURIComponent(parts.join('='));
  }
  return null;
}

export async function requireCandidateSession(
  request: Request,
  expectedSessionId?: string,
): Promise<InterviewSessionRecord> {
  const grant = verifyCandidateGrant(cookieValue(request, candidateCookieName()));
  if (!grant || (expectedSessionId && grant.sessionId !== expectedSessionId)) {
    throw new Error('Candidate session authentication is required');
  }
  const session = await interviewStore.getSession(grant.sessionId);
  if (!session) throw new Error('Candidate session not found');
  return session;
}

export async function requireLlmSession(request: Request): Promise<InterviewSessionRecord> {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) throw new Error('LLM authentication is required');
  const raw = authorization.slice('Bearer '.length).trim();
  const session = await interviewStore.getSessionByLlmTokenHash(hashToken(raw));
  if (!session || Date.parse(session.expiresAt) <= Date.now()) throw new Error('Invalid or expired LLM credential');
  return session;
}
