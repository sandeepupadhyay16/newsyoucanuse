'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ArrowLeft, 
  Printer, 
  Save, 
  FileText, 
  CheckSquare, 
  Square,
  AlertCircle,
  FileCheck2,
  Calendar,
  User,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

interface Commentary {
  id: string;
  title: string;
  problemStatement: string;
  consultantImplication: string;
  practitionerImplication: string;
  trajectoryPrediction: string;
  predictionsTimeline: string;
  predictionConfidence: number;
  author: string;
  publishDate: string;
  source: string;
  sourceUrl: string;
  functionalDomains: string[];
}

export default function NewsletterBuilderPage() {
  const [commentaries, setCommentaries] = useState<Commentary[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editionTitle, setEditionTitle] = useState('AI Trajectories & Strategic Commentary');
  const [editorialNote, setEditorialNote] = useState(
    `Welcome to this week's AI Trajectories digest. In this edition, we analyze frontier model advancements, local edge compute optimization, and agentic workflows—highlighting what these changes mean for consulting delivery models and client deployment strategies.`
  );
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchCommentaries();
  }, []);

  const fetchCommentaries = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/projects?phase=Harvested');
      if (res.ok) {
        const data = await res.json();
        setCommentaries(data);
        // Pre-select first 3 by default
        if (data.length > 0) {
          setSelectedIds(data.slice(0, 3).map((c: Commentary) => c.id));
        }
      }
    } catch (err) {
      console.error('Failed to fetch commentaries:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSaveEdition = async () => {
    if (selectedIds.length === 0) {
      setSaveStatus({ type: 'error', message: 'Please select at least one commentary for the newsletter.' });
      return;
    }

    try {
      setSaving(true);
      setSaveStatus(null);
      
      const res = await fetch('/api/newsletters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editionTitle,
          projectIds: selectedIds,
          editorial: editorialNote
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSaveStatus({ type: 'success', message: `Newsletter Edition saved successfully!` });
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        throw new Error(data.error || 'Failed to save newsletter edition.');
      }
    } catch (err: any) {
      setSaveStatus({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyClipboard = () => {
    const selected = commentaries.filter(c => selectedIds.includes(c.id));
    let text = `=== ${editionTitle.toUpperCase()} ===\n\n`;
    text += `EDITORIAL NOTE:\n${editorialNote}\n\n`;
    
    selected.forEach((c, idx) => {
      text += `-------------------------------------------\n`;
      text += `${idx + 1}. ${c.title.toUpperCase()}\n`;
      text += `Author: ${c.author} | Category: ${(c.functionalDomains || []).join(', ')}\n\n`;
      text += `CONSULTANT IMPLICATION:\n${c.consultantImplication}\n\n`;
      text += `ENTERPRISE PRACTITIONER IMPLICATION:\n${c.practitionerImplication}\n\n`;
      text += `ORACLE FORECAST:\n${c.trajectoryPrediction}\n\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedCommentaries = commentaries.filter(c => selectedIds.includes(c.id));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row">
      {/* CSS stylesheet injected for perfect print formatting */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide sidebar/navigation containers from parent layout */
          aside, nav, header, footer,
          .no-print,
          .sidebar-container,
          .header-container,
          .builder-config-panel,
          .action-bar-sticky,
          button,
          a {
            display: none !important;
          }
          body, .min-h-screen, .flex {
            background: white !important;
            color: #0f172a !important; /* slate-900 */
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-only-container {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 2.5cm 2cm !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
            color: #0f172a !important;
          }
          .print-card-article {
            page-break-inside: avoid !important;
            border-bottom: 1px solid #e2e8f0 !important;
            margin-bottom: 2rem !important;
            padding-bottom: 2rem !important;
          }
          .print-editorial {
            border-bottom: 2px double #94a3b8 !important;
            padding-bottom: 1.5rem !important;
            margin-bottom: 2.5rem !important;
          }
        }
      `}} />

      {/* LEFT PANEL: Builder Configurations (Hidden on print) */}
      <div className="w-full lg:w-1/3 bg-slate-900/40 border-r border-slate-800 p-6 flex flex-col space-y-6 builder-config-panel no-print">
        <div className="flex items-center gap-3">
          <Link 
            href="/newsletter"
            className="p-2 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50 text-slate-300 transition-all"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white flex items-center gap-2">
              <Sparkles size={16} className="text-pink-400" />
              <span>Newsletter Builder</span>
            </h1>
            <p className="text-[10px] text-slate-400">Assemble & export custom commentary editions</p>
          </div>
        </div>

        {/* Configurations inputs */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Edition Title</label>
            <input 
              type="text"
              value={editionTitle}
              onChange={(e) => setEditionTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-slate-700"
              placeholder="Enter newsletter edition title..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Editorial Opening Note</label>
            <textarea 
              value={editorialNote}
              onChange={(e) => setEditorialNote(e.target.value)}
              rows={4}
              className="w-full p-3 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-slate-700 resize-none leading-relaxed"
              placeholder="Write a custom intro/editorial letter..."
            />
          </div>
        </div>

        {/* Checklist selection of commentaries */}
        <div className="flex-1 flex flex-col min-h-[300px]">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">Select Commentaries ({selectedIds.length})</span>
          
          {loading ? (
            <div className="flex-1 flex items-center justify-center py-12 text-xs text-slate-400">
              <span className="animate-pulse">Loading triaged commentaries...</span>
            </div>
          ) : commentaries.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-6 border border-dashed border-slate-800 rounded-2xl text-center">
              <div>
                <AlertCircle size={20} className="text-slate-500 mx-auto mb-2" />
                <span className="text-[11px] text-slate-500 block">No triaged commentaries found. Run Ingestion Scans to triage new trends.</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2 max-h-[380px] pr-1">
              {commentaries.map((c) => {
                const isSelected = selectedIds.includes(c.id);
                return (
                  <div 
                    key={c.id}
                    onClick={() => toggleSelect(c.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex gap-3 items-start ${
                      isSelected 
                        ? 'bg-indigo-500/5 border-indigo-500/30' 
                        : 'bg-slate-950/40 border-slate-800/60 hover:border-slate-800'
                    }`}
                  >
                    <button className="shrink-0 mt-0.5 text-indigo-400">
                      {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                    <div className="min-w-0">
                      <h4 className="text-[11px] font-extrabold text-slate-200 truncate leading-tight">{c.title}</h4>
                      <div className="flex gap-2 items-center mt-1 text-[9px] text-slate-500">
                        <span>by {c.author || 'Staff'}</span>
                        <span>•</span>
                        <span className="truncate">{(c.functionalDomains || []).join(', ')}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions panel */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          {saveStatus && (
            <div className={`p-2.5 rounded-xl text-[10px] flex items-center gap-2 border ${
              saveStatus.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/5 border-rose-500/30 text-rose-400'
            }`}>
              <AlertCircle size={14} className="shrink-0" />
              <span>{saveStatus.message}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleSaveEdition}
              disabled={saving || selectedIds.length === 0}
              className="py-2.5 px-3 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer disabled:opacity-40"
            >
              <Save size={14} />
              <span>{saving ? 'Saving...' : 'Save Draft'}</span>
            </button>
            <button
              onClick={handleCopyClipboard}
              disabled={selectedIds.length === 0}
              className="py-2.5 px-3 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer disabled:opacity-40"
            >
              <FileText size={14} />
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>
          </div>

          <button
            onClick={handlePrint}
            disabled={selectedIds.length === 0}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-600 text-white font-black text-xs flex items-center justify-center gap-2.5 shadow-lg shadow-indigo-600/10 transition-all active:scale-98 cursor-pointer disabled:opacity-40"
          >
            <Printer size={15} />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* RIGHT PANEL: Live Editorial Preview (Printed full page) */}
      <div className="flex-1 bg-slate-900/10 p-6 lg:p-12 overflow-y-auto print-only-container">
        <div className="w-full max-w-3xl mx-auto bg-slate-900/30 border border-slate-800/80 rounded-3xl p-8 lg:p-12 shadow-2xl relative text-slate-350 print:bg-white print:border-none print:shadow-none print:p-0 print:text-slate-900">
          
          {/* Newspaper Header */}
          <div className="text-center space-y-4 pb-6 border-b-4 border-double border-slate-800 print:border-slate-400">
            <div className="flex items-center justify-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.25em] text-slate-400 print:text-slate-500">
              <span>Oracle & Forecasts Intelligence</span>
              <span>•</span>
              <span>Weekly Edition</span>
            </div>
            
            <h2 className="font-serif text-3xl lg:text-5xl font-black uppercase tracking-tight text-white print:text-slate-950 font-extrabold py-1.5">
              AI Trajectories
            </h2>

            <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-500 px-2 py-1 border-t border-b border-slate-800/60 print:border-slate-300 print:text-slate-500">
              <span>EST. 2026</span>
              <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span>Price: Complimentary</span>
            </div>
          </div>

          {/* Editorial Note Section */}
          {editorialNote && (
            <div className="mt-8 print-editorial">
              <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/60 italic text-xs leading-relaxed text-slate-300 print:bg-transparent print:border-none print:p-0 print:text-slate-850">
                <span className="font-serif text-3xl font-black float-left mr-2 mt-1 leading-4 text-pink-400 print:text-slate-950">W</span>
                {editorialNote}
              </div>
            </div>
          )}

          {/* Selected Commentaries List */}
          <div className="mt-10 space-y-12">
            {selectedCommentaries.length === 0 ? (
              <div className="text-center py-20 no-print">
                <FileCheck2 size={40} className="text-slate-600 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-400">No Articles Selected</h3>
                <p className="text-[10px] text-slate-500 max-w-xs mx-auto mt-1">Check commentaries in the left checklist panel to assemble them into the preview frame.</p>
              </div>
            ) : (
              selectedCommentaries.map((c, index) => (
                <article key={c.id} className="space-y-6 print-card-article">
                  
                  {/* Category & Title */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-wider text-pink-400 print:text-slate-600">
                      <span>Stream: {(c.functionalDomains || []).join(', ')}</span>
                      <span>•</span>
                      <span>Confidence: {c.predictionConfidence || 75}%</span>
                    </div>

                    <h3 className="text-xl lg:text-2xl font-serif font-extrabold text-white leading-tight tracking-tight print:text-slate-950">
                      {c.title}
                    </h3>

                    <div className="flex items-center gap-3 mt-1.5 text-[9px] text-slate-500">
                      <div className="flex items-center gap-1">
                        <User size={10} />
                        <span className="font-bold">{c.author || 'Thought Leader'}</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Calendar size={10} />
                        <span>{c.publishDate ? new Date(c.publishDate).toLocaleDateString() : new Date().toLocaleDateString()}</span>
                      </div>
                      {c.sourceUrl && (
                        <>
                          <span>•</span>
                          <a 
                            href={c.sourceUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-0.5 text-indigo-400 hover:underline print:hidden"
                          >
                            <span>Source</span>
                            <ExternalLink size={8} />
                          </a>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Summary / Problem */}
                  <p className="text-xs text-slate-350 leading-relaxed print:text-slate-800">
                    {c.problemStatement}
                  </p>

                  {/* Dual Perspectives (Consultant vs Client) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* Consultant implication */}
                    <div className="p-4 rounded-xl border border-slate-800/40 bg-slate-900/20 space-y-1.5 print:border-slate-300 print:bg-slate-50 print:p-3">
                      <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-pink-300 print:text-slate-900 flex items-center gap-1">
                        <ChevronRight size={10} />
                        <span>Professional Services Impact</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed print:text-slate-750">
                        {c.consultantImplication || 'No consultant implications documented.'}
                      </p>
                    </div>

                    {/* Practitioner implication */}
                    <div className="p-4 rounded-xl border border-slate-800/40 bg-slate-900/20 space-y-1.5 print:border-slate-300 print:bg-slate-50 print:p-3">
                      <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300 print:text-slate-900 flex items-center gap-1">
                        <ChevronRight size={10} />
                        <span>Enterprise Practitioner Takeaway</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed print:text-slate-750">
                        {c.practitionerImplication || 'No practitioner takeaways documented.'}
                      </p>
                    </div>
                  </div>

                  {/* Oracle Forecast Timeline */}
                  {c.trajectoryPrediction && (
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/60 flex items-start gap-3 print:bg-slate-100 print:border-slate-300 print:p-3">
                      <div className="w-6 h-6 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center shrink-0 mt-0.5 print:text-slate-900">
                        <Sparkles size={12} />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 print:text-slate-600 block">Oracle Forecast & Trajectory</span>
                        <p className="text-[11px] text-slate-300 leading-relaxed print:text-slate-900 font-serif italic">
                          "{c.trajectoryPrediction}"
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Article Divider */}
                  {index < selectedCommentaries.length - 1 && (
                    <div className="w-24 h-0.5 bg-slate-800/80 mx-auto print:bg-slate-300 my-8"></div>
                  )}
                  
                </article>
              ))
            )}
          </div>

          {/* Newspaper Footer */}
          <div className="mt-16 pt-6 border-t border-slate-800/60 text-center text-[9px] text-slate-500 print:border-slate-300 print:text-slate-500">
            <span>© 2026 AI Trajectories Publications. All rights reserved. Generated via AI-Agents.</span>
          </div>

        </div>
      </div>
    </div>
  );
}
