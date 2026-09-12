window.RTApp = (function () {
  let currentSceneIndex = 0;
  const totalScenes = 11;
  const sceneIds = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s10", "s9", "s11"];
  let audioEnabled = true;
  let audioCtx = null;
  let stageTimerSeconds = 0;
  let stageTimerInterval = null;

  function init() {
    setupKeyboardListeners();
    setupRailDots();
    setupStageTimer();
    setupQAModal();
    setupSceneInteractions();

    // Check Hash
    const hash = window.location.hash.replace("#", "");
    const idx = sceneIds.indexOf(hash);
    if (idx !== -1) {
      gotoScene(idx);
    } else {
      gotoScene(0);
    }

    // Lazy Init 3D & Other Modules
    if (window.RTHero) window.RTHero.init();
    if (window.RTInterview) window.RTInterview.init();
    if (window.RTArch) window.RTArch.init();
  }

  function gotoScene(index) {
    if (index < 0 || index >= totalScenes) return;

    const prevIndex = currentSceneIndex;
    currentSceneIndex = index;

    const prevScene = document.getElementById(sceneIds[prevIndex]);
    const nextScene = document.getElementById(sceneIds[currentSceneIndex]);

    if (prevScene) prevScene.classList.remove("active");
    if (nextScene) nextScene.classList.add("active");

    // Update Hash
    window.location.hash = sceneIds[currentSceneIndex];

    // Update Rail Dots
    document.querySelectorAll(".rail-dot").forEach((dot, i) => {
      if (i === currentSceneIndex) dot.classList.add("active");
      else dot.classList.remove("active");
    });

    // Update Stage Counter
    const counter = document.getElementById("stage-counter");
    if (counter) counter.innerText = `${currentSceneIndex + 1} / ${totalScenes}`;

    // 3D Canvas Pause/Play
    if (window.RTHero) {
      window.RTHero.setActive(currentSceneIndex === 0);
    }

    // Play Audio Blip
    playBlip(600 + index * 40);

    // Update Speaker Notes
    updateSpeakerNotes();
  }

  function setupKeyboardListeners() {
    window.addEventListener("keydown", (e) => {
      // Don't trigger if typing in an input
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      switch (e.key) {
        case "ArrowRight":
        case " ":
        case "PageDown":
          e.preventDefault();
          gotoScene(currentSceneIndex + 1);
          break;
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault();
          gotoScene(currentSceneIndex - 1);
          break;
        case "Home":
          e.preventDefault();
          gotoScene(0);
          break;
        case "End":
          e.preventDefault();
          gotoScene(totalScenes - 1);
          break;
        case "1":
          registerJudgeVote(1);
          break;
        case "2":
          registerJudgeVote(2);
          break;
        case "n":
        case "N":
          toggleSpeakerNotes();
          break;
        case "a":
        case "A":
          toggleQAModal();
          break;
        case "f":
        case "F":
          toggleFullscreen();
          break;
        case "r":
        case "R":
          resetPresentation();
          break;
        case "s":
        case "S":
          audioEnabled = !audioEnabled;
          showToast(audioEnabled ? "Sound Enabled" : "Sound Muted");
          break;
      }
    });
  }

  function setupRailDots() {
    const container = document.getElementById("scene-rail");
    if (!container) return;

    container.innerHTML = "";
    sceneIds.forEach((id, idx) => {
      const dot = document.createElement("div");
      dot.className = `rail-dot ${idx === 0 ? "active" : ""}`;
      dot.title = `Scene ${idx + 1}: ${id}`;
      dot.addEventListener("click", () => gotoScene(idx));
      container.appendChild(dot);
    });
  }

  function setupStageTimer() {
    const timerEl = document.getElementById("stage-timer");
    if (!timerEl) return;

    stageTimerInterval = setInterval(() => {
      stageTimerSeconds++;
      const mins = Math.floor(stageTimerSeconds / 60).toString().padStart(2, "0");
      const secs = (stageTimerSeconds % 60).toString().padStart(2, "0");
      timerEl.innerText = `${mins}:${secs}`;
    }, 1000);
  }

  function registerJudgeVote(candidateNum) {
    if (currentSceneIndex !== 1) return;

    const cardA = document.getElementById("vote-card-a");
    const cardB = document.getElementById("vote-card-b");
    const pillA = document.getElementById("vote-pill-a");
    const pillB = document.getElementById("vote-pill-b");

    let countA = parseInt(pillA.dataset.count || "0");
    let countB = parseInt(pillB.dataset.count || "0");

    if (candidateNum === 1) {
      countA++;
      pillA.dataset.count = countA;
      pillA.innerText = `${countA} VOTES`;
      if (cardA) cardA.classList.add("voted");
    } else if (candidateNum === 2) {
      countB++;
      pillB.dataset.count = countB;
      pillB.innerText = `${countB} VOTES`;
      if (cardB) cardB.classList.add("voted");
    }

    playBlip(880);

    // Auto trigger reveal after votes
    const reveal = document.getElementById("blind-spot-reveal");
    if (reveal) reveal.classList.add("active");
  }

  function setupSceneInteractions() {
    // Scene 2 reveal button
    const revealBtn = document.getElementById("s2-reveal-btn");
    if (revealBtn) {
      revealBtn.addEventListener("click", () => {
        const reveal = document.getElementById("blind-spot-reveal");
        if (reveal) reveal.classList.toggle("active");
      });
    }

    // Scene 6 span reveals & chips
    const gapBtn = document.getElementById("s6-reveal-gap-btn");
    if (gapBtn) {
      gapBtn.addEventListener("click", () => {
        document.querySelectorAll(".span-highlight").forEach((s) => s.classList.add("active"));
        const box = document.getElementById("gap-probe-box");
        if (box) box.style.display = "block";
        const meter = document.getElementById("uncertainty-fill");
        if (meter) meter.style.width = "21%";
      });
    }

    document.querySelectorAll(".chip-btn").forEach((chip) => {
      chip.addEventListener("click", () => {
        document.querySelectorAll(".chip-btn").forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        const probeText = document.getElementById("gap-probe-text");
        if (probeText) {
          const type = chip.dataset.type;
          if (type === "traffic") probeText.innerText = "Under 10x traffic surge, how do you handle cache invalidation race conditions?";
          else if (type === "consistency") probeText.innerText = "With strict consistency required, why choose Redis over Postgres advisory locks?";
          else if (type === "cost") probeText.innerText = "What is your memory footprint cost strategy when Redis cache hits 50GB?";
          else probeText.innerText = "How did you verify database latency — not application processing — was the dominant bottleneck before choosing Redis?";
        }
      });
    });
  }

  function updateSpeakerNotes() {
    const sceneId = sceneIds[currentSceneIndex];
    const notes = window.RT_DATA.speakerNotes[sceneId];
    if (!notes) return;

    const drawer = document.getElementById("notes-drawer");
    if (!drawer) return;

    drawer.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <strong style="font-family: var(--font-mono); font-size: 11px; color: var(--signal);">SPEAKER NOTES · SCENE ${currentSceneIndex + 1} (${sceneId})</strong>
        <button onclick="window.RTApp.toggleSpeakerNotes()" style="background:none; border:none; color:var(--dim); cursor:pointer;">✕</button>
      </div>
      <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 16px; font-size: 12px; line-height: 1.4;">
        <div><strong style="color: var(--ink);">SCRIPT:</strong> <p style="color: var(--dim);">${notes.script}</p></div>
        <div><strong style="color: var(--signal);">ACTION:</strong> <p style="color: var(--dim);">${notes.action}</p></div>
        <div><strong style="color: var(--amber);">EMPHASIS:</strong> <p style="color: var(--dim);">${notes.emphasis}</p></div>
        <div><strong style="color: #F97316;">OBJECTION & COMEBACK:</strong> <p style="color: var(--dim);">${notes.objection}</p></div>
      </div>
    `;
  }

  function toggleSpeakerNotes() {
    const drawer = document.getElementById("notes-drawer");
    if (drawer) drawer.classList.toggle("active");
  }

  function setupQAModal() {
    const modal = document.getElementById("qa-modal");
    if (!modal) return;

    const grid = document.getElementById("qa-grid");
    if (!grid) return;

    grid.innerHTML = "";
    window.RT_DATA.qaBank.forEach((item, idx) => {
      const card = document.createElement("div");
      card.className = "qa-card";
      card.innerHTML = `
        <div style="font-family: var(--font-mono); font-size: 10px; color: var(--signal); margin-bottom: 4px;">[${item.cat}] Q${idx + 1}</div>
        <div class="qa-question">${item.q}</div>
        <div class="qa-answer">${item.a}</div>
      `;
      grid.appendChild(card);
    });
  }

  function toggleQAModal() {
    const modal = document.getElementById("qa-modal");
    if (modal) modal.classList.toggle("active");
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  }

  function resetPresentation() {
    gotoScene(0);
    if (window.RTInterview) window.RTInterview.stopAutoRun();
    showToast("Presentation Reset");
  }

  function playBlip(freq) {
    if (!audioEnabled) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") audioCtx.resume();

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch (e) {}
  }

  function showToast(msg) {
    const toast = document.createElement("div");
    toast.style.cssText = "position: fixed; bottom: 20px; right: 20px; background: rgba(5,8,6,0.9); border: 1px solid var(--signal); color: var(--signal); padding: 8px 16px; border-radius: 6px; font-family: var(--font-mono); font-size: 12px; z-index: 999; animation: fadeIn 0.3s ease;";
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }

  return {
    init: init,
    gotoScene: gotoScene,
    toggleSpeakerNotes: toggleSpeakerNotes,
    toggleQAModal: toggleQAModal
  };
})();

document.addEventListener("DOMContentLoaded", () => {
  window.RTApp.init();
});
