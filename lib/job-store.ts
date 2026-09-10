import { randomUUID } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import type {
  CandidateAddInput,
  CandidateRecord,
  CompetencyCreateInput,
  JobCandidateRecord,
  JobCandidateWithCandidate,
  JobCompetencyRecord,
  HumanDecisionCreateInput,
  HumanDecisionRecord,
  JobCreateInput,
  JobRecord,
} from '@/types/jobs';

// ─── In-memory fallback (dev / test only) ────────────────────────────────────

type MemoryJobDatabase = {
  jobs: Map<string, JobRecord>;
  competencies: Map<string, JobCompetencyRecord>;
  candidates: Map<string, CandidateRecord>;
  jobCandidates: Map<string, JobCandidateRecord>;
  humanDecisions: Map<string, HumanDecisionRecord>;
};

declare global {
  var __roundtableJobDatabase: MemoryJobDatabase | undefined;
}

function mem(): MemoryJobDatabase {
  if (!globalThis.__roundtableJobDatabase) {
    globalThis.__roundtableJobDatabase = {
      jobs: new Map(),
      competencies: new Map(),
      candidates: new Map(),
      jobCandidates: new Map(),
      humanDecisions: new Map(),
    };
  }
  return globalThis.__roundtableJobDatabase;
}

/** Test-only reset for the development/test in-memory adapter. */
export function resetJobStoreForTests(): void {
  globalThis.__roundtableJobDatabase = undefined;
}

function now(): string {
  return new Date().toISOString();
}

function throwDb(error: { message?: string } | null, op: string): void {
  if (error) throw new Error(`${op}: ${error.message ?? 'database error'}`);
}

// ─── Row mappers ─────────────────────────────────────────────────────────────

function jobFromRow(row: Record<string, unknown>): JobRecord {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    title: String(row.title),
    employmentType: row.employment_type as JobRecord['employmentType'],
    locationLabel: row.location_label ? String(row.location_label) : null,
    jdText: String(row.jd_text ?? ''),
    hiringBar: (row.hiring_bar as Record<string, unknown>) ?? {},
    status: row.status as JobRecord['status'],
    createdBy: row.created_by ? String(row.created_by) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function competencyFromRow(row: Record<string, unknown>): JobCompetencyRecord {
  return {
    id: String(row.id),
    jobId: String(row.job_id),
    organizationId: String(row.organization_id),
    competencyKey: String(row.competency_key),
    name: String(row.name),
    description: String(row.description ?? ''),
    weight: Number(row.weight),
    required: row.required === true,
    createdAt: String(row.created_at),
  };
}

function candidateFromRow(row: Record<string, unknown>): CandidateRecord {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    fullName: row.full_name ? String(row.full_name) : null,
    email: row.email ? String(row.email) : null,
    resumePath: row.resume_path ? String(row.resume_path) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function jobCandidateFromRow(row: Record<string, unknown>): JobCandidateRecord {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    jobId: String(row.job_id),
    candidateId: String(row.candidate_id),
    stage: row.stage as JobCandidateRecord['stage'],
    source: row.source ? String(row.source) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function humanDecisionFromRow(row: Record<string, unknown>): HumanDecisionRecord {
  return {
    id: String(row.id), organizationId: String(row.organization_id), jobCandidateId: String(row.job_candidate_id),
    sessionId: row.session_id ? String(row.session_id) : null,
    decision: row.decision as HumanDecisionRecord['decision'], rationale: String(row.rationale ?? ''),
    decidedBy: row.decided_by ? String(row.decided_by) : null,
    decidedAt: String(row.decided_at), createdAt: String(row.created_at),
  };
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const jobStore = {
  // ── Jobs ──────────────────────────────────────────────────────────────────

  async createJob(organizationId: string, input: JobCreateInput, createdBy?: string): Promise<JobRecord> {
    const timestamp = now();
    const record: JobRecord = {
      id: randomUUID(),
      organizationId,
      title: input.title,
      employmentType: input.employmentType,
      locationLabel: input.locationLabel ?? null,
      jdText: input.jdText,
      hiringBar: input.hiringBar,
      status: input.status,
      createdBy: createdBy ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const admin = getSupabaseAdmin();
    if (!admin) { mem().jobs.set(record.id, record); return record; }
    const { data, error } = await admin.from('jobs').insert({
      id: record.id,
      organization_id: organizationId,
      title: input.title,
      employment_type: input.employmentType,
      location_label: input.locationLabel ?? null,
      jd_text: input.jdText,
      hiring_bar: input.hiringBar,
      status: input.status,
      created_by: createdBy ?? null,
    }).select('*').single();
    throwDb(error, 'create job');
    return jobFromRow(data as Record<string, unknown>);
  },

  async listJobs(organizationId: string): Promise<JobRecord[]> {
    const admin = getSupabaseAdmin();
    if (!admin) {
      return [...mem().jobs.values()]
        .filter((j) => j.organizationId === organizationId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    const { data, error } = await admin
      .from('jobs')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });
    throwDb(error, 'list jobs');
    return (data ?? []).map((r) => jobFromRow(r));
  },

  async getJob(id: string, organizationId?: string): Promise<JobRecord | null> {
    const admin = getSupabaseAdmin();
    if (!admin) {
      const record = mem().jobs.get(id) ?? null;
      return record && (!organizationId || record.organizationId === organizationId) ? record : null;
    }
    let query = admin.from('jobs').select('*').eq('id', id);
    if (organizationId) query = query.eq('organization_id', organizationId);
    const { data, error } = await query.maybeSingle();
    throwDb(error, 'get job');
    return data ? jobFromRow(data) : null;
  },

  async updateJob(id: string, organizationId: string, patch: Partial<JobCreateInput>): Promise<JobRecord> {
    const existing = await this.getJob(id, organizationId);
    if (!existing) throw new Error('Job not found');
    const admin = getSupabaseAdmin();
    const dbPatch: Record<string, unknown> = { updated_at: now() };
    if (patch.title !== undefined) dbPatch.title = patch.title;
    if (patch.employmentType !== undefined) dbPatch.employment_type = patch.employmentType;
    if (patch.locationLabel !== undefined) dbPatch.location_label = patch.locationLabel;
    if (patch.jdText !== undefined) dbPatch.jd_text = patch.jdText;
    if (patch.hiringBar !== undefined) dbPatch.hiring_bar = patch.hiringBar;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (!admin) {
      const next = { ...existing, ...Object.fromEntries(Object.entries(patch).map(([k, v]) => [k, v])), updatedAt: dbPatch.updated_at as string };
      mem().jobs.set(id, next);
      return next;
    }
    const { data, error } = await admin.from('jobs').update(dbPatch).eq('id', id).eq('organization_id', organizationId).select('*').single();
    throwDb(error, 'update job');
    return jobFromRow(data as Record<string, unknown>);
  },

  // ── Competencies ──────────────────────────────────────────────────────────

  async listCompetencies(jobId: string): Promise<JobCompetencyRecord[]> {
    const admin = getSupabaseAdmin();
    if (!admin) {
      return [...mem().competencies.values()]
        .filter((c) => c.jobId === jobId)
        .sort((a, b) => b.weight - a.weight);
    }
    const { data, error } = await admin
      .from('job_competencies')
      .select('*')
      .eq('job_id', jobId)
      .order('weight', { ascending: false });
    throwDb(error, 'list competencies');
    return (data ?? []).map((r) => competencyFromRow(r));
  },

  async upsertCompetency(
    jobId: string,
    organizationId: string,
    input: CompetencyCreateInput,
  ): Promise<JobCompetencyRecord> {
    const admin = getSupabaseAdmin();
    const base = {
      job_id: jobId,
      organization_id: organizationId,
      competency_key: input.competencyKey,
      name: input.name,
      description: input.description,
      weight: input.weight,
      required: input.required,
    };
    if (!admin) {
      const existing = [...mem().competencies.values()].find(
        (c) => c.jobId === jobId && c.competencyKey === input.competencyKey,
      );
      if (existing) {
        const next = { ...existing, name: input.name, description: input.description, weight: input.weight, required: input.required };
        mem().competencies.set(existing.id, next);
        return next;
      }
      const record: JobCompetencyRecord = {
        id: randomUUID(),
        jobId,
        organizationId,
        competencyKey: input.competencyKey,
        name: input.name,
        description: input.description,
        weight: input.weight,
        required: input.required,
        createdAt: now(),
      };
      mem().competencies.set(record.id, record);
      return record;
    }
    const { data, error } = await admin.from('job_competencies').upsert(
      { ...base, id: randomUUID() },
      { onConflict: 'job_id,competency_key', ignoreDuplicates: false },
    ).select('*').single();
    throwDb(error, 'upsert competency');
    return competencyFromRow(data as Record<string, unknown>);
  },

  async deleteCompetency(id: string, jobId: string, organizationId: string): Promise<void> {
    const admin = getSupabaseAdmin();
    if (!admin) { mem().competencies.delete(id); return; }
    const { error } = await admin.from('job_competencies').delete()
      .eq('id', id).eq('job_id', jobId).eq('organization_id', organizationId);
    throwDb(error, 'delete competency');
  },

  // ── Candidates ────────────────────────────────────────────────────────────

  async upsertCandidate(organizationId: string, input: CandidateAddInput): Promise<CandidateRecord> {
    const admin = getSupabaseAdmin();
    const email = input.email ?? null;
    const fullName = input.fullName ?? null;
    if (!admin) {
      // In-memory: match by email if provided
      if (email) {
        const existing = [...mem().candidates.values()].find(
          (c) => c.organizationId === organizationId && c.email === email,
        );
        if (existing) {
          const next = { ...existing, fullName: fullName ?? existing.fullName, updatedAt: now() };
          mem().candidates.set(existing.id, next);
          return next;
        }
      }
      const record: CandidateRecord = {
        id: randomUUID(),
        organizationId,
        fullName,
        email,
        resumePath: null,
        createdAt: now(),
        updatedAt: now(),
      };
      mem().candidates.set(record.id, record);
      return record;
    }
    // Email-based: check for existing candidate first, then insert or update.
    // This is more reliable than onConflict against the partial unique index
    // (candidates_org_email_notnull_idx), which PostgREST cannot resolve automatically.
    if (email) {
      const { data: existing } = await admin.from('candidates')
        .select('*').eq('organization_id', organizationId).eq('email', email).maybeSingle();
      if (existing) {
        const { data: updated, error: updateErr } = await admin.from('candidates')
          .update({ full_name: fullName ?? (existing as Record<string, unknown>).full_name, updated_at: now() })
          .eq('id', (existing as Record<string, unknown>).id as string)
          .select('*').single();
        throwDb(updateErr, 'update candidate');
        return candidateFromRow(updated as Record<string, unknown>);
      }
      const { data, error } = await admin.from('candidates').insert(
        { id: randomUUID(), organization_id: organizationId, email, full_name: fullName },
      ).select('*').single();
      throwDb(error, 'insert candidate with email');
      return candidateFromRow(data as Record<string, unknown>);
    }
    // No email — always insert a new candidate record
    const { data, error } = await admin.from('candidates').insert({
      id: randomUUID(), organization_id: organizationId, full_name: fullName, email: null,
    }).select('*').single();
    throwDb(error, 'insert candidate');
    return candidateFromRow(data as Record<string, unknown>);
  },

  async getOrCreateJobCandidate(
    jobId: string,
    candidateId: string,
    organizationId: string,
  ): Promise<JobCandidateRecord> {
    const admin = getSupabaseAdmin();
    if (!admin) {
      const existing = [...mem().jobCandidates.values()].find(
        (jc) => jc.organizationId === organizationId && jc.jobId === jobId && jc.candidateId === candidateId,
      );
      if (existing) return existing;
      const record: JobCandidateRecord = {
        id: randomUUID(),
        organizationId,
        jobId,
        candidateId,
        stage: 'draft',
        source: null,
        createdAt: now(),
        updatedAt: now(),
      };
      mem().jobCandidates.set(record.id, record);
      return record;
    }
    // Upsert on (job_id, candidate_id) unique constraint
    const { data, error } = await admin.from('job_candidates').upsert(
      { id: randomUUID(), organization_id: organizationId, job_id: jobId, candidate_id: candidateId, stage: 'draft' },
      { onConflict: 'job_id,candidate_id', ignoreDuplicates: true },
    ).select('*').single();
    if (error || !data) {
      // ignoreDuplicates returns null data on conflict — read existing row
      const { data: existing, error: readErr } = await admin.from('job_candidates')
        .select('*').eq('job_id', jobId).eq('candidate_id', candidateId).single();
      throwDb(readErr, 'read existing job_candidate');
      return jobCandidateFromRow(existing as Record<string, unknown>);
    }
    return jobCandidateFromRow(data as Record<string, unknown>);
  },

  async listJobCandidates(jobId: string, organizationId: string): Promise<JobCandidateWithCandidate[]> {
    const admin = getSupabaseAdmin();
    if (!admin) {
      const jcs = [...mem().jobCandidates.values()].filter((jc) => jc.jobId === jobId);
      return jcs.map((jc) => ({ ...jc, candidate: mem().candidates.get(jc.candidateId)! })).filter((jc) => jc.candidate);
    }
    const { data, error } = await admin
      .from('job_candidates')
      .select('*, candidate:candidates(*)')
      .eq('job_id', jobId)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });
    throwDb(error, 'list job candidates');
    return (data ?? []).map((row) => ({
      ...jobCandidateFromRow(row),
      candidate: candidateFromRow(row.candidate as Record<string, unknown>),
    }));
  },

  async updateJobCandidateStage(
    id: string,
    jobId: string,
    organizationId: string,
    stage: JobCandidateRecord['stage'],
  ): Promise<JobCandidateRecord> {
    const admin = getSupabaseAdmin();
    if (!admin) {
      const existing = mem().jobCandidates.get(id);
      if (!existing || existing.jobId !== jobId || existing.organizationId !== organizationId) {
        throw new Error('Job candidate not found');
      }
      const next = { ...existing, stage, updatedAt: now() };
      mem().jobCandidates.set(id, next);
      return next;
    }
    const { data, error } = await admin.from('job_candidates')
      .update({ stage, updated_at: now() })
      .eq('id', id).eq('job_id', jobId).eq('organization_id', organizationId)
      .select('*').single();
    throwDb(error, 'update job candidate stage');
    return jobCandidateFromRow(data as Record<string, unknown>);
  },

  async listHumanDecisions(
    jobCandidateId: string,
    jobId: string,
    organizationId: string,
  ): Promise<HumanDecisionRecord[]> {
    const jobCandidate = await this.getJobCandidate(jobCandidateId, jobId, organizationId);
    if (!jobCandidate) throw new Error('Job candidate not found');
    const admin = getSupabaseAdmin();
    if (!admin) {
      return [...mem().humanDecisions.values()]
        .filter((item) => item.jobCandidateId === jobCandidateId)
        .sort((a, b) => b.decidedAt.localeCompare(a.decidedAt));
    }
    const { data, error } = await admin.from('human_decisions').select('*')
      .eq('job_candidate_id', jobCandidateId).eq('organization_id', organizationId)
      .order('decided_at', { ascending: false });
    throwDb(error, 'list human decisions');
    return (data ?? []).map((row) => humanDecisionFromRow(row));
  },

  async createHumanDecision(
    jobCandidateId: string,
    jobId: string,
    organizationId: string,
    input: HumanDecisionCreateInput,
    decidedBy?: string,
  ): Promise<HumanDecisionRecord> {
    const jobCandidate = await this.getJobCandidate(jobCandidateId, jobId, organizationId);
    if (!jobCandidate) throw new Error('Job candidate not found');
    const timestamp = now();
    const record: HumanDecisionRecord = {
      id: randomUUID(), organizationId, jobCandidateId, sessionId: input.sessionId ?? null,
      decision: input.decision, rationale: input.rationale, decidedBy: decidedBy ?? null,
      decidedAt: timestamp, createdAt: timestamp,
    };
    const admin = getSupabaseAdmin();
    if (!admin) { mem().humanDecisions.set(record.id, record); return record; }
    const { data, error } = await admin.from('human_decisions').insert({
      id: record.id, organization_id: organizationId, job_candidate_id: jobCandidateId,
      session_id: record.sessionId, decision: record.decision, rationale: record.rationale,
      decided_by: record.decidedBy, decided_at: record.decidedAt,
    }).select('*').single();
    throwDb(error, 'create human decision');
    const saved = humanDecisionFromRow(data as Record<string, unknown>);
    const { error: auditError } = await admin.from('audit_logs').insert({
      id: randomUUID(), organization_id: organizationId, actor_id: decidedBy ?? null,
      action: 'human_decision.recorded', entity_type: 'job_candidate', entity_id: jobCandidateId,
      metadata: { decision: saved.decision, sessionId: saved.sessionId },
    });
    throwDb(auditError, 'audit human decision');
    return saved;
  },

  async getJobCandidate(id: string, jobId: string, organizationId: string): Promise<JobCandidateRecord | null> {
    const admin = getSupabaseAdmin();
    if (!admin) {
      const record = mem().jobCandidates.get(id) ?? null;
      return record && record.jobId === jobId && record.organizationId === organizationId ? record : null;
    }
    const { data, error } = await admin.from('job_candidates').select('*')
      .eq('id', id).eq('job_id', jobId).eq('organization_id', organizationId).maybeSingle();
    throwDb(error, 'get job candidate');
    return data ? jobCandidateFromRow(data as Record<string, unknown>) : null;
  },
};
