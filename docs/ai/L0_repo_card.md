# Repository Card

- Name: RoundTable AI
- Recipe Role: base
- Stack: Next.js 16 App Router, React 19, TypeScript, Agora RTC/RTM/Conversational AI, Supabase, Groq, E2B
- Package manager: npm
- Last Reviewed: 2026-09-10
- Latest review: 2026-09-10 recruiter product flow sprint — Job is now the first-class hiring context. Added `/api/jobs`, `/api/jobs/[id]`, `/api/jobs/[id]/competencies`, `/api/jobs/[id]/candidates`, `/api/jobs/[id]/candidates/[candidateId]` routes. Added `lib/job-store.ts` and `types/jobs.ts`. `CompanyDashboard` redesigned to a two-panel Job-first workbench (sidebar job list + detail pane with Competencies / Blueprint / Candidates / Pipeline tabs). `interview_definitions.job_id` and `invitations.job_candidate_id` bridge columns populated by the recruiter flow; all existing interview/session/agent paths are unchanged.
- Runtime status: source-aligned and offline-verified; live Agora/Supabase/E2B acceptance remains unverified

Read all files under `L1/` before changing application contracts. Use `RECIPE.md` for invariants.
