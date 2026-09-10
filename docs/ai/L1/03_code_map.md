# Code Map

- `lib/workspace-observation.ts`: grounded autosaved/checkpoint acknowledgements; no live-screen visibility or correctness assertions.

- `lib/workspace-policy.ts`: question/scenario selection of code or canvas.
- `lib/workspace-conversation.ts`: non-scoring voice workspace commands and checkpoint follow-ups.

- `components/LandingPage.tsx`, `ConversationComponent.tsx`: candidate bootstrap and Agora lifecycle.
- `components/SimliAvatarStage.tsx`, `app/api/sessions/[id]/avatar/simli`: optional short-lived visual-avatar bootstrap and remote-AI-audio-only Simli presentation.
- `components/InterviewPreparationScreen.tsx`: shared full-screen candidate setup surface used during bootstrap and RTC/panel readiness; it reports only truthful connection state.
- `components/RoundTableExperience.tsx` and its CSS module: public scroll narrative, Three.js artifact, five-role labels, embedded compact Agora sample, and companion interaction.
- `app/page.tsx`, `app/loading.tsx`: public experience entry point and reduced-motion-safe transition mark.
- `components/CompanyDashboard.tsx`: Google-only interviewer auth, auto-provisioned private workspace, server-backed finale/adaptive interview builder, recruiter resume/link flow, candidate evidence review, and live/completed session pipeline.
- `components/CompanyAnalysisPage.tsx`, `app/company/analysis/[sessionId]`: authenticated standalone completed-analysis route and candidate-summary release flow.
- `components/CompanyInterviewReportView.tsx`: evidence-linked Overview, Competencies, Panel views, Transcript, and Workspace report sections; transcript entries expose bounded transition reasons, difficulty, role handoffs, and validated vagueness/contradiction flags.
- `components/InterviewWorkspace.tsx`: Monaco, one embedded Excalidraw canvas, autosaved drafts, and checkpoints.
- `app/api/interviews`, `invitations`, `sessions`: product and lifecycle APIs, including responsive background agent startup.
- `app/api/ai/chat/completions`: authenticated Agora custom LLM boundary.
- `app/api/ai/sarvam/tts`: authenticated internal Sarvam Bulbul v3 `shubh` to 24 kHz PCM bridge for Agora GenericTTS.
- `app/api/mcp/[grant]`: session-scoped Streamable HTTP MCP endpoint.
- `lib/interview-controller.ts`: evaluator validation and deterministic next-speaker rules.
- `app/api/interviews/[id]/plan`, `lib/interview-planner.ts`: server-loaded Job hiring-bar execution, immutable blueprint rubric generation, and adaptive interview scenarios.
- `lib/interview-demo.ts`, `lib/interview-controller.ts`: five-role showcase coverage, evidence-prioritized role handoffs, opening/closing text, and answered-role progress.
- `lib/interview-store.ts`: Supabase/in-memory persistence adapter.
- `lib/agora-server.ts`: combined tokens and managed-agent start/stop.
- `lib/interview-tts.ts`, `lib/public-url.ts`: Sarvam-or-MiniMax TTS selection and public Agora callback origin resolution.
- `lib/assessment.ts`: evidence-only final report combining validated transcript quotes with conservative completed-workspace artifact-version evidence.
- `lib/company-report.ts`: stable company-facing completed-interview projection, including a bounded per-turn adaptation trail rather than private controller state.
- `app/api/sessions/[id]/report`: company-authenticated report endpoint; only completed sessions return a report.
- `lib/assessment-prompt.ts`: bounded quote catalog and validated narrative-only report enrichment.
- `supabase/migrations`: schema, RLS, Realtime projection, retention, and the additive Hiring Graph foundation that keeps the interview runtime compatible while introducing Job/Candidate ownership.
- `types/jobs.ts`: Zod schemas and TypeScript interfaces for `JobRecord`, `JobCompetencyRecord`, `CandidateRecord`, `JobCandidateRecord`, and their create/patch inputs.
- `lib/job-store.ts`: Supabase-admin + in-memory-fallback store for jobs, competencies, candidates, and job_candidates — mirrors the `interview-store.ts` pattern.
- `app/api/jobs/route.ts`: list and create jobs.
- `app/api/jobs/[id]/route.ts`: get and patch a single job (with its competencies on GET).
- `app/api/jobs/[id]/competencies/route.ts`: list, upsert, and delete competencies.
- `app/api/jobs/[id]/candidates/route.ts`: list job_candidates and add new candidates (email-deduped upsert).
- `app/api/jobs/[id]/candidates/[candidateId]/route.ts`: patch a job_candidate stage.
- `app/api/jobs/[id]/candidates/[candidateId]/decisions/route.ts`: recruiter-only append-only human-decision history and creation.
- `lib/job-store.ts`: includes recruiter-owned human-decision persistence and audit logging alongside Job/Candidate storage.
