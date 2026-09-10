# Security and Privacy

Company APIs validate Google-backed Supabase bearer tokens and use an idempotently provisioned organization keyed to the authenticated interviewer UUID. Candidate APIs validate an HttpOnly, SameSite=Strict signed cookie and never require a candidate account. The custom LLM uses a random token whose SHA-256 hash is stored. MCP URLs contain an expiring signed session grant.

The custom LLM ignores caller-provided system messages and model names. Employer, resume, and transcript content are untrusted data. Only literal transcript quotes survive evidence validation. E2B receives no process environment or app secrets, accepts only Python/JavaScript/TypeScript checkpoints, runs a fixed command for 15 seconds, caps output, and permits at most five tool runs.

`SARVAM_API_KEY` is a server-only TTS credential. It must never be added to client-visible environment variables, logs, API responses, examples with a real value, or source control. `/api/ai/sarvam/tts` accepts only the same bearer credential from Agora GenericTTS, so it cannot become a public paid-synthesis proxy; it fixes the server-owned Bulbul v3 model and `shubh` speaker instead of trusting request-supplied provider settings.

The optional camera interaction check requires a visible candidate consent action before camera access. Its Gemini key is server-only. Raw clips are used only for the immediate request and never stored, broadcast, scored, or included in assessment evidence. The result may only communicate whether the prompted interaction was observed, inconclusive, or unavailable; it must never identify a person, determine whether a voice is synthetic, allege deception, infer sensitive traits, or influence an employment decision.

Company reports require organization membership and are available only after completion. The report is an allow-listed projection rather than a database dump: it excludes controller cache, session events, credentials, raw media, and raw workspace content. All assessment claims remain transcript- or artifact-evidence-linked and retain `humanReviewRequired: true`.

Only an authenticated organization member can create a `human_decisions` record. The route verifies the Job Candidate belongs to that organization and job, requires a short human rationale, records the authenticated recruiter as actor, and appends an audit event. AI assessment code has no write path to this table.

`NEXT_PUBLIC_DISABLE_COMPANY_AUTH=true` is an explicit submission-only escape hatch. It makes the company dashboard and company report APIs public under one fixed demo organization while still using Supabase persistence. Never enable it for real candidate data, and remove it immediately after judging.


The homepage voice sample is intentionally bounded and disabled in production unless `ENABLE_HOMEPAGE_VOICE_DEMO=true`. Its agent prompt is server-owned, asks one question, produces one observation, makes no hiring decision, and uses a short idle timeout. It does not create an interview session or persist assessment evidence.
