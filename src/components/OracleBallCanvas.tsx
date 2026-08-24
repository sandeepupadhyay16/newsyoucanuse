'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { oracleAudio } from './OracleAudioEngine';
import { OraclePredictionItem } from './OracleDetailsPanel';

interface OracleBallCanvasProps {
  predictions: OraclePredictionItem[];
  selectedId: string | null;
  onSelectPrediction: (prediction: OraclePredictionItem) => void;
  isAutoRotate?: boolean;
  resetCameraSignal?: number;
}

// Custom GLSL Translucent Crystal Energy Plasma Shader
const crystalVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const crystalFragmentShader = `
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                            -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
      + i.x + vec3(0.0, i1.x, 1.0 ) );
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    // Fresnel Rim Glow
    vec3 viewDir = normalize(-vPosition);
    float fresnel = pow(1.0 - max(0.0, dot(vNormal, viewDir)), 3.0);

    // Procedural Energy Waves
    float n1 = snoise(vUv * 5.0 + vec2(uTime * 0.12, uTime * 0.08));
    float n2 = snoise(vUv * 10.0 - vec2(uTime * 0.18, uTime * 0.12));
    float plasma = (n1 + n2) * 0.5 + 0.5;

    vec3 baseColor = mix(uColorA, uColorB, plasma);
    baseColor = mix(baseColor, uColorC, fresnel);

    // Translucent Glass Opacity & Additive Glow
    float alpha = clamp(0.25 + fresnel * 0.7 + plasma * 0.3, 0.2, 0.95);

    gl_FragColor = vec4(baseColor + vec3(fresnel * 0.5), alpha);
  }
`;

const categoryColors: Record<string, string> = {
  'Frontier Model Capabilities': '#ec4899', // Neon Pink
  'Model-on-Chip Advancements': '#06b6d4',   // Neon Cyan
  'Agentic Architectures': '#10b981',        // Emerald
  'Ways of Working': '#f59e0b',              // Amber
  'Development Frameworks': '#8b5cf6'        // Purple
};

export default function OracleBallCanvas({
  predictions,
  selectedId,
  onSelectPrediction,
  isAutoRotate = true,
  resetCameraSignal = 0
}: OracleBallCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef({ x: 0, y: 0 });
  const hoveredNodeRef = useRef<OraclePredictionItem | null>(null);

  // Spatial 2D Badge Overlay State
  const [badgeInfo, setBadgeInfo] = useState<{
    x: number;
    y: number;
    title: string;
    category: string;
    confidence: number;
    visible: boolean;
  } | null>(null);

  const cameraTargetPosRef = useRef(new THREE.Vector3(0, 0, 8.5));
  const cameraLookAtTargetRef = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || window.innerWidth;
    const height = mountRef.current.clientHeight || window.innerHeight;

    // 1. Scene, Camera, WebGL Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#030308');
    scene.fog = new THREE.FogExp2('#030308', 0.025);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0, 8.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // 2. Lights
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.7);
    scene.add(ambientLight);

    const pinkLight = new THREE.PointLight('#ec4899', 4, 30);
    pinkLight.position.set(-5, 5, 5);
    scene.add(pinkLight);

    const cyanLight = new THREE.PointLight('#06b6d4', 4, 30);
    cyanLight.position.set(5, -5, 5);
    scene.add(cyanLight);

    // 3. Central Luminous Crystal Glass Sphere
    const orbGroup = new THREE.Group();
    scene.add(orbGroup);

    const orbRadius = 2.4;
    const orbGeo = new THREE.SphereGeometry(orbRadius, 64, 64);
    const orbShaderMat = new THREE.ShaderMaterial({
      vertexShader: crystalVertexShader,
      fragmentShader: crystalFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColorA: { value: new THREE.Color('#1e1b4b') }, // Deep indigo
        uColorB: { value: new THREE.Color('#ec4899') }, // Neon Pink
        uColorC: { value: new THREE.Color('#06b6d4') }  // Cyan
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    const orbMesh = new THREE.Mesh(orbGeo, orbShaderMat);
    orbGroup.add(orbMesh);

    // Inner Glowing Core (Transparent Energy Core)
    const coreGeo = new THREE.SphereGeometry(1.2, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({
      color: '#06b6d4',
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    orbGroup.add(coreMesh);

    // 4. Orbital Tech Rings
    const ringGroup = new THREE.Group();
    orbGroup.add(ringGroup);

    const createTechRing = (radius: number, tube: number, color: string, rotX: number, rotY: number) => {
      const ringGeo = new THREE.TorusGeometry(radius, tube, 16, 120);
      const ringMat = new THREE.MeshBasicMaterial({
        color: color,
        wireframe: true,
        transparent: true,
        opacity: 0.4
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = rotX;
      ringMesh.rotation.y = rotY;
      ringGroup.add(ringMesh);
      return ringMesh;
    };

    const ring1 = createTechRing(3.1, 0.012, '#ec4899', Math.PI * 0.4, 0.2);
    const ring2 = createTechRing(3.7, 0.012, '#06b6d4', Math.PI * 0.2, Math.PI * 0.35);
    const ring3 = createTechRing(4.3, 0.015, '#10b981', Math.PI * 0.65, -0.4);

    // 5. Volumetric Swirling Particle Halo Nebulae
    const particleCount = 800;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleMeta: Array<{ r: number; theta: number; phi: number; speed: number }> = [];

    for (let i = 0; i < particleCount; i++) {
      const r = 2.8 + Math.random() * 2.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      particlePositions[i * 3] = x;
      particlePositions[i * 3 + 1] = y;
      particlePositions[i * 3 + 2] = z;

      particleMeta.push({ r, theta, phi, speed: 0.08 + Math.random() * 0.25 });
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.05,
      color: '#06b6d4',
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    const particlePoints = new THREE.Points(particleGeo, particleMat);
    orbGroup.add(particlePoints);

    // 6. Populate Interactive Prediction Nodes & Constellation Beams
    const nodesGroup = new THREE.Group();
    orbGroup.add(nodesGroup);
    const nodeMeshes: THREE.Mesh[] = [];
    const nodePositionsMap: Map<string, THREE.Vector3> = new Map();

    predictions.forEach((pred, idx) => {
      const category = pred.therapeuticAreas?.[0] || 'AI Stream';
      const nodeColor = categoryColors[category] || '#ec4899';

      // Spherical distribution on orbit radius 3.3
      const orbitRadius = 3.3;
      const phi = Math.acos(-1 + (2 * idx + 1) / predictions.length);
      const theta = Math.sqrt(predictions.length * Math.PI) * phi;

      const x = orbitRadius * Math.sin(phi) * Math.cos(theta);
      const y = orbitRadius * Math.sin(phi) * Math.sin(theta);
      const z = orbitRadius * Math.cos(phi);

      const posVec = new THREE.Vector3(x, y, z);
      nodePositionsMap.set(pred.id, posVec);

      // Node Sphere Mesh
      const nodeGeo = new THREE.SphereGeometry(0.2, 24, 24);
      const nodeMat = new THREE.MeshStandardMaterial({
        color: nodeColor,
        emissive: nodeColor,
        emissiveIntensity: 0.7,
        roughness: 0.1,
        metalness: 0.9
      });
      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      nodeMesh.position.copy(posVec);
      nodeMesh.userData = { pred };

      // Outer Glow Aura Ring
      const auraGeo = new THREE.RingGeometry(0.26, 0.34, 24);
      const auraMat = new THREE.MeshBasicMaterial({
        color: nodeColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.65
      });
      const auraMesh = new THREE.Mesh(auraGeo, auraMat);
      auraMesh.lookAt(camera.position);
      nodeMesh.add(auraMesh);

      nodesGroup.add(nodeMesh);
      nodeMeshes.push(nodeMesh);
    });

    // Create Constellation Beams connecting same-category nodes
    const laserPoints: THREE.Vector3[] = [];
    predictions.forEach((p1, i) => {
      predictions.forEach((p2, j) => {
        if (i < j && p1.therapeuticAreas?.[0] === p2.therapeuticAreas?.[0]) {
          const pos1 = nodePositionsMap.get(p1.id);
          const pos2 = nodePositionsMap.get(p2.id);
          if (pos1 && pos2 && pos1.distanceTo(pos2) < 4.8) {
            laserPoints.push(pos1, pos2);
          }
        }
      });
    });

    if (laserPoints.length > 0) {
      const laserGeo = new THREE.BufferGeometry().setFromPoints(laserPoints);
      const laserMat = new THREE.LineBasicMaterial({
        color: '#ec4899',
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending
      });
      const laserLines = new THREE.LineSegments(laserGeo, laserMat);
      orbGroup.add(laserLines);
    }

    // 7. Pointer Raycasting & Drag Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerMove = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDraggingRef.current) {
        const deltaX = event.clientX - previousMousePosition.current.x;
        const deltaY = event.clientY - previousMousePosition.current.y;

        targetRotationRef.current.y += deltaX * 0.004;
        targetRotationRef.current.x += deltaY * 0.004;

        previousMousePosition.current = { x: event.clientX, y: event.clientY };
        return;
      }

      // Raycast check
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeMeshes);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        const hitPred = hitMesh.userData.pred as OraclePredictionItem;

        renderer.domElement.style.cursor = 'pointer';

        if (hoveredNodeRef.current?.id !== hitPred.id) {
          hoveredNodeRef.current = hitPred;
          oracleAudio.playHover();
        }

        // Project 3D node coordinates to 2D screen coordinates for Spatial Badge
        const worldPos = new THREE.Vector3();
        hitMesh.getWorldPosition(worldPos);
        const screenPos = worldPos.clone().project(camera);

        const badgeX = ((screenPos.x + 1) * rect.width) / 2;
        const badgeY = ((-screenPos.y + 1) * rect.height) / 2;

        setBadgeInfo({
          x: badgeX,
          y: badgeY,
          title: hitPred.title,
          category: hitPred.therapeuticAreas?.[0] || 'AI Stream',
          confidence: hitPred.predictionConfidence || 85,
          visible: true
        });

      } else {
        renderer.domElement.style.cursor = isDraggingRef.current ? 'grabbing' : 'grab';
        hoveredNodeRef.current = null;
        setBadgeInfo(null);
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      isDraggingRef.current = true;
      previousMousePosition.current = { x: event.clientX, y: event.clientY };
      renderer.domElement.style.cursor = 'grabbing';
    };

    const onPointerUp = (event: PointerEvent) => {
      isDraggingRef.current = false;
      renderer.domElement.style.cursor = 'grab';

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeMeshes);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        const selected = hitMesh.userData.pred as OraclePredictionItem;

        oracleAudio.playSelectNode();
        onSelectPrediction(selected);

        // Smooth camera lerp target position towards node
        const worldPos = new THREE.Vector3();
        hitMesh.getWorldPosition(worldPos);
        cameraTargetPosRef.current.copy(worldPos).normalize().multiplyScalar(6.5);
        cameraLookAtTargetRef.current.copy(worldPos).multiplyScalar(0.4);
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointermove', onPointerMove);
    dom.addEventListener('pointerdown', onPointerDown);
    dom.addEventListener('pointerup', onPointerUp);

    // 8. Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Shader Uniform Time Update
      orbShaderMat.uniforms.uTime.value = elapsedTime;

      // Pulsate Inner Core
      const pulseScale = 1.0 + Math.sin(elapsedTime * 2.5) * 0.1;
      coreMesh.scale.set(pulseScale, pulseScale, pulseScale);

      // Rotate Tech Rings
      ring1.rotation.z = elapsedTime * 0.15;
      ring2.rotation.z = -elapsedTime * 0.2;
      ring3.rotation.x = elapsedTime * 0.12;

      // Auto Orbit & Drag Interpolation
      if (isAutoRotate && !isDraggingRef.current) {
        targetRotationRef.current.y += 0.0015;
      }

      orbGroup.rotation.y += (targetRotationRef.current.y - orbGroup.rotation.y) * 0.05;
      orbGroup.rotation.x += (targetRotationRef.current.x - orbGroup.rotation.x) * 0.05;

      // Animate Particles
      const positions = particleGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        const meta = particleMeta[i];
        meta.theta += meta.speed * 0.008;

        const x = meta.r * Math.sin(meta.phi) * Math.cos(meta.theta);
        const y = meta.r * Math.sin(meta.phi) * Math.sin(meta.theta);
        const z = meta.r * Math.cos(meta.phi);

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
      }
      particleGeo.attributes.position.needsUpdate = true;

      // Camera Position & LookAt Lerp
      camera.position.lerp(cameraTargetPosRef.current, 0.04);
      camera.lookAt(cameraLookAtTargetRef.current);

      // Node highlighting
      nodeMeshes.forEach((mesh) => {
        const aura = mesh.children[0];
        if (aura) aura.lookAt(camera.position);

        const isSelected = mesh.userData.pred.id === selectedId;
        const isHovered = hoveredNodeRef.current?.id === mesh.userData.pred.id;

        if (isSelected || isHovered) {
          mesh.scale.set(1.4, 1.4, 1.4);
          (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.3;
        } else {
          mesh.scale.set(1, 1, 1);
          (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.7;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize Handler
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

      orbGeo.dispose();
      orbShaderMat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();

      renderer.dispose();
      if (mountRef.current && dom.parentNode === mountRef.current) {
        mountRef.current.removeChild(dom);
      }
    };
  }, [predictions, selectedId, onSelectPrediction, isAutoRotate]);

  // Reset Camera Target Signal Handler
  useEffect(() => {
    if (resetCameraSignal > 0) {
      cameraTargetPosRef.current.set(0, 0, 8.5);
      cameraLookAtTargetRef.current.set(0, 0, 0);
    }
  }, [resetCameraSignal]);

  return (
    <div className="relative w-full h-full min-h-screen bg-slate-950 overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="w-full h-full min-h-screen cursor-grab active:cursor-grabbing" />

      {/* Floating Spatial 2D Tooltip Badge */}
      {badgeInfo && badgeInfo.visible && (
        <div
          className="pointer-events-none fixed z-40 transform -translate-x-1/2 -translate-y-full mb-3 px-3 py-2 bg-slate-950/90 backdrop-blur-xl border border-pink-500/50 rounded-xl shadow-2xl space-y-0.5 text-white max-w-xs animate-fadeIn"
          style={{ left: badgeInfo.x, top: badgeInfo.y }}
        >
          <div className="flex items-center gap-1.5 text-[9px] font-extrabold text-pink-400 uppercase tracking-widest">
            <span>{badgeInfo.category}</span>
            <span>•</span>
            <span className="text-emerald-400">{badgeInfo.confidence}% Confidence</span>
          </div>
          <p className="text-xs font-black uppercase text-slate-100 leading-tight">
            {badgeInfo.title}
          </p>
        </div>
      )}
    </div>
  );
}
