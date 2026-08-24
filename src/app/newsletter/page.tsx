'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { usePersona } from '@/components/ClientWrapper';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown,
  Minus,
  Layers, 
  ArrowRight, 
  X,
  Target,
  Zap,
  Activity,
  Globe,
  Loader2,
  ChevronRight,
  Flame,
  User,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  Award,
  BarChart3,
  Shield,
  Cpu,
  Workflow,
  Code2,
  BookOpen,
  FileText,
  CheckCircle2,
  AlertCircle,
  Radio
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface ExtractedAsset {
  id: string;
  type: string;
  url: string;
  title: string;
}

interface Article {
  id: string;
  title: string;
  content: string;
  url: string;
  sourceName: string;
  publishDate: string;
  author: string;
  assets: ExtractedAsset[];
}

interface ArticleGroup {
  id: string;
  title: string;
  summary: string;
  lastCoverageDate: string;
  trajectoryPrediction: string;
  predictionsTimeline: string;
  predictionConfidence: number;
  upvotes: number;
  downvotes: number;
  sourceCount: number;
  sourceNames: string[];
  articles: Article[];
}

interface Theme {
  id: string;
  title: string;
  summary: string;
  stream: string;
  createdAt: string;
  lastCoverageDate: string;
  functionalDomains: string[];
  sourceCount: number;
  sourceNames: string[];
  groups: ArticleGroup[];
}

const STREAM_CONFIG: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode; abbr: string }> = {
  'Frontier Model Capabilities': {
    color: 'text-violet-700',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    icon: <Sparkles size={12} />,
    abbr: 'FRONTIER'
  },
  'Model-on-Chip Advancements': {
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: <Cpu size={12} />,
    abbr: 'ON-CHIP'
  },
  'Agentic Architectures': {
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: <Workflow size={12} />,
    abbr: 'AGENTIC'
  },
  'Ways of Working': {
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: <Activity size={12} />,
    abbr: 'ORG'
  },
  'Development Frameworks': {
    color: 'text-pink-700',
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    icon: <Code2 size={12} />,
    abbr: 'DEV'
  },
};

const DEFAULT_STREAM = {
  color: 'text-slate-700',
  bg: 'bg-slate-50',
  border: 'border-slate-200',
  icon: <Globe size={12} />,
  abbr: 'AI'
};

function TrajectoryBadge({ value }: { value: string }) {
  const v = (value || '').toLowerCase();
  if (v.includes('accel')) return (
    <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded uppercase">
      <TrendingUp size={9} /> Accelerating
    </span>
  );
  if (v.includes('disrupt')) return (
    <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded uppercase">
      <AlertCircle size={9} /> Disrupted
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded uppercase">
      <Minus size={9} /> Stable
    </span>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-black text-slate-700 w-8 text-right">{pct}%</span>
    </div>
  );
}

function NewsletterLibraryContent() {
  const { currentPersona } = usePersona();
  const searchParams = useSearchParams();
  const initialThemeQuery = searchParams.get('theme') || '';
  const initialSignalQuery = searchParams.get('signal') || '';

  const [stories, setStories] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState<Theme | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<ArticleGroup | null>(null);
  const [votingGroupId, setVotingGroupId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialThemeQuery);
  const [selectedStream, setSelectedStream] = useState('All');

  const streams = [
    'All',
    'Frontier Model Capabilities',
    'Model-on-Chip Advancements',
    'Agentic Architectures',
    'Ways of Working',
    'Development Frameworks'
  ];

  const loadData = () => {
    setLoading(true);
    fetch('/api/external-feed')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.items)) {
          setStories(data.items);
          if (initialThemeQuery) {
            const matched = data.items.find((t: Theme) => t.title.toLowerCase() === initialThemeQuery.toLowerCase());
            if (matched) {
              setSelectedStory(matched);
              if (initialSignalQuery && matched.groups.length > 0) {
                const signalMatched = matched.groups.find((g: any) => 
                  g.title.toLowerCase() === initialSignalQuery.toLowerCase() || g.id === initialSignalQuery
                );
                if (signalMatched) {
                  setSelectedGroup(signalMatched);
                } else {
                  setSelectedGroup(matched.groups[0]);
                }
              } else if (matched.groups.length > 0) {
                setSelectedGroup(matched.groups[0]);
              }
            }
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch library stories:', err);
        setLoading(false);
      });
  };

  useEffect(() => { loadData(); }, []);

  const handleVote = async (groupId: string, voteType: 'upvote' | 'downvote') => {
    setVotingGroupId(groupId);
    try {
      const res = await fetch('/api/projects/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: groupId, voteType })
      });
      if (res.ok) {
        setStories(prev => prev.map(t => ({
          ...t,
          groups: t.groups.map(g => {
            if (g.id === groupId) {
              return {
                ...g,
                upvotes: voteType === 'upvote' ? g.upvotes + 1 : g.upvotes,
                downvotes: voteType === 'downvote' ? g.downvotes + 1 : g.downvotes
              };
            }
            return g;
          })
        })));
        if (selectedGroup && selectedGroup.id === groupId) {
          setSelectedGroup(prev => prev ? {
            ...prev,
            upvotes: voteType === 'upvote' ? prev.upvotes + 1 : prev.upvotes,
            downvotes: voteType === 'downvote' ? prev.downvotes + 1 : prev.downvotes
          } : null);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setVotingGroupId(null);
    }
  };

  const filteredStories = stories.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.groups.some(g => g.title.toLowerCase().includes(searchQuery.toLowerCase()) || g.summary.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStream = selectedStream === 'All' || s.stream === selectedStream;
    return matchesSearch && matchesStream;
  });

  const cleanTitle = (t: string) => t
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\d{2}\.\d{2}\.\d{2}/g, '')
    .replace(/\d{4}-\d{2}-\d{2}/g, '')
    .trim();

  // Deduplicate groups by title similarity (for display only - backend fix is via threshold)
  const dedupeGroups = (groups: ArticleGroup[]): ArticleGroup[] => {
    const seen = new Map<string, ArticleGroup>();
    for (const g of groups) {
      const key = cleanTitle(g.title).toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 30);
      if (!seen.has(key)) {
        seen.set(key, g);
      } else {
        // Merge articles into existing group
        const existing = seen.get(key)!;
        const mergedArticleIds = new Set(existing.articles.map(a => a.id));
        const newArticles = g.articles.filter(a => !mergedArticleIds.has(a.id));
        seen.set(key, {
          ...existing,
          articles: [...existing.articles, ...newArticles],
          sourceCount: Math.max(existing.sourceCount, g.sourceCount),
          upvotes: existing.upvotes + g.upvotes,
        });
      }
    }
    return Array.from(seen.values());
  };

  const openStory = (story: Theme) => {
    const dedupedStory = { ...story, groups: dedupeGroups(story.groups) };
    setSelectedStory(dedupedStory);
    setSelectedGroup(dedupedStory.groups.length > 0 ? dedupedStory.groups[0] : null);
  };

  const openSignal = (story: Theme, group: ArticleGroup) => {
    const dedupedStory = { ...story, groups: dedupeGroups(story.groups) };
    setSelectedStory(dedupedStory);
    const dedupedGroup = dedupedStory.groups.find(g => g.id === group.id) || group;
    setSelectedGroup(dedupedGroup);
  };

  // Best trajectory signal across all groups
  const storyTrajectory = (story: Theme) => {
    const groups = story.groups;
    if (groups.some(g => (g.trajectoryPrediction || '').toLowerCase().includes('accel'))) return 'Accelerating';
    if (groups.some(g => (g.trajectoryPrediction || '').toLowerCase().includes('disrupt'))) return 'Disrupted';
    return 'Stable';
  };

  // Avg confidence
  const storyConfidence = (story: Theme) => {
    if (!story.groups.length) return 0;
    return Math.round(story.groups.reduce((s, g) => s + g.predictionConfidence, 0) / story.groups.length);
  };

  return (
    <>
      <div className="space-y-8 animate-fadeIn text-[#0a0a0a]">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-950">Newsletter Library</h1>
          <p className="text-xs text-slate-500 font-medium">Browse emerging AI themes, read analyst implications, and review predictions timeline.</p>
        </div>
        <Link
          href="/newsletter/builder"
          className="shrink-0 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 shadow-md"
        >
          <Award size={14} className="text-pink-300" />
          <span>Assemble Edition</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search themes, summaries, categories..."
          className="w-full sm:max-w-xs bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-xs focus:outline-none focus:border-slate-400"
        />
        <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none py-1">
          {streams.map(stream => {
            const isActive = selectedStream === stream;
            return (
              <button
                key={stream}
                onClick={() => setSelectedStream(stream)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {stream === 'All' ? 'All Streams' : stream.replace(' Advancements', '').replace(' Capabilities', '')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <Loader2 size={32} className="animate-spin text-pink-500" />
          <span className="text-xs text-slate-400 font-bold">Scanning library repository...</span>
        </div>
      ) : filteredStories.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-slate-200 bg-white rounded-3xl space-y-4">
          <Globe size={36} className="text-slate-350 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-800 uppercase">No active themes found</h3>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              Run ingestion runs to crawl RSS feeds, cluster articles, and generate tech themes.
            </p>
          </div>
        </div>
      ) : selectedStream === 'All' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {(() => {
            // Group the stories and signals by stream
            const streamsMap = new Map<string, {
              stream: string;
              groups: any[];
              sourceCount: number;
              lastCoverageDate: Date;
            }>();

            filteredStories.forEach(story => {
              const streamKey = story.stream;
              if (!streamsMap.has(streamKey)) {
                streamsMap.set(streamKey, {
                  stream: streamKey,
                  groups: [],
                  sourceCount: 0,
                  lastCoverageDate: new Date(0)
                });
              }
              const entry = streamsMap.get(streamKey)!;
              
              const storyDate = new Date(story.lastCoverageDate);
              if (storyDate > entry.lastCoverageDate) {
                entry.lastCoverageDate = storyDate;
              }
              
              entry.sourceCount += story.sourceCount || 0;
              
              story.groups.forEach(g => {
                entry.groups.push({
                  ...g,
                  story // Keep reference to original parent story
                });
              });
            });

            // Build virtual stories for each stream
            const consolidatedStreams = Array.from(streamsMap.values()).map(entry => {
              const cfg = STREAM_CONFIG[entry.stream] || DEFAULT_STREAM;
              
              // Deduplicate groups in the stream by ID
              const uniqueGroupsMap = new Map<string, ArticleGroup>();
              entry.groups.forEach(g => {
                if (!uniqueGroupsMap.has(g.id)) {
                  uniqueGroupsMap.set(g.id, g);
                }
              });
              const uniqueGroups = Array.from(uniqueGroupsMap.values());

              const virtualStory = {
                id: entry.stream,
                title: `${entry.stream} Core Advancements`,
                summary: `Aggregated themes and trajectories in ${entry.stream}.`,
                stream: entry.stream,
                groups: uniqueGroups,
                sourceCount: Math.max(1, entry.sourceCount),
                lastCoverageDate: entry.lastCoverageDate.getTime() === 0 ? new Date().toISOString() : entry.lastCoverageDate.toISOString()
              };

              return virtualStory;
            });

            return (consolidatedStreams as any[]).map((story) => {
              const cfg = STREAM_CONFIG[story.stream] || DEFAULT_STREAM;
              const traj = storyTrajectory(story);
              const conf = storyConfidence(story);
              const dedupedGroups = dedupeGroups(story.groups);
              const topGroups = dedupedGroups.slice(0, 3);

              return (
                <div
                  key={story.id}
                  onClick={() => openStory(story as any)}
                  className="bg-white border border-slate-200 hover:border-slate-350 hover:shadow-lg rounded-2xl overflow-hidden transition-all cursor-pointer flex flex-col group shadow-xs"
                >
                  {/* Card Header stripe */}
                  <div className={`px-5 pt-5 pb-4 ${cfg.bg} border-b ${cfg.border}`}>
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded ${cfg.bg} ${cfg.color} border ${cfg.border} uppercase tracking-widest`}>
                        {cfg.icon}
                        {cfg.abbr}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {story.sourceCount >= 2 && (
                          <span className="text-[9px] font-extrabold text-orange-600 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Flame size={8} className="fill-orange-500" /> {story.sourceCount} sources
                          </span>
                        )}
                        <TrajectoryBadge value={traj} />
                      </div>
                    </div>

                    <h3 className={`font-extrabold text-slate-900 text-sm leading-snug group-hover:${cfg.color} transition-colors mb-1`}>
                      {cleanTitle(story.title)}
                    </h3>

                    {/* Confidence bar */}
                    <div className="mt-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Oracle Confidence</span>
                      </div>
                      <ConfidenceBar value={conf} />
                    </div>
                  </div>

                  {/* Sub-themes preview */}
                  <div className="px-5 py-3 flex-1 space-y-1.5">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Trending signals ({dedupedGroups.length})</span>
                    {topGroups.map((g, i) => (
                      <div key={g.id} className="flex items-start gap-2">
                        <span className={`mt-0.5 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                          i === 0 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>{i + 1}</span>
                        <span className="text-[11px] text-slate-700 font-semibold leading-snug line-clamp-1">
                          {cleanTitle(g.title)}
                        </span>
                      </div>
                    ))}
                    {dedupedGroups.length > 3 && (
                      <span className="text-[10px] text-slate-400 font-bold pl-6">+ {dedupedGroups.length - 3} more signals</span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-5 pb-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                      <Calendar size={10} />
                      <span>
                        {new Date(story.lastCoverageDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <div className={`text-[10px] font-bold ${cfg.color} flex items-center gap-0.5 group-hover:translate-x-1 transition-transform`}>
                      <span>Open Dossier</span>
                      <ChevronRight size={12} />
                    </div>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {(() => {
            // Gather all matched signals from all filtered stories
            const allMatchedSignals = filteredStories.flatMap((story) => {
              const cfg = STREAM_CONFIG[story.stream] || DEFAULT_STREAM;
              const dedupedGroups = dedupeGroups(story.groups);
              
              // Filter individual signals by searchQuery if present
              const matchedGroups = dedupedGroups.filter(g => {
                if (!searchQuery) return true;
                return g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       g.summary.toLowerCase().includes(searchQuery.toLowerCase());
              });

              return matchedGroups.map(g => ({
                ...g,
                story,
                cfg
              }));
            });

            // Sort all signals globally by their article coverage count descending
            const sortedSignals = allMatchedSignals.sort((a, b) => b.articles.length - a.articles.length);

            // Render sorted cards
            return sortedSignals.map((g) => {
              const traj = g.trajectoryPrediction || 'Stable';
              const conf = g.predictionConfidence;
              const netVotes = g.upvotes - g.downvotes;
              const cfg = g.cfg;

              return (
                <div
                  key={g.id}
                  onClick={() => openSignal(g.story, g)}
                  className="bg-white border border-slate-200 hover:border-slate-350 hover:shadow-lg rounded-2xl overflow-hidden transition-all cursor-pointer flex flex-col justify-between group shadow-xs animate-fadeIn"
                >
                  <div className={`px-5 pt-5 pb-4 ${cfg.bg} border-b ${cfg.border}`}>
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded ${cfg.bg} ${cfg.color} border ${cfg.border} uppercase tracking-widest`}>
                        {cfg.icon}
                        {cfg.abbr}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-extrabold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded whitespace-nowrap">
                          {g.articles.length} article{g.articles.length !== 1 ? 's' : ''}
                        </span>
                        {g.sourceCount >= 2 && (
                          <span className="text-[9px] font-extrabold text-orange-600 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Flame size={8} className="fill-orange-500" /> {g.sourceCount} sources
                          </span>
                        )}
                        <TrajectoryBadge value={traj} />
                      </div>
                    </div>

                    <h3 className="font-extrabold text-slate-900 text-sm leading-snug group-hover:text-pink-600 transition-colors mb-1 line-clamp-2 min-h-[40px]">
                      {cleanTitle(g.title)}
                    </h3>

                    {/* Confidence bar */}
                    <div className="mt-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Oracle Confidence</span>
                      </div>
                      <ConfidenceBar value={conf} />
                    </div>
                  </div>

                  {/* Summary & top articles */}
                  <div className="px-5 py-4 flex-1 space-y-3">
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                      {g.summary}
                    </p>
                    
                    {g.articles.length > 0 && (
                      <div className="space-y-1.5 pt-2.5 border-t border-slate-100/60">
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Source Articles</span>
                        {g.articles.slice(0, 2).map((art) => (
                          <div key={art.id} className="flex items-start gap-1 text-[10px] text-slate-700 leading-normal font-semibold">
                            <FileText size={10} className="text-slate-400 shrink-0 mt-0.5" />
                            <span className="truncate">{art.title}</span>
                          </div>
                        ))}
                        {g.articles.length > 2 && (
                          <span className="text-[9px] text-slate-400 font-bold pl-4">
                            + {g.articles.length - 2} more article{g.articles.length - 2 !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-5 pb-4 pt-3 border-t border-slate-100 flex justify-between items-center bg-slate-50/40">
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                      <div className="flex items-center gap-0.5">
                        <ThumbsUp size={10} className="text-slate-400" />
                        <span>{netVotes >= 0 ? `+${netVotes}` : netVotes}</span>
                      </div>
                      <span>·</span>
                      <span>
                        {new Date(g.lastCoverageDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <div className={`text-[10px] font-bold ${cfg.color} flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform`}>
                      <span>Explore Signal</span>
                      <ChevronRight size={12} />
                    </div>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      )}
      </div>

      {/* DETAIL MODAL */}
      {selectedStory && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6 animate-fadeIn">
          <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col h-[85vh] max-h-[92vh] overflow-hidden animate-zoomIn">

            {/* Modal Header */}
            {(() => {
              const cfg = STREAM_CONFIG[selectedStory.stream] || DEFAULT_STREAM;
              const traj = storyTrajectory(selectedStory);
              const conf = storyConfidence(selectedStory);
              return (
                <div className={`px-7 pt-6 pb-5 ${cfg.bg} border-b ${cfg.border} flex items-start justify-between gap-4 shrink-0`}>
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded ${cfg.bg} ${cfg.color} border ${cfg.border} uppercase tracking-widest`}>
                        {cfg.icon}
                        {selectedStory.stream}
                      </span>
                      <TrajectoryBadge value={traj} />
                      {selectedStory.sourceCount >= 2 && (
                        <span className="text-[9px] font-extrabold text-orange-600 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Flame size={8} className="fill-orange-500" /> {selectedStory.sourceCount} sources
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-black text-slate-950 leading-tight">{cleanTitle(selectedStory.title)}</h2>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">{selectedStory.summary}</p>
                    {/* Confidence */}
                    <div className="flex items-center gap-3 pt-1">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider shrink-0">Oracle Confidence</span>
                      <div className="w-48">
                        <ConfidenceBar value={conf} />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => { setSelectedStory(null); setSelectedGroup(null); }}
                    className="p-2 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-white/60 transition-colors cursor-pointer shrink-0 mt-0.5"
                  >
                    <X size={18} />
                  </button>
                </div>
              );
            })()}

            {/* Modal Body — left sidebar + right detail */}
            <div className="flex flex-1 overflow-hidden min-h-0">

              {/* Left: Group list */}
              <div className="w-64 shrink-0 border-r border-slate-100 flex flex-col bg-slate-50/60">
                <div className="px-4 py-3 border-b border-slate-100 shrink-0">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Signals ({(selectedStory.groups).length})
                  </span>
                </div>
                <div className="flex flex-col gap-0 py-1 flex-1 overflow-y-auto">
                  {selectedStory.groups.map((g, i) => {
                    const isActive = selectedGroup?.id === g.id;
                    const traj = (g.trajectoryPrediction || '').toLowerCase();
                    const TrajIcon = traj.includes('accel') ? TrendingUp : traj.includes('disrupt') ? TrendingDown : Minus;
                    const trajColor = traj.includes('accel') ? 'text-emerald-500' : traj.includes('disrupt') ? 'text-red-400' : 'text-slate-400';
                    return (
                      <button
                        key={g.id}
                        onClick={() => setSelectedGroup(g)}
                        className={`w-full px-4 py-3 text-left transition-all flex items-start gap-3 border-b border-slate-100 cursor-pointer ${
                          isActive
                            ? 'bg-white border-l-2 border-l-slate-900'
                            : 'hover:bg-white/80 border-l-2 border-l-transparent'
                        }`}
                      >
                        <span className={`mt-0.5 text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                          isActive ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'
                        }`}>{i + 1}</span>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="text-[11px] font-bold text-slate-800 leading-snug line-clamp-2">
                            {cleanTitle(g.title)}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <TrajIcon size={9} className={trajColor} />
                            <span className={`text-[9px] font-bold ${trajColor}`}>{g.predictionConfidence}%</span>
                            {g.sourceCount >= 2 && <Flame size={8} className="text-orange-400 fill-orange-400" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right: selected group detail */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 min-w-0">
                {selectedGroup ? (
                  <>
                    {/* Group header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <h3 className="text-base font-extrabold text-slate-900 leading-snug">{cleanTitle(selectedGroup.title)}</h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <TrajectoryBadge value={selectedGroup.trajectoryPrediction} />
                          <span className="text-[9px] text-slate-400 font-bold">
                            {selectedGroup.articles.length} article{selectedGroup.articles.length !== 1 ? 's' : ''} ingested
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold">·</span>
                          <span className="text-[9px] text-slate-400 font-bold">
                            {new Date(selectedGroup.lastCoverageDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      {/* Vote buttons */}
                      <div className="flex items-center gap-1 border border-slate-200 bg-white p-1 rounded-lg shrink-0 shadow-xs">
                        <button
                          onClick={() => handleVote(selectedGroup.id, 'upvote')}
                          disabled={votingGroupId === selectedGroup.id}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                          title="Upvote"
                        >
                          <ThumbsUp size={12} />
                        </button>
                        <span className="text-[10px] font-black text-slate-700 px-1 min-w-[20px] text-center">
                          {selectedGroup.upvotes - selectedGroup.downvotes}
                        </span>
                        <button
                          onClick={() => handleVote(selectedGroup.id, 'downvote')}
                          disabled={votingGroupId === selectedGroup.id}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          title="Downvote"
                        >
                          <ThumbsDown size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Analyst Summary</h4>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">{selectedGroup.summary}</p>
                    </div>

                    {/* Oracle predictions */}
                    <div className="space-y-3">
                      <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Oracle Predictions Outlook</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1">
                          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Trajectory</span>
                          <div className="text-xs font-black text-slate-800 mt-1 flex items-center gap-1">
                            {(selectedGroup.trajectoryPrediction || 'Stable').toLowerCase().includes('accel') && <TrendingUp size={12} className="text-emerald-500" />}
                            {(selectedGroup.trajectoryPrediction || 'Stable').toLowerCase().includes('disrupt') && <TrendingDown size={12} className="text-red-500" />}
                            {(selectedGroup.trajectoryPrediction || 'Stable').toLowerCase().includes('stable') && <Minus size={12} className="text-slate-400" />}
                            {selectedGroup.trajectoryPrediction || 'Stable'}
                          </div>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1">
                          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Confidence Score</span>
                          <ConfidenceBar value={selectedGroup.predictionConfidence} />
                        </div>
                      </div>
                      {/* Timeline */}
                      {(() => {
                        let tl: any = {};
                        try { tl = JSON.parse(selectedGroup.predictionsTimeline || '{}'); } catch {}
                        if (tl.shortTerm || tl.mediumTerm || tl.longTerm) {
                          return (
                            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Timeline Projections</span>
                              <div className="space-y-2">
                                {tl.shortTerm && (
                                  <div className="flex items-start gap-2">
                                    <span className="text-[8px] font-extrabold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded whitespace-nowrap mt-0.5">&lt;6M</span>
                                    <p className="text-[11px] text-slate-600 leading-relaxed">{tl.shortTerm}</p>
                                  </div>
                                )}
                                {tl.mediumTerm && (
                                  <div className="flex items-start gap-2">
                                    <span className="text-[8px] font-extrabold text-violet-600 bg-violet-50 border border-violet-100 px-1.5 py-0.5 rounded whitespace-nowrap mt-0.5">6M–2Y</span>
                                    <p className="text-[11px] text-slate-600 leading-relaxed">{tl.mediumTerm}</p>
                                  </div>
                                )}
                                {tl.longTerm && (
                                  <div className="flex items-start gap-2">
                                    <span className="text-[8px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded whitespace-nowrap mt-0.5">&gt;2Y</span>
                                    <p className="text-[11px] text-slate-600 leading-relaxed">{tl.longTerm}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    {/* Source articles */}
                    <div className="space-y-3">
                      <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Source Coverage ({selectedGroup.articles.length})</h4>
                      <div className="space-y-2">
                        {selectedGroup.articles.map(art => (
                          <div key={art.id} className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-slate-300 transition-colors">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                              <FileText size={12} className="text-slate-500" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-[11px] font-bold text-slate-900 leading-snug">{art.title}</div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <Radio size={9} />
                                <span className="font-semibold text-slate-500">{art.sourceName}</span>
                                {art.author && <><span>·</span><span>{art.author}</span></>}
                              </div>
                            </div>
                            <a
                              href={art.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg font-bold text-[9px] uppercase active:scale-95 transition-all flex items-center gap-1 shrink-0 mt-0.5"
                            >
                              Read <ExternalLink size={8} />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center py-24 text-slate-400 space-y-2">
                    <Layers size={28} className="text-slate-300" />
                    <p className="text-sm font-bold text-slate-600">Select a signal from the left</p>
                    <p className="text-xs text-slate-400">Choose a trending signal to view its timeline and source coverage.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-7 py-4 border-t border-slate-200 bg-slate-50/60 flex justify-between items-center shrink-0">
              <span className="text-[10px] text-slate-400 font-medium">
                {selectedStory.groups.length} signal{selectedStory.groups.length !== 1 ? 's' : ''} · {selectedStory.sourceCount} source{selectedStory.sourceCount !== 1 ? 's' : ''}
              </span>
              <button
                onClick={() => { setSelectedStory(null); setSelectedGroup(null); }}
                className="py-2 px-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-[10px] font-extrabold uppercase tracking-wider text-slate-700 transition-colors cursor-pointer active:scale-95 shadow-xs"
              >
                Close Dossier
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

export default function NewsletterLibraryPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center p-8 bg-[#fffaf0]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={36} className="animate-spin text-pink-500" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading Newsletter Library...</span>
        </div>
      </div>
    }>
      <NewsletterLibraryContent />
    </Suspense>
  );
}
