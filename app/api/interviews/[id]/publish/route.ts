import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiError } from '@/lib/http';
import { interviewStore } from '@/lib/interview-store';
import { createOpaqueToken, hashToken } from '@/lib/security';
import { getSupabaseAdmin, requireCompanyContext } from '@/lib/supabase-admin';

const PublishSchema = z.object({
  candidateName: z.string().trim().min(1).max(160).nullable().optional(),
  candidateEmail: z.string().trim().email().max(320).nullable().optional(),
  resumeText: z.string().max(30_000).optional(),
  expiresInDays: z.number().int().min(1).max(7).default(7),
  // Optional: scopes the invitation to a job_candidate record.
  jobCandidateId: z.string().uuid().optional(),
});

function applicationBaseUrl(request: Request): string {
  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  const configured = process.env.NODE_ENV === 'production' && vercelUrl
    ? vercelUrl
    : process.env.APP_BASE_URL ?? new URL(request.url).origin;
  return (configured.startsWith('http') ? configured : `https://${configured}`).replace(/\/$/, '');
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const company = await requireCompanyContext(request);
    const { id } = await params;
    const body = PublishSchema.parse(await request.json().catch(() => ({})));
    const interview = await interviewStore.getInterview(id, company.organizationId);
    if (!interview) throw new Error('Interview not found');
    if (!interview.plan) throw new Error('Generate and review an interview plan before publishing');
    const version = await interviewStore.createInterviewVersion(interview);
    const rawToken = createOpaqueToken();
    const createdAt = new Date().toISOString();
    let invitation = await interviewStore.createInvitation({
      id: randomUUID(),
      interviewId: interview.id,
      interviewVersionId: version.id,
      organizationId: company.organizationId,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + body.expiresInDays * 86_400_000).toISOString(),
      revokedAt: null,
      claimedAt: null,
      candidateName: body.candidateName ?? null,
      candidateEmail: body.candidateEmail ?? null,
      resumePath: null,
      jobCandidateId: body.jobCandidateId ?? undefined,
      createdAt,
    });
    if (body.resumeText?.trim()) {
      const admin = getSupabaseAdmin();
      if (admin) {
        const path = `${invitation.organizationId}/${invitation.id}/resume.txt`;
        const { error } = await admin.storage.from('candidate-resumes').upload(
          path,
          new Blob([body.resumeText], { type: 'text/plain;charset=utf-8' }),
          { upsert: false },
        );
        if (error) throw new Error(`Resume upload failed: ${error.message}`);
        invitation = await interviewStore.setInvitationResumePath(invitation.id, path);
      }
    }
    return NextResponse.json({
      invitation: { ...invitation, tokenHash: undefined },
      invitationUrl: `${applicationBaseUrl(request)}/interview/${rawToken}`,
    }, { status: 201 });
  } catch (error) {
    return apiError(error, 'Failed to publish interview');
  }
}
