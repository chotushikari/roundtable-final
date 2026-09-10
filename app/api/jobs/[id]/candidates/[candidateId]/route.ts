import { NextResponse } from 'next/server';
import { requireCompanyContext } from '@/lib/supabase-admin';
import { jobStore } from '@/lib/job-store';
import { apiError } from '@/lib/http';
import { CandidateStageSchema } from '@/types/jobs';

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
    const { stage } = CandidateStageSchema.parse(raw);
    const jobCandidate = await jobStore.updateJobCandidateStage(candidateId, jobId, company.organizationId, stage);
    return NextResponse.json({ jobCandidate });
  } catch (error) {
    return apiError(error, 'Failed to update candidate stage');
  }
}
