import { NextResponse } from 'next/server';
import { requireCompanyContext } from '@/lib/supabase-admin';
import { jobStore } from '@/lib/job-store';
import { apiError } from '@/lib/http';
import { CandidateAddSchema } from '@/types/jobs';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const company = await requireCompanyContext(request);
    const { id: jobId } = await params;
    const job = await jobStore.getJob(jobId, company.organizationId);
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    const candidates = await jobStore.listJobCandidates(jobId, company.organizationId);
    return NextResponse.json({ candidates });
  } catch (error) {
    return apiError(error, 'Failed to list candidates');
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const company = await requireCompanyContext(request);
    const { id: jobId } = await params;
    const job = await jobStore.getJob(jobId, company.organizationId);
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    const raw = await request.json() as Record<string, unknown>;
    const input = CandidateAddSchema.parse(raw);
    // 1. Upsert the candidate record (email-deduped within org)
    const candidate = await jobStore.upsertCandidate(company.organizationId, input);
    // 2. Get-or-create the job_candidate pipeline record
    const jobCandidate = await jobStore.getOrCreateJobCandidate(jobId, candidate.id, company.organizationId);
    return NextResponse.json({ candidate, jobCandidate }, { status: 201 });
  } catch (error) {
    return apiError(error, 'Failed to add candidate');
  }
}
