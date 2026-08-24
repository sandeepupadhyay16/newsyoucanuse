'use client';

import React, { useState, useEffect } from 'react';
import { 
  Archive, 
  Info, 
  Search, 
  Layers, 
  Calendar, 
  RotateCcw, 
  Activity,
  X,
  TrendingUp,
  Award,
  BookOpen,
  ArrowRight,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

interface ArchivedGroup {
  id: string;
  title: string;
  summary: string;
  lastCoverageDate: string;
  trajectoryPrediction: string;
  predictionsTimeline: string;
  predictionConfidence: number;
  upvotes: number;
  downvotes: number;
  therapeuticAreas: string[];
  createdAt: string;
}

export default function ArchivePage() {
  const [archivedGroups, setArchivedGroups] = useState<ArchivedGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<ArchivedGroup | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const fetchArchive = () => {
    setLoading(true);
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Filter groups marked as archived (older than 30 days)
          setArchivedGroups(data.filter(g => g.isArchived));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load archive:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchArchive();
  }, []);

  const handleRestore = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRestoringId(id);
    try {
      // Restore trend: update lastCoverageDate to now to move it out of 30-day auto-archive graveyard
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          lastCoverageDate: new Date().toISOString()
        })
      });
      if (res.ok) {
        setArchivedGroups(prev => prev.filter(g => g.id !== id));
        setSelectedGroup(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRestoringId(null);
    }
  };

  const filteredGroups = archivedGroups.filter(g => {
    const query = search.toLowerCase();
    return g.title.toLowerCase().includes(query) || 
           g.summary.toLowerCase().includes(query) || 
           (g.therapeuticAreas && g.therapeuticAreas.some(t => t.toLowerCase().includes(query)));
  });

  return (
    <div className="space-y-8 animate-fadeIn text-[#0a0a0a]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center text-white shrink-0 shadow-sm">
            <Archive size={20} />
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-black tracking-tight text-slate-950">Trend Archive</h1>
            <p className="text-xs text-slate-500 font-medium">Review technology sub-themes and groupings automatically archived after 30 days of inactivity.</p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-xl border border-slate-200 bg-[#fffaf0]/60 backdrop-blur-xs flex items-start gap-3 text-left">
        <Info size={16} className="text-[#ff4d8b] mt-0.5 shrink-0" />
        <p className="text-xs text-slate-600 leading-relaxed font-semibold">
          <strong>Archiving Policy:</strong> To keep forecasting models highly focused on active trends, any article groupings that have not received new source coverage for over 30 days are automatically graveyarded here. Restoring a trend resets its coverage date to today.
        </p>
      </div>

      {/* Search Input */}
      <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs flex items-center gap-3">
        <Search size={16} className="text-slate-400 shrink-0" />
        <input 
          type="text" 
          placeholder="Search archived themes by title, overview, or technology stream..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-xs text-[#0a0a0a] focus:outline-none placeholder-slate-400"
        />
      </div>

      {/* Main Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <Loader2 size={32} className="animate-spin text-pink-500" />
          <span className="text-xs text-slate-400 font-bold">Querying archive vault...</span>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-slate-200 bg-white rounded-3xl space-y-4">
          <Layers size={36} className="text-slate-350 mx-auto" />
          <div className="space-y-1">
            <p className="text-xs text-slate-500 font-bold">No archived trends found.</p>
            <p className="text-[10px] text-slate-400">{search ? 'Try relaxing your search terms.' : 'All trends are currently active on the forecasts dashboard.'}</p>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <div 
              key={group.id}
              onClick={() => setSelectedGroup(group)}
              className="p-6 rounded-2xl border border-slate-200 bg-white hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between group shadow-xs text-left"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[8px] bg-slate-100 border border-slate-200 text-slate-600 font-extrabold px-2 py-1 rounded uppercase tracking-wider">
                    {(group.therapeuticAreas || []).join(', ').replace(' Advancements', '').replace(' Capabilities', '')}
                  </span>
                  <span className="text-[8px] font-extrabold text-slate-400 bg-slate-50 border border-slate-200 px-2 py-1 rounded uppercase tracking-wider">
                    Archived
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-extrabold text-slate-900 text-xs tracking-tight group-hover:text-pink-600 transition-colors line-clamp-1">
                    {group.title}
                  </h3>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                  {group.summary}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-6 flex items-center justify-between text-[10px] font-bold">
                <span className="text-slate-400 flex items-center gap-1 font-semibold">
                  <Calendar size={10} />
                  <span>Coverage: {new Date(group.lastCoverageDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                </span>
                
                <button
                  type="button"
                  disabled={restoringId === group.id}
                  onClick={(e) => handleRestore(group.id, e)}
                  className="px-2.5 py-1.5 bg-pink-50 hover:bg-pink-600 border border-pink-100 hover:border-transparent text-pink-700 hover:text-white rounded-lg font-bold text-[9px] uppercase active:scale-95 transition-all flex items-center gap-1 cursor-pointer shrink-0"
                >
                  {restoringId === group.id ? <Loader2 size={8} className="animate-spin" /> : <RotateCcw size={10} />}
                  Restore
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DETAIL DIALOG */}
      {selectedGroup && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-[#fffcf5] border border-slate-200 rounded-3xl shadow-2xl overflow-hidden animate-zoomIn flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-200 bg-[#faf5e8]/90 backdrop-blur-xs flex items-center justify-between">
              <div className="text-left space-y-1">
                <span className="text-[9px] bg-pink-100 text-pink-700 border border-pink-200 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  {(selectedGroup.therapeuticAreas || []).join(', ')}
                </span>
                <h2 className="text-base font-black text-slate-950 leading-tight pr-4">
                  {selectedGroup.title}
                </h2>
              </div>
              <button 
                onClick={() => setSelectedGroup(null)}
                className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6 text-left custom-scrollbar">
              <div className="space-y-2">
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Trend Overview</h4>
                <p className="text-xs text-slate-700 leading-relaxed bg-white p-4 rounded-xl border border-slate-200 shadow-xs font-semibold">
                  {selectedGroup.summary}
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Archive Details</h4>
                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2 font-semibold">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Trajectory Outlook:</span>
                    <span className="text-pink-600 font-black uppercase">{selectedGroup.trajectoryPrediction}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Confidence Score:</span>
                    <span className="text-slate-800">{selectedGroup.predictionConfidence}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Last Ingestion Activity:</span>
                    <span className="text-slate-850">
                      {new Date(selectedGroup.lastCoverageDate).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-200 bg-[#faf5e8]/90 backdrop-blur-xs flex justify-end gap-2">
              <button
                onClick={() => setSelectedGroup(null)}
                className="py-2.5 px-5 bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 font-extrabold text-[10px] uppercase rounded-xl transition-all active:scale-95"
              >
                Close Vault
              </button>
              <button
                disabled={restoringId === selectedGroup.id}
                onClick={(e) => handleRestore(selectedGroup.id, e)}
                className="py-2.5 px-5 bg-slate-950 text-white font-extrabold text-[10px] uppercase rounded-xl transition-all active:scale-95 flex items-center gap-1.5 shadow-sm"
              >
                {restoringId === selectedGroup.id ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                Restore to Active Forecasts
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
