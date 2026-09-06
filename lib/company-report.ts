import type {
  AssessmentRecord,
  CompanyInterviewReport,
  InterviewSessionRecord,
  InterviewVersionRecord,
  InvitationRecord,
  TranscriptTurnRecord,
  TurnAnalysisRecord,
  ToolRunRecord,
  WorkspaceArtifactRecord,
} from '@/types/interview';

function durationSeconds(startedAt: string, completedAt: string | null): number | null {
  if (!completedAt) return null;
  const duration = Date.parse(completedAt) - Date.parse(startedAt);
  return Number.isFinite(duration) && duration >= 0 ? Math.round(duration / 1_000) : null;
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function codeSummary(artifact: WorkspaceArtifactRecord | null): CompanyInterviewReport['workspace']['code'] {
  const content = record(artifact?.content);
  const checkpoint = record(content?.checkpoint);
  const source = typeof content?.source === 'string' && content.source.trim()
    ? content.source
    : typeof checkpoint?.source === 'string'
      ? checkpoint.source
      : '';
  const language = typeof content?.language === 'string'
    ? content.language
    : typeof checkpoint?.language === 'string'
      ? checkpoint.language
      : null;
  const functions = [...source.matchAll(/(?:^|\n)\s*(?:async\s+)?(?:function\s+|def\s+|const\s+)([A-Za-z_$][\w$]*)/g)]
    .map((match) => match[1])
    .slice(0, 12);
  return {
    available: Boolean(source.trim()),
    version: artifact?.version ?? null,
    language,
    nonEmptyLines: source.split('\n').filter((line) => line.trim()).length,
    functions,
    source: source.trim() ? source : null,
  };
}

function canvasSummary(artifact: WorkspaceArtifactRecord | null): CompanyInterviewReport['workspace']['canvas'] {
  const content = record(artifact?.content);
  const freehand = record(content?.freehand);
  const checkpoint = record(content?.checkpoint);
  const checkpointFreehand = record(checkpoint?.freehand);
  const rawElements = Array.isArray(freehand?.elements) && freehand.elements.length > 0
    ? freehand.elements
    : Array.isArray(checkpointFreehand?.elements)
      ? checkpointFreehand.elements
      : [];
  const elements = rawElements;
  const labels = elements
    .filter((element): element is Record<string, unknown> => Boolean(record(element)))
    .filter((element) => element.type === 'text' && typeof element.text === 'string')
    .map((element) => String(element.text).trim())
    .filter(Boolean)
    .slice(0, 24);
  const arrowCount = elements.filter((element) => record(element)?.type === 'arrow').length;
  return {
    available: elements.length > 0,
    version: artifact?.version ?? null,
    elementCount: elements.length,
    labels,
    arrowCount,
    elements: elements.length > 0 ? elements : [],
  };
}

function evidenceByTurn(assessment: AssessmentRecord, turns: TranscriptTurnRecord[]) {
  const result = new Map<string, string[]>();
  const add = (turnId: string | undefined, label: string) => {
    if (!turnId || !turns.some((turn) => turn.id === turnId)) return;
    result.set(turnId, [...new Set([...(result.get(turnId) ?? []), label])]);
  };
  for (const competency of assessment.assessment.competencies) {
    competency.evidence.forEach((evidence) => add(evidence.turnId, `Competency: ${competency.name}`));
  }
  for (const roleView of assessment.assessment.roleViews) {
    roleView.evidence.forEach((evidence) => add(evidence.turnId, `Panel: ${roleView.role}`));
  }
  return result;
}

export function buildCompanyInterviewReport({
  session,
  invitation,
  version,
  assessment,
  turns,
  analyses,
  artifacts,
  toolRuns,
}: {
  session: InterviewSessionRecord;
  invitation: InvitationRecord | null;
  version: InterviewVersionRecord;
  assessment: AssessmentRecord;
  turns: TranscriptTurnRecord[];
  analyses: TurnAnalysisRecord[];
  artifacts: { code: WorkspaceArtifactRecord | null; canvas: WorkspaceArtifactRecord | null };
  toolRuns: ToolRunRecord[];
}): CompanyInterviewReport {
  const report = assessment.assessment;
  const evidence = evidenceByTurn(assessment, turns);
  const rolesWithEvidence = report.roleViews
    .filter((view) => view.evidence.length > 0)
    .map((view) => view.role);
  const asked = new Set(session.askedMustAsk);
  const addressedTopics = new Set([
    ...session.coveredTopics,
    ...analyses.flatMap((item) => item.analysis.addressedTopics),
  ]);
  const linearRuns = toolRuns.filter((run) => run.name.startsWith('linear_'));
  const posted = [...linearRuns].reverse().find((run) => run.name === 'linear_post_comment' && run.status === 'completed');
  const postedOutput = record(posted?.output);
  return {
    session: {
      id: session.id,
      status: session.status,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      durationSeconds: durationSeconds(session.startedAt, session.completedAt),
      connectionHealth: session.connectionHealth,
    },
    candidate: { name: invitation?.candidateName ?? null, email: invitation?.candidateEmail ?? null },
    interview: {
      title: version.definition.title,
      roleTitle: version.definition.roleTitle,
      panelRoles: version.definition.panelRoles,
      rubricVersion: version.version,
    },
    summary: {
      overallSummary: report.overallSummary,
      strengths: report.strengths,
      growthAreas: report.growthAreas,
      suggestedHumanFollowUps: report.suggestedHumanFollowUps,
      humanReviewRequired: true,
    },
    competencies: report.competencies,
    roleViews: report.roleViews,
    coverage: {
      ...report.coverage,
      mustAsk: version.definition.mustAskQuestions.map((question) => ({ question, status: asked.has(question) ? 'asked' : 'not_reached' })),
      topicsExplored: [...addressedTopics],
      rolesWithEvidence,
    },
    unresolvedContradictions: report.unresolvedContradictions,
    transcript: turns.map((turn) => ({
      id: turn.id,
      sequence: turn.sequence,
      speaker: turn.speaker,
      speakerRole: turn.speakerRole,
      text: turn.text,
      status: turn.status,
      createdAt: turn.createdAt,
      evidenceReferences: evidence.get(turn.id) ?? [],
    })),
    workspace: { code: codeSummary(artifacts.code), canvas: canvasSummary(artifacts.canvas) },
    integrations: {
      linear: {
        configuredIssue: version.definition.linearIssueIdentifier ?? null,
        issueLoaded: linearRuns.some((run) => run.name === 'linear_get_issue' && run.status === 'completed'),
        commentPrepared: linearRuns.some((run) => run.name === 'linear_prepare_comment' && run.status === 'completed'),
        commentPosted: Boolean(posted),
        commentUrl: typeof postedOutput?.url === 'string' ? postedOutput.url : null,
      },
    },
    assessment: {
      generatedAt: assessment.updatedAt,
      model: report.model,
      candidateFeedbackReleasedAt: assessment.releasedAt,
    },
  };
}
