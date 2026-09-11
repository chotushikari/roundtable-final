import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireCompanyContext } from '@/lib/supabase-admin';
import { apiError } from '@/lib/http';

const DeliverySchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('send_email'),
    providerToken: z.string().min(20).max(4096),
    to: z.string().email().max(320),
    subject: z.string().min(1).max(240),
    body: z.string().min(1).max(12_000),
  }),
  z.object({
    action: z.literal('create_calendar_event'),
    providerToken: z.string().min(20).max(4096),
    attendeeEmail: z.string().email().max(320),
    title: z.string().min(1).max(240),
    description: z.string().min(1).max(12_000),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
  }),
]);

function encodeGmailMessage(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

async function googleJson(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text();
  try { return JSON.parse(text) as Record<string, unknown>; } catch { return {}; }
}

function googleError(payload: Record<string, unknown>, status: number) {
  const error = payload.error as Record<string, unknown> | undefined;
  const message = typeof error?.message === 'string' ? error.message : `Google delivery failed (${status}).`;
  const reason = Array.isArray(error?.errors) && typeof error.errors[0] === 'object'
    ? (error.errors[0] as Record<string, unknown>).reason
    : undefined;
  return { message, reason: typeof reason === 'string' ? reason : undefined };
}

export async function POST(request: Request) {
  try {
    await requireCompanyContext(request);
    const input = DeliverySchema.parse(await request.json());
    const authorization = { Authorization: `Bearer ${input.providerToken}`, 'Content-Type': 'application/json' };

    if (input.action === 'send_email') {
      const raw = [
        `To: ${input.to}`,
        `Subject: ${input.subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        '',
        input.body,
      ].join('\r\n');
      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST', headers: authorization, body: JSON.stringify({ raw: encodeGmailMessage(raw) }),
      });
      const payload = await googleJson(response);
      if (!response.ok) return NextResponse.json({ error: googleError(payload, response.status), providerStatus: response.status }, { status: 422 });
      return NextResponse.json({ delivered: true, provider: 'gmail', messageId: payload.id });
    }

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all', {
      method: 'POST',
      headers: authorization,
      body: JSON.stringify({
        summary: input.title,
        description: input.description,
        start: { dateTime: input.startsAt },
        end: { dateTime: input.endsAt },
        attendees: [{ email: input.attendeeEmail }],
      }),
    });
    const payload = await googleJson(response);
    if (!response.ok) return NextResponse.json({ error: googleError(payload, response.status), providerStatus: response.status }, { status: 422 });
    return NextResponse.json({ delivered: true, provider: 'calendar', eventId: payload.id, eventLink: payload.htmlLink });
  } catch (error) {
    return apiError(error, 'Could not complete Google delivery');
  }
}
