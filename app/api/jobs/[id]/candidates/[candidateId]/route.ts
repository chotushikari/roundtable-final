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
    const { candidateId } = await params;
    const raw = await request.json() as Record<string, unknown>;
    const { stage } = CandidateStageSchema.parse(raw);
    const jobCandidate = await jobStore.updateJobCandidateStage(candidateId, company.organizationId, stage);
    return NextResponse.json({ jobCandidate });
  } catch (error) {
    return apiError(error, 'Failed to update candidate stage');
  }
}
