import { GenericTTS, MiniMaxTTS } from 'agora-agents';
import { resolvePublicBaseUrl } from '@/lib/public-url';

const MINIMAX_FALLBACK = {
  model: 'speech_2_6_turbo',
  voiceId: 'English_captivating_female1',
} as const;

/**
 * Prefer Sarvam Bulbul v3 for Indian-English interview delivery when it is configured.
 * Agora's managed Sarvam adapter does not support the Bulbul v3-only `shubh`
 * speaker, so Agora calls our authenticated PCM bridge instead.
 * MiniMax remains the safe startup fallback for environments without a Sarvam key.
 */
export function createInterviewTts(
  sarvamApiKey = process.env.SARVAM_API_KEY,
  publicBaseUrl = resolvePublicBaseUrl(),
) {
  const key = sarvamApiKey?.trim();
  if (key) {
    return new GenericTTS({
      url: `${publicBaseUrl.replace(/\/$/, '')}/api/ai/sarvam/tts`,
      headers: { Authorization: `Bearer ${key}` },
      model: 'bulbul:v3',
      voice: 'shubh',
      speed: 1,
      sampleRate: 24_000,
      responseFormat: 'pcm',
    });
  }

  return new MiniMaxTTS(MINIMAX_FALLBACK);
}
