# Repository Card

- Name: RoundTable AI
- Recipe Role: base
- Stack: Next.js 16 App Router, React 19, TypeScript, Agora RTC/RTM/Conversational AI, Supabase, Groq, E2B
- Package manager: npm
- Last Reviewed: 2026-09-11
- Latest review: 2026-09-11 preparation-and-sdk sprint — Job hiring bars are frozen into immutable blueprints. The recruiter builder creates either a fixed five-role, ten-minute finale showcase or a configurable two-to-five-role adaptive interview with a 5–90 minute budget; its guided actions, role templates, seniority, and focus controls populate server-validated blueprint inputs. The finale showcase is always Hiring Manager, Technical, Product, Customer, then Behavioural: evidence adapts questions but never handoff order. Candidate review matches completed sessions to their private `job_candidate` invitation bridge and opens actual evidence reports alongside recruiter-owned decisions, without ranking or recommending candidates. Candidate room entry has a fixed fifteen-second, truthful preparation surface before the managed agent and candidate microphone start; its first audible panel turn is an interview question rather than a generic invitation greeting, and it is not interview time. `agora-agents` is upgraded to 2.8.0 and configures greetings through the current LLM option. Recruiters can record append-only `advance`, `hold`, `decline`, or `needs_review` decisions with a rationale; these are separate from AI assessment, attributed to the recruiter, and audit logged.
- Candidate fix: `UNIQUE NULLS NOT DISTINCT (organization_id, email)` on the `candidates` table was replaced by a partial unique index (`candidates_org_email_notnull_idx`) so that multiple name-only (no email) candidates can be added to the same organization. `job-store.ts` updated to use a read-then-insert/update pattern instead of PostgREST upsert with `onConflict`. Migration `202609100002_fix_candidate_email_constraint.sql` applied to production.
- Voice update: Sarvam Bulbul v3 `shubh` is selected through the authenticated `/api/ai/sarvam/tts` PCM bridge using server-only `SARVAM_API_KEY`; MiniMax remains the no-key startup fallback.
- Presentation update: a local `DigitalPanelStage` uses an original bundled AI-host visual, the server-owned active panel role, and actual voice-agent state to make the call legible without a second media-provider cold start. It is explicitly an AI visual host, not claimed live video or lip-sync, and never processes candidate media or assessment evidence.
- Vercel env: Added `SUPABASE_JWKS_URL` to production environment.
- Runtime status: source-aligned and production-deployed; `candidates` table constraint fixed; live voice sessions depend on Agora credentials being valid

Read all files under `L1/` before changing application contracts. Use `RECIPE.md` for invariants.
