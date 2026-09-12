import { NextResponse } from 'next/server';
import { requireCompanyContext } from '@/lib/supabase-admin';
import { jobStore } from '@/lib/job-store';
import { apiError } from '@/lib/http';
import { CandidateEmailPatchSchema, CandidateStageSchema } from '@/types/jobs';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; candidateId: string }> },
) {
  try {
    const company = await requireCompanyContext(request);
    const { id: jobId, candidateId } = await params;
    const job = await jobStore.getJob(jobId, company.organizationId);
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    const raw = await request.json() as Record<string, unknown>;
    if ('email' in raw) {
      const { email } = CandidateEmailPatchSchema.parse(raw);
      const jobCandidate = await jobStore.getJobCandidate(candidateId, jobId, company.organizationId);
      if (!jobCandidate) return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
      const candidate = await jobStore.updateCandidateEmail(jobCandidate.candidateId, company.organizationId, email);
      return NextResponse.json({ candidate });
    }
    const { stage } = CandidateStageSchema.parse(raw);
    const jobCandidate = await jobStore.updateJobCandidateStage(candidateId, jobId, company.organizationId, stage);
    return NextResponse.json({ jobCandidate });
  } catch (error) {
    return apiError(error, 'Failed to update candidate stage');
  }
}
