'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import { animate } from 'animejs';
import * as THREE from 'three';
import {
  ArrowRight,
  ArrowLeft,
  Volume2,
  RotateCcw,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InteractiveInterviewMock } from './InteractiveInterviewMock';
import styles from './RoundTableExperience.module.css';

const VoiceDemo = dynamic(() => import('./LandingPage'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[16rem] items-center justify-center text-xs text-[#737373]">
      Initializing Agora voice session...
    </div>
  ),
});

const ROTATING_WORDS = [
  'engineers',
  'finance leaders',
  'sales executives',
  'customer partners',
  'people leaders',
  'problem solvers',
];

const ROLES = [
  { label: 'Hiring Manager' },
  { label: 'Technical' },
  { label: 'Product' },
  { label: 'Customer' },
  { label: 'Behavioural' },
];

type SceneState = {
  setPointer: (x: number, y: number) => void;
  setHappy: (happy: boolean) => void;
  setActiveRoleIndex: (index: number) => void;
  destroy: () => void;
};

function smoothstep(start: number, end: number, value: number) {
  const x = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return x * x * (3 - 2 * x);
}

function createArtifact(
  canvas: HTMLCanvasElement,
  progressRef: MutableRefObject<number>,
  roleButtonsRef: MutableRefObject<(HTMLButtonElement | null)[]>,
  anchorsRef: MutableRefObject<(HTMLDivElement | null)[]>,
  onSelectRole?: (index: number) => void,
  onCompanionClick?: () => void,
): SceneState {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0, 9.5);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));

  const root = new THREE.Group();
  scene.add(root);

  // Central geometric wireframe core in Supabase grey-green
  const coreWireMaterial = new THREE.MeshBasicMaterial({
    color: 0x737373,
    wireframe: true,
    transparent: true,
    opacity: 0.85,
  });
  const coreGlowMaterial = new THREE.MeshBasicMaterial({
    color: 0x3ecf8e,
    transparent: true,
    opacity: 0.16,
  });
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x3ecf8e,
    transparent: true,
    opacity: 0,
  });

  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 2), coreWireMaterial);
  const coreGlow = new THREE.Mesh(new THREE.IcosahedronGeometry(0.96, 2), coreGlowMaterial);
  root.add(core, coreGlow);

  // 1. Equatorial inner ring (level horizontal plane)
  const ringA = new THREE.Mesh(
    new THREE.TorusGeometry(1.52, 0.012, 8, 96),
    new THREE.MeshBasicMaterial({ color: 0x5a5a5a, transparent: true, opacity: 0.45 }),
  );
  ringA.rotation.x = Math.PI / 2;
  root.add(ringA);

  // 2. Saturn ring system with authentic dramatic tilt (~28 degrees diagonally across sphere)
  const saturnRingGroup = new THREE.Group();
  saturnRingGroup.rotation.set(0.44, 0.15, -0.52);
  root.add(saturnRingGroup);

  const ringB = new THREE.Mesh(
    new THREE.TorusGeometry(2.02, 0.018, 8, 120),
    new THREE.MeshBasicMaterial({ color: 0x3ecf8e, transparent: true, opacity: 0.8 }),
  );
  ringB.rotation.x = Math.PI / 2;
  saturnRingGroup.add(ringB);

  const ringC = new THREE.Mesh(
    new THREE.TorusGeometry(1.86, 0.009, 8, 120),
    new THREE.MeshBasicMaterial({ color: 0x24b47e, transparent: true, opacity: 0.45 }),
  );
  ringC.rotation.x = Math.PI / 2;
  saturnRingGroup.add(ringC);

  // 5 Role Satellites (harmonious pentagonal constellation)
  const orbitTargets = [
    new THREE.Vector3(0, 2.15, 0),        // 0: Hiring Manager (top, 12:00)
    new THREE.Vector3(2.10, 0.70, 0),     // 1: Technical (top-right, ~2:15)
    new THREE.Vector3(1.45, -1.75, 0),    // 2: Product (bottom-right, ~4:45)
    new THREE.Vector3(-1.45, -1.75, 0),   // 3: Customer (bottom-left, ~7:15)
    new THREE.Vector3(-2.10, 0.70, 0),    // 4: Behavioural (top-left, ~9:45)
  ];

  const satellites = orbitTargets.map((_, index) => {
    const mesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.35, 1),
      new THREE.MeshBasicMaterial({
        color: index === 1 ? 0x3ecf8e : 0x737373,
        wireframe: true,
        transparent: true,
        opacity: 0,
      }),
    );
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(),
      new THREE.Vector3(),
    ]);
    const line = new THREE.Line(geometry, lineMaterial.clone());
    root.add(line, mesh);
    return { mesh, line };
  });

  // Companion 3D Face (Page 3)
  const face = new THREE.Group();
  face.visible = false;
  root.add(face);

  const faceShellMaterial = new THREE.MeshBasicMaterial({ color: 0x12271f, transparent: true, opacity: 0 });
  const faceOutlineMaterial = new THREE.MeshBasicMaterial({ color: 0x525252, wireframe: true, transparent: true, opacity: 0 });
  const faceShell = new THREE.Mesh(
    new THREE.SphereGeometry(1.22, 48, 48),
    faceShellMaterial,
  );
  const faceOutline = new THREE.Mesh(
    new THREE.SphereGeometry(1.24, 16, 12),
    faceOutlineMaterial,
  );
  face.add(faceShell, faceOutline);

  const eyeWhiteMaterial = new THREE.MeshBasicMaterial({ color: 0xededed, transparent: true, opacity: 0 });
  const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x071810, transparent: true, opacity: 0 });
  const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.165, 24, 24), eyeWhiteMaterial);
  const rightEye = leftEye.clone();
  leftEye.scale.set(0.88, 1.08, 0.82);
  rightEye.scale.copy(leftEye.scale);
  leftEye.position.set(-0.36, 0.24, 1.06);
  rightEye.position.set(0.36, 0.24, 1.06);

  const leftPupil = new THREE.Mesh(new THREE.SphereGeometry(0.075, 18, 18), pupilMaterial);
  const rightPupil = leftPupil.clone();
  leftPupil.position.set(-0.36, 0.24, 1.21);
  rightPupil.position.set(0.36, 0.24, 1.21);

  const eyeHighlightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
  const leftHighlight = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 12), eyeHighlightMaterial);
  const rightHighlight = leftHighlight.clone();
  leftHighlight.position.set(-0.377, 0.265, 1.25);
  rightHighlight.position.set(0.343, 0.265, 1.25);

  const noseMaterial = new THREE.MeshBasicMaterial({ color: 0x3ecf8e, transparent: true, opacity: 0 });
  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.088, 0.25, 16),
    noseMaterial,
  );
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, -0.02, 1.22);

  const mouthCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-0.38, -0.42, 1.1),
    new THREE.Vector3(0, -0.58, 1.22),
    new THREE.Vector3(0.38, -0.42, 1.1),
  );
  const mouthGeometry = new THREE.TubeGeometry(mouthCurve, 24, 0.026, 8, false);
  const mouthMaterial = new THREE.MeshBasicMaterial({ color: 0xd4d4d4, transparent: true, opacity: 0 });
  const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
  face.add(leftEye, rightEye, leftPupil, rightPupil, leftHighlight, rightHighlight, nose, mouth);

  let pointerPixelX = typeof window !== 'undefined' ? window.innerWidth * 0.25 : 0;
  let pointerPixelY = typeof window !== 'undefined' ? window.innerHeight * 0.5 : 0;
  let smoothGazeX = 0;
  let smoothGazeY = 0;
  let happy = false;
  let activeRoleIndex = 0;
  let frame = 0;

  const onWindowPointerMove = (e: MouseEvent) => {
    pointerPixelX = e.clientX;
    pointerPixelY = e.clientY;
  };
  window.addEventListener('pointermove', onWindowPointerMove);

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
    camera.aspect = Math.max(1, rect.width) / Math.max(1, rect.height);
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  const render = (time: number) => {
    // Synchronize directly with current smooth scroll progress (0.0 to 2.0)
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) time = 0;
    const p = Math.max(0, Math.min(2, progressRef.current));
    const isDesktop = window.innerWidth > 960;

    if (p <= 1.0) {
      // ====================================================================
      // STAGE 1 -> STAGE 2: Hero Core to 5-Role Constellation (Real-time Scrub)
      // ====================================================================
      const t = p;
      const s = smoothstep(0, 1, t);

      // Smooth horizontal and vertical trajectory
      const startX = 0;
      const startY = 0;
      const endX = isDesktop ? -3.35 : 0;
      const endY = isDesktop ? -0.68 : -0.5;

      root.position.x = startX * (1 - s) + endX * s;
      root.position.y = startY * (1 - s) + endY * s;
      root.scale.setScalar(1.0 - s * 0.35);

      // Core wireframe and glowing nucleus
      core.visible = true;
      coreGlow.visible = true;
      ringA.visible = true;
      saturnRingGroup.visible = true;
      coreWireMaterial.opacity = 0.38 + s * 0.22;

      core.scale.setScalar(1.0 - s * 0.45);
      core.rotation.x = 0;
      core.rotation.z = 0;
      core.rotation.y = time * 0.00025 + p * Math.PI * 1.5;

      ringA.scale.setScalar(1.0 + s * 0.32);
      saturnRingGroup.scale.setScalar(1.0 + s * 0.32);
      ringA.rotation.z = time * 0.00012;
      ringB.rotation.z = -time * 0.00022;
      ringC.rotation.z = -time * 0.00022;

      // 5 Role satellites blossoming outward seamlessly
      const bloom = smoothstep(0.06, 0.94, t);
      satellites.forEach(({ mesh, line }, index) => {
        mesh.visible = bloom > 0.002;
        line.visible = bloom > 0.002;
        const isSelected = index === activeRoleIndex;
        const target = orbitTargets[index];
        mesh.position.copy(target).multiplyScalar(bloom);
        mesh.scale.setScalar(Math.max(0.001, bloom) * (isSelected ? 1.25 : 1.0));
        mesh.rotation.x = time * 0.0003 + index;
        mesh.rotation.y = time * 0.00022 + index * 0.4;
        (mesh.material as THREE.MeshBasicMaterial).opacity = bloom;
        (mesh.material as THREE.MeshBasicMaterial).color.setHex(isSelected ? 0x3ecf8e : 0x737373);

        const positions = line.geometry.attributes.position as THREE.BufferAttribute;
        positions.setXYZ(0, 0, 0, 0);
        positions.setXYZ(1, mesh.position.x, mesh.position.y, mesh.position.z);
        positions.needsUpdate = true;
        (line.material as THREE.LineBasicMaterial).opacity = bloom * 0.6;
      });

      // Face is completely inactive in Stage 1 & 2
      face.visible = false;
    } else {
      // ====================================================================
      // STAGE 2 -> STAGE 3: 5-Role Constellation to Agora Companion (Real-time Scrub)
      // ====================================================================
      const t2 = p - 1.0;
      const s2 = smoothstep(0, 1, t2);

      const startX = isDesktop ? -3.35 : 0;
      const startY = isDesktop ? -0.68 : -0.5;
      const endX = isDesktop ? -2.85 : 0;
      const endY = isDesktop ? -0.05 : 0.5;

      root.position.x = startX * (1 - s2) + endX * s2;
      root.position.y = startY * (1 - s2) + endY * s2;

      // Satellites fold and retract seamlessly into the nucleus as Page 2 exits
      const fold = Math.max(0, 1.0 - smoothstep(0.0, 0.45, t2));
      satellites.forEach(({ mesh, line }, index) => {
        mesh.visible = fold > 0.002;
        line.visible = fold > 0.002;
        const isSelected = index === activeRoleIndex;
        const target = orbitTargets[index];
        mesh.position.copy(target).multiplyScalar(fold);
        mesh.scale.setScalar(Math.max(0.001, fold) * (isSelected ? 1.25 : 1.0));
        mesh.rotation.x = time * 0.0003 + index;
        mesh.rotation.y = time * 0.00022 + index * 0.4;
        (mesh.material as THREE.MeshBasicMaterial).opacity = fold;

        const positions = line.geometry.attributes.position as THREE.BufferAttribute;
        positions.setXYZ(0, 0, 0, 0);
        positions.setXYZ(1, mesh.position.x, mesh.position.y, mesh.position.z);
        positions.needsUpdate = true;
        (line.material as THREE.LineBasicMaterial).opacity = fold * 0.6;
      });

      // Core wireframe dissolves seamlessly
      const coreFade = Math.max(0, 1.0 - smoothstep(0.12, 0.52, t2));
      core.visible = coreFade > 0.02;
      coreGlow.visible = core.visible;
      ringA.visible = core.visible;
      saturnRingGroup.visible = core.visible;
      coreWireMaterial.opacity = 0.85 * coreFade;
      core.rotation.y = time * 0.00025 + p * Math.PI * 1.5;

      ringA.scale.setScalar((1.0 + 0.32) * (1 - s2 * 0.7));
      saturnRingGroup.scale.setScalar((1.0 + 0.32) * (1 - s2 * 0.7));
      ringA.rotation.z = time * 0.00012;
      ringB.rotation.z = -time * 0.00022;
      ringC.rotation.z = -time * 0.00022;

      // Companion 3D face emerges smoothly with simultaneous opacity & scale
      const faceAmount = smoothstep(0.28, 0.85, t2);
      face.visible = faceAmount > 0.005;
      face.scale.setScalar(0.45 + faceAmount * 0.55);
      root.scale.setScalar(0.65 + faceAmount * 0.35);

      faceShellMaterial.opacity = faceAmount;
      faceOutlineMaterial.opacity = 0.16 * faceAmount;
      eyeWhiteMaterial.opacity = faceAmount;
      pupilMaterial.opacity = faceAmount;
      eyeHighlightMaterial.opacity = faceAmount;
      noseMaterial.opacity = faceAmount;
      mouthMaterial.opacity = faceAmount;

      // Compute companion screen position relative to viewport
      const companionRect = anchorsRef.current[2]?.getBoundingClientRect();
      const faceScreenX = companionRect ? companionRect.left + companionRect.width / 2 : window.innerWidth * 0.25;
      const faceScreenY = companionRect ? companionRect.top + companionRect.height / 2 : window.innerHeight * 0.5;

      // Vector from companion's eyes to cursor in screen pixels
      const deltaX = pointerPixelX - faceScreenX;
      const deltaY = pointerPixelY - faceScreenY;

      // Distance and normalized gaze angle relative to face
      const gazeDist = Math.hypot(deltaX, deltaY);
      const maxGazeRadius = Math.max(260, Math.min(window.innerWidth, window.innerHeight) * 0.38);
      const gazeIntensity = Math.min(1.0, gazeDist / maxGazeRadius);
      const gazeAngle = Math.atan2(deltaY, deltaX);

      const targetGazeX = Math.cos(gazeAngle) * gazeIntensity;
      const targetGazeY = -Math.sin(gazeAngle) * gazeIntensity;

      // Natural eye tracking with smooth pursuit damping
      const gazeEase = 0.14;
      smoothGazeX += (targetGazeX - smoothGazeX) * gazeEase;
      smoothGazeY += (targetGazeY - smoothGazeY) * gazeEase;

      // Subtle lifelike micro-movement when looking around
      const microX = !reducedMotion ? Math.sin(time * 0.0016) * 0.0025 : 0;
      const microY = !reducedMotion ? Math.cos(time * 0.0022) * 0.002 : 0;
      const effGazeX = Math.max(-1, Math.min(1, smoothGazeX + microX));
      const effGazeY = Math.max(-1, Math.min(1, smoothGazeY + microY));

      const pupilDx = effGazeX * 0.045;
      const pupilDy = effGazeY * 0.032;
      // Spherical depth contouring: as pupil moves toward edges, it curves along the eye sphere
      const pupilDz = -(pupilDx * pupilDx + pupilDy * pupilDy) * 1.6;

      leftPupil.position.set(-0.36 + pupilDx, 0.24 + pupilDy, 1.21 + pupilDz);
      rightPupil.position.set(0.36 + pupilDx, 0.24 + pupilDy, 1.21 + pupilDz);

      // Specular highlight parallax (moves slightly less than pupil to simulate glossy 3D cornea)
      const hlDx = pupilDx * 0.68;
      const hlDy = pupilDy * 0.68;
      leftHighlight.position.set(-0.377 + hlDx, 0.265 + hlDy, 1.25);
      rightHighlight.position.set(0.343 + hlDx, 0.265 + hlDy, 1.25);

      // Happy reaction animation
      mouth.scale.y += ((happy ? 1.4 : 1) - mouth.scale.y) * 0.12;
      mouth.position.y += ((happy ? 0.03 : 0) - mouth.position.y) * 0.12;
      face.position.y = happy ? Math.sin(time * 0.004) * 0.025 : 0;
      const blinkPhase = time % 5200;
      const blink = !reducedMotion && blinkPhase > 5000 ? Math.max(0.12, Math.abs(blinkPhase - 5100) / 100) : 1;
      leftEye.scale.y = rightEye.scale.y = 1.08 * blink;
      leftPupil.scale.y = rightPupil.scale.y = blink;
      leftHighlight.scale.y = rightHighlight.scale.y = blink;
    }

    // Fit the persistent artifact to layout slots on the shared stage.
    const worldHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    const stage = Math.min(1, Math.floor(p));
    const blend = smoothstep(0, 1, p - stage);
    const anchorPose = (index: number) => {
      const rect = anchorsRef.current[index]?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0, scale: 1 };
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const diameter = index === 0 ? 3.8 : index === 1 ? 5.5 : 2.9;
      return {
        x: (centerX / canvas.clientWidth - 0.5) * worldHeight * camera.aspect,
        y: (0.5 - centerY / canvas.clientHeight) * worldHeight,
        scale: Math.min(rect.width, rect.height) / canvas.clientHeight * worldHeight / diameter,
      };
    };
    const from = anchorPose(stage);
    const to = anchorPose(stage + 1);
    root.position.set(THREE.MathUtils.lerp(from.x, to.x, blend), THREE.MathUtils.lerp(from.y, to.y, blend), 0);
    root.scale.setScalar(THREE.MathUtils.lerp(from.scale, to.scale, blend));
    if (face.visible) {
      const cameraYaw = Math.atan2(camera.position.x - root.position.x, camera.position.z);
      face.rotation.y = cameraYaw + smoothGazeX * 0.16;
      face.rotation.x = -smoothGazeY * 0.12;
    }
    scene.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);

    // Project 3D satellite positions to HTML role badges
    if (roleButtonsRef.current && roleButtonsRef.current.length > 0) {
      const isVisible = isDesktop && p > 0.05 && p < 1.45;
      const badgeOpacity =
        p <= 1.0
          ? smoothstep(0.12, 0.88, p)
          : Math.max(0, 1.0 - smoothstep(0.0, 0.35, p - 1.0));

      const tempVec = new THREE.Vector3();
      satellites.forEach(({ mesh }, index) => {
        const btn = roleButtonsRef.current[index];
        if (!btn) return;

        if (!isVisible || badgeOpacity < 0.01) {
          btn.style.opacity = '0';
          btn.style.pointerEvents = 'none';
          return;
        }

        mesh.getWorldPosition(tempVec);
        tempVec.project(camera);

        const screenX = (tempVec.x * 0.5 + 0.5) * window.innerWidth;
        const screenY = (-tempVec.y * 0.5 + 0.5) * window.innerHeight;

        let transX = '-50%';
        let transY = '-50%';
        let offX = 0;
        let offY = 0;

        if (index === 0) {
          // Hiring Manager (Top): centered right above sphere
          transX = '-50%';
          transY = '-100%';
          offX = 0;
          offY = -28;
        } else if (index === 1) {
          // Technical (Top-Right): to the right of sphere
          transX = '0';
          transY = '-50%';
          offX = 28;
          offY = -4;
        } else if (index === 2) {
          // Product (Bottom-Right): to the right of sphere
          transX = '0';
          transY = '-50%';
          offX = 28;
          offY = 4;
        } else if (index === 3) {
          // Customer (Bottom-Left): to the left of sphere
          transX = '-100%';
          transY = '-50%';
          offX = -28;
          offY = 4;
        } else if (index === 4) {
          // Behavioural (Top-Left): to the left of sphere
          transX = '-100%';
          transY = '-50%';
          offX = -28;
          offY = -4;
        }

        btn.style.left = `${Math.round(screenX + offX)}px`;
        btn.style.top = `${Math.round(screenY + offY)}px`;
        btn.style.transform = `translate3d(${transX}, ${transY}, 0)`;
        btn.style.opacity = String(badgeOpacity);
        btn.style.pointerEvents = badgeOpacity > 0.6 ? 'auto' : 'none';
      });
    }

    renderer.render(scene, camera);
    frame = requestAnimationFrame(render);
  };
  frame = requestAnimationFrame(render);

  const raycaster = new THREE.Raycaster();
  const pointerPos = new THREE.Vector2();

  const handlePointerClick = (e: MouseEvent) => {
    const p = progressRef.current;
    if (p > 1.65 && face.visible) {
      pointerPos.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointerPos.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(pointerPos, camera);
      const hits = raycaster.intersectObjects([faceShell, leftEye, rightEye, nose, mouth], true);
      if (hits.length > 0) {
        onCompanionClick?.();
      }
      return;
    }
    if (p < 0.35 || p > 1.65) return;
    pointerPos.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointerPos.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointerPos, camera);
    const meshes = satellites.map((s) => s.mesh);
    const hits = raycaster.intersectObjects(meshes, true);
    if (hits.length > 0) {
      const topObj = hits[0].object;
      const idx = satellites.findIndex(
        (s) => s.mesh === topObj || s.mesh.children.includes(topObj),
      );
      if (idx !== -1 && onSelectRole) {
        onSelectRole(idx);
      }
    }
  };
  window.addEventListener('click', handlePointerClick);

  return {
    setPointer(x, y) {
      pointerPixelX = x;
      pointerPixelY = y;
    },
    setHappy(value) {
      happy = value;
    },
    setActiveRoleIndex(index: number) {
      activeRoleIndex = index;
    },
    destroy() {
      cancelAnimationFrame(frame);
      window.removeEventListener('click', handlePointerClick);
      window.removeEventListener('pointermove', onWindowPointerMove);
      observer.disconnect();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          object.geometry.dispose();
          const material = object.material;
          if (Array.isArray(material)) material.forEach((item) => item.dispose());
          else material?.dispose();
        }
      });
      renderer.dispose();
    },
  };
}

export function RoundTableExperience() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const anchorsRef = useRef<(HTMLDivElement | null)[]>([]);
  const voiceBusyRef = useRef(false);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const rotatingWordRef = useRef<HTMLSpanElement>(null);
  const companionButtonRef = useRef<HTMLButtonElement>(null);
  const roleButtonsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const progressRef = useRef(0);
  const sceneRef = useRef<SceneState | null>(null);

  const virtualTargetRef = useRef(0);
  const virtualCurrentRef = useRef(0);

  const [activeScreen, setActiveScreen] = useState<0 | 1 | 2>(0);
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const [companionHappy, setCompanionHappy] = useState(false);
  const [companionStartSignal, setCompanionStartSignal] = useState(0);
  const [candidateDialogOpen, setCandidateDialogOpen] = useState(false);
  const [candidateLink, setCandidateLink] = useState('');
  const [candidateLinkError, setCandidateLinkError] = useState('');
  const [candidateJoining, setCandidateJoining] = useState(false);
  const onSampleActivity = useCallback((active: boolean) => {
    voiceBusyRef.current = active;
    setVoiceBusy(active);
    if (active) virtualCurrentRef.current = virtualTargetRef.current = 1200;
  }, []);
  const onCompanionActivity = useCallback((active: boolean) => {
    voiceBusyRef.current = active;
    setVoiceBusy(active);
    setCompanionHappy(active);
    sceneRef.current?.setHappy(active);
    if (active) virtualCurrentRef.current = virtualTargetRef.current = 2400;
  }, []);

  // Two continuous transitions, without a dead-scroll plateau between them.
  const TOTAL_SCROLL = 2400;

  const handleRoleSelect = useCallback((index: number) => {
    setSelectedRoleIndex(index);
    sceneRef.current?.setActiveRoleIndex(index);
  }, []);

  const activateCompanionRef = useRef<() => void>(() => {});

  // Initialize 3D Canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    sceneRef.current = createArtifact(
      canvasRef.current,
      progressRef,
      roleButtonsRef,
      anchorsRef,
      handleRoleSelect,
      () => activateCompanionRef.current(),
    );
    return () => sceneRef.current?.destroy();
  }, [handleRoleSelect]);

  // Cycling animated tagline words via Anime.js
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = setInterval(() => {
      if (rotatingWordRef.current) {
        animate(rotatingWordRef.current, {
          opacity: [1, 0],
          translateY: [0, -16],
          duration: 320,
          ease: 'in(2)',
          onComplete: () => {
            setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
            if (rotatingWordRef.current) {
              animate(rotatingWordRef.current, {
                opacity: [0, 1],
                translateY: [16, 0],
                duration: 400,
                ease: 'out(3)',
              });
            }
          },
        });
      } else {
        setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  // Reduced-Speed Continuous Scrub Controller with Real-time 3D Sync & Page 2 Dwell
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    let rafId: number;
    let lastFrame = 0;
    const screens = Array.from(viewport.querySelectorAll<HTMLElement>("section[data-scene]"));

    const handleScrollDelta = (delta: number) => {
      // Reduced scrolling: dampen delta so scrolling feels substantial, luxurious, and scrubbable
      if (voiceBusyRef.current) return;
      const dampening = 0.65;
      virtualTargetRef.current = Math.max(
        0,
        Math.min(TOTAL_SCROLL, virtualTargetRef.current + delta * dampening),
      );
    };

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || window.innerWidth <= 960) return;
      // Allow internal scrolling on elements marked with data-internal-scroll
      const target = e.target as HTMLElement | null;
      if (target && target.closest('[data-internal-scroll="true"]')) {
        return;
      }

      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) || Math.abs(e.deltaX) > 0) {
        e.preventDefault();
        const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
        const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
        handleScrollDelta(Math.max(-240, Math.min(240, delta * unit)));
      }
    };

    // Touch swipe support on mobile / tablet
    let touchStartX = 0;
    let touchStartY = 0;

    const onTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest('[data-internal-scroll="true"]')) return;
      if (e.touches.length > 0) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest('[data-internal-scroll="true"]')) return;
      if (e.touches.length === 0) return;
      const dx = touchStartX - e.touches[0].clientX;
      const dy = touchStartY - e.touches[0].clientY;
      if (window.innerWidth <= 960 && Math.abs(dy) >= Math.abs(dx)) return;
      const delta = Math.abs(dx) > Math.abs(dy) ? dx : dy;
      if (Math.abs(delta) > 5) {
        handleScrollDelta(delta * 0.9);
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };

    const onResize = () => {
      viewport.scrollLeft = 0;
    };

    const updateScroll = (now: number) => {
      const elapsed = lastFrame ? Math.min(64, now - lastFrame) : 16.67;
      lastFrame = now;
      const diff = virtualTargetRef.current - virtualCurrentRef.current;

      if (Math.abs(diff) > 0.05) {
        virtualCurrentRef.current += diff * (window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : 1 - Math.exp(-elapsed / 160));
      } else {
        virtualCurrentRef.current = virtualTargetRef.current;
      }

      const v = virtualCurrentRef.current;

      // One shared stage: no slide boundaries or dead scroll distance.
      const pageProgress = Math.max(0, Math.min(2, v / (TOTAL_SCROLL / 2)));
      screens.forEach((screen, index) => {
        const distance = Math.abs(pageProgress - index);
        const opacity = 1 - smoothstep(0.12, 0.64, distance);
        screen.style.opacity = String(opacity);
        screen.style.pointerEvents = distance < 0.5 ? 'auto' : 'none';
        screen.style.visibility = opacity < 0.001 ? 'hidden' : 'visible';
      });

      // Synchronize 3D scene progress in the exact same frame
      progressRef.current = pageProgress;

      // Active screen pill indicator
      const activeIdx = (pageProgress < 0.5 ? 0 : pageProgress < 1.5 ? 1 : 2) as 0 | 1 | 2;
      setActiveScreen(activeIdx);

      rafId = requestAnimationFrame(updateScroll);
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('resize', onResize);
    rafId = requestAnimationFrame(updateScroll);

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(rafId);
    };
  }, [TOTAL_SCROLL]);

  // Programmatic navigation (clicks on pills, arrows, or CTA buttons)
  const navigateToScreen = useCallback((targetScreen: 0 | 1 | 2) => {
    if (voiceBusyRef.current) return;
    if (targetScreen === 0) {
      virtualTargetRef.current = 0;
    } else if (targetScreen === 1) {
      virtualTargetRef.current = TOTAL_SCROLL / 2;
    } else {
      virtualTargetRef.current = TOTAL_SCROLL;
    }
  }, [TOTAL_SCROLL]);

  const scrollToPanel = useCallback(() => {
    navigateToScreen(1);
  }, [navigateToScreen]);

  const scrollToStart = useCallback(() => {
    navigateToScreen(0);
  }, [navigateToScreen]);

  const joinCandidateInterview = useCallback(() => {
    try {
      const url = new URL(candidateLink.trim(), window.location.origin);
      if (!/^\/interview\/[^/]+$/.test(url.pathname)) {
        throw new Error('Paste a valid RoundTable candidate interview link.');
      }
      setCandidateJoining(true);
      window.location.assign(url.toString());
    } catch (error) {
      setCandidateLinkError(error instanceof Error ? error.message : 'Paste a valid candidate interview link.');
    }
  }, [candidateLink]);

  // Pointer tracking for cursor-following companion eyes
  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = -((event.clientY / window.innerHeight) * 2 - 1);
    sceneRef.current?.setPointer(x, y);
  }, []);

  // Activate Companion voice and happy animation
  const activateCompanion = useCallback(() => {
    if (voiceBusyRef.current) return;
    setCompanionHappy(true);
    sceneRef.current?.setHappy(true);
    voiceBusyRef.current = true;
    setVoiceBusy(true);
    setCompanionStartSignal((signal) => signal + 1);
  }, []);
  activateCompanionRef.current = activateCompanion;

  // Keyboard arrow navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input, textarea, select, button, [contenteditable], [data-internal-scroll]")) return;
      if (e.key === 'ArrowRight' && activeScreen < 2) {
        navigateToScreen((activeScreen + 1) as 0 | 1 | 2);
      } else if (e.key === 'ArrowLeft' && activeScreen > 0) {
        navigateToScreen((activeScreen - 1) as 0 | 1 | 2);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeScreen, navigateToScreen]);

  return (
    <main className={styles.page} onPointerMove={handlePointerMove}>
      {/* Supabase Platform Ambient Glows & Grid */}
      <div className={styles.backgroundLayers} aria-hidden="true">
        <div className={styles.ambientGlow} />
        <div className={styles.gridPattern} />
      </div>
      <div className={styles.guidelines} aria-hidden="true" />

      {/* Centered Top Brand Header */}
      <div className={styles.brandHeader}>
        <span className={styles.brandDot} />
        <span>RoundTable AI</span>
      </div>

      {/* Fixed Background Three.js Canvas */}
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />

      {/* Horizontal Viewport (ZERO vertical movement) */}
      <div
        ref={viewportRef}
        className={styles.viewport}
        tabIndex={0}
        role="region"
        aria-label="Continuous RoundTable experience"
      >
        {/* ========================================================== */}
        {/* SCREEN 1: Hero                                             */}
        {/* ========================================================== */}
        <section
          className={styles.screen}
          data-scene="0"
          aria-label="RoundTable AI Hero"
          aria-hidden={activeScreen !== 0}
          inert={activeScreen !== 0}
        >
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              Hire the next generation of{' '}
              <span className={styles.wordContainer}>
                <span ref={rotatingWordRef} className={styles.rotatingWord}>
                  {ROTATING_WORDS[wordIndex]}
                </span>
              </span>
            </h1>
            <div ref={(el) => { anchorsRef.current[0] = el; }} className={styles.heroArtifactSlot} aria-hidden="true" />

            {/* Candidate & Interviewer Buttons */}
            <div className={styles.heroActions}>
              <Button
                className={styles.primaryBtn}
                onClick={() => { setCandidateDialogOpen(true); setCandidateLinkError(''); }}
                aria-label="Join an interview as a candidate"
              >
                Join as Candidate
              </Button>
              <Button asChild variant="outline" className={styles.secondaryBtn}>
                <Link href="/company">Login as Interviewer</Link>
              </Button>
            </div>
          </div>

          {activeScreen === 0 && (
            <button
              type="button"
              className={styles.scrollHorizontalCue}
              onClick={scrollToPanel}
              aria-label="Scroll to 5 roles and interview demo"
            >
              <span>Explore 5 roles</span>
              <ArrowRight size={13} />
            </button>
          )}
        </section>

        {/* ========================================================== */}
        {/* SCREEN 2: One candidate, 5 roles (Left) + Mock (Right)     */}
        {/* ========================================================== */}
        <section
          className={styles.screen}
          data-scene="1"
          aria-label="One candidate, 5 roles and interactive voice demo"
          aria-hidden={activeScreen !== 1}
          inert={activeScreen !== 1}
        >
          <div className={styles.panelContainer}>
            {/* Left side: Heading at top & 3D Constellation below */}
            <div className={styles.panelLeft}>
              <div className={styles.panelHeading}>
                <h2 className={styles.panelTitle}>One candidate, 5 roles.</h2>
              </div>

              <div ref={(el) => { anchorsRef.current[1] = el; }} className={styles.constellationSlot} aria-hidden="true" />
              <div className={styles.constellationMap} aria-label="Five AI Interviewer Roles">
                {ROLES.map((role, idx) => (
                  <button
                    key={role.label}
                    ref={(el) => {
                      roleButtonsRef.current[idx] = el;
                    }}
                    type="button"
                    onClick={() => handleRoleSelect(idx)}
                    className={`${styles.roleChip} ${
                      selectedRoleIndex === idx ? styles.roleChipActive : ''
                    }`}
                    aria-pressed={selectedRoleIndex === idx}
                    title={`Explore ${role.label} perspective`}
                  >
                    {selectedRoleIndex === idx && <span className={styles.roleChipDot} />}
                    {role.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right side: Interactive Interview Room Card */}
            <div className={styles.panelRight}>
              <InteractiveInterviewMock
                selectedRoleIndex={selectedRoleIndex}
                onRoleSelect={handleRoleSelect}
                onActivityChange={onSampleActivity}
              />
            </div>
          </div>
        </section>

        {/* ========================================================== */}
        {/* SCREEN 3: Powered by Agora Conversational AI & Companion   */}
        {/* ========================================================== */}
        <section
          className={styles.screen}
          data-scene="2"
          aria-label="Powered by Agora Conversational AI and companion"
          aria-hidden={activeScreen !== 2}
          inert={activeScreen !== 2}
        >
          <div className={styles.agoraContainer}>
            <div className={styles.agoraHeader}>
              <h2 className={styles.agoraTitle}>Powered by Agora Conversational AI</h2>
              <a
                href="https://agora.io/en/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.agoraLogoLink}
              >
                <span>Voice powered by</span>
                <Image
                  src="/agora-logo-rgb-blue.svg"
                  alt="Agora"
                  width={84}
                  height={22}
                  className="inline-block"
                />
              </a>
            </div>

            <div className={styles.companionContent}>
              {/* Companion 3D Click Target */}
              <div ref={(el) => { anchorsRef.current[2] = el; }} className={styles.companionTargetBox}>
                <button
                  ref={companionButtonRef}
                  type="button"
                  className={styles.companionButton}
                  onClick={() => activateCompanion()}
                  aria-label="Click to meet RoundTable companion"
                  aria-pressed={companionHappy}
                  disabled={voiceBusy}
                />
                <div className={styles.companionPromptBadge}>
                  <Volume2 size={13} />
                  <span>{companionHappy ? "Agora voice session" : "Talk to companion"}</span>
                </div>
              </div>

              {/* Upgraded Agora Voice Engine Showcase Card */}
              <div className={styles.agoraEngineCard}>
                <div className={styles.engineHeader}>
                  <span>Agora Voice AI Engine</span>

                </div>

                <div className={styles.engineBody}>
                  <span className={styles.eyebrow}>Meet your interview companion</span>
                  <h3 className={styles.companionCardTitle}>A friendly voice. A little less pressure.</h3>
                  <p className={styles.companionCardCopy}>Tap the companion for a short introduction from Team LegionSquad, spoken through Agora. Its live transcript appears here.</p>
                  <VoiceDemo
                    variant="companion-demo"
                    startSignal={companionStartSignal}
                    onActivityChange={onCompanionActivity}
                  />
                </div>
              </div>
            </div>

            {/* Return Loop back to Screen 1 */}
            <div className={styles.loopBackSection}>
              <button
                type="button"
                onClick={scrollToStart}
                disabled={voiceBusy}
                className={styles.loopBackBtn}
                aria-label="Return to Start Page"
              >
                <RotateCcw size={14} />
                <span>Back to start</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      {candidateDialogOpen && <div className={styles.candidateDialogBackdrop} role="presentation" onMouseDown={() => !candidateJoining && setCandidateDialogOpen(false)}>
        <section className={styles.candidateDialog} role="dialog" aria-modal="true" aria-labelledby="candidate-link-title" onMouseDown={(event) => event.stopPropagation()}>
          <button type="button" className={styles.dialogClose} onClick={() => setCandidateDialogOpen(false)} disabled={candidateJoining} aria-label="Close candidate link dialog"><X size={17}/></button>
          <span className={styles.eyebrow}>CANDIDATE ACCESS</span>
          <h2 id="candidate-link-title">Paste your interview link</h2>
          <p>Your interviewer shares a single-use RoundTable link. No candidate account is required.</p>
          <label className={styles.candidateLinkField}><span>Interview link</span><input autoFocus value={candidateLink} onChange={(event) => { setCandidateLink(event.target.value); setCandidateLinkError(''); }} onKeyDown={(event) => { if (event.key === 'Enter') joinCandidateInterview(); }} placeholder="https://…/interview/your-link"/></label>
          {candidateLinkError && <p className={styles.candidateLinkError} role="alert">{candidateLinkError}</p>}
          <Button className={styles.candidateJoinButton} onClick={joinCandidateInterview} disabled={!candidateLink.trim() || candidateJoining}>{candidateJoining ? 'Opening interview…' : 'Open interview'} <ArrowRight size={16}/></Button>
        </section>
      </div>}

      {/* Navigation Bar / Progress Pills */}
      <nav className={styles.navigationBar} aria-label="Page navigation">
        <button
          type="button"
          className={styles.navArrowBtn}
          onClick={() => navigateToScreen(Math.max(0, activeScreen - 1) as 0 | 1 | 2)}
          disabled={voiceBusy || activeScreen === 0}
          aria-label="Previous screen"
        >
          <ArrowLeft size={15} />
        </button>

        <div className={styles.navPills}>
          {(
            [
              { index: 0, label: '01 Core' },
              { index: 1, label: '02 5 Roles' },
              { index: 2, label: '03 Agora' },
            ] as const
          ).map(({ index, label }) => (
            <button
              key={index}
              type="button"
              onClick={() => navigateToScreen(index)}
              disabled={voiceBusy}
              className={`${styles.navPill} ${
                activeScreen === index ? styles.navPillActive : ''
              }`}
              aria-current={activeScreen === index ? 'step' : undefined}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className={styles.navArrowBtn}
          onClick={() => navigateToScreen(Math.min(2, activeScreen + 1) as 0 | 1 | 2)}
          disabled={voiceBusy || activeScreen === 2}
          aria-label="Next screen"
        >
          <ArrowRight size={15} />
        </button>
      </nav>
    </main>
  );
}
