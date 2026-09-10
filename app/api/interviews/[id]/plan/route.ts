import { NextResponse } from 'next/server';
import { apiError } from '@/lib/http';
import { generateInterviewPlan } from '@/lib/interview-planner';
import { interviewStore } from '@/lib/interview-store';
import { jobStore } from '@/lib/job-store';
import { requireCompanyContext } from '@/lib/supabase-admin';
import { InterviewPlanSchema } from '@/types/interview';

export const maxDuration = 60;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const company = await requireCompanyContext(request);
    const { id } = await params;
    const interview = await interviewStore.getInterview(id, company.organizationId);
    if (!interview) throw new Error('Interview not found');
    let body: { plan?: unknown } = {};
    try { body = await request.json(); } catch {}
    const hiringBar = interview.jobId
      ? await jobStore.listCompetencies(interview.jobId)
      : undefined;
    const generated = body.plan
      ? { plan: InterviewPlanSchema.parse(body.plan), model: 'company-edited', usedFallback: false }
      : await generateInterviewPlan(interview, hiringBar);
    const updated = await interviewStore.setInterviewPlan(id, company.organizationId, generated.plan);
    return NextResponse.json({ interview: updated, generation: { model: generated.model, usedFallback: generated.usedFallback } });
  } catch (error) {
    return apiError(error, 'Failed to generate interview plan');
  }
}
