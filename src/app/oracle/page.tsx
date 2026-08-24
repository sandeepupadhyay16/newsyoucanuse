'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { usePersona } from '@/components/ClientWrapper';
import { 
  TrendingUp, 
  Sparkles, 
  Layers, 
  Cpu, 
  Workflow, 
  Compass, 
  Code2, 
  Loader2, 
  X,
  Filter,
  SlidersHorizontal,
  Zap,
  Globe
} from 'lucide-react';
import OracleMindMapCanvas from '@/components/OracleMindMapCanvas';
import OracleDetailsDrawer from '@/components/OracleDetailsDrawer';
import OracleHudOverlay, { TimeHorizonType } from '@/components/OracleHudOverlay';
import OracleExecutiveBriefModal from '@/components/OracleExecutiveBriefModal';
import { OraclePredictionItem } from '@/components/OracleDetailsPanel';
import { oracleAudio } from '@/components/OracleAudioEngine';

export default function OraclePage() {
  const { currentPersona } = usePersona();
  const [predictions, setPredictions] = useState<OraclePredictionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPredict, setSelectedPredict] = useState<OraclePredictionItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'mindmap' | 'list'>('mindmap');

  // HUD Filters State
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [minConfidence, setMinConfidence] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // New Readability & Temporal State
  const [activeHorizon, setActiveHorizon] = useState<TimeHorizonType>('all');
  const [focusedStream, setFocusedStream] = useState<string | null>(null);
  const [isTourActive, setIsTourActive] = useState<boolean>(false);
  const [isBriefModalOpen, setIsBriefModalOpen] = useState<boolean>(false);

  const streamsIcons: Record<string, any> = {
    'Frontier Model Capabilities': Sparkles,
    'Model-on-Chip Advancements': Cpu,
    'Agentic Architectures': Workflow,
    'Ways of Working': Compass,
    'Development Frameworks': Code2
  };

  const categories = [
    'All',
    'Frontier Model Capabilities',
    'Model-on-Chip Advancements',
    'Agentic Architectures',
    'Ways of Working',
    'Development Frameworks'
  ];

  useEffect(() => {
    setLoading(true);
    fetch('/api/projects?excludePhase=Draft')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPredictions(data);
          if (data.length > 0) {
            setSelectedPredict(data[0]);
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch predictions:', err);
        setLoading(false);
      });
  }, []);

  // Filter predictions by stream category, search query, & min confidence
  const filteredPredictions = useMemo(() => {
    return predictions.filter(p => {
      const matchCat = selectedCategory === 'All' || (p.therapeuticAreas && p.therapeuticAreas.includes(selectedCategory));
      const matchFocus = !focusedStream || (p.therapeuticAreas && p.therapeuticAreas.includes(focusedStream));
      const matchSearch = !searchQuery || 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (p.problemStatement && p.problemStatement.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchConf = (p.predictionConfidence || 0) >= minConfidence;
      return matchCat && matchFocus && matchSearch && matchConf;
    });
  }, [predictions, selectedCategory, focusedStream, searchQuery, minConfidence]);

  // Guided Tour Mode Interval Timer
  useEffect(() => {
    if (!isTourActive || filteredPredictions.length === 0) return;

    const interval = setInterval(() => {
      setSelectedPredict(prev => {
        const currentIndex = filteredPredictions.findIndex(p => p.id === prev?.id);
        const nextIndex = (currentIndex + 1) % filteredPredictions.length;
        const nextPred = filteredPredictions[nextIndex];
        oracleAudio.playSelectNode();
        return nextPred;
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [isTourActive, filteredPredictions]);

  const handleSelectPrediction = (pred: OraclePredictionItem) => {
    setSelectedPredict(pred);
    setIsDrawerOpen(true);
  };

  const handleSelectNext = () => {
    if (filteredPredictions.length === 0) return;
    const currentIndex = filteredPredictions.findIndex(p => p.id === selectedPredict?.id);
    const nextIndex = (currentIndex + 1) % filteredPredictions.length;
    const nextPred = filteredPredictions[nextIndex];
    setSelectedPredict(nextPred);
    setIsDrawerOpen(true);
    oracleAudio.playSelectNode();
  };

  const handleSelectPrev = () => {
    if (filteredPredictions.length === 0) return;
    const currentIndex = filteredPredictions.findIndex(p => p.id === selectedPredict?.id);
    const prevIndex = (currentIndex - 1 + filteredPredictions.length) % filteredPredictions.length;
    const prevPred = filteredPredictions[prevIndex];
    setSelectedPredict(prevPred);
    setIsDrawerOpen(true);
    oracleAudio.playSelectNode();
  };

  const toggleSound = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    oracleAudio.setMuted(nextState);
    if (!nextState) oracleAudio.playHover();
  };

  const handleHorizonChange = (horizon: TimeHorizonType) => {
    setActiveHorizon(horizon);
    oracleAudio.playModeSwitch();
  };

  const getTimelineContent = (pred: OraclePredictionItem) => {
    try {
      if (pred.predictionsTimeline) {
        return JSON.parse(pred.predictionsTimeline);
      }
    } catch {}
    return {
      shortTerm: 'Local optimizations and small experimentations.',
      mediumTerm: 'Full integration in standard pipeline tools.',
      longTerm: 'Universal standard replacing legacy workflows.',
      trajectory: 'Accelerating'
    };
  };

  return (
    <div className="relative w-full h-full min-h-[calc(100vh-4rem)] overflow-hidden bg-[#fcfbf9] text-slate-900 font-sans">
      
      {/* HUD Controls Overlay */}
      <OracleHudOverlay 
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setFocusedStream(cat === 'All' ? null : cat);
          oracleAudio.playHover();
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        minConfidence={minConfidence}
        onConfidenceChange={setMinConfidence}
        isMuted={isMuted}
        onToggleSound={toggleSound}
        viewMode={viewMode}
        onToggleViewMode={(mode) => {
          setViewMode(mode);
          oracleAudio.playModeSwitch();
        }}
        nodeCount={filteredPredictions.length}
        onSelectNext={handleSelectNext}
        onSelectPrev={handleSelectPrev}
        activeHorizon={activeHorizon}
        onChangeHorizon={handleHorizonChange}
        focusedStream={focusedStream}
        onResetFocus={() => setFocusedStream(null)}
        isTourActive={isTourActive}
        onToggleTour={() => {
          const nextTour = !isTourActive;
          setIsTourActive(nextTour);
          if (nextTour) oracleAudio.playModeSwitch();
        }}
        onOpenExecutiveBrief={() => {
          setIsBriefModalOpen(true);
          oracleAudio.playSelectNode();
        }}
      />

      {/* Main Viewport Content */}
      {loading ? (
        <div className="w-full h-full flex flex-col items-center justify-center space-y-3 bg-[#fcfbf9] text-slate-900">
          <Loader2 size={36} className="animate-spin text-indigo-600" />
          <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">
            Loading Minimalist Oracle Mind Map...
          </span>
        </div>
      ) : filteredPredictions.length === 0 ? (
        <div className="w-full h-full flex flex-col items-center justify-center space-y-4 bg-[#fcfbf9] text-slate-900 p-6 text-center">
          <TrendingUp size={44} className="text-slate-300" />
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold uppercase text-slate-800">No Matching Forecast Nodes</h3>
            <p className="text-xs text-slate-500 max-w-xs">
              No forecasts found for your current search, time horizon, or stream filter.
            </p>
          </div>
          <button
            onClick={() => { 
              setSelectedCategory('All'); 
              setFocusedStream(null); 
              setSearchQuery(''); 
              setMinConfidence(0); 
              setActiveHorizon('all');
            }}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-slate-800"
          >
            Reset All Filters
          </button>
        </div>
      ) : viewMode === 'mindmap' ? (
        /* Full-Workspace Minimalist Mind Map Spatial Canvas */
        <div className="w-full h-full">
          <OracleMindMapCanvas 
            predictions={predictions}
            selectedId={selectedPredict?.id || null}
            onSelectPrediction={handleSelectPrediction}
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            activeHorizon={activeHorizon}
            focusedStream={focusedStream}
            onFocusStream={setFocusedStream}
            onOpenExecutiveBrief={() => setIsBriefModalOpen(true)}
            isTourActive={isTourActive}
          />
        </div>
      ) : (
        /* Minimalist List Roadmap Matrix */
        <div className="w-full h-full overflow-y-auto pt-28 px-6 pb-28 space-y-6 custom-scrollbar bg-[#fcfbf9]">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-lg font-black uppercase text-slate-950 tracking-wider flex items-center gap-2">
                  <Layers size={18} className="text-indigo-600" />
                  <span>Forecast Matrix Roadmap ({filteredPredictions.length})</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {activeHorizon === 'all' 
                    ? 'All 3-Year multi-horizon AI stream predictions'
                    : `Filtered to ${activeHorizon === 'short' ? 'Horizon 1 (0-6 Months)' : activeHorizon === 'medium' ? 'Horizon 2 (6-18 Months)' : 'Horizon 3 (18-36+ Months)'}`}
                </p>
              </div>

              <button
                onClick={() => setIsBriefModalOpen(true)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
              >
                View Executive Brief
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {filteredPredictions.map(pred => {
                const t = getTimelineContent(pred);
                const isSelected = selectedPredict?.id === pred.id;

                return (
                  <div
                    key={pred.id}
                    onClick={() => handleSelectPrediction(pred)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                      isSelected 
                        ? 'bg-white border-indigo-600 shadow-md ring-2 ring-indigo-500/20 text-slate-900' 
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-900 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase">
                      <span className="px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold">
                        {pred.therapeuticAreas?.[0] || 'AI Stream'}
                      </span>
                      <span className="text-emerald-700 font-bold">
                        {pred.predictionConfidence || 85}% Certainty
                      </span>
                    </div>

                    <h3 className="font-extrabold text-sm uppercase text-slate-950 leading-snug">
                      {pred.title}
                    </h3>

                    {pred.problemStatement && (
                      <p className="text-xs text-slate-600 line-clamp-2 font-medium">
                        {pred.problemStatement}
                      </p>
                    )}

                    <div className="grid grid-cols-3 gap-2 pt-2 text-[9px] font-mono">
                      <div className={`p-2 rounded border ${activeHorizon === 'short' ? 'bg-emerald-50 border-emerald-300 font-bold' : 'bg-slate-50 border-slate-200'}`}>
                        <span className="text-slate-400 block mb-0.5">1-Yr Horizon</span>
                        <span className="text-slate-800 block truncate" title={t.shortTerm}>{t.shortTerm}</span>
                      </div>
                      <div className={`p-2 rounded border ${activeHorizon === 'medium' ? 'bg-sky-50 border-sky-300 font-bold' : 'bg-slate-50 border-slate-200'}`}>
                        <span className="text-slate-400 block mb-0.5">2-Yr Horizon</span>
                        <span className="text-slate-800 block truncate" title={t.mediumTerm}>{t.mediumTerm}</span>
                      </div>
                      <div className={`p-2 rounded border ${activeHorizon === 'long' ? 'bg-purple-50 border-purple-300 font-bold' : 'bg-slate-50 border-slate-200'}`}>
                        <span className="text-slate-400 block mb-0.5">3-Yr+ Horizon</span>
                        <span className="text-slate-800 block truncate" title={t.longTerm}>{t.longTerm}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Executive Synthesis Briefing Modal */}
      <OracleExecutiveBriefModal 
        isOpen={isBriefModalOpen}
        onClose={() => setIsBriefModalOpen(false)}
        activeHorizon={activeHorizon}
        focusedStream={focusedStream}
        predictions={predictions}
        onSelectPrediction={handleSelectPrediction}
      />

      {/* Sliding Glass Details Side Drawer */}
      <OracleDetailsDrawer 
        prediction={selectedPredict}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSelectNext={handleSelectNext}
        onSelectPrev={handleSelectPrev}
      />
    </div>
  );
}
