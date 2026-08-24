'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { oracleAudio } from './OracleAudioEngine';
import { OraclePredictionItem } from './OracleDetailsPanel';
import { Sparkles, ShieldCheck, TrendingUp, Clock, ChevronRight, Zap } from 'lucide-react';

interface OracleCyberMatrixCanvasProps {
  predictions: OraclePredictionItem[];
  selectedId: string | null;
  onSelectPrediction: (prediction: OraclePredictionItem) => void;
  selectedHorizonPlane?: string; // 'All' | 'Year 1' | 'Year 2' | 'Year 3+'
  onEngineChange?: (engineName: string) => void;
}

// Stream category colors mapping
const categoryColors: Record<string, string> = {
  'Frontier Model Capabilities': '#ec4899', // Neon Pink
  'Model-on-Chip Advancements': '#06b6d4',   // Cyan
  'Agentic Architectures': '#10b981',        // Emerald
  'Ways of Working': '#f59e0b',              // Amber
  'Development Frameworks': '#8b5cf6'        // Purple
};

// Check if WebGL is supported by browser/GPU
function checkWebGLSupport(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

export default function OracleCyberMatrixCanvas({
  predictions,
  selectedId,
  onSelectPrediction,
  selectedHorizonPlane = 'All',
  onEngineChange
}: OracleCyberMatrixCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [useFallbackCSS, setUseFallbackCSS] = useState<boolean>(false);
  const [cssRotation, setCssRotation] = useState({ x: 18, y: -12 });
  const isDraggingRef = useRef(false);
  const previousMouseRef = useRef({ x: 0, y: 0 });

  // Categorize predictions into 3 time horizons
  const horizonGroups = useMemo(() => {
    const year1: OraclePredictionItem[] = [];
    const year2: OraclePredictionItem[] = [];
    const year3: OraclePredictionItem[] = [];

    predictions.forEach((p, idx) => {
      if (idx % 3 === 0) year1.push(p);
      else if (idx % 3 === 1) year2.push(p);
      else year3.push(p);
    });

    return { year1, year2, year3 };
  }, [predictions]);

  // Check WebGL support on mount
  useEffect(() => {
    const webglSupported = checkWebGLSupport();
    if (!webglSupported) {
      setUseFallbackCSS(true);
      onEngineChange?.('CSS 3D Matrix');
    } else {
      onEngineChange?.('WebGL 3D Accelerated');
    }
  }, [onEngineChange]);

  // Three.js WebGL Engine Implementation
  useEffect(() => {
    if (useFallbackCSS || !mountRef.current) return;

    const width = mountRef.current.clientWidth || window.innerWidth;
    const height = mountRef.current.clientHeight || window.innerHeight;

    // 1. Scene, Camera, WebGL Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#030308');
    scene.fog = new THREE.FogExp2('#030308', 0.015);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 4, 14);
    camera.lookAt(0, 0, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      mountRef.current.appendChild(renderer.domElement);
    } catch {
      // Fallback if WebGL instantiation fails at runtime
      setUseFallbackCSS(true);
      onEngineChange?.('CSS 3D Matrix');
      return;
    }

    // 2. Lights
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.8);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight('#ec4899', 4, 40);
    pointLight1.position.set(-10, 10, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight('#06b6d4', 4, 40);
    pointLight2.position.set(10, -10, 10);
    scene.add(pointLight2);

    // 3. Neon Grid Planes (Floor & Ceiling Grid)
    const gridFloor = new THREE.GridHelper(40, 40, '#ec4899', '#1e1b4b');
    gridFloor.position.y = -5;
    scene.add(gridFloor);

    const gridCeiling = new THREE.GridHelper(40, 40, '#06b6d4', '#1e1b4b');
    gridCeiling.position.y = 12;
    scene.add(gridCeiling);

    // 4. Volumetric Starfield Particles
    const particleCount = 600;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 50;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.06,
      color: '#06b6d4',
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 5. Build 3D Card Meshes on Parallel Z-Depth Planes
    const matrixGroup = new THREE.Group();
    scene.add(matrixGroup);
    const cardMeshes: THREE.Mesh[] = [];
    const cardPositionsMap: Map<string, THREE.Vector3> = new Map();

    const planes = [
      { name: 'Year 1', z: 3, items: horizonGroups.year1 },
      { name: 'Year 2', z: -2, items: horizonGroups.year2 },
      { name: 'Year 3+', z: -7, items: horizonGroups.year3 }
    ];

    planes.forEach(plane => {
      const count = plane.items.length;
      const cols = 3;

      plane.items.forEach((pred, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);

        const x = (col - (cols - 1) / 2) * 3.6;
        const y = -(row * 2.2) + 2.0;
        const z = plane.z;

        const posVec = new THREE.Vector3(x, y, z);
        cardPositionsMap.set(pred.id, posVec);

        // 3D Card Mesh Box
        const cardGeo = new THREE.BoxGeometry(2.8, 1.6, 0.08);
        const category = pred.therapeuticAreas?.[0] || 'AI Stream';
        const color = categoryColors[category] || '#ec4899';

        const cardMat = new THREE.MeshStandardMaterial({
          color: '#0f172a',
          emissive: color,
          emissiveIntensity: 0.35,
          roughness: 0.3,
          metalness: 0.8,
          transparent: true,
          opacity: 0.95
        });

        const cardMesh = new THREE.Mesh(cardGeo, cardMat);
        cardMesh.position.copy(posVec);
        cardMesh.userData = { pred, planeName: plane.name };

        // Outer Neon Border Frame
        const wireGeo = new THREE.EdgesGeometry(cardGeo);
        const wireMat = new THREE.LineBasicMaterial({ color: color, linewidth: 2 });
        const wireFrame = new THREE.LineSegments(wireGeo, wireMat);
        cardMesh.add(wireFrame);

        matrixGroup.add(cardMesh);
        cardMeshes.push(cardMesh);
      });
    });

    // 6. Cross-Plane Trajectory Beams (Connecting Year 1 -> Year 2 -> Year 3+)
    const laserPoints: THREE.Vector3[] = [];
    horizonGroups.year1.forEach((p1, idx) => {
      const p2 = horizonGroups.year2[idx % horizonGroups.year2.length];
      const p3 = horizonGroups.year3[idx % horizonGroups.year3.length];

      const pos1 = cardPositionsMap.get(p1.id);
      const pos2 = p2 ? cardPositionsMap.get(p2.id) : null;
      const pos3 = p3 ? cardPositionsMap.get(p3.id) : null;

      if (pos1 && pos2) laserPoints.push(pos1, pos2);
      if (pos2 && pos3) laserPoints.push(pos2, pos3);
    });

    if (laserPoints.length > 0) {
      const laserGeo = new THREE.BufferGeometry().setFromPoints(laserPoints);
      const laserMat = new THREE.LineBasicMaterial({
        color: '#06b6d4',
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending
      });
      const laserLines = new THREE.LineSegments(laserGeo, laserMat);
      matrixGroup.add(laserLines);
    }

    // 7. Raycasting & Mouse Drag Rotation
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerMove = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDraggingRef.current) {
        const deltaX = event.clientX - previousMouseRef.current.x;
        const deltaY = event.clientY - previousMouseRef.current.y;

        matrixGroup.rotation.y += deltaX * 0.003;
        matrixGroup.rotation.x += deltaY * 0.003;

        previousMouseRef.current = { x: event.clientX, y: event.clientY };
        return;
      }

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(cardMeshes);

      if (intersects.length > 0) {
        renderer.domElement.style.cursor = 'pointer';
        const hit = intersects[0].object as THREE.Mesh;
        const hitPred = hit.userData.pred as OraclePredictionItem;

        cardMeshes.forEach(mesh => {
          if (mesh.userData.pred.id === hitPred.id) {
            mesh.scale.set(1.1, 1.1, 1.1);
            (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.9;
          } else if (mesh.userData.pred.id !== selectedId) {
            mesh.scale.set(1, 1, 1);
            (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.35;
          }
        });
      } else {
        renderer.domElement.style.cursor = isDraggingRef.current ? 'grabbing' : 'grab';
        cardMeshes.forEach(mesh => {
          if (mesh.userData.pred.id !== selectedId) {
            mesh.scale.set(1, 1, 1);
            (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.35;
          }
        });
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      isDraggingRef.current = true;
      previousMouseRef.current = { x: event.clientX, y: event.clientY };
      renderer.domElement.style.cursor = 'grabbing';
    };

    const onPointerUp = (event: PointerEvent) => {
      isDraggingRef.current = false;
      renderer.domElement.style.cursor = 'grab';

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(cardMeshes);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        const selected = hitMesh.userData.pred as OraclePredictionItem;

        oracleAudio.playSelectNode();
        onSelectPrediction(selected);
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointermove', onPointerMove);
    dom.addEventListener('pointerdown', onPointerDown);
    dom.addEventListener('pointerup', onPointerUp);

    // 8. Animation Loop
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Slow ambient grid motion
      gridFloor.rotation.y += 0.0005;
      gridCeiling.rotation.y += 0.0005;

      // Update card scaling for selected
      cardMeshes.forEach(mesh => {
        if (mesh.userData.pred.id === selectedId) {
          mesh.scale.set(1.15, 1.15, 1.15);
          (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.2;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;

      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);

      dom.removeEventListener('pointermove', onPointerMove);
      dom.removeEventListener('pointerdown', onPointerDown);
      dom.removeEventListener('pointerup', onPointerUp);

      particleGeo.dispose();
      particleMat.dispose();

      renderer.dispose();
      if (mountRef.current && dom.parentNode === mountRef.current) {
        mountRef.current.removeChild(dom);
      }
    };
  }, [useFallbackCSS, predictions, selectedId, onSelectPrediction, horizonGroups, onEngineChange]);

  // Handle CSS Fallback Dragging
  const handleCssPointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    previousMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleCssPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - previousMouseRef.current.x;
    const deltaY = e.clientY - previousMouseRef.current.y;

    setCssRotation(prev => ({
      x: Math.max(-40, Math.min(50, prev.x - deltaY * 0.2)),
      y: prev.y + deltaX * 0.2
    }));

    previousMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleCssPointerUp = () => {
    isDraggingRef.current = false;
  };

  // Pure CSS 3D Matrix Renderer (Guaranteed Universal Compatibility)
  if (useFallbackCSS) {
    const planes = [
      { id: 'Year 1', title: 'NEAR HORIZON (YEAR 1 / 2026)', z: 180, items: horizonGroups.year1, border: 'border-pink-500/40', badge: 'bg-pink-500/20 text-pink-300' },
      { id: 'Year 2', title: 'MID HORIZON (YEAR 2 / 2027)', z: 0, items: horizonGroups.year2, border: 'border-cyan-500/40', badge: 'bg-cyan-500/20 text-cyan-300' },
      { id: 'Year 3+', title: 'FAR HORIZON (YEAR 3+ / 2028+)', z: -220, items: horizonGroups.year3, border: 'border-indigo-500/40', badge: 'bg-indigo-500/20 text-indigo-300' }
    ];

    const activePlanes = selectedHorizonPlane === 'All' 
      ? planes 
      : planes.filter(p => p.id === selectedHorizonPlane);

    return (
      <div 
        className="w-full h-full min-h-screen bg-slate-950 overflow-hidden relative cursor-grab active:cursor-grabbing select-none"
        onPointerDown={handleCssPointerDown}
        onPointerMove={handleCssPointerMove}
        onPointerUp={handleCssPointerUp}
        style={{ perspective: '1200px' }}
      >
        {/* Ambient Dark Sci-Fi Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/20 via-slate-950 to-slate-950 pointer-events-none" />

        {/* 3D Perspective Matrix Transformation Stage */}
        <div
          className="w-full h-full flex items-center justify-center transition-transform duration-100 ease-out"
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateX(${cssRotation.x}deg) rotateY(${cssRotation.y}deg)`
          }}
        >
          <div className="relative w-full max-w-6xl space-y-16 py-12" style={{ transformStyle: 'preserve-3d' }}>
            {activePlanes.map(plane => (
              <div
                key={plane.id}
                className="relative w-full bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 shadow-2xl transition-all duration-500"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: `translateZ(${plane.z}px)`
                }}
              >
                {/* Plane Header Badge */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${plane.border} ${plane.badge}`}>
                      {plane.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">{plane.items.length} Predictions</span>
                </div>

                {/* Plane Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ transformStyle: 'preserve-3d' }}>
                  {plane.items.map(pred => {
                    const isSelected = selectedId === pred.id;
                    const category = pred.therapeuticAreas?.[0] || 'AI Stream';
                    const catColor = categoryColors[category] || '#ec4899';

                    return (
                      <div
                        key={pred.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          oracleAudio.playSelectNode();
                          onSelectPrediction(pred);
                        }}
                        className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer space-y-2.5 ${
                          isSelected
                            ? 'bg-slate-900 border-pink-500 shadow-2xl shadow-pink-500/20 translate-z-10 scale-105'
                            : 'bg-slate-950/80 hover:bg-slate-900 border-slate-800 hover:border-slate-700 hover:scale-102'
                        }`}
                        style={{
                          transformStyle: 'preserve-3d',
                          borderLeftColor: catColor,
                          borderLeftWidth: '4px'
                        }}
                      >
                        <div className="flex items-center justify-between text-[9px] font-mono uppercase">
                          <span className="font-extrabold text-pink-400">{category}</span>
                          <span className="text-emerald-400 font-bold">{pred.predictionConfidence || 85}% Certainty</span>
                        </div>

                        <h4 className="font-black text-xs uppercase text-white leading-tight">
                          {pred.title}
                        </h4>

                        {pred.problemStatement && (
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                            {pred.problemStatement}
                          </p>
                        )}

                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[9px] font-mono text-slate-400">
                          <span className="flex items-center gap-1 text-cyan-300">
                            <TrendingUp size={11} />
                            {pred.trajectoryPrediction || 'Accelerating'}
                          </span>
                          <span className="flex items-center gap-0.5 text-slate-300 font-bold hover:text-white">
                            Inspect <ChevronRight size={10} />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Floating CSS 3D Hint HUD */}
        <div className="absolute bottom-6 left-6 pointer-events-none z-30 flex items-center gap-2 px-3.5 py-2 bg-slate-950/80 backdrop-blur-xl border border-slate-800 rounded-2xl text-[10px] font-mono text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>DRAG TO TILT 3D MATRIX</span>
          <span>•</span>
          <span>UNIVERSAL CSS 3D ENGINE ACTIVE</span>
        </div>
      </div>
    );
  }

  // WebGL 3D Canvas Viewport
  return (
    <div className="relative w-full h-full min-h-screen bg-slate-950 overflow-hidden">
      <div ref={mountRef} className="w-full h-full min-h-screen cursor-grab active:cursor-grabbing" />
    </div>
  );
}
