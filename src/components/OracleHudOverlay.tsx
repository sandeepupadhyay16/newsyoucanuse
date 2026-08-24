'use client';

import React from 'react';
import { 
  Sparkles, 
  Layers, 
  Search, 
  Volume2, 
  VolumeX, 
  SlidersHorizontal, 
  ChevronLeft, 
  ChevronRight, 
  Zap, 
  ShieldCheck,
  Clock,
  Play,
  Pause,
  FileText,
  X
} from 'lucide-react';

export type TimeHorizonType = 'all' | 'short' | 'medium' | 'long';

interface OracleHudOverlayProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  minConfidence: number;
  onConfidenceChange: (val: number) => void;
  isMuted: boolean;
  onToggleSound: () => void;
  viewMode: 'mindmap' | 'list';
  onToggleViewMode: (mode: 'mindmap' | 'list') => void;
  nodeCount: number;
  onSelectNext: () => void;
  onSelectPrev: () => void;
  
  // New Readability & Temporal Controls
  activeHorizon: TimeHorizonType;
  onChangeHorizon: (horizon: TimeHorizonType) => void;
  focusedStream: string | null;
  onResetFocus: () => void;
  isTourActive: boolean;
  onToggleTour: () => void;
  onOpenExecutiveBrief: () => void;
}

const horizonStages: Array<{ id: TimeHorizonType; label: string; sub: string; range: string; color: string }> = [
  { id: 'all', label: 'All Horizons', sub: 'Holistic View', range: '2025 - 2028+', color: '#6366f1' },
  { id: 'short', label: 'Horizon 1 (0-6m)', sub: 'Emerging Pilots', range: 'Next 6 Months', color: '#10b981' },
  { id: 'medium', label: 'Horizon 2 (6-18m)', sub: 'Pipeline Scaling', range: '6 - 18 Months', color: '#0284c7' },
  { id: 'long', label: 'Horizon 3 (18-36m+)', sub: 'Paradigm Shift', range: '18 - 36+ Months', color: '#8b5cf6' }
];

export default function OracleHudOverlay({
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  minConfidence,
  onConfidenceChange,
  isMuted,
  onToggleSound,
  viewMode,
  onToggleViewMode,
  nodeCount,
  onSelectNext,
  onSelectPrev,
  activeHorizon,
  onChangeHorizon,
  focusedStream,
  onResetFocus,
  isTourActive,
  onToggleTour,
  onOpenExecutiveBrief
}: OracleHudOverlayProps) {
  return (
    <>
      {/* Top Floating Navigation Header HUD */}
      <div className="absolute top-4 left-4 right-4 z-40 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 pointer-events-none">
        
        {/* Left Brand, Search, & Breadcrumb Navigation */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto bg-white/90 backdrop-blur-xl border border-slate-200/90 p-2 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-200/60 rounded-xl text-indigo-700">
            <Zap size={13} className="text-indigo-600" />
            <span className="text-[10px] font-black uppercase tracking-widest">AI ORACLE MAP</span>
          </div>

          {/* Stream Focus Breadcrumb */}
          {focusedStream ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase shadow-xs animate-fadeIn">
              <span className="text-slate-400">Stream:</span>
              <span>{focusedStream}</span>
              <button 
                onClick={onResetFocus} 
                className="ml-1 hover:text-rose-400 transition-colors cursor-pointer"
                title="Exit Stream Focus"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <span className="px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-[9px] font-bold text-slate-700 uppercase flex items-center gap-1">
              <ShieldCheck size={11} className="text-emerald-600" />
              {nodeCount} Nodes
            </span>
          )}

          {/* Search Box */}
          <div className="relative flex items-center min-w-[150px] md:min-w-[190px]">
            <Search size={13} className="absolute left-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search predictions..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium"
            />
          </div>
        </div>

        {/* Center Stream Category Filters */}
        <div className="flex items-center gap-1 pointer-events-auto bg-white/90 backdrop-blur-xl border border-slate-200/90 p-1.5 rounded-2xl shadow-sm overflow-x-auto custom-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Right Actions & View Switcher */}
        <div className="flex items-center gap-2 pointer-events-auto bg-white/90 backdrop-blur-xl border border-slate-200/90 p-1.5 rounded-2xl shadow-sm">
          
          {/* Executive Brief Button */}
          <button
            onClick={onOpenExecutiveBrief}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            title="Open Executive Synthesis Brief"
          >
            <FileText size={12} className="text-indigo-600" />
            <span>Executive Brief</span>
          </button>

          {/* Confidence Slider */}
          <div className="hidden 2xl:flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-xl border border-slate-200">
            <SlidersHorizontal size={11} className="text-slate-400" />
            <span className="text-[9px] font-bold text-slate-500 uppercase">Min:</span>
            <input
              type="range"
              min="0"
              max="90"
              step="10"
              value={minConfidence}
              onChange={(e) => onConfidenceChange(Number(e.target.value))}
              className="w-16 accent-indigo-600 cursor-pointer"
            />
            <span className="text-[10px] font-bold text-slate-800 w-6">{minConfidence}%</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isMuted
                ? 'bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-600'
                : 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-xs'
            }`}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => onToggleViewMode('mindmap')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'mindmap'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles size={11} className="text-indigo-600" />
              <span>Mind Map</span>
            </button>

            <button
              onClick={() => onToggleViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers size={11} />
              <span>Roadmap</span>
            </button>
          </div>
        </div>

      </div>

      {/* Floating Bottom Time Horizon Scrubber Bar (Interactive Timeline Slider) */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-40 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-white/95 backdrop-blur-xl border border-slate-200/95 p-2 rounded-3xl shadow-xl">
          
          {/* Time Horizon Slider Label */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-wider text-slate-700 border border-slate-200">
            <Clock size={13} className="text-indigo-600" />
            <span>Time Horizon:</span>
          </div>

          {/* 4 Interactive Discrete Horizon Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200">
            {horizonStages.map((stage) => {
              const isActive = activeHorizon === stage.id;
              return (
                <button
                  key={stage.id}
                  onClick={() => onChangeHorizon(stage.id)}
                  className={`px-3.5 py-2 rounded-xl text-left transition-all cursor-pointer relative ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-md ring-1 ring-slate-900/10'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: stage.color }}
                    />
                    <span className="text-[11px] font-black uppercase tracking-wide block">
                      {stage.label}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 block pl-3.5">
                    {stage.sub}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Guided Tour / Presentation Autoplay Button */}
          <button
            onClick={onToggleTour}
            className={`px-3 py-2 rounded-2xl border text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
              isTourActive
                ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse'
                : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700'
            }`}
            title={isTourActive ? 'Pause Guided Tour' : 'Start Automated Guided Tour'}
          >
            {isTourActive ? <Pause size={13} /> : <Play size={13} />}
            <span>{isTourActive ? 'Tour Active' : 'Start Tour'}</span>
          </button>
        </div>
      </div>

      {/* Bottom Right Floating Quick Step Navigation HUD */}
      {viewMode === 'mindmap' && (
        <div className="absolute bottom-6 right-6 z-40 flex items-center gap-2 pointer-events-auto bg-white/90 backdrop-blur-xl border border-slate-200 p-1.5 rounded-2xl shadow-sm">
          <button
            onClick={onSelectPrev}
            className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 hover:text-slate-900 transition-all cursor-pointer"
            title="Previous Prediction Node"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="px-2.5 py-1 text-[10px] font-bold text-slate-700 uppercase">
            Step Nodes
          </span>

          <button
            onClick={onSelectNext}
            className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 hover:text-slate-900 transition-all cursor-pointer"
            title="Next Prediction Node"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </>
  );
}
