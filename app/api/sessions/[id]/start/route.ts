import { NextResponse } from 'next/server';
import { requireCandidateSession } from '@/lib/api-auth';
import { startInterviewAgent, stopInterviewAgents } from '@/lib/agora-server';
import { apiError } from '@/lib/http';
import { interviewStore } from '@/lib/interview-store';
import { createOpaqueToken, hashToken } from '@/lib/security';
import { demoWelcome } from '@/lib/interview-demo';

export const maxDuration = 60;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    let session = await requireCandidateSession(request, id);
    if (session.agoraAgentId && session.status === 'in_progress') {
      return NextResponse.json({ agentId: session.agoraAgentId, status: session.status });
    }
    if (session.status === 'starting') {
      // If another request is currently starting the agent, wait up to 10s for it to finish.
      for (let i = 0; i < 20; i++) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const check = await interviewStore.getSession(id);
        if (check?.agoraAgentId && check.status === 'in_progress') {
          return NextResponse.json({ agentId: check.agoraAgentId, status: check.status });
        }
        if (check?.status !== 'starting') break;
      }
      const latest = await interviewStore.getSession(id);
      if (latest?.agoraAgentId && latest.status === 'in_progress') {
        return NextResponse.json({ agentId: latest.agoraAgentId, status: latest.status });
      }
      return NextResponse.json({ agentId: latest?.agoraAgentId ?? null, status: latest?.status ?? 'starting' }, { status: 202 });
    }
    if (session.status !== 'ready') throw new Error('Session is not available to start');

    const llmToken = createOpaqueToken();
    session = await interviewStore.updateSession(id, {
      status: 'starting',
      llmTokenHash: hashToken(llmToken),
      stateVersion: session.stateVersion + 1,
    }, session.stateVersion);

    const version = await interviewStore.getInterviewVersion(session.interviewVersionId);
    if (!version) throw new Error('Published interview plan not found');
    const invitation = await interviewStore.getInvitation(session.invitationId);
    let agentIds: Record<string, string> = {};
    try {
      agentIds = await startInterviewAgent({
        sessionId: session.id,
        channel: session.channelName,
        rtcUid: session.rtcUid,
        llmToken,
        roleTitle: version.definition.roleTitle,
        durationMinutes: version.definition.durationMinutes,
        demoMode: version.definition.demoMode,
        candidateName: invitation?.candidateName,
        panelRoleCount: version.definition.panelRoles.length,
        panelRoles: version.definition.panelRoles,
      });
      const agentId = agentIds.hiring_manager ?? agentIds[version.definition.panelRoles[0]] ?? null;
      if (!agentId) throw new Error('No interview role agents were started');
      // The managed agent speaks this greeting before any candidate turn. Keep
      // the exact server-owned text in the durable transcript as well.
      if (version.definition.demoMode) {
        await interviewStore.createTurn({
          sessionId: session.id,
          speaker: 'interviewer',
          speakerRole: version.definition.panelRoles.includes('hiring_manager') ? 'hiring_manager' : version.definition.panelRoles[0],
          text: demoWelcome(invitation?.candidateName, version.definition.panelRoles.length),
          status: 'final',
          dedupeKey: `opening-greeting:${session.id}`,
        });
      }
      const fresh = (await interviewStore.getSession(id)) ?? session;
      if (fresh.status === 'completed' || fresh.status === 'failed') {
        await stopInterviewAgents(Object.values(agentIds)).catch(() => {});
        throw new Error('Session is no longer active');
      }
      // Authoritatively update session with agentId and move to in_progress.
      // Do not use optimistic locking here to avoid race conditions with telemetry/connection events.
      const updated = await interviewStore.updateSession(id, {
        agoraAgentId: agentId,
        status: 'in_progress',
        startedAt: fresh.startedAt || new Date().toISOString(),
        stateVersion: fresh.stateVersion + 1,
      });
      await interviewStore.appendEvent(id, 'session.agent_pool', { agentIds }).catch(() => {});
      await interviewStore.appendEvent(id, 'session.started', { agentId }).catch(() => {});
      return NextResponse.json({ agentId, status: updated.status });
    } catch (error) {
      console.error('[sessions/start] agent start failure:', { id, agentIds: Object.keys(agentIds), error });
      // Only stop the agent if the session did NOT transition to in_progress
      if (Object.keys(agentIds).length) {
        const latest = await interviewStore.getSession(id).catch(() => null);
        if (latest?.status !== 'in_progress') {
          await stopInterviewAgents(Object.values(agentIds)).catch(() => {});
        }
      }
      const fresh = await interviewStore.getSession(id).catch(() => null);
      if (fresh?.status === 'starting') {
        await interviewStore.updateSession(id, {
          status: 'failed',
          connectionHealth: 'disconnected',
          stateVersion: fresh.stateVersion + 1,
        }).catch(() => {});
      }
      await interviewStore.appendEvent(id, 'session.start_failed', {
        message: error instanceof Error ? error.message : 'unknown',
      }).catch(() => {});
      throw error;
    }
  } catch (error) {
    return apiError(error, 'Failed to start interview agent');
  }
}
