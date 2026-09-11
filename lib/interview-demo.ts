import type { PanelRole, TurnAnalysisRecord } from '@/types/interview';

export const DEMO_DURATION_MINUTES = 10;
export const PREPARATION_SECONDS = 15;
export const DEMO_ROLES: PanelRole[] = ['hiring_manager', 'technical', 'product', 'customer', 'behavioral'];
export const DEMO_OPENING_QUESTION = 'I’m your AI Hiring Manager. Briefly introduce yourself and tell us about one project you built.';
export const DEMO_CLOSING = 'Thank you. That completes our panel demo. Your evidence summary is next, for human review.';

export function normalizeSpokenText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function demoRoles(roles: PanelRole[]): PanelRole[] {
  return DEMO_ROLES.filter((role) => roles.includes(role));
}

// Each analysis contains the answer to the previous question and the NEXT
// speaking decision. Merely generating a question does not complete its role.
export function answeredDemoRoles(roles: PanelRole[], analyses: TurnAnalysisRecord[]): PanelRole[] {
  const ordered = demoRoles(roles);
  if (!analyses.length) return [];
  const answered = new Set([ordered[0], ...analyses.slice(0, -1).map((item) => item.decision.activeSpeakerRole)]);
  return ordered.filter((role) => answered.has(role));
}
