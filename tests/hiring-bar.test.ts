import assert from 'node:assert/strict';
import test from 'node:test';
import { buildFallbackPlan } from '@/lib/interview-planner';
import type { InterviewDefinitionRecord } from '@/types/interview';
import type { JobCompetencyRecord } from '@/types/jobs';

const interview: InterviewDefinitionRecord = {
  id: 'interview-1', organizationId: 'organization-1', title: 'Backend interview', roleTitle: 'Backend Engineer',
  jdText: 'Build reliable backend services with clear trade-offs and strong customer communication.',
  desiredOutcomes: ['Assess engineering judgment'], panelRoles: ['technical', 'product', 'hiring_manager'],
  mustAskQuestions: [], mustCoverTopics: [], durationMinutes: 30, instructions: '', status: 'draft', plan: null,
  planVersion: 0, createdAt: '2026-09-10T00:00:00.000Z', updatedAt: '2026-09-10T00:00:00.000Z',
};

const competency = (competencyKey: string, name: string, weight: number): JobCompetencyRecord => ({
  id: competencyKey, jobId: 'job-1', organizationId: 'organization-1', competencyKey, name,
  description: `${name} is evaluated through concrete evidence.`, weight, required: true,
  createdAt: '2026-09-10T00:00:00.000Z',
});

test('a complete hiring bar becomes the fallback blueprint rubric with normalized weights', () => {
  const plan = buildFallbackPlan(interview, [
    competency('technical_depth', 'Technical depth', 50),
    competency('system_design', 'System design', 30),
    competency('communication', 'Communication', 20),
  ]);

  assert.deepEqual(plan.competencies.map((item) => item.id), [
    'technical_depth', 'system_design', 'communication',
  ]);
  assert.deepEqual(plan.competencies.map((item) => item.weight), [0.5, 0.3, 0.2]);
});

test('an incomplete hiring bar does not replace the safe baseline rubric', () => {
  const plan = buildFallbackPlan(interview, [competency('technical_depth', 'Technical depth', 100)]);
  assert.equal(plan.competencies[0].id, 'technical_execution');
});
