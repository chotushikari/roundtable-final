window.RTInterview = (function () {
  let activePersonaId = "maya";
  let autoRunTimer = null;
  let animFrameId = null;
  let isWaveformRunning = false;

  function init() {
    setupSeats();
    setupWaveform();
    activatePersona("maya", false);
  }

  function setupSeats() {
    const seats = document.querySelectorAll(".seat-avatar");
    seats.forEach((seat) => {
      seat.addEventListener("click", () => {
        const personaId = seat.dataset.persona;
        if (personaId) {
          stopAutoRun();
          activatePersona(personaId, true);
        }
      });
    });

    const autoBtn = document.getElementById("hud-auto-run-btn");
    if (autoBtn) {
      autoBtn.addEventListener("click", toggleAutoRun);
    }
  }

  function activatePersona(id, shouldSpeak) {
    const persona = window.RT_DATA.personas[id];
    if (!persona) return;

    activePersonaId = id;

    // Update Seat Active Rings
    document.querySelectorAll(".seat-avatar").forEach((seat) => {
      if (seat.dataset.persona === id) {
        seat.classList.add("active");
        seat.style.borderColor = persona.color;
        seat.style.boxShadow = `0 0 16px ${persona.color}`;
      } else {
        seat.classList.remove("active");
        seat.style.borderColor = "var(--line)";
        seat.style.boxShadow = "none";
      }
    });

    // Update Question Speech Bubble
    const bubble = document.getElementById("hud-speech-bubble");
    if (bubble) {
      bubble.style.borderColor = persona.color;
      bubble.innerHTML = `<strong style="color: ${persona.color}">${persona.name} (${persona.role}):</strong> "${persona.signature}"`;
    }

    // Speak Voice via SpeechSynthesis
    if (shouldSpeak && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(persona.signature);
      utterance.pitch = persona.synth.pitch;
      utterance.rate = persona.synth.rate;

      // Select en-IN or fallback voice
      const voices = window.speechSynthesis.getVoices();
      const inVoice = voices.find((v) => v.lang.includes("en-IN") || v.lang.includes("en"));
      if (inVoice) utterance.voice = inVoice;

      window.speechSynthesis.speak(utterance);
    }

    // Trigger Waveform Pulse
    startWaveformPulse();

    // Push Evidence Item
    pushRandomEvidence(persona);
  }

  function pushRandomEvidence(persona) {
    const stream = document.getElementById("hud-evidence-stream");
    if (!stream) return;

    const item = document.createElement("div");
    item.className = "evidence-item-row";
    item.style.cssText = "padding: 8px 12px; border-bottom: 1px solid var(--line); font-size: 11px; display: flex; justify-content: space-between; align-items: center; animation: fadeIn 0.3s ease;";
    item.innerHTML = `
      <span><strong style="color: ${persona.color}">[${persona.name}]</strong> ${persona.quip}</span>
      <span class="badge-tag" style="font-size: 9px;">TRACED</span>
    `;

    stream.insertBefore(item, stream.firstChild);
    if (stream.children.length > 5) {
      stream.removeChild(stream.lastChild);
    }
  }

  function setupWaveform() {
    const canvas = document.getElementById("hud-waveform-canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let phase = 0;

    function renderWaveform() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "#43E19A";
      ctx.lineWidth = 2;
      ctx.beginPath();

      const amplitude = isWaveformRunning ? 12 : 2;
      for (let x = 0; x < canvas.width; x += 4) {
        const y = canvas.height / 2 + Math.sin(x * 0.08 + phase) * amplitude * Math.sin(x * 0.02);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      phase += 0.15;

      animFrameId = requestAnimationFrame(renderWaveform);
    }

    renderWaveform();
  }

  function startWaveformPulse() {
    isWaveformRunning = true;
    setTimeout(() => {
      isWaveformRunning = false;
    }, 2500);
  }

  function toggleAutoRun() {
    const btn = document.getElementById("hud-auto-run-btn");
    if (autoRunTimer) {
      stopAutoRun();
      if (btn) btn.innerText = "AUTO-RUN";
    } else {
      if (btn) btn.innerText = "STOP AUTO";
      let keys = Object.keys(window.RT_DATA.personas);
      let idx = 0;
      autoRunTimer = setInterval(() => {
        idx = (idx + 1) % keys.length;
        activatePersona(keys[idx], true);
      }, 4200);
    }
  }

  function stopAutoRun() {
    if (autoRunTimer) {
      clearInterval(autoRunTimer);
      autoRunTimer = null;
      const btn = document.getElementById("hud-auto-run-btn");
      if (btn) btn.innerText = "AUTO-RUN";
    }
  }

  return {
    init: init,
    activatePersona: activatePersona,
    stopAutoRun: stopAutoRun
  };
})();
