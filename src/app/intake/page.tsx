'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  Loader2, 
  Check,
  Upload,
  FileText,
  AlertCircle,
  RotateCcw,
  Globe,
  Link2,
  FileCheck,
  ChevronRight,
  TrendingUp,
  User,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

interface ExtractedTopic {
  id: string;
  title: string;
  problemStatement: string;
  consultantImplication: string;
  practitionerImplication: string;
  trajectoryPrediction: string;
  predictionConfidence: number;
  author: string;
  source: string;
  sourceUrl: string;
  therapeuticAreas: string[];
}

export default function IngestionPage() {
  // Tabs: 'file' | 'link' | 'text'
  const [activeTab, setActiveTab] = useState<'file' | 'link' | 'text'>('file');

  // Input states
  const [ingestText, setIngestText] = useState('');
  const [urlLink, setUrlLink] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Result Summary states
  const [ingestedTopics, setIngestedTopics] = useState<ExtractedTopic[]>([]);
  const [ingestStatus, setIngestStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  // Handle Drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  // Upload and parse PDF/Text newsletter
  const processFile = async (file: File) => {
    setIsProcessing(true);
    setIngestStatus({ type: null, message: '' });
    setIngestedTopics([]);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Processing failed (HTTP status ${res.status})`);
      }

      if (data.topics && Array.isArray(data.topics)) {
        setIngestedTopics(data.topics);
        setIngestStatus({ type: 'success', message: `Successfully processed "${file.name}". Ingested ${data.topics.length} topics.` });
      }
    } catch (err: any) {
      console.error(err);
      setIngestStatus({ type: 'error', message: err.message || 'Error parsing newsletter file.' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Scrape and parse Webpage Link
  const handleLinkIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlLink.trim()) return;

    setIsProcessing(true);
    setIngestStatus({ type: null, message: '' });
    setIngestedTopics([]);

    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlLink })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Scrape failed (HTTP status ${res.status})`);
      }

      if (data.topics && Array.isArray(data.topics)) {
        setIngestedTopics(data.topics);
        setIngestStatus({ type: 'success', message: `Successfully scraped link. Ingested ${data.topics.length} topics.` });
        setUrlLink('');
      }
    } catch (err: any) {
      console.error(err);
      setIngestStatus({ type: 'error', message: err.message || 'Error scraping and ingesting URL.' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Parse pasted raw text newsletter
  const handleTextIngest = async () => {
    if (!ingestText.trim()) return;

    setIsProcessing(true);
    setIngestStatus({ type: null, message: '' });
    setIngestedTopics([]);

    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: ingestText })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Ingestion failed (HTTP status ${res.status})`);
      }

      if (data.topics && Array.isArray(data.topics)) {
        setIngestedTopics(data.topics);
        setIngestStatus({ type: 'success', message: `Successfully parsed text. Ingested ${data.topics.length} topics.` });
        setIngestText('');
      }
    } catch (err: any) {
      console.error(err);
      setIngestStatus({ type: 'error', message: err.message || 'Error processing pasted text.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetIngestion = () => {
    setIngestedTopics([]);
    setIngestStatus({ type: null, message: '' });
    setIngestText('');
    setUrlLink('');
  };

  return (
    <div className="space-y-8 animate-fadeIn text-[#0a0a0a]">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">AI Intake & Triage Hub</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Feed newsletter documents, scrape webpage links, or paste text summaries to run multi-agent triaging.
          </p>
        </div>

        {ingestedTopics.length > 0 && (
          <button
            onClick={resetIngestion}
            className="shrink-0 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer shadow-xs"
          >
            <RotateCcw size={14} />
            <span>Ingest Another</span>
          </button>
        )}
      </div>

      {ingestedTopics.length > 0 ? (
        /* INGESTION SUMMARY SCREEN */
        <div className="space-y-6">
          <div className="p-5 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 text-emerald-800 flex gap-3 items-start animate-fadeIn">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
              <Check size={18} className="stroke-[3]" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-600">Ingestion Summary Report</h3>
              <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                The multi-agent pipeline has successfully parsed, analyzed, and saved the commentaries to the database. All topics are now live on the Oracle timeline roadmap.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {ingestedTopics.map((topic) => (
              <div 
                key={topic.id}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-pink-600 bg-pink-50 px-2 py-0.5 rounded border border-pink-100 truncate">
                      {(topic.therapeuticAreas || ['General AI'])[0]}
                    </span>
                    
                    <div className="text-[9px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded flex items-center gap-1 uppercase">
                      <TrendingUp size={10} className="text-pink-500" />
                      <span>{topic.trajectoryPrediction}</span>
                    </div>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-sm tracking-tight leading-snug">
                    {topic.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {topic.problemStatement}
                  </p>

                  {/* Accordion takeaways */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="space-y-1 text-[11px]">
                      <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[9px] block">Consultant Takeaway</span>
                      <p className="text-slate-500 leading-relaxed pl-2 border-l border-pink-300">
                        {topic.consultantImplication}
                      </p>
                    </div>

                    <div className="space-y-1 text-[11px] pt-1">
                      <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[9px] block">Practitioner Takeaway</span>
                      <p className="text-slate-500 leading-relaxed pl-2 border-l border-indigo-300">
                        {topic.practitionerImplication}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                  <div className="flex items-center gap-1">
                    <User size={12} className="text-slate-400" />
                    <span>Writen by: <strong className="font-bold text-slate-800">{topic.author || 'Staff Writer'}</strong></span>
                  </div>
                  <span className="bg-pink-50 border border-pink-150 text-[#ff4d8b] px-2 py-0.5 rounded font-extrabold text-[9px]">
                    Confidence: {topic.predictionConfidence}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Link 
              href="/newsletter"
              className="py-3 px-6 rounded-xl bg-slate-900 hover:bg-slate-850 text-white font-extrabold text-xs flex items-center gap-2 active:scale-98 transition-all shadow-md"
            >
              <span>Explore Newsletter Library</span>
              <ArrowRight size={14} className="text-pink-300" />
            </Link>
          </div>
        </div>
      ) : (
        /* INPUT TABS & PANELS */
        <div className="grid md:grid-cols-3 gap-8 items-start">
          <div className="md:col-span-2 bg-[#f5f0e0]/40 border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
            
            {/* Tab Navigation header */}
            <div className="flex border-b border-slate-200 pb-px gap-2">
              <button
                onClick={() => { setActiveTab('file'); setIngestStatus({ type: null, message: '' }); }}
                className={`pb-3 px-4 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'file' 
                    ? 'border-slate-900 text-slate-900' 
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                <FileCheck size={14} />
                <span>Upload PDF / File</span>
              </button>

              <button
                onClick={() => { setActiveTab('link'); setIngestStatus({ type: null, message: '' }); }}
                className={`pb-3 px-4 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'link' 
                    ? 'border-slate-900 text-slate-900' 
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                <Link2 size={14} />
                <span>Webpage URL Link</span>
              </button>

              <button
                onClick={() => { setActiveTab('text'); setIngestStatus({ type: null, message: '' }); }}
                className={`pb-3 px-4 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'text' 
                    ? 'border-slate-900 text-slate-900' 
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                <FileText size={14} />
                <span>Paste Raw Text</span>
              </button>
            </div>

            {/* TAB PANELS RENDER */}
            
            {/* Panel 1: File Uploader */}
            {activeTab === 'file' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Feed Newsletter Document</h3>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Upload your weekly AI news briefings, team summary logs, or researcher report papers. The multi-agent EIC pipeline will unpack the contents and extract developments.
                  </p>
                </div>

                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                    dragActive 
                      ? 'border-pink-500 bg-pink-500/5' 
                      : 'border-slate-200 bg-white hover:border-slate-400'
                  }`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".txt,.md,.pdf"
                    className="hidden"
                  />
                  {isProcessing ? (
                    <div className="space-y-3 text-slate-500 text-xs">
                      <Loader2 size={28} className="mx-auto text-pink-500 animate-spin" />
                      <span className="font-extrabold animate-pulse">Running multi-agent analysis and extracting developments...</span>
                    </div>
                  ) : (
                    <div className="space-y-3 text-xs">
                      <Upload size={32} className="mx-auto text-slate-400" />
                      <span className="block text-slate-700 font-extrabold">Drag & Drop File Here</span>
                      <span className="block text-slate-400 text-[10px] font-semibold">Supports PDF, Text, and Markdown</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Panel 2: Link scraper */}
            {activeTab === 'link' && (
              <form onSubmit={handleLinkIngest} className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Webpage Link Ingest</h3>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Enter the URL of any online AI blog post, tech article, or RSS link. The scraper will retrieve raw HTML content and run the ingestion model.
                  </p>
                </div>

                <div className="flex gap-2">
                  <input 
                    type="url"
                    value={urlLink}
                    onChange={(e) => setUrlLink(e.target.value)}
                    required
                    placeholder="https://blog.langchain.dev/multi-agent-workflows/..."
                    className="flex-1 px-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={isProcessing || !urlLink.trim()}
                    className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-850 disabled:bg-slate-100 disabled:text-slate-400 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-98 shrink-0"
                  >
                    {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <Globe size={12} />}
                    <span>Scrape & Ingest</span>
                  </button>
                </div>
              </form>
            )}

            {/* Panel 3: Paste text area */}
            {activeTab === 'text' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Paste raw newsletter text</h3>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Paste raw transcript summaries, text notes, or article contents directly.
                  </p>
                </div>

                <textarea
                  rows={8}
                  value={ingestText}
                  onChange={(e) => setIngestText(e.target.value)}
                  placeholder="e.g. In their latest release, Anthropic announced Model Context Protocol (MCP) to standardize external data source connectors..."
                  className="w-full bg-white border border-slate-200 rounded-xl p-4 text-xs text-slate-750 placeholder-slate-400 focus:outline-none focus:border-slate-400 leading-relaxed font-semibold"
                />

                <button
                  onClick={handleTextIngest}
                  disabled={isProcessing || !ingestText.trim()}
                  className="w-full h-11 bg-slate-900 hover:bg-slate-850 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-xs rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} className="text-pink-400" />}
                  <span>Ingest Pasted Text</span>
                </button>
              </div>
            )}

            {/* Error alerts */}
            {ingestStatus.type === 'error' && (
              <div className="p-4 rounded-xl border border-rose-500/25 bg-rose-500/5 text-rose-350 text-xs flex gap-2.5 items-start animate-fadeIn leading-relaxed">
                <AlertCircle size={15} className="shrink-0 text-rose-400 mt-0.5" />
                <span>{ingestStatus.message}</span>
              </div>
            )}

          </div>

          {/* GUIDE SIDEBAR */}
          <div className="p-6 rounded-3xl border border-slate-200 bg-[#f5f0e0]/30 space-y-4">
            <h4 className="text-xs font-bold text-slate-850 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-pink-500" />
              <span>Multi-Agent Triage Rules</span>
            </h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              When documents or pages are triaged, the Editorial Ingestion Pipeline:
            </p>
            <ul className="text-[11px] text-slate-700 space-y-4 pt-1">
              <li className="flex gap-2">
                <span className="text-pink-500 font-bold shrink-0">1.</span>
                <div>
                  <strong className="font-bold text-slate-900 block">Decomposes Context</strong>
                  Splits long newsletters or pages into separate, distinct AI developments.
                </div>
              </li>
              <li className="flex gap-2">
                <span className="text-pink-500 font-bold shrink-0">2.</span>
                <div>
                  <strong className="font-bold text-slate-900 block">Generates Implication Takeaways</strong>
                  Drafts separate Consultant and Client-practitioner implication comments.
                </div>
              </li>
              <li className="flex gap-2">
                <span className="text-pink-500 font-bold shrink-0">3.</span>
                <div>
                  <strong className="font-bold text-slate-900 block">Orchestrates Timeline Roadmap</strong>
                  Calculates growth trajectory models and maps projections to Short, Medium, or Long-term roadmaps.
                </div>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
