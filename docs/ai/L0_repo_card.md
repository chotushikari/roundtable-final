# Repository Card

- Name: RoundTable AI
- Recipe Role: base
- Stack: Next.js 16 App Router, React 19, TypeScript, Agora RTC/RTM/Conversational AI, Supabase, Groq, E2B
- Package manager: npm
- Last Reviewed: 2026-09-12
- Setup update: the fixed fifteen-second pre-interview surface greets the saved candidate name, states the panel-perspective count, and provides take-your-time guidance before Agora begins the first question.
- Completion update: a completed demo closing transcript now triggers browser finalization after a 1.5-second playback buffer without waiting for a potentially stale final agent-state event.
- Latest review: 2026-09-12 recruiter command center — The recruiter dashboard is a responsive command center with a real-count, presentation-only Three.js signal field, guided workflow actions, job rail, and evidence workspace. It does not manufacture scores or live model claims. Job hiring bars are frozen into immutable blueprints. The recruiter builder creates either a fixed five-role, ten-minute finale showcase or a configurable two-to-five-role adaptive interview with a 5–90 minute budget; its guided actions, role templates, seniority, and focus controls populate server-validated blueprint inputs. The finale showcase is always Hiring Manager, Technical, Product, Customer, then Behavioural: evidence adapts questions but never handoff order. Candidate room entry has one fixed fifteen-second truthful countdown before managed agent and candidate microphone start; it previews the concise welcome and is not interview time. `agora-agents` is 2.8.0. Recruiters can record append-only `advance`, `hold`, `decline`, or `needs_review` decisions with a rationale; these are separate from AI assessment, attributed to the recruiter, and audit logged.
- Candidate fix: `UNIQUE NULLS NOT DISTINCT (organization_id, email)` on the `candidates` table was replaced by a partial unique index (`candidates_org_email_notnull_idx`) so that multiple name-only (no email) candidates can be added to the same organization. `job-store.ts` updated to use a read-then-insert/update pattern instead of PostgREST upsert with `onConflict`. Migration `202609100002_fix_candidate_email_constraint.sql` applied to production.
- Voice update: server-only `GRADIUM_API_KEY` plus a server-selected Gradium voice is required for the sole stable delivery voice; the one-agent architecture does not perform mid-session voice swaps.
- Presentation update: `DigitalPanelStage` defaults to an original bundled AI-host visual and actual voice-agent state. Protoface publishes only when explicitly enabled with `ENABLE_PROTOFACE_AVATAR=true` and valid credentials, so a provider failure cannot prevent a voice interview. It never processes candidate media or assessment evidence.
- Invitation delivery update: Generated candidate links can open a professional, personalised Gmail draft or Google Calendar hold through the recruiter’s signed-in browser. These are explicit review-and-confirm handoffs, not server-side email or calendar automation.
- Vercel env: Added `SUPABASE_JWKS_URL` to production environment.
- Runtime status: source-aligned and production-deployed; `candidates` table constraint fixed; live voice sessions depend on Agora credentials being valid

Read all files under `L1/` before changing application contracts. Use `RECIPE.md` for invariants.
