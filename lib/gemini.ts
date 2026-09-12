import { z } from 'zod';
import { createHash } from 'crypto';

const globalGroq = globalThis as typeof globalThis & { __roundtableGroqCooldowns?: Map<string, number> };
const cooldowns = globalGroq.__roundtableGroqCooldowns ??= new Map<string, number>();

function cooldownKey(model: string, apiKey: string): string {
  return createHash('sha256').update(`${model}:${apiKey}`).digest('hex');
}

function checkCooldown(model: string, apiKey: string): void {
  const key = cooldownKey(model, apiKey);
  const until = cooldowns.get(key) ?? 0;
  if (until > Date.now()) throw new GroqApiError(429, model, String(Math.ceil((until - Date.now()) / 1_000)), 'Provider cooldown active');
  cooldowns.delete(key);
}

async function providerError(response: Response, model: string, apiKey: string): Promise<never> {
  const retryAfter = response.headers.get('retry-after');
  if (response.status === 429) {
    const seconds = retryAfter && /^\d+(?:\.\d+)?$/.test(retryAfter)
      ? Number(retryAfter)
      : retryAfter ? (Date.parse(retryAfter) - Date.now()) / 1_000 : 60;
    const delay = Number.isFinite(seconds) ? Math.max(1, seconds) : 60;
    cooldowns.set(cooldownKey(model, apiKey), Date.now() + delay * 1_000);
  }
  throw new GroqApiError(response.status, model, retryAfter, (await response.text()).slice(0, 1_000));
}

type GroqResponse = {
  choices?: Array<{ message?: { content?: string | null; reasoning_content?: string | null } }>;
};

const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-20b';
const DEFAULT_JSON_COMPLETION_TOKENS = 2_048;

export class GroqApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly model: string,
    public readonly retryAfter: string | null,
    detail: string,
  ) {
    super(`Groq ${model} returned ${status}: ${detail}`);
    this.name = 'GroqApiError';
  }
}

export function isGroqRateLimitError(error: unknown): error is GroqApiError {
  return error instanceof GroqApiError && error.status === 429;
}

export function logGroqFallback(scope: string, fallback: string, error: unknown): void {
  if (error instanceof z.ZodError) {
    console.warn(`[${scope}] Groq returned an incomplete structured response; ${fallback}.`);
    return;
  }
  if (error instanceof GroqApiError && error.status === 413) {
    console.warn(`[${scope}] Groq request size limit for ${error.model}; ${fallback}.`);
    return;
  }
  if (isGroqRateLimitError(error)) {
    const retry = error.retryAfter ? ` Retry-After: ${error.retryAfter}.` : '';
    console.warn(`[${scope}] Groq rate limit reached for ${error.model}; ${fallback}.${retry}`);
    return;
  }
  console.error(`[${scope}] Groq generation failed; ${fallback}`, error);
}

function extractText(payload: GroqResponse): string {
  const message = payload.choices?.[0]?.message;
  return message?.content?.trim() || message?.reasoning_content?.trim() || '';
}

export function configuredGeminiModel(
  purpose: 'evaluator' | 'speaker' | 'planner' | 'assessment',
): string {
  if (purpose === 'evaluator') {
    return process.env.GROQ_EVALUATOR_MODEL ?? DEFAULT_GROQ_MODEL;
  }
  if (purpose === 'planner') {
    return process.env.GROQ_PLANNER_MODEL ?? process.env.GROQ_SPEAKER_MODEL ?? DEFAULT_GROQ_MODEL;
  }
  if (purpose === 'assessment') {
    return process.env.GROQ_ASSESSMENT_MODEL ?? process.env.GROQ_SPEAKER_MODEL ?? DEFAULT_GROQ_MODEL;
  }
  return process.env.GROQ_SPEAKER_MODEL ?? DEFAULT_GROQ_MODEL;
}

export async function generateGeminiJson<T>({
  model,
  system,
  prompt,
  schema,
  signal,
  maxCompletionTokens = DEFAULT_JSON_COMPLETION_TOKENS,
  maxInputBytes,
}: {
  model: string;
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
  signal?: AbortSignal;
  maxCompletionTokens?: number;
  maxInputBytes?: number;
}): Promise<T> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not configured');
  checkCooldown(model, apiKey);
  const systemContent = `${system}\nReturn only valid JSON matching this schema: ${JSON.stringify(z.toJSONSchema(schema))}`;
  if (maxInputBytes !== undefined && Buffer.byteLength(systemContent + prompt, 'utf8') > maxInputBytes) {
    throw new GroqApiError(413, model, null, 'Local input budget exceeded');
  }

  const response = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        model,
        messages: [{
          role: 'system',
          content: systemContent,
        }, { role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        ...(['openai/gpt-oss-20b', 'openai/gpt-oss-120b'].includes(model) ? { reasoning_effort: 'low' } : {}),
        temperature: 0.2,
        max_completion_tokens: Math.max(256, Math.min(8_192, Math.trunc(maxCompletionTokens))),
      }),
    },
  );

  if (!response.ok) {
    return providerError(response, model, apiKey);
  }

  const payload = (await response.json()) as GroqResponse;
  const text = extractText(payload);
  if (!text) throw new Error(`Groq ${model} returned no text`);
  return schema.parse(JSON.parse(text));
}

export async function generateGeminiText({
  model,
  system,
  prompt,
  signal,
  maxCompletionTokens = 192,
}: {
  model: string;
  system: string;
  prompt: string;
  signal?: AbortSignal;
  maxCompletionTokens?: number;
}): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not configured');
  checkCooldown(model, apiKey);

  const response = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }],
        temperature: 0.45,
        ...(['openai/gpt-oss-20b', 'openai/gpt-oss-120b'].includes(model) ? { reasoning_effort: 'low' } : {}),
        max_completion_tokens: Math.max(64, Math.min(512, Math.trunc(maxCompletionTokens))),
      }),
    },
  );

  if (!response.ok) {
    return providerError(response, model, apiKey);
  }
  const text = extractText((await response.json()) as GroqResponse);
  if (!text) throw new Error(`Groq ${model} returned no text`);
  return text;
}
