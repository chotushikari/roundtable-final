/**
 * Server-side Tavus Avatar Service.
 *
 * Wraps the Tavus Conversational Video API.
 * NEVER import this file in client components.
 * Credentials are read from server-only environment variables.
 *
 * Security:
 * - TAVUS_API_KEY is never sent to the browser.
 * - Only the conversation_url (a short-lived Tavus token URL) is returned to
 *   the browser, which is safe to expose — it grants no admin access.
 */

export interface TavusConversationResult {
  conversationId: string;
  /** The URL to embed in an <iframe> on the candidate's browser. */
  conversationUrl: string;
  status: 'active' | 'starting';
}

function requireTavusEnv(name: string): string {
  const value = process.env[name];
  if (!value || value === 'your_replica_id_here' || value === 'your_face_id_here') {
    throw new Error(`Tavus avatar requires ${name} to be configured.`);
  }
  return value;
}

/**
 * Start a Tavus conversation for the given RoundTable session.
 *
 * Tavus v2 API (current) uses:
 *   - face_id  → the face/likeness the PAL renders. Was called replica_id in v1.
 *   - pal_id   → the PAL behaviour config (persona). Optional if the face has a default PAL.
 *
 * Your TAVUS_PERSONA_ID env var value (r72f7f7f7c8b) is actually a face_id —
 * Tavus renamed replica → face. We read TAVUS_FACE_ID first and fall back to
 * TAVUS_PERSONA_ID so existing env configs keep working without changes.
 */
export async function startTavusConversation(
  sessionId: string,
): Promise<TavusConversationResult> {
  const apiKey = requireTavusEnv('TAVUS_API_KEY');

  // Accept either the new (TAVUS_FACE_ID) or old (TAVUS_PERSONA_ID) env var name.
  const faceId =
    process.env.TAVUS_FACE_ID?.trim() ||
    process.env.TAVUS_PERSONA_ID?.trim();
  if (!faceId) throw new Error('Tavus avatar requires TAVUS_FACE_ID to be configured.');

  // pal_id is optional — only send it when explicitly configured.
  const palId = process.env.TAVUS_PAL_ID?.trim();

  const bodyPayload: Record<string, unknown> = {
    face_id: faceId,
    conversation_name: `roundtable-${sessionId.slice(0, 8)}`,
    conversational_context:
      'You are a professional AI interviewer on the RoundTable panel. ' +
      'Maintain warm, professional body language. ' +
      'Do not speak — the interview audio is handled by a separate system.',
    properties: {
      participant_absent_timeout: 300,
      max_call_duration: 5_400,
      enable_recording: false,
    },
  };

  if (palId) bodyPayload.pal_id = palId;

  const response = await fetch('https://tavusapi.com/v2/conversations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(bodyPayload),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Tavus API error ${response.status}: ${body}`);
  }

  const data = (await response.json()) as {
    conversation_id: string;
    conversation_url: string;
    status: string;
  };

  return {
    conversationId: data.conversation_id,
    conversationUrl: data.conversation_url,
    status: data.status === 'active' ? 'active' : 'starting',
  };
}

/**
 * End a Tavus conversation by its ID.
 * Safe to call if already ended — the 404 is swallowed.
 */
export async function endTavusConversation(conversationId: string): Promise<void> {
  const apiKey = requireTavusEnv('TAVUS_API_KEY');

  const response = await fetch(
    `https://tavusapi.com/v2/conversations/${conversationId}/end`,
    {
      method: 'POST',
      headers: { 'x-api-key': apiKey },
    },
  );

  if (response.status === 404) return; // Already ended — idempotent
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.error('[tavus] end conversation failed', { conversationId, status: response.status, body });
    // Don't throw — a failed stop should never crash the interview
  }
}

/**
 * Get the current status of a Tavus conversation.
 */
export async function getTavusConversationStatus(
  conversationId: string,
): Promise<{ status: string; conversationUrl?: string } | null> {
  const apiKey = requireTavusEnv('TAVUS_API_KEY');

  const response = await fetch(
    `https://tavusapi.com/v2/conversations/${conversationId}`,
    {
      headers: { 'x-api-key': apiKey },
    },
  );

  if (response.status === 404) return null;
  if (!response.ok) return null;

  const data = (await response.json()) as {
    status: string;
    conversation_url?: string;
  };

  return {
    status: data.status,
    conversationUrl: data.conversation_url,
  };
}
