import { randomInt } from 'crypto';
import { RtcRole, RtcTokenBuilder } from 'agora-token';
import {
  AgoraClient,
  type AgoraArea,
  Agent,
  Area,
  CustomLLM,
  DeepgramSTT,
  ExpiresIn,
  GenericAvatar,
} from 'agora-agents';
import { DEFAULT_AGENT_UID, DEFAULT_AVATAR_UID } from '@/lib/agora';
import { DEMO_OPENING_QUESTION } from '@/lib/interview-demo';
import { createInterviewTts } from '@/lib/interview-tts';
import { resolvePublicBaseUrl } from '@/lib/public-url';

const TOKEN_TTL_SECONDS = 3_600;

function requireAgoraEnv(name: 'NEXT_PUBLIC_AGORA_APP_ID' | 'NEXT_AGORA_APP_CERTIFICATE'): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function createAgoraChannel(sessionId: string): string {
  return `roundtable-${sessionId.replaceAll('-', '').slice(0, 20)}`;
}

export function createAgoraRtcUid(): string {
  return String(randomInt(1_000, 2_000_000_000));
}

export function createAgoraToken(channel: string, uid: string): { token: string; expiresAt: string } {
  const appId = requireAgoraEnv('NEXT_PUBLIC_AGORA_APP_ID');
  const certificate = requireAgoraEnv('NEXT_AGORA_APP_CERTIFICATE');
  const expires = Math.floor(Date.now() / 1_000) + TOKEN_TTL_SECONDS;
  return {
    token: RtcTokenBuilder.buildTokenWithRtm(
      appId,
      certificate,
      channel,
      uid,
      RtcRole.PUBLISHER,
      expires,
      expires,
    ),
    expiresAt: new Date(expires * 1_000).toISOString(),
  };
}

function resolveAgoraArea(): AgoraArea {
  const envArea = process.env.AGORA_AREA?.toUpperCase();
  if (envArea === 'US') return Area.US;
  if (envArea === 'EU') return Area.EU;
  if (envArea === 'CN') return Area.CN;
  if (envArea === 'AP') return Area.AP;
  return Area.US;
}

function getProtofaceAvatarConfig(): { apiKey: string; avatarId: string; apiBaseUrl: string } | null {
  const apiKey = process.env.PROTOFACE_API_KEY?.trim();
  const avatarId = process.env.PROTOFACE_AVATAR_ID?.trim();
  if (!apiKey || !avatarId) return null;
  return {
    apiKey,
    avatarId,
    apiBaseUrl: (process.env.PROTOFACE_AGORA_BASE_URL?.trim() || 'https://api.protoface.com/v1/agora/').replace(/\/+$/, ''),
  };
}

export async function startInterviewAgent({
  sessionId,
  channel,
  rtcUid,
  llmToken,
  roleTitle = 'Software Engineer',
  durationMinutes = 30,
  demoMode = false,
}: {
  sessionId: string;
  channel: string;
  rtcUid: string;
  llmToken: string;
  roleTitle?: string;
  durationMinutes?: number;
  demoMode?: boolean;
}): Promise<string> {
  const client = new AgoraClient({
    area: resolveAgoraArea(),
    appId: requireAgoraEnv('NEXT_PUBLIC_AGORA_APP_ID'),
    appCertificate: requireAgoraEnv('NEXT_AGORA_APP_CERTIFICATE'),
  });
  const openingQuestion = demoMode
    ? DEMO_OPENING_QUESTION
    : `Please introduce yourself and describe experience most relevant to the ${roleTitle} role.`;
  const instructions = `You are the voice executor for RoundTable's AI interview panel. The application-controlled custom LLM selects exactly one panel role and one question per turn. Speak its text faithfully, warmly, and concisely. Never claim to be human. Never make a hire or reject decision. Allow the candidate to interrupt naturally. When the candidate asks for a moment to think, acknowledge it calmly and do not advance the interview. Linear actions are controlled by the application: a comment is posted only after the application reads a preview and receives explicit candidate confirmation. Never invent a Linear result.`;

  let agent = new Agent({
    client,
    instructions,
    failureMessage: 'I had trouble evaluating that answer. Could you give one concrete example with your own action and result?',
    maxHistory: 50,
    turnDetection: {
      config: {
        speech_threshold: 0.5,
        start_of_speech: {
          mode: 'vad',
          vad_config: { interrupt_duration_ms: 160, prefix_padding_ms: 300 },
        },
        end_of_speech: {
          mode: 'vad',
          vad_config: { silence_duration_ms: demoMode ? 1500 : 480 },
        },
      },
    },
    advancedFeatures: { enable_rtm: true, enable_tools: true },
    parameters: {
      audio_scenario: 'chorus',
      data_channel: 'rtm',
      enable_error_message: true,
      enable_metrics: true,
    },
  })
    .withStt(new DeepgramSTT({ model: 'nova-3', language: 'en' }))
    .withLlm(new CustomLLM({
      apiKey: llmToken,
      url: `${resolvePublicBaseUrl()}/api/ai/chat/completions`,
      model: 'roundtable-controller',
      systemMessages: [{ role: 'system', content: instructions }],
      greetingMessage: openingQuestion,
    }))
    .withTts(createInterviewTts());

  // Protoface implements Agora's GenericAvatar contract. When configured it
  // publishes an actual talking-avatar video track into this same RTC channel.
  // The voice agent, controller, transcript, and assessment remain unchanged.
  const avatar = getProtofaceAvatarConfig();
  if (avatar) {
    agent = agent.withAvatar(new GenericAvatar({
      apiKey: avatar.apiKey,
      apiBaseUrl: avatar.apiBaseUrl,
      avatarId: avatar.avatarId,
      agoraUid: String(DEFAULT_AVATAR_UID),
    }));
  }

  const session = agent.createSession({
    channel,
    agentUid: String(DEFAULT_AGENT_UID),
    remoteUids: [rtcUid],
    idleTimeout: Math.max(60, durationMinutes * 60 + 30),
    expiresIn: ExpiresIn.hours(1),
    debug: false,
  });
  const agentId = await session.start();
  console.info('[agora] interview agent started', { sessionId, agentId });
  return agentId;
}

export async function stopInterviewAgent(agentId: string): Promise<void> {
  const client = new AgoraClient({
    area: resolveAgoraArea(),
    appId: requireAgoraEnv('NEXT_PUBLIC_AGORA_APP_ID'),
    appCertificate: requireAgoraEnv('NEXT_AGORA_APP_CERTIFICATE'),
  });
  try {
    await client.stopAgent(agentId);
  } catch (error) {
    const item = error as { statusCode?: number; body?: { detail?: string } };
    const detail = item.body?.detail?.toLocaleLowerCase() ?? '';
    if (item.statusCode === 404 || detail.includes('already in the process of shutting down')) return;
    throw error;
  }
}
