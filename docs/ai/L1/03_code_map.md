# Code Map

- `lib/workspace-observation.ts`: grounded autosaved/checkpoint acknowledgements; no live-screen visibility or correctness assertions.

- `lib/workspace-policy.ts`: question/scenario selection of code or canvas.
- `lib/workspace-conversation.ts`: non-scoring voice workspace commands and checkpoint follow-ups.

- `components/LandingPage.tsx`, `ConversationComponent.tsx`: candidate bootstrap and Agora lifecycle.
- `components/RoundTableExperience.tsx` and its CSS module: public scroll narrative, Three.js artifact, five-role labels, embedded compact Agora sample, and companion interaction.
- `app/page.tsx`, `app/loading.tsx`: public experience entry point and reduced-motion-safe transition mark.
- `components/CompanyDashboard.tsx`: Google-only interviewer auth, auto-provisioned private workspace, interview builder, recruiter resume/link flow, and live/completed session pipeline.
- `components/CompanyAnalysisPage.tsx`, `app/company/analysis/[sessionId]`: authenticated standalone completed-analysis route and candidate-summary release flow.
- `components/CompanyInterviewReportView.tsx`: evidence-linked Overview, Competencies, Panel views, Transcript, and Workspace report sections; transcript entries expose bounded transition reasons, difficulty, role handoffs, and validated vagueness/contradiction flags.
- `components/InterviewWorkspace.tsx`: Monaco, one embedded Excalidraw canvas, autosaved drafts, and checkpoints.
- `app/api/interviews`, `invitations`, `sessions`: product and lifecycle APIs, including responsive background agent startup.
- `app/api/ai/chat/completions`: authenticated Agora custom LLM boundary.
- `app/api/mcp/[grant]`: session-scoped Streamable HTTP MCP endpoint.
- `lib/interview-controller.ts`: evaluator validation and deterministic next-speaker rules.
- `lib/interview-demo.ts`: five-role showcase order, opening/closing text, and answered-role progress.
- `lib/interview-store.ts`: Supabase/in-memory persistence adapter.
- `lib/agora-server.ts`: combined tokens and managed-agent start/stop.
- `lib/assessment.ts`: evidence-only final report combining validated transcript quotes with conservative completed-workspace artifact-version evidence.
- `lib/company-report.ts`: stable company-facing completed-interview projection, including a bounded per-turn adaptation trail rather than private controller state.
- `app/api/sessions/[id]/report`: company-authenticated report endpoint; only completed sessions return a report.
- `lib/assessment-prompt.ts`: bounded quote catalog and validated narrative-only report enrichment.
- `supabase/migrations`: schema, RLS, Realtime projection, retention, and the additive Hiring Graph foundation that keeps the interview runtime compatible while introducing Job/Candidate ownership.
