'use client';

import React, { useState, useEffect } from 'react';
import { usePersona } from '@/components/ClientWrapper';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown,
  Minus,
  Layers, 
  ArrowRight, 
  X,
  Compass,
  Target,
  Zap,
  Cpu,
  Workflow,
  Code2,
  Terminal,
  Activity,
  Globe,
  Users,
  Loader2,
  ChevronRight,
  Flame,
  AlertCircle,
  ThumbsUp,
  Radio
} from 'lucide-react';
import Link from 'next/link';
import NeuralAgentCluster from '@/components/NeuralAgentCluster';

interface StreamCard {
  title: string;
  description: string;
  icon: any;
  trajectory: string;
  color: string;
  bgGlow: string;
}

const STREAM_ICONS: Record<string, any> = {
  'Frontier Model Capabilities': Sparkles,
  'Model-on-Chip Advancements': Cpu,
  'Agentic Architectures': Workflow,
  'Ways of Working': Compass,
  'Development Frameworks': Code2
};

const STREAM_COLORS: Record<string, string> = {
  'Frontier Model Capabilities': 'from-pink-500 to-rose-500',
  'Model-on-Chip Advancements': 'from-amber-500 to-orange-500',
  'Agentic Architectures': 'from-emerald-500 to-teal-500',
  'Ways of Working': 'from-blue-500 to-cyan-500',
  'Development Frameworks': 'from-purple-500 to-indigo-500'
};

const STREAM_BADGE_STYLE: Record<string, { color: string; bg: string; border: string; label: string }> = {
  'Frontier Model Capabilities': {
    color: 'text-violet-700',
    bg: 'bg-violet-50',
    border: 'border-violet-200/60',
    label: 'Frontier Model'
  },
  'Model-on-Chip Advancements': {
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200/60',
    label: 'Model-on-Chip'
  },
  'Agentic Architectures': {
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200/60',
    label: 'Agentic Arch'
  },
  'Ways of Working': {
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200/60',
    label: 'Ways of Working'
  },
  'Development Frameworks': {
    color: 'text-pink-700',
    bg: 'bg-pink-50',
    border: 'border-pink-200/60',
    label: 'Dev Frameworks'
  },
};

const DEFAULT_BADGE_STYLE = {
  color: 'text-slate-700',
  bg: 'bg-slate-50',
  border: 'border-slate-200/60',
  label: 'AI Stream'
};

function TrajectoryBadge({ value }: { value: string }) {
  const v = (value || '').toLowerCase();
  if (v.includes('accel')) return (
    <span className="inline-flex items-center gap-1 text-[8px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded uppercase">
      <TrendingUp size={9} /> Accelerating
    </span>
  );
  if (v.includes('disrupt')) return (
    <span className="inline-flex items-center gap-1 text-[8px] font-extrabold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded uppercase">
      <AlertCircle size={9} className="text-red-500" /> Disrupted
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[8px] font-extrabold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded uppercase">
      <Minus size={9} /> Stable
    </span>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-1.5 min-w-[70px]">
      <div className="flex-1 h-1 bg-slate-150 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[8px] font-black text-slate-500 w-6 text-right">{pct}%</span>
    </div>
  );
}

const getStreamCard = (title: string): StreamCard => {
  const icon = STREAM_ICONS[title] || TrendingUp;
  const color = STREAM_COLORS[title] || 'from-slate-500 to-slate-700';
  const bgGlow = STREAM_COLORS[title] ? `bg-${color.split('-')[1]}-500/5` : 'bg-slate-500/5';
  
  let description = `Crawl, summarize, and predict the evolution of the ${title} technology stream.`;
  let trajectory = "Accelerating (90% confidence)";
  
  if (title === 'Frontier Model Capabilities') {
    description = "Evaluations and trajectory forecasts for next-generation foundation models (open-source vs closed-source, reasoning benchmarks, context length advances).";
    trajectory = "Accelerating (94% confidence)";
  } else if (title === 'Model-on-Chip Advancements') {
    description = "Hardware-level AI progress, local hardware acceleration, quantized models running on edge chips, Apple/Nvidia/Qualcomm advancements.";
    trajectory = "Disrupted (88% confidence)";
  } else if (title === 'Agentic Architectures') {
    description = "Transitioning from chatbots to autonomous agent loops, stateful workflows, multi-agent frameworks, tool usage protocols.";
    trajectory = "Accelerating (96% confidence)";
  } else if (title === 'Ways of Working') {
    description = "How emerging AI architectures shift day-to-day organizational workflow, consulting delivery models, and developer productivity.";
    trajectory = "Stable (78% confidence)";
  } else if (title === 'Development Frameworks') {
    description = "Updates to compiler tech, Next.js, Vercel edge capabilities, Python libraries, and typescript compilation architectures for AI.";
    trajectory = "Accelerating (91% confidence)";
  }
  
  return {
    title,
    description,
    icon,
    trajectory,
    color,
    bgGlow
  };
};

const DEFAULT_TECH_STREAMS = [
  'Frontier Model Capabilities',
  'Model-on-Chip Advancements',
  'Agentic Architectures',
  'Ways of Working',
  'Development Frameworks',
  'Robotics & Physical AI'
];

export default function HomePage() {
  const { currentPersona } = usePersona();
  const [techStreams, setTechStreams] = useState<StreamCard[]>(() => DEFAULT_TECH_STREAMS.map(s => getStreamCard(s)));
  const [trendingSignals, setTrendingSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch config for dynamic streams
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.techStreams)) {
          const cards = data.techStreams.map((s: string) => getStreamCard(s));
          setTechStreams(cards);
        }
      })
      .catch(err => console.error('Failed to load dynamic tech streams config:', err));

    // 2. Fetch themes, extract all signals (ArticleGroup), and calculate hotness
    fetch('/api/external-feed')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.items)) {
          const items = data.items;
          const allSignals: any[] = [];

          items.forEach((theme: any) => {
            theme.groups.forEach((g: any) => {
              const isRecent = (Date.now() - new Date(g.lastCoverageDate).getTime()) < 7 * 24 * 60 * 60 * 1000;
              const netVotes = g.upvotes - g.downvotes;
              // Score based on net votes, articles, recency, and multiple sources
              const heatScore = netVotes * 3 + g.articles.length * 2 + (isRecent ? 15 : 0) + (g.sourceCount >= 2 ? 10 : 0);

              allSignals.push({
                ...g,
                themeTitle: theme.title,
                stream: theme.stream,
                heatScore
              });
            });
          });

          // Sort signals by heatScore descending
          const sortedSignals = allSignals.sort((a, b) => b.heatScore - a.heatScore);
          setTrendingSignals(sortedSignals.slice(0, 6));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load trending signals:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-12 text-[#0a0a0a] animate-fadeIn">
      {/* Immersive Platform Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 md:p-12 shadow-sm">
        <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-pink-500/5 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -z-10"></div>
        
        <div className="grid md:grid-cols-3 gap-8 items-center">
          <div className="md:col-span-2 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white border border-slate-800 text-[10px] font-extrabold uppercase tracking-widest">
              <Sparkles size={10} className="text-pink-400" />
              <span>AI Oracle Predictions & commentary</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-950 leading-tight">
              Antigravity <span className="text-pink-600">Trends</span> Engine
            </h1>
            
            <p className="text-sm md:text-base text-slate-600 leading-relaxed font-medium">
              Ingest technical publications, synthesize data visuals, detect emerging technology clusters, and predict roadmap vectors using stateful agentic loops.
            </p>
            
            <div className="flex flex-wrap gap-3 pt-2">
              <Link 
                href="/newsletter"
                className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs active:scale-95 transition-all flex items-center gap-2 shadow-md"
              >
                <span>Explore Newsletter Commentary</span>
                <ArrowRight size={14} />
              </Link>
              
              <Link 
                href="/oracle"
                className="px-6 py-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs active:scale-95 transition-all flex items-center gap-2 shadow-xs"
              >
                <span>Ask the Oracle Ball</span>
                <TrendingUp size={14} className="text-pink-500" />
              </Link>
            </div>
          </div>
          <div className="h-[280px] w-full">
            <NeuralAgentCluster />
          </div>
        </div>
      </section>

      {/* Technology Streams Grid */}
      <section className="space-y-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-black tracking-tight text-slate-950">Streams</h2>
          <p className="text-xs text-slate-500 font-medium">We continuously crawl, summarize, and predict the evolution of these core AI sectors.</p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {techStreams.map((stream) => (
            <Link
              href={`/streams/${encodeURIComponent(stream.title)}`}
              key={stream.title}
              className={`p-6 rounded-2xl border border-slate-200 bg-white relative overflow-hidden shadow-xs hover:shadow-md transition-all group block text-left`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 ${stream.bgGlow} rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500`}></div>
              
              <div className="space-y-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${stream.color} flex items-center justify-center text-white shadow-sm`}>
                  <stream.icon size={18} />
                </div>
                
                <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider leading-tight">{stream.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed min-h-[72px]">
                  {stream.description}
                </p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  <span>Trajectory:</span>
                  <span className="text-pink-600 font-extrabold flex items-center gap-0.5">
                    {stream.trajectory}
                    <ChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending Signals Section */}
      <section className="space-y-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-black tracking-tight text-slate-950 flex items-center gap-1.5">
            <Flame size={18} className="text-orange-500 fill-orange-500" />
            Trending Signals
          </h2>
          <p className="text-xs text-slate-500 font-medium">The highest-impact technical developments and predictions emerging across active streams, ranked by velocity, source coverage, and peer votes.</p>
        </div>

        <div className="p-8 rounded-3xl border border-slate-200 bg-white shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-2xl -z-10"></div>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-2 text-xs text-slate-400">
              <Loader2 size={24} className="animate-spin text-pink-500" />
              <span>Fetching trending signals...</span>
            </div>
          ) : trendingSignals.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <Activity size={24} className="mx-auto text-slate-350" />
              <p className="text-xs text-slate-500 font-bold">No trending signals found.</p>
              <p className="text-[10px] text-slate-400">Execute Ingestion scans to classify crawled articles into signals.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingSignals.map((signal) => {
                const badgeStyle = STREAM_BADGE_STYLE[signal.stream] || DEFAULT_BADGE_STYLE;
                const netVotes = signal.upvotes - signal.downvotes;
                const hasMultipleSources = signal.sourceCount >= 2;
                
                return (
                  <Link
                    href={`/newsletter?theme=${encodeURIComponent(signal.themeTitle)}&signal=${encodeURIComponent(signal.title)}`}
                    key={signal.id}
                    className="p-5 rounded-2xl border border-slate-150 bg-slate-50/50 hover:bg-white hover:border-slate-350 hover:shadow-md transition-all flex flex-col justify-between text-left group relative"
                  >
                    <div className="space-y-3">
                      {/* Badge row */}
                      <div className="flex justify-between items-center gap-2">
                        <span className={`text-[8px] font-extrabold uppercase tracking-widest ${badgeStyle.color} ${badgeStyle.bg} border ${badgeStyle.border} px-2 py-0.5 rounded`}>
                          {badgeStyle.label}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {hasMultipleSources && (
                            <span className="text-[8px] font-bold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded flex items-center gap-0.5">
                              <Flame size={8} className="fill-orange-500" /> Hot
                            </span>
                          )}
                          <span className="text-[8px] font-bold text-slate-500 bg-slate-150/60 px-2 py-0.5 rounded flex items-center gap-0.5">
                            <Radio size={8} className="text-slate-400" />
                            {signal.sourceCount} source{signal.sourceCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      {/* Title */}
                      <h4 className="font-extrabold text-slate-900 text-xs tracking-tight group-hover:text-pink-600 transition-colors leading-snug line-clamp-2">
                        {signal.title}
                      </h4>

                      {/* Summary */}
                      <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-3">
                        {signal.summary}
                      </p>
                    </div>
                    
                    {/* Predictions / Outlook Preview */}
                    <div className="mt-4 pt-3 border-t border-slate-100/60 space-y-2">
                      <div className="flex items-center justify-between text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                        <span>Oracle Outlook</span>
                        <span>Confidence</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <TrajectoryBadge value={signal.trajectoryPrediction} />
                        <ConfidenceBar value={signal.predictionConfidence} />
                      </div>
                    </div>

                    {/* Footer Row */}
                    <div className="pt-3 border-t border-slate-100 mt-4 flex items-center justify-between text-[9px] text-slate-400 font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-bold flex items-center gap-0.5">
                          <ThumbsUp size={10} className="text-slate-400" />
                          <span>{netVotes >= 0 ? `+${netVotes}` : netVotes}</span>
                        </span>
                        <span>·</span>
                        <span>{signal.articles.length} article{signal.articles.length !== 1 ? 's' : ''}</span>
                      </div>
                      <span className="text-slate-550 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        Explore Signal <ArrowRight size={8} />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
