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
  generateConvoAIToken,
  SpeakPriorityInterrupt,
} from 'agora-agents';
import { DEFAULT_AGENT_UID } from '@/lib/agora';
import { demoWelcome } from '@/lib/interview-demo';
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

export async function startInterviewAgent({
  sessionId,
  channel,
  rtcUid,
  llmToken,
  roleTitle = 'Software Engineer',
  durationMinutes = 30,
  demoMode = false,
  candidateName,
  panelRoleCount,
}: {
  sessionId: string;
  channel: string;
  rtcUid: string;
  llmToken: string;
  roleTitle?: string;
  durationMinutes?: number;
  demoMode?: boolean;
  candidateName?: string | null;
  panelRoleCount?: number;
}): Promise<string> {
  const client = new AgoraClient({
    area: resolveAgoraArea(),
    appId: requireAgoraEnv('NEXT_PUBLIC_AGORA_APP_ID'),
    appCertificate: requireAgoraEnv('NEXT_AGORA_APP_CERTIFICATE'),
  });
  const openingQuestion = demoMode
    ? demoWelcome(candidateName, panelRoleCount)
    : `Please introduce yourself and describe experience most relevant to the ${roleTitle} role.`;
  const instructions = `You are RoundTable's voice executor. Speak only the application-selected question or response, warmly and concisely. Understand Indian English and natural Hindi-English code switching; preserve the candidate's intended meaning. Never claim to be human, invent facts, make a hiring decision, or advance state yourself. A request to pause is acknowledged without advancing.`;

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
    // Nova-3 multi supports real-time English/Hindi code switching. A team
    // can opt into one known regional language (bn, mr, ta, te, etc.) through
    // DEEPGRAM_LANGUAGE without changing the agent lifecycle.
    .withStt(new DeepgramSTT({ model: 'nova-3', language: process.env.DEEPGRAM_LANGUAGE?.trim() || 'multi' }))
    .withLlm(new CustomLLM({
      apiKey: llmToken,
      url: `${resolvePublicBaseUrl()}/api/ai/chat/completions`,
      model: 'roundtable-controller',
      systemMessages: [{ role: 'system', content: instructions }],
      greetingMessage: openingQuestion,
    }))
    .withTts(createInterviewTts());

  console.info('[agora] interview agent starting', {
    sessionId,
    ttsProvider: 'gradium',
  });

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

export async function speakInterviewAgent(input: {
  agentId: string;
  channel: string;
  agentUid: string;
  text: string;
}): Promise<void> {
  const appId = requireAgoraEnv('NEXT_PUBLIC_AGORA_APP_ID');
  const appCertificate = requireAgoraEnv('NEXT_AGORA_APP_CERTIFICATE');
  const client = new AgoraClient({
    area: resolveAgoraArea(),
    appId,
    appCertificate,
  });
  const token = generateConvoAIToken({
    appId,
    appCertificate,
    channelName: input.channel,
    uid: Number(input.agentUid),
  });
  await client.agents.speak({
    appid: appId,
    agentId: input.agentId,
    text: input.text.slice(0, 512),
    priority: SpeakPriorityInterrupt,
    interruptable: false,
  }, { headers: { Authorization: `agora token=${token}` } });
}
