'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

type RecruiterSignalFieldProps = { candidates: number; evidenceReady: number };

/** Decorative, reduced-motion-safe Three.js layer. It never represents live scoring. */
export function RecruiterSignalField({ candidates, evidenceReady }: RecruiterSignalFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0, 8);
    const group = new THREE.Group();
    scene.add(group);
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.05, 2), new THREE.MeshBasicMaterial({ color: 0x6ef0ad, wireframe: true, transparent: true, opacity: 0.62 }));
    group.add(core);
    const count = Math.min(8, Math.max(4, candidates + evidenceReady + 3));
    for (let index = 0; index < count; index += 1) {
      const angle = (index / count) * Math.PI * 2;
      const radius = 2.05 + (index % 2) * 0.34;
      const dot = new THREE.Mesh(new THREE.SphereGeometry(index % 3 === 0 ? 0.12 : 0.08, 14, 14), new THREE.MeshBasicMaterial({ color: index < evidenceReady ? 0xffcf57 : 0x40c98a, transparent: true, opacity: 0.9 }));
      dot.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.55, (index % 3 - 1) * 0.45);
      group.add(dot);
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), dot.position]), new THREE.LineBasicMaterial({ color: 0x4bd796, transparent: true, opacity: 0.22 }));
      group.add(line);
    }
    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      renderer.setSize(Math.max(1, width), Math.max(1, height), false);
      camera.aspect = Math.max(1, width) / Math.max(1, height);
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    let frame = 0;
    const render = () => {
      if (!reduceMotion) {
        group.rotation.y += 0.0027;
        core.rotation.x += 0.0012;
      }
      renderer.render(scene, camera);
      if (!reduceMotion) frame = requestAnimationFrame(render);
    };
    render();
    return () => { observer.disconnect(); if (frame) cancelAnimationFrame(frame); renderer.dispose(); scene.traverse((node) => { if (node instanceof THREE.Mesh || node instanceof THREE.Line) { node.geometry.dispose(); const material = node.material; if (Array.isArray(material)) material.forEach((entry) => entry.dispose()); else material.dispose(); } }); };
  }, [candidates, evidenceReady]);

  return <canvas ref={canvasRef} className="h-full w-full" aria-hidden="true" />;
}
