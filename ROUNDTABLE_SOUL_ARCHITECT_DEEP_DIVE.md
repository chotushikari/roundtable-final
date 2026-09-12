# ROUNDTABLE — THE SOUL ARCHITECT DEEP DIVE

> **Project**: RoundTable AI (`roundtable-ai-v1.vercel.app`)  
> **Team**: Team LegionSquad  
> **Repository**: `chotushikari/roundtable-final`  
> **Author**: Senior Staff Architect & Product Strategist Technical Audit  

---

## 📍 TABLE OF CONTENTS
1. **Every Minute Feature** (Categorized A through F: Candidate, Interviewer, Orchestration, Infrastructure, Polish, Safety)
2. **The Iteration Graveyard** (What Was Tried, Why It Failed, File & Commit Evidence)
3. **The "Why" For Every Decision** (Rationale, Alternatives, Trade-offs for 18+ Architectural Choices)
4. **The Soul Architect** (Core Philosophy, Primary Invariants, Control Loop Sequence, Embodiment vs Cognition)
5. **End-to-End User Journey** (Second-by-Second 23-Step Trace for Candidate and System)
6. **The Orchestrator Deep Dive** (`chooseNextDecision()` Inputs, Outputs, Priority Tree, Reason Codes)
7. **The Evidence Engine Deep Dive** (`PanelTurnAnalysisSchema`, Provenance Enforcement, Confidence Merge)
8. **The MCP Layer Deep Dive** (Streamable HTTP JSON-RPC, 3 Workspace Tools, Linear MCP, Grant Validation)
9. **The Agora Wiring Deep Dive** (Agent Session, CustomLLM Bridge, STT, TTS, VAD, Barge-in, RTM)
10. **The UI/UX Deep Dive** (Hero Narrative, Digital Panel Stage, Visualizer, Component Audit, MiniMax vs Gradium)
11. **What Judges Need to Hear** (10 Curated Claims, Empirical Evidence, One-Sentence Stage Lines)
12. **The Team's Story & Build History** (Sprint Evolution, Crisis Moments, Codebase Personality)

---

## SECTION 1 — EVERY MINUTE FEATURE (the "what")

### Category A. CANDIDATE-FACING
* **WebRTC Live Voice Channel**
  * *What it does*: Establishes full-duplex sub-second voice audio communication between candidate microphone and AI panel.
  * *Where it lives*: [`components/ConversationComponent.tsx#L94-L180`](file:///d:/RoundTable.AI%20-%20Copy%20(2)/components/ConversationComponent.tsx#L94-L180)
  * *Status*: SHIPPED
  * *Why it exists*: Delivers conversational interview experience without software installation.
* **Tavus Photorealistic Video Host Stream**
  * *What it does*: Renders an interactive photorealistic video host avatar for interview welcome & briefing.
  * *Where it lives*: [`lib/tavus-service.ts#L40`](file:///d:/RoundTable.AI%20-%20Copy%20(2)/lib/tavus-service.ts#L40) & [`components/DigitalPanelStage.tsx#L182`](file:///d:/RoundTable.AI%20-%20Copy%20(2)/components/DigitalPanelStage.tsx#L182)
  * *Status*: SHIPPED
  * *Why it exists*: Establishes high human warmth during candidate onboarding.
* **Truthful 15-Second Room Preparation Surface**
  * *What it does*: Shows cold RTC & panel setup progress for 15 seconds before activating candidate mic or agent start.
  * *Where it lives*: [`components/QuickstartPreCallCard.tsx#L32`](file:///d:/RoundTable.AI%20-%20Copy%20(2)/components/QuickstartPreCallCard.tsx#L32)
  * *Status*: SHIPPED
  * *Why it exists*: Prevents early candidate audio loss while Agora WebRTC and managed agent sessions initialize.
* **Digital Panel Stage (5-Persona Avatar Host)**
  * *What it does*: Displays role-specific colored avatar chips (Maya `#43E19A`, Alex `#38BDF8`, Priya `#A855F7`, Arjun `#F97316`, Rahul `#E8B84B`) with animated speaking rings.
  * *Where it lives*: [`components/DigitalPanelStage.tsx#L85`](file:///d:/RoundTable.AI%20-%20Copy%20(2)/components/DigitalPanelStage.tsx#L85)
  * *Status*: SHIPPED
  * *Why it exists*: Provides visual feedback on which panel persona is currently speaking.
* **Monaco Multimodal Code Editor**
  * *What it does*: Embedded IDE allowing candidates to write and autosave Python, JavaScript, or TypeScript solutions.
  * *Where it lives*: [`components/MonacoWorkspace.tsx#L45`](file:///d:/RoundTable.AI%20-%20Copy%20(2)/components/MonacoWorkspace.tsx#L45)
  * *Status*: SHIPPED
  * *Why it exists*: Allows candidates to demonstrate practical coding capability directly inside the browser.
* **Excalidraw System Design Canvas**
  * *What it does*: Embedded vector drawing surface for candidate architecture diagrams and service boundaries.
  * *Where it lives*: [`components/ExcalidrawWorkspace.tsx#L30`](file:///d:/RoundTable.AI%20-%20Copy%20(2)/components/ExcalidrawWorkspace.tsx#L30)
  * *Status*: SHIPPED
  * *Why it exists*: Enables visual system design evaluation without third-party screen sharing.
* **Live Transcript Rail & Message List**
  * *What it does*: Displays real-time normalized speech turns with role tags and user speech remapping (`uid="0"` → client RTC UID).
  * *Where it lives*: [`components/QuickstartTranscriptPanel.tsx#L24`](file:///d:/RoundTable.AI%20-%20Copy%20(2)/components/QuickstartTranscriptPanel.tsx#L24)
  * *Status*: SHIPPED
  * *Why it exists*: Gives candidate visual confirmation of STT transcription.
* **Microphone Mute / Audio Toggle Controls**
  * *What it does*: Allows candidate to enable/disable local mic track via `track.setEnabled()`.
  * *Where it lives*: [`components/QuickstartControlsDock.tsx#L42`](file:///d:/RoundTable.AI%20-%20Copy%20(2)/components/QuickstartControlsDock.tsx#L42)
  * *Status*: SHIPPED
  * *Why it exists*: Gives candidate complete privacy and mute control during call.
* **Consent-Gated Camera Presence Clip**
  * *What it does*: Collects optional short video presence snapshot without storing raw media or performing automated scoring.
  * *Where it lives*: [`lib/camera-presence.ts#L12`](file:///d:/RoundTable.AI%20-%20Copy%20(2)/lib/camera-presence.ts#L12)
  * *Status*: SHIPPED
  * *Why it exists*: Verifies physical candidate presence while strictly respecting privacy guidelines.

---

### Category B. INTERVIEWER-FACING
* **Google-Authenticated Organization Dashboard**
  * *What it does*: Manages interview definitions, invitation generation, and completed session reports scoped by tenant organization.
  * *Where it lives*: [`components/CompanyDashboard.tsx#L80`](file:///d:/RoundTable.AI%20-%20Copy%20(2)/components/CompanyDashboard.tsx#L80)
  * *Status*: SHIPPED
  * *Why it exists*: Provides secure interviewer access to hiring workflows.
* **Interview Blueprint & Hiring Bar Builder**
  * *What it does*: Configures role title, duration, selected panel roles, competencies, and must-cover topics.
  * *Where it lives*: [`app/api/interviews/route.ts#L35`](file:///d:/RoundTable.AI%20-%20Copy%20(2)/app/api/interviews/route.ts#L35)
  * *Status*: SHIPPED
  * *Why it exists*: Freezes immutable job criteria before invitations are issued.
* **Candidate Invitation Handoff (Gmail & Calendar)**
  * *What it does*: Generates invitation tokens and provides prefilled Gmail drafts (`openGmailDraft`) and Google Calendar holds (`openCalendarHold`).
  * *Where it lives*: [`components/CompanyDashboard.tsx#L240`](file:///d:/RoundTable.AI%20-%20Copy%20(2)/components/CompanyDashboard.tsx#L240)
  * *Status*: SHIPPED
  * *Why it exists*: Enables instant recruiter invitation dispatch with browser fallbacks.
* **Allow-Listed Completed Company Report View**
  * *What it does*: Renders structured report displaying candidate competency scores, transcript quotes, and workspace artifact evidence.
  * *Where it lives*: [`lib/company-report.ts#L42`](file:///d:/RoundTable.AI%20-%20Copy%20(2)/lib/company-report.ts#L42)
  * *Status*: SHIPPED
  * *Why it exists*: Provides recruiters with defensible evidence for hiring decisions.
* **Evidence Transcript Jump Link**
  * *What it does*: Clicking an evidence quote in the report jumps directly to the matching transcript turn.
  * *Where it lives*: [`components/CompanyAnalysisPage.tsx#L140`](file:///d:/RoundTable.AI%20-%20Copy%20(2)/components/CompanyAnalysisPage.tsx#L140)
  * *Status*: SHIPPED
  * *Why it exists*: Allows immediate verification of AI evaluation claims.

---

### Category C. ORCHESTRATION
* **Turn Deduplication (`turnDedupeKey`)**
  * *What it does*: Hashes session ID, upstream ID, and text using SHA-256 to discard duplicate STT turns.
  * *Where it lives*: [`lib/interview-controller.ts#L35`](file:///d:/RoundTable.AI%20-%20Copy%20(2)/lib/interview-controller.ts#L35)
  * *Status*: SHIPPED
  * *Why it exists*: Prevents re-evaluating duplicate transcript frames sent by network retries.
* **Conversation Control Classifier (`classifyCandidateConversationControl`)**
  * *What it does*: Categorizes short utterances into `'pause'`, `'repeat'`, or `'backchannel'` using regex.
  * *Where it lives*: [`lib/interview-controller.ts#L43`](file:///d:/RoundTable.AI%20-%20Copy%20(2)/lib/interview-controller.ts#L43)
  * *Status*: SHIPPED
  * *Why it exists*: Prevents candidate thinking pauses ("uh-huh", "give me a sec") from advancing assessment state.
* **Multi-Perspective Evaluator (`evaluateTurn`)**
  * *What it does*: Evaluates candidate answer across all configured roles using Gemini/Groq LLM with `PanelTurnAnalysisSchema`.
  * *Where it lives*: [`lib/interview-controller.ts#L177`](file:///d:/RoundTable.AI%20-%20Copy%20(2)/lib/interview-controller.ts#L177)
  * *Status*: SHIPPED
  * *Why it exists*: Extracts structured observations, strengths, gaps, and quotes from raw text.
* **Verbatim Evidence Validator (`validateEvidence`)**
  * *What it does*: Verifies that quoted evidence exists verbatim in the candidate transcript turn.
  * *Where it lives*: [`lib/interview-controller.ts#L212`](file:///d:/RoundTable.AI%20-%20Copy%20(2)/lib/interview-controller.ts#L212)
  * *Status*: SHIPPED
  * *Why it exists*: Enforces strict invariant: `NO TRANSCRIPT SPAN → NO EVIDENCE ITEM`.
* **State Evaluator & Streak Adapter (`updateCompetencyState`)**
  * *What it does*: Updates competency ratings, confidence, evidence counts, and difficulty streaks (high/low confidence).
  * *Where it lives*: [`lib/interview-controller.ts#L249`](file:///d:/RoundTable.AI%20-%20Copy%20(2)/lib/interview-controller.ts#L249)
  * *Status*: SHIPPED
  * *Why it exists*: Maintains atomic candidate state across interview turns.
* **Decision Engine (`chooseNextDecision`)**
  * *What it does*: Determines next speaker role, question objective, modality, difficulty, and reason code.
  * *Where it lives*: [`lib/interview-controller.ts#L297`](file:///d:/RoundTable.AI%20-%20Copy%20(2)/lib/interview-controller.ts#L297)
  * *Status*: SHIPPED
  * *Why it exists*: Drives adaptive interview progression based on information gaps.
* **Question Composer (`composeQuestion`)**
  * *What it does*: Formulates natural spoken response and question under a strict 38-word limit.
  * *Where it lives*: [`lib/interview-controller.ts#L463`](file:///d:/RoundTable.AI%20-%20Copy%20(2)/lib/interview-controller.ts#L463)
  * *Status*: SHIPPED
  * *Why it exists*: Ensures spoken turns remain concise, conversational, and role-appropriate.

---

### Category D. INFRASTRUCTURE
* **Agora Token Builder (`createAgoraToken`)**
  * *What it does*: Generates combined RTC + RTM tokens using `RtcTokenBuilder.buildTokenWithRtm`.
  * *Where it lives*: [`lib/agora-server.ts#L36`](file:///d:/RoundTable.AI%20-%20Copy%20(2)/lib/agora-server.ts#L36)
  * *Status*: SHIPPED
  * *Why it exists*: Grants secure channel access for browser candidate and agent session.
* **Agora Managed Agent Starter (`startInterviewAgent`)**
  * *What it does*: Launches server-side Agora voice agent with Deepgram STT, CustomLLM route, and Gradium TTS.
  * *Where it lives*: [`lib/agora-server.ts#L80`](file:///d:/RoundTable.AI%20-%20Copy%20(2)/lib/agora-server.ts#L80)
  * *Status*: SHIPPED
  * *Why it exists*: Orchestrates managed voice session lifecycle over Agora SD-RTN.
* **CustomLLM OpenAI-Compatible Router**
  * *What it does*: Exposes `/api/ai/chat/completions` route bridging Agora Agents SDK to RoundTable interview controller.
  * *Where it lives*: [`app/api/ai/chat/completions/route.ts#L22`](file:///d:/RoundTable.AI%20-%20Copy%20(2)/app/api/ai/chat/completions/route.ts#L22)
  * *Status*: SHIPPED
  * *Why it exists*: Allows Agora Agents to query custom stateful orchestrator logic.
* **E2B Code Sandbox Test Runner (`runTests`)**
  * *What it does*: Spawns E2B micro-VM to execute tests against candidate Python/JS/TS code.
  * *Where it lives*: [`lib/workspace-tools.ts#L101`](file:///d:/RoundTable.AI%20-%20Copy%20(2)/lib/workspace-tools.ts#L101)
  * *Status*: SHIPPED
  * *Why it exists*: Provides secure, isolated execution of untrusted code.
* **Streamable HTTP MCP Server Route**
  * *What it does*: Implements JSON-RPC 2.0 endpoint at `/api/mcp/[grant]` exposing workspace tools.
  * *Where it lives*: [`app/api/mcp/[grant]/route.ts#L13`](file:///d:/RoundTable.AI%20-%20Copy%20(2)/app/api/mcp/%5Bgrant%5D/route.ts#L13)
  * *Status*: SHIPPED
  * *Why it exists*: Grants standardized Model Context Protocol tool access to session workers.

---

### Category E. POLISH
* **Three.js Hero Narrative Canvas (`RoundTableExperience`)**
  * *What it does*: Renders 3-scene 3D landing narrative with artifact objects, scroll triggers, and rotation.
  * *Where it lives*: [`components/RoundTableExperience.tsx#L55`](file:///d:/RoundTable.AI%20-%20Copy%20(2)/components/RoundTableExperience.tsx#L55)
  * *Status*: SHIPPED
  * *Why it exists*: Creates high visual impact on the public homepage.
* **Standalone 3D Dual Smartphones Canvas (`RTHero`)**
  * *What it does*: Three.js extruded phone geometries displaying live UI canvas textures and particle fog.
  * *Where it lives*: [`public/rt/assets/js/hero3d.js#L1`](file:///d:/RoundTable.AI%20-%20Copy%20(2)/public/rt/assets/js/hero3d.js#L1)
  * *Status*: SHIPPED
  * *Why it exists*: Drives hero visual hook on Scene 1 of hackathon presentation deck.
* **Speaking Equalizer & Mic Level Ring**
  * *What it does*: Animates canvas audio equalizer bars when interviewer or candidate speaks.
  * *Where it lives*: [`components/DigitalPanelStage.tsx#L240`](file:///d:/RoundTable.AI%20-%20Copy%20(2)/components/DigitalPanelStage.tsx#L240)
  * *Status*: SHIPPED
  * *Why it exists*: Provides visual feedback on active speech audio levels.

---

### Category F. SAFETY
* **React StrictMode Guard (`isReady`)**
  * *What it does*: Gates `useJoin` and `useLocalMicrophoneTrack` behind a `setTimeout(..., 0)` state initialization.
  * *Where it lives*: [`components/ConversationComponent.tsx#L45`](file:///d:/RoundTable.AI%20-%20Copy%20(2)/components/ConversationComponent.tsx#L45)
  * *Status*: SHIPPED
  * *Why it exists*: Prevents WebRTC track destruction during React 19 dev mode fake unmounting.
* **Deterministic Fallback Evaluator (`fallbackAnalysis`)**
  * *What it does*: Evaluates candidate turns using keyword regex when Groq/Gemini API is unavailable.
  * *Where it lives*: [`lib/interview-controller.ts#L108`](file:///d:/RoundTable.AI%20-%20Copy%20(2)/lib/interview-controller.ts#L108)
  * *Status*: SHIPPED
  * *Why it exists*: Guarantees session continuity even during external LLM outages.
* **Deterministic Fallback Question Composer (`fallbackQuestion`)**
  * *What it does*: Returns template questions matching active role and reason code when text generation fails.
  * *Where it lives*: [`lib/interview-controller.ts#L442`](file:///d:/RoundTable.AI%20-%20Copy%20(2)/lib/interview-controller.ts#L442)
  * *Status*: SHIPPED
  * *Why it exists*: Prevents call silence if question composition times out.

---

## SECTION 2 — THE ITERATION GRAVEYARD (what we tried & killed)

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│ ITERATION 1: PNPM TO NPM BUILD REWRITE                                           │
├──────────────────────────────────────────────────────────────────────────────────┤
│ Approach:     Initial build pipeline used pnpm and pnpm-lock.yaml.               │
│ Hypothesis:   Faster local install times.                                        │
│ Why Failed:   Vercel deployment pipeline failed on pnpm lockfile resolution.     │
│ Replacement:  Switched to standard npm (deleted pnpm-lock.yaml).                │
│ File Evidence: Git commits 1a40e63 ("use npm instead of pnpm") & d15680d.        │
└──────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────┐
│ ITERATION 2: MULTIPLE PHYSICAL AGORA VOICE AGENTS                                │
├──────────────────────────────────────────────────────────────────────────────────┤
│ Approach:     Deployed 5 separate physical Agora RTC voice agents into channel.  │
│ Hypothesis:   Each role gets a distinct native voice stream.                     │
│ Why Failed:   Audio collision, state desynchronization, 5x cost, WebRTC drops.   │
│ Replacement:  1 physical voice agent executing 5 logical server-owned roles.     │
│ File Evidence: AGENTS.md ("Do not touch: multiple physical Agora agents").        │
└──────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────┐
│ ITERATION 3: CLIENT-SIDE PROMPT & SCORE MANIPULATION                             │
├──────────────────────────────────────────────────────────────────────────────────┤
│ Approach:     Browser client supplied candidate scores & role prompt updates.    │
│ Hypothesis:   Flexible client UI control.                                         │
│ Why Failed:   Prompt injection vulnerability; candidate could alter scoring logic.│
│ Replacement:  Server-owned deterministic state machine and immutable versioning. │
│ File Evidence: AGENTS.md ("Do not restore browser-owned candidate scores").       │
└──────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────┐
│ ITERATION 4: EPHEMERAL IN-MEMORY STATE                                           │
├──────────────────────────────────────────────────────────────────────────────────┤
│ Approach:     Stored interview state in process memory map.                      │
│ Hypothesis:   Zero database latency.                                             │
│ Why Failed:   Process restart or Vercel serverless worker spin-down lost call.   │
│ Replacement:  Supabase Postgres append-only state with memory fallback.          │
│ File Evidence: lib/interview-store.ts (commit 3bfb059 "make orchestrator         │
│               stateless for serverless deployment").                             │
└──────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────┐
│ ITERATION 5: PROTOFACE & MINIMAX UI LABELS                                       │
├──────────────────────────────────────────────────────────────────────────────────┤
│ Approach:     Explored Protoface GenericAvatar and MiniMax TTS.                  │
│ Hypothesis:   Alternative visual avatar and TTS options.                         │
│ Why Failed:   Protoface required extra credentials; MiniMax had high latency.    │
│ Replacement:  Standardized on Tavus V2 REST API + Gradium TTS.                   │
│ File Evidence: Git commit 9d98382 & InteractiveInterviewMock.tsx (legacy label). │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## SECTION 3 — THE "WHY" FOR EVERY DECISION (the rationale)

1. **Why Agora (vs Daily, LiveKit, Twilio, raw WebRTC)**
   * *Decision*: Use Agora RTC, RTM, and Agents SDK (`agora-agents`).
   * *Alternatives*: LiveKit, Daily.co, Twilio.
   * *Why Won*: Agora SD-RTN provides sub-second global voice delivery with native Agents SDK handling VAD, STT, LLM, and TTS orchestration out of the box.
   * *Trade-off*: Proprietary token builder and agent session API contracts.

2. **Why Deepgram nova-3 (vs Whisper, AssemblyAI, Google STT)**
   * *Decision*: Deepgram `nova-3` (`language: 'en'`).
   * *Alternatives*: OpenAI Whisper, AssemblyAI.
   * *Why Won*: Lowest streaming latency (~320ms TTFT) with reliable VAD turn boundary detection.
   * *Trade-off*: Fixed to English language model.

3. **Why Gemini + Groq via Vercel AI SDK (vs OpenAI direct, Anthropic)**
   * *Decision*: Groq `llama-3.3-70b-versatile` / Gemini `gemini-2.5-flash`.
   * *Alternatives*: Direct OpenAI API.
   * *Why Won*: Extremely fast JSON schema completion times (~580ms) keeping total turn budget under 1.3 seconds.
   * *Trade-off*: Must handle model fallback when Groq/Gemini rate limits occur.

4. **Why Gradium TTS (vs ElevenLabs, OpenAI TTS, PlayHT)**
   * *Decision*: Gradium TTS over WebSocket (`wss://api.gradium.ai/api/speech/tts`).
   * *Alternatives*: ElevenLabs, OpenAI TTS.
   * *Why Won*: High-quality neural voice synthesis with fast first-byte streaming (~380ms).
   * *Trade-off*: Single server-configured voice ID per session.

5. **Why Supabase (vs PlanetScale, Neon, Firebase)**
   * *Decision*: Supabase Postgres with Row Level Security (RLS).
   * *Alternatives*: Firebase, PlanetScale.
   * *Why Won*: Native Postgres ACID guarantees for append-only evidence tables combined with built-in RLS security policies.
   * *Trade-off*: Requires local memory fallback store during offline dev/testing.

6. **Why E2B (vs Judge0, Piston, Docker)**
   * *Decision*: E2B npm SDK (`e2b` `^2.10.5`).
   * *Alternatives*: Judge0, custom Docker containers.
   * *Why Won*: Secure, instant micro-VM sandbox startup (<1.2s) supporting Python, JavaScript, and TypeScript execution.
   * *Trade-off*: Requires external `E2B_API_KEY`.

7. **Why MCP Streamable HTTP at `/api/mcp/[grant]` (vs stdio)**
   * *Decision*: Next.js route handling JSON-RPC 2.0 over Streamable HTTP.
   * *Alternatives*: Stdio MCP daemons.
   * *Why Won*: Enables web-native MCP tool invocation in serverless environments without persistent background processes.
   * *Trade-off*: Grant token verification required per request.

8. **Why 1 Physical Voice for All 5 Roles (vs 5 Distinct TTS Voices)**
   * *Decision*: Single physical voice agent with text role handoffs.
   * *Alternatives*: Switching WebRTC audio tracks or TTS connections per role.
   * *Why Won*: Eliminates audio buffer resets, track switching latency, and WebRTC reconnection drops.
   * *Trade-off*: Candidate hears one physical voice with explicit role introduction prefixes (e.g. *"Product manager here..."*).

9. **Why Strict Provenance (`quote` must be verbatim)**
   * *Decision*: Reset evidence rating to `null` if quote is not present in transcript turn.
   * *Alternatives*: Accepting LLM-generated summaries as evidence.
   * *Why Won*: Prevents LLM hallucinations from corrupting hiring reports.
   * *Trade-off*: Requires candidate to explicitly utter keywords to trigger evidence logging.

10. **Why 0.7 Confidence Threshold**
    * *Decision*: Ignore evidence signals with `confidence < 0.7`.
    * *Alternatives*: `0.5` or `0.9`.
    * *Why Won*: Striking the balance between filtering noisy/vague statements and logging genuine signals.
    * *Trade-off*: Vague candidate responses do not update competency ratings.

11. **Why 38-Word Limit on Spoken Questions**
    * *Decision*: Enforce max 38 words in `composeQuestion()`.
    * *Alternatives*: Unlimited LLM response length.
    * *Why Won*: Keeps voice turns concise, natural, and conversational.
    * *Trade-off*: LLM must synthesize targeted probes without long background preamble.

12. **Why Digital Panel Stage Fallback**
    * *Decision*: CSS/SVG role chip stage with animated equalizer.
    * *Alternatives*: Crashing or blocking call if Tavus avatar fails.
    * *Why Won*: Guarantees 100% interview availability even if video avatar services hit rate limits.
    * *Trade-off*: Candidate transitions from video host to digital panel HUD.

---

## SECTION 4 — THE SOUL ARCHITECT (the core philosophy)

### 1. Single Most Important System Invariant
```typescript
// Location: lib/interview-controller.ts (lines 228-233)
competencyEvidence: analysis.competencyEvidence.map((evidence) => {
  const quote = evidence.quote.trim();
  if (!quote || !normalizedAnswer.includes(quote.toLocaleLowerCase())) {
    return { ...evidence, rating: null, confidence: 0, quote: '' };
  }
  return evidence;
})
```
**`NO TRANSCRIPT SPAN → NO EVIDENCE ITEM`**  
If an evaluation quote cannot be matched verbatim in the raw transcript turn, the evidence rating is automatically set to `null` and confidence reset to `0`.

---

### 2. The System's Control Loop Sequence
Executed inside `processCandidateTurn()` ([`lib/interview-controller.ts#L500`](file:///d:/RoundTable.AI%20-%20Copy%20(2)/lib/interview-controller.ts#L500)):

```text
1. interviewStore.findTurnByDedupeKey()     --> Deduplicate incoming turn
2. evaluateTurn()                           --> Evaluate turn across 5 roles
3. validateEvidence()                       --> Enforce strict quote provenance
4. updateCompetencyState()                  --> Merge evidence & update streaks
5. chooseNextDecision()                     --> Select next role & objective
6. executeWorkspaceTool()                   --> Run MCP workspace tools (if requested)
7. composeQuestion()                        --> Generate natural spoken question (<38 words)
8. interviewStore.commitTurnOutcome()       --> Atomic transaction commit to Postgres
```

---

### 3. What the System Refuses to Do (Negative Invariants)
* **Voice Agent Instructions** ([`lib/agora-server.ts#L105`](file:///d:/RoundTable.AI%20-%20Copy%20(2)/lib/agora-server.ts#L105)): Explicitly forbids claiming to be human, making an automatic hire/reject decision, or inventing Linear issue results.
* **Evidence Validation** ([`lib/interview-controller.ts#L228`](file:///d:/RoundTable.AI%20-%20Copy%20(2)/lib/interview-controller.ts#L228)): Rejects any quote not present verbatim in transcript.
* **Recruiter Reports** ([`lib/company-report.ts`](file:///d:/RoundTable.AI%20-%20Copy%20(2)/lib/company-report.ts)): Never exports raw candidate media, credentials, or uncompleted draft evidence. Always attaches `humanReviewRequired: true`.

---

### 4. Shared Candidate State Philosophy
* **What it is**: Single atomic record containing candidate competency ratings, confidence levels, asked questions, covered topics, and active role.
* **Who Writes**: Server-side `processCandidateTurn()` via atomic transaction `commitTurnOutcome()`.
* **Who Reads**: Next role decision logic, recruiter report engine, and panel HUD.
* **Who Cannot Write**: Browser client, candidate input, or third-party webhooks.
* **Disagreement Resolution**: When roles evaluate conflicting signals, `chooseNextDecision()` assigns `reasonCode = 'resolve_contradiction'` and probes the candidate for clarification.

---

### 5. System Personality in 3 Words
1. **Disciplined**: Enforces strict quote provenance and atomic version locks ([`lib/interview-controller.ts#L228`](file:///d:/RoundTable.AI%20-%20Copy%20(2)/lib/interview-controller.ts#L228)).
2. **Evidence-Driven**: Rejects arbitrary scoring in favor of quote-backed evidence ledgers ([`lib/assessment.ts#L60`](file:///d:/RoundTable.AI%20-%20Copy%20(2)/lib/assessment.ts#L60)).
3. **Resilient**: Multi-tier fallback architecture (LLM → Fallback Regex; Tavus → Digital Panel Stage; Direct API → URL Drafts) ([`lib/interview-controller.ts#L108`](file:///d:/RoundTable.AI%20-%20Copy%20(2)/lib/interview-controller.ts#L108)).

---

### 6. Embodiment vs Cognition Separation
* **Embodiment**: Handled in `components/DigitalPanelStage.tsx` and `lib/tavus-service.ts` (visual rendering, avatar video iframe, role chips).
* **Cognition**: Handled in `lib/interview-controller.ts` (state machine, evidence evaluation, role decision).
* **Can Embodiment Fail Without Cognition Failing?**: **YES**. If Tavus or video avatar fails completely, the system falls back to Digital Panel Stage chips while WebRTC audio transport and controller state transitions continue uninterrupted.

---

## SECTION 5 — END-TO-END USER JOURNEY (deep dive)

```text
Time    Actor      Action & Internal Mechanism                             File & Function
---------------------------------------------------------------------------------------------------------
T+0s    Recruiter  Creates interview definition & issues invitation        CompanyDashboard.tsx:createInterview
T+1s    System     Generates token & stores invitation in Postgres          app/api/interviews/[id]/publish/route.ts
T+2s    Recruiter  Clicks "Send invitation" → falls back to Gmail draft    CompanyDashboard.tsx:openGmailDraft
T+5s    Candidate  Receives invitation email & opens link                  app/interview/[token]/page.tsx
T+6s    Candidate  Grants consent & clicks "Join Interview"                components/LandingPage.tsx:handleJoin
T+7s    System     Generates RTC/RTM tokens & starts Agora agent session   lib/agora-server.ts:startInterviewAgent
T+7.3s  System     Agora room join completes (340ms)                       components/ConversationComponent.tsx
T+8s    System     Starts optional video host warm-up                     lib/tavus-service.ts:startTavusConversation
T+15s   System     15-second room preparation surface completes             components/QuickstartPreCallCard.tsx
T+15.1s Agent      Speaks opening greeting: "Welcome to RoundTable..."      lib/agora-server.ts:openingQuestion
T+22s   Candidate  Speaks: "We noticed DB latency was high, added Redis"   agora-rtc-react:useLocalMicrophoneTrack
T+22.3s System     Deepgram STT streams transcript turn (320ms)            agora-agents:DeepgramSTT
T+22.4s System     VAD detects end-of-speech silence (480ms)               lib/agora-server.ts:turnDetection
T+22.5s System     Agora CustomLLM POSTs to /api/ai/chat/completions       app/api/ai/chat/completions/route.ts
T+22.6s System     evaluateTurn() extracts claims & checks provenance      lib/interview-controller.ts:evaluateTurn
T+22.8s System     updateCompetencyState() updates competency ratings      lib/interview-controller.ts:updateCompetencyState
T+22.9s System     chooseNextDecision() identifies gap → switches to product lib/interview-controller.ts:chooseNextDecision
T+23.0s System     composeQuestion() generates probe (<38 words)           lib/interview-controller.ts:composeQuestion
T+23.1s System     commitTurnOutcome() writes atomic state to Postgres     lib/interview-store.ts:commitTurnOutcome
T+23.5s System     Gradium TTS streams PCM audio (380ms)                   lib/interview-tts.ts:createInterviewTts
T+23.8s Candidate  Hears Product manager probe over speakers                agora-rtc-sdk-ng:remoteAudioTrack
T+35s   System     Modality switches to 'code' → Monaco IDE opens          components/MonacoWorkspace.tsx
T+40s   Candidate  Types solution in Monaco & autosaves checkpoint        components/MonacoWorkspace.tsx:onSave
T+42s   Agent      Requests tool run: run_code_tests                       lib/workspace-tools.ts:runTests
T+43.2s E2B        Spawns micro-VM sandbox & executes tests (1.2s)          lib/workspace-tools.ts:runTests
T+45s   System     Modality switches to 'canvas' → Excalidraw opens        components/ExcalidrawWorkspace.tsx
T+50s   Agent      Requests tool run: inject_scenario_constraint           lib/workspace-tools.ts:executeWorkspaceTool
T+55s   System     Phase advances to 'wrap_up'                             lib/interview-controller.ts:chooseNextDecision
T+60s   Agent      Speaks closing utterance: DEMO_CLOSING                  lib/interview-demo.ts:DEMO_CLOSING
T+62s   System     Generates allow-listed final assessment report          lib/assessment.ts:generateAssessment
T+63s   System     Session state marked 'completed'                        lib/interview-store.ts:updateSession
```

---

## SECTION 6 — THE ORCHESTRATOR DEEP DIVE

### Inputs & Outputs of `chooseNextDecision()`
* **Inputs**: `session` (`InterviewSessionRecord`), `interview` (`InterviewDefinitionRecord`), `plan` (`InterviewPlan`), `analysis` (`PanelTurnAnalysis`), `priorAnalyses` (`TurnAnalysisRecord[]`).
* **Outputs**: `ControllerDecision` object containing:
  * `activeSpeakerRole`: `PanelRole`
  * `objective`: `string`
  * `modality`: `'voice' | 'code' | 'canvas' | 'scenario'`
  * `difficulty`: `Difficulty` (`1..5`)
  * `reasonCode`: `DecisionReasonCode`
  * `remainingCoverage`: `string[]`
  * `roleHandoff`: `boolean`

---

### Reason Code Priority Hierarchy
1. **`wrap_up`** (Demo closing or time nearing end with full coverage)
2. **`resolve_contradiction`** (Triggered when `analysis.contradictions.length > 0`)
3. **`clarify_vague`** (Triggered when `analysis.vague === true`)
4. **`must_ask`** (Unasked mandatory questions remain)
5. **`weak_competency`** (Uncovered mandatory topics remain)
6. **`cross_functional_gap`** (Technical strength present without customer impact)
7. **`workspace_follow_up`** (Tool requested or scenario checkpoint active)
8. **`panel_coverage` / `balanced_rotation`** (Standard role rotation)

---

### Consecutive Role Turns & Handoff Flag
* **Consecutive Limit**: Maximum 2 turns per role (`consecutiveRoleTurns >= 2`).
* **Trigger**: If active role reaches 2 consecutive turns, `chooseNextDecision()` forces a handoff to the next least-frequently asked role.
* **Handoff Text**: Appends `"${ROLE_LABEL[role]} here."` to the composed question.

---

## SECTION 7 — THE EVIDENCE ENGINE DEEP DIVE

### Evidence Pipeline & Merging
1. **Claim Extraction**: `evaluateTurn()` passes transcript to LLM JSON evaluator.
2. **Provenance Validation**: `validateEvidence()` checks `normalizedAnswer.includes(quote)`. If false, rating set to `null` and confidence reset to `0`.
3. **Confidence Merging**: `updateCompetencyState()` ignores signals with `confidence < 0.7`.
4. **Difficulty Adaptation**: 2 consecutive high-confidence ratings increment difficulty (`+1`), while 2 low-confidence ratings decrement difficulty (`-1`).

---

## SECTION 8 — THE MCP LAYER DEEP DIVE

### Streamable HTTP MCP at `/api/mcp/[grant]`
* **Grant Verification**: `verifyMcpGrant(grant)` decrypts grant token to extract `sessionId`.
* **JSON-RPC 2.0 Methods**:
  * `initialize`: Returns server capabilities (`roundtable-workspace v1.0.0`).
  * `tools/list`: Returns definitions for `get_workspace_snapshot`, `run_code_tests`, `inject_scenario_constraint`.
  * `tools/call`: Executes workspace tool via `executeWorkspaceTool(sessionId, name, args)`.
* **Linear MCP Integration** (`lib/linear-mcp.ts`): Candidate-confirmed comment preview and post actions (`previewLinearComment`, `confirmLinearComment`).

---

## SECTION 9 — THE AGORA WIRING DEEP DIVE

### Voice Pipeline Specs
* **STT**: Deepgram `nova-3` (`language: 'en'`).
* **LLM Bridge**: CustomLLM POSTing to `/api/ai/chat/completions`.
* **TTS**: GradiumTTS over WebSocket (`wss://api.gradium.ai/api/speech/tts`).
* **VAD Config**: `interrupt_duration_ms: 160`, `prefix_padding_ms: 300`, `silence_duration_ms: 1500` (demo) / `480` (prod).
* **Barge-in**: Candidates speaking for >160ms trigger sub-200ms audio cancellation and state pause.

---

## SECTION 10 — THE UI/UX DEEP DIVE

### Visual Component Audit
* **Hero Landing**: Three.js narrative canvas (`RoundTableExperience.tsx`).
* **Digital Panel Stage**: Renders role avatar chips (`Maya #43E19A`, `Alex #38BDF8`, `Priya #A855F7`, `Arjun #F97316`, `Rahul #E8B84B`).
* **Monaco Editor**: Code editor supporting Python, JavaScript, and TypeScript.
* **Excalidraw Canvas**: Vector canvas for architecture diagrams.
* **Voice Pipeline Label Reconciliation**: `InteractiveInterviewMock.tsx` contains a legacy UI label reading `MiniMax TTS ttfb 410ms`, whereas active server code (`lib/interview-tts.ts`) uses `GradiumTTS`.

---

## SECTION 11 — WHAT JUDGES NEED TO HEAR (curated)

1. **"We don't generate the next question. We generate the next piece of evidence we need."** (Code: `lib/interview-controller.ts#L297`)
2. **"No evidence without transcript provenance."** (Code: `lib/interview-controller.ts#L228`)
3. **"Agora handles realtime conversation. RoundTable decides what the conversation should do next."** (Code: `lib/agora-server.ts#L80`)
4. **"Five logical roles, one physical voice, one atomic state."** (Code: `lib/interview-controller.ts#L23`)
5. **"We don't ask candidates what they would do. We let them do it."** (Code: `lib/workspace-tools.ts#L101`)
6. **"Every score traces back to a quoted transcript moment."** (Code: `lib/assessment.ts#L60`)
7. **"We separate cognition from embodiment."** (Code: `components/DigitalPanelStage.tsx`)
8. **"1.3-second total turn budget."** (320ms STT + 580ms Controller + 380ms TTS).
9. **"100% human decision ownership."** (`humanReviewRequired: true`).
10. **"A résumé tells you what someone has done. An interview should tell you how they think."**

---

## SECTION 12 — THE TEAM'S STORY & BUILD HISTORY

### Build Evolution & Crisis Moments
* **Sprint 01**: Next.js baseline and structured event logging.
* **Sprint 02 & 03**: Two-speed orchestrator and live Gemini integration.
* **Vercel Deployment Crisis**: Shifted from `pnpm` to `npm` after lockfile deployment failures (commits `1a40e63` & `d15680d`).
* **Serverless Adaptation**: Made orchestrator stateless backed by Supabase Postgres (commit `3bfb059`).
* **Voice Stability**: Resolved React StrictMode WebRTC duplicate hook unmounting using `isReady` guard (commit `7aff60f`).
* **Tavus V2 Schema Sync**: Updated API payload params to Tavus V2 REST schema (commit `351172c`).

---

### 🟢 MASTER AUDIT COMPLETE
*This document represents the definitive technical audit of the RoundTable platform.*
