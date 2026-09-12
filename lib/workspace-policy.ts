import type { InterviewDefinitionRecord, InterviewPlan } from '@/types/interview';
import { buildFallbackPlan } from '@/lib/interview-planner';

export function questionWorkspace(text: string): 'code' | 'canvas' | null {
  if (/\b(write|implement|debug|refactor|code|coding)\b.{0,45}\b(function|algorithm|code|python|typescript|javascript|test|solution)\b/i.test(text)) return 'code';
  if (/\b(system design|architecture|diagram|canvas|sketch|draw|design a|design the)\b/i.test(text)) return 'canvas';
  return null;
}

export function demoWorkspaceQuestion(interview: InterviewDefinitionRecord, plan: InterviewPlan, desiredModality?: 'code' | 'canvas') {
  const required = [...interview.mustAskQuestions, ...interview.mustCoverTopics]
    .map((prompt) => ({ prompt, modality: questionWorkspace(prompt) })).find((item) => item.modality && (!desiredModality || item.modality === desiredModality));
  const scenario = required ?? plan.scenarios.find((item) => desiredModality ? item.modality === desiredModality : item.modality === 'code' || item.modality === 'canvas')
    ?? (desiredModality ? buildFallbackPlan(interview).scenarios.find((item) => item.modality === desiredModality) : undefined);
  if (!scenario) return null;
  return {
    modality: scenario.modality as 'code' | 'canvas',
    objective: scenario.modality === 'code'
      ? `I've opened the code editor. ${scenario.prompt} Choose Python, JavaScript, or TypeScript. Your work autosaves; say “review my code” or “check now” when you want feedback.`
      : `I've opened the design canvas. ${scenario.prompt} Add and connect the key components. Your work autosaves; say “review my diagram” or “check now” when you want feedback.`,
  };
}
