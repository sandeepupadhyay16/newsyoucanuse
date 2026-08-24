'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  RotateCw,
  Loader2,
  Activity,
  FolderOpen,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Clock,
  Bell,
  LineChart,
  BarChart,
  Cpu,
  Workflow,
  Sparkles,
  Zap,
  Check,
  TrendingUp,
  AlertTriangle,
  History
} from 'lucide-react';
import Link from 'next/link';

interface ScanRun {
  id: string;
  startedAt: string;
  completedAt: string | null;
  status: string;
  addedCount: number;
  logs: string;
  sourceId?: string | null;
  sourceName?: string | null;
  durationMs?: number | null;
  tokensUsed?: number | null;
  sourceStatsJson?: string | null;
  parsedCount?: number | null;
  ingestedCount?: number | null;
  rejectedCount?: number | null;
  failedCount?: number | null;
}

interface IngestionAlert {
  id: string;
  sourceId: string;
  sourceName: string;
  error: string;
  resolved: boolean;
  createdAt: string;
}

interface ArticleInfo {
  id: string;
  sourceName: string;
  createdAt: string;
  stream: string;
}

export default function OperationsPage() {
  const [activeSubTab, setActiveSubTab] = useState<'runs' | 'analytics' | 'alerts'>('runs');

  const [runs, setRuns] = useState<ScanRun[]>([]);
  const [alerts, setAlerts] = useState<IngestionAlert[]>([]);
  const [articles, setArticles] = useState<ArticleInfo[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeRun, setActiveRun] = useState<ScanRun | null>(null);
  const [isPurging, setIsPurging] = useState(false);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
  const [resolvingAlertId, setResolvingAlertId] = useState<string | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<'logs' | 'ideas' | 'sources' | null>(null);

  // Filters for analytics
  const [analyticsFilter, setAnalyticsFilter] = useState<'day' | 'week' | 'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = (isManual = false) => {
    if (isManual) setRefreshing(true);

    Promise.all([
      fetch('/api/external-feed/scan/runs').then(r => r.json()),
      fetch('/api/operations/alerts').then(r => r.json()),
      fetch('/api/operations/analytics').then(r => r.json())
    ])
      .then(([runsData, alertsData, analyticsData]) => {
        if (Array.isArray(runsData)) {
          setRuns(runsData);
          const running = runsData.find((r: ScanRun) => r.status === 'processing' || r.status === 'Pending');
          setActiveRun(running || null);
          if (running && !expandedRunId) setExpandedRunId(running.id);
        }
        if (Array.isArray(alertsData)) {
          setAlerts(alertsData);
        }
        if (analyticsData && Array.isArray(analyticsData.articles)) {
          setArticles(analyticsData.articles);
        }
      })
      .catch(console.error)
      .finally(() => { setLoading(false); setRefreshing(false); });
  };

  const handleTriggerScan = async () => {
    try {
      const res = await fetch('/api/external-feed/scan', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) fetchData();
      else alert(`Failed to start scan: ${data.error || 'Server error'}`);
    } catch (e) { alert('Scan request failed'); }
  };

  const handleStopScan = async (runId: string) => {
    try {
      const res = await fetch(`/api/external-feed/scan?taskId=${runId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Ingestion halted successfully.');
        fetchData(true);
      } else {
        alert(`Failed to stop ingestion: ${data.error || 'Server error'}`);
      }
    } catch (e) {
      alert('Failed to send stop request.');
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    setResolvingAlertId(alertId);
    try {
      const res = await fetch('/api/operations/alerts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: alertId })
      });
      if (res.ok) {
        setAlerts(prev => prev.filter(a => a.id !== alertId));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setResolvingAlertId(null);
    }
  };

  const handlePurge = (target: 'logs' | 'ideas' | 'sources') => {
    setPurgeTarget(target);
  };

  const handleConfirmPurge = async () => {
    if (!purgeTarget) return;
    const target = purgeTarget;
    setPurgeTarget(null);
    setIsPurging(true);
    try {
      const res = await fetch(`/api/maintenance/purge?target=${target}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) { 
        alert(data.message); 
        fetchData(); 
      } else {
        alert(data.error || 'Purge failed.');
      }
    } catch { 
      alert('Network error during purge.'); 
    } finally { 
      setIsPurging(false); 
    }
  };

  const parseLogs = (raw: string): string[] => {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [raw];
    } catch { return [raw]; }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'completed') return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-100">
        <CheckCircle2 size={9} /> Completed
      </span>
    );
    if (status === 'processing' || status === 'Pending') return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-pink-50 text-pink-700 border border-pink-100 animate-pulse">
        <Loader2 size={9} className="animate-spin" /> Ingesting
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-rose-50 text-rose-700 border border-rose-100">
        <XCircle size={9} /> Failed
      </span>
    );
  };

  // Filter runs based on selected time window
  const getFilteredRuns = () => {
    const now = Date.now();
    const limits = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      quarter: 90 * 24 * 60 * 60 * 1000,
      year: 365 * 24 * 60 * 60 * 1000
    };
    const limit = limits[analyticsFilter];
    return runs.filter(r => (now - new Date(r.startedAt).getTime()) < limit);
  };

  const filteredRuns = getFilteredRuns();

  // Filter articles based on selected time window
  const getFilteredArticles = () => {
    const now = Date.now();
    const limits = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      quarter: 90 * 24 * 60 * 60 * 1000,
      year: 365 * 24 * 60 * 60 * 1000
    };
    const limit = limits[analyticsFilter];
    return articles.filter(a => (now - new Date(a.createdAt).getTime()) < limit);
  };

  const filteredArticles = getFilteredArticles();

  // Group filtered articles by source
  const sourceStatsMap: Record<string, number> = {};
  filteredArticles.forEach(a => {
    sourceStatsMap[a.sourceName] = (sourceStatsMap[a.sourceName] || 0) + 1;
  });

  const sourceStats = Object.keys(sourceStatsMap).map(k => ({
    name: k,
    count: sourceStatsMap[k]
  })).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 flex items-center gap-2">
            <Activity size={24} className="text-pink-500 animate-pulse" />
            Ingestion Operations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor scanner telemetry, review system alerts, and track computational token costs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleTriggerScan} disabled={!!activeRun}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm cursor-pointer">
            {activeRun ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
            {activeRun ? 'Scanner Active...' : 'Execute Ingestion Scan'}
          </button>
          {activeRun && (
            <button onClick={() => handleStopScan(activeRun.id)}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm cursor-pointer animate-pulse">
              <XCircle size={12} />
              Stop Ingestion
            </button>
          )}
          <button onClick={() => fetchData(true)} disabled={refreshing}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 font-semibold text-xs flex items-center gap-1.5 active:scale-95 transition-all shadow-xs cursor-pointer">
            <RotateCw size={13} className={refreshing ? 'animate-spin text-pink-500' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-px">
        {[
          { id: 'runs', label: 'Telemetry Logs', icon: History, count: runs.length },
          { id: 'analytics', label: 'Ingestion Analytics', icon: LineChart, count: articles.length },
          { id: 'alerts', label: 'Active Alerts', icon: AlertTriangle, count: alerts.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`pb-3 px-4 text-xs font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === tab.id
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <tab.icon size={13} />
            {tab.label}
            {tab.id === 'alerts' && tab.count > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 text-[9px] font-bold">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════ TAB 1: TELEMETRY RUNS ══════════════ */}
      {activeSubTab === 'runs' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
          
          {/* History list */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between">
            <div>
              <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">Scan Execution History</span>
                <span className="text-[10px] font-bold text-slate-400">{runs.length} runs</span>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20 gap-2 text-xs text-slate-400">
                  <Loader2 size={18} className="animate-spin text-pink-500" /> Loading logs...
                </div>
              ) : runs.length === 0 ? (
                <div className="text-center py-20 text-slate-400 text-xs space-y-2">
                  <FolderOpen size={24} className="mx-auto text-slate-300" />
                  <p className="font-bold">No runs recorded.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
                  {runs.map(run => {
                    const isExpanded = expandedRunId === run.id;
                    const logLines = parseLogs(run.logs);
                    return (
                      <div key={run.id} className="hover:bg-slate-50/50 transition-colors">
                        <button
                          onClick={() => setExpandedRunId(isExpanded ? null : run.id)}
                          className="w-full text-left px-5 py-3.5 flex items-center justify-between gap-3 cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <StatusBadge status={run.status} />
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 truncate">
                                {run.sourceName || 'Global scan'}
                              </div>
                              <div className="text-[9px] text-slate-400 flex items-center gap-2 mt-0.5">
                                <Clock size={9} />
                                {new Date(run.startedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                <span className="text-slate-350">·</span>
                                <span><strong className="text-slate-700">{run.addedCount}</strong> ingested</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[9px] font-mono text-slate-300">{run.id.substring(0, 8)}</span>
                            {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                          </div>
                        </button>

                        {isExpanded && run.logs && (
                          <div className="px-5 pb-4">
                            <pre className="text-[9px] bg-slate-950 text-pink-400 p-3.5 rounded-xl overflow-x-auto font-mono max-h-48 leading-relaxed whitespace-pre-wrap">
                              {logLines.join('\n')}
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar: Maintenance controls */}
          <div className="space-y-6">
            
            {/* Active Queue Status */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-left space-y-4">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Dynamic Scanner Queue</h3>
                <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">Real-time telemetry showing crawler pipeline operations.</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-150 bg-slate-50 flex items-center gap-3">
                {activeRun ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-pink-500 shrink-0" />
                    <div className="text-[10px] font-semibold text-slate-700">
                      Crawl running on: <strong className="text-slate-900">&quot;{activeRun.sourceName || 'Multiple Sources'}&quot;</strong>
                    </div>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <div className="text-[10px] font-semibold text-slate-700">
                      Scanner idle. Queue completely resolved.
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* DB Maintenance */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-left space-y-4">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Database Administration</h3>
                <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">Purge operations for database maintenance.</p>
              </div>

              <div className="space-y-2">
                {[
                  { target: 'logs' as const, label: 'Purge Scan History' },
                  { target: 'ideas' as const, label: 'Purge Ingested Articles' }
                ].map(item => (
                  <button
                    key={item.target}
                    disabled={isPurging}
                    onClick={() => handlePurge(item.target)}
                    className="w-full py-2 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-700 rounded-xl text-[10px] font-bold uppercase border border-rose-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                  >
                    <Trash2 size={11} /> {item.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ══════════════ TAB 2: INGESTION ANALYTICS ══════════════ */}
      {activeSubTab === 'analytics' && (() => {
        const totalParsed = filteredRuns.reduce((acc, r) => acc + (r.parsedCount || 0), 0);
        const totalIngested = filteredRuns.reduce((acc, r) => acc + (r.ingestedCount || 0), 0);
        const totalRejected = filteredRuns.reduce((acc, r) => acc + (r.rejectedCount || 0), 0);
        const totalFailed = filteredRuns.reduce((acc, r) => acc + (r.failedCount || 0), 0);

        const sourceBreakdown: Record<string, {
          name: string;
          parsed: number;
          ingested: number;
          rejected: number;
          failed: number;
        }> = {};

        filteredRuns.forEach(r => {
          if (r.sourceStatsJson) {
            try {
              const stats = JSON.parse(r.sourceStatsJson);
              Object.entries(stats).forEach(([sourceId, val]: [string, any]) => {
                const sName = val.sourceName || r.sourceName || `Source #${sourceId}`;
                if (!sourceBreakdown[sName]) {
                  sourceBreakdown[sName] = {
                    name: sName,
                    parsed: 0,
                    ingested: 0,
                    rejected: 0,
                    failed: 0
                  };
                }
                sourceBreakdown[sName].parsed += (val.articlesParsed || 0);
                sourceBreakdown[sName].ingested += (val.articlesIngested || 0);
                sourceBreakdown[sName].rejected += (val.articlesRejected || 0);
                sourceBreakdown[sName].failed += (val.articlesFailed || 0);
              });
            } catch (e) {
              const sName = r.sourceName || 'All Feeds';
              if (!sourceBreakdown[sName]) {
                sourceBreakdown[sName] = {
                  name: sName,
                  parsed: 0,
                  ingested: 0,
                  rejected: 0,
                  failed: 0
                };
              }
              sourceBreakdown[sName].parsed += (r.parsedCount || r.addedCount || 0);
              sourceBreakdown[sName].ingested += (r.ingestedCount || r.addedCount || 0);
              sourceBreakdown[sName].rejected += (r.rejectedCount || 0);
              sourceBreakdown[sName].failed += (r.failedCount || 0);
            }
          } else {
            const sName = r.sourceName || 'All Feeds';
            if (!sourceBreakdown[sName]) {
              sourceBreakdown[sName] = {
                name: sName,
                parsed: 0,
                ingested: 0,
                rejected: 0,
                failed: 0
              };
            }
            sourceBreakdown[sName].parsed += (r.parsedCount || r.addedCount || 0);
            sourceBreakdown[sName].ingested += (r.ingestedCount || r.addedCount || 0);
            sourceBreakdown[sName].rejected += (r.rejectedCount || 0);
            sourceBreakdown[sName].failed += (r.failedCount || 0);
          }
        });

        const sourceBreakdownList = Object.values(sourceBreakdown).sort((a, b) => b.parsed - a.parsed);

        const dailyBreakdown: Record<string, {
          date: string;
          parsed: number;
          ingested: number;
          rejected: number;
          failed: number;
        }> = {};

        filteredRuns.forEach(r => {
          const dateStr = new Date(r.startedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
          if (!dailyBreakdown[dateStr]) {
            dailyBreakdown[dateStr] = {
              date: dateStr,
              parsed: 0,
              ingested: 0,
              rejected: 0,
              failed: 0
            };
          }
          dailyBreakdown[dateStr].parsed += (r.parsedCount || r.addedCount || 0);
          dailyBreakdown[dateStr].ingested += (r.ingestedCount || r.addedCount || 0);
          dailyBreakdown[dateStr].rejected += (r.rejectedCount || 0);
          dailyBreakdown[dateStr].failed += (r.failedCount || 0);
        });

        const dailyBreakdownList = Object.values(dailyBreakdown).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return (
          <div className="space-y-6 text-left">
            {/* Time Window Switcher */}
            <div className="flex gap-1.5 justify-end">
              {(['day', 'week', 'month', 'quarter', 'year'] as const).map(w => (
                <button
                  key={w}
                  onClick={() => setAnalyticsFilter(w)}
                  className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border whitespace-nowrap cursor-pointer ${
                    analyticsFilter === w 
                      ? 'bg-slate-900 border-slate-900 text-white' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between h-28">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Discovered / Parsed</span>
                <span className="text-2xl font-black text-slate-900">{totalParsed.toLocaleString()}</span>
                <span className="text-[9px] text-slate-400 font-bold block">Articles read from feed channels</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between h-28">
                <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">Successfully Ingested</span>
                <span className="text-2xl font-black text-emerald-700">{totalIngested.toLocaleString()}</span>
                <span className="text-[9px] text-slate-400 font-bold block">Mapped to active tech signals</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between h-28">
                <span className="text-[9px] font-bold text-amber-600 uppercase tracking-wider block mb-1">Duplicate / Rejected</span>
                <span className="text-2xl font-black text-amber-700">{totalRejected.toLocaleString()}</span>
                <span className="text-[9px] text-slate-400 font-bold block">Skipped/Duplicate candidates</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between h-28">
                <span className="text-[9px] font-bold text-rose-600 uppercase tracking-wider block mb-1">Failed / Parsing Errors</span>
                <span className="text-2xl font-black text-rose-700">{totalFailed.toLocaleString()}</span>
                <span className="text-[9px] text-slate-400 font-bold block">Unparseable or connection failures</span>
              </div>
            </div>

            {/* Split Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Segmented by Source */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 flex flex-col">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                  <BarChart size={14} className="text-pink-500" />
                  Ingestion Performance Segmented by Source
                </h3>

                {sourceBreakdownList.length === 0 ? (
                  <div className="text-center py-16 text-xs text-slate-400 my-auto">No sources active in selected window.</div>
                ) : (
                  <div className="space-y-5 overflow-y-auto max-h-[400px] pr-2">
                    {sourceBreakdownList.map(stat => {
                      const totalSource = Math.max(1, stat.parsed);
                      const ingestPct = Math.round((stat.ingested / totalSource) * 100);
                      const rejectPct = Math.round((stat.rejected / totalSource) * 100);
                      const failPct = Math.round((stat.failed / totalSource) * 100);

                      return (
                        <div key={stat.name} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-800">{stat.name}</span>
                            <span className="text-slate-500 text-[10px]">
                              {stat.parsed} parsed ({stat.ingested} ing | {stat.rejected} rej | {stat.failed} fail)
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
                            {stat.ingested > 0 && (
                              <div className="bg-emerald-500 h-full first:rounded-l-full last:rounded-r-full" style={{ width: `${ingestPct}%` }} title={`Ingested: ${stat.ingested}`}></div>
                            )}
                            {stat.rejected > 0 && (
                              <div className="bg-amber-400 h-full first:rounded-l-full last:rounded-r-full" style={{ width: `${rejectPct}%` }} title={`Rejected/Duplicate: ${stat.rejected}`}></div>
                            )}
                            {stat.failed > 0 && (
                              <div className="bg-rose-500 h-full first:rounded-l-full last:rounded-r-full" style={{ width: `${failPct}%` }} title={`Failed: ${stat.failed}`}></div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Segmented by Ingestion Date */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 flex flex-col">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                  <Clock size={14} className="text-pink-500" />
                  Chronological Ingestion Log by Date
                </h3>

                {dailyBreakdownList.length === 0 ? (
                  <div className="text-center py-16 text-xs text-slate-400 my-auto">No Ingestion runs in selected window.</div>
                ) : (
                  <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2">
                    {dailyBreakdownList.map(day => (
                      <div key={day.date} className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between gap-3">
                        <span className="text-xs font-black text-slate-800">{day.date}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                            {day.ingested} Ingested
                          </span>
                          <span className="text-[9px] font-extrabold text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded">
                            {day.rejected} Duplicate
                          </span>
                          <span className="text-[9px] font-extrabold text-rose-700 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded">
                            {day.failed} Failed
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        );
      })()}

      {/* ══════════════ TAB 3: ACTIVE ALERTS ══════════════ */}
      {activeSubTab === 'alerts' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-left space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">Scanner Failures & Warnings</span>
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded">
              {alerts.length} active
            </span>
          </div>

          {alerts.length === 0 ? (
            <div className="text-center py-20 text-slate-400 text-xs space-y-1">
              <CheckCircle2 size={24} className="mx-auto text-emerald-500" />
              <p className="font-bold">All scanner systems functional.</p>
              <p className="text-[10px]">No active ingestion alerts recorded.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map(alert => (
                <div key={alert.id} className="p-4 bg-rose-50/50 border border-rose-150 rounded-xl flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="text-xs font-bold text-rose-700 flex items-center gap-1">
                      <AlertTriangle size={12} />
                      Connection Timeout / Failed Fetch
                    </div>
                    <div className="text-[10px] font-semibold text-slate-800">
                      Source Name: <strong className="text-slate-950">&quot;{alert.sourceName}&quot;</strong>
                    </div>
                    <div className="text-[10px] text-slate-500 leading-relaxed font-semibold italic truncate" title={alert.error}>
                      Error detail: &quot;{alert.error}&quot;
                    </div>
                    <div className="text-[9px] text-slate-400 font-bold">
                      Detected At: {new Date(alert.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <button
                    disabled={resolvingAlertId === alert.id}
                    onClick={() => handleResolveAlert(alert.id)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg font-bold text-[9px] uppercase tracking-wider flex items-center gap-0.5 active:scale-95 transition-all cursor-pointer shadow-sm shrink-0"
                  >
                    {resolvingAlertId === alert.id ? <Loader2 size={8} className="animate-spin" /> : <Check size={8} />}
                    Resolve
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Centered custom purge confirmation modal */}
      {purgeTarget && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-[#fffcf5] border border-slate-200 rounded-3xl shadow-2xl overflow-hidden animate-zoomIn flex flex-col p-6 space-y-6 text-left">
            <div className="space-y-2">
              <h3 className="text-sm font-black text-slate-950 uppercase tracking-wider">Confirm Purge Action</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                Permanently purge {
                  purgeTarget === 'logs' 
                    ? 'all scan logs' 
                    : purgeTarget === 'ideas' 
                    ? 'all ingested themes & groupings' 
                    : 'all configured sources'
                }? This cannot be undone.
              </p>
            </div>
            
            <div className="flex justify-end gap-2 text-[10px] font-bold">
              <button
                onClick={() => setPurgeTarget(null)}
                className="py-2 px-5 bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 uppercase rounded-xl transition-all active:scale-95 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPurge}
                className="py-2 px-5 bg-rose-600 border border-rose-700 hover:bg-rose-700 text-white uppercase rounded-xl transition-all active:scale-95 cursor-pointer"
              >
                Purge
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
