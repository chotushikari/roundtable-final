# 🏆 ROUNDTable — GRAND FINALE MASTER PITCH BOOK & LIVE DEMO SCRIPT

> **Deck Subtitle**: *Adaptive Evidence Acquisition Across Multiple Interviewer Perspectives*  
> **Target Stage Timing**: 3 Minutes 45 Seconds  
> **Tone**: Confident · Sharp · Technical · Slightly Playful · Demo-Driven · Uncompromising Architectural Discipline  

---

## 📍 TABLE OF CONTENTS
1. **The Executive Pitch Script** (Verbatim Spoken Word + Stage Choreography)
2. **The 20-Second Interactive Judge Activity**
3. **The Three Deep Technical Pillars**
   - Pillar 1: The Adaptive Panel & Information-Gap Engine
   - Pillar 2: Realtime Multimodal Execution (Agora Agents SDK)
   - Pillar 3: Real Work Simulation (MCP Tools & Artifact Evaluation)
4. **Competitive Differentiation & Market Positioning**
5. **Mentor Iteration Story & Graveyard of Failed Experiments**
6. **Avatar Story: Separation of Cognition & Embodiment**
7. **Complete System Architecture & 9 Technical Principles**
8. **17-Step Step-by-Step Live Demo Choreography**
9. **Slide-by-Slide Visual & Content Spec (11 Scenes)**
10. **The Final 10-Second Closing**

---

## 🗣️ SECTION 1: THE EXECUTIVE PITCH SCRIPT

> **[STAGE SETUP]**: Presenter walks onto stage. Slide 1 (`s1`) is visible on the projector: floating dual smartphones displaying Maya (System Design) and Priya (AI Engineering) with glowing shared state lines. No logos except RoundTable and Agora.

### ⚡ OPENING: THE QUESTION (0:00 – 0:25)

**PRESENTER**:  
"Quick experiment.  
Judge 1 — give me one technical answer you would expect from a senior backend candidate when asked how to handle database latency under load."

*(Judge responds, e.g. "Add a Redis cache layer" or "Implement read replicas")*

**PRESENTER**:  
"Now imagine that answer is completely correct.  
Should the interview end?"

*(Short pause. Smile at the judges.)*

"Probably not.  

Because correctness is evidence of exactly **one dimension**.  
The real question after every answer is: **What do we still not know?**

Did they add Redis because they measured a DB bottleneck, or because it’s the only tool in their comfort zone? Did they evaluate cache invalidation cost? What happens to their customer when the cache returns stale data during failover?

Most interview systems decide what to ask *before* the candidate speaks.  

**RoundTable is the AI interview panel that knows what it still needs to learn.**"

---

### 🎮 SECTION 2: THE 20-SECOND INTERACTIVE JUDGE ACTIVITY (0:25 – 0:50)

> **[STAGE ACTION]**: *Press `2` on the presenter remote to transition to Slide 2 (`s2`).*

**PRESENTER**:  
"Let’s prove this live right now.  
Judge 2 — give me *any* technically correct sentence about software architecture."

*(Judge says e.g.: "We decoupled the notification service using an SQS message queue.")*

**PRESENTER**:  
"Great. Watch what RoundTable does with that exact same sentence."

> **[STAGE ACTION]**: *Click the Technical Seat (Alex) on Slide 2.*

**TECHNICAL INTERVIEWER (ALEX)**:  
> *"Implementation makes sense. SQS decouples the write path."*

**PRESENTER**:  
"Now, watch the panel switch."

> **[STAGE ACTION]**: *Click the Product Seat (Priya) on Slide 2. The evidence HUD updates live.*

**PRODUCT INTERVIEWER (PRIYA)**:  
> *"That decouples your queue — but what did that change for the customer when notification delivery is delayed by 4 seconds?"*

> **[STAGE ACTION]**: *Click the Customer Seat (Rahul).*

**CUSTOMER INTERVIEWER (RAHUL)**:  
> *"Why should the enterprise buyer care about your SQS queue if their password reset email drops?"*

**PRESENTER**:  
*(Point to the screen projection)*  
"Look at the evidence ledger right now:

```text
TECHNICAL DEPTH          [✓ TRACED]   — SQS queue architecture validated
CUSTOMER IMPACT          [? UNKNOWN]  — Latency impact on user journey missing
BUSINESS TRADEOFF        [? UNKNOWN]  — Cost vs SLA boundary unverified
```

**The answer didn't change. The perspective changed.**  
And the next question was generated directly from the **missing evidence**."

---

## 🏛️ SECTION 3: THE THREE DEEP TECHNICAL PILLARS

```
                  ┌──────────────────────────────────────────────┐
                  │          ROUNDTable ORCHESTRATOR             │
                  └──────────────────────┬───────────────────────┘
                                         │
       ┌─────────────────────────────────┼─────────────────────────────────┐
       ▼                                 ▼                                 ▼
┌────────────────────────┐    ┌────────────────────────┐    ┌────────────────────────┐
│ PILLAR 1: ADAPTIVE     │    │ PILLAR 2: REALTIME     │    │ PILLAR 3: REAL WORK    │
│ PANEL (SHARED STATE)   │    │ MULTIMODAL (AGORA)     │    │ SIMULATION (MCP)       │
└────────────────────────┘    └────────────────────────┘    └────────────────────────┘
```

---

### 🏛️ PILLAR 1: ADAPTIVE PANEL & INFORMATION-GAP ENGINE (0:50 – 1:35)

**PRESENTER**:  
"Let’s dive into Pillar 1: **The Adaptive Panel**.

RoundTable does not deploy a single generic AI bot. We deploy a multi-lens panel: **Technical Depth, System Design, Product Impact, Debugging, and Hiring Manager.**

Each interviewer persona operates with:
* A distinct prosodic voice and communication personality
* A distinct evaluation rubric policy
* Role-scoped tool capabilities

**Crucially — all 5 personas share ONE candidate state.**

Here is the underlying state transition pipeline:

```text
Candidate Utterance
       ↓
STT Transcript Turn
       ↓
Evidence Extraction Engine (Identifies Claims vs Assumptions vs Leaps)
       ↓
Atomic Candidate State Update (Postgres)
       ↓
Information Gap Calculation (Rubric Criteria Coverage vs Missing Evidence)
       ↓
Orchestrator Role Selection (Whose perspective resolves the highest uncertainty?)
       ↓
Next Interviewer Persona → Next Target Probe
```

**Write this down**:  
*We don't generate the next question.*  
*We generate the next piece of evidence we need.*

When Candidate A says *'We added Redis to reduce DB reads'*, our Information-Gap engine flags `noticed` as an ASSUMPTION, `was high` as UNVERIFIED, and `added Redis` as a LEAP. It triggers a targeted probe that drops criteria uncertainty from **0.62 down to 0.21**."

---

### 🏛️ PILLAR 2: REALTIME MULTIMODAL EXECUTION — AGORA AGENTS (1:35 – 2:10)

> **[STAGE ACTION]**: *Transition to Slide 10 (`s9`) — Interactive System Architecture Map.*

**PRESENTER**:  
"Pillar 2: **Realtime Multimodal Execution**.

Let’s be technically clear about our transport layer. **Agora Agents SDK** is our realtime execution engine. 

Agora provides:
`Agent` · `AgentSession` · `STT` · `LLM` · `TTS` · `turnDetection` · `SD-RTN`

We built RoundTable on top of Agora. 

```text
Candidate WebRTC Audio
       ↓
Agora SD-RTN Global Media Network
       ↓
Agora Agents SDK (Managed Session, Turn Boundaries, VAD Barge-In)
       ↓
RoundTable Orchestrator Route (Next.js 16 Serverless / Custom LLM Controller)
       ↓
Role-Specific Directive & Prompt Context
       ↓
Agora TTS Playout Stream → Candidate
```

Here is the architectural boundary:  
**Agora handles realtime conversation. RoundTable decides what the conversation should do next.**

We operate inside a strict **1.3-second end-to-end turn budget**:
* **320ms** for Agora STT transcript streaming
* **580ms** for RoundTable Orchestrator state update & probe evaluation
* **400ms** for Agora TTS audio synthesis

When a candidate interrupts mid-sentence, Agora’s VAD detects start-of-speech instantly, cancels active audio playout, and sends a barge-in signal to our state machine in under 200ms."

---

### 🏛️ PILLAR 3: INTERVIEW AS A REAL WORK SIMULATION — MCP TOOLS (2:10 – 2:50)

> **[STAGE ACTION]**: *Transition to Slide 5 (`s5`) / Workspace Demo View.*

**PRESENTER**:  
"Pillar 3: **Interview as a Real Work Simulation**.

We didn't just add Model Context Protocol (MCP) as a hackathon flex. We scoped tools to interviewer perspectives:

* **Technical Interviewer**: Scoped to GitHub source tree + Monaco Editor + Excalidraw Canvas.
* **Product Interviewer**: Scoped to Streamable HTTP MCP for Gmail drafts + Google Calendar holds + Product Spec docs.
* **Customer Interviewer**: Scoped to Zendesk support ticket logs + API latency metrics.

Watch what happens:  
The Product Interviewer asks: *'You have 3 conflicting customer requests. What do you prioritize?'*  
The candidate receives mock customer emails inside the workspace.

Then the Technical Interviewer takes over: *'Now draw the service boundary on the canvas.'*  
The candidate draws an architectural diagram in Excalidraw. The Technical Interviewer inspects the canvas artifact and says: *'Walk me through the cache miss between Node A and Node B.'*

The interview transforms from a passive Q&A script into:  
`TASK` → `DECISION` → `ARTIFACT` → `CHALLENGE` → `VERIFIED EVIDENCE`.

**We don't just ask candidates what they would do. We let them do it.**"

---

## 🤺 SECTION 4: COMPETITIVE DIFFERENTIATION & MARKET POSITIONING

**PRESENTER**:  
"Let’s talk about the market honestly.

Current AI hiring platforms like HireVue, Xobin, and CodeSignal already market AI interviewers, adaptive follow-ups, and automated scoring recommendations.

**We will never claim: 'We are the first AI interviewer.'** That is weak and easily disproven.

Here is the real industry shift:  
The market is moving from *scripted interview bots* to *agentic interviewing*.  
**RoundTable takes the next step: from one AI interviewer to an adaptive panel with shared evidence.**

```text
THE EXISTING MARKET PATTERN:
Candidate → One AI Interviewer → Question → Answer → Opaque Score (84/100)

THE ROUNDTABLE ARCHITECTURE:
Candidate → Shared Candidate State → Evidence Map → Multiple Panel Perspectives
          → Information Gap → Next-Best Interviewer → Next-Best Probe
          → Panel Disagreement Resolution → Traceable Evidence Packet
```

The unique unit of value in RoundTable is not a question, a chat transcript, or a score.  

**The unique unit of value is THE PANEL DECISION.**"

---

## 🪵 SECTION 5: MENTOR ITERATION STORY & GRAVEYARD OF FAILED EXPERIMENTS

**PRESENTER**:  
"We built RoundTable over relentless mentor feedback and real technical failures. Here are the 3 critical pivots that shaped our architecture:

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│ ITERATION 1: FROM BOT TO PANEL                                                   │
├──────────────────────────────────────────────────────────────────────────────────┤
│ Mentor Critique: "Why is this different from a fancy ChatGPT wrapper?"           │
│ Brutal Truth:     v0 was just a single prompt asking DSA questions.              │
│ Our Pivot:        Expanded to a 5-role panel (Tech, Product, Customer, HM,      │
│                   Behavioural). Turned screening into a professional simulation. │
└──────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────┐
│ ITERATION 2: FROM CHATBOT TO EMBODIED EMBEDDED HUD                               │
├──────────────────────────────────────────────────────────────────────────────────┤
│ Mentor Critique: "The avatar is cute, but the interaction feels like a phone call."│
│ Brutal Truth:     v1 had video lag and viseme drift that ruined immersion.       │
│ Our Pivot:        Added VAD barge-in, distinct prosodic voices, active persona   │
│                   rings, and real-time state chips. The visual host became an    │
│                   embodiment layer, not the product.                             │
└──────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────┐
│ ITERATION 3: FROM SHINY DEMO TO REPRODUCIBLE DEEP ARCHITECTURE                    │
├──────────────────────────────────────────────────────────────────────────────────┤
│ Mentor Critique: "Show me the technical depth. Don't just show a UI mockup."     │
│ Brutal Truth:     v2 stored state in ephemeral memory; crash = lost interview.  │
│ Our Pivot:        Migrated to Agora Agents SDK, Supabase Postgres append-only    │
│                   Evidence Ledger, Streamable HTTP MCP, and deterministic        │
│                   server-owned controller logic.                                 │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 🪦 THE GRAVEYARD OF FAILED EXPERIMENTS (What We Tried & Settled For)

1. **Tried: 5 Physical Live Voice Agents**  
   *Failed*: Utter chaos. Agents talked over each other, state desynchronized, costs quadrupled.  
   *Settled For*: **1 Physical Agora Voice Agent with 5 Logical Server-Owned Personas** sharing ONE atomic state.
2. **Tried: Client-Side Prompt Selection**  
   *Failed*: Vulnerable to prompt injection; candidate could hijack the persona by typing SQL schemas.  
   *Settled For*: **Server-Owned Deterministic Controller** where candidate input is untrusted data sandboxed behind schema-validated state evaluators.
3. **Tried: Automated AI Hiring/Rejection Decisions**  
   *Failed*: Unreliable, unethical, and legally unacceptable for enterprise hiring.  
   *Settled For*: **100% Human Decision Ownership** with `humanReviewRequired: true` on every report.

---

## 👤 SECTION 6: AVATAR STORY: SEPARATION OF COGNITION & EMBODIMENT

**PRESENTER**:  
"Let’s address the visual host avatar directly.

**The human face is the embodiment. The intelligence is underneath.**

We intentionally architected a decoupled visual avatar model:

```text
Tavus Photorealistic Live Avatar Stream (Opening Welcome / Briefing)
                         ↓
Candidate Begins Deep Technical / Canvas Work
                         ↓
Visual Avatar Pauses / Transitions to Subtle Role Portrait HUD
                         ↓
Agora Realtime Voice & Workspace Protocol Continues Uninterrupted
```

Why did we build it this way?
1. Running multiple active video streams causes WebRTC frame drops and browser memory leaks.
2. Candidates coding in Monaco don't look at an avatar's face — they look at their code.
3. If an external video stream fails, the interview **must never break**.

**We separate cognition from embodiment.**"

---

## 📐 SECTION 7: COMPLETE SYSTEM ARCHITECTURE & 9 TECHNICAL PRINCIPLES

### 🗺️ SYSTEM ARCHITECTURE DIAGRAM

```text
                             ┌────────────────────────┐
                             │    CANDIDATE APP UI    │
                             │  (Next.js 16 / React)  │
                             └───────────┬────────────┘
                                         │
                                   WebRTC Audio
                                         │
                                         ▼
                             ┌────────────────────────┐
                             │    AGORA AGENTS SDK    │
                             │ (STT / LLM / TTS / VAD)│
                             └───────────┬────────────┘
                                         │
                                   Transcript Turn
                                         │
                                         ▼
                             ┌────────────────────────┐
                             │ ROUNDTable ORCHESTRATOR│
                             │  (Next.js Route API)   │
                             └───────────┬────────────┘
                                         │
                 ┌───────────────────────┼───────────────────────┐
                 ▼                       ▼                       ▼
     ┌──────────────────────┐┌──────────────────────┐┌──────────────────────┐
     │ ATOMIC CANDIDATE     ││ INFORMATION GAP      ││ SCENARIO & MCP ENGINE│
     │ STATE (Postgres)     ││ EVALUATION ENGINE    ││ (Gmail/GitHub/Canvas)│
     └───────────┬──────────┘└───────────┬──────────┘└───────────┬──────────┘
                 │                       │                       │
                 └───────────────────────┼───────────────────────┘
                                         │
                                  Next-Best Directive
                                         │
                                         ▼
                             ┌────────────────────────┐
                             │ EVIDENCE LEDGER (POSTGRES)│
                             │ NO SPAN → NO EVIDENCE  │
                             └───────────┬────────────┘
                                         │
                                         ▼
                             ┌────────────────────────┐
                             │ RECRUITER DECISION     │
                             │ PACKET (HUMAN CONTROL) │
                             └───────────┬────────────┘
```

### 📜 THE 9 TECHNICAL ARCHITECTURAL PRINCIPLES

1. **Separation of Cognition and Embodiment**: Real-time voice and decision logic exist independently of visual avatar rendering.
2. **One Shared Candidate State, Many Interviewer Policies**: 5 personas operate over one atomic Postgres interview state.
3. **Next-Best-Evidence Over Next-Question**: Question generation is driven strictly by missing evidence criteria.
4. **Realtime Execution Separated from Interview Intelligence**: Agora manages WebRTC media transport; RoundTable manages state transitions.
5. **Role-Scoped Tool Boundaries**: MCP tools are strictly isolated by interviewer persona (Tech gets GitHub/Monaco; Product gets Gmail/Calendar).
6. **Avatar Failure Resilience**: Total failure of visual video streams degrades gracefully to audio-only RTC without dropping call state.
7. **Single Active Video Stream**: Never multiplex expensive visual video feeds; preserve browser performance.
8. **Provider Abstraction**: BYOK provider paths behind `agora-agents` prevent vendor lock-in.
9. **Strict Transcript Provenance**: `NO TRANSCRIPT SPAN → NO EVIDENCE ITEM` enforced at database write time.

---

## 🎬 SECTION 8: 17-STEP STEP-BY-STEP LIVE DEMO CHOREOGRAPHY

```text
STEP 1:  Presenter opens Slide 1 (3D dual smartphones floating).
STEP 2:  Presenter initiates the 20-second Interactive Question with Judge 1.
STEP 3:  Presenter switches to Slide 2 (The Problem & Interactive Vote).
STEP 4:  Judge 2 provides a technically correct answer ("We used SQS queues").
STEP 5:  Presenter clicks Technical Seat (Alex) → Alex approves implementation.
STEP 6:  Presenter clicks Product Seat (Priya) → Priya asks for customer impact.
STEP 7:  Presenter clicks Customer Seat (Rahul) → Rahul asks about password reset SLAs.
STEP 8:  Presenter highlights Evidence HUD: Tech [✓] | Product [?] | Customer [?].
STEP 9:  Presenter transitions to Slide 4 (The 6-Stage Pipeline).
STEP 10: Presenter transitions to Slide 5 (Live Interview Room HUD).
STEP 11: Candidate speaks: "We noticed DB latency was high, so we added Redis."
STEP 12: System highlights spans: 'noticed' [ASSUMPTION], 'was high' [UNVERIFIED], 'added Redis' [LEAP].
STEP 13: Targeted probe fires: "How did you verify DB latency was the primary bottleneck?"
STEP 14: Presenter clicks '10x TRAFFIC SURGE' chip → Follow-up dynamically adapts.
STEP 15: Presenter transitions to Slide 7 (SVG Evidence Graph & Decision Packet).
STEP 16: Presenter clicks Evidence Node E2 → Shows linked transcript quote and rating.
STEP 17: Presenter transitions to Slide 11 (Close) and hits Key 'A' to open 16-Question Q&A Bank.
```

---

## 📽️ SECTION 9: SLIDE-BY-SLIDE VISUAL & CONTENT SPEC (11 SCENES)

| Slide ID | Title / Scene | Primary Visual Component | Key Spoken Line / Hook |
| :--- | :--- | :--- | :--- |
| **`s1`** | **OPENING** | 3D dual smartphones (Maya System Design & Priya AI Eng) with floating shared state lines | *"Hire the next generation of engineers. Two interviewers · One shared state."* |
| **`s2`** | **THE PROBLEM** | Interactive Judge Voting cards (Candidate A vs B) with live keypress counters (`1`/`2`) | *"Resumes tell you what people claims to have done, never how they think under pressure."* |
| **`s3`** | **MARKET STUDY** | Market data grid ($757B market) + Honest Competitor Matrix (Greenhouse, Ashby, HackerRank, HireVue) | *"Everyone automates a step. Nobody orchestrates the decision."* |
| **`s4`** | **WHAT WE BUILT** | 6-stage animated packet pipeline (JD → Bar → Blueprint → Voice → Evidence → Decision) | *"RoundTable AI turns a job requirement into an adaptive engineering interview."* |
| **`s5`** | **THE PRODUCT LIVE** | 5-persona virtual round table HUD, seat avatars, speech bubbles, live evidence stream | *"Five interviewer seats surround the round table — sharing ONE candidate state."* |
| **`s6`** | **CORE MECHANIC** | Interactive Information Gap card with highlighted spans (`noticed`, `was high`, `added Redis`) | *"We don't generate the next question. We generate the next piece of evidence we need."* |
| **`s7`** | **EVIDENCE** | Interactive SVG Evidence Graph (answers → evidence nodes → competencies → Lean Hire 0.82) | *"Don't give recruiters a score. Give them a reason."* |
| **`s8`** | **SURFACES** | 12-column Bento grid with `BUILT` (green), `DEMO` (amber), `ROADMAP` (gray) labels | *"One loop. Three surfaces. One shared state."* |
| **`s9` (id s10)**| **HOW WE BUILT IT** | Mentor iteration timeline (v0 to v3), struggle chips, and green `WHAT AGORA DOES` card | *"We build the brain. Agora carries the voice over managed SD-RTN."* |
| **`s10` (id s9)**| **ARCHITECTURE** | 5-band SVG system map, real brand SVGs, `⚡ RUN A HIRING REQUEST` packet runner | *"Realtime media, durable state, AI reasoning, and analytics do not belong in one failure domain."* |
| **`s11`** | **CLOSE** | Three memory hooks, closing line, and hidden 16-Question Q&A Defense Bank modal | *"A résumé tells you what someone has done. An interview should tell you how they think."* |

---

## 🏁 SECTION 10: THE FINAL 10-SECOND CLOSING

> **[STAGE ACTION]**: *Slide 11 (`s11`) is active. The stage lights focus on the presenter. Silence for 1 second.*

**PRESENTER**:  
"Most interview systems decide what to ask *before* the candidate answers.  

**RoundTable decides what it still needs to know after every answer.**  

That’s the difference between an AI interviewer... and an AI interview panel.  

Thank you."

*(Pause. Do not say "Thank you so much guys". Let the closing line hit. Press <kbd>A</kbd> to open the Q&A Defense Bank Modal.)*

---

### 🟢 MASTER PITCH BOOK READY
*This document contains the complete, authoritative pitch blueprint for the RoundTable AI Grand Finale.*
