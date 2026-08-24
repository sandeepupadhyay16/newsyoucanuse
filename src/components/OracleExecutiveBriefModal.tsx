'use client';

import React from 'react';
import { 
  Sparkles, 
  X, 
  Target, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  Briefcase, 
  UserCheck, 
  Layers, 
  ArrowRight,
  Clock,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { OraclePredictionItem } from './OracleDetailsPanel';

interface OracleExecutiveBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeHorizon: 'all' | 'short' | 'medium' | 'long';
  focusedStream: string | null;
  predictions: OraclePredictionItem[];
  onSelectPrediction: (prediction: OraclePredictionItem) => void;
}

const horizonMeta: Record<string, { label: string; timeRange: string; theme: string; color: string; bg: string }> = {
  all: {
    label: 'Holistic 3-Year Strategic AI Vision',
    timeRange: '2025 - 2028+ Horizon Matrix',
    theme: 'End-to-end evolutionary continuum spanning immediate generative pilots to ubiquitous autonomous agent ecosystems.',
    color: '#6366f1',
    bg: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  },
  short: {
    label: 'Horizon 1: Emergence & Targeted Pilots',
    timeRange: 'Next 0 - 6 Months',
    theme: 'Immediate operational efficiencies, frontier LLM tooling adoption, and rapid high-impact experimentations in specialized domains.',
    color: '#10b981',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  medium: {
    label: 'Horizon 2: Pipeline Scaling & Toolchain Integration',
    timeRange: '6 - 18 Months',
    theme: 'Standardizing agentic workflows across production platforms, integrating model-on-chip inference, and automating multi-system orchestration.',
    color: '#0284c7',
    bg: 'bg-sky-50 text-sky-700 border-sky-200'
  },
  long: {
    label: 'Horizon 3: Transformative Paradigm Shift',
    timeRange: '18 - 36+ Months',
    theme: 'Universal enterprise intelligence standards, self-optimizing autonomous architectures, and fundamental restructuring of commercial biopharma workflows.',
    color: '#8b5cf6',
    bg: 'bg-purple-50 text-purple-700 border-purple-200'
  }
};

export default function OracleExecutiveBriefModal({
  isOpen,
  onClose,
  activeHorizon,
  focusedStream,
  predictions,
  onSelectPrediction
}: OracleExecutiveBriefModalProps) {
  if (!isOpen) return null;

  const meta = horizonMeta[activeHorizon] || horizonMeta.all;

  // Filter predictions matching current stream & horizon
  const relevantPredictions = predictions.filter(p => {
    if (focusedStream && !p.therapeuticAreas?.includes(focusedStream)) return false;
    return true;
  });

  const avgConfidence = relevantPredictions.length > 0
    ? Math.round(relevantPredictions.reduce((acc, p) => acc + (p.predictionConfidence || 75), 0) / relevantPredictions.length)
    : 85;

  const topPredictions = [...relevantPredictions]
    .sort((a, b) => (b.predictionConfidence || 0) - (a.predictionConfidence || 0))
    .slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${meta.bg}`}>
                {meta.timeRange}
              </span>
              {focusedStream && (
                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700">
                  {focusedStream}
                </span>
              )}
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
              <Zap size={20} style={{ color: meta.color }} />
              {meta.label}
            </h2>
            <p className="text-xs text-slate-500 font-medium max-w-2xl leading-relaxed">
              {meta.theme}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-all cursor-pointer shadow-xs"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
          
          {/* Key Strategic Metrics Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
                <Target size={22} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Forecasts</span>
                <span className="text-xl font-black text-slate-900">{relevantPredictions.length} Initiatives</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                <ShieldCheck size={22} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Average Conviction</span>
                <span className="text-xl font-black text-slate-900">{avgConfidence}% Certainty</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                <TrendingUp size={22} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Market Trajectory</span>
                <span className="text-xl font-black text-slate-900">High Velocity</span>
              </div>
            </div>
          </div>

          {/* Strategic Implications Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase text-indigo-900 tracking-wider">
                <Briefcase size={16} className="text-indigo-600" />
                <span>Commercial & Advisory Implications</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {activeHorizon === 'short' && 'Focus on rapid value realization via modular copilots. Direct advisory teams to prioritize high-readiness use cases with established business cases.'}
                {activeHorizon === 'medium' && 'Scale infrastructure investments and harmonize cross-functional telemetry. Equip commercial teams with automated intelligence feeds directly embedded in CRM workflows.'}
                {activeHorizon === 'long' && 'Re-architect core business operating models around autonomous multi-agent systems. Shift capital allocation toward proprietary domain foundational models.'}
                {activeHorizon === 'all' && 'Maintain a balanced three-tier portfolio: fund quick-win productivity pilots immediately while securing foundational cloud architecture for 2026+ autonomous agent swarms.'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-50/40 border border-emerald-100 space-y-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase text-emerald-900 tracking-wider">
                <UserCheck size={16} className="text-emerald-600" />
                <span>Technical & Practitioner Directives</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {activeHorizon === 'short' && 'Establish robust evaluation benchmarks, prompt governance frameworks, and data hygiene pipelines. Validate security gateways and ADC credentials.'}
                {activeHorizon === 'medium' && 'Deploy localized on-device and edge inference engines to minimize latency. Implement standard agentic inter-process communication protocols.'}
                {activeHorizon === 'long' && 'Implement continuous synthetic data generation, self-correcting neural architectures, and real-time domain fine-tuning loops.'}
                {activeHorizon === 'all' && 'Standardize on modular micro-frontends with structured API gateways to allow seamless drop-in upgrades as next-generation foundation models emerge.'}
              </p>
            </div>
          </div>

          {/* High-Conviction Forecast Milestones in this Era */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Sparkles size={14} className="text-indigo-600" />
                <span>Key High-Conviction Milestones in this Horizon</span>
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Top 4 Priorities</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {topPredictions.map((pred) => (
                <div 
                  key={pred.id}
                  onClick={() => {
                    onSelectPrediction(pred);
                    onClose();
                  }}
                  className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group space-y-2"
                >
                  <div className="flex items-center justify-between text-[9px] font-bold uppercase">
                    <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {pred.therapeuticAreas?.[0] || 'AI Stream'}
                    </span>
                    <span className="text-slate-500">{pred.predictionConfidence || 85}% Certainty</span>
                  </div>
                  <h4 className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {pred.title}
                  </h4>
                  {pred.problemStatement && (
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {pred.problemStatement}
                    </p>
                  )}
                  <div className="pt-1 flex items-center justify-end text-[9px] font-bold text-indigo-600 gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Inspect Node</span>
                    <ArrowRight size={10} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-8 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-[10px] font-semibold text-slate-400">
            Pfizer Commercial AI Think Tank & Council Intelligence
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider cursor-pointer shadow-sm transition-all"
          >
            Close Executive Brief
          </button>
        </div>
      </div>
    </div>
  );
}
