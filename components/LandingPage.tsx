'use client';

import { useState, useRef, Suspense, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Mic } from 'lucide-react';
import type { RTMClient } from 'agora-rtm';
import type {
  AgoraTokenData,
  ClientStartRequest,
  AgentResponse,
  AgoraRenewalTokens,
} from '../types/conversation';
import { ErrorBoundary } from './ErrorBoundary';
import { LoadingSkeleton } from './LoadingSkeleton';
import { QuickstartPreCallCard } from './QuickstartPreCallCard';
import { RoundTableLoadingScreen } from './RoundTableLoadingScreen';
import { InterviewPreparationScreen } from './InterviewPreparationScreen';
import { Button } from './ui/button';

// Dynamically import the ConversationComponent with ssr disabled
const ConversationComponent = dynamic(() => import('./ConversationComponent'), {
  ssr: false,
});

// Dynamically import AgoraRTCProvider (browser-only).
// The AgoraVoiceAI toolkit is initialized inside ConversationComponent after
// the RTC join succeeds, so this wrapper only needs to provide the RTC client.
const AgoraProvider = dynamic(
  async () => {
    type RtcClient = { mode?: string; codec?: string };
    type RtcProviderComponent = React.ComponentType<{ client: unknown; children: React.ReactNode }>;
    type ModuleWithClient = {
      createClient?: (config: { mode: string; codec: string }) => RtcClient;
      default?: { createClient?: (config: { mode: string; codec: string }) => RtcClient };
      AgoraRTCProvider?: RtcProviderComponent;
    };

    const rtcReactMod = (await import('agora-rtc-react')) as unknown as ModuleWithClient & {
      default?: ModuleWithClient;
    };

    const AgoraRTCProvider =
      rtcReactMod.AgoraRTCProvider ??
      rtcReactMod.default?.AgoraRTCProvider ??
      (typeof rtcReactMod.default === 'function' ? (rtcReactMod.default as unknown as RtcProviderComponent) : undefined);

    let AgoraRTC =
      rtcReactMod.default?.default ??
      rtcReactMod.default ??
      rtcReactMod;

    if (!AgoraRTC?.createClient) {
      try {
        const rtcSdkMod = (await import('agora-rtc-sdk-ng')) as unknown as {
          default?: { createClient?: (config: { mode: string; codec: string }) => RtcClient };
          createClient?: (config: { mode: string; codec: string }) => RtcClient;
        };
        AgoraRTC = rtcSdkMod.default ?? rtcSdkMod;
      } catch (err) {
        console.warn('Could not load agora-rtc-sdk-ng:', err);
      }
    }

    return {
      default: function AgoraProviders({
        children,
      }: {
        children: React.ReactNode;
      }) {
        const clientRef = useRef<RtcClient | null>(null);
        if (!clientRef.current && AgoraRTC?.createClient) {
          try {
            clientRef.current = AgoraRTC.createClient({
              mode: 'rtc',
              codec: 'vp8',
            });
          } catch (err) {
            console.error('Failed to create Agora RTC client:', err);
          }
        }
        if (!AgoraRTCProvider || !clientRef.current) {
          return <>{children}</>;
        }
        return (
          <AgoraRTCProvider client={clientRef.current}>
            {children}
          </AgoraRTCProvider>
        );
      },
    };
  },
  { ssr: false },
);

type InvitationPreview = {
  roleTitle: string;
  companyName: string;
  durationMinutes: number;
  panelRoles: string[];
  demoMode?: boolean;
  candidateName?: string | null;
  existingSession?: { id: string; status: string } | null;
};

export default function LandingPage({
  invitationToken,
  variant = 'full',
  startSignal = 0,
  onActivityChange,
}: {
  invitationToken?: string;
  variant?: 'full' | 'compact-demo' | 'companion-demo';
  startSignal?: number;
  onActivityChange?: (active: boolean) => void;
}) {
  const compactDemo = variant === 'compact-demo';
  const companionDemo = variant === 'companion-demo';
  const embeddedDemo = compactDemo || companionDemo;
  const [showConversation, setShowConversation] = useState(false);

  // Preload heavy modules on mount so they're already cached when the user
  // clicks "Try it Now" — eliminates the ~1.8s dynamic-import delay.
  useEffect(() => {
    import('agora-rtc-react').catch(() => {});
    import('agora-rtm').catch(() => {});
  }, []);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agoraData, setAgoraData] = useState<AgoraTokenData | null>(null);
  const [rtmClient, setRtmClient] = useState<RTMClient | null>(null);
  const [agentJoinError, setAgentJoinError] = useState(false);
  const [consent, setConsent] = useState(false);
  const [candidateName, setCandidateName] = useState('');
  const [invitation, setInvitation] = useState<InvitationPreview | null>(null);
  const [completed, setCompleted] = useState(false);
  const [releasedFeedback, setReleasedFeedback] = useState<{ strengths: string[]; growthAreas: string[] } | null>(null);
  const [isInvitationLoading, setIsInvitationLoading] = useState(Boolean(invitationToken));
  const startInFlightRef = useRef(false);
  const endInFlightRef = useRef(false);
  const lastStartSignalRef = useRef(0);

  useEffect(() => {
    onActivityChange?.(isLoading || showConversation || isEnding);
  }, [isLoading, showConversation, isEnding, onActivityChange]);

  useEffect(() => () => onActivityChange?.(false), [onActivityChange]);

  useEffect(() => {
    if (!invitationToken) return;
    fetch(`/api/invitations/${encodeURIComponent(invitationToken)}`, { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? 'Invitation could not be loaded');
        setInvitation(data);
        if (typeof data.candidateName === 'string') setCandidateName(data.candidateName);
        if (data.existingSession?.status === 'completed') {
          setCompleted(true);
          void fetch(`/api/sessions/${data.existingSession.id}`)
            .then((result) => result.json())
            .then((result) => setReleasedFeedback(result.feedback ?? null));
        }
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Invitation could not be loaded'))
      .finally(() => setIsInvitationLoading(false));
  }, [invitationToken]);

  const handleStartConversation = async () => {
    if (startInFlightRef.current) return;
    startInFlightRef.current = true;
    setIsLoading(true);
    setError(null);
    setAgentJoinError(false);

    try {
      if (invitationToken) {
        const resumeId = invitation?.existingSession && ['ready', 'starting', 'in_progress'].includes(invitation.existingSession.status)
          ? invitation.existingSession.id
          : null;
        const sessionResponse = await fetch(resumeId
          ? `/api/sessions/${resumeId}/resume`
          : `/api/invitations/${encodeURIComponent(invitationToken)}/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: resumeId ? undefined : JSON.stringify({ consent, candidateName: candidateName.trim() }),
        });
        const responseData = await sessionResponse.json();
        if (!sessionResponse.ok) throw new Error(responseData.error ?? 'Failed to start interview');
        const agentStartPromise = responseData.agentId
          ? Promise.resolve({ ok: true, data: { agentId: responseData.agentId } })
          : fetch(`/api/sessions/${responseData.sessionId}/start`, { method: 'POST' })
            .then(async (response) => ({ ok: response.ok, data: await response.json() }));
        const { default: AgoraRTM } = await import('agora-rtm');
        const rtm: RTMClient = new AgoraRTM.RTM(
          process.env.NEXT_PUBLIC_AGORA_APP_ID!,
          responseData.rtcUid,
        );
        await rtm.login({ token: responseData.rtmToken });
        await rtm.subscribe(responseData.channel);
        setRtmClient(rtm);
        setAgoraData({ ...responseData, uid: responseData.rtcUid, token: responseData.rtcToken });
        setShowConversation(true);
        void agentStartPromise.then(({ ok, data }) => {
          if (!ok) {
            fetch(`/api/sessions/${responseData.sessionId}`)
              .then((res) => res.ok ? res.json() : null)
              .then((sessionData) => {
                if (sessionData?.session?.status === 'in_progress') {
                  setAgentJoinError(false);
                  return;
                }
                setAgentJoinError(true);
                setError(data?.error ?? 'The AI interviewer could not join.');
              })
              .catch(() => {
                setAgentJoinError(true);
                setError(data?.error ?? 'The AI interviewer could not join.');
              });
            return;
          }
          if (data.agentId) {
            setAgentJoinError(false);
            setAgoraData((current) => current ? { ...current, agentId: data.agentId } : current);
          }
        }).catch((startError) => {
          console.error('Failed to start interview agent:', startError);
          setAgentJoinError(true);
        });
        return;
      }
      // 1. Fetch RTC token + channel
      // console.log('Fetching Agora token...');
      const agoraResponse = await fetch('/api/generate-agora-token');
      const responseData = await agoraResponse.json();
      // console.log('Agora token response: uid =', responseData.uid, 'channel =', responseData.channel);

      if (!agoraResponse.ok) {
        throw new Error(
          `Failed to generate Agora token: ${JSON.stringify(responseData)}`,
        );
      }

      // 2. Run agent invite and RTM setup in parallel — both only need the token response.
      //    RTM must be ready before ConversationComponent mounts so AgoraVoiceAI
      //    can subscribe immediately. Agent invite is non-fatal.
      const [agentData, rtm] = await Promise.all([
        // 2a. Start the AI agent
        fetch('/api/invite-agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requester_id: responseData.uid,
            channel_name: responseData.channel,
            experience: companionDemo ? 'companion' : 'interview',
          } as ClientStartRequest),
        })
          .then(async (res) => {
            if (!res.ok) {
              setAgentJoinError(true);
              return null;
            }
            return res.json() as Promise<AgentResponse>;
          })
          .catch((err) => {
            console.error('Failed to start conversation with agent:', err);
            setAgentJoinError(true);
            return null;
          }),

        // 2b. Set up RTM (dynamically imported to keep it client-only)
        (async () => {
          const { default: AgoraRTM } = await import('agora-rtm');
          const rtm: RTMClient = new AgoraRTM.RTM(
            process.env.NEXT_PUBLIC_AGORA_APP_ID!,
            responseData.uid,
          );
          await rtm.login({ token: responseData.token });
          await rtm.subscribe(responseData.channel);
          // console.log('RTM ready, channel:', responseData.channel);
          return rtm;
        })(),
      ]);

      // 3. All dependencies ready — store state and show conversation
      setRtmClient(rtm);
      setAgoraData({ ...responseData, agentId: agentData?.agent_id });
      setShowConversation(true);
    } catch (err) {
      setError('Failed to start conversation. Please try again.');
      console.error('Error starting conversation:', err);
    } finally {
      setIsLoading(false);
      startInFlightRef.current = false;
    }
  };

  useEffect(() => {
    if (!embeddedDemo || showConversation || startSignal <= 0 || startSignal === lastStartSignalRef.current) return;
    lastStartSignalRef.current = startSignal;
    void handleStartConversation();
    // The signal is the deliberate trigger. Session state guards duplicate starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embeddedDemo, showConversation, startSignal]);

  const handleTokenWillExpire = useCallback(
    async (uid: string): Promise<AgoraRenewalTokens> => {
      try {
        const channel = agoraData?.channel;
        if (!channel) {
          throw new Error('Missing channel for token renewal');
        }

        // RTC and RTM tokens are renewed independently:
        //   - RTC uses the browser client's assigned UID (passed in from ConversationComponent).
        //   - RTM uses the same UID that was used during RTM login (agoraData.uid).
        // Both are fetched in parallel to stay within the token-expiry grace-period window.
        if (agoraData.sessionId) {
          const response = await fetch(`/api/sessions/${agoraData.sessionId}/renew`, { method: 'POST' });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error ?? 'Failed to renew session tokens');
          return { rtcToken: data.rtcToken, rtmToken: data.rtmToken };
        }
        const [rtcResponse, rtmResponse] = await Promise.all([
          fetch(`/api/generate-agora-token?channel=${channel}&uid=${uid}`),
          fetch(`/api/generate-agora-token?channel=${channel}&uid=${agoraData.uid}`),
        ]);
        const [rtcData, rtmData] = await Promise.all([
          rtcResponse.json(),
          rtmResponse.json(),
        ]);

        if (!rtcResponse.ok || !rtmResponse.ok) {
          throw new Error('Failed to generate renewal tokens');
        }

        return {
          rtcToken: rtcData.token,
          rtmToken: rtmData.token,
        };
      } catch (error) {
        console.error('Error renewing token:', error);
        throw error;
      }
    },
    [agoraData],
  );

  const handleEndConversation = async () => {
    if (endInFlightRef.current) return;
    endInFlightRef.current = true;
    setIsEnding(true);
    if (agoraData?.sessionId) {
      try {
        await fetch(`/api/sessions/${agoraData.sessionId}/stop`, { method: 'POST' });
        await fetch(`/api/sessions/${agoraData.sessionId}/finalize`, { method: 'POST' });
        setCompleted(true);
      } catch (stopError) {
        console.error('Failed to finalize interview:', stopError);
      }
    }
    // Stop the AI agent
    if (agoraData?.agentId && !agoraData.sessionId) {
      try {
        // console.log('Stopping agent:', agoraData.agentId);
        const response = await fetch('/api/stop-conversation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agent_id: agoraData.agentId }),
        });
        if (!response.ok) {
          console.error('Failed to stop agent:', await response.text());
        }
        // else console.log('Agent stopped successfully');
      } catch (error) {
        console.error('Error stopping agent:', error);
      }
    }

    // Tear down RTM — owned here since we created it here
    rtmClient?.logout().catch((err) => console.error('RTM logout error:', err));
    setRtmClient(null);
    setShowConversation(false);
    endInFlightRef.current = false;
    setIsEnding(false);
  };

  return (
    <div className={compactDemo ? 'relative flex min-h-[20rem] flex-col bg-[#171717] text-[#ededed]' : companionDemo ? 'relative flex min-h-[4.5rem] flex-col bg-transparent text-[#ededed]' : 'relative flex h-dvh min-h-screen flex-col overflow-hidden bg-[#0d0d0d] text-[#ededed] before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(rgba(255,255,255,.022)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.022)_1px,transparent_1px)] before:bg-[size:48px_48px]'}>
      {!embeddedDemo && isInvitationLoading && <RoundTableLoadingScreen overlay label="Opening your interview" />}
      {!embeddedDemo && isLoading && <InterviewPreparationScreen phase="bootstrapping" overlay />}
      {!embeddedDemo && isEnding && <RoundTableLoadingScreen overlay label="Finalizing your interview" />}
      {/* Hero shell: either shows the pre-call CTA or swaps in the live conversation experience. */}
      <div
        className={`flex min-h-0 flex-1 flex-col ${
          showConversation
            ? 'items-stretch justify-start'
            : 'items-center justify-center'
        }`}
      >
        <div
          className={`z-10 flex min-h-0 flex-1 flex-col ${
            showConversation
              ? 'h-full w-full max-w-none items-stretch gap-0 px-0 text-left'
              : 'w-full max-w-none items-center justify-center px-4 text-center'
          }`}
        >
          {!showConversation ? (
            completed ? (
              <div className="max-w-lg rounded-3xl border border-[#2d2d2d] bg-[#141414] p-10 text-center shadow-[0_30px_100px_rgba(0,0,0,.4)]">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-[#315241] bg-[#3ecf8e12] text-xl text-[#3ecf8e]">✓</span>
                <h1 className="mt-6 text-3xl font-medium tracking-[-.04em]">Interview complete</h1>
                <p className="mt-3 text-sm leading-6 text-[#858585]">Thank you for taking the time. Your evidence is ready for human review. Feedback appears only if the company releases it.</p>
                {releasedFeedback && <div className="mt-6 text-left text-sm"><h2 className="font-semibold">Released summary</h2><p className="mt-2">Strengths: {releasedFeedback.strengths.join(' ') || 'No supported strength was released.'}</p><p className="mt-2">Growth areas: {releasedFeedback.growthAreas.join(' ') || 'No growth area was released.'}</p></div>}
              </div>
            ) : (
              embeddedDemo ? (
                companionDemo ? (
                  <p className="py-3 text-center text-xs leading-5 text-[#898989]" aria-live="polite">
                    {isLoading ? 'Connecting the Agora companion...' : error ?? 'Tap the companion to hear its Agora voice.'}
                  </p>
                ) : (
                <div className="flex min-h-[20rem] w-full flex-col justify-between px-5 pb-5 pt-6 text-left">
                  <div className="flex flex-1 flex-col items-center justify-center text-center">
                    <div className="grid h-9 w-9 place-items-center rounded-full border border-[#353535] bg-[#1d1d1d] text-[#3ecf8e]">
                      <Mic size={15} />
                    </div>
                    <p className="mt-4 max-w-sm text-[26px] font-normal leading-9 tracking-[-0.035em] text-[#ededed]">What did you build that made something better?</p>
                    <p className="mt-3 text-sm text-[#a3a3a3]">One question. Your voice. A thoughtful response.</p>
                  </div>
                  <div className="flex min-h-14 flex-wrap items-center gap-3 rounded-xl border border-[#303030] bg-[#202020] p-3 shadow-[0_12px_34px_rgba(0,0,0,.22)]">
                    <span className="flex-1 pl-1 text-sm text-[#a3a3a3]">Be yourself. Take your time.</span>
                    <Button
                    disabled={isLoading}
                    onClick={handleStartConversation}
                    className="h-11 gap-2 rounded-lg bg-[#3ecf8e] px-4 text-[#071810] hover:bg-[#55d99c] disabled:opacity-60"
                    aria-label="Start one-question Agora voice sample"
                  >
                    <Mic size={17} /> {isLoading ? 'Connecting...' : 'Try voice'}
                  </Button>
                  </div>
                  {error && <p className="mt-2 text-center text-xs text-red-400">{error}</p>}
                </div>
                )
              ) : (
                <QuickstartPreCallCard
                  isLoading={isLoading || isInvitationLoading}
                  error={error}
                  onStartConversation={handleStartConversation}
                  interview={invitation}
                  requiresConsent={Boolean(invitationToken)}
                  consent={consent}
                  onConsentChange={setConsent}
                  candidateName={candidateName}
                  onCandidateNameChange={setCandidateName}
                />
              )
            )
          ) : agoraData && rtmClient ? (
            <>
              {/* Non-fatal invite warning: the browser session can still render even if agent start failed. */}
              {agentJoinError && (
                <div className="p-3 bg-destructive/10 rounded-md text-destructive text-sm max-w-sm">
                  Failed to connect with AI agent. The conversation may not work
                  as expected.
                </div>
              )}
              {/* Browser-only conversation mount: RTC provider, error boundary, and lazy-loaded call UI. */}
              <Suspense fallback={<LoadingSkeleton />}>
                <ErrorBoundary>
                  <AgoraProvider>
                    <ConversationComponent
                      agoraData={agoraData}
                      rtmClient={rtmClient}
                      onTokenWillExpire={handleTokenWillExpire}
                      onEndConversation={handleEndConversation}
                      compactDemo={embeddedDemo}
                      companionDemo={companionDemo}
                    />
                  </AgoraProvider>
                </ErrorBoundary>
              </Suspense>
            </>
          ) : (
            /* Fallback if session bootstrap partially succeeded but required state is missing. */
            <p className="text-sm text-muted-foreground">
              Failed to load conversation data.
            </p>
          )}
        </div>
      </div>

      {/* Persistent attribution footer for the pre-call and in-call views. */}
      {!embeddedDemo && <footer className="fixed bottom-0 right-0 z-40 py-4 pr-4 md:py-6 md:pr-6">
        <div className="flex items-center justify-end gap-2 text-muted-foreground">
          <span className="text-xs font-medium tracking-wide uppercase">
            {invitationToken ? 'AI interview panel · Powered by' : 'Powered by'}
          </span>
          <a
            href="https://agora.io/en/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
            aria-label="Visit Agora's website"
          >
            <Image
              src="/agora-logo-rgb-blue.svg"
              alt="Agora"
              width={86}
              height={24}
              priority
              className="h-6 w-auto hover:opacity-80 transition-opacity translate-y-1"
            />
            <span className="sr-only">Agora</span>
          </a>
        </div>
      </footer>}
    </div>
  );
}
