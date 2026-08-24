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
  Activity
} from 'lucide-react';

export interface OraclePredictionItem {
  id: string;
  title: string;
  problemStatement?: string;
  therapeuticAreas: string[];
  publishDate?: string;
  consultantImplication: string;
  practitionerImplication: string;
  trajectoryPrediction: string;
  predictionsTimeline: string; // JSON
  predictionConfidence: number;
}

interface OracleDetailsPanelProps {
  prediction: OraclePredictionItem | null;
  onClose?: () => void;
  onSelectNext?: () => void;
}

export default function OracleDetailsPanel({ prediction, onClose, onSelectNext }: OracleDetailsPanelProps) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'implications' | 'trajectory'>('timeline');

  if (!prediction) {
    return (
      <div className="h-full min-h-[480px] bg-slate-950/75 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4 text-slate-400 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="p-4 bg-slate-900/80 border border-slate-750/50 rounded-2xl text-pink-400 shadow-inner">
          <Target size={32} className="animate-pulse" />
        </div>
        <div className="space-y-1 max-w-xs">
          <h3 className="text-sm font-extrabold text-slate-200 tracking-wide uppercase">Oracle Sphere Standby</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Click any orbiting prediction node inside the 3D Oracle Sphere to inspect detailed trajectory data and confidence metrics.
          </p>
        </div>
        <div className="pt-2 flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-500 font-mono">
          <Activity size={12} className="text-cyan-400 animate-spin" />
          <span>Orbital Tracking Active</span>
        </div>
      </div>
    );
  }

  // Parse prediction timeline JSON safely
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

  // SVG Gauge calculations
  const strokeDashoffset = 180 - (180 * confidence) / 100;

  return (
    <div className="h-full bg-slate-950/85 backdrop-blur-xl border border-slate-800/90 rounded-3xl p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden text-slate-100 transition-all duration-300">
      {/* Ambient background glows */}
      <div className="absolute -right-24 -top-24 w-60 h-60 bg-pink-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-24 -bottom-24 w-60 h-60 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="space-y-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-pink-500/20 text-pink-300 border border-pink-500/30 flex items-center gap-1">
              <Sparkles size={10} className="text-pink-400" />
              {category}
            </span>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
              ID: #{prediction.id.slice(-6)}
            </span>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-slate-800"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <h2 className="text-lg font-black tracking-tight text-white uppercase leading-snug">
          {prediction.title}
        </h2>

        {prediction.problemStatement && (
          <p className="text-xs text-slate-300/90 leading-relaxed line-clamp-2">
            {prediction.problemStatement}
          </p>
        )}
      </div>

      {/* Confidence Arch & Trajectory Banner */}
      <div className="my-4 p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex items-center justify-between relative z-10 shadow-inner">
        <div className="flex items-center gap-3">
          {/* Radial SVG Gauge */}
          <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-pink-500 transition-all duration-1000 ease-out"
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
              <span className="text-xs font-black text-white">{confidence}%</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
              <ShieldCheck size={11} className="text-emerald-400" />
              Confidence Rating
            </span>
            <span className="text-xs font-bold text-slate-200 block">
              {confidence >= 80 ? 'High Certainty' : confidence >= 60 ? 'Moderate Certainty' : 'Exploratory Signal'}
            </span>
          </div>
        </div>

        <div className="text-right space-y-0.5 border-l border-slate-800/80 pl-4">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center justify-end gap-1">
            <TrendingUp size={11} className="text-cyan-400" />
            Trajectory
          </span>
          <span className="text-xs font-extrabold text-cyan-300 block uppercase tracking-wide">
            {prediction.trajectoryPrediction || 'Accelerating'}
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800/80 relative z-10 mb-4">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex-1 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
            activeTab === 'timeline'
              ? 'bg-gradient-to-r from-pink-500 to-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock size={11} />
          Timeline
        </button>

        <button
          onClick={() => setActiveTab('implications')}
          className={`flex-1 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
            activeTab === 'implications'
              ? 'bg-gradient-to-r from-pink-500 to-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Briefcase size={11} />
          Implications
        </button>

        <button
          onClick={() => setActiveTab('trajectory')}
          className={`flex-1 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
            activeTab === 'trajectory'
              ? 'bg-gradient-to-r from-pink-500 to-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap size={11} />
          Overview
        </button>
      </div>

      {/* Tab Content Box */}
      <div className="flex-1 overflow-y-auto space-y-3 relative z-10 pr-1 max-h-[220px] custom-scrollbar">
        {activeTab === 'timeline' && (
          <div className="space-y-2.5">
            <div className="p-3 bg-slate-900/50 border border-slate-800/60 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-pink-400 uppercase tracking-wider">
                <span>Near Horizon (Year 1)</span>
                <span className="px-1.5 py-0.5 rounded bg-pink-950/60 border border-pink-800/40">Early Adoption</span>
              </div>
              <p className="text-xs text-slate-300 leading-normal">{timeline.shortTerm}</p>
            </div>

            <div className="p-3 bg-slate-900/50 border border-slate-800/60 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                <span>Mid Horizon (Year 2)</span>
                <span className="px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">Mainstream Integration</span>
              </div>
              <p className="text-xs text-slate-300 leading-normal">{timeline.mediumTerm}</p>
            </div>

            <div className="p-3 bg-slate-900/50 border border-slate-800/60 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                <span>Far Horizon (Year 3+)</span>
                <span className="px-1.5 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/40">Universal Standard</span>
              </div>
              <p className="text-xs text-slate-300 leading-normal">{timeline.longTerm}</p>
            </div>
          </div>
        )}

        {activeTab === 'implications' && (
          <div className="space-y-3">
            <div className="p-3 bg-slate-900/50 border border-slate-800/60 rounded-xl space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-pink-400 uppercase tracking-wide">
                <Briefcase size={13} />
                <span>Consultant Strategy Implication</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {prediction.consultantImplication || 'Strategic roadmap adjustment required to harness model capabilities early and build competitive moat.'}
              </p>
            </div>

            <div className="p-3 bg-slate-900/50 border border-slate-800/60 rounded-xl space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wide">
                <UserCheck size={13} />
                <span>Practitioner Operational Impact</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {prediction.practitionerImplication || 'Developers should upskill in agentic patterns, automated testing frameworks, and continuous evaluation pipelines.'}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'trajectory' && (
          <div className="space-y-3">
            <div className="p-3.5 bg-slate-900/50 border border-slate-800/60 rounded-xl space-y-2">
              <div className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
                <span>Prediction Summary</span>
                <span className="text-[10px] font-mono text-slate-400">{prediction.publishDate ? new Date(prediction.publishDate).toLocaleDateString() : 'Active Forecast'}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {prediction.trajectoryPrediction || 'High acceleration signal detected across enterprise engineering teams.'}
              </p>
            </div>

            {prediction.therapeuticAreas && prediction.therapeuticAreas.length > 0 && (
              <div className="p-3 bg-slate-900/50 border border-slate-800/60 rounded-xl space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Tech Streams</span>
                <div className="flex flex-wrap gap-1.5">
                  {prediction.therapeuticAreas.map((area, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-medium text-slate-200">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between relative z-10 gap-2">
        {onSelectNext && (
          <button
            onClick={onSelectNext}
            className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-[10px] font-extrabold uppercase tracking-wider text-slate-300 hover:text-white transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>Next Stream</span>
            <ArrowUpRight size={12} />
          </button>
        )}

        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: prediction.title, text: prediction.consultantImplication, url: window.location.href }).catch(() => {});
            }
          }}
          className="py-2 px-3 bg-gradient-to-r from-pink-500 to-indigo-600 hover:opacity-90 rounded-xl text-[10px] font-extrabold uppercase tracking-wider text-white shadow-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
        >
          <Share2 size={12} />
          <span>Share Insight</span>
        </button>
      </div>
    </div>
  );
}
