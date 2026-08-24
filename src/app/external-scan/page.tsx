'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePersona } from '@/components/ClientWrapper';
import { 
  Globe, 
  ExternalLink, 
  Plus, 
  Check, 
  Loader2, 
  Calendar, 
  User, 
  Rss,
  Trash2,
  ListPlus,
  Play,
  ToggleLeft,
  ToggleRight,
  Info,
  CheckCircle2,
  XCircle,
  X,
  Tag,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Archive
} from 'lucide-react';

interface ExternalStory {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceType: string;
  sourceUrl: string;
  author: string;
  publishDate: string | null;
  ingestedAt: string;
  impactWorkingScore: number;
  impactDevelopmentScore: number;
  feasibilityScore: number;
  relevancyScore: number;
  functionalDomains: string[];
  therapeuticAreas: string[];
  harvested: boolean;
  category: string;
  upvotes: number;
  downvotes: number;
  dismissedReason: string;
  pfizerImplication: string;
  scoreRationale: { strategicImpact?: string; innovationPotential?: string; commercialReadiness?: string } | null;
  sourceCount: number;
  sourceNames: string[];
}


interface IngestionSource {
  id: string;
  name: string;
  type: 'RSS Feed' | 'Website Scraper' | 'Newsletter Extract';
  url: string;
  frequency: 'Real-time' | 'Hourly' | 'Daily' | 'Weekly';
  enabled: boolean;
  category: string;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const INGESTION_FUNNY_MESSAGES = [
  "Bribing website administrators with virtual donuts...",
  "Asking the firewall if it supports friendly bots...",
  "Removing cookie banners with extreme prejudice...",
  "Pretending to be a human typing at 4000 words per minute...",
  "Consuming RSS feeds for breakfast...",
  "Decoding high-density pharmaceutical jargon...",
  "Convincing the Proposer agent to be less verbose...",
  "Critic agent is drafting a very stern compliance report...",
  "Judge agent is polishing its hammer...",
  "Scanning the digital horizon for breakthroughs...",
  "Tuning the duplicate detector to recognize Deja Vu...",
  "Filtering out the 54th article about blockchain in clinical trials...",
  "Optimizing pipeline bandwidth for maximum buzzwords...",
  "Translating 'synergy' into database query language...",
  "Consulting the compliance handbook... they said no, but we are scanning anyway...",
  "Asking the duplicate scanner if it has seen this duplicate duplicate scanner..."
];

export default function ExternalScanPage() {
  const { currentPersona } = usePersona();
  const [stories, setStories] = useState<ExternalStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [harvestingId, setHarvestingId] = useState<string | null>(null);
  const [harvestedIds, setHarvestedIds] = useState<string[]>([]);
  
  // Filtering states
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Voting & dismissal states
  const [dismissingFeedItemId, setDismissingFeedItemId] = useState<string | null>(null);
  const [dismissalReason, setDismissalReason] = useState('');
  const [selectedStory, setSelectedStory] = useState<ExternalStory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  // Refresh timing state
  const [lastScannedAt, setLastScannedAt] = useState<string | null>(null);
  const [nextRefreshAt, setNextRefreshAt] = useState<string | null>(null);

  useEffect(() => {
    fetchFeed();
  }, []);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const fetchFeed = () => {
    setLoading(true);
    fetch('/api/external-feed')
      .then(res => res.json())
      .then(data => {
        // Handle both legacy array and new {items, lastScannedAt, nextRefreshAt} shape
        if (Array.isArray(data)) {
          setStories(data);
        } else if (data.items) {
          setStories(data.items);
          if (data.lastScannedAt) setLastScannedAt(data.lastScannedAt);
          if (data.nextRefreshAt) setNextRefreshAt(data.nextRefreshAt);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleHarvest = async (story: ExternalStory) => {
    setHarvestingId(story.id);
    try {
      const payload = {
        title: story.title,
        problemStatement: story.summary,
        integrations: [],
        budgetStatus: 'Pre-allocated in standard budget',
        stakeholderStatus: 'TBD',
        opportunityCost: 'Status quo workflow limitations remain unmitigated.',
        businessCase: story.pfizerImplication || 'Extracted from horizon scanning market feed.',
        financialRoi: 250000,
        budgetRequiredVal: 100000,
        execSponsor: 'Steering Committee',
        productOwner: currentPersona.name,
        deploymentGateway: '',
        phase: 'Harvested', // Initial stage
        therapeuticAreas: story.therapeuticAreas,
        functionalDomains: story.functionalDomains,
        source: 'News Feed',
        sourceUrl: story.sourceUrl,
        author: story.author,
        publishDate: story.publishDate,
        impactWorkingScore: story.impactWorkingScore,
        impactDevelopmentScore: story.impactDevelopmentScore,
        feasibilityScore: story.feasibilityScore,
        relevancyScore: story.relevancyScore,
        submittedBy: currentPersona.name
      };

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // Mark item as harvested in database
        await fetch(`/api/external-feed?id=${story.id}`, {
          method: 'PUT'
        });

        setHarvestedIds(prev => [...prev, story.id]);
        addToast(`Successfully harvested "${story.title}" into Backlog!`, "success");
        fetchFeed(); // Refresh the list
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to harvest story');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error harvesting story: ' + err.message);
    } finally {
      setHarvestingId(null);
    }
  };

  const handleUpvote = async (feedItemId: string) => {
    try {
      const res = await fetch('/api/external-feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedItemId, voteType: 'upvote' })
      });
      if (res.ok) {
        addToast("Upvote recorded successfully!", "success");
        fetchFeed();
      } else {
        const err = await res.json();
        addToast(`Error upvoting: ${err.error || 'Request failed'}`, 'error');
      }
    } catch (err: any) {
      console.error(err);
      addToast("Failed to record vote due to network error", "error");
    }
  };

  const handleDownvoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dismissingFeedItemId) return;

    try {
      const res = await fetch('/api/external-feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedItemId: dismissingFeedItemId,
          voteType: 'downvote',
          reason: dismissalReason.trim()
        })
      });

      if (res.ok) {
        setDismissingFeedItemId(null);
        setDismissalReason('');
        addToast("Idea dismissed. Feedback logged to fine-tune scorecards.", "info");
        fetchFeed();
      } else {
        const err = await res.json();
        addToast(`Error dismissing: ${err.error || 'Request failed'}`, 'error');
      }
    } catch (err: any) {
      console.error(err);
      addToast("Failed to dismiss due to network error", "error");
    }
  };

  const handleArchive = async (story: ExternalStory) => {
    setHarvestingId(story.id);
    try {
      const payload = {
        title: story.title,
        problemStatement: story.summary,
        integrations: [],
        budgetStatus: 'Pre-allocated in standard budget',
        stakeholderStatus: 'TBD',
        opportunityCost: 'Status quo workflow limitations remain unmitigated.',
        businessCase: story.pfizerImplication || 'Extracted from horizon scanning market feed.',
        financialRoi: 250000,
        budgetRequiredVal: 100000,
        execSponsor: 'Steering Committee',
        productOwner: currentPersona.name,
        deploymentGateway: '',
        phase: 'Archived',
        therapeuticAreas: story.therapeuticAreas,
        functionalDomains: story.functionalDomains,
        source: 'News Feed',
        sourceUrl: story.sourceUrl,
        author: story.author,
        publishDate: story.publishDate,
        impactWorkingScore: story.impactWorkingScore,
        impactDevelopmentScore: story.impactDevelopmentScore,
        feasibilityScore: story.feasibilityScore,
        relevancyScore: story.relevancyScore,
        submittedBy: currentPersona.name
      };

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // Mark item as harvested in database to hide it
        await fetch(`/api/external-feed?id=${story.id}`, {
          method: 'PUT'
        });

        addToast(`Successfully archived "${story.title}" to Archive!`, "success");
        fetchFeed();
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to archive story');
      }
    } catch (err: any) {
      console.error(err);
      addToast('Error archiving story: ' + err.message, 'error');
    } finally {
      setHarvestingId(null);
    }
  };

  const handleDelete = (id: string, title: string) => {
    setDeleteTarget({ id, title });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const { id, title } = deleteTarget;
    setDeleteTarget(null);
    try {
      const res = await fetch(`/api/external-feed?id=${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        addToast(`Permanently deleted "${title}".`, "info");
        fetchFeed();
      } else {
        const err = await res.json();
        addToast(`Error deleting feed item: ${err.error || 'Request failed'}`, 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error deleting feed item due to network error', 'error');
    }
  };

  // Get unique list of categories from stories
  const uniqueCategories = Array.from(
    new Set(stories.map(s => s.category).filter(Boolean))
  );

  // Filter stories based on selected category
  const filteredStories = stories.filter(story => {
    if (selectedCategory === 'all') return true;
    return story.category?.toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <div className="space-y-8 text-[#0a0a0a]">
      <div className="space-y-8 animate-fadeIn">
      {/* Last Refresh / Next Refresh Info Bar */}
      <div className="px-4 py-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
            <Clock size={12} className="text-slate-400" />
            <span className="text-slate-400">Last refreshed:</span>
            <span className="text-slate-800 font-bold">
              {lastScannedAt
                ? new Date(lastScannedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                : 'No scan run yet'}
            </span>
          </div>
          <div className="w-px h-3 bg-slate-200 hidden sm:block" />
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
            <Calendar size={12} className="text-slate-400" />
            <span className="text-slate-400">Next scheduled refresh:</span>
            <span className="text-slate-800 font-bold">
              {nextRefreshAt
                ? new Date(nextRefreshAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                : '09:00 AM Eastern (Daily)'}
            </span>
          </div>
        </div>
        <span className="text-[9px] font-bold text-slate-400 bg-slate-50 border border-slate-200 px-2 py-1 rounded-md shrink-0">
          {stories.length} concepts in feed
        </span>
      </div>


      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0a0a0a] flex items-center gap-2">
            <Globe size={28} className="text-[#ff4d8b]" />
            <span>Idea Library</span>
          </h1>
          <p className="text-slate-550 text-sm mt-1">
            Browse ingested clinical research feeds and emerging AI topics scored by our multi-agent model evaluation pipeline.
          </p>
        </div>
      </div>

      {/* Category Filter Pills */}
      {stories.length > 0 && (
        <div className="flex flex-col gap-2 p-4 bg-white border border-slate-200 rounded-2xl shadow-xs animate-fadeIn">
          <div className="flex items-center gap-1.5 pb-1 border-b border-slate-100">
            <Tag size={12} className="text-slate-400" />
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Curate by Feed Category</span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1.5">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-full text-[10px] font-extrabold transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              All Categories
            </button>
            {uniqueCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-[10px] font-extrabold transition-all cursor-pointer ${
                  selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-slate-500">
          <div className="inline-block w-6 h-6 border-2 border-slate-200 border-t-pink-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-xs">Scanning external pharmaceutical portals & newsletters...</p>
        </div>
      ) : filteredStories.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-slate-200 rounded-2xl bg-[#f5f0e0]/10">
          <Rss size={32} className="mx-auto text-slate-400 mb-4" />
          <h3 className="font-bold text-slate-800 text-md">No Items to Display</h3>
          <p className="text-slate-500 text-xs mt-1">
            {selectedCategory === 'all' 
              ? 'Configure feed sources above and run an Ingestion Scan to score emerging AI research.' 
              : `No items found under the category "${selectedCategory}".`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStories.map((story) => {
            const isHarvested = story.harvested || harvestedIds.includes(story.id);
            const isWorking = harvestingId === story.id;

            return (
              <div 
                key={story.id}
                onClick={() => setSelectedStory(story)}
                className="flex flex-col justify-between p-6 rounded-2xl border border-slate-200 bg-white hover:border-slate-350 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-fadeIn cursor-pointer"
              >
                <div className="space-y-4">
                  {/* Header metadata row */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
                    {story.therapeuticAreas.length > 0 && (
                      <span className="text-[9px] uppercase font-bold tracking-wider text-pink-600 bg-pink-50 px-2 py-0.5 rounded border border-pink-100 shrink-0">
                        {story.therapeuticAreas.join(', ')}
                      </span>
                    )}
                    {story.sourceNames && story.sourceNames.length > 1 ? (
                      <span 
                        className="text-[9px] font-bold px-2 py-0.5 rounded border bg-amber-50 text-amber-800 border-amber-150 shrink-0 flex items-center gap-0.5"
                        title={`Covered by: ${story.sourceNames.join(', ')}`}
                      >
                        🔥 Covered by {story.sourceNames.length} sources
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded border bg-blue-50 text-blue-800 border-blue-100 shrink-0">
                        {story.source}
                      </span>
                    )}
                    {story.category && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded border bg-pink-50 text-[#ff4d8b] border-pink-100 shrink-0 flex items-center gap-0.5">
                        <Tag size={8} />
                        <span>{story.category}</span>
                      </span>
                    )}
                  </div>

                  {/* Title & Author / Date */}
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-sm group min-h-[40px] line-clamp-2">
                      <a 
                        href={story.sourceUrl.startsWith('http') ? story.sourceUrl : '#'} 
                        target={story.sourceUrl.startsWith('http') ? "_blank" : undefined}
                        rel={story.sourceUrl.startsWith('http') ? "noopener noreferrer" : undefined}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-[#ff4d8b] hover:underline flex items-center gap-1"
                      >
                        {story.title}
                        {story.sourceUrl.startsWith('http') && (
                          <ExternalLink size={12} className="text-slate-400 group-hover:text-[#ff4d8b] transition-colors shrink-0" />
                        )}
                      </a>
                    </h3>
                    <div className="flex justify-between items-center text-[9px] text-slate-400">
                      <span>{story.author ? `by ${story.author}` : (story.sourceNames && story.sourceNames.length > 1 ? 'Multiple Sources' : story.source)}</span>
                      <span>
                        {`Ingested: ${new Date(story.ingestedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`}
                      </span>
                    </div>

                  </div>

                  {/* Summary */}
                  <p className="text-xs text-slate-600 leading-relaxed font-semibold line-clamp-4 min-h-[72px]">
                    {story.summary}
                  </p>

                  {/* Functional domains */}
                  <div className="flex flex-wrap gap-1">
                    {story.functionalDomains.map(dm => (
                      <span key={dm} className="text-[9px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded border border-slate-200">
                        {dm}
                      </span>
                    ))}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-100 my-2"></div>

                  {/* Scores section */}
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-700 font-bold">Relevancy Score:</span>
                      <span className="text-[#ff4d8b] font-extrabold">{story.relevancyScore.toFixed(1)}%</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-[8px] text-slate-500 font-extrabold">
                      {/* Strategic Impact */}
                      <div className="space-y-1 bg-sky-50/40 border border-sky-100/50 rounded-lg p-1.5 text-center">
                        <div className="text-sky-800">Strategic Impact</div>
                        <div className="text-sky-600 text-xs font-black">{story.impactWorkingScore}%</div>
                      </div>

                      {/* Innovation Potential */}
                      <div className="space-y-1 bg-indigo-50/40 border border-indigo-100/50 rounded-lg p-1.5 text-center">
                        <div className="text-indigo-800">Innovation Potential</div>
                        <div className="text-indigo-600 text-xs font-black">{story.impactDevelopmentScore}%</div>
                      </div>

                      {/* Commercial Readiness */}
                      <div className="space-y-1 bg-purple-50/40 border border-purple-100/50 rounded-lg p-1.5 text-center">
                        <div className="text-purple-800 font-bold">Commercial Readiness</div>
                        <div className="text-purple-600 text-xs font-black">{story.feasibilityScore}%</div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Actions Footer */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
                  {/* Upvote & Downvote Row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      {/* Upvote */}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleUpvote(story.id); }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-350 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 text-[10px] font-bold transition-all active:scale-95 cursor-pointer"
                        title="Upvote Idea"
                      >
                        <ThumbsUp size={11} className="text-emerald-500" />
                        <span>{story.upvotes || 0}</span>
                      </button>

                      {/* Downvote / Dismiss */}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setDismissingFeedItemId(story.id); }}
                        className="flex items-center justify-center p-1.5 rounded-lg border border-slate-200 hover:border-rose-300 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-all active:scale-95 cursor-pointer"
                        title="Downvote & Dismiss Idea"
                      >
                        <ThumbsDown size={11} />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Archive Button */}
                      <button
                        type="button"
                        disabled={isHarvested}
                        onClick={(e) => { e.stopPropagation(); handleArchive(story); }}
                        className="flex items-center justify-center p-1.5 rounded-lg border border-slate-200 hover:border-amber-300 bg-white hover:bg-amber-50 text-slate-600 hover:text-amber-600 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                        title="Archive Idea"
                      >
                        <Archive size={11} />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDelete(story.id, story.title); }}
                        className="flex items-center justify-center p-1.5 rounded-lg border border-slate-200 hover:border-rose-300 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-all active:scale-95 cursor-pointer"
                        title="Delete Idea"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>

                  {/* Promote to Backlog (Primary Action) */}
                  <button
                    type="button"
                    disabled={isHarvested || isWorking}
                    onClick={(e) => { e.stopPropagation(); handleHarvest(story); }}
                    className={`w-full py-1.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-xs ${
                      isHarvested 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-not-allowed shadow-none'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    {isWorking ? (
                      <>
                        <Loader2 size={10} className="animate-spin" />
                        <span>Pushing...</span>
                      </>
                    ) : isHarvested ? (
                      <>
                        <Check size={10} className="text-emerald-600" />
                        <span>Pushed to Backlog</span>
                      </>
                    ) : (
                      <>
                        <Plus size={10} />
                        <span>Prioritize this Idea</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>

      {/* Dismiss Reason Dialog Modal */}
      {dismissingFeedItemId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 max-w-md w-full shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <ThumbsDown size={16} className="text-rose-500" />
                <span>Dismiss Horizon Feed Concept</span>
              </h3>
              <button 
                onClick={() => setDismissingFeedItemId(null)}
                className="text-slate-400 hover:text-slate-950 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleDownvoteSubmit} className="space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Please specify the primary mismatch or reason for dismissing this feed item. This user feedback is utilized to adjust the weighted criteria scoring model for incoming scans.
              </p>

              <textarea
                required
                value={dismissalReason}
                onChange={(e) => setDismissalReason(e.target.value)}
                placeholder="e.g. Technology fits better in clinical development rather than commercial operations, or insufficient ROI potential."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-[#0a0a0a] min-h-[100px] focus:outline-none focus:bg-white focus:border-slate-400 transition-colors placeholder:text-slate-400 animate-fadeIn"
              />

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDismissingFeedItemId(null)}
                  className="px-4 py-2 border border-slate-200 hover:border-slate-350 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
                >
                  Dismiss Concept
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Story Detail Modal */}
      {selectedStory && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#fffaf0] border border-slate-200 p-6 shadow-2xl relative animate-fadeIn max-h-[90vh] overflow-y-auto text-[#0a0a0a] space-y-6">
            <button 
              onClick={() => setSelectedStory(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-955 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="space-y-2 pb-4 border-b border-slate-250">
              <div className="flex items-center gap-2 flex-wrap text-[10px] text-slate-400 font-semibold">
                {selectedStory.therapeuticAreas.length > 0 && (
                  <span className="text-[9px] uppercase font-bold tracking-wider text-pink-600 bg-pink-50 px-2 py-0.5 rounded border border-pink-100 shrink-0">
                    {selectedStory.therapeuticAreas.join(', ')}
                  </span>
                )}
                {selectedStory.sourceNames && selectedStory.sourceNames.length > 1 ? (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded border bg-amber-50 text-amber-800 border-amber-150 shrink-0">
                    Covered by: {selectedStory.sourceNames.join(', ')}
                  </span>
                ) : (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded border bg-blue-50 text-blue-800 border-blue-100 shrink-0">
                    {selectedStory.source}
                  </span>
                )}
                {selectedStory.category && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded border bg-pink-50 text-[#ff4d8b] border-pink-100 shrink-0 flex items-center gap-0.5">
                    <Tag size={8} />
                    <span>{selectedStory.category}</span>
                  </span>
                )}
              </div>
              <h2 className="text-md font-bold text-[#0a0a0a] group flex items-center gap-1">
                <a 
                  href={selectedStory.sourceUrl.startsWith('http') ? selectedStory.sourceUrl : '#'} 
                  target={selectedStory.sourceUrl.startsWith('http') ? "_blank" : undefined}
                  rel={selectedStory.sourceUrl.startsWith('http') ? "noopener noreferrer" : undefined}
                  onClick={(e) => e.stopPropagation()}
                  className="hover:text-[#ff4d8b] hover:underline flex items-center gap-1"
                >
                  {selectedStory.title}
                  {selectedStory.sourceUrl.startsWith('http') && (
                    <ExternalLink size={14} className="text-slate-400 group-hover:text-[#ff4d8b] transition-colors shrink-0" />
                  )}
                </a>
              </h2>
              <div className="flex justify-between items-center text-[9px] text-slate-400">
                <span>{selectedStory.author ? `by ${selectedStory.author}` : (selectedStory.sourceNames && selectedStory.sourceNames.length > 1 ? 'Multiple Sources' : selectedStory.source)}</span>
                <span>
                  {`Ingested: ${new Date(selectedStory.ingestedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}`}
                </span>
              </div>

            </div>

            {/* Core Info */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Concept Summary</h4>
                <p className="text-xs text-slate-700 leading-relaxed bg-white p-4 rounded-xl border border-slate-200">
                  {selectedStory.summary}
                </p>
              </div>

              {selectedStory.pfizerImplication && (
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Strategic Impact Areas for Pfizer</h4>
                  <p className="text-xs text-slate-750 leading-relaxed bg-pink-50/50 p-4 rounded-xl border border-pink-150/60 font-semibold">
                    {selectedStory.pfizerImplication}
                  </p>
                </div>
              )}


              <div className="space-y-1.5">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Functional Tags</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedStory.functionalDomains.map(dm => (
                    <span key={dm} className="text-[9px] bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded border border-slate-200">
                      {dm}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Relevancy Score Details */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Relevancy Grading</h4>
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4">
                <div className="flex justify-between items-center text-xs font-bold border-b border-slate-100 pb-2">
                  <span className="text-slate-700">Overall Score:</span>
                  <span className="text-[#ff4d8b] text-sm">{selectedStory.relevancyScore.toFixed(1)}%</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center text-[9px] font-bold">
                  <div className="bg-sky-50/40 border border-sky-100/50 rounded-lg p-2">
                    <div className="text-sky-850">Strategic Impact</div>
                    <div className="text-sky-600 text-xs font-black mt-1">{selectedStory.impactWorkingScore}%</div>
                    {selectedStory.scoreRationale?.strategicImpact && (
                      <p className="text-[8px] text-slate-400 font-normal mt-1.5 text-left leading-relaxed">
                        {selectedStory.scoreRationale.strategicImpact}
                      </p>
                    )}
                  </div>
                  <div className="bg-indigo-50/40 border border-indigo-100/50 rounded-lg p-2">
                    <div className="text-indigo-850">Innovation Potential</div>
                    <div className="text-indigo-600 text-xs font-black mt-1">{selectedStory.impactDevelopmentScore}%</div>
                    {selectedStory.scoreRationale?.innovationPotential && (
                      <p className="text-[8px] text-slate-400 font-normal mt-1.5 text-left leading-relaxed">
                        {selectedStory.scoreRationale.innovationPotential}
                      </p>
                    )}
                  </div>
                  <div className="bg-purple-50/40 border border-purple-100/50 rounded-lg p-2">
                    <div className="text-purple-855">Commercial Readiness</div>
                    <div className="text-purple-600 text-xs font-black mt-1">{selectedStory.feasibilityScore}%</div>
                    {selectedStory.scoreRationale?.commercialReadiness && (
                      <p className="text-[8px] text-slate-400 font-normal mt-1.5 text-left leading-relaxed">
                        {selectedStory.scoreRationale.commercialReadiness}
                      </p>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Actions Footer */}
            <div className="pt-4 border-t border-slate-250 flex flex-col gap-3">
              <div className="flex justify-between items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => { handleUpvote(selectedStory.id); setSelectedStory(prev => prev ? {...prev, upvotes: prev.upvotes + 1} : null); }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-350 bg-white text-slate-600 font-bold text-[10px] cursor-pointer"
                  >
                    <ThumbsUp size={11} className="text-emerald-500" />
                    <span>Upvote ({selectedStory.upvotes || 0})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDismissingFeedItemId(selectedStory.id); setSelectedStory(null); }}
                    className="flex items-center justify-center p-2 rounded-lg border border-slate-200 hover:border-rose-350 bg-white text-slate-600 hover:text-rose-600 cursor-pointer"
                    title="Dismiss"
                  >
                    <ThumbsDown size={11} />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => { handleArchive(selectedStory); setSelectedStory(null); }}
                    className="flex items-center justify-center p-2 rounded-lg border border-slate-200 hover:border-amber-350 bg-white text-slate-600 hover:text-amber-600 cursor-pointer"
                    title="Archive"
                  >
                    <Archive size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={() => { handleDelete(selectedStory.id, selectedStory.title); setSelectedStory(null); }}
                    className="flex items-center justify-center p-2 rounded-lg border border-slate-200 hover:border-rose-350 bg-white text-slate-600 hover:text-rose-600 cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedStory(null)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={selectedStory.harvested || harvestedIds.includes(selectedStory.id)}
                  onClick={() => { handleHarvest(selectedStory); setSelectedStory(null); }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-xs ${
                    selectedStory.harvested || harvestedIds.includes(selectedStory.id)
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-not-allowed shadow-none'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {selectedStory.harvested || harvestedIds.includes(selectedStory.id) ? (
                    <>
                      <Check size={12} className="text-emerald-600" />
                      <span>Pushed to Backlog</span>
                    </>
                  ) : (
                    <>
                      <Plus size={12} />
                      <span>Prioritize this Idea</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Toasts list */}
      <div className="fixed bottom-6 right-6 z-55 space-y-3 max-w-sm w-full">
        {toasts.map(t => (
          <div 
            key={t.id}
            className={`p-4 rounded-xl border shadow-xl flex justify-between items-start gap-3 backdrop-blur-md animate-fadeIn transition-all ${
              t.type === 'success' 
                ? 'bg-emerald-50/90 text-emerald-950 border-emerald-250' 
                : t.type === 'error'
                ? 'bg-rose-50/90 text-rose-955 border-rose-250'
                : 'bg-[#fffaf0]/95 text-slate-850 border-slate-350'
            }`}
          >
            <div className="flex gap-2">
              {t.type === 'success' && <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />}
              {t.type === 'error' && <XCircle size={16} className="text-rose-600 mt-0.5 shrink-0" />}
              {t.type === 'info' && <Info size={16} className="text-[#ff4d8b] mt-0.5 shrink-0" />}
              <p className="text-xs font-bold leading-relaxed">{t.message}</p>
            </div>
            <button 
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-850 transition-colors shrink-0 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Centered custom delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-[#fffcf5] border border-slate-200 rounded-3xl shadow-2xl overflow-hidden animate-zoomIn flex flex-col p-6 space-y-6 text-left">
            <div className="space-y-2">
              <h3 className="text-sm font-black text-slate-950 uppercase tracking-wider">Confirm Deletion</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                Are you sure you want to permanently delete "{deleteTarget.title}"?
              </p>
            </div>
            
            <div className="flex justify-end gap-2 text-[10px] font-bold">
              <button
                onClick={() => setDeleteTarget(null)}
                className="py-2 px-5 bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 uppercase rounded-xl transition-all active:scale-95 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="py-2 px-5 bg-rose-600 border border-rose-700 hover:bg-rose-700 text-white uppercase rounded-xl transition-all active:scale-95 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
