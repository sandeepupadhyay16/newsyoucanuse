'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  Layers, 
  TrendingUp, 
  UserCheck, 
  Briefcase, 
  Clock, 
  ShieldCheck, 
  ArrowUpRight, 
  Share2, 
  X,
  Target,
  Zap,
  Activity,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { OraclePredictionItem } from './OracleDetailsPanel';

interface OracleDetailsDrawerProps {
  prediction: OraclePredictionItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectNext: () => void;
  onSelectPrev: () => void;
}

export default function OracleDetailsDrawer({
  prediction,
  isOpen,
  onClose,
  onSelectNext,
  onSelectPrev
}: OracleDetailsDrawerProps) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'implications' | 'overview'>('timeline');

  if (!prediction) return null;

  const getTimelineContent = () => {
    try {
      if (prediction.predictionsTimeline) {
        return JSON.parse(prediction.predictionsTimeline);
      }
    } catch {}
    return {
      shortTerm: 'Initial deployment & localized optimization experiments.',
      mediumTerm: 'Standard integration into core enterprise workflow tooling.',
      longTerm: 'Universal standard replacement for legacy architectures.',
      trajectory: prediction.trajectoryPrediction || 'Accelerating'
    };
  };

  const timeline = getTimelineContent();
  const confidence = Math.min(100, Math.max(0, prediction.predictionConfidence || 85));
  const category = prediction.therapeuticAreas?.[0] || 'AI Stream';

  return (
    <div 
      className={`fixed top-0 right-0 h-full w-full max-w-[480px] bg-white/95 backdrop-blur-2xl border-l border-slate-200 p-6 z-50 shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-out text-slate-900 ${
        isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
      }`}
    >
      {/* Drawer Header */}
      <div className="space-y-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1.5 shadow-xs">
              <Sparkles size={11} className="text-indigo-600" />
              {category}
            </span>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">
              Forecast #{prediction.id.slice(-6)}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors border border-slate-200 cursor-pointer"
            title="Close Drawer (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-2 pt-1">
          <h2 className="text-xl font-black tracking-tight text-slate-950 uppercase leading-snug">
            {prediction.title}
          </h2>

          {prediction.problemStatement && (
            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
              {prediction.problemStatement}
            </p>
          )}
        </div>
      </div>

      {/* Confidence Arch & Trajectory Banner */}
      <div className="my-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between relative z-10 shadow-xs">
        <div className="flex items-center gap-3.5">
          {/* Radial SVG Gauge */}
          <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
            <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-200"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-indigo-600 transition-all duration-1000 ease-out"
                strokeDasharray="100, 100"
                strokeDashoffset={100 - confidence}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-xs font-black text-slate-900">{confidence}%</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 flex items-center gap-1">
              <ShieldCheck size={11} className="text-emerald-600" />
              Confidence
            </span>
            <span className="text-xs font-extrabold text-slate-900 block">
              {confidence >= 80 ? 'High Certainty' : confidence >= 60 ? 'Moderate Certainty' : 'Exploratory Signal'}
            </span>
          </div>
        </div>

        <div className="text-right space-y-0.5 border-l border-slate-200 pl-4">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 flex items-center justify-end gap-1">
            <TrendingUp size={11} className="text-indigo-600" />
            Trajectory
          </span>
          <span className="text-xs font-black text-indigo-700 block uppercase tracking-wider">
            {prediction.trajectoryPrediction || 'Accelerating'}
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 relative z-10 my-2">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex-1 py-2 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'timeline'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock size={12} />
          Timeline
        </button>

        <button
          onClick={() => setActiveTab('implications')}
          className={`flex-1 py-2 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'implications'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Briefcase size={12} />
          Implications
        </button>

        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Zap size={12} />
          Overview
        </button>
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 overflow-y-auto space-y-3.5 relative z-10 my-2 pr-1 custom-scrollbar">
        {activeTab === 'timeline' && (
          <div className="space-y-3">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider">
                <span>Near Horizon (Year 1)</span>
                <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono">Early Adoption</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-semibold">{timeline.shortTerm}</p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-extrabold text-sky-700 uppercase tracking-wider">
                <span>Mid Horizon (Year 2)</span>
                <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-mono">Mainstream Pipeline</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-semibold">{timeline.mediumTerm}</p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-extrabold text-violet-700 uppercase tracking-wider">
                <span>Far Horizon (Year 3+)</span>
                <span className="px-2 py-0.5 rounded bg-violet-100 text-violet-800 font-mono">Universal Standard</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-semibold">{timeline.longTerm}</p>
            </div>
          </div>
        )}

        {activeTab === 'implications' && (
          <div className="space-y-3.5">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-700 uppercase tracking-wide">
                <Briefcase size={14} />
                <span>Consultant Strategy Implication</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                {prediction.consultantImplication || 'Strategic roadmap adjustment required to harness model capabilities early and build competitive moat.'}
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-700 uppercase tracking-wide">
                <UserCheck size={14} />
                <span>Practitioner Operational Impact</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                {prediction.practitionerImplication || 'Developers should upskill in agentic patterns, automated testing frameworks, and continuous evaluation pipelines.'}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-3.5">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                <span>Forecast Intelligence</span>
                <span className="text-[10px] font-mono text-slate-500">{prediction.publishDate ? new Date(prediction.publishDate).toLocaleDateString() : 'Active Forecast'}</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                {prediction.trajectoryPrediction || 'High acceleration signal detected across enterprise engineering teams.'}
              </p>
            </div>

            {prediction.therapeuticAreas && prediction.therapeuticAreas.length > 0 && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Target Tech Streams</span>
                <div className="flex flex-wrap gap-2">
                  {prediction.therapeuticAreas.map((area, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-extrabold text-slate-800 uppercase tracking-wide">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Drawer Footer Navigation Controls */}
      <div className="pt-4 border-t border-slate-200 flex items-center justify-between relative z-10 gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onSelectPrev}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-slate-700 hover:text-slate-950 transition-all cursor-pointer"
            title="Previous Node"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            onClick={onSelectNext}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-slate-700 hover:text-slate-950 transition-all cursor-pointer"
            title="Next Node"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: prediction.title, text: prediction.consultantImplication, url: window.location.href }).catch(() => {});
            }
          }}
          className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 rounded-xl text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Share2 size={13} />
          <span>Share Insight</span>
        </button>
      </div>
    </div>
  );
}
