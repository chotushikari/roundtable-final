import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireCandidateSession } from '@/lib/api-auth';
import { apiError } from '@/lib/http';
import { interviewStore } from '@/lib/interview-store';
import { demoQuestion } from '@/lib/demo-turns';
import { normalizeSpokenText } from '@/lib/interview-demo';
import { speakInterviewAgent } from '@/lib/agora-server';

const EventSchema = z.object({
  type: z.enum(['AGENT_STATE_CHANGED', 'METRICS', 'ERROR', 'CONNECTION_STATE', 'INTERRUPTED', 'QUESTION_DELIVERED', 'CAMERA_PRESENCE', 'SILENCE_NUDGE']),
  payload: z.record(z.string(), z.unknown()).default({}),
});

function sanitize(type: string, payload: Record<string, unknown>): Record<string, unknown> {
  if (type === 'METRICS') return { metrics: payload.metrics };
  if (type === 'ERROR') return { source: payload.source, code: payload.code, message: String(payload.message ?? '').slice(0, 500) };
  if (type === 'CONNECTION_STATE') return { state: payload.state, timestamp: payload.timestamp };
  if (type === 'AGENT_STATE_CHANGED') return { state: payload.state };
  if (type === 'CAMERA_PRESENCE') return {
    action: payload.action,
    missingAt: payload.missingAt,
    restoredAt: payload.restoredAt,
    durationMs: payload.durationMs,
  };
  if (type === 'SILENCE_NUDGE') return {};
  return { turnId: payload.turnId };
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await requireCandidateSession(request, id);
    const event = EventSchema.parse(await request.json());
    if (event.type === 'CAMERA_PRESENCE') {
      const cameraEvent = z.object({
        action: z.enum(['paused', 'restored', 'timeout']),
        missingAt: z.string().datetime().optional(),
        restoredAt: z.string().datetime().optional(),
        durationMs: z.number().int().min(0).max(86_400_000).optional(),
      }).parse(event.payload);
      const events = await interviewStore.listEvents(id);
      const latestCameraEvent = [...events].reverse().find((item) => [
        'camera.presence_paused',
        'camera.presence_restored',
        'camera.presence_timeout',
      ].includes(item.type));

      if (cameraEvent.action === 'paused') {
        let pauseEvent = latestCameraEvent;
        if (latestCameraEvent?.type !== 'camera.presence_paused') {
          pauseEvent = await interviewStore.appendEvent(id, 'camera.presence_paused', sanitize(event.type, cameraEvent));
        }
        const warningDelivered = events.some((item) => item.type === 'camera.presence_warning'
          && Date.parse(item.createdAt) >= Date.parse(pauseEvent!.createdAt));
        if (warningDelivered) return NextResponse.json({ accepted: true, warningDelivered: true }, { status: 202 });
        const fresh = (await interviewStore.getSession(id)) ?? session;
        if (fresh.agoraAgentId && fresh.agentUid && fresh.status === 'in_progress') {
          try {
            await speakInterviewAgent({
              agentId: fresh.agoraAgentId,
              channel: fresh.channelName,
              agentUid: fresh.agentUid,
              text: 'Please return to the camera when you can. The interview is paused.',
            });
            await interviewStore.appendEvent(id, 'camera.presence_warning', {});
            return NextResponse.json({ accepted: true, warningDelivered: true }, { status: 202 });
          } catch (error) {
            console.error('[camera-presence] could not deliver pause prompt', { sessionId: id, error });
          }
        }
        return NextResponse.json({ accepted: true, warningDelivered: false }, { status: 202 });
      }

      if (cameraEvent.action === 'restored') {
        if (latestCameraEvent?.type !== 'camera.presence_paused') {
          return NextResponse.json({ accepted: true }, { status: 202 });
        }
        await interviewStore.appendEvent(id, 'camera.presence_restored', sanitize(event.type, cameraEvent));
        const fresh = (await interviewStore.getSession(id)) ?? session;
        const pendingQuestion = fresh.pendingQuestion?.replace(/^\[interrupted\]\s*/i, '').trim();
        if (pendingQuestion && fresh.agoraAgentId && fresh.agentUid && fresh.status === 'in_progress') {
          try {
            await speakInterviewAgent({
              agentId: fresh.agoraAgentId,
              channel: fresh.channelName,
              agentUid: fresh.agentUid,
              text: `Welcome back. Let me repeat the question: ${pendingQuestion}`,
            });
            await interviewStore.appendEvent(id, 'camera.presence_resumed', {});
          } catch (error) {
            console.error('[camera-presence] could not repeat the pending question', { sessionId: id, error });
          }
        }
        return NextResponse.json({ accepted: true }, { status: 202 });
      }

      if (latestCameraEvent?.type !== 'camera.presence_timeout') {
        await interviewStore.appendEvent(id, 'camera.presence_timeout', sanitize(event.type, cameraEvent));
      }
      return NextResponse.json({ accepted: true, status: 'ended_camera_absence', humanReviewRequired: true }, { status: 202 });
    }
    if (event.type === 'SILENCE_NUDGE') {
      const fresh = (await interviewStore.getSession(id)) ?? session;
      if (fresh.agoraAgentId && fresh.agentUid && fresh.status === 'in_progress') {
        const nudges = [
          "Take your time, I'm here when you're ready.",
          "Do you need a moment to think?",
          "Let me know if you need me to repeat the question.",
          "I'm still here. Just let me know when you're ready to continue.",
        ];
        const randomNudge = nudges[Math.floor(Math.random() * nudges.length)];
        try {
          await speakInterviewAgent({
            agentId: fresh.agoraAgentId,
            channel: fresh.channelName,
            agentUid: fresh.agentUid,
            text: randomNudge,
          });
          await interviewStore.appendEvent(id, 'silence.nudge', { text: randomNudge });
        } catch (error) {
          console.error('[silence-nudge] could not deliver nudge', { sessionId: id, error });
        }
      }
      return NextResponse.json({ accepted: true }, { status: 202 });
    }
    if (event.type === 'QUESTION_DELIVERED') {
      const fresh = (await interviewStore.getSession(id)) ?? session;
      const question = demoQuestion(fresh);
      const text = z.string().max(4000).parse(event.payload.text);
      if (event.payload.questionId !== question.id
        || !normalizeSpokenText(text).includes(normalizeSpokenText(question.text))) {
        return NextResponse.json({ accepted: false }, { status: 409 });
      }
      const events = await interviewStore.listEvents(id);
      if (!events.some((item) => item.type === 'question.delivered' && item.payload.questionId === question.id)) {
        await interviewStore.appendEvent(id, 'question.delivered', { questionId: question.id });
      }
      return NextResponse.json({ accepted: true }, { status: 202 });
    }
    if (event.type === 'INTERRUPTED') {
      await interviewStore.markLatestInterviewerTurnInterrupted(id);
      const analyses = await interviewStore.listAnalyses(id);
      const latest = analyses.at(-1);
      const fresh = (await interviewStore.getSession(id)) ?? session;
      await interviewStore.updateSession(id, {
        askedMustAsk: latest?.decision.reasonCode === 'must_ask'
          ? fresh.askedMustAsk.filter((question) => question !== latest.decision.objective)
          : fresh.askedMustAsk,
        stateVersion: fresh.stateVersion + 1,
      }, fresh.stateVersion);
    }
    if (event.type === 'CONNECTION_STATE') {
      const state = String(event.payload.state ?? '').toUpperCase();
      const connectionHealth = state === 'CONNECTED'
        ? 'connected'
        : state === 'RECONNECTING' || state === 'CONNECTING'
          ? 'degraded'
          : 'disconnected';
      const fresh = await interviewStore.getSession(id);
      if (fresh && fresh.connectionHealth !== connectionHealth) {
        await interviewStore.updateSession(id, {
          connectionHealth,
        }).catch(() => {});
      }
    }
    await interviewStore.appendEvent(id, event.type.toLocaleLowerCase(), sanitize(event.type, event.payload));
    return NextResponse.json({ accepted: true }, { status: 202 });
  } catch (error) {
    return apiError(error, 'Failed to record session event');
  }
}
