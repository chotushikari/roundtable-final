# Repository Card

- Name: RoundTable AI
- Recipe Role: base
- Stack: Next.js 16 App Router, React 19, TypeScript, Agora RTC/RTM/Conversational AI, Supabase, Groq, E2B
- Package manager: npm
- Last Reviewed: 2026-09-10
- Latest review: 2026-09-10 hiring-bar execution sprint — Job is the first-class hiring context. The job's recruiter-defined weighted competency bar is loaded when a job-scoped blueprint is generated, frozen into the normalized blueprint rubric, and copied into immutable interview versions. The question wording may be generated, but the rubric cannot drift after publication.
- Candidate fix: `UNIQUE NULLS NOT DISTINCT (organization_id, email)` on the `candidates` table was replaced by a partial unique index (`candidates_org_email_notnull_idx`) so that multiple name-only (no email) candidates can be added to the same organization. `job-store.ts` updated to use a read-then-insert/update pattern instead of PostgREST upsert with `onConflict`. Migration `202609100002_fix_candidate_email_constraint.sql` applied to production.
- Voice update: Sarvam Bulbul v3 `shubh` is selected through the authenticated `/api/ai/sarvam/tts` PCM bridge using server-only `SARVAM_API_KEY`; MiniMax remains the no-key startup fallback.
- Vercel env: Added `SUPABASE_JWKS_URL` to production environment.
- Runtime status: source-aligned and production-deployed; `candidates` table constraint fixed; live voice sessions depend on Agora credentials being valid

Read all files under `L1/` before changing application contracts. Use `RECIPE.md` for invariants.
