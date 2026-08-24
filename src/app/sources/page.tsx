'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Link2,
  Plus,
  Trash2,
  Edit3,
  Check,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Activity,
  Sparkles,
  RefreshCw,
  TrendingUp,
  Cpu,
  Workflow,
  Compass,
  Code2,
  CheckCircle2
} from 'lucide-react';
import SemanticVectorSpace from '@/components/SemanticVectorSpace';

// ─────────────── Types ───────────────
interface FeedSource {
  id: string;
  name: string;
  type: string;
  url: string;
  frequency: string;
  enabled: boolean;
  category: string;
  lastScannedAt?: string | null;
  alreadyExists?: boolean;
}

interface Recommendation {
  name: string;
  type: string;
  url: string;
  justification: string;
  trustScore: number;
  category: string;
}

// ─────────────── Helpers ───────────────
const STREAM_COLORS: Record<string, string> = {
  'Frontier Model Capabilities': 'from-pink-500 to-rose-500',
  'Model-on-Chip Advancements': 'from-amber-500 to-orange-500',
  'Agentic Architectures': 'from-emerald-500 to-teal-500',
  'Ways of Working': 'from-blue-500 to-cyan-500',
  'Development Frameworks': 'from-purple-500 to-indigo-500',
};
const STREAM_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  'Frontier Model Capabilities': Sparkles,
  'Model-on-Chip Advancements': Cpu,
  'Agentic Architectures': Workflow,
  'Ways of Working': Compass,
  'Development Frameworks': Code2,
};
const getStreamGradient = (stream: string) => STREAM_COLORS[stream] || 'from-slate-500 to-slate-700';
const getStreamIcon = (stream: string) => STREAM_ICONS[stream] || TrendingUp;

const DISCOVERY_STAGES = [
  'Initializing Source Discovery Agent...',
  'Scouring web index for active RSS feeds...',
  'Crawling search results for relevance signals...',
  'Filtering by technology alignment...',
  'Calculating authority & trust scores...',
  'Finalizing recommendations...',
];

// ─────────────── Component ───────────────
export default function SourcesPage() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'discover' | 'streams' | 'vector'>('catalog');

  // ── Shared state
  const [techStreams, setTechStreams] = useState<string[]>([]);
  const [sources, setSources] = useState<FeedSource[]>([]);
  const [loadingSources, setLoadingSources] = useState(true);

  // ── Catalog tab state
  const [scanningSourceId, setScanningSourceId] = useState<string | null>(null);
  const [newSource, setNewSource] = useState({
    name: '', type: 'RSS Feed' as string, url: '', frequency: 'Daily' as string, category: ''
  });
  const [addingSource, setAddingSource] = useState(false);

  // ── Discover tab state
  const [discoverStream, setDiscoverStream] = useState('');
  const [customDiscoverQuery, setCustomDiscoverQuery] = useState('');
  const [discovering, setDiscovering] = useState(false);
  const [discoveryStage, setDiscoveryStage] = useState('');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [registeringUrl, setRegisteringUrl] = useState<string | null>(null);

  // ── Streams tab state
  const [newStreamValue, setNewStreamValue] = useState('');
  const [savingStreams, setSavingStreams] = useState(false);
  const [editingStreamIndex, setEditingStreamIndex] = useState<number | null>(null);
  const [editingStreamValue, setEditingStreamValue] = useState('');
  const [editingQueryValue, setEditingQueryValue] = useState('');
  const [discoveryQueries, setDiscoveryQueries] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'source' | 'stream'; idOrIdx: string | number; name: string } | null>(null);

  // ─────────────── Load on mount ───────────────
  useEffect(() => {
    loadSources();
    loadConfig();
    loadRecommendations();
  }, []);

  useEffect(() => {
    if (techStreams.length > 0) {
      if (!newSource.category) setNewSource(p => ({ ...p, category: techStreams[0] }));
      if (!discoverStream) {
        setDiscoverStream(techStreams[0]);
      }
    }
  }, [techStreams]);

  useEffect(() => {
    if (discoverStream && discoveryQueries) {
      setCustomDiscoverQuery(discoveryQueries[discoverStream] || `${discoverStream} blog RSS feed`);
    }
  }, [discoverStream, discoveryQueries]);

  // ─────────────── Data loaders ───────────────
  const loadSources = useCallback(() => {
    setLoadingSources(true);
    fetch('/api/external-feed/sources')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setSources(data); })
      .catch(console.error)
      .finally(() => setLoadingSources(false));
  }, []);

  const loadConfig = useCallback(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(data => { 
        if (data?.techStreams) setTechStreams(data.techStreams); 
        if (data?.discoveryQueries) setDiscoveryQueries(data.discoveryQueries);
      })
      .catch(console.error);
  }, []);

  const loadRecommendations = useCallback(() => {
    setLoadingRecs(true);
    fetch('/api/operations/discover-sources')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data.recommendations)) setRecommendations(data.recommendations); })
      .catch(console.error)
      .finally(() => setLoadingRecs(false));
  }, []);

  // ─────────────── Catalog tab handlers ───────────────
  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSource.name.trim() || !newSource.url.trim() || !newSource.category) return;
    setAddingSource(true);
    try {
      const res = await fetch('/api/external-feed/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSource)
      });
      const data = await res.json();
      if (res.ok) {
        if (data.alreadyExists) {
          alert(`"${data.name}" is already registered. Sources are deduplicated by URL.`);
        } else {
          setNewSource(p => ({ ...p, name: '', url: '' }));
          loadSources();
          loadRecommendations();
        }
      } else {
        alert(data.error || 'Failed to add source');
      }
    } catch (e) { console.error(e); }
    finally { setAddingSource(false); }
  };

  const handleToggleSource = async (id: string, enabled: boolean) => {
    try {
      await fetch('/api/external-feed/sources', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, enabled: !enabled })
      });
      setSources(prev => prev.map(s => s.id === id ? { ...s, enabled: !enabled } : s));
    } catch (e) { console.error(e); }
  };

  const handleDeleteSource = (id: string, name: string) => {
    setDeleteTarget({ type: 'source', idOrIdx: id, name });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const { type, idOrIdx } = deleteTarget;
    setDeleteTarget(null);

    if (type === 'source') {
      try {
        await fetch(`/api/external-feed/sources?id=${idOrIdx}`, { method: 'DELETE' });
        setSources(prev => prev.filter(s => s.id !== idOrIdx));
      } catch (e) { console.error(e); }
    } else {
      setSavingStreams(true);
      try {
        const idx = idOrIdx as number;
        const streamToDelete = techStreams[idx];
        const nextStreams = techStreams.filter((_, i) => i !== idx);
        const nextQueries = { ...discoveryQueries };
        delete nextQueries[streamToDelete];
        await postStreamsAndQueries(nextStreams, nextQueries);
      }
      catch (e: any) { alert(e.message); }
      finally { setSavingStreams(false); }
    }
  };

  const handleScanSource = async (sourceId: string) => {
    setScanningSourceId(sourceId);
    try {
      const res = await fetch(`/api/external-feed/scan?sourceId=${sourceId}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) alert('Scan queued successfully!');
      else alert(`Scan failed: ${data.error || 'Check operations console'}`);
    } catch (e) { console.error(e); }
    finally { setScanningSourceId(null); }
  };

  // ─────────────── Discover tab handlers ───────────────
  const handleRunDiscovery = async () => {
    if (!discoverStream) return;
    setDiscovering(true);
    setDiscoveryStage(DISCOVERY_STAGES[0]);

    const interval = setInterval(() => {
      setDiscoveryStage(prev => {
        const idx = DISCOVERY_STAGES.indexOf(prev);
        return idx < DISCOVERY_STAGES.length - 1 ? DISCOVERY_STAGES[idx + 1] : prev;
      });
    }, 700);

    try {
      const res = await fetch('/api/operations/discover-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stream: discoverStream, query: customDiscoverQuery })
      });
      await res.json();
      clearInterval(interval);
      setDiscoveryStage('');
      await loadRecommendations();
    } catch (e) {
      clearInterval(interval);
      setDiscoveryStage('');
      console.error(e);
      alert('Discovery agent encountered an error.');
    } finally {
      setDiscovering(false);
    }
  };

  const handleAcceptRec = async (rec: Recommendation) => {
    setRegisteringUrl(rec.url);
    try {
      const res = await fetch('/api/external-feed/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: rec.name,
          type: rec.type,
          url: rec.url,
          frequency: 'Daily',
          category: rec.category || discoverStream
        })
      });
      const data = await res.json();
      if (res.ok) {
        await fetch(`/api/operations/discover-sources?url=${encodeURIComponent(rec.url)}`, { method: 'DELETE' });
        setRecommendations(prev => prev.filter(r => r.url !== rec.url));
        loadSources();
        if (data.alreadyExists) alert(`"${rec.name}" was already registered.`);
      } else {
        alert(data.error || 'Failed to register source');
      }
    } catch (e) { console.error(e); }
    finally { setRegisteringUrl(null); }
  };

  const handleDismissRec = async (url: string) => {
    try {
      await fetch(`/api/operations/discover-sources?url=${encodeURIComponent(url)}`, { method: 'DELETE' });
      setRecommendations(prev => prev.filter(r => r.url !== url));
    } catch (e) { console.error(e); }
  };

  // ─────────────── Streams tab handlers ───────────────
  const postStreamsAndQueries = async (updatedStreams: string[], updatedQueries: Record<string, string>) => {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        techStreams: updatedStreams, 
        discoveryQueries: updatedQueries,
        role: 'ADMIN' 
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update configuration');
    
    setTechStreams(data.techStreams);
    if (data.discoveryQueries) setDiscoveryQueries(data.discoveryQueries);
  };

  const handleAddStream = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newStreamValue.trim();
    if (!trimmed || techStreams.includes(trimmed)) { alert('Stream already exists or empty.'); return; }
    setSavingStreams(true);
    try { 
      const updatedQueries = {
        ...discoveryQueries,
        [trimmed]: `${trimmed} blog RSS feed`
      };
      await postStreamsAndQueries([...techStreams, trimmed], updatedQueries); 
      setNewStreamValue(''); 
    }
    catch (e: any) { alert(e.message); }
    finally { setSavingStreams(false); }
  };

  const handleDeleteStream = (idx: number) => {
    const streamToDelete = techStreams[idx];
    if (techStreams.length <= 1) { alert('Must keep at least one stream.'); return; }
    setDeleteTarget({ type: 'stream', idOrIdx: idx, name: streamToDelete });
  };

  const handleSaveStreamEdit = async (idx: number) => {
    const oldStreamName = techStreams[idx];
    const newStreamName = editingStreamValue.trim();
    if (!newStreamName || (newStreamName !== oldStreamName && techStreams.includes(newStreamName))) {
      alert('Invalid or duplicate stream name.');
      return;
    }
    setSavingStreams(true);
    try {
      const nextStreams = techStreams.map((s, i) => i === idx ? newStreamName : s);
      const nextQueries = { ...discoveryQueries };
      
      // Update template query key
      const queryVal = editingQueryValue.trim() || `${newStreamName} blog RSS feed`;
      delete nextQueries[oldStreamName];
      nextQueries[newStreamName] = queryVal;

      await postStreamsAndQueries(nextStreams, nextQueries);
      setEditingStreamIndex(null);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSavingStreams(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn text-[#0a0a0a]">
      {/* Title Header */}
      <div className="flex flex-col gap-1 border-b border-slate-200 pb-5">
        <h1 className="text-3xl font-black tracking-tight text-slate-950">Sources & Streams Hub</h1>
        <p className="text-xs text-slate-500 font-medium">Manage manually registered feeds, technology stream mappings, and search query templates.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-px">
        {[
          { id: 'catalog', label: 'Source Catalog', count: sources.length },
          { id: 'discover', label: 'Discover & Recommend', count: recommendations.length },
          { id: 'streams', label: 'Technology Streams', count: techStreams.length },
          { id: 'vector', label: '3D Vector Space', count: 0 }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 px-4 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-550 border border-slate-200 text-[9px] font-bold">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════ TAB 1: SOURCE CATALOG ══════════════ */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
          {/* Add form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Plus size={13} className="text-pink-500" /> Register Source
              </h3>
              <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">
                Add feed sensors manually. Registered sources are deduplicated by their unique URL constraint.
              </p>
            </div>

            <form onSubmit={handleAddSource} className="space-y-4">
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">Source Name</label>
                <input
                  required value={newSource.name}
                  onChange={e => setNewSource(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. OpenAI Research Blog"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-400 transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">Source Type</label>
                <select value={newSource.type} onChange={e => setNewSource(p => ({ ...p, type: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:bg-white">
                  <option>RSS Feed</option>
                  <option>Website Scraper</option>
                  <option>Newsletter Extract</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">Source URL</label>
                <input
                  required type="url" value={newSource.url}
                  onChange={e => setNewSource(p => ({ ...p, url: e.target.value }))}
                  placeholder="https://example.com/feed.xml"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-400 transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">Target Stream</label>
                <select value={newSource.category} onChange={e => setNewSource(p => ({ ...p, category: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:bg-white">
                  {techStreams.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <button disabled={addingSource}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer">
                {addingSource ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                Add Source
              </button>
            </form>
          </div>

          {/* Catalog table */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">Registered Sources</span>
              <span className="text-[10px] font-bold text-slate-400">{sources.length} total</span>
            </div>

            {loadingSources ? (
              <div className="flex items-center justify-center py-16 gap-2 text-xs text-slate-400">
                <Loader2 size={18} className="animate-spin text-pink-500" /> Loading sources...
              </div>
            ) : sources.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs space-y-1">
                <Link2 size={22} className="mx-auto text-slate-350" />
                <p className="font-bold">No sources registered.</p>
                <p className="text-[10px]">Use the form on the left or accept recommendations from the Discover tab.</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9px] tracking-wider font-bold">
                      <th className="py-2">Source</th>
                      <th className="py-2">Type / Stream</th>
                      <th className="py-2 text-center">Active</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {sources.map(feed => (
                      <tr key={feed.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="py-2.5 pr-3">
                          <div className="font-bold text-slate-900">{feed.name}</div>
                          <div className="text-[9px] font-mono text-slate-400 truncate max-w-[180px]" title={feed.url}>{feed.url}</div>
                        </td>
                        <td className="py-2.5 pr-3">
                          <div className="text-slate-600 font-medium">{feed.type}</div>
                          <div className="text-[9px] font-bold text-pink-600 uppercase tracking-wider">{feed.category}</div>
                        </td>
                        <td className="py-2.5 text-center">
                          <button onClick={() => handleToggleSource(feed.id, feed.enabled)} className="cursor-pointer">
                            {feed.enabled
                              ? <ToggleRight size={20} className="text-emerald-500 mx-auto" />
                              : <ToggleLeft size={20} className="text-slate-300 mx-auto" />}
                          </button>
                        </td>
                        <td className="py-2.5 text-right space-x-1 whitespace-nowrap">
                          <button onClick={() => handleScanSource(feed.id)} disabled={scanningSourceId === feed.id}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 font-bold text-[9px] uppercase inline-flex items-center gap-1 active:scale-95 disabled:opacity-50 cursor-pointer">
                            {scanningSourceId === feed.id ? <Loader2 size={9} className="animate-spin" /> : <Activity size={9} className="text-pink-500" />}
                            Scan
                          </button>
                          <button onClick={() => handleDeleteSource(feed.id, feed.name)}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded border border-rose-100 font-bold text-[9px] uppercase active:scale-95 cursor-pointer">
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════ TAB 2: DISCOVER & RECOMMEND ══════════════ */}
      {activeTab === 'discover' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 text-left">
          {/* Left: Agent trigger */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Sparkles size={13} className="text-pink-500" /> Run Discovery Agent
              </h3>
              <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">
                Crawls technology indices using DuckDuckGo search queries. Customize queries per stream below.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">Target AI Stream</label>
                <select value={discoverStream} onChange={e => setDiscoverStream(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:bg-white">
                  {techStreams.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">Custom Discovery Query (DuckDuckGo)</label>
                <input 
                  value={customDiscoverQuery}
                  onChange={e => setCustomDiscoverQuery(e.target.value)}
                  placeholder="e.g. OpenAI blog feed URL"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-400 transition-colors"
                />
              </div>

              <button onClick={handleRunDiscovery} disabled={discovering || !discoverStream}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-md">
                {discovering ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                Run Discovery Agent
              </button>

              {discovering && (
                <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                    <Loader2 size={12} className="animate-spin text-pink-500" />
                    <span>Agent Operations</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 leading-relaxed font-semibold animate-pulse">
                    {discoveryStage}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Recommendations catalog */}
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">Pending Recommendations</span>
              <span className="text-[10px] font-bold text-slate-400">{recommendations.length} recommendations</span>
            </div>

            {loadingRecs ? (
              <div className="flex items-center justify-center py-16 gap-2 text-xs text-slate-400">
                <Loader2 size={18} className="animate-spin text-pink-500" /> Scanning candidates...
              </div>
            ) : recommendations.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs space-y-1">
                <CheckCircle2 size={24} className="mx-auto text-emerald-500" />
                <p className="font-bold">Discovery queue empty.</p>
                <p className="text-[10px]">Select a stream and trigger the agent on the left to discover feeds.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
                {recommendations.map(rec => (
                  <div key={rec.url} className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-3 flex flex-col justify-between hover:bg-slate-50 transition-colors">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[8px] font-extrabold uppercase tracking-widest text-pink-700 bg-pink-50 border border-pink-100 px-2 py-0.5 rounded">
                          {rec.category || discoverStream}
                        </span>
                        <span className="text-[9px] font-bold text-slate-550">
                          Trust score: <strong className="text-slate-850">{rec.trustScore}%</strong>
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs">{rec.name}</h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">{rec.justification}</p>
                      <div className="text-[9px] font-mono text-slate-400 truncate" title={rec.url}>{rec.url}</div>
                    </div>

                    <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                      <button onClick={() => handleDismissRec(rec.url)}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-350 text-slate-600 rounded-lg font-bold text-[9px] uppercase active:scale-95 cursor-pointer">
                        Dismiss
                      </button>
                      <button onClick={() => handleAcceptRec(rec)} disabled={registeringUrl === rec.url}
                        className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 text-white rounded-lg font-bold text-[9px] uppercase active:scale-95 inline-flex items-center gap-1 cursor-pointer">
                        {registeringUrl === rec.url ? <Loader2 size={8} className="animate-spin" /> : <Check size={8} />}
                        Accept & Crawl
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════ TAB 3: TECHNOLOGY STREAMS ══════════════ */}
      {activeTab === 'streams' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {/* Add form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Sparkles size={13} className="text-pink-500" /> Add Stream
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                Adding, renaming, or deleting a stream updates homepage grids, classifier models, and dynamic search agents.
              </p>
            </div>

            <form onSubmit={handleAddStream} className="space-y-3">
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">Stream Name</label>
                <input required value={newStreamValue} onChange={e => setNewStreamValue(e.target.value)}
                  placeholder="e.g. Robotics & Physical AI"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-400 transition-colors"
                />
              </div>
              <button disabled={savingStreams || !newStreamValue.trim()}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-md">
                {savingStreams ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                Add Stream
              </button>
            </form>
          </div>

          {/* Streams list */}
          <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">Active Technology Streams</span>
              <span className="text-[10px] font-bold text-slate-400">{techStreams.length} defined</span>
            </div>

            <div className="space-y-3">
              {techStreams.map((stream, idx) => {
                const Icon = getStreamIcon(stream);
                const gradient = getStreamGradient(stream);
                return (
                  <div key={stream} className="p-4 bg-slate-50 border border-slate-150 rounded-xl flex flex-col gap-3 justify-between hover:bg-slate-50/70 transition-colors">
                    {editingStreamIndex === idx ? (
                      <div className="space-y-3 w-full">
                        <div className="flex gap-2">
                          <input value={editingStreamValue} onChange={e => setEditingStreamValue(e.target.value)}
                            className="flex-1 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none"
                            placeholder="Stream Name"
                            autoFocus
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Crawl Search Template</label>
                          <input value={editingQueryValue} onChange={e => setEditingQueryValue(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none"
                            placeholder="e.g. Agentic loops blog RSS feed"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setEditingStreamIndex(null)}
                            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-350 text-slate-700 text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer">
                            Cancel
                          </button>
                          <button onClick={() => handleSaveStreamEdit(idx)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer shadow-xs">
                            <Check size={10} /> Save Settings
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${gradient} flex items-center justify-center text-white shrink-0 shadow-xs`}>
                            <Icon size={14} />
                          </div>
                          <div>
                            <div className="text-xs font-black text-slate-900">{stream}</div>
                            <div className="text-[9px] text-slate-400 mt-0.5 font-bold">
                              Query: <span className="font-mono text-pink-600 font-semibold">{discoveryQueries[stream] || `${stream} blog RSS feed`}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button onClick={() => { 
                            setEditingStreamIndex(idx); 
                            setEditingStreamValue(stream); 
                            setEditingQueryValue(discoveryQueries[stream] || `${stream} blog RSS feed`);
                          }}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 font-bold text-[9px] uppercase flex items-center gap-1 cursor-pointer transition-all active:scale-95">
                            <Edit3 size={9} /> Config
                          </button>
                          <button onClick={() => handleDeleteStream(idx)}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded border border-rose-100 font-bold text-[9px] uppercase flex items-center gap-1 cursor-pointer transition-all active:scale-95">
                            <Trash2 size={9} /> Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'vector' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <SemanticVectorSpace 
              items={sources.map(s => ({
                id: s.id,
                title: s.name,
                stream: s.category || 'AI Stream',
                summary: `Sensor URL: ${s.url} - scanning status is active.`
              }))}
            />
          </div>
        </div>
      )}

      {/* Centered custom delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-[#fffcf5] border border-slate-200 rounded-3xl shadow-2xl overflow-hidden animate-zoomIn flex flex-col p-6 space-y-6 text-left">
            <div className="space-y-2">
              <h3 className="text-sm font-black text-slate-950 uppercase tracking-wider">Confirm Deletion</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                {deleteTarget.type === 'source' 
                  ? `Are you sure you want to delete source "${deleteTarget.name}"? This will remove all associated feed items.`
                  : `Are you sure you want to delete stream "${deleteTarget.name}"?`
                }
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
