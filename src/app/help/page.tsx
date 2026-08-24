'use client';

import React, { useState } from 'react';
import { 
  Search, 
  RotateCcw, 
  Layers, 
  Activity, 
  ChevronLeft,
  Calendar,
  Archive,
  Info,
  Sparkles,
  ArrowRight,
  HelpCircle,
  TrendingUp,
  Award,
  Users,
  Compass,
  Cpu
} from 'lucide-react';
import Link from 'next/link';

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'architecture' | 'faq' | 'agents'>('architecture');

  const faqs = [
    {
      category: 'General',
      question: 'What is the purpose of the AI Oracle & Commentary Platform?',
      answer: 'The platform serves to educate professional services consultants (data, analytics, AI engineering) and client practitioners on the trajectory of various technology streams: Frontier Model Capabilities, Model-on-Chip Advancements, Agentic Architectures, Ways of Working, and Development Frameworks.'
    },
    {
      category: 'Agents & Scoring',
      question: 'How does the 4-agent LLM scanning pipeline operate?',
      answer: 'When a news feed or blog is crawled, the Editor-in-Chief (EIC) agent evaluates the concept and stream relevance. If accepted, the EIC coordinates three other agents: the Consultant Agent (writes delivery-model implications), the Practitioner Agent (writes enterprise adoption takeaways), and the Oracle Agent (determines short, medium, or long-term predictions).'
    },
    {
      category: 'Thought Leaders',
      question: 'How are Thought Leader profiles created?',
      answer: 'During scans, the pipeline automatically parses the article author. If they are not already in the database, the Author Profiling agent creates a card with a generated biography, competencies list, and avatar.'
    },
    {
      category: 'Newsletter Library',
      question: 'How do I export or print a newsletter edition?',
      answer: 'Go to the Newsletter Library and click "Assemble Edition" at the top-right. In the Newsletter Builder, select the articles you want to include, write an opening editorial note, and click "Print / Save as PDF". The system applies specialized print CSS to deliver a perfectly styled print digest, free of navigation links or buttons.'
    },
    {
      category: 'Operations',
      question: 'How does the Source Discovery Agent find new feeds?',
      answer: 'The Source Discovery Agent scrapes live search indices (via DuckDuckGo) for blogs and RSS links related to a technology stream. It passes the discovered candidates to the local LLM to rank and output trusted feeds with justifications and trust scores.'
    }
  ];

  // Filtering FAQs based on search
  const filteredFAQs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto py-8 px-6 space-y-8 animate-fadeIn text-[#0a0a0a]">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 flex items-center gap-2">
            <HelpCircle size={28} className="text-pink-500" />
            <span>Help & Documentation</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Learn about the multi-agent pipeline, active tech streams, and exporting tools.
          </p>
        </div>

        <div className="relative w-full md:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            placeholder="Search help topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all"
          />
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Navigation Sidebar */}
        <div className="space-y-2 lg:col-span-1">
          <button
            onClick={() => { setActiveTab('architecture'); setSearchQuery(''); }}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-extrabold flex items-center gap-3 transition-all ${
              activeTab === 'architecture' && searchQuery.length === 0
                ? 'bg-slate-900 text-white shadow-md' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Compass size={14} />
            <span>Platform Architecture</span>
          </button>

          <button
            onClick={() => { setActiveTab('agents'); setSearchQuery(''); }}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-extrabold flex items-center gap-3 transition-all ${
              activeTab === 'agents' && searchQuery.length === 0
                ? 'bg-slate-900 text-white shadow-md' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Cpu size={14} />
            <span>Agent Operations</span>
          </button>

          <button
            onClick={() => { setActiveTab('faq'); setSearchQuery(''); }}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-extrabold flex items-center gap-3 transition-all ${
              activeTab === 'faq' || searchQuery.length > 0
                ? 'bg-slate-900 text-white shadow-md' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <HelpCircle size={14} />
            <span>Interactive FAQs</span>
          </button>

          <div className="pt-6 border-t border-slate-200 mt-6 space-y-3">
            <h5 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-4">Workspace Settings</h5>
            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 space-y-2">
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Need help setting up Google & Apple SSO client credentials in your `.env` file? Check the developer setup guide.
              </p>
              <Link 
                href="/operations" 
                className="text-[10px] font-bold text-pink-500 hover:text-pink-600 flex items-center gap-1"
              >
                <span>Go to Operations Console</span>
                <ArrowRight size={10} />
              </Link>
            </div>
          </div>
        </div>

        {/* Display Content Area */}
        <div className="lg:col-span-3 space-y-6">

          {/* TAB 1: Platform Architecture */}
          {activeTab === 'architecture' && searchQuery.length === 0 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                <h3 className="text-base font-bold text-slate-900">AI Oracle & Trajectories Platform</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The application operates as an idea discovery, forecast charting, and newsletter publishing workspace. It automates emerging technology analysis using custom multi-agent LLM teams, extracts profiles for writers, and prepares editorial briefings ready for print or saving as PDF.
                </p>

                {/* Workflow Diagram */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
                  <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 text-center space-y-2">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold mx-auto">1</span>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider">Ingestion</h4>
                    <p className="text-[9px] text-slate-500 leading-normal">
                      Scan external blogs and RSS feeds matching strategic focus streams.
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 text-center space-y-2">
                    <span className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center text-[10px] font-bold mx-auto">2</span>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider">Multi-Agent Critique</h4>
                    <p className="text-[9px] text-slate-500 leading-normal">
                      Evaluate stream fit, consultant impact, and practitioner value.
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 text-center space-y-2">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold mx-auto">3</span>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider">Trajectory Charting</h4>
                    <p className="text-[9px] text-slate-500 leading-normal">
                      Map short, medium, and long-term predictions to the roadmap.
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 text-center space-y-2">
                    <span className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center text-[10px] font-bold mx-auto">4</span>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider">Newsletter Export</h4>
                    <p className="text-[9px] text-slate-500 leading-normal">
                      Assemble commentaries, add editorial letters, and export to PDF.
                    </p>
                  </div>
                </div>
              </div>

              {/* Sections details */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                <h3 className="text-base font-bold text-slate-900">Key Sections Overview</h3>
                <div className="space-y-4 divide-y divide-slate-100">
                  <div className="pt-1 first:pt-0 space-y-1">
                    <h4 className="text-xs font-bold flex items-center gap-1.5 text-slate-950">
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                      Newsletter Library
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed pl-3">
                      Houses the main feed of triaged commentaries. Toggle between perspectives and access the Edition Builder to print or save digests.
                    </p>
                  </div>

                  <div className="pt-3 space-y-1">
                    <h4 className="text-xs font-bold flex items-center gap-1.5 text-slate-950">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                      Oracle Ball
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed pl-3">
                      Features the roadmap timeline (Short, Medium, Long-term) and an integrated RAG console to query future trends.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Agent Details */}
          {activeTab === 'agents' && searchQuery.length === 0 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                <h3 className="text-base font-bold text-slate-900">Multi-Agent Ingestion Pipeline</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  During scan jobs, three main agents operate in sequence to evaluate concepts, categorize themes, extract authors, and draft predictions:
                </p>

                <div className="space-y-4 divide-y divide-slate-100">
                  <div className="pt-1 first:pt-0 space-y-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-pink-500 bg-pink-50 px-2 py-0.5 rounded">1. Editor-in-Chief Agent</span>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Coordinates the ingestion, extracts metadata, verifies feed item duplicates, and routes the article to target streams.
                    </p>
                  </div>

                  <div className="pt-4 space-y-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-900 bg-slate-100 px-2 py-0.5 rounded">2. Perspectives & Takeaway Agents</span>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Two agents run in parallel:
                    </p>
                    <ul className="list-disc pl-5 text-[11px] text-slate-500 space-y-1">
                      <li><strong>Consultant Agent:</strong> Writes custom commentary focused on Professional Services consultants, ways of working, and analytics delivery models.</li>
                      <li><strong>Practitioner Agent:</strong> Focuses on enterprise deployment strategies, cost/latency tradeoffs, and client adoption.</li>
                    </ul>
                  </div>

                  <div className="pt-4 space-y-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-pink-500 bg-pink-50 px-2 py-0.5 rounded">3. Oracle Forecaster & Profile Agents</span>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Constructs 3-tier timeline predictions (Short, Medium, Long-term) with confidence metrics. In parallel, the author agent builds writer profiles and biographies.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FAQ Content (Fallback or Search active) */}
          {(activeTab === 'faq' || searchQuery.length > 0) && (
            <div className="space-y-4 animate-fadeIn">
              {filteredFAQs.length === 0 ? (
                <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
                  <Info size={24} className="mx-auto text-slate-400 mb-2" />
                  <p className="text-xs text-slate-500 font-bold">No matching help questions found.</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Try a different search term like "pipeline", "SSO", or "print".</p>
                </div>
              ) : (
                filteredFAQs.map((faq, idx) => (
                  <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2 hover:shadow-xs transition-shadow">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-pink-500 bg-pink-50 px-2 py-0.5 rounded">
                        {faq.category}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">{faq.question}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">{faq.answer}</p>
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
