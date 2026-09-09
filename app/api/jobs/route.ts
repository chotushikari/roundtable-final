import { NextResponse } from 'next/server';
import { requireCompanyContext } from '@/lib/supabase-admin';
import { jobStore } from '@/lib/job-store';
import { apiError } from '@/lib/http';
import { JobCreateSchema } from '@/types/jobs';

export async function GET(request: Request) {
  try {
    const company = await requireCompanyContext(request);
    const jobs = await jobStore.listJobs(company.organizationId);
    return NextResponse.json({ organizationId: company.organizationId, jobs });
  } catch (error) {
    return apiError(error, 'Failed to list jobs');
  }
}

export async function POST(request: Request) {
  try {
    const company = await requireCompanyContext(request);
    const raw = await request.json() as Record<string, unknown>;
    const input = JobCreateSchema.parse(raw);
    const job = await jobStore.createJob(company.organizationId, input, company.userId);
    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    return apiError(error, 'Failed to create job');
  }
}
