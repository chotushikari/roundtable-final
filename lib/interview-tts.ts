import { GradiumTTS } from 'agora-agents';

/**
 * Prefer Gradium when a server-only key and a selected voice are configured.
 * The application intentionally runs one physical Agora agent for the whole
 * interview, so this is one stable delivery voice rather than a browser-owned
 * or mid-session role voice switch.
 *
 */
export function createInterviewTts() {
  const gradiumKey = process.env.GRADIUM_API_KEY?.trim();
  const gradiumVoiceId = process.env.GRADIUM_TTS_VOICE_ID?.trim()
    || process.env.GRADIUM_HIRING_MANAGER_VOICE_ID?.trim();

  if (!gradiumKey || !gradiumVoiceId) {
    throw new Error('Gradium TTS requires GRADIUM_API_KEY and GRADIUM_TTS_VOICE_ID (or GRADIUM_HIRING_MANAGER_VOICE_ID).');
  }

  return new GradiumTTS({
    apiKey: gradiumKey,
    url: process.env.GRADIUM_TTS_URL?.trim() || 'wss://api.gradium.ai/api/speech/tts',
    modelName: 'default',
    voiceId: gradiumVoiceId,
    sampleRate: 24_000,
  });
}
