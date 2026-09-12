window.RTHero = (function () {
  let scene, camera, renderer;
  let phoneA, phoneB;
  let animFrameId = null;
  let isInitialized = false;
  let isActive = false;
  let mouseX = 0, mouseY = 0;
  let targetRotationX = 0, targetRotationY = 0;

  function init() {
    const container = document.getElementById("s1-canvas-container");
    const canvas = document.getElementById("hero3d-canvas");
    if (!container || !canvas || typeof THREE === "undefined") {
      fallbackToCSS();
      return;
    }

    try {
      scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x050806, 0.08);

      const width = container.clientWidth;
      const height = container.clientHeight;

      camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
      camera.position.set(0, 0, 8.6);
      camera.lookAt(0.5, 0, 0);

      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const greenPointLight = new THREE.PointLight(0x43E19A, 2.5, 12);
      greenPointLight.position.set(2, 2, 4);
      scene.add(greenPointLight);

      const fillLight = new THREE.DirectionalLight(0x38BDF8, 0.8);
      fillLight.position.set(-4, -2, 2);
      scene.add(fillLight);

      // Create Phones
      phoneA = createPhoneMesh("ROUND 02 · SYSTEM DESIGN", "Maya · Scalability Probe", 0x43E19A);
      phoneA.position.set(1.2, 0.4, 0);
      phoneA.rotation.set(0.1, -0.25, 0.05);
      scene.add(phoneA);

      phoneB = createPhoneMesh("ROUND 04 · AI ENGINEERING", "Priya · RAG Evaluation", 0xA855F7);
      phoneB.position.set(2.8, -0.4, -0.6);
      phoneB.rotation.set(-0.1, -0.35, -0.05);
      scene.add(phoneB);

      // Floating Particles
      const particleGeo = new THREE.BufferGeometry();
      const particleCount = 120;
      const posArray = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 12;
      }
      particleGeo.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
      const particleMat = new THREE.PointsMaterial({
        size: 0.03,
        color: 0x43E19A,
        transparent: true,
        opacity: 0.4
      });
      const particles = new THREE.Points(particleGeo, particleMat);
      scene.add(particles);

      // Mouse Parallax Listener
      window.addEventListener("mousemove", (e) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 0.4;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 0.4;
      });

      isInitialized = true;
      setActive(true);
    } catch (err) {
      console.warn("Three.js init failed, falling back to CSS:", err);
      fallbackToCSS();
    }
  }

  function createPhoneMesh(titleText, subText, accentColor) {
    const group = new THREE.Group();

    // Body Geometry (Extruded Rounded Rectangle)
    const shape = new THREE.Shape();
    const w = 1.4, h = 2.8, r = 0.2;
    shape.moveTo(-w / 2 + r, -h / 2);
    shape.lineTo(w / 2 - r, -h / 2);
    shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    shape.lineTo(w / 2, h / 2 - r);
    shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    shape.lineTo(-w / 2 + r, h / 2);
    shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    shape.lineTo(-w / 2, -h / 2 + r);
    shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);

    const extrudeSettings = { depth: 0.1, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.02, bevelThickness: 0.02 };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x0c1611,
      metalness: 0.8,
      roughness: 0.2
    });

    const mesh = new THREE.Mesh(geometry, bodyMaterial);
    group.add(mesh);

    // Dynamic Canvas Texture for Screen
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#050806";
    ctx.fillRect(0, 0, 256, 512);
    ctx.fillStyle = "#0c1611";
    ctx.fillRect(10, 10, 236, 492);

    ctx.fillStyle = "#43E19A";
    ctx.font = "bold 14px monospace";
    ctx.fillText(titleText, 20, 40);

    ctx.fillStyle = "#E8F5EE";
    ctx.font = "12px sans-serif";
    ctx.fillText(subText, 20, 70);

    // Waveform simulation
    ctx.strokeStyle = "#43E19A";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 20; x < 236; x += 10) {
      ctx.lineTo(x, 120 + Math.sin(x * 0.1) * 15);
    }
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    const screenGeo = new THREE.PlaneGeometry(1.36, 2.76);
    const screenMat = new THREE.MeshBasicMaterial({ map: texture });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.z = 0.06;
    group.add(screenMesh);

    return group;
  }

  function animate(time) {
    if (!isActive || !isInitialized) return;

    time *= 0.001;

    // Floating Sine Motion
    if (phoneA) {
      phoneA.position.y = 0.4 + Math.sin(time * 1.5) * 0.08;
      phoneA.rotation.y = -0.25 + mouseX * 0.5;
      phoneA.rotation.x = 0.1 + mouseY * 0.5;
    }
    if (phoneB) {
      phoneB.position.y = -0.4 + Math.sin(time * 1.5 + 1) * 0.08;
      phoneB.rotation.y = -0.35 + mouseX * 0.4;
      phoneB.rotation.x = -0.1 + mouseY * 0.4;
    }

    renderer.render(scene, camera);
    animFrameId = requestAnimationFrame(animate);
  }

  function setActive(active) {
    isActive = active;
    if (isActive && isInitialized) {
      if (!animFrameId) animFrameId = requestAnimationFrame(animate);
    } else if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
  }

  function fallbackToCSS() {
    document.documentElement.classList.add("no3d");
  }

  return {
    init: init,
    setActive: setActive
  };
})();
