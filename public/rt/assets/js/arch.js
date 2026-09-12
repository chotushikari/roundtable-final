window.RTArch = (function () {
  let isPacketRunning = false;

  function init() {
    setupNodeInspectors();
    setupPacketRunner();
    selectNode("node_agora_rtc");
  }

  function setupNodeInspectors() {
    const nodes = document.querySelectorAll(".arch-node");
    nodes.forEach((node) => {
      node.addEventListener("click", () => {
        const nodeId = node.id;
        if (nodeId) selectNode(nodeId);
      });
    });
  }

  function selectNode(nodeId) {
    const data = window.RT_DATA.archNodes[nodeId];
    if (!data) return;

    const drawer = document.getElementById("node-inspector-drawer");
    if (!drawer) return;

    drawer.classList.add("active");
    drawer.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--line); padding-bottom: 8px;">
        <span class="badge-tag" style="font-size: 10px;">${data.band}</span>
        <button onclick="document.getElementById('node-inspector-drawer').classList.remove('active')" style="background:none; border:none; color:var(--dim); cursor:pointer;">✕</button>
      </div>
      <h3 style="font-family: var(--font-display); font-size: 16px; color: var(--signal); margin-top: 8px;">${data.name}</h3>
      <div style="font-size: 12px; display: flex; flex-direction: column; gap: 8px; margin-top: 12px;">
        <div><strong style="color: var(--ink);">RESPONSIBILITY:</strong> <p style="color: var(--dim);">${data.resp}</p></div>
        <div><strong style="color: var(--ink);">INPUT:</strong> <p style="color: var(--dim);">${data.input}</p></div>
        <div><strong style="color: var(--ink);">OUTPUT:</strong> <p style="color: var(--dim);">${data.output}</p></div>
        <div><strong style="color: var(--signal);">WHY IT EXISTS:</strong> <p style="color: var(--dim);">${data.why}</p></div>
        <div><strong style="color: var(--amber);">SCALING NOTE:</strong> <p style="color: var(--dim);">${data.scaling}</p></div>
        <div><strong style="color: #F97316;">FAILURE BOUNDARY:</strong> <p style="color: var(--dim);">${data.failure}</p></div>
      </div>
    `;

    // Highlight selected SVG node
    document.querySelectorAll(".arch-node rect").forEach((rect) => {
      rect.setAttribute("stroke", "rgba(232, 245, 238, 0.2)");
      rect.setAttribute("stroke-width", "1");
    });
    const activeRect = document.querySelector(`#${nodeId} rect`);
    if (activeRect) {
      activeRect.setAttribute("stroke", "#43E19A");
      activeRect.setAttribute("stroke-width", "2");
    }
  }

  function setupPacketRunner() {
    const btn = document.getElementById("arch-run-packet-btn");
    if (btn) {
      btn.addEventListener("click", runPacketAnimation);
    }
  }

  function runPacketAnimation() {
    if (isPacketRunning) return;
    isPacketRunning = true;

    const packet = document.getElementById("arch-svg-packet");
    if (!packet || typeof gsap === "undefined") {
      isPacketRunning = false;
      return;
    }

    const pathSequence = [
      "node_candidate_app",
      "node_agora_rtc",
      "node_orchestrator",
      "node_engines",
      "node_evidence_ledger",
      "node_supabase",
      "node_human_decision"
    ];

    let tl = gsap.timeline({
      onComplete: () => {
        isPacketRunning = false;
        packet.style.opacity = "0";
      }
    });

    packet.style.opacity = "1";

    pathSequence.forEach((nodeId, idx) => {
      const nodeEl = document.getElementById(nodeId);
      if (nodeEl) {
        const rect = nodeEl.querySelector("rect");
        const x = parseFloat(rect.getAttribute("x")) + parseFloat(rect.getAttribute("width")) / 2;
        const y = parseFloat(rect.getAttribute("y")) + parseFloat(rect.getAttribute("height")) / 2;

        tl.to(packet, {
          attr: { cx: x, cy: y },
          duration: 0.6,
          ease: "power2.inOut",
          onStart: () => {
            selectNode(nodeId);
          }
        });
      }
    });
  }

  return {
    init: init,
    selectNode: selectNode,
    runPacketAnimation: runPacketAnimation
  };
})();
