import type { RTMClient } from 'agora-rtm';

export interface AgoraTokenData {
  token: string;
  rtcToken?: string;
  rtmToken?: string;
  uid: string;
  rtcUid?: string;
  channel: string;
  agentId?: string;
  sessionId?: string;
  agentUid?: string;
  expiresAt?: string;
  interviewEndsAt?: string;
}

export interface ClientStartRequest {
  requester_id: string;
  channel_name: string;
  experience?: 'interview' | 'companion';
}

export interface StopConversationRequest {
  agent_id: string;
}

export interface AgentResponse {
  agent_id: string;
  create_ts: number;
  state: string;
}

export interface AgoraRenewalTokens {
  rtcToken: string;
  rtmToken: string;
}

export interface ConversationComponentProps {
  agoraData: AgoraTokenData;
  rtmClient: RTMClient;
  onTokenWillExpire: (uid: string) => Promise<AgoraRenewalTokens>;
  onEndConversation: () => void;
  compactDemo?: boolean;
  companionDemo?: boolean;
  candidateName?: string;
  panelRoleCount?: number;
}
