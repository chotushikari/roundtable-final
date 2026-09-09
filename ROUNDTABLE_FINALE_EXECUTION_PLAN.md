# RoundTable Finale Execution Plan

## Decision in one sentence

Do not build a full hiring operating system before the finale. Win by proving one real, reliable loop:

```text
Job configuration → real Agora interview → evidence gap → role handoff → cited report → human review
```

RoundTable's differentiated claim is not “AI interviews candidates.” It is:

> An adaptive AI panel chooses the next interviewer perspective from the evidence still missing from the hiring decision.

## Current reality

| Capability | State | Evidence | Verdict |
| --- | --- | --- | --- |
| Agora voice/session architecture | Implemented | RTC, RTM, managed agent lifecycle, custom LLM route | Protect; live proof required |
| Logical five-role panel | Implemented | Server-owned roles and deterministic controller | Keep one physical agent per session |
| Evidence validation and assessment | Implemented | Unit tests and report projection | Strongest product asset |
| Adaptive reasons, vague answers, contradictions | Implemented | Controller types/tests and report trail | Must demonstrate live |
| Recruiter report evidence jump | Implemented | Transcript-linked report UI | Demo-ready after live test |
| Role visual identity | Implemented | Distinct panel colors and speaking state | Demo polish only |
| Single-use invitation | Implemented | Published invitation/session flow | Use in demo |
| Interview versioning | Implemented | Immutable interview versions | Do not rebuild as “blueprints” |
| Company tenancy/auth | Implemented | Supabase organization scoping and Google sign-in | Do not replace with email/password now |
| Candidate comparison, shortlist, decisions | Not implemented as a product flow | No verified job/candidate aggregation | Defer |
| Full integrity/proctoring | Partial | Consent-gated camera interaction only; no general proctoring platform | Defer |
| Concurrent-session capacity | Unverified | Session isolation exists in design, not load-tested | Do not claim scale |

## Non-negotiable guardrails

1. Do not replace Agora, STT/TTS, token handling, VAD, RTM, or the one-agent-per-session model for presentation reasons.
2. Do not create five physical voice agents. Five logical roles are already the correct product abstraction.
3. Do not show fake controls. A recruiter-visible setting must change runtime behavior, be explicitly preview-only, or not exist.
4. Do not call integrity signals “cheating,” and never allow them to drive an automatic decision.
5. Do not expose raw workspace source or raw media through the company report; preserve the existing allow-list contract.
6. Do not claim concurrency, interrupt recovery, or voice reliability until live-tested.
7. Every score, concern, or conclusion shown to a recruiter must retain human review and evidence linkage.

## Priority matrix

| # | Feature / task | Current state | Difficulty | Bottleneck | Risk | Recommendation |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | Make `npm run verify` green | Lint and environment gate fail | E0 | B0 | Low | Do now |
| 2 | Live Agora rehearsal | Offline tests pass; live path unproven | M1 | B4/B5 | High | Do now |
| 3 | Rehearse barge-in, repeat, reconnect, token renewal | Unverified | M1 | B4/B5/B6 | High | Do now |
| 4 | Cross-functional Product handoff demo | Controller/report support it | E0 | B1 | Low | Do now |
| 5 | Vague-answer and contradiction demo moments | Controller support exists | E0 | B1 | Low | Do now |
| 6 | Evidence → transcript click-through | Implemented | E0 | B0 | Low | Do now |
| 7 | Candidate-facing silent evaluation audit | Product requirement; prompt/runtime audit needed | E0 | B3 | Medium | Do after baseline |
| 8 | Compact interview blueprint summary | Existing definition/version data | E0/M1 | B1 | Low | Do after baseline |
| 9 | Candidate preflight and useful preparation state | Partial | M1 | B4/B6 | Medium | Do if live path stable |
| 10 | Live recruiter “why this question?” | Report exists; live projection is separate | M1 | B1/B3 | Medium | Do if time permits |
| 11 | Time remaining / must-cover display | Server state partly exists | M1 | B1/B3 | Medium | Do if time permits |
| 12 | Panel disagreement | Needs role-level rating design | M1 | B2/B3 | Medium | Defer until after finale |
| 13 | Hiring bar | Needs schema + controller priority semantics | M1/D2 | B2/B3 | Medium | Defer unless narrowly scoped |
| 14 | Candidate comparison | Needs candidate/job aggregation and ranking policy | M1/D2 | B2 | Medium | Defer |
| 15 | Bulk email/CSV invites | Requires workflow/provider decisions | M1 | B2/B5 | Medium | Defer |
| 16 | Full job/candidate/ATS model | Product-model expansion | D2 | B2 | High | Do not build for finale |
| 17 | Screen/AI-context/second-voice detection | Browser, privacy, accuracy, consent | D2/X | B5/B6 | High | Do not build |
| 18 | Per-role TTS voices | Could affect live Agora runtime | D2 | B4/B5 | High | Do not build |
| 19 | Multiple physical Agora agents | Architectural rewrite | X | B4 | Very high | Do not touch |
| 20 | Load test 2 then 5 sessions | No claim without a test | M1 | B5/B7 | Medium | Validate after demo is stable |

Legend: E0 = small/safe; M1 = modest, testable extension; D2 = deep change; X = finale risk. B1 = UI, B2 = data model, B3 = controller/runtime, B4 = Agora, B5 = external service, B6 = browser, B7 = scale.

## Sprint plan

### Sprint 0 — Release gate and live baseline

**Goal:** establish a demo-safe starting point before any product expansion.

1. Set a valid `APP_BASE_URL` for the environment being rehearsed.
2. Fix the existing React lint violation in `components/RoundTableExperience.tsx`.
3. Run `npm run verify`.
4. Perform and record one real candidate flow:
   - invitation → consent → join;
   - agent speech → candidate response;
   - one interruption/barge-in;
   - transcript/RTM delivery;
   - final assessment/report;
   - cleanup/end session.
5. Rehearse one failure: denied microphone or temporary network loss.

**Exit criteria:** verification green and one end-to-end voice recording/screen capture succeeds. If this fails, stop feature work and fix the observed runtime issue only.

### Sprint 1 — Prove the adaptive panel

**Goal:** make the actual orchestration understandable in 30 seconds.

Use one prepared but real scenario:

1. Candidate gives a technically competent answer with no customer outcome.
2. Controller selects `CROSS_FUNCTIONAL_GAP`.
3. Product perspective asks the customer/business follow-up.
4. Recruiter report shows why the question was asked.
5. Candidate gives a vague answer; the next question requests a concrete metric/baseline.
6. Candidate gives an inconsistent claim; the interviewer asks for reconciliation neutrally.
7. Final report links a competency signal back to the transcript.

**Do not** replace demo sequencing until a targeted controller audit proves that a change preserves the published-demo contract. If judges need adaptive proof, use a normal adaptive invitation for the live segment and clearly label it as such.

**Exit criteria:** two uninterrupted rehearsals produce the same visible evidence trail using the real controller.

### Sprint 2 — Product maturity without data-model expansion

**Goal:** make the existing system look configured and intentional.

Only build items that map directly to existing immutable definition/version fields:

- interview title and role;
- duration;
- selected panel roles;
- must-cover topics/questions;
- scenario/workspace summary;
- invitation expiry;
- candidate disclosure and human-review notice.

Present this as an **Interview Blueprint** summary, not a new `jobs` or ATS system.

**Exit criteria:** every visible field is persisted in the current definition/version and affects the actual interview or is descriptive of that persisted configuration.

### Sprint 3 — Optional polish

Attempt only after Sprints 0–2 are fully stable:

- candidate preflight progress and useful “panel is preparing” state;
- recruiter live status cards that use the already-allowed status projection;
- must-cover/remaining-time display where it reflects server-owned state;
- empty/error/loading states;
- responsive and accessibility pass.

**Stop rule:** if any change touches agent lifecycle, TTS/STT, or token renewal, move it out of this sprint unless it fixes a live observed failure.

## Database decision rule

Do **not** add `jobs`, `candidates`, `human_decisions`, comparison rankings, and bulk invite infrastructure for the finale. That is a coherent future product, but it is not a small extension of the current demo.

Database changes are justified only when all are true:

1. The feature is essential to the finale narrative.
2. The existing interview definition, invitation, session, and assessment records cannot represent it.
3. The change is one migration or a small additive extension.
4. It has an API contract test and a manual flow test.
5. It does not require a controller or Agora rewrite.

Likely acceptable later: a recruiter-owned `review_decision` and `review_notes` attached to an existing completed session. Not acceptable now: an ATS hierarchy rewrite.

## Demo script: three minutes, one proof

| Time | Screen | What the judge should understand |
| --- | --- | --- |
| 0:00–0:20 | Recruiter blueprint | Job-specific panel, duration, and evidence criteria are configured |
| 0:20–0:40 | Candidate invitation/preflight | AI disclosure, consent, and a real interview link |
| 0:40–1:35 | Candidate voice interview | Agora voice is live; candidate can interrupt naturally |
| 1:35–2:05 | Cross-role handoff | Technical evidence is strong; Product takes over for missing customer impact |
| 2:05–2:25 | Recruiter explanation | “Why this question?” comes from a real reason code, not a scripted label |
| 2:25–2:50 | Completed report | Click evidence and land on the supporting transcript turn |
| 2:50–3:10 | Closing | Human review remains required; RoundTable supports, not replaces, hiring judgment |

## What to say and what not to say

### Say

- “One Agora agent represents multiple logical interview perspectives, coordinated by server-owned state.”
- “The next question is selected from missing evidence, not a static question list.”
- “Each report conclusion is tied to transcript or workspace evidence.”
- “Integrity observations, if enabled later, are review signals—not verdicts.”
- “A human makes the hiring decision.”

### Do not say

- “We detect cheating” or “we detect AI use.”
- “We support 100 concurrent interviews.”
- “Each role is a separate live AI agent.”
- “This is a full ATS.”
- “The AI decides whom to hire.”
- “This is adaptive” unless a real reason code, role handoff, and follow-up are visible.

## Future roadmap, deliberately deferred

### Next product milestone

1. Add a minimal recruiter decision status and notes model.
2. Add a job/candidate view only after agreeing on a small data model.
3. Build candidate comparison from evidence coverage and competency ratings, never opaque ranking.
4. Validate two, then five independent sessions before offering a live-session monitor.

### Enterprise roadmap

- bulk invitations and email provider;
- ATS integrations;
- analytics/funnel reporting;
- safe integrity timeline;
- recruiter collaboration/permissions;
- optional role voices only after Agora validation.

### Explicitly out of scope

- browser lockdown;
- AI-context OCR;
- face/deepfake/second-voice inference;
- automatic hire/reject;
- five physical voice agents;
- full ATS or scheduling platform;
- voice-stack/framework rewrite.

## Market check

Current products make JD/competency configuration, adaptive follow-ups, consent, evidence-linked reporting, and human review table stakes. CodeSignal presents a job-description-driven, configurable AI interviewer with human decision-making; HireVue similarly emphasizes consent, rubric-based evaluation, and auditability. HackerRank's 2026 material shows that advanced integrity and replay depend on dedicated proctoring infrastructure. RoundTable should compete on its focused, demonstrable evidence-gap panel—not attempt to clone that infrastructure in a finale sprint.

- [CodeSignal AI Interviewer](https://codesignal.com/ai-interviewer/)
- [HireVue AI Interviewer](https://www.hirevue.com/platform/ai-interviewer)
- [HackerRank: evaluating AI interviewers](https://www.hackerrank.com/blog/the-best-ai-interviewers-in-2026-how-to-evaluate-them/)
- [HackerRank Proctor Mode](https://support.hackerrank.com/articles/5663779659)
- [Karat: evidence for AI-ready engineering assessment](https://karat.com/evaluate-ai-ready-engineers/)

## Final decision tree

```text
Does it improve the three-minute proof?
  no  → defer.
  yes → does existing data/controller already support it?
           yes → expose it, test it, rehearse it.
           no  → is it a small additive model/API change with no Agora impact?
                    yes → implement after the live baseline is stable.
                    no  → defer until after the finale.
```
