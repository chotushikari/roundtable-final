import { NextResponse } from 'next/server';
import { requireCompanyContext } from '@/lib/supabase-admin';
import { jobStore } from '@/lib/job-store';
import { apiError } from '@/lib/http';
import { JobPatchSchema } from '@/types/jobs';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const company = await requireCompanyContext(request);
    const { id } = await params;
    const job = await jobStore.getJob(id, company.organizationId);
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    const competencies = await jobStore.listCompetencies(id);
    return NextResponse.json({ job, competencies });
  } catch (error) {
    return apiError(error, 'Failed to get job');
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const company = await requireCompanyContext(request);
    const { id } = await params;
    const raw = await request.json() as Record<string, unknown>;
    const patch = JobPatchSchema.parse(raw);
    const job = await jobStore.updateJob(id, company.organizationId, patch);
    return NextResponse.json({ job });
  } catch (error) {
    return apiError(error, 'Failed to update job');
  }
}
