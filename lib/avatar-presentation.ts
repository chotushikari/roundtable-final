/**
 * Avatar Presentation Layer — shared types.
 *
 * This is the single source of truth for avatar state across the application.
 * No component may directly manipulate Tavus session state; all changes flow
 * through useAvatarPresentation() and the server-side routes.
 */

/** Visual mode the avatar system is currently in. */
export type AvatarPresentationMode =
  | 'tavus'             // Tavus iframe is the primary visual (pre-technical)
  | 'static'            // Role portrait (WebP) with CSS breathing animation
  | 'animated-overlay'  // Overlay WebM on the canvas; portrait remains elsewhere
  | 'hidden';           // Prep screen / wrap-up / unmounted

/** Lifecycle state of the Tavus session on this client. */
export type TavusSessionStatus =
  | 'idle'
  | 'starting'
  | 'active'
  | 'stopping'
  | 'stopped'
  | 'failed';

/** Animation clip the overlay should play, mapped from agentState. */
export type AvatarAnimationClip = 'listening' | 'nod' | 'thinking' | 'speaking';

/** Full snapshot of avatar presentation state exposed by useAvatarPresentation(). */
export type AvatarPresentationState = {
  /** Current visual mode. */
  mode: AvatarPresentationMode;
  /** Active interviewer role — controls which portrait/webm to load. */
  activeRole: string;
  /** Tavus session lifecycle. */
  tavusStatus: TavusSessionStatus;
  /** The Tavus conversation URL to embed in an <iframe>. Null when not active. */
  tavusConversationUrl: string | null;
  /** True when canvas or code workspace is the active modality. */
  isCanvasVisible: boolean;
  /** True during the 500 ms Tavus → static portrait cross-fade. */
  isTransitioning: boolean;
  /** Animation clip for the avatar overlay, derived from Agora agent state. */
  animationClip: AvatarAnimationClip;
};

/**
 * Map an Agora agent state string (as returned by AgoraVoiceAI) to an
 * avatar animation clip name.
 */
export function mapAgentStateToClip(agentState: string | null): AvatarAnimationClip {
  const s = agentState?.toLowerCase() ?? '';
  if (/think|analy|process/.test(s)) return 'thinking';
  if (/speak|talk/.test(s)) return 'nod';
  return 'listening';
}

/**
 * Derive the correct avatar presentation mode from authoritative server-owned state.
 * This is intentionally a pure function — no side effects.
 */
export function deriveAvatarMode({
  phase,
  activeRole,
  currentModality,
  tavusEnabled,
  tavusStatus,
}: {
  phase: string;
  activeRole: string;
  currentModality: string;
  tavusEnabled: boolean;
  tavusStatus: TavusSessionStatus;
}): AvatarPresentationMode {
  if (phase === 'wrap_up') return 'hidden';

  // Technical round or beyond → Tavus is off.
  // We detect this by checking if the current phase is 'panel' and the active
  // role is technical. Note: once stopped, tavusStatus becomes 'stopped' which
  // also prevents re-entry into 'tavus' mode.
  const isTechnicalOrLater =
    phase === 'panel' && activeRole === 'technical';

  const canUseTavus =
    tavusEnabled &&
    !isTechnicalOrLater &&
    (tavusStatus === 'active' || tavusStatus === 'starting');

  if (canUseTavus) return 'tavus';

  // Canvas/code overlay mode — portrait stays in the panel table, a small
  // overlay appears on top of the workspace. We signal this as 'static' but
  // the canvas overlay layer is separately controlled by AvatarOverlay.
  // The mode here just tells DigitalPanelStage what to render.
  if (
    (currentModality === 'canvas' || currentModality === 'code') &&
    phase === 'panel'
  ) {
    return 'static'; // AvatarOverlay handles the overlay; no mode change needed
  }

  return 'static';
}

/** Roles whose avatar assets live under a different folder name than the role key. */
export const ROLE_ASSET_FOLDER: Record<string, string> = {
  hiring_manager: 'hiring-manager',
  technical: 'technical',
  product: 'product',
  customer: 'customer',
  behavioral: 'behavioral',
};

/** Resolve the path to an avatar asset for a given role and file. */
export function avatarAssetPath(role: string, file: string): string {
  const folder = ROLE_ASSET_FOLDER[role] ?? role;
  return `/avatars/${folder}/${file}`;
}
