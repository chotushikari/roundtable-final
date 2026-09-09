import assert from 'node:assert/strict';
import test from 'node:test';
import { buildEvidenceAssessment } from '@/lib/assessment';
import { buildCompanyInterviewReport } from '@/lib/company-report';
import { buildFallbackPlan } from '@/lib/interview-planner';
import type { AssessmentRecord, InterviewDefinitionRecord, InterviewSessionRecord, InterviewVersionRecord, TranscriptTurnRecord, TurnAnalysisRecord } from '@/types/interview';

const organizationId = crypto.randomUUID();
const sessionId = crypto.randomUUID();
const turnId = crypto.randomUUID();
const definition: InterviewDefinitionRecord = {
  id: crypto.randomUUID(), organizationId, title: 'Intern engineering panel', roleTitle: 'Software Engineer Intern',
  jdText: 'A sufficiently detailed job description for a junior engineer building reliable services for customers.',
  desiredOutcomes: ['Explain code'], panelRoles: ['technical', 'product'], mustAskQuestions: ['Explain a trade-off'], mustCoverTopics: [], durationMinutes: 30, instructions: '',
  status: 'ready', plan: null, planVersion: 1, createdAt: '2026-09-05T10:00:00.000Z', updatedAt: '2026-09-05T10:00:00.000Z',
};
const plan = buildFallbackPlan(definition);
const turn: TranscriptTurnRecord = {
  id: turnId, sessionId, sequence: 1, speaker: 'candidate', speakerRole: null, text: 'I implemented a cache and reduced latency.', status: 'final', dedupeKey: 'candidate-1', createdAt: '2026-09-05T10:02:00.000Z',
};
const analysis: TurnAnalysisRecord = {
  id: crypto.randomUUID(), sessionId, turnId,
  analysis: {
    roleFindings: [{ role: 'technical', observations: ['implemented cache'], strengths: ['concrete detail'], gaps: [] }, { role: 'product', observations: [], strengths: [], gaps: ['customer metric missing'] }],
    competencyEvidence: [{ competencyId: 'technical_execution', rating: 3, confidence: 0.8, quote: 'implemented a cache' }],
    vague: false, vagueReason: '', contradictions: [], recommendedDifficultyDelta: 0, recommendedRole: 'product', recommendedObjective: 'Ask for customer impact', recommendedModality: 'voice', addressedTopics: ['latency'], toolRequest: null,
  },
  decision: { activeSpeakerRole: 'product', objective: 'Ask for customer impact', modality: 'voice', difficulty: 3, reasonCode: 'cross_functional_gap', remainingCoverage: [], roleHandoff: true },
  responseText: 'What customer outcome improved?', model: 'test', createdAt: turn.createdAt,
};
const followUpTurn: TranscriptTurnRecord = {
  id: crypto.randomUUID(), sessionId, sequence: 2, speaker: 'interviewer', speakerRole: 'product', text: 'What customer outcome improved?', status: 'final', dedupeKey: 'interviewer-2', createdAt: '2026-09-05T10:02:05.000Z',
};

test('company report contains only a stable evidence projection', () => {
  const assessment: AssessmentRecord = {
    id: crypto.randomUUID(), sessionId,
    assessment: buildEvidenceAssessment({ plan, planVersion: 1, roles: definition.panelRoles, turns: [turn, followUpTurn], analyses: [analysis] }),
    releasedAt: null, createdAt: turn.createdAt, updatedAt: turn.createdAt,
  };
  const session: InterviewSessionRecord = {
    id: sessionId, invitationId: crypto.randomUUID(), interviewId: definition.id, interviewVersionId: crypto.randomUUID(), organizationId,
    status: 'completed', connectionHealth: 'connected', channelName: 'test', rtcUid: '1', agentUid: '2', agoraAgentId: null, llmTokenHash: 'hash', activeRole: 'product', previousRole: 'technical', consecutiveRoleTurns: 1, currentModality: 'voice', phase: 'wrap_up', competencyState: {}, askedMustAsk: ['Explain a trade-off'], coveredTopics: ['cache'], pendingQuestion: null, stateVersion: 1, toolRunCount: 0, startedAt: '2026-09-05T10:00:00.000Z', completedAt: '2026-09-05T10:05:00.000Z', expiresAt: '2026-09-05T11:00:00.000Z',
  };
  const version: InterviewVersionRecord = { id: session.interviewVersionId, interviewId: definition.id, organizationId, version: 1, definition, plan, promptVersion: 'test', createdAt: session.startedAt };
  const report = buildCompanyInterviewReport({ session, invitation: { id: session.invitationId, interviewId: definition.id, interviewVersionId: version.id, organizationId, tokenHash: 'hash', expiresAt: session.expiresAt, revokedAt: null, claimedAt: session.startedAt, candidateName: 'Asha', candidateEmail: 'asha@example.test', resumePath: null, createdAt: session.startedAt }, version, assessment, turns: [turn, followUpTurn], analyses: [analysis], artifacts: { code: { id: crypto.randomUUID(), sessionId, type: 'code', version: 2, content: { language: 'typescript', source: 'function cache() { return true; }' }, createdAt: turn.createdAt, updatedAt: turn.createdAt }, canvas: null }, toolRuns: [] });
  assert.equal(report.session.durationSeconds, 300);
  assert.equal(report.candidate.name, 'Asha');
  assert.deepEqual(report.coverage.mustAsk, [{ question: 'Explain a trade-off', status: 'asked' }]);
  assert.ok(report.transcript[0].evidenceReferences.includes('Competency: Technical execution'));
  assert.equal(report.transcript[0].adaptation.vague, false);
  assert.equal(report.transcript[0].adaptation.askReason, null);
  assert.equal(report.transcript[1].adaptation.askReason, 'cross_functional_gap');
  assert.equal(report.transcript[1].adaptation.roleHandoff, true);
  assert.deepEqual(report.workspace.code.functions, ['cache']);
  assert.equal(report.summary.humanReviewRequired, true);
});
