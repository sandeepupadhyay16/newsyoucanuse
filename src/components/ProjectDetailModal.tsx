'use client';

import React from 'react';
import { X, Check, ExternalLink, User, Trash2, ThumbsUp, ThumbsDown, Archive, Mic2, Building2, Tag, Globe } from 'lucide-react';
import { usePersona } from '@/components/ClientWrapper';

export interface Project {
  id: string;
  title: string;
  problemStatement: string;
  integrations: string[];
  budgetStatus: string;
  stakeholderStatus: string;
  opportunityCost: string;
  dataReadiness?: string;
  businessCase: string;
  financialRoi: number;
  budgetRequiredVal: number;
  execSponsor: string;
  productOwner: string;
  deploymentGateway: string;
  phase: string;
  therapeuticAreas: string[];
  budgetAvailabilityScore: number;
  dataAvailabilityScore: number;
  stakeholderReadinessScore: number;
  impactOfNotDoingScore: number;
  financialBusinessCaseScore: number;
  budgetRequiredScore: number;
  readinessScore: number;
  functionalDomains: string[];
  functionalDomain?: string;
  submittedBy?: string;
  ideaScore?: number;
  checkerInsight?: string;
  brainstormerInsight?: string;
  validatorInsight?: string;
  businessCaseInsight?: string;
  criticInsight?: string;
  fitRationale?: string;
  financialRoiY1?: number;
  financialRoiY2?: number;
  financialRoiY3?: number;
  budgetRequiredY1?: number;
  budgetRequiredY2?: number;
  budgetRequiredY3?: number;
  businessCaseRationale?: string;
  dependencies?: string;
  businessCaseFile?: string;
  createdAt?: string;
  submittedAt?: string;
  feedback?: string;
  upvotes?: number;
  downvotes?: number;
  dismissedReason?: string;
  
  // v2 fields
  source?: string;
  sourceUrl?: string;
  author?: string;
  publishDate?: string;
  impactWorkingScore?: number;
  impactDevelopmentScore?: number;
  feasibilityScore?: number;
  relevancyScore?: number;
  agendaTimeBlock?: number | null;
  assignedExpertId?: string | null;
  scheduledDate?: string | null;

  // Speaker & Partner
  speakerName?: string;
  partnerName?: string;
}

export function parseMarkdownText(text: string, isUser = false) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];
  let isList = false;

  const parseBold = (str: string) => {
    const parts = str.split('**');
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className={`font-extrabold ${isUser ? 'text-white' : 'text-slate-900'}`}>{part}</strong>;
      }
      return part;
    });
  };

  const textClass = isUser ? 'text-slate-100' : 'text-slate-700';

  const flushList = (key: number) => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${key}`} className={`list-disc pl-4 space-y-1 my-1.5 ${textClass}`}>
          {currentList}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('###')) {
      flushList(index);
      isList = false;
      const headerText = trimmed.replace(/^###\s*/, '');
      elements.push(
        <h5 key={index} className={`font-extrabold text-[10px] uppercase tracking-wider mt-3 mb-1.5 flex items-center gap-1 ${isUser ? 'text-white' : 'text-slate-900'}`}>
          {parseBold(headerText)}
        </h5>
      );
    } else if (trimmed.startsWith('##')) {
      flushList(index);
      isList = false;
      const headerText = trimmed.replace(/^##\s*/, '');
      elements.push(
        <h4 key={index} className={`font-extrabold text-xs mt-4 mb-1.5 ${isUser ? 'text-white' : 'text-slate-900'}`}>
          {parseBold(headerText)}
        </h4>
      );
    } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      isList = true;
      const content = trimmed.substring(2);
      currentList.push(
        <li key={`li-${index}`} className="leading-relaxed">
          {parseBold(content)}
        </li>
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
      flushList(index);
      isList = false;
      const content = trimmed.replace(/^\d+\.\s*/, '');
      elements.push(
        <div key={index} className={`flex gap-1.5 my-1 leading-relaxed pl-0.5 ${textClass}`}>
          <span className="font-bold text-pink-500 shrink-0">{trimmed.match(/^\d+/)?.[0]}.</span>
          <span>{parseBold(content)}</span>
        </div>
      );
    } else if (trimmed === '') {
      flushList(index);
      isList = false;
    } else {
      flushList(index);
      isList = false;
      elements.push(
        <p key={index} className={`mb-1.5 leading-relaxed ${textClass}`}>
          {parseBold(trimmed)}
        </p>
      );
    }
  });

  if (currentList.length > 0) {
    elements.push(
      <ul key="list-final" className={`list-disc pl-4 space-y-1 my-1.5 ${textClass}`}>
        {currentList}
      </ul>
    );
  }

  return <div className="space-y-0.5">{elements}</div>;
}

export const getPhaseBadgeColor = (phase: string) => {
  switch (phase) {
    case 'Curated': return 'bg-purple-50 text-purple-800 border-purple-200';
    case 'Scheduled': return 'bg-cyan-50 text-cyan-800 border-cyan-200';
    case 'Ready': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'Working': return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'Draft': return 'bg-violet-50 text-violet-850 border-violet-200';
    case 'Sent Back': return 'bg-rose-50 text-rose-800 border-rose-200';
    case 'Archived': return 'bg-slate-100 text-slate-600 border-slate-300';
    case 'Harvested': return 'bg-pink-50 text-pink-800 border-pink-200';
    default: return 'bg-slate-50 text-slate-700 border-slate-200'; // Backlog
  }
};

interface ProjectDetailModalProps {
  project: Project | null;
  onClose: () => void;
  onRefresh?: () => void;
}

export default function ProjectDetailModal({ project: propProject, onClose, onRefresh }: ProjectDetailModalProps) {
  const { currentPersona } = usePersona();
  const [showSendBackForm, setShowSendBackForm] = React.useState(false);
  const [feedbackText, setFeedbackText] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showDismissForm, setShowDismissForm] = React.useState(false);
  const [dismissalReason, setDismissalReason] = React.useState('');

  // Editable speaker & partner fields
  const [speakerName, setSpeakerName] = React.useState('');
  const [partnerName, setPartnerName] = React.useState('');
  const [isSavingAssignment, setIsSavingAssignment] = React.useState(false);
  const [assignmentSaved, setAssignmentSaved] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const [localProject, setLocalProject] = React.useState<Project | null>(null);

  React.useEffect(() => {
    setLocalProject(propProject);
    setShowSendBackForm(false);
    setShowDismissForm(false);
    setDismissalReason('');
    setSpeakerName(propProject?.speakerName || '');
    setPartnerName(propProject?.partnerName || '');
    setAssignmentSaved(false);
  }, [propProject]);

  if (!propProject || !localProject) return null;

  const project = localProject;

  const handleUpdatePhase = async (newPhase: string, customFeedback?: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...project,
          phase: newPhase,
          feedback: customFeedback !== undefined ? customFeedback : (project.feedback || ''),
        }),
      });
      if (!res.ok) {
        throw new Error('Failed to update project phase');
      }
      if (onRefresh) {
        onRefresh();
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error updating phase: ' + err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setShowDeleteConfirm(false);
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/projects?id=${project.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        if (onRefresh) onRefresh();
        onClose();
      } else {
        const errorData = await res.json();
        alert('Failed to delete project: ' + (errorData.error || 'Server error'));
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting project: ' + err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvote = async () => {
    try {
      const res = await fetch('/api/projects/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, voteType: 'upvote' })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.project) {
          setLocalProject(data.project);
          if (onRefresh) onRefresh();
        }
      }
    } catch (err) {
      console.error('Failed to upvote:', err);
    }
  };

  const handleDismissSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dismissalReason.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/projects/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          voteType: 'downvote',
          reason: dismissalReason.trim()
        })
      });
      if (res.ok) {
        if (onRefresh) onRefresh();
        onClose();
      }
    } catch (err) {
      console.error('Failed to dismiss:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAssignment = async () => {
    setIsSavingAssignment(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...project,
          speakerName: speakerName.trim(),
          partnerName: partnerName.trim(),
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setLocalProject(updated);
        setAssignmentSaved(true);
        setTimeout(() => setAssignmentSaved(false), 3000);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error('Failed to save assignment:', err);
    } finally {
      setIsSavingAssignment(false);
    }
  };

  // Determine if this is a horizon-sourced harvested item (vs a manual intake submission)
  const isHarvestedFromFeed = project.source === 'News Feed' || project.phase === 'Harvested';

  // Relevancy scores with friendly labels
  const strategicImpact = project.impactWorkingScore ?? 0;
  const innovationPotential = project.impactDevelopmentScore ?? 0;
  const commercialReadiness = project.feasibilityScore ?? 0;
  const overallScore = project.relevancyScore ?? project.readinessScore ?? 0;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-[#fffaf0] border border-slate-200 p-6 shadow-2xl relative animate-fadeIn max-h-[90vh] overflow-y-auto text-[#0a0a0a]">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-950 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="space-y-2 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[9px] font-semibold px-2 py-0.5 rounded border ${getPhaseBadgeColor(project.phase)}`}>
              {project.phase}
            </span>
            {(project.therapeuticAreas || []).length > 0 && (
              <span className="text-[9px] uppercase font-bold tracking-wider text-pink-600 bg-pink-50 px-2 py-0.5 rounded border border-pink-100">
                {(project.therapeuticAreas || []).join(', ')}
              </span>
            )}
            {project.sourceUrl ? (
              <a
                href={project.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] font-bold px-2 py-0.5 rounded border bg-blue-50 text-blue-800 border-blue-100 flex items-center gap-0.5 hover:bg-blue-100 transition-colors"
              >
                <Globe size={8} />
                <span>{project.source || 'News Feed'}</span>
                <ExternalLink size={8} />
              </a>
            ) : (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded border bg-blue-50 text-blue-800 border-blue-100">
                {project.source || 'Intake Wizard'}
              </span>
            )}
            {project.author && (
              <span className="text-[9px] text-slate-500 font-semibold">by {project.author}</span>
            )}

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={handleUpvote}
                className="text-[10px] font-bold text-slate-600 hover:text-emerald-700 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <ThumbsUp size={11} className="text-emerald-600" />
                <span>Upvote ({project.upvotes || 0})</span>
              </button>

              {project.phase !== 'Dismissed' && (
                <button
                  type="button"
                  onClick={() => {
                    setShowDismissForm(true);
                    setShowSendBackForm(false);
                  }}
                  className="text-[10px] font-bold text-slate-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <ThumbsDown size={11} className="text-rose-500" />
                  <span>Dismiss</span>
                </button>
              )}
            </div>
          </div>

          <h2 className="text-lg font-bold text-[#0a0a0a] leading-snug">{project.title}</h2>
          
          {/* Functional Domain Tags */}
          <div className="flex flex-wrap gap-1">
            {(project.functionalDomains || []).map(dm => (
              <span key={dm} className="text-[9px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded border border-slate-200 flex items-center gap-0.5">
                <Tag size={8} />
                {dm}
              </span>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-5 py-5">

          {/* Steering Committee Feedback if present */}
          {project.feedback && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5 shadow-sm">
              <div className="text-[10px] font-extrabold text-rose-500 uppercase tracking-wider">
                ⚠️ Steering Committee Feedback
              </div>
              <div className="text-xs text-rose-900 font-semibold leading-relaxed">
                {parseMarkdownText(project.feedback)}
              </div>
            </div>
          )}

          {/* Dismissal / Rejection Reason if present */}
          {project.dismissedReason && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5 shadow-sm">
              <div className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider">
                ⚠️ Rejection / Dismissal Reason
              </div>
              <p className="text-xs text-amber-900 font-semibold leading-relaxed italic">
                "{project.dismissedReason}"
              </p>
              {/* Detailed LLM Critic Reasoning if it exists in criticInsight */}
              {project.criticInsight && (
                <div className="mt-3 pt-3 border-t border-amber-200/60 space-y-2">
                  <div className="text-[9px] font-bold text-amber-600 uppercase tracking-wider">
                    Critic's Initial Evaluation
                  </div>
                  <div className="text-xs text-amber-900 leading-relaxed font-medium">
                    {parseMarkdownText(project.criticInsight)}
                  </div>
                </div>
              )}
              {/* Detailed LLM Judge Agreement / Disagreement Rationale */}
              {project.fitRationale && (
                <div className="mt-3 pt-3 border-t border-amber-200/60 space-y-2">
                  <div className="text-[9px] font-bold text-amber-600 uppercase tracking-wider">
                    Judge Fit Rationale (Agreement/Disagreement Assessment)
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed font-semibold">
                    {project.fitRationale}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Concept Overview */}
          <div className="space-y-1.5">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Concept Overview</h4>
            <p className="text-xs text-slate-700 leading-relaxed bg-white p-4 rounded-xl border border-slate-200">
              {project.problemStatement || 'No concept description provided.'}
            </p>
          </div>

          {/* Why This Matters for Pfizer (businessCase = pfizerImplication) */}
          {project.businessCase && (
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Why This Matters for Pfizer</h4>
              <p className="text-xs text-slate-700 leading-relaxed bg-pink-50/60 p-4 rounded-xl border border-pink-150/60 font-semibold">
                {project.businessCase}
              </p>
            </div>
          )}

          {/* Relevancy Scorecard */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Relevancy Scorecard</h4>
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4 shadow-sm">
              <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-2">
                <span className="text-slate-700 font-semibold">Overall Relevancy Score</span>
                <span className="font-bold text-[#ff4d8b] text-sm">{overallScore.toFixed(1)} / 100</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Strategic Impact */}
                <div className="text-[10px] text-slate-600 font-bold space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-sky-800">Strategic Impact</span>
                    <span className="text-sky-600 font-bold">{strategicImpact.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-500 rounded-full transition-all" style={{width: `${strategicImpact}%`}}></div>
                  </div>
                  <p className="text-[9px] text-slate-400 font-normal">Potential to reshape commercial or operational workflows</p>
                </div>
                {/* Innovation Potential */}
                <div className="text-[10px] text-slate-600 font-bold space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-indigo-800">Innovation Potential</span>
                    <span className="text-indigo-600 font-bold">{innovationPotential.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all" style={{width: `${innovationPotential}%`}}></div>
                  </div>
                  <p className="text-[9px] text-slate-400 font-normal">Novelty and capacity to advance digital maturity</p>
                </div>
                {/* Commercial Readiness */}
                <div className="text-[10px] text-slate-600 font-bold space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-purple-800">Commercial Readiness</span>
                    <span className="text-purple-600 font-bold">{commercialReadiness.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full transition-all" style={{width: `${commercialReadiness}%`}}></div>
                  </div>
                  <p className="text-[9px] text-slate-400 font-normal">Scalability, regulatory fit, and deployment feasibility</p>
                </div>
              </div>
            </div>
          </div>

          {/* Speaker & Partner Assignment */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Speaker & Partner Assignment</h4>
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4 shadow-sm">
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Speaker */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Mic2 size={11} className="text-pink-500" />
                    <span>Speaker / Presenter</span>
                  </label>
                  <input
                    type="text"
                    value={speakerName}
                    onChange={e => { setSpeakerName(e.target.value); setAssignmentSaved(false); }}
                    placeholder="e.g. Colleen Stranzl"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-pink-400 focus:bg-white transition-colors placeholder:text-slate-400"
                  />
                  <p className="text-[9px] text-slate-400">Internal Pfizer speaker who will present this topic</p>
                </div>

                {/* Partner / Vendor */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Building2 size={11} className="text-indigo-500" />
                    <span>External Partner / Vendor</span>
                  </label>
                  <input
                    type="text"
                    value={partnerName}
                    onChange={e => { setPartnerName(e.target.value); setAssignmentSaved(false); }}
                    placeholder="e.g. OpenAI, Salesforce, Veeva"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-400 focus:bg-white transition-colors placeholder:text-slate-400"
                  />
                  <p className="text-[9px] text-slate-400">External technology vendor or partner for this concept</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  {project.speakerName && (
                    <span className="text-[9px] bg-pink-50 border border-pink-100 text-pink-700 font-bold px-2 py-0.5 rounded flex items-center gap-0.5">
                      <Mic2 size={8} /> {project.speakerName}
                    </span>
                  )}
                  {project.partnerName && (
                    <span className="text-[9px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded flex items-center gap-0.5">
                      <Building2 size={8} /> {project.partnerName}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleSaveAssignment}
                  disabled={isSavingAssignment}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-xs ${
                    assignmentSaved
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  } disabled:opacity-50`}
                >
                  {isSavingAssignment ? (
                    <span>Saving…</span>
                  ) : assignmentSaved ? (
                    <><Check size={10} /><span>Saved!</span></>
                  ) : (
                    <span>Save Assignment</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Submitter info */}
          <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 font-semibold pt-1">
            {project.submittedBy && (
              <div className="flex items-center gap-1">
                <User size={11} className="text-slate-400" />
                <span>Submitted by {project.submittedBy}</span>
              </div>
            )}
            {project.submittedAt && (
              <span className="text-slate-400">on {new Date(project.submittedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            )}
          </div>
        </div>

        {/* Send Back Form Section */}
        {showSendBackForm && (
          <div className="mb-4 p-4 bg-rose-50/50 border border-rose-200 rounded-xl space-y-3 animate-fadeIn">
            <label className="block text-xs font-bold text-[#0a0a0a] uppercase tracking-wider">
              Steering Committee Feedback for Owner
            </label>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="e.g. Please refine Year 2 returns and details about system integrations."
              className="w-full h-20 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 resize-none text-[#0a0a0a] font-semibold"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSendBackForm(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting || !feedbackText.trim()}
                onClick={() => handleUpdatePhase('Sent Back', feedbackText)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Send Back
              </button>
            </div>
          </div>
        )}

        {/* Dismiss Form Section */}
        {showDismissForm && (
          <form onSubmit={handleDismissSubmit} className="mb-4 p-4 bg-rose-50/50 border border-rose-200 rounded-xl space-y-3 animate-fadeIn">
            <label className="block text-xs font-bold text-[#0a0a0a] uppercase tracking-wider">
              Steering Committee Dismissal Reason
            </label>
            <textarea
              required
              value={dismissalReason}
              onChange={(e) => setDismissalReason(e.target.value)}
              placeholder="e.g. Budget is too high for current brand priority, or duplicate of another active project."
              className="w-full h-20 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 resize-none text-[#0a0a0a] font-semibold"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDismissForm(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !dismissalReason.trim()}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                Confirm Dismissal
              </button>
            </div>
          </form>
        )}

        {/* Actions Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-200 flex-wrap gap-3">
          <div className="flex gap-2 flex-wrap">
            {/* Archive: show for any phase except Archived, Draft, or Dismissed */}
            {project.phase !== 'Archived' && project.phase !== 'Draft' && project.phase !== 'Dismissed' && !showSendBackForm && !showDismissForm && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleUpdatePhase('Archived')}
                className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
              >
                <Archive size={13} />
                Archive
              </button>
            )}

            {/* Send Back: only show for Backlog phase with admin role */}
            {currentPersona?.role === 'ADMIN' && project.phase === 'Backlog' && !showSendBackForm && !showDismissForm && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setShowSendBackForm(true);
                  setShowDismissForm(false);
                }}
                className="px-3 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                Send Back
              </button>
            )}

            {/* Delete */}
            {!showSendBackForm && !showDismissForm && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDeleteProject}
                className="px-3 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            )}
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Centered custom delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs z-55 flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-[#fffcf5] border border-slate-200 rounded-3xl shadow-2xl overflow-hidden animate-zoomIn flex flex-col p-6 space-y-6 text-left">
            <div className="space-y-2">
              <h3 className="text-sm font-black text-slate-950 uppercase tracking-wider">Confirm Deletion</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                Are you sure you want to permanently delete this AI use case proposal?
              </p>
            </div>
            
            <div className="flex justify-end gap-2 text-[10px] font-bold">
              <button
                onClick={() => setShowDeleteConfirm(false)}
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
