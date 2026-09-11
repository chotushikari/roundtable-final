import { GradiumTTS, MiniMaxTTS, SarvamTTS } from 'agora-agents';

const MINIMAX_FALLBACK = {
  model: 'speech_2_6_turbo',
  voiceId: 'English_captivating_female1',
} as const;

/**
 * Prefer Gradium when a server-only key and a selected voice are configured.
 * The application intentionally runs one physical Agora agent for the whole
 * interview, so this is one stable delivery voice rather than a browser-owned
 * or mid-session role voice switch.
 *
 * Sarvam remains a native fallback for existing deployments, followed by the
 * established MiniMax startup fallback when neither server-only provider is
 * configured.
 */
export function createInterviewTts(
  sarvamApiKey = process.env.SARVAM_API_KEY,
  speaker = process.env.SARVAM_TTS_VOICE?.trim() || 'anushka',
) {
  // Keep the historical explicit Sarvam arguments usable in offline tests and
  // existing integrations. Runtime callers provide no arguments, enabling the
  // configured Gradium-first provider selection below.
  if (arguments.length === 0) {
    const gradiumKey = process.env.GRADIUM_API_KEY?.trim();
    const gradiumVoiceId = process.env.GRADIUM_TTS_VOICE_ID?.trim()
      || process.env.GRADIUM_HIRING_MANAGER_VOICE_ID?.trim();
    if (gradiumKey && gradiumVoiceId) {
      return new GradiumTTS({
        apiKey: gradiumKey,
        url: process.env.GRADIUM_TTS_URL?.trim() || 'wss://api.gradium.ai/api/speech/tts',
        modelName: 'default',
        voiceId: gradiumVoiceId,
        sampleRate: 24_000,
      });
    }
  }

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
