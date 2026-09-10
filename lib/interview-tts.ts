import { MiniMaxTTS, SarvamTTS } from 'agora-agents';

const MINIMAX_FALLBACK = {
  model: 'speech_2_6_turbo',
  voiceId: 'English_captivating_female1',
} as const;

/**
 * Prefer Sarvam for Indian-English interview delivery when it is configured.
 * MiniMax remains the safe startup fallback for environments without a Sarvam key.
 */
export function createInterviewTts(sarvamApiKey = process.env.SARVAM_API_KEY) {
  const key = sarvamApiKey?.trim();
  if (key) {
    return new SarvamTTS({
      key,
      speaker: 'shubh',
      targetLanguageCode: 'en-IN',
    });
  }

  return new MiniMaxTTS(MINIMAX_FALLBACK);
}
