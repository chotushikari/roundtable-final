import { z } from 'zod';
import { DEMO_DURATION_MINUTES, DEMO_ROLES } from '@/lib/interview-demo';

export const PANEL_ROLES = [
  'technical',
  'product',
  'hiring_manager',
  'behavioral',
  'customer',
] as const;

export const PanelRoleSchema = z.enum(PANEL_ROLES);
export type PanelRole = z.infer<typeof PanelRoleSchema>;

export const DifficultySchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);
export type Difficulty = z.infer<typeof DifficultySchema>;

export const ModalitySchema = z.enum(['voice', 'code', 'canvas', 'scenario']);
export type InterviewModality = z.infer<typeof ModalitySchema>;

export const InterviewPhaseSchema = z.enum([
  'introduction',
  'background',
  'panel',
  'wrap_up',
]);
export type InterviewPhase = z.infer<typeof InterviewPhaseSchema>;

export const InterviewStatusSchema = z.enum([
  'draft',
  'ready',
  'starting',
  'in_progress',
  'assessing',
  'completed',
  'abandoned',
  'failed',
  'needs_review',
]);
export type InterviewStatus = z.infer<typeof InterviewStatusSchema>;

export const InterviewCreateSchema = z.object({
  title: z.string().trim().min(3).max(120),
  roleTitle: z.string().trim().min(2).max(120),
  jdText: z.string().trim().min(40).max(30_000),
  desiredOutcomes: z.array(z.string().trim().min(2).max(240)).min(1).max(12),
  panelRoles: z
    .array(PanelRoleSchema)
    .min(2)
    .max(5)
    .default(['technical', 'product', 'hiring_manager']),
  mustAskQuestions: z
    .array(z.string().trim().min(5).max(500))
    .max(12)
    .default([]),
  mustCoverTopics: z
    .array(z.string().trim().min(2).max(240))
    .max(16)
    .default([]),
  durationMinutes: z.number().int().min(2).max(90).default(30),
  demoMode: z.boolean().optional(),
  linearIssueIdentifier: z.preprocess(
    (value) => typeof value === 'string' && !value.trim() ? undefined : value,
    z.string().trim().regex(/^[A-Za-z][A-Za-z0-9_-]*-\d+$/, 'Use a Linear issue identifier such as ENG-123').max(80).optional(),
  ),
  instructions: z.string().trim().max(4_000).default(''),
  // Optional: scope this blueprint to a job in the recruiter flow.
  // Null/undefined keeps existing definitions fully backward-compatible.
  jobId: z.string().uuid().optional(),
}).superRefine((value, context) => {
  if (value.demoMode && (value.panelRoles.length !== DEMO_ROLES.length || value.panelRoles.some((role, index) => role !== DEMO_ROLES[index]))) {
    context.addIssue({ code: 'custom', path: ['panelRoles'], message: 'The showcase order is Hiring Manager, Technical, Product, Customer, then Behavioural.' });
  }
  if (value.demoMode && value.durationMinutes !== DEMO_DURATION_MINUTES) {
    context.addIssue({ code: 'custom', path: ['durationMinutes'], message: 'The finale showcase is fixed at ten minutes.' });
  }
});
export type InterviewCreateInput = z.infer<typeof InterviewCreateSchema>;

export const RubricCompetencySchema = z.object({
  id: z.string().trim().min(1).max(80),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(5).max(500),
  weight: z.number().min(0.05).max(1),
  signals: z.array(z.string().trim().min(2).max(240)).min(1).max(8),
});

export const InterviewPlanSchema = z.object({
  summary: z.string().trim().min(10).max(1_000),
  competencies: z.array(RubricCompetencySchema).min(3).max(10),
  roleObjectives: z.array(
    z.object({
      role: PanelRoleSchema,
      objectives: z.array(z.string().trim().min(2).max(240)).min(1).max(8),
    }),
  ),
  scenarios: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(80),
        title: z.string().trim().min(2).max(160),
        prompt: z.string().trim().min(10).max(1_500),
        modality: ModalitySchema,
        targetCompetencies: z.array(z.string().trim().min(1).max(80)).min(1),
      }),
    )
    .max(8),
  fallbackQuestions: z.array(z.string().trim().min(5).max(500)).min(3).max(15),
});
export type InterviewPlan = z.infer<typeof InterviewPlanSchema>;

export const EvidenceRefSchema = z.object({
  turnId: z.string().uuid().optional(),
  artifactVersionId: z.string().uuid().optional(),
  quote: z.string().trim().min(1).max(500),
}).refine((value) => value.turnId || value.artifactVersionId, {
  message: 'Evidence must reference a transcript turn or artifact version',
});
export type EvidenceRef = z.infer<typeof EvidenceRefSchema>;

export const RoleFindingSchema = z.object({
  role: PanelRoleSchema,
  observations: z.array(z.string().trim().min(1).max(500)).max(6),
  strengths: z.array(z.string().trim().min(1).max(300)).max(4).default([]),
  gaps: z.array(z.string().trim().min(1).max(300)).max(4).default([]),
});

export const CompetencyEvidenceSchema = z.object({
  competencyId: z.string().trim().min(1).max(80),
  rating: z.number().int().min(1).max(4).nullable(),
  confidence: z.number().min(0).max(1),
  quote: z.string().trim().max(500),
});

export const ContradictionSchema = z.object({
  priorTurnId: z.string().uuid().optional(),
  priorQuote: z.string().trim().max(500),
  currentQuote: z.string().trim().max(500),
  explanation: z.string().trim().min(1).max(500),
});
export type Contradiction = z.infer<typeof ContradictionSchema>;

export const PanelTurnAnalysisSchema = z.object({
  // Models sometimes return a partial list. `validateEvidence` fills every
  // configured role with an explicit evidence gap before persistence.
  roleFindings: z.array(RoleFindingSchema).min(1).max(5),
  competencyEvidence: z.array(CompetencyEvidenceSchema).max(10),
  vague: z.boolean(),
  vagueReason: z.string().trim().max(500).default(''),
  contradictions: z.array(ContradictionSchema).max(5),
  recommendedDifficultyDelta: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
  recommendedRole: PanelRoleSchema,
  recommendedObjective: z.string().trim().min(2).max(500),
  recommendedModality: ModalitySchema,
  addressedTopics: z.array(z.string().trim().min(1).max(240)).max(10),
  toolRequest: z
    .object({
      name: z.enum([
        'get_workspace_snapshot',
        'run_code_tests',
        'inject_scenario_constraint',
      ]),
      arguments: z.record(z.string(), z.unknown()).default({}),
    })
    .nullable()
    .default(null),
});
export type PanelTurnAnalysis = z.infer<typeof PanelTurnAnalysisSchema>;

export const ControllerDecisionSchema = z.object({
  activeSpeakerRole: PanelRoleSchema,
  objective: z.string().trim().min(2).max(500),
  modality: ModalitySchema,
  difficulty: DifficultySchema,
  reasonCode: z.enum([
    'clarify_vague',
    'resolve_contradiction',
    'must_ask',
    'weak_competency',
    'cross_functional_gap',
    'workspace_follow_up',
    'resume_verification',
    'background',
    'panel_coverage',
    'conversation_control',
    'balanced_rotation',
    'wrap_up',
    'fallback',
  ]),
  remainingCoverage: z.array(z.string()),
  roleHandoff: z.boolean(),
});
export type ControllerDecision = z.infer<typeof ControllerDecisionSchema>;

export const FinalAssessmentSchema = z.object({
  overallSummary: z.string().trim().min(10).max(2_000),
  competencies: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      rating: z.number().int().min(1).max(4).nullable(),
      confidence: z.number().min(0).max(1),
      summary: z.string().max(1_000),
      evidence: z.array(EvidenceRefSchema),
      gaps: z.array(z.string().max(500)),
    }),
  ),
  roleViews: z.array(
    z.object({
      role: PanelRoleSchema,
      summary: z.string().max(1_000),
      evidence: z.array(EvidenceRefSchema),
    }),
  ),
  strengths: z.array(z.string().max(500)),
  growthAreas: z.array(z.string().max(500)),
  unresolvedContradictions: z.array(z.string().max(500)),
  suggestedHumanFollowUps: z.array(z.string().max(500)),
  coverage: z.object({
    covered: z.array(z.string()),
    notObserved: z.array(z.string()),
  }),
  candidateSummary: z.object({
    strengths: z.array(z.string().max(500)),
    growthAreas: z.array(z.string().max(500)),
  }),
  humanReviewRequired: z.literal(true),
  rubricVersion: z.number().int().positive(),
  model: z.string(),
});
export type FinalAssessment = z.infer<typeof FinalAssessmentSchema>;

export type CompetencyState = Record<
  string,
  {
    rating: number | null;
    confidence: number;
    evidenceCount: number;
    highConfidenceStreak: number;
    lowConfidenceStreak: number;
    difficulty: Difficulty;
  }
>;

export interface InterviewDefinitionRecord extends InterviewCreateInput {
  id: string;
  organizationId: string;
  /** Nullable bridge to the Hiring Graph — populated by the recruiter flow. */
  jobId?: string;
  status: 'draft' | 'ready';
  plan: InterviewPlan | null;
  planVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewVersionRecord {
  id: string;
  interviewId: string;
  organizationId: string;
  version: number;
  definition: InterviewCreateInput;
  plan: InterviewPlan;
  promptVersion: string;
  createdAt: string;
}

export interface InvitationRecord {
  id: string;
  interviewId: string;
  interviewVersionId: string;
  organizationId: string;
  tokenHash: string;
  expiresAt: string;
  revokedAt: string | null;
  claimedAt: string | null;
  candidateName: string | null;
  candidateEmail: string | null;
  resumePath: string | null;
  /** Nullable bridge to the Hiring Graph — populated by the recruiter flow. */
  jobCandidateId?: string;
  createdAt: string;
}

export interface InterviewSessionRecord {
  id: string;
  invitationId: string;
  interviewId: string;
  interviewVersionId: string;
  organizationId: string;
  status: InterviewStatus;
  connectionHealth: 'unknown' | 'connected' | 'degraded' | 'disconnected';
  channelName: string;
  rtcUid: string;
  agentUid: string;
  agoraAgentId: string | null;
  llmTokenHash: string;
  activeRole: PanelRole;
  previousRole: PanelRole | null;
  consecutiveRoleTurns: number;
  currentModality: InterviewModality;
  phase: InterviewPhase;
  competencyState: CompetencyState;
  askedMustAsk: string[];
  coveredTopics: string[];
  pendingQuestion: string | null;
  stateVersion: number;
  toolRunCount: number;
  startedAt: string;
  completedAt: string | null;
  expiresAt: string;
}

export interface TranscriptTurnRecord {
  id: string;
  sessionId: string;
  sequence: number;
  speaker: 'candidate' | 'interviewer';
  speakerRole: PanelRole | null;
  text: string;
  status: 'final' | 'interrupted';
  dedupeKey: string;
  createdAt: string;
}

export interface TurnAnalysisRecord {
  id: string;
  sessionId: string;
  turnId: string;
  analysis: PanelTurnAnalysis;
  decision: ControllerDecision;
  responseText: string;
  model: string;
  createdAt: string;
}

export interface WorkspaceArtifactRecord {
  id: string;
  sessionId: string;
  type: 'code' | 'canvas';
  version: number;
  content: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface ArtifactVersionRecord {
  id: string;
  artifactId: string;
  sessionId: string;
  type: 'code' | 'canvas';
  version: number;
  content: unknown;
  createdAt: string;
}

export interface ToolRunRecord {
  id: string;
  sessionId: string;
  name: 'get_workspace_snapshot' | 'run_code_tests' | 'inject_scenario_constraint'
    | 'linear_get_issue' | 'linear_prepare_comment' | 'linear_post_comment';
  input: Record<string, unknown>;
  output: unknown;
  status: 'completed' | 'failed';
  createdAt: string;
}

export interface SessionEventRecord {
  id: string;
  sessionId: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface AssessmentRecord {
  id: string;
  sessionId: string;
  assessment: FinalAssessment;
  releasedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** A small, recruiter-facing explanation of a turn transition. */
export interface TurnAdaptation {
  askReason: ControllerDecision['reasonCode'] | null;
  askDifficulty: Difficulty | null;
  roleHandoff: boolean;
  vague: boolean;
  vagueReason: string;
  contradictions: Contradiction[];
}

/**
 * Stable, company-facing projection of a completed interview. This is
 * deliberately separate from controller state, events, and raw artifacts so
 * the dashboard does not depend on internal persistence details.
 */
export interface CompanyInterviewReport {
  session: {
    id: string;
    status: InterviewStatus;
    startedAt: string;
    completedAt: string | null;
    durationSeconds: number | null;
    connectionHealth: InterviewSessionRecord['connectionHealth'];
  };
  candidate: { name: string | null; email: string | null };
  interview: {
    title: string;
    roleTitle: string;
    panelRoles: PanelRole[];
    rubricVersion: number;
  };
  summary: Pick<FinalAssessment, 'overallSummary' | 'strengths' | 'growthAreas' | 'suggestedHumanFollowUps' | 'humanReviewRequired'>;
  competencies: FinalAssessment['competencies'];
  roleViews: FinalAssessment['roleViews'];
  coverage: FinalAssessment['coverage'] & {
    mustAsk: Array<{ question: string; status: 'asked' | 'not_reached' }>;
    topicsExplored: string[];
    rolesWithEvidence: PanelRole[];
  };
  unresolvedContradictions: FinalAssessment['unresolvedContradictions'];
  transcript: Array<Pick<TranscriptTurnRecord, 'id' | 'sequence' | 'speaker' | 'speakerRole' | 'text' | 'status' | 'createdAt'> & { evidenceReferences: string[]; adaptation: TurnAdaptation }>;
  workspace: {
    status: 'not_attempted' | 'completed' | 'incomplete';
    attempts: number;
    code: {
      available: boolean;
      version: number | null;
      language: string | null;
      nonEmptyLines: number;
      functions: string[];
      source?: string | null;
    };
    canvas: {
      available: boolean;
      version: number | null;
      elementCount: number;
      labels: string[];
      arrowCount: number;
      elements?: unknown[];
    };
  };
  integrations: {
    linear: {
      configuredIssue: string | null;
      issueLoaded: boolean;
      commentPrepared: boolean;
      commentPosted: boolean;
      commentUrl: string | null;
    };
  };
  assessment: { generatedAt: string; model: string; candidateFeedbackReleasedAt: string | null };
}
