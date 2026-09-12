'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type AvatarAnimationClip,
  type AvatarPresentationState,
  type TavusSessionStatus,
  deriveAvatarMode,
  mapAgentStateToClip,
} from '@/lib/avatar-presentation';

interface UseAvatarPresentationOptions {
  sessionId: string | undefined;
  activeRole: string;
  activePhase: string;
  currentModality: string;
  agentState: string | null;
  /** Pass NEXT_PUBLIC_TAVUS_ENABLED === 'true' from the component. */
  tavusEnabled: boolean;
}

/**
 * Central avatar state machine.
 *
 * Owns the entire Tavus session lifecycle for one interview:
 * - starts Tavus exactly once when interview enters pre-technical phase
 * - stops Tavus exactly once when technical round is detected
 * - exposes a single AvatarPresentationState snapshot to components
 * - never throws; all errors degrade gracefully to static portrait
 *
 * Idempotency guarantee:
 * - tavusStartedRef and tavusStoppedRef are set before any async work begins
 *   so that React StrictMode double-invocation, rapid re-renders, and
 *   reconnects cannot create a second Tavus session.
 */
export function useAvatarPresentation({
  sessionId,
  activeRole,
  activePhase,
  currentModality,
  agentState,
  tavusEnabled,
}: UseAvatarPresentationOptions): AvatarPresentationState {
  const [tavusStatus, setTavusStatus] = useState<TavusSessionStatus>('idle');
  const [tavusConversationUrl, setTavusConversationUrl] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Idempotency refs — never reset during the interview
  const tavusStartedRef = useRef(false);
  const tavusStoppedRef = useRef(false);
  const transitionTimerRef = useRef<number | null>(null);

  // Determine if this is the technical round (the key transition trigger)
  const isTechnicalRound = activePhase === 'panel' && activeRole === 'technical';

  // Determine if we should be using Tavus right now
  const shouldStartTavus =
    tavusEnabled &&
    !!sessionId &&
    !isTechnicalRound &&
    activePhase !== 'wrap_up' &&
    (activePhase === 'introduction' || activePhase === 'background' || activePhase === 'panel');

  // START Tavus — fires once when shouldStartTavus becomes true
  useEffect(() => {
    if (!shouldStartTavus) return;
    if (tavusStartedRef.current) return;  // Idempotency guard
    if (!sessionId) return;

    tavusStartedRef.current = true;
    setTavusStatus('starting');
    console.info('[Avatar] mode: starting Tavus session', { sessionId, activeRole, activePhase });

    fetch('/api/avatar/tavus/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Start failed: ${response.status}`);
        const data = (await response.json()) as { conversationUrl: string; status: string };
        setTavusConversationUrl(data.conversationUrl);
        setTavusStatus('active');
        console.info('[Avatar] mode: tavus | status: active', { conversationUrl: data.conversationUrl });
      })
      .catch((error: unknown) => {
        console.warn('[Avatar] Tavus start failed — falling back to static portrait', error);
        setTavusStatus('failed');
        // Don't reset tavusStartedRef — we don't want to retry failed starts
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldStartTavus, sessionId]);

  // STOP Tavus — fires once when technical round is detected
  const stopTavus = useCallback(() => {
    if (tavusStoppedRef.current) return;  // Idempotency guard
    tavusStoppedRef.current = true;

    console.info('[Avatar] transition: technical | tavusSession: stopping');
    setTavusStatus('stopping');
    setIsTransitioning(true);

    // Fade-out duration: 500ms then switch to static portrait
    transitionTimerRef.current = window.setTimeout(() => {
      setIsTransitioning(false);
      setTavusStatus('stopped');
      setTavusConversationUrl(null);
      console.info('[Avatar] fallback: static portrait | tavusSession: stopped');
    }, 500);

    // Fire-and-forget stop — never await, never block Agora audio
    if (!sessionId) return;
    fetch('/api/avatar/tavus/stop', {
      method: 'POST',
      credentials: 'same-origin',
    }).catch((error: unknown) => {
      console.warn('[Avatar] Tavus stop request failed (non-fatal)', error);
    });
  }, [sessionId]);

  useEffect(() => {
    if (!isTechnicalRound) return;
    if (tavusStatus === 'idle' || tavusStatus === 'stopped' || tavusStatus === 'stopping') return;
    stopTavus();
  }, [isTechnicalRound, tavusStatus, stopTavus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current);
      }
      // If Tavus is still active when component unmounts, stop it
      if (sessionId && tavusStartedRef.current && !tavusStoppedRef.current) {
        tavusStoppedRef.current = true;
        fetch('/api/avatar/tavus/stop', { method: 'POST', credentials: 'same-origin' }).catch(() => {});
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Derive the visual mode from all state
  const mode = deriveAvatarMode({
    phase: activePhase,
    activeRole,
    currentModality,
    tavusEnabled,
    tavusStatus,
  });

  const animationClip: AvatarAnimationClip = mapAgentStateToClip(agentState);
  const isCanvasVisible = currentModality === 'canvas' || currentModality === 'code';

  return {
    mode,
    activeRole,
    tavusStatus,
    tavusConversationUrl,
    isCanvasVisible,
    isTransitioning,
    animationClip,
  };
}
