import assert from 'node:assert/strict';
import test from 'node:test';
import { missingRecruiterVoiceFields, parseRecruiterVoiceCommand, recruiterVoicePrompt } from '@/lib/recruiter-voice';

test('recruiter voice command collects a complete Hinglish job-to-link request', () => {
  const { draft } = parseRecruiterVoiceCommand(
    'Software Engineer Intern ke liye interview banao, candidate name Aditi Sharma, email aditi at example dot com, difficulty intern',
  );
  assert.equal(draft.jobTitle, 'Software Engineer Intern');
  assert.equal(draft.candidateName, 'Aditi Sharma');
  assert.equal(draft.candidateEmail, 'aditi@example.com');
  assert.equal(draft.seniority, 'intern');
  assert.equal(draft.wantsInterview, true);
  assert.deepEqual(missingRecruiterVoiceFields(draft), []);
});

test('recruiter voice asks for the next missing required field', () => {
  const { draft } = parseRecruiterVoiceCommand('Create interview for Backend Engineer');
  assert.equal(draft.jobTitle, 'Backend Engineer');
  assert.match(recruiterVoicePrompt(draft), /Difficulty|seniority/i);
});

test('recruiter voice can collect fields over multiple utterances', () => {
  const first = parseRecruiterVoiceCommand('Create a job for Product Manager').draft;
  const second = parseRecruiterVoiceCommand('candidate name is Riya Mehta', first).draft;
  const third = parseRecruiterVoiceCommand('riya@example.com, senior role', second).draft;
  assert.equal(third.jobTitle, 'Product Manager');
  assert.equal(third.candidateName, 'Riya Mehta');
  assert.equal(third.candidateEmail, 'riya@example.com');
  assert.equal(third.seniority, 'senior');
});
