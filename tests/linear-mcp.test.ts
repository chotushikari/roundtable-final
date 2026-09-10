import assert from 'node:assert/strict';
import test from 'node:test';
import { linearVoiceCommand } from '@/lib/linear-conversation';
import { linearMcpInternals } from '@/lib/linear-mcp';
import { InterviewCreateSchema } from '@/types/interview';

test('recognizes Linear voice actions without treating ordinary interview speech as a tool command', () => {
  assert.equal(linearVoiceCommand('Load the Linear issue'), 'load_issue');
  assert.equal(linearVoiceCommand('Add my explanation as a comment to Linear'), 'prepare_comment');
  assert.equal(linearVoiceCommand('Yes, confirm post'), 'confirm_post');
  assert.equal(linearVoiceCommand("Don't post the Linear comment"), 'cancel_post');
  assert.equal(linearVoiceCommand('I used a linear scan over the array'), null);
});

test('adapts to namespaced Linear MCP tools and their advertised input schema', () => {
  const tool = linearMcpInternals.findTool([
    { name: 'linear_get_issue', inputSchema: { properties: { identifier: {} } } },
  ], ['get_issue']);
  assert.equal(tool.name, 'linear_get_issue');
  assert.equal(linearMcpInternals.argumentName(tool, ['id', 'identifier'], 'id'), 'identifier');
  assert.equal(linearMcpInternals.findTool([{ name: 'save_comment' }], ['save_comment', 'create_comment']).name, 'save_comment');
});

test('interview schema freezes a valid optional Linear issue identifier', () => {
  const base = {
    title: 'Intern interview',
    roleTitle: 'Software Engineer Intern',
    jdText: 'A beginner-friendly engineering internship for candidates building small software projects.',
    desiredOutcomes: ['Explain a small implementation'],
    panelRoles: ['technical', 'product'] as const,
    mustAskQuestions: [],
    mustCoverTopics: [],
    durationMinutes: 10,
    instructions: '',
  };
  assert.equal(InterviewCreateSchema.parse({ ...base, linearIssueIdentifier: 'ENG-123' }).linearIssueIdentifier, 'ENG-123');
  assert.equal(InterviewCreateSchema.parse({ ...base, linearIssueIdentifier: '' }).linearIssueIdentifier, undefined);
  assert.throws(() => InterviewCreateSchema.parse({ ...base, linearIssueIdentifier: 'not an issue' }));
});

test('interview schema supports a selected adaptive panel but keeps the finale showcase complete', () => {
  const base = {
    title: 'Backend interview',
    roleTitle: 'Backend Engineer',
    jdText: 'Build reliable services and clearly explain the customer impact of technical trade-offs.',
    desiredOutcomes: ['Explain reliability choices'],
    mustAskQuestions: [],
    mustCoverTopics: [],
    instructions: '',
  };
  const adaptive = InterviewCreateSchema.parse({
    ...base, panelRoles: ['technical', 'product'], durationMinutes: 30, demoMode: false,
  });
  assert.deepEqual(adaptive.panelRoles, ['technical', 'product']);
  assert.equal(adaptive.durationMinutes, 30);
  assert.throws(() => InterviewCreateSchema.parse({
    ...base, panelRoles: ['technical', 'product'], durationMinutes: 10, demoMode: true,
  }));
  assert.throws(() => InterviewCreateSchema.parse({
    ...base, panelRoles: ['hiring_manager', 'technical', 'product', 'customer', 'behavioral'], durationMinutes: 30, demoMode: true,
  }));
  assert.equal(InterviewCreateSchema.parse({
    ...base, panelRoles: ['hiring_manager', 'technical', 'product', 'customer', 'behavioral'], durationMinutes: 10, demoMode: true,
  }).durationMinutes, 10);
});
