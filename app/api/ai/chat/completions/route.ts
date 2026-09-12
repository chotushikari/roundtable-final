import { createHash, randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { requireLlmSession } from '@/lib/api-auth';
import { apiError } from '@/lib/http';
import {
  classifyCandidateConversationControl,
  processCandidateTurn,
  processConversationControlTurn,
} from '@/lib/interview-controller';
import { interviewStore } from '@/lib/interview-store';
import { DEMO_CLOSING } from '@/lib/interview-demo';
import { advanceDemoWorkspace, processDemoAnswer } from '@/lib/demo-turns';
import { workspaceCommand, respondToWorkspaceAttempt, respondToWorkspaceCommand } from '@/lib/workspace-conversation';

export const maxDuration = 60;

type ChatMessage = { role?: string; content?: unknown };
type ChatBody = { messages?: ChatMessage[]; stream?: boolean; model?: string; [key: string]: unknown };

function messageText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object' && 'text' in item) return String((item as { text?: unknown }).text ?? '');
      return '';
    }).join(' ');
  }
  return '';
}

function sseResponse(text: string): NextResponse {
  const encoder = new TextEncoder();
  const id = `chatcmpl-${randomUUID()}`;
  const created = Math.floor(Date.now() / 1_000);
  const chunks = text.match(/\S+\s*/g) ?? [text];
  const stream = new ReadableStream({
    start(controller) {
      const emit = (delta: Record<string, unknown>, finishReason: string | null = null) => controller.enqueue(encoder.encode(`data: ${JSON.stringify({ id, object: 'chat.completion.chunk', created, model: 'roundtable-controller', choices: [{ index: 0, delta, finish_reason: finishReason }] })}\n\n`));
      emit({ role: 'assistant', content: '' });
      for (const chunk of chunks) emit({ content: chunk });
      emit({}, 'stop');
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });
  return new NextResponse(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive' } });
}

function isWorkspaceContinue(answer: string): boolean {
  const normalized = answer.trim().toLocaleLowerCase().replace(/[.!?]+$/g, '');
  if (normalized.split(/\s+/).filter(Boolean).length > 12) return false;
  return /\b(?:continue|next question)(?:\s+(?:now|please|for(?:\s+the)?\s+next\s+panel(?:\s+perspective)?))?\b/.test(normalized);
}

export async function POST(request: Request) {
  const receivedAt = Date.now();
  try {
    const session = await requireLlmSession(request);
    if (!['ready', 'starting', 'in_progress'].includes(session.status)) throw new Error('Session is not active');
    if (session.status === 'starting') {
      await interviewStore.updateSession(session.id, { status: 'in_progress' }).catch(() => {});
    }
    if (session.phase === 'wrap_up') {
      const version = await interviewStore.getInterviewVersion(session.interviewVersionId);
      if (version?.definition.demoMode) return sseResponse(DEMO_CLOSING);
    }
    let body: ChatBody;
    try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const latestUser = [...messages].reverse().find((message) => message.role === 'user');
    const answer = messageText(latestUser?.content).trim();
    // Agora may probe the custom LLM immediately after joining, before STT
    // delivers a candidate turn. Returning a 4xx makes this look like an LLM
    // authentication failure and can destabilize an otherwise healthy call.
    if (!answer) return sseResponse('');
    // Caller-provided system messages and model names are intentionally ignored.
    const contextId = createHash('sha256').update(JSON.stringify(messages.slice(-6))).digest('hex');
    const workspaceAction = workspaceCommand(answer);
    if (workspaceAction) return sseResponse(await respondToWorkspaceCommand(session, workspaceAction, contextId, answer));
    const version = await interviewStore.getInterviewVersion(session.interviewVersionId);
    // In a demo, “continue” is an explicit skip for a workspace explanation.
    // It must advance the pending panel role before generic repeat handling.
    if (version?.definition.demoMode && isWorkspaceContinue(answer)) {
      if (session.currentModality === 'code' || session.currentModality === 'canvas') {
        return sseResponse(await advanceDemoWorkspace({ session, upstreamTurnId: contextId, outcome: 'skipped' }));
      }
      // Candidate-directed workspace completion is deliberate. It must not be
      // blocked by a missing client receipt for the prior question, otherwise
      // the panel gets stuck repeating the same technical task.
      return sseResponse(await processDemoAnswer({ session, answer, upstreamTurnId: contextId, allowUndeliveredSkip: true }));
    }
    const control = classifyCandidateConversationControl(answer);
    if (control) {
      if (control === 'backchannel') {
        // Listening expressions ("mhm", "yeah", "umm", "i see") must not interrupt
        // or trigger an AI reset turn — allow the AI interviewer to continue speaking.
        return sseResponse('');
      }
      const responseText = await processConversationControlTurn({
        session,
        answer,
        control,
        upstreamTurnId: contextId,
      });
      return sseResponse(responseText);
    }
    // A workspace explanation is contextual work, not a scored voice answer.
    // Preserve it as a bounded attempt and let the candidate leave after up to
    // three attempts; never pretend an unfinished artifact is complete.
    if (version?.definition.demoMode && (session.currentModality === 'code' || session.currentModality === 'canvas')) {
      return sseResponse(await respondToWorkspaceAttempt(session, contextId, answer));
    }
    if (version?.definition.demoMode) {
      return sseResponse(await processDemoAnswer({ session, answer, upstreamTurnId: contextId }));
    }
    const result = await processCandidateTurn({ session, answer, upstreamTurnId: contextId });
    await interviewStore.appendEvent(session.id, 'llm.response_ready', {
      durationMs: Date.now() - receivedAt,
      role: result.decision.activeSpeakerRole,
      reasonCode: result.decision.reasonCode,
      modality: result.decision.modality,
      difficulty: result.decision.difficulty,
    }).catch(() => {});
    return sseResponse(result.responseText);
  } catch (error) {
    return apiError(error, 'Adaptive interview response failed');
  }
}
