'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface VectorNode {
  id: string;
  title: string;
  stream: string;
  x: number;
  y: number;
  z: number;
  summary: string;
}

interface SemanticVectorSpaceProps {
  items?: Array<{ id: string; title: string; stream: string; summary: string }>;
}

export default function SemanticVectorSpace({ items = [] }: SemanticVectorSpaceProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<VectorNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [vectorNodes, setVectorNodes] = useState<VectorNode[]>([]);
  const nodeMeshesRef = useRef<THREE.Mesh[]>([]);

  // Generate deterministic coordinates if items change or default to predefined nodes
  useEffect(() => {
    let nodes: VectorNode[] = [];

    if (items && items.length > 0) {
      nodes = items.map((item, idx) => {
        // Deterministic mapping using string hash for coordinates
        const getHash = (str: string, seed: number) => {
          let hash = 0;
          for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
          }
          return (Math.sin(hash + seed) * 4); // coordinate bound between -4 and 4
        };

        return {
          id: item.id,
          title: item.title,
          stream: item.stream,
          summary: item.summary,
          x: getHash(item.title, 1),
          y: getHash(item.stream, 2),
          z: getHash(item.id, 3)
        };
      });
    } else {
      // Fallback predefined points representing RAG embeddings
      const mockStreams = [
        'Frontier Model Capabilities',
        'Model-on-Chip Advancements',
        'Agentic Architectures',
        'Ways of Working',
        'Development Frameworks'
      ];
      for (let i = 0; i < 40; i++) {
        const stream = mockStreams[i % mockStreams.length];
        nodes.push({
          id: `node-${i}`,
          title: `AI Topic #${i + 1}: ${stream} Innovation`,
          stream,
          summary: `Automatically extracted prediction relating to ${stream} and its integration pipeline.`,
          x: (Math.random() - 0.5) * 8,
          y: (Math.random() - 0.5) * 8,
          z: (Math.random() - 0.5) * 8
        });
      }
    }

    setVectorNodes(nodes);
  }, [items]);

  useEffect(() => {
    if (!mountRef.current || vectorNodes.length === 0) return;

    const width = mountRef.current.clientWidth || 800;
    const height = mountRef.current.clientHeight || 500;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#07070a');

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // Grid helper backdrop
    const gridHelper = new THREE.GridHelper(16, 16, '#1e293b', '#0f172a');
    gridHelper.position.y = -4.5;
    scene.add(gridHelper);

    // 2. Add Ambient Lights
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.2);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight('#ffffff', 1.5, 50);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    // 3. Category Color Map
    const streamColors: Record<string, string> = {
      'Frontier Model Capabilities': '#ec4899', // Pink
      'Model-on-Chip Advancements': '#a855f7',  // Violet
      'Agentic Architectures': '#3b82f6',       // Blue
      'Ways of Working': '#10b981',              // Emerald
      'Development Frameworks': '#f59e0b'        // Amber
    };

    // 4. Create Node Points in 3D Space
    const pointsGroup = new THREE.Group();
    const meshes: THREE.Mesh[] = [];

    vectorNodes.forEach((node) => {
      // Sphere geometry for nodes
      const geo = new THREE.SphereGeometry(0.18, 12, 12);
      const colorCode = streamColors[node.stream] || '#cbd5e1';

      const mat = new THREE.MeshPhongMaterial({
        color: colorCode,
        emissive: colorCode,
        emissiveIntensity: 0.35,
        shininess: 30
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(node.x, node.y, node.z);
      mesh.userData = { node };

      // Halo ring around each node
      const ringGeo = new THREE.RingGeometry(0.25, 0.28, 12);
      const ringMat = new THREE.MeshBasicMaterial({
        color: colorCode,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      mesh.add(ringMesh);

      pointsGroup.add(mesh);
      meshes.push(mesh);
    });
    scene.add(pointsGroup);
    nodeMeshesRef.current = meshes;

    // 5. Orbit & Drag rotation controls
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    const mouse = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();

    const onPointerDown = () => {
      isDragging = true;
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging) {
        const deltaMove = {
          x: event.clientX - previousMousePosition.x,
          y: event.clientY - previousMousePosition.y
        };

        pointsGroup.rotation.y += deltaMove.x * 0.005;
        pointsGroup.rotation.x += deltaMove.y * 0.005;
        gridHelper.rotation.y += deltaMove.x * 0.005;
      }

      previousMousePosition = {
        x: event.clientX,
        y: event.clientY
      };
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      // Zoom camera on scroll
      camera.position.z += event.deltaY * 0.01;
      camera.position.z = Math.max(3, Math.min(25, camera.position.z));
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    // 6. Animation Loop
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Slow passive rotation
      if (!isDragging) {
        pointsGroup.rotation.y += 0.001;
      }

      // Constantly face halos to the camera
      meshes.forEach((mesh) => {
        mesh.children.forEach((c) => {
          c.lookAt(camera.position);
        });
      });

      // Raycast hover check
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        document.body.style.cursor = 'pointer';
        const hitNode = intersects[0].object.userData.node as VectorNode;
        setHoveredPoint(hitNode);
        (intersects[0].object as THREE.Mesh).scale.set(1.4, 1.4, 1.4);
      } else {
        document.body.style.cursor = 'default';
        setHoveredPoint(null);
        meshes.forEach((m) => {
          m.scale.set(1, 1, 1);
        });
      }

      renderer.render(scene, camera);
    };
    animate();

    // 7. Resize handler
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
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement) {
        renderer.domElement.removeEventListener('pointerdown', onPointerDown);
        renderer.domElement.removeEventListener('pointermove', onPointerMove);
        renderer.domElement.removeEventListener('wheel', onWheel);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [vectorNodes]);

  // Handle Query Highlighting & scaling dynamically
  useEffect(() => {
    if (!nodeMeshesRef.current) return;

    nodeMeshesRef.current.forEach((mesh) => {
      const node = mesh.userData.node as VectorNode;
      const mat = mesh.material as THREE.MeshPhongMaterial;

      if (searchQuery.trim() === '') {
        mat.emissiveIntensity = 0.35;
        mesh.scale.set(1, 1, 1);
      } else if (
        node.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.stream.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.summary.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        // Match: Glow bright & scale up
        mat.emissiveIntensity = 1.0;
        mesh.scale.set(1.8, 1.8, 1.8);
      } else {
        // Dim unmatched nodes
        mat.emissiveIntensity = 0.05;
        mesh.scale.set(0.6, 0.6, 0.6);
      }
    });
  }, [searchQuery, vectorNodes]);

  return (
    <div className="relative w-full h-[500px] bg-slate-950 rounded-3xl overflow-hidden border border-slate-900 shadow-2xl flex flex-col justify-between">
      
      {/* 3D Canvas element */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Overlay Panel */}
      <div className="relative z-10 p-5 bg-gradient-to-b from-slate-950 via-slate-950/40 to-transparent pointer-events-none flex flex-col gap-2 select-none md:flex-row md:justify-between md:items-center">
        <div>
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Interactive Cloud</span>
          <h3 className="text-sm font-bold text-white leading-tight">3D Semantic Vector Space</h3>
        </div>
        <div className="flex gap-2 pointer-events-auto">
          <input
            type="text"
            placeholder="Filter vector coordinates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-slate-700 w-48 transition-all"
          />
        </div>
      </div>

      {/* Hover Info Overlay */}
      {hoveredPoint && (
        <div className="relative z-10 m-5 p-5 bg-slate-900/95 border border-slate-800 rounded-2xl backdrop-blur-md text-left text-slate-100 max-w-md shadow-xl animate-slideIn">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wider">{hoveredPoint.stream}</span>
          </div>
          <h4 className="text-xs font-black text-white leading-snug mb-1.5">{hoveredPoint.title}</h4>
          <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">{hoveredPoint.summary}</p>
        </div>
      )}

      {/* Category Legend */}
      <div className="relative z-10 p-4 bg-gradient-to-t from-slate-950 to-transparent flex flex-wrap gap-3 text-[9px] font-bold text-slate-400 pointer-events-none select-none border-t border-slate-900/50">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-pink-500" />
          <span>Frontier Capabilities</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-purple-500" />
          <span>Model-on-Chip</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span>Agentic Arch</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Ways of Working</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Dev Frameworks</span>
        </div>
      </div>
      
    </div>
  );
}
