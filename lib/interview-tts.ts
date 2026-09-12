import { GradiumTTS } from 'agora-agents';
import type { PanelRole } from '@/types/interview';

const VOICE_ENV: Record<PanelRole, string> = {
  hiring_manager: 'GRADIUM_HIRING_MANAGER_VOICE_ID',
  technical: 'GRADIUM_TECHNICAL_VOICE_ID',
  product: 'GRADIUM_PRODUCT_VOICE_ID',
  customer: 'GRADIUM_CUSTOMER_VOICE_ID',
  behavioral: 'GRADIUM_BEHAVIORAL_VOICE_ID',
};

export function interviewVoiceId(role: PanelRole): string | null {
  // The role-specific variables take precedence. GRADIUM_TTS_VOICE_ID remains
  // a backwards-compatible fallback for teams that only configured one voice.
  return process.env[VOICE_ENV[role]]?.trim()
    || process.env.GRADIUM_TTS_VOICE_ID?.trim()
    || process.env.GRADIUM_HIRING_MANAGER_VOICE_ID?.trim()
    || null;
}

/**
 * Each panel role receives its own server-selected Gradium voice. Voice choice
 * remains server-owned and no provider credential enters the browser.
 */
export function createInterviewTts(role: PanelRole = 'hiring_manager') {
  const gradiumKey = process.env.GRADIUM_API_KEY?.trim();
  const gradiumVoiceId = interviewVoiceId(role);

  if (!gradiumKey || !gradiumVoiceId) {
    throw new Error(`Gradium TTS requires GRADIUM_API_KEY and ${VOICE_ENV[role]} (or GRADIUM_TTS_VOICE_ID).`);
  }

  return new GradiumTTS({
    apiKey: gradiumKey,
    url: process.env.GRADIUM_TTS_URL?.trim() || 'wss://api.gradium.ai/api/speech/tts',
    modelName: 'default',
    voiceId: gradiumVoiceId,
    sampleRate: 24_000,
  });
}
