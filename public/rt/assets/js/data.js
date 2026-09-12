window.RT_DATA = {
  personas: {
    maya: {
      id: "maya",
      name: "MAYA",
      role: "SYSTEM DESIGN",
      round: "ROUND 02",
      badgeClass: "badge-system",
      color: "#43E19A",
      avatarBg: "linear-gradient(135deg, #051A10, #103824)",
      signature: "Take your architecture and scale it ten times. What breaks first?",
      pool: [
        "Your cache now returns stale reads during failover. How do you bound the damage?",
        "Which part of this design are you least sure about — and how would you test it?",
        "If your primary DB region drops for 45 seconds, describe the exact cascade."
      ],
      synth: { pitch: 1.06, rate: 1.0, lang: "en-IN" },
      quip: "I look at architectural diagrams the way doctors look at smoking habits."
    },
    alex: {
      id: "alex",
      name: "ALEX",
      role: "TECHNICAL DEPTH",
      round: "ROUND 01",
      badgeClass: "badge-tech",
      color: "#38BDF8",
      avatarBg: "linear-gradient(135deg, #081B26, #0F3C54)",
      signature: "You said the API p95 is fine — but under write-heavy load? Walk me through what happens.",
      pool: [
        "Why did you choose an in-memory lock over Postgres advisory locks here?",
        "What happens to uncommitted transactions if the worker pod gets SIGKILL'd?",
        "Show me how you prevented event loop blockage when parsing large payloads."
      ],
      synth: { pitch: 0.92, rate: 1.02, lang: "en-IN" },
      quip: "p99 latency is where promises go to die."
    },
    priya: {
      id: "priya",
      name: "PRIYA",
      role: "AI ENGINEERING",
      round: "ROUND 04",
      badgeClass: "badge-ai",
      color: "#A855F7",
      avatarBg: "linear-gradient(135deg, #180926, #3B125A)",
      signature: "How would you evaluate the RAG pipeline you built — beyond 'it looked better'?",
      pool: [
        "When your vector search retrieves irrelevant context, how does your prompt recover?",
        "What is your fallback when the primary LLM provider hits rate limits mid-turn?",
        "How do you prevent prompt injection when candidates input arbitrary SQL schemas?"
      ],
      synth: { pitch: 1.1, rate: 1.04, lang: "en-IN" },
      quip: "If your AI test strategy is 'it worked on my prompt', we need to talk."
    },
    arjun: {
      id: "arjun",
      name: "ARJUN",
      role: "DEBUGGING & INCIDENTS",
      round: "ROUND 03",
      badgeClass: "badge-debug",
      color: "#F97316",
      avatarBg: "linear-gradient(135deg, #240E05, #54220A)",
      signature: "Deploys fail randomly, one in twenty. Logs are clean. Where do you look first?",
      pool: [
        "Your connection pool is exhausted but CPU is at 10%. Diagnose it live.",
        "How do you trace a missing event across 4 microservices without distributed tracing?",
        "A memory leak doubles RSS every 6 hours. Walk me through your heap dump isolation."
      ],
      synth: { pitch: 0.98, rate: 1.06, lang: "en-IN" },
      quip: "Clean logs just mean you forgot to catch the exception."
    },
    rahul: {
      id: "rahul",
      name: "RAHUL",
      role: "HIRING MANAGER",
      round: "ROUND 05",
      badgeClass: "badge-hm",
      color: "#E8B84B",
      avatarBg: "linear-gradient(135deg, #241A05, #543F0A)",
      signature: "Tell me about a technical decision you disagreed with — and what you did after losing the argument.",
      pool: [
        "How do you balance technical debt reduction against shipping quarterly features?",
        "Describe a time you simplified a complex solution proposed by a junior engineer.",
        "When an outage happens on a Friday at 7 PM, how do you handle team communications?"
      ],
      synth: { pitch: 0.88, rate: 0.98, lang: "en-IN" },
      quip: "Resumes tell me what you built. I care about what broke after you left."
    }
  },

  evidenceItems: [
    { id: "E1", text: "Baseline DB latency measured before cache insertion", status: "TRACED", node: "E1" },
    { id: "E2", text: "Causal diagnosis: read bottleneck verified via query logs", status: "TRACED", node: "E2" },
    { id: "E3", text: "Trade-off articulated: eventual consistency vs cache invalidation cost", status: "TRACED", node: "E3" },
    { id: "E4", text: "Failure-mode reasoning: cache invalidation race condition", status: "OPEN GAP", node: "E4" },
    { id: "E5", text: "Evaluated alternative: read-replicas rejected due to replica lag", status: "TRACED", node: "E5" }
  ],

  mentorIterations: [
    { version: "v0", title: "AI INTERVIEWER", critique: "Why is this different from a fancy ChatGPT wrapper?", pivot: "Shifted from generic Q&A to stateful candidate evaluation." },
    { version: "v1", title: "ADAPTIVE INTERVIEWER", critique: "Your bot interviews, but nobody makes a hiring decision.", pivot: "Built the Evidence Ledger & Decision Packet for recruiters." },
    { version: "v2", title: "FIVE PERSONAS", critique: "Five chatbots are not a panel — they contradict each other.", pivot: "Created the Atomic Shared Interview State on the server." },
    { version: "FINAL", title: "ROUNDTABLE AI", critique: "Orchestration + Evidence + Human Ownership.", pivot: "The evidence loop: JD → Bar → Blueprint → Gap Probe → Decision." }
  ],

  struggleChips: [
    { label: "BARGE-IN COLLISIONS", desc: "Candidate speaks mid-turn → server cancels TTS & resets audio state instantly." },
    { label: "VISEME DRIFT", desc: "Avatar lips synced with RTC audio stream without frame lag or drift." },
    { label: "PERSONA CONTRADICTIONS", desc: "Shared interview state prevents Priya from re-asking Maya's scalability question." },
    { label: "DEMO-DAY RISK", desc: "Untrusted venue Wi-Fi → 100% offline fallback deck + local WebAudio/SpeechSynth." }
  ],

  archNodes: {
    node_candidate_app: {
      name: "CANDIDATE APP (Next.js 16)",
      band: "BAND 0 · PRESENTATION / CLIENT",
      resp: "Renders Monaco editor, Excalidraw canvas, Agora WebRTC video/audio stream, and candidate preflight HUD.",
      input: "Candidate mic/camera, user code edits, canvas drawing strokes.",
      output: "Agora WebRTC audio frames, RTM workspace mutation events.",
      why: "Delivers zero-latency candidate experience without browser plugin installation.",
      scaling: "Stateless client served via Vercel Edge CDN.",
      failure: "Network drop triggers automatic RTC reconnect with zero state loss."
    },
    node_interviewer_console: {
      name: "INTERVIEWER CONSOLE (React 19)",
      band: "BAND 0 · PRESENTATION / CLIENT",
      resp: "Role-aware panel UI showing real-time evidence stream, depth meter, and active persona status.",
      input: "RTM company_session_status events.",
      output: "Manual recruiter override commands & debrief notes.",
      why: "Gives human interviewers real-time visibility into AI panel probing.",
      scaling: "Lightweight client listening to broadcast RTM channels.",
      failure: "Falls back to static snapshot polling if WebSocket drops."
    },
    node_agora_rtc: {
      name: "AGORA RTC + AGENTS SDK",
      band: "BAND 1 · REALTIME INTERACTION",
      resp: "Sub-second global voice transport over SD-RTN, VAD turn detection, and managed AgentSession lifecycle.",
      input: "Candidate WebRTC audio stream.",
      output: "Low-latency PCM audio, STT transcript turns, turn boundary events.",
      why: "Rebuilding global real-time voice infrastructure is a fool's errand — Agora owns the voice pipeline.",
      scaling: "Agora SD-RTN handles millions of concurrent RTC streams effortlessly.",
      failure: "Agora Webhooks trigger automatic session recovery on client disconnect."
    },
    node_orchestrator: {
      name: "ADAPTIVE ORCHESTRATOR",
      band: "BAND 2 · ROUNDTABLE BRAIN",
      resp: "Evaluates atomic shared interview state, calculates information gaps, and selects the next interviewer persona.",
      input: "STT transcript turns, workspace artifact snapshots, active hiring bar criteria.",
      output: "Next interviewer turn directive, persona selection, gap probe question.",
      why: "Ensures 5 interviewer personas act as ONE cohesive panel instead of 5 disconnected bots.",
      scaling: "Stateless Next.js serverless route workers backed by Supabase state.",
      failure: "Defaults to standard blueprint question pool if LLM evaluation times out."
    },
    node_engines: {
      name: "QUESTION & GAP ENGINES",
      band: "BAND 2 · ROUNDTABLE BRAIN",
      resp: "Analyzes candidate claims for unverified assumptions, missing metrics, and logical leaps.",
      input: "Raw candidate utterance + hiring bar rubric.",
      output: "Targeted follow-up probe + updated uncertainty score.",
      why: "Turns vague candidate statements ('we added Redis') into rigorous engineering probes.",
      scaling: "Async execution scoped to active session.",
      failure: "Falls back to pre-indexed question bank on LLM rate-limit."
    },
    node_evidence_ledger: {
      name: "EVIDENCE LEDGER (PostgreSQL)",
      band: "BAND 3 · EVIDENCE LAYER",
      resp: "Append-only storage linking competency ratings directly to transcript quotes and workspace versions.",
      input: "Validated evaluation outputs from Orchestrator.",
      output: "Immutable evidence entries (E1–E5) and candidate competency graph.",
      why: "Enforces strict rule: NO TRANSCRIPT SPAN → NO EVIDENCE ITEM.",
      scaling: "Postgres append-only table with indexed session IDs.",
      failure: "Transaction rollbacks guarantee no partial or corrupted evidence."
    },
    node_supabase: {
      name: "SUPABASE / POSTGRES + RLS",
      band: "BAND 3 · EVIDENCE LAYER",
      resp: "Manages tenant isolation, Auth, private company data, and realtime state broadcasts.",
      input: "Recruiter credentials, job definitions, candidate sessions.",
      output: "Row Level Security (RLS) guarded database queries.",
      why: "Provides enterprise-grade tenant data security and instant realtime synchronization.",
      scaling: "Dedicated Postgres instance with horizontal read replicas.",
      failure: "Process-local memory fallback for offline development & testing."
    },
    node_human_decision: {
      name: "HUMAN DECISION LAYER",
      band: "BAND 4 · HUMAN DECISION LAYER",
      resp: "Presents structured decision packet to recruiter with explicit Review / Challenge / Override controls.",
      input: "Completed session evidence graph + human review required flag.",
      output: "Final hiring decision (Hire / Lean Hire / Reject) + recruiter debrief notes.",
      why: "AI assists and provides evidence — humans make the final defensible hiring decision.",
      scaling: "Standard web workflow.",
      failure: "Indefinite hold until human recruiter signs off."
    }
  },

  qaBank: [
    { cat: "POSITIONING", q: "AI interviewing already exists — what's new?", a: "Existing tools automate single Q&A steps. RoundTable orchestrates the connected evidence loop: JD → Bar → Blueprint → Adaptive Probe → Evidence Graph → Human Decision." },
    { cat: "POSITIONING", q: "Why will enterprise companies adopt a startup for hiring?", a: "We deploy inside their stack via Supabase RLS, export decision packets to their ATS, and NEVER auto-reject candidates. Humans retain 100% decision control." },
    { cat: "AI RELIABILITY", q: "What happens when the AI misjudges a candidate?", a: "Every rating requires a direct transcript quote. Recruiters see confidence metrics and can challenge or override any rating in one click." },
    { cat: "AI RELIABILITY", q: "LLMs hallucinate — why trust your evidence?", a: "We enforce strict provenance at the database level: NO TRANSCRIPT SPAN → NO EVIDENCE ITEM. If a quote isn't in the raw transcript, the ledger rejects it." },
    { cat: "AI RELIABILITY", q: "What if the candidate tries prompt injection?", a: "Candidate transcript text is treated as untrusted data in an isolated sandbox. State transitions only move through validated JSON evaluation schemas." },
    { cat: "FAIRNESS", q: "Doesn't adaptive probing make interviews unfair?", a: "Fairness lives in the hiring bar; adaptation lives in the path. Every candidate is evaluated on the exact same blueprint criteria and rubric." },
    { cat: "FAIRNESS", q: "How do you prevent accent or non-native language bias?", a: "Our STT layer evaluates technical content and logical coherence — prosody, accent, and minor grammatical pauses are completely ignored." },
    { cat: "ARCHITECTURE", q: "Why use Agora instead of custom WebRTC?", a: "Sub-second global voice transport over SD-RTN and managed Agents SDK turn detection is Agora's core competency. Rebuilding transport is zero-differentiator." },
    { cat: "ARCHITECTURE", q: "Why use Postgres for state instead of Redis?", a: "Interviews outlive connections. The evidence ledger requires strict ACID transactions and immutable append-only logs, not ephemeral memory key-values." },
    { cat: "ARCHITECTURE", q: "How does the system handle 10,000 concurrent interviews?", a: "Agora channels scale horizontally across SD-RTN. Our orchestrator workers are stateless serverless functions reading/writing to Supabase Postgres." },
    { cat: "DATA & PRIVACY", q: "Where does candidate data live?", a: "Inside the customer's own isolated Supabase database instance with Row Level Security (RLS). Audio recording is strictly opt-in and candidate-consented." },
    { cat: "DATA & PRIVACY", q: "Is raw candidate camera video analyzed by AI?", a: "No. Camera interaction is strictly consent-gated for basic presence. We store ZERO raw video media and perform NO automated biometric hiring decisions." },
    { cat: "PRODUCT & ROADMAP", q: "What is real today vs demo in this presentation?", a: "BUILT: Blueprint engine, adaptive orchestrator, evidence ledger, decision packet, Agora session loop. DEMO: Local speech synthesis stand-in for visual mock." },
    { cat: "PRODUCT & ROADMAP", q: "Why five AI interviewers instead of one?", a: "Real hiring panels have multi-lens perspectives (System Design, Tech, AI, Debug, HM). 5 personas sharing ONE state give complete coverage without contradiction." },
    { cat: "BUSINESS MODEL", q: "What is your business model?", a: "Per-interview SaaS pricing deployed in customer cloud, plus enterprise tier for custom blueprint audits. Differentiator: saving 80% of human panel-hours per hire." },
    { cat: "SUMMARY", q: "Why should judges remember RoundTable AI?", a: "A résumé tells you what someone has done. An interview should tell you how they think. RoundTable turns claims into evidence a panel can trust." }
  ],

  speakerNotes: {
    s1: {
      script: "Good evening judges. Look at these two floating interviewers. Maya evaluates System Design. Priya evaluates AI Engineering. Five distinct roles — but ONE shared state.",
      action: "Move mouse over 3D phones to show parallax orbit. Highlight 'TWO INTERVIEWERS · ONE SHARED STATE'.",
      emphasis: "A résumé tells you what someone has done. An interview should tell you how they think.",
      objection: "Objection: Is this just 5 different chatbots? Comeback: No — they read and write to one atomic interview state on the server."
    },
    s2: {
      script: "Tonight, you're the hiring manager. Look at Candidate A — top college, 4 years, flawless resume. Candidate B — 2 years, GitHub builder. Who do you hire?",
      action: "Press 1 or 2 to register judge votes live on screen. Click REVEAL BLIND SPOT.",
      emphasis: "Resumes tell you what people did — never how they think under challenge.",
      objection: "Objection: Resumes are enough for initial filter. Comeback: But they fail completely at predicting engineering performance under stress."
    },
    s3: {
      script: "The hiring market is $757 Billion dollars. Yet average cost-per-hire is $4,700 and mis-hires cost 30% of salary. Everyone automates a step — nobody orchestrates the decision.",
      action: "Point to competitor matrix comparing Greenhouse, Ashby, HackerRank, HireVue, and RoundTable AI.",
      emphasis: "Everyone automates a step. Nobody orchestrates the decision.",
      objection: "Objection: Aren't HackerRank and HireVue doing this? Comeback: They evaluate isolated code or video clips — they don't orchestrate a cross-role evidence loop."
    },
    s4: {
      script: "Here is RoundTable AI. We turn a job requirement into an adaptive engineering interview, track missing evidence, and help hiring teams make defensible decisions.",
      action: "Watch the green evidence packet travel along the animated 6-stage pipeline.",
      emphasis: "Every pass converts uncertainty into evidence.",
      objection: "Objection: Does AI make the final hiring decision? Comeback: Never. AI gathers and structures evidence; humans decide."
    },
    s5: {
      script: "Welcome to the live interview room HUD. Five interviewer seats surround the virtual round table. Click any seat — the persona activates and asks their signature question.",
      action: "Click Maya, then Priya, then Arjun. Show waveform animating and live evidence streaming in real-time.",
      emphasis: "Notice how state chips are SHARED across personas — Maya's topic coverage updates Priya's context instantly.",
      objection: "Objection: What if the candidate speaks while the AI is talking? Comeback: Agora VAD detects speech instantly and triggers sub-second barge-in cancellation."
    },
    s6: {
      script: "This is our signature moment — the Information Gap. The candidate says 'We added Redis'. The system flags 'added Redis' as a leap and asks the exact question that closes the gap.",
      action: "Click REVEAL flags. Watch uncertainty drop from 0.62 to 0.21. Click 10x TRAFFIC constraint chip.",
      emphasis: "The next question is chosen because it reduces uncertainty around a hiring criterion — not because it's next in a script.",
      objection: "Objection: Isn't this just follow-up prompting? Comeback: It's uncertainty-minimization over a structured hiring bar rubric."
    },
    s7: {
      script: "Recruiters don't get an opaque 84/100 score. They get an interactive evidence graph where every rating traces back to a quoted moment in the transcript.",
      action: "Click node E2 in the SVG evidence graph to highlight connected competency nodes and transcript span.",
      emphasis: "Don't give recruiters a score. Give them a reason.",
      objection: "Objection: What if an LLM hallucinates evidence? Comeback: The ledger enforces 'NO TRANSCRIPT SPAN → NO EVIDENCE ITEM' at database write time."
    },
    s8: {
      script: "One loop. Three surfaces. One shared state. Here is our honest product inventory — green for BUILT, amber for DEMO, gray for ROADMAP.",
      action: "Hover over Bento cards showing Candidate Surface, Interviewer Console, and Evidence Ledger.",
      emphasis: "We show you the real inventory because serious infrastructure software demands honesty.",
      objection: "Objection: Why are some items labeled DEMO? Comeback: Because we distinguish core production APIs from presentation mocks."
    },
    s9: {
      script: "Mentor feedback pushed us hard. V0 was an AI chatbot. V1 was an adaptive interviewer. V2 was 5 bots. Now RoundTable AI orchestrates evidence for a human decision.",
      action: "Highlight mentor critiques, struggle chips, and the green WHAT AGORA DOES card.",
      emphasis: "We build the brain. Agora carries the voice over managed SD-RTN.",
      objection: "Objection: Why not build your own audio transport? Comeback: Global RTC with 1.3s turn budget is Agora's core strength — rebuilding it is zero value."
    },
    s10: {
      script: "Here is our 5-band architecture map. Hand the mouse to the Solution Architect judge — click any box, I'll tell you why it's there.",
      action: "Click RUN A HIRING REQUEST to trigger animated green packet. Click AGORA node to open 6-field inspector.",
      emphasis: "Realtime media, durable workflow state, AI reasoning, and analytics do not belong in one failure domain.",
      objection: "Objection: Is Next.js serverless fast enough for orchestration? Comeback: Yes, orchestration logic runs in <40ms; media streams directly over Agora."
    },
    s11: {
      script: "A résumé tells you what someone has done. An interview should tell you how they think. That's RoundTable AI. Thank you — press A for our Q&A defense bank.",
      action: "Press A to launch the 16-question Q&A defense bank modal.",
      emphasis: "Ask us anything — we prepared.",
      objection: "Objection: Any remaining questions? Comeback: Open Q&A defense bank and click relevant topic card."
    }
  }
};
