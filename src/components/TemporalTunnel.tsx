'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface PredictionItem {
  id: string;
  title: string;
  category: string;
  predictionConfidence: number;
  trajectoryPrediction: string;
  consultantImplication: string;
}

interface TemporalTunnelProps {
  predictions: PredictionItem[];
  onSelect: (pred: PredictionItem) => void;
}

export default function TemporalTunnel({ predictions, onSelect }: TemporalTunnelProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<PredictionItem | null>(null);
  const [depth, setDepth] = useState(0);
  const zOffsetRef = useRef(0);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || 800;
    const height = mountRef.current.clientHeight || 500;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#07070a');
    scene.fog = new THREE.FogExp2('#07070a', 0.05);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // 2. Create the Neon Tunnel Geometry
    // We create multiple circular rings along the Z-axis
    const tunnelGroup = new THREE.Group();
    const ringCount = 35;
    const tunnelLength = 50;

    for (let i = 0; i < ringCount; i++) {
      const zPos = -(i * (tunnelLength / ringCount));
      const radius = 2.5 + Math.sin(i * 0.4) * 0.2; // slightly undulating tunnel
      
      const ringGeo = new THREE.RingGeometry(radius, radius + 0.03, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? '#ec4899' : '#6366f1',
        transparent: true,
        opacity: Math.max(0.05, 1 - (i / ringCount)),
        side: THREE.DoubleSide
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.set(0, 0, zPos);
      tunnelGroup.add(ringMesh);
    }
    scene.add(tunnelGroup);

    // Add longitudinal wireframe lines for tunnel structure
    const lineCount = 8;
    for (let i = 0; i < lineCount; i++) {
      const angle = (i / lineCount) * Math.PI * 2;
      const points = [];
      for (let j = 0; j < ringCount; j++) {
        const zPos = -(j * (tunnelLength / ringCount));
        const radius = 2.55 + Math.sin(j * 0.4) * 0.2;
        points.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, zPos));
      }
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({
        color: '#1e1b4b',
        transparent: true,
        opacity: 0.35
      });
      const line = new THREE.Line(lineGeo, lineMat);
      scene.add(line);
    }

    // 3. Populate Milestone Nodes
    const nodesGroup = new THREE.Group();
    const nodeMeshes: THREE.Mesh[] = [];

    // Map categories to colors
    const categoryColors: Record<string, string> = {
      'Frontier Model Capabilities': '#a855f7',
      'Model-on-Chip Advancements': '#3b82f6',
      'Agentic Architectures': '#10b981',
      'Ways of Working': '#f59e0b',
      'Development Frameworks': '#ec4899'
    };

    predictions.forEach((pred, idx) => {
      // Position nodes dynamically along the tunnel depth
      const zPos = -((idx + 1) * (tunnelLength / (predictions.length + 1)));
      // Rotate placement around the tunnel ring
      const angle = (idx * 1.5) % (Math.PI * 2);
      const radius = 1.6; // Keep within the tunnel ring bound

      const xPos = Math.cos(angle) * radius;
      const yPos = Math.sin(angle) * radius;

      const nodeGeo = new THREE.SphereGeometry(0.18, 16, 16);
      const color = categoryColors[pred.category] || '#ffffff';
      const nodeMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.9
      });
      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      nodeMesh.position.set(xPos, yPos, zPos);
      nodeMesh.userData = { pred };

      // Outer rings/aura
      const auraGeo = new THREE.RingGeometry(0.24, 0.28, 16);
      const auraMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide
      });
      const auraMesh = new THREE.Mesh(auraGeo, auraMat);
      auraMesh.lookAt(new THREE.Vector3(0, 0, 1));
      nodeMesh.add(auraMesh);

      nodesGroup.add(nodeMesh);
      nodeMeshes.push(nodeMesh);
    });
    scene.add(nodesGroup);

    // 4. Mouse Move Camera Drift & Raycasting
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const targetCameraPos = { x: 0, y: 0, z: 5 };

    const onMouseMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Drift camera slightly based on mouse position
      targetCameraPos.x = mouse.x * 1.2;
      targetCameraPos.y = mouse.y * 1.2;
    };

    const onMouseWheel = (event: WheelEvent) => {
      event.preventDefault();
      // Scroll moves camera forward/backward along Z axis inside the tunnel
      zOffsetRef.current += event.deltaY * 0.02;
      zOffsetRef.current = Math.max(0, Math.min(tunnelLength - 5, zOffsetRef.current));
      setDepth(zOffsetRef.current);
    };

    const onClick = () => {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeMeshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object.userData.pred as PredictionItem;
        setSelectedNode(hit);
        onSelect(hit);

        // Highlight selected mesh scale
        nodeMeshes.forEach((mesh) => {
          if (mesh.userData.pred.id === hit.id) {
            mesh.scale.set(1.5, 1.5, 1.5);
          } else {
            mesh.scale.set(1, 1, 1);
          }
        });
      }
    };

    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('wheel', onMouseWheel, { passive: false });
    renderer.domElement.addEventListener('click', onClick);

    // 5. Animation Loop
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth camera position interpolation (lerp)
      camera.position.x += (targetCameraPos.x - camera.position.x) * 0.05;
      camera.position.y += (targetCameraPos.y - camera.position.y) * 0.05;
      
      const targetZ = 5 - zOffsetRef.current;
      camera.position.z += (targetZ - camera.position.z) * 0.05;

      // Slow rotation of tunnel rings to feel alive
      tunnelGroup.children.forEach((mesh, index) => {
        mesh.rotation.z += 0.002 * (index % 2 === 0 ? 1 : -1);
      });

      // Slowly rotate all milestone nodes
      nodesGroup.children.forEach((mesh) => {
        mesh.rotation.y += 0.01;
      });

      // Hover nodes effect
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeMeshes);

      if (intersects.length > 0) {
        document.body.style.cursor = 'pointer';
        const hitMesh = intersects[0].object as THREE.Mesh;
        if (hitMesh.scale.x === 1) {
          hitMesh.scale.set(1.25, 1.25, 1.25);
        }
      } else {
        document.body.style.cursor = 'default';
        nodeMeshes.forEach((m) => {
          if (selectedNode && m.userData.pred.id === selectedNode.id) {
            m.scale.set(1.5, 1.5, 1.5);
          } else {
            m.scale.set(1, 1, 1);
          }
        });
      }

      renderer.render(scene, camera);
    };
    animate();

    // 6. Resize handler
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement) {
        renderer.domElement.removeEventListener('mousemove', onMouseMove);
        renderer.domElement.removeEventListener('wheel', onMouseWheel);
        renderer.domElement.removeEventListener('click', onClick);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [predictions, selectedNode]);

  return (
    <div className="relative w-full h-[500px] bg-slate-950 rounded-3xl overflow-hidden border border-slate-900 shadow-2xl flex flex-col justify-between">
      
      {/* Background canvas */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* Top Banner Navigation Instructions */}
      <div className="relative z-10 p-5 bg-gradient-to-b from-slate-950 via-slate-950/40 to-transparent pointer-events-none flex justify-between items-center select-none">
        <div className="space-y-0.5">
          <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest">Interactive Sandbox</span>
          <h3 className="text-sm font-bold text-white leading-tight">3D Temporal Trajectory Tunnel</h3>
        </div>
        <div className="text-[9px] font-bold text-slate-400 bg-slate-900/80 border border-slate-800 rounded-lg px-2.5 py-1">
          SCROLL to fly · MOVE mouse to look around · CLICK nodes to select
        </div>
      </div>

      {/* Bottom Node Detail and Depth Slider Overlay */}
      <div className="relative z-10 p-5 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col gap-3 select-none">
        {selectedNode && (
          <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl backdrop-blur-md text-left text-slate-100 max-w-lg shadow-xl animate-slideIn">
            <div className="flex justify-between items-start gap-3 mb-2">
              <div>
                <span className="text-[8px] font-black text-pink-500 uppercase tracking-wider">{selectedNode.category}</span>
                <h4 className="text-xs font-black text-white leading-snug mt-0.5">{selectedNode.title}</h4>
              </div>
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded uppercase shrink-0 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                {selectedNode.trajectoryPrediction}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">{selectedNode.consultantImplication}</p>
          </div>
        )}
        <div className="flex items-center gap-4 bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 max-w-md pointer-events-auto shadow-md">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider shrink-0">Tunnel Depth</span>
          <input
            type="range"
            min="0"
            max="45"
            step="0.05"
            value={depth}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setDepth(val);
              zOffsetRef.current = val;
            }}
            className="w-full accent-pink-500 cursor-pointer bg-slate-800 h-1.5 rounded-lg appearance-none"
          />
          <span className="text-[9px] font-black text-pink-400 w-8 text-right shrink-0">{Math.round((depth / 45) * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
