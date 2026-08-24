'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface AgentNode {
  name: string;
  role: string;
  color: string;
  x: number;
  y: number;
  z: number;
}

const AGENTS: AgentNode[] = [
  { name: 'Lead Ingestion Agent', role: 'Active feed monitoring & crawling', color: '#ec4899', x: -1.8, y: 1.25, z: 0 },
  { name: 'Oracle Forecaster', role: 'Timeline & impact estimation', color: '#a855f7', x: 1.8, y: 1.25, z: 1.2 },
  { name: 'Expert Biographer', role: 'Author profile generation & lookup', color: '#3b82f6', x: -1.2, y: -1.2, z: -1.2 },
  { name: 'RAG Router', role: 'Query semantic parsing & retrieval', color: '#10b981', x: 1.2, y: -1.2, z: 0.6 }
];

export default function NeuralAgentCluster() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredAgent, setHoveredAgent] = useState<AgentNode | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || 400;
    const height = mountRef.current.clientHeight || 350;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2('#07070a', 0.08);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 7;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // 2. Add Ambient Particles (Backdrop)
    const particleCount = 60;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i++) {
      particlePositions[i] = (Math.random() - 0.5) * 12;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: '#475569',
      size: 0.08,
      transparent: true,
      opacity: 0.5
    });

    const starParticles = new THREE.Points(particleGeo, particleMat);
    scene.add(starParticles);

    // 3. Create Agent Nodes & Geometries
    const nodesGroup = new THREE.Group();
    const nodeMeshes: THREE.Mesh[] = [];

    AGENTS.forEach((agent) => {
      // Inner glowing core
      const coreGeo = new THREE.SphereGeometry(0.32, 16, 16);
      const coreMat = new THREE.MeshBasicMaterial({
        color: agent.color,
        transparent: true,
        opacity: 0.95
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      coreMesh.position.set(agent.x, agent.y, agent.z);
      coreMesh.userData = { agent };

      // Outer halo wireframe
      const haloGeo = new THREE.SphereGeometry(0.5, 8, 8);
      const haloMat = new THREE.MeshBasicMaterial({
        color: agent.color,
        wireframe: true,
        transparent: true,
        opacity: 0.25
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      coreMesh.add(haloMesh);

      nodesGroup.add(coreMesh);
      nodeMeshes.push(coreMesh);
    });
    scene.add(nodesGroup);

    // 4. Create Communication Channels (Lines)
    const lineMat = new THREE.LineBasicMaterial({
      color: '#334155',
      transparent: true,
      opacity: 0.4
    });

    const linesGroup = new THREE.Group();
    // Connect all agents together
    for (let i = 0; i < AGENTS.length; i++) {
      for (let j = i + 1; j < AGENTS.length; j++) {
        const points = [
          new THREE.Vector3(AGENTS[i].x, AGENTS[i].y, AGENTS[i].z),
          new THREE.Vector3(AGENTS[j].x, AGENTS[j].y, AGENTS[j].z)
        ];
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(lineGeo, lineMat);
        linesGroup.add(line);
      }
    }
    scene.add(linesGroup);

    // 5. Active Pulse Transmission Particles
    const pulsesGroup = new THREE.Group();
    const pulseSpeed = 0.015;
    interface PulseData {
      mesh: THREE.Mesh;
      start: THREE.Vector3;
      end: THREE.Vector3;
      progress: number;
      color: string;
    }
    const pulses: PulseData[] = [];

    const spawnPulse = () => {
      const fromIdx = Math.floor(Math.random() * AGENTS.length);
      let toIdx = Math.floor(Math.random() * AGENTS.length);
      while (toIdx === fromIdx) {
        toIdx = Math.floor(Math.random() * AGENTS.length);
      }

      const fromNode = AGENTS[fromIdx];
      const toNode = AGENTS[toIdx];

      const pulseGeo = new THREE.SphereGeometry(0.08, 8, 8);
      const pulseMat = new THREE.MeshBasicMaterial({
        color: fromNode.color,
        transparent: true,
        opacity: 0.8
      });
      const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
      pulsesGroup.add(pulseMesh);

      pulses.push({
        mesh: pulseMesh,
        start: new THREE.Vector3(fromNode.x, fromNode.y, fromNode.z),
        end: new THREE.Vector3(toNode.x, toNode.y, toNode.z),
        progress: 0,
        color: fromNode.color
      });
    };
    scene.add(pulsesGroup);

    // Spawning interval
    const pulseTimer = setInterval(spawnPulse, 1800);

    // 6. Lights
    const dirLight1 = new THREE.DirectionalLight('#ffffff', 1.5);
    dirLight1.position.set(1, 1, 1);
    scene.add(dirLight1);

    // 7. Mouse Interactions
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onPointerMove = (event: PointerEvent) => {
      // Calculate normalized device coordinates
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Handle drag rotation
      if (isDragging) {
        const deltaMove = {
          x: event.clientX - previousMousePosition.x,
          y: event.clientY - previousMousePosition.y
        };

        nodesGroup.rotation.y += deltaMove.x * 0.005;
        nodesGroup.rotation.x += deltaMove.y * 0.005;
        linesGroup.rotation.y += deltaMove.x * 0.005;
        linesGroup.rotation.x += deltaMove.y * 0.005;
        pulsesGroup.rotation.y += deltaMove.x * 0.005;
        pulsesGroup.rotation.x += deltaMove.y * 0.005;
      }

      previousMousePosition = {
        x: event.clientX,
        y: event.clientY
      };
    };

    const onPointerDown = () => {
      isDragging = true;
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    window.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);

    // 8. Animation Loop
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Rotate nodes slowly
      if (!isDragging) {
        nodesGroup.rotation.y += 0.002;
        linesGroup.rotation.y += 0.002;
        pulsesGroup.rotation.y += 0.002;
      }

      // Rotate background stars
      starParticles.rotation.y -= 0.0005;

      // Update active pulses
      pulses.forEach((p, idx) => {
        p.progress += pulseSpeed;
        p.mesh.position.lerpVectors(p.start, p.end, p.progress);

        if (p.progress >= 1.0) {
          pulsesGroup.remove(p.mesh);
          pulses.splice(idx, 1);
        }
      });

      // Raycast for hovering agent
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeMeshes);

      if (intersects.length > 0) {
        const hitAgent = intersects[0].object.userData.agent as AgentNode;
        setHoveredAgent(hitAgent);
        // Pulse hover effect
        (intersects[0].object as THREE.Mesh).scale.set(1.2, 1.2, 1.2);
        document.body.style.cursor = 'pointer';
      } else {
        setHoveredAgent(null);
        nodeMeshes.forEach(m => m.scale.set(1, 1, 1));
        document.body.style.cursor = 'default';
      }

      renderer.render(scene, camera);
    };
    animate();

    // 9. Resize handler
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
      clearInterval(pulseTimer);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col justify-end bg-slate-950 rounded-2xl overflow-hidden border border-slate-900 shadow-2xl">
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />
      
      {/* Floating Info Overlay */}
      <div className="relative z-10 p-5 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent pointer-events-none select-none">
        {hoveredAgent ? (
          <div className="animate-slideIn space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: hoveredAgent.color }} />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">{hoveredAgent.name}</h4>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">{hoveredAgent.role}</p>
          </div>
        ) : (
          <div className="space-y-1 opacity-70">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Multi-Agent RAG Orchestration</h4>
            <p className="text-[10px] text-slate-500 font-semibold">Hover nodes to view agent channels</p>
          </div>
        )}
      </div>
    </div>
  );
}
