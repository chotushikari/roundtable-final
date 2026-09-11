import { MiniMaxTTS, SarvamTTS } from 'agora-agents';

const MINIMAX_FALLBACK = {
  model: 'speech_2_6_turbo',
  voiceId: 'English_captivating_female1',
} as const;

/**
 * Prefer Agora's native Sarvam adapter when it is configured. This is the
 * supported ConvoAI integration and avoids making a live agent depend on a
 * callback through the application's serverless runtime.
 *
 * `shubh` is a Bulbul v3 API voice but is not in Agora's currently supported
 * Sarvam voice list. Use the supported `anushka` delivery voice for a reliable
 * live interview; MiniMax remains the no-key startup fallback.
 */
export function createInterviewTts(
  sarvamApiKey = process.env.SARVAM_API_KEY,
  speaker = process.env.SARVAM_TTS_VOICE?.trim() || 'anushka',
) {
  const key = sarvamApiKey?.trim();
  if (key) {
    return new SarvamTTS({
      key,
      speaker,
      targetLanguageCode: 'en-IN',
      sampleRate: 24_000,
      pace: 1,
    });
  }

  return new MiniMaxTTS(MINIMAX_FALLBACK);
}
