import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireCompanyContext } from '@/lib/supabase-admin';
import { jobStore } from '@/lib/job-store';
import { apiError } from '@/lib/http';
import { CompetencyCreateSchema } from '@/types/jobs';

const DeleteSchema = z.object({ id: z.string().uuid() });

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const company = await requireCompanyContext(request);
    const { id: jobId } = await params;
    const job = await jobStore.getJob(jobId, company.organizationId);
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    const competencies = await jobStore.listCompetencies(jobId);
    return NextResponse.json({ competencies });
  } catch (error) {
    return apiError(error, 'Failed to list competencies');
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const company = await requireCompanyContext(request);
    const { id: jobId } = await params;
    const job = await jobStore.getJob(jobId, company.organizationId);
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    const raw = await request.json() as Record<string, unknown>;
    const input = CompetencyCreateSchema.parse(raw);
    const competency = await jobStore.upsertCompetency(jobId, company.organizationId, input);
    return NextResponse.json({ competency }, { status: 201 });
  } catch (error) {
    return apiError(error, 'Failed to save competency');
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const company = await requireCompanyContext(request);
    const { id: jobId } = await params;
    const { id } = DeleteSchema.parse(await request.json());
    await jobStore.deleteCompetency(id, jobId, company.organizationId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error, 'Failed to delete competency');
  }
}
