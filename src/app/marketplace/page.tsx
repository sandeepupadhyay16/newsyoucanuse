'use client';

import React, { useState, useEffect } from 'react';
import { usePersona } from '@/components/ClientWrapper';
import { 
  Search, 
  DollarSign, 
  Activity, 
  Plus, 
  Layers,
  ThumbsUp,
  ThumbsDown,
  Archive,
  X
} from 'lucide-react';
import Link from 'next/link';
import ProjectDetailModal, { Project, getPhaseBadgeColor } from '@/components/ProjectDetailModal';

// Extend local Project interface to include upvote/downvote fields
interface ExtendedProject extends Project {
  upvotes?: number;
  downvotes?: number;
  dismissedReason?: string;
}

export default function MarketplacePage() {
  const { currentPersona } = usePersona();
  const [projects, setProjects] = useState<ExtendedProject[]>([]);
  const [search, setSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  // Downvote / Dismiss modal state
  const [dismissingProjectId, setDismissingProjectId] = useState<string | null>(null);
  const [dismissalReason, setDismissalReason] = useState('');

  const fetchProjects = () => {
    setLoading(true);
    fetch('/api/projects?excludePhase=Draft,Sent%20Back,Archived')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProjects(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load projects:', err);
        setLoading(false);
      });
  };

  // Fetch projects from local db
  useEffect(() => {
    fetchProjects();
  }, []);

  const handleUpvote = async (projectId: string) => {
    try {
      const res = await fetch('/api/projects/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, voteType: 'upvote' })
      });
      if (res.ok) {
        fetchProjects();
      }
    } catch (err) {
      console.error('Failed to upvote:', err);
    }
  };

  const handleDownvoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dismissingProjectId) return;

    try {
      const res = await fetch('/api/projects/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: dismissingProjectId,
          voteType: 'downvote',
          reason: dismissalReason.trim()
        })
      });

      if (res.ok) {
        setDismissingProjectId(null);
        setDismissalReason('');
        fetchProjects();
      }
    } catch (err) {
      console.error('Failed to downvote/dismiss:', err);
    }
  };

  const sortedProjects = [...projects].sort((a, b) => {
    const dateA = new Date(a.createdAt || 0);
    const dateB = new Date(b.createdAt || 0);
    dateA.setHours(0, 0, 0, 0);
    dateB.setHours(0, 0, 0, 0);
    if (dateB.getTime() !== dateA.getTime()) return dateB.getTime() - dateA.getTime();
    return (b.relevancyScore ?? b.readinessScore ?? 0) - (a.relevancyScore ?? a.readinessScore ?? 0);
  });

  const filteredProjects = sortedProjects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                          p.problemStatement.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-8 text-[#0a0a0a]">
      <div className="space-y-8 animate-fadeIn">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0a0a0a]">Curated Idea Backlog</h1>
          <p className="text-slate-550 text-sm mt-1">Discover, prioritize, and structure emerging commercial AI ideation dossiers under evaluation.</p>
        </div>
        
        <div className="flex items-center gap-3 self-start">
          <Link 
            href="/archive"
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-350 bg-white text-slate-800 font-semibold text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Archive size={14} />
            <span>Archive View</span>
          </Link>

          <Link 
            href="/intake"
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus size={14} />
            <span>Submit New Concept</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="p-5 rounded-2xl border border-slate-200 bg-[#f5f0e0]/30 flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by topic title or problem keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs text-[#0a0a0a] placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
          />
        </div>
      </div>

      {/* Grid of Projects */}
      {loading ? (
        <div className="py-20 text-center text-slate-505">
          <div className="inline-block w-6 h-6 border-2 border-slate-200 border-t-pink-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-xs">Loading portfolio database...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-slate-200 rounded-2xl bg-[#f5f0e0]/10">
          <Layers size={32} className="mx-auto text-slate-400 mb-4" />
          <h3 className="font-bold text-slate-800 text-md">No AI Ideas Found</h3>
          <p className="text-slate-500 text-xs mt-1">Try relaxing your search terms or filters.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((p) => (
            <div 
              key={p.id}
              onClick={() => setSelectedProject(p)}
              className="p-6 rounded-2xl border border-slate-200 bg-white hover:shadow-lg cursor-pointer transition-all hover:-translate-y-1 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                {/* Meta details */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-pink-600 bg-pink-50 px-2 py-0.5 rounded border border-pink-100 truncate max-w-[45%]">
                    {(p.therapeuticAreas || []).join(', ')}
                  </span>
                  
                  <div className="flex gap-1.5 items-center">
                    <span className="text-[9px] font-bold text-blue-800 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                      {p.source || 'Intake Wizard'}
                    </span>
                    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded border shrink-0 ${getPhaseBadgeColor(p.phase)}`}>
                      {p.phase}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-md group-hover:text-pink-500 transition-colors line-clamp-1">{p.title}</h3>
                  <p className="text-[10px] text-slate-500 font-semibold line-clamp-1" title={(p.functionalDomains || []).join(', ')}>
                    {(p.functionalDomains || []).join(' • ') || p.functionalDomain}
                  </p>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {p.problemStatement}
                </p>
              </div>

              <div>
                {/* Upvote / Downvote Action Row */}
                <div 
                  className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-100"
                  onClick={(e) => e.stopPropagation()} // Stop modal from popping up
                >
                  <button
                    type="button"
                    onClick={() => handleUpvote(p.id)}
                    className="flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                  >
                    <ThumbsUp size={11} className="text-emerald-600" />
                    <span>Upvote ({p.upvotes || 0})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDismissingProjectId(p.id);
                      setDismissalReason('');
                    }}
                    className="flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-rose-700 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                  >
                    <ThumbsDown size={11} className="text-rose-500" />
                    <span>Dismiss</span>
                  </button>
                </div>

                {/* Cards footer */}
                <div className="border-t border-slate-100 mt-4 pt-4 flex items-center justify-between">
                  <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1 shrink-0">
                    <Activity size={12} className="text-pink-500" />
                    <span>{((p.relevancyScore ?? p.readinessScore)).toFixed(0)}% Relevancy</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold">
                    Ingested: {p.createdAt ? new Date(p.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* Dismiss Reason Dialog Modal */}
      {dismissingProjectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 max-w-md w-full shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <ThumbsDown size={16} className="text-rose-500" />
                <span>Dismiss Ideation Proposal</span>
              </h3>
              <button 
                onClick={() => setDismissingProjectId(null)}
                className="text-slate-400 hover:text-slate-900 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleDownvoteSubmit} className="space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Please specify the primary mismatch or reason for dismissing this concept. This feedback is fed directly to the local scoring models to align future automated evaluations.
              </p>

              <textarea
                required
                value={dismissalReason}
                onChange={(e) => setDismissalReason(e.target.value)}
                placeholder="e.g. Budget size is too large for the low therapeutic urgency, or overlaps with existing Omnichannel project."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-[#0a0a0a] min-h-[100px] focus:outline-none focus:bg-white focus:border-slate-400 transition-colors placeholder:text-slate-400"
              />

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDismissingProjectId(null)}
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

      {/* Project Dossier Modal */}
      <ProjectDetailModal project={selectedProject} onClose={() => setSelectedProject(null)} onRefresh={fetchProjects} />
    </div>
  );
}
