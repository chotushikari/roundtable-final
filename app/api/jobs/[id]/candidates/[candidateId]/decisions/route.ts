import { NextResponse } from 'next/server';
import { apiError } from '@/lib/http';
import { jobStore } from '@/lib/job-store';
import { requireCompanyContext } from '@/lib/supabase-admin';
import { HumanDecisionCreateSchema } from '@/types/jobs';

export async function GET(request: Request, { params }: { params: Promise<{ id: string; candidateId: string }> }) {
  try {
    const company = await requireCompanyContext(request);
    const { id: jobId, candidateId } = await params;
    const decisions = await jobStore.listHumanDecisions(candidateId, jobId, company.organizationId);
    return NextResponse.json({ decisions });
  } catch (error) {
    return apiError(error, 'Failed to list human decisions');
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string; candidateId: string }> }) {
  try {
    const company = await requireCompanyContext(request);
    const { id: jobId, candidateId } = await params;
    const input = HumanDecisionCreateSchema.parse(await request.json());
    const decision = await jobStore.createHumanDecision(
      candidateId, jobId, company.organizationId, input, company.userId,
    );
    return NextResponse.json({ decision }, { status: 201 });
  } catch (error) {
    return apiError(error, 'Failed to record human decision');
  }
}
