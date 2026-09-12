import { z } from 'zod';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const EMPLOYMENT_TYPES = ['internship', 'contract', 'full_time', 'part_time', 'temporary'] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const JOB_STATUSES = ['draft', 'open', 'paused', 'closed', 'archived'] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_CANDIDATE_STAGES = [
  'draft', 'invited', 'in_progress', 'completed', 'review', 'withdrawn', 'archived',
] as const;
export type JobCandidateStage = (typeof JOB_CANDIDATE_STAGES)[number];

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

export const JobCreateSchema = z.object({
  title: z.string().trim().min(2).max(160),
  employmentType: z.enum(EMPLOYMENT_TYPES).default('full_time'),
  locationLabel: z.string().trim().max(120).optional(),
  jdText: z.string().trim().max(30_000).default(''),
  hiringBar: z.record(z.string(), z.unknown()).default({}),
  status: z.enum(JOB_STATUSES).default('draft'),
});
export type JobCreateInput = z.infer<typeof JobCreateSchema>;

export const JobPatchSchema = JobCreateSchema.partial();
export type JobPatchInput = z.infer<typeof JobPatchSchema>;

export const CompetencyCreateSchema = z.object({
  competencyKey: z
    .string()
    .trim()
    .regex(/^[a-z][a-z0-9_]{1,63}$/, 'Use lowercase letters, digits, or underscores — start with a letter'),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).default(''),
  weight: z.number().min(1).max(100).default(10),
  required: z.boolean().default(true),
});
export type CompetencyCreateInput = z.infer<typeof CompetencyCreateSchema>;

export const CandidateAddSchema = z.object({
  fullName: z.string().trim().min(1).max(300).optional(),
  email: z.string().trim().email().max(320).optional(),
}).refine((v) => v.fullName || v.email, { message: 'Provide at least a name or email' });
export type CandidateAddInput = z.infer<typeof CandidateAddSchema>;

export const CandidateStageSchema = z.object({
  stage: z.enum(JOB_CANDIDATE_STAGES),
});

export const CandidateEmailPatchSchema = z.object({
  email: z.string().trim().email().max(320),
});

export const HUMAN_DECISIONS = ['advance', 'hold', 'decline', 'needs_review'] as const;
export type HumanDecision = (typeof HUMAN_DECISIONS)[number];

export const HumanDecisionCreateSchema = z.object({
  decision: z.enum(HUMAN_DECISIONS),
  rationale: z.string().trim().min(3).max(2_000),
  sessionId: z.string().uuid().optional(),
});
export type HumanDecisionCreateInput = z.infer<typeof HumanDecisionCreateSchema>;

// ─── DB Record Interfaces ─────────────────────────────────────────────────────

export interface JobRecord {
  id: string;
  organizationId: string;
  title: string;
  employmentType: EmploymentType;
  locationLabel: string | null;
  jdText: string;
  hiringBar: Record<string, unknown>;
  status: JobStatus;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobCompetencyRecord {
  id: string;
  jobId: string;
  organizationId: string;
  competencyKey: string;
  name: string;
  description: string;
  weight: number;
  required: boolean;
  createdAt: string;
}

export interface CandidateRecord {
  id: string;
  organizationId: string;
  fullName: string | null;
  email: string | null;
  resumePath: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobCandidateRecord {
  id: string;
  organizationId: string;
  jobId: string;
  candidateId: string;
  stage: JobCandidateStage;
  source: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobCandidateWithCandidate extends JobCandidateRecord {
  candidate: CandidateRecord;
}

export interface HumanDecisionRecord {
  id: string;
  organizationId: string;
  jobCandidateId: string;
  sessionId: string | null;
  decision: HumanDecision;
  rationale: string;
  decidedBy: string | null;
  decidedAt: string;
  createdAt: string;
}
