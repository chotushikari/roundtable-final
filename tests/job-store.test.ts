import assert from 'node:assert/strict';
import test from 'node:test';
import { jobStore, resetJobStoreForTests } from '@/lib/job-store';

test('candidate pipeline records dedupe within one job and remain job-scoped', async () => {
  resetJobStoreForTests();
  const organizationId = crypto.randomUUID();
  const primaryJob = await jobStore.createJob(organizationId, {
    title: 'Backend Engineer', employmentType: 'full_time', jdText: '', hiringBar: {}, status: 'draft',
  });
  const otherJob = await jobStore.createJob(organizationId, {
    title: 'Frontend Engineer', employmentType: 'full_time', jdText: '', hiringBar: {}, status: 'draft',
  });
  const candidate = await jobStore.upsertCandidate(organizationId, {
    fullName: 'Ada Lovelace', email: 'ada@example.com',
  });

  const first = await jobStore.getOrCreateJobCandidate(primaryJob.id, candidate.id, organizationId);
  const repeated = await jobStore.getOrCreateJobCandidate(primaryJob.id, candidate.id, organizationId);
  assert.equal(repeated.id, first.id);

  const updated = await jobStore.updateJobCandidateStage(first.id, primaryJob.id, organizationId, 'invited');
  assert.equal(updated.stage, 'invited');
  await assert.rejects(
    () => jobStore.updateJobCandidateStage(first.id, otherJob.id, organizationId, 'completed'),
    /Job candidate not found/,
  );
});
