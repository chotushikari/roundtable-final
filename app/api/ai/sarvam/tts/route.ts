import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

const SARVAM_STREAM_URL = 'https://api.sarvam.ai/text-to-speech/stream';
const MAX_INPUT_LENGTH = 2_500;

function hasValidAuthorization(request: NextRequest, apiKey: string): boolean {
  const supplied = request.headers.get('authorization');
  const expected = `Bearer ${apiKey}`;
  if (!supplied) return false;

  const suppliedBytes = Buffer.from(supplied);
  const expectedBytes = Buffer.from(expected);
  return suppliedBytes.length === expectedBytes.length && timingSafeEqual(suppliedBytes, expectedBytes);
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.SARVAM_API_KEY?.trim();
  if (!apiKey || !hasValidAuthorization(request, apiKey)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let input: unknown;
  try {
    ({ input } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (typeof input !== 'string' || !input.trim() || input.length > MAX_INPUT_LENGTH) {
    return NextResponse.json({ error: 'input must be a non-empty string up to 2500 characters' }, { status: 400 });
  }

  try {
    const upstream = await fetch(SARVAM_STREAM_URL, {
      method: 'POST',
      headers: {
        'api-subscription-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        text: input.trim(),
        model: 'bulbul:v3',
        language_code: 'en-IN',
        speaker: 'shubh',
        output_audio_codec: 'linear16',
        speech_sample_rate: 24_000,
      }),
      cache: 'no-store',
    });

    if (!upstream.ok || !upstream.body) {
      console.error('Sarvam TTS bridge upstream failure', { status: upstream.status });
      return NextResponse.json({ error: 'Speech synthesis is temporarily unavailable' }, { status: 502 });
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Sarvam TTS bridge request failed', error);
    return NextResponse.json({ error: 'Speech synthesis is temporarily unavailable' }, { status: 502 });
  }
}
