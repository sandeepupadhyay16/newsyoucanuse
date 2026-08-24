'use client';

import React, { useState, useRef, useMemo } from 'react';
import { oracleAudio } from './OracleAudioEngine';
import { OraclePredictionItem } from './OracleDetailsPanel';
import { TimeHorizonType } from './OracleHudOverlay';
import { 
  Sparkles, 
  Cpu, 
  Workflow, 
  Compass, 
  Code2, 
  TrendingUp, 
  Zap, 
  ChevronRight,
  Maximize2,
  ZoomIn,
  ZoomOut,
  FileText,
  Plus,
  Minus
} from 'lucide-react';

interface OracleMindMapCanvasProps {
  predictions: OraclePredictionItem[];
  selectedId: string | null;
  onSelectPrediction: (prediction: OraclePredictionItem) => void;
  searchQuery?: string;
  selectedCategory?: string;
  
  // Readability & Temporal Props
  activeHorizon?: TimeHorizonType;
  focusedStream?: string | null;
  onFocusStream?: (stream: string | null) => void;
  onOpenExecutiveBrief?: () => void;
  isTourActive?: boolean;
}

// Minimalist Stream Visual Configuration
const streamConfig: Record<string, { color: string; bg: string; border: string; icon: any; shortName: string }> = {
  'Frontier Model Capabilities': { color: '#e11d48', bg: 'bg-rose-50 text-rose-600', border: 'border-rose-200', icon: Sparkles, shortName: 'Frontier Models' },
  'Model-on-Chip Advancements': { color: '#0284c7', bg: 'bg-sky-50 text-sky-600', border: 'border-sky-200', icon: Cpu, shortName: 'Model-on-Chip' },
  'Agentic Architectures': { color: '#059669', bg: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-200', icon: Workflow, shortName: 'Agentic Arch' },
  'Ways of Working': { color: '#d97706', bg: 'bg-amber-50 text-amber-600', border: 'border-amber-200', icon: Compass, shortName: 'Ways of Working' },
  'Development Frameworks': { color: '#7c3aed', bg: 'bg-violet-50 text-violet-600', border: 'border-violet-200', icon: Code2, shortName: 'Dev Frameworks' }
};

export default function OracleMindMapCanvas({
  predictions,
  selectedId,
  onSelectPrediction,
  searchQuery = '',
  selectedCategory = 'All',
  activeHorizon = 'all',
  focusedStream: _focusedStream = null,
  onFocusStream,
  onOpenExecutiveBrief,
  isTourActive: _isTourActive = false
}: OracleMindMapCanvasProps) {
  // Pan & Zoom Stage State
  const [zoom, setZoom] = useState<number>(0.85);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredStream, setHoveredStream] = useState<string | null>(null);

  // Manual Stream Expansion State (default all streams expanded)
  const [expandedStreams, setExpandedStreams] = useState<Record<string, boolean>>({
    'Frontier Model Capabilities': true,
    'Model-on-Chip Advancements': true,
    'Agentic Architectures': true,
    'Ways of Working': true,
    'Development Frameworks': true
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Toggle stream expansion
  const toggleStreamExpand = (streamKey: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedStreams(prev => ({
      ...prev,
      [streamKey]: !prev[streamKey]
    }));
    oracleAudio.playHover();
  };

  // Group predictions by stream category and horizon
  const categorizedData = useMemo(() => {
    const groups: Record<string, {
      all: OraclePredictionItem[];
      short: OraclePredictionItem[];
      medium: OraclePredictionItem[];
      long: OraclePredictionItem[];
    }> = {
      'Frontier Model Capabilities': { all: [], short: [], medium: [], long: [] },
      'Model-on-Chip Advancements': { all: [], short: [], medium: [], long: [] },
      'Agentic Architectures': { all: [], short: [], medium: [], long: [] },
      'Ways of Working': { all: [], short: [], medium: [], long: [] },
      'Development Frameworks': { all: [], short: [], medium: [], long: [] }
    };

    predictions.forEach((p, idx) => {
      const cat = p.therapeuticAreas?.[0] || 'Frontier Model Capabilities';
      const targetGroup = groups[cat] || groups['Frontier Model Capabilities'];

      targetGroup.all.push(p);

      // Distribute into 3 horizons
      if (idx % 3 === 0) {
        targetGroup.short.push(p);
      } else if (idx % 3 === 1) {
        targetGroup.medium.push(p);
      } else {
        targetGroup.long.push(p);
      }
    });

    return groups;
  }, [predictions]);

  // Zero-Clutter Radial Mind Map Layout Math
  const mindMapGraph = useMemo(() => {
    const streamKeys = Object.keys(categorizedData);
    const center = { x: 0, y: 0 };
    const streamHubs: Array<{ key: string; x: number; y: number; angle: number; isExpanded: boolean; activeCount: number }> = [];
    const childNodes: Array<{
      item: OraclePredictionItem;
      x: number;
      y: number;
      streamKey: string;
      horizonLabel: string;
      horizonColor: string;
      parentHubX: number;
      parentHubY: number;
    }> = [];

    const streamRadius = 320; // Radius of 5 Parent Stream nodes from center

    streamKeys.forEach((key, sIdx) => {
      // 5 Parent Stream hubs evenly spaced radially
      const angle = (sIdx / streamKeys.length) * Math.PI * 2 - Math.PI / 2;
      const hubX = Math.cos(angle) * streamRadius;
      const hubY = Math.sin(angle) * streamRadius;

      const streamObj = categorizedData[key];
      
      // Determine which nodes are active for the current time horizon
      let activeItems: OraclePredictionItem[] = [];
      if (activeHorizon === 'short') {
        activeItems = streamObj.short.slice(0, 3);
      } else if (activeHorizon === 'medium') {
        activeItems = streamObj.medium.slice(0, 3);
      } else if (activeHorizon === 'long') {
        activeItems = streamObj.long.slice(0, 3);
      } else {
        // 'all' horizon: show 1 key representative node from each of the 3 horizons (3 total per stream)
        activeItems = [
          ...(streamObj.short[0] ? [streamObj.short[0]] : []),
          ...(streamObj.medium[0] ? [streamObj.medium[0]] : []),
          ...(streamObj.long[0] ? [streamObj.long[0]] : [])
        ];
      }

      const isExpanded = expandedStreams[key] !== false;
      streamHubs.push({
        key,
        x: hubX,
        y: hubY,
        angle,
        isExpanded,
        activeCount: activeItems.length
      });

      // If branch is expanded, place child nodes cleanly radiating outward from this stream hub
      if (isExpanded && (selectedCategory === 'All' || selectedCategory === key)) {
        const count = activeItems.length;
        const branchSpread = count > 1 ? Math.PI * 0.45 : 0;
        const branchDist = 260; // Distance of child capsule from stream hub

        activeItems.forEach((item, cIdx) => {
          let childAngle = angle;
          if (count > 1) {
            const step = branchSpread / (count - 1);
            childAngle = angle - branchSpread / 2 + cIdx * step;
          }

          const childX = hubX + Math.cos(childAngle) * branchDist;
          const childY = hubY + Math.sin(childAngle) * branchDist;

          let horizonLabel = 'Horizon 1';
          let horizonColor = '#10b981';
          if (activeHorizon === 'medium' || (activeHorizon === 'all' && cIdx === 1)) {
            horizonLabel = 'Horizon 2';
            horizonColor = '#0284c7';
          } else if (activeHorizon === 'long' || (activeHorizon === 'all' && cIdx === 2)) {
            horizonLabel = 'Horizon 3';
            horizonColor = '#8b5cf6';
          }

          childNodes.push({
            item,
            x: childX,
            y: childY,
            streamKey: key,
            horizonLabel,
            horizonColor,
            parentHubX: hubX,
            parentHubY: hubY
          });
        });
      }
    });

    return { center, streamHubs, childNodes };
  }, [categorizedData, activeHorizon, expandedStreams, selectedCategory]);

  // Center on Oracle Core
  const handleResetToCore = () => {
    onFocusStream?.(null);
    setPan({ x: 0, y: 0 });
    setZoom(0.85);
    oracleAudio.playHover();
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom(prev => Math.max(0.35, Math.min(1.8, prev * zoomFactor)));
  };

  // Drag panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.interactive-node')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mini-map click to pan
  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width - 0.5;
    const clickY = (e.clientY - rect.top) / rect.height - 0.5;

    const targetPanX = -clickX * 1800 * zoom;
    const targetPanY = -clickY * 1800 * zoom;
    setPan({ x: targetPanX, y: targetPanY });
  };

  // Oracle Core dynamic text for active horizon
  const coreHorizonInfo = useMemo(() => {
    switch (activeHorizon) {
      case 'short':
        return {
          title: 'AI ORACLE CORE',
          horizon: 'Horizon 1 (0-6m)',
          subtitle: 'Emergence & Pilots',
          accent: '#10b981'
        };
      case 'medium':
        return {
          title: 'AI ORACLE CORE',
          horizon: 'Horizon 2 (6-18m)',
          subtitle: 'Toolchain Scaling',
          accent: '#0284c7'
        };
      case 'long':
        return {
          title: 'AI ORACLE CORE',
          horizon: 'Horizon 3 (18-36m+)',
          subtitle: 'Autonomous Systems',
          accent: '#8b5cf6'
        };
      default:
        return {
          title: 'AI ORACLE CORE',
          horizon: 'All Horizons',
          subtitle: '3-Year Strategic Vision',
          accent: '#6366f1'
        };
    }
  }, [activeHorizon]);

  return (
    <div 
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="relative w-full h-full min-h-screen bg-[#fcfbf9] overflow-hidden cursor-grab active:cursor-grabbing select-none"
    >
      {/* Subtle Warm Minimalist Dot Pattern Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] pointer-events-none" />

      {/* SVG Connections & HTML Mind Map Stage */}
      <div 
        className="w-full h-full flex items-center justify-center transition-transform duration-100 ease-out"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
        }}
      >
        <div className="relative w-0 h-0">

          {/* SVG Smooth Bezier Connector Lines */}
          <svg className="absolute overflow-visible pointer-events-none" style={{ left: 0, top: 0 }}>
            
            {/* Core -> Parent Stream lines */}
            {mindMapGraph.streamHubs.map(hub => {
              const cfg = streamConfig[hub.key] || streamConfig['Frontier Model Capabilities'];
              const isMatch = selectedCategory === 'All' || selectedCategory === hub.key;
              const isHovered = hoveredStream === hub.key;

              return (
                <g key={`core-${hub.key}`}>
                  <path
                    d={`M 0 0 Q ${hub.x * 0.4} ${hub.y * 0.4}, ${hub.x} ${hub.y}`}
                    fill="none"
                    stroke={isHovered || isMatch ? cfg.color : '#cbd5e1'}
                    strokeWidth={isHovered ? 3.5 : isMatch ? 2.5 : 1.5}
                    strokeOpacity={isMatch ? 0.9 : 0.4}
                  />
                </g>
              );
            })}

            {/* Parent Stream -> Child Forecast Node lines */}
            {mindMapGraph.childNodes.map(node => {
              const cfg = streamConfig[node.streamKey] || streamConfig['Frontier Model Capabilities'];
              const isSelected = selectedId === node.item.id;
              const isHovered = hoveredNodeId === node.item.id;

              return (
                <g key={`branch-${node.item.id}`}>
                  <path
                    d={`M ${node.parentHubX} ${node.parentHubY} C ${node.parentHubX + (node.x - node.parentHubX) * 0.5} ${node.parentHubY}, ${node.parentHubX + (node.x - node.parentHubX) * 0.3} ${node.y}, ${node.x} ${node.y}`}
                    fill="none"
                    stroke={isSelected || isHovered ? cfg.color : '#cbd5e1'}
                    strokeWidth={isSelected ? 3 : isHovered ? 2.5 : 1.5}
                    strokeOpacity={isSelected || isHovered ? 0.95 : 0.6}
                  />
                </g>
              );
            })}
          </svg>

          {/* Central Adaptive AI Oracle Core Hub */}
          <div className="interactive-node absolute transform -translate-x-1/2 -translate-y-1/2 z-30">
            <div 
              onClick={handleResetToCore}
              className="relative p-5 bg-white border-2 border-slate-900 rounded-3xl shadow-xl flex flex-col items-center justify-center text-center w-48 min-h-32 group cursor-pointer hover:scale-105 transition-all duration-300 ring-4 ring-indigo-500/10"
            >
              <div 
                className="p-2 rounded-2xl mb-1.5 transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${coreHorizonInfo.accent}15`, color: coreHorizonInfo.accent }}
              >
                <Zap size={22} />
              </div>
              <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest leading-none">
                {coreHorizonInfo.title}
              </span>
              <span 
                className="text-[9px] font-black uppercase tracking-wider mt-1 px-2 py-0.5 rounded-md"
                style={{ color: coreHorizonInfo.accent, backgroundColor: `${coreHorizonInfo.accent}15` }}
              >
                {coreHorizonInfo.horizon}
              </span>
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                {coreHorizonInfo.subtitle}
              </span>

              {/* Executive Brief Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenExecutiveBrief?.();
                }}
                className="mt-2.5 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs transition-all"
              >
                <FileText size={10} />
                <span>Executive Brief</span>
              </button>
            </div>
          </div>

          {/* Level 1: 5 Parent Stream Hub Nodes */}
          {mindMapGraph.streamHubs.map(hub => {
            const cfg = streamConfig[hub.key] || streamConfig['Frontier Model Capabilities'];
            const Icon = cfg.icon;
            const isMatch = selectedCategory === 'All' || selectedCategory === hub.key;

            return (
              <div
                key={hub.key}
                style={{ left: hub.x, top: hub.y }}
                onMouseEnter={() => setHoveredStream(hub.key)}
                onMouseLeave={() => setHoveredStream(null)}
                className={`interactive-node absolute transform -translate-x-1/2 -translate-y-1/2 z-20 transition-all duration-300 ${
                  isMatch ? 'opacity-100 scale-100' : 'opacity-40 scale-95'
                }`}
              >
                <div 
                  className={`px-4 py-2.5 bg-white border-2 ${cfg.border} rounded-2xl shadow-md flex items-center gap-3 hover:shadow-lg hover:scale-105 transition-all`}
                  style={{ borderLeftColor: cfg.color, borderLeftWidth: '5px' }}
                >
                  <div className={`p-2 rounded-xl ${cfg.bg}`}>
                    <Icon size={18} />
                  </div>
                  
                  <div className="space-y-0.5 text-left">
                    <span className="text-[11px] font-black uppercase text-slate-900 tracking-wider block">
                      {cfg.shortName}
                    </span>
                    <span className="text-[9px] font-bold text-slate-500 block">
                      {hub.activeCount} Active Nodes
                    </span>
                  </div>

                  {/* +/- Collapse / Expand Toggle Button */}
                  <button
                    onClick={(e) => toggleStreamExpand(hub.key, e)}
                    className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer ml-1"
                    title={hub.isExpanded ? 'Collapse Branch' : 'Expand Branch'}
                  >
                    {hub.isExpanded ? <Minus size={12} /> : <Plus size={12} />}
                  </button>
                </div>
              </div>
            );
          })}

          {/* Level 2: Compact Mind Map Child Forecast Capsules */}
          {mindMapGraph.childNodes.map(node => {
            const cfg = streamConfig[node.streamKey] || streamConfig['Frontier Model Capabilities'];
            const isSelected = selectedId === node.item.id;
            const isHovered = hoveredNodeId === node.item.id;

            // Search query matching
            const matchSearch = !searchQuery || 
              node.item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
              (node.item.problemStatement && node.item.problemStatement.toLowerCase().includes(searchQuery.toLowerCase()));

            if (!matchSearch) return null;

            return (
              <div
                key={node.item.id}
                style={{ left: node.x, top: node.y }}
                onMouseEnter={() => setHoveredNodeId(node.item.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  oracleAudio.playSelectNode();
                  onSelectPrediction(node.item);
                }}
                className="interactive-node absolute transform -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer transition-all duration-300"
              >
                <div 
                  className={`w-64 p-3 bg-white border rounded-2xl shadow-xs space-y-1.5 transition-all hover:scale-105 ${
                    isSelected 
                      ? 'border-indigo-600 shadow-xl ring-2 ring-indigo-500/20 scale-105' 
                      : isHovered
                      ? 'border-slate-400 shadow-md scale-102'
                      : 'border-slate-200/90 hover:border-slate-300'
                  }`}
                  style={{ borderLeftColor: cfg.color, borderLeftWidth: '4px' }}
                >
                  {/* Top Capsule Row */}
                  <div className="flex items-center justify-between text-[8px] font-black uppercase">
                    <span 
                      className="px-1.5 py-0.5 rounded"
                      style={{ color: node.horizonColor, backgroundColor: `${node.horizonColor}15` }}
                    >
                      {node.horizonLabel}
                    </span>
                    <span className="text-slate-600 font-bold">
                      {node.item.predictionConfidence || 85}% Certainty
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="font-extrabold text-[11px] uppercase text-slate-900 leading-snug line-clamp-2">
                    {node.item.title}
                  </h4>

                  {/* Bottom Trajectory Row */}
                  <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[8px] font-bold text-slate-500">
                    <span className="flex items-center gap-1 text-slate-700">
                      <TrendingUp size={10} className="text-indigo-600" />
                      {node.item.trajectoryPrediction || 'Accelerating'}
                    </span>
                    <span className="flex items-center gap-0.5 text-indigo-600 font-bold">
                      Details <ChevronRight size={9} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

        </div>
      </div>

      {/* Floating Canvas Stage Controls & Mini-Map (Bottom Left) */}
      <div className="absolute bottom-6 left-6 z-40 flex flex-col gap-3 pointer-events-auto">
        
        {/* Interactive Mini-Map Radar */}
        <div 
          onClick={handleMinimapClick}
          className="w-32 h-32 bg-white/95 backdrop-blur-xl border border-slate-200 p-2 rounded-2xl shadow-lg relative overflow-hidden cursor-crosshair group"
          title="Click mini-map to pan directly"
        >
          <div className="absolute top-2 left-2 text-[8px] font-black text-slate-400 uppercase tracking-wider">
            Radar
          </div>

          <div className="w-full h-full relative flex items-center justify-center">
            {/* Center Oracle Dot */}
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 absolute" />

            {/* 5 Stream Hub Dots */}
            {mindMapGraph.streamHubs.map(hub => {
              const cfg = streamConfig[hub.key] || streamConfig['Frontier Model Capabilities'];
              const miniX = (hub.x / 1000) * 80;
              const miniY = (hub.y / 1000) * 80;

              return (
                <div
                  key={`mini-${hub.key}`}
                  style={{
                    transform: `translate(${miniX}px, ${miniY}px)`,
                    backgroundColor: cfg.color
                  }}
                  className="w-2 h-2 rounded-full absolute ring-2 ring-white"
                />
              );
            })}

            {/* Viewport Box */}
            <div 
              style={{
                transform: `translate(${-pan.x / 25}px, ${-pan.y / 25}px) scale(${1 / zoom})`,
                width: '35px',
                height: '25px'
              }}
              className="border-2 border-indigo-600/80 bg-indigo-500/10 rounded pointer-events-none transition-all duration-75"
            />
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-xl border border-slate-200 p-1.5 rounded-2xl shadow-sm">
          <button
            onClick={() => setZoom(prev => Math.min(1.8, prev * 1.15))}
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded-xl border border-slate-200 transition-all cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn size={15} />
          </button>

          <button
            onClick={() => setZoom(prev => Math.max(0.35, prev * 0.85))}
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded-xl border border-slate-200 transition-all cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut size={15} />
          </button>

          <button
            onClick={handleResetToCore}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded-xl border border-slate-200 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
            title="Reset View to Oracle Core"
          >
            <Maximize2 size={13} />
            <span>Reset View</span>
          </button>
        </div>
      </div>
    </div>
  );
}
