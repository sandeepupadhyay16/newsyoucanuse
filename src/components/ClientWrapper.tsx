'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Link2,
  FilePlus, 
  Menu, 
  X,
  Sparkles,
  Send,
  Loader2,
  Check,
  Activity,
  History,
  Trash2,
  PlusCircle,
  Globe,
  Archive,
  HelpCircle,
  ChevronDown,
  TrendingUp
} from 'lucide-react';

export type PersonaRole = 'ADMIN' | 'USER';

export interface Persona {
  role: PersonaRole;
  name: string;
  title: string;
  avatar: string;
  badge: string;
  color: string;
  description: string;
}

export const PERSONAS: Record<PersonaRole, Persona> = {
  ADMIN: {
    role: 'ADMIN',
    name: 'demouser_promaxultra',
    title: 'VP, Head of Agent Product',
    avatar: 'DP',
    badge: 'Editor',
    color: 'from-emerald-500 to-teal-500',
    description: 'Full editor access. Authorized to configure feeds, discover new sources, trigger scans, and write custom commentary.'
  },
  USER: {
    role: 'USER',
    name: 'Marcus Broady',
    title: 'Senior Consultant',
    avatar: 'MB',
    badge: 'Reader',
    color: 'from-blue-500 to-cyan-500',
    description: 'Browse news, view future trajectory timelines, read consultant takeaways, and query the Oracle Ball chatbot.'
  }
};

export interface AuthenticatedUser {
  email: string;
  name: string;
  avatarUrl: string;
  role: 'READER' | 'EDITOR';
  provider: 'Google' | 'Apple';
}

interface PersonaContextType {
  currentPersona: Persona;
  currentUser: AuthenticatedUser | null;
  role: PersonaRole;
  setPersona: (role: PersonaRole) => void;
  weights: number[];
  saveWeights: (newWeights: number[]) => Promise<boolean>;
  signOutUser: () => void;
}

const PersonaContext = createContext<PersonaContextType | undefined>(undefined);

export function usePersona() {
  const context = useContext(PersonaContext);
  if (!context) {
    throw new Error('usePersona must be used within a PersonaProvider');
  }
  return context;
}

function parseMarkdownText(text: string, isUser = false) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];
  let isList = false;

  const parseInlineFormatting = (str: string) => {
    const boldParts = str.split('**');
    return boldParts.map((boldPart, bIdx) => {
      const isBold = bIdx % 2 === 1;
      const italicParts = boldPart.split('*');
      const renderedItalics = italicParts.map((italicPart, iIdx) => {
        const isItalic = iIdx % 2 === 1;
        if (isItalic) {
          return <em key={iIdx} className="italic font-medium">{italicPart}</em>;
        }
        return italicPart;
      });

      if (isBold) {
        return (
          <strong key={bIdx} className={`font-extrabold ${isUser ? 'text-white' : 'text-slate-900'}`}>
            {renderedItalics}
          </strong>
        );
      }
      return <React.Fragment key={bIdx}>{renderedItalics}</React.Fragment>;
    });
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      isList = true;
      currentList.push(
        <li key={index} className="list-disc ml-5 mb-1.5 pl-1 leading-relaxed">
          {parseInlineFormatting(trimmed.substring(2))}
        </li>
      );
    } else {
      if (isList) {
        elements.push(<ul key={`list-${index}`} className="my-2 space-y-1">{currentList}</ul>);
        currentList = [];
        isList = false;
      }

      if (trimmed.startsWith('### ')) {
        elements.push(
          <h4 key={index} className={`text-xs font-bold uppercase tracking-wider mt-4 mb-2 ${isUser ? 'text-white' : 'text-slate-900'}`}>
            {parseInlineFormatting(trimmed.substring(4))}
          </h4>
        );
      } else if (trimmed.startsWith('## ')) {
        elements.push(
          <h3 key={index} className={`text-sm font-bold tracking-tight mt-6 mb-3 ${isUser ? 'text-white' : 'text-slate-950'}`}>
            {parseInlineFormatting(trimmed.substring(3))}
          </h3>
        );
      } else if (trimmed.startsWith('# ')) {
        elements.push(
          <h2 key={index} className={`text-base font-extrabold tracking-tight mt-8 mb-4 ${isUser ? 'text-white' : 'text-slate-950'}`}>
            {parseInlineFormatting(trimmed.substring(2))}
          </h2>
        );
      } else if (trimmed === '') {
        elements.push(<div key={`blank-${index}`} className="h-2"></div>);
      } else {
        elements.push(
          <p key={index} className={`mb-3.5 leading-relaxed text-xs ${isUser ? 'text-slate-100' : 'text-slate-700'}`}>
            {parseInlineFormatting(line)}
          </p>
        );
      }
    }
  });

  if (isList) {
    elements.push(<ul key="list-end" className="my-2 space-y-1">{currentList}</ul>);
  }

  return elements;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: any;
  offerDiscovery?: boolean;
  discoveryStream?: string;
  discoveryStatus?: 'idle' | 'running' | 'completed' | 'failed';
  discoveryLogs?: string[];
}

interface ChatSession {
  id: string;
  title: string;
  timestamp: number;
  messages: ChatMessage[];
}

interface SidebarItem {
  type: 'link' | 'section';
  name?: string;
  href?: string;
  icon?: any;
  roles?: string[];
  title?: string;
  items?: Array<{ name: string; href: string; icon: any; roles: string[] }>;
}

const FUNNY_LOADING_MESSAGES = [
  "Oracle is channeling the temporal stream...",
  "Consultant Agent is adjusting its frameworks...",
  "Client Agent is calculating enterprise ROI...",
  "Editor-in-Chief is proofreading forecasts...",
  "Querying the temporal forecasting model...",
  "Deciphering tomorrow's ways of working..."
];

const getUserInitials = (name: string) => {
  if (!name) return 'DU';
  if (name.includes('_')) {
    return name.split('_').map(n => n[0]?.toUpperCase()).join('').slice(0, 2);
  }
  const parts = name.split(' ').filter(Boolean);
  if (parts.length > 1) {
    return parts.map(n => n[0]?.toUpperCase()).join('').slice(0, 2);
  }
  return name.slice(0, 2).toUpperCase();
};

const DEFAULT_USER: AuthenticatedUser = {
  email: 'demouser_promaxultra@ai-insights.com',
  name: 'demouser_promaxultra',
  avatarUrl: '',
  role: 'EDITOR',
  provider: 'Google'
};

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // User Authentication & Simulation States - Direct Access Default User
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser>(DEFAULT_USER);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // App Layout States
  const [role, setRole] = useState<PersonaRole>('ADMIN');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [weights, setWeights] = useState<number[]>([0.40, 0.30, 0.30]);

  // Chat/RAG States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Orchestrating RAG agents...');
  
  // Chat History States
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingMsgText, setEditingMsgText] = useState('');
  const [saveSessionFlash, setSaveSessionFlash] = useState(false);

  // Load configuration and chat sessions
  useEffect(() => {
    // Fetch weights config from server
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.weights) && data.weights.length === 3) {
          setWeights(data.weights);
        }
      })
      .catch(err => console.error('Error fetching weights:', err));

    // Load local chat history sessions
    const loadedSessions = localStorage.getItem('ai_council_chat_sessions');
    if (loadedSessions) {
      const parsed = JSON.parse(loadedSessions) as ChatSession[];
      if (parsed.length > 0) {
        setSessions(parsed);
        const lastSession = parsed[parsed.length - 1];
        setCurrentSessionId(lastSession.id);
        setChatMessages(lastSession.messages);
        return;
      }
    }
    
    // Initialize default session if empty
    startNewSession([]);
  }, []);

  // Update funny status messages during chat generation
  useEffect(() => {
    if (!isSendingChat) {
      setLoadingMessage('Co-Pilot is orchestrating sub-agents...');
      return;
    }

    const pickMessage = () => {
      const idx = Math.floor(Math.random() * FUNNY_LOADING_MESSAGES.length);
      setLoadingMessage(FUNNY_LOADING_MESSAGES[idx]);
    };
    pickMessage();

    const interval = setInterval(pickMessage, 2500);
    return () => clearInterval(interval);
  }, [isSendingChat]);

  const setPersona = (newRole: PersonaRole) => {
    setRole(newRole);
    if (currentUser) {
      const nextUser: AuthenticatedUser = {
        ...currentUser,
        role: newRole === 'ADMIN' ? 'EDITOR' : 'READER'
      };
      setCurrentUser(nextUser);
      localStorage.setItem('ai_trend_user', JSON.stringify(nextUser));
    }
  };

  const saveWeights = async (newWeights: number[]): Promise<boolean> => {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weights: newWeights, role })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setWeights(data.weights);
        return true;
      } else {
        alert(data.error || 'Failed to save weights');
        return false;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const signOutUser = () => {
    setShowProfileMenu(false);
  };

  // Helper: Start clean session
  const startNewSession = (currentList: ChatSession[] = sessions) => {
    const newId = Math.random().toString();
    const cleanSession: ChatSession = {
      id: newId,
      title: 'New Session',
      timestamp: Date.now(),
      messages: [
        {
          id: 'welcome',
          role: 'assistant',
          content: "Hello! I am your AI Oracle & Commentary Assistant.\n\nAsk me anything about technology streams (Frontier Capabilities, Model-on-Chip, Agentic Architectures), future trajectory roadmaps, or author summaries:"
        }
      ]
    };

    const next = [...currentList, cleanSession];
    setSessions(next);
    setCurrentSessionId(newId);
    setChatMessages(cleanSession.messages);
    localStorage.setItem('ai_council_chat_sessions', JSON.stringify(next));
  };

  const handleNewSession = () => {
    startNewSession();
  };

  // Helper: Update local active session details
  const saveActiveSession = (updatedMessages: any[]) => {
    if (!currentSessionId) return;
    
    const firstUserMsg = updatedMessages.find(m => m.role === 'user');
    const firstUserText = firstUserMsg ? firstUserMsg.content : '';
    const autoTitle = firstUserText ? (firstUserText.length > 25 ? firstUserText.substring(0, 25) + '...' : firstUserText) : 'Chat Session';

    setSessions(prev => {
      const next = prev.map(s => {
        if (s.id === currentSessionId) {
          const currentTitle = s.title || '';
          const isDefault = currentTitle === 'New Session' || currentTitle === 'Chat Session' || currentTitle === 'Untitled Session' || currentTitle === 'Brainstorming Session';
          const nextTitle = !isDefault ? currentTitle : autoTitle;

          return {
            ...s,
            title: nextTitle,
            timestamp: Date.now(),
            messages: updatedMessages
          };
        }
        return s;
      });

      localStorage.setItem('ai_council_chat_sessions', JSON.stringify(next));
      return next;
    });
  };

  // Select another chat session
  const handleSelectSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setChatMessages(session.messages);
    setIsHistoryOpen(false);
  };

  // Delete chat session
  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    localStorage.setItem('ai_council_chat_sessions', JSON.stringify(updated));

    if (currentSessionId === id) {
      if (updated.length > 0) {
        setCurrentSessionId(updated[0].id);
        setChatMessages(updated[0].messages);
      } else {
        startNewSession(updated);
      }
    }
  };

  // Clear all chat sessions
  const handleClearAllHistory = () => {
    setSessions([]);
    localStorage.removeItem('ai_council_chat_sessions');
    startNewSession([]);
  };

  // Rename current chat session explicitly
  const handleSaveSessionExplicitly = () => {
    if (!currentSessionId) return;
    const session = sessions.find(s => s.id === currentSessionId);
    if (!session) return;

    const firstUserMsg = chatMessages.find(m => m.role === 'user');
    const defaultTitle = firstUserMsg ? firstUserMsg.content : 'Brainstorming Session';
    
    const newTitle = prompt('Enter a new title for this chat session:', session.title || defaultTitle);
    if (newTitle === null) return; // cancelled

    const sanitized = newTitle.trim() || 'Chat Session';
    setSessions(prev => {
      const next = prev.map(s => {
        if (s.id === currentSessionId) {
          return { ...s, title: sanitized };
        }
        return s;
      });
      localStorage.setItem('ai_council_chat_sessions', JSON.stringify(next));
      return next;
    });

    setSaveSessionFlash(true);
    setTimeout(() => setSaveSessionFlash(false), 2000);
  };

  // Send message on form submit
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isSendingChat) return;

    const userMessage: ChatMessage = {
      id: Math.random().toString(),
      role: 'user',
      content: chatInput.trim()
    };

    const updated = [...chatMessages, userMessage];
    setChatMessages(updated);
    setChatInput('');
    setIsSendingChat(true);
    saveActiveSession(updated);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          history: updated
        })
      });

      const data = await res.json();
      if (res.ok && data.answer) {
        const reply: ChatMessage = {
          id: Math.random().toString(),
          role: 'assistant',
          content: data.answer,
          offerDiscovery: data.offerDiscovery,
          discoveryStream: data.discoveryStream,
          discoveryStatus: 'idle',
          discoveryLogs: []
        };
        const nextMessages = [...updated, reply];
        setChatMessages(nextMessages);
        saveActiveSession(nextMessages);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSendingChat(false);
    }
  };

  // Double click and edit user message text inline
  const handleSaveMessageEdit = async (msgId: string, newText: string) => {
    if (!newText.trim()) return;

    // Locate edited message and truncate history beyond it
    const msgIndex = chatMessages.findIndex(m => m.id === msgId);
    if (msgIndex === -1) return;

    const truncatedMessages = chatMessages.slice(0, msgIndex);
    const editedMsg: ChatMessage = {
      ...chatMessages[msgIndex],
      content: newText.trim()
    };

    const nextHistory = [...truncatedMessages, editedMsg];
    setChatMessages(nextHistory);
    setEditingMsgId(null);
    setIsSendingChat(true);
    saveActiveSession(nextHistory);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: editedMsg.content,
          history: nextHistory
        })
      });

      const data = await res.json();
      if (res.ok && data.answer) {
        const reply: ChatMessage = {
          id: Math.random().toString(),
          role: 'assistant',
          content: data.answer,
          offerDiscovery: data.offerDiscovery,
          discoveryStream: data.discoveryStream,
          discoveryStatus: 'idle',
          discoveryLogs: []
        };
        const finalMessages = [...nextHistory, reply];
        setChatMessages(finalMessages);
        saveActiveSession(finalMessages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleTriggerDiscoveryFromChat = async (msgId: string, streamName: string) => {
    setChatMessages(prev => prev.map(m => {
      if (m.id === msgId) {
        return {
          ...m,
          discoveryStatus: 'running',
          discoveryLogs: ['Initializing discovery agent...']
        };
      }
      return m;
    }));

    try {
      const res = await fetch('/api/chat/trigger-discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stream: streamName })
      });
      const data = await res.json();
      if (res.ok && data.success && data.taskId) {
        pollDiscoveryTask(msgId, data.taskId);
      } else {
        throw new Error(data.error || 'Failed to trigger crawler.');
      }
    } catch (err: any) {
      setChatMessages(prev => prev.map(m => {
        if (m.id === msgId) {
          return {
            ...m,
            discoveryStatus: 'failed',
            discoveryLogs: [...(m.discoveryLogs || []), `[ERROR] Ingestion failed: ${err.message}`]
          };
        }
        return m;
      }));
    }
  };

  const pollDiscoveryTask = (msgId: string, taskId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/external-feed/scan?taskId=${taskId}`);
        const data = await res.json();
        if (res.ok) {
          setChatMessages(prev => prev.map(m => {
            if (m.id === msgId) {
              const currentLogs = data.logs || [];
              const status = data.status;
              let nextStatus: 'idle' | 'running' | 'completed' | 'failed' = 'running';
              if (status === 'completed') {
                nextStatus = 'completed';
                clearInterval(interval);
                // Reload page after a delay
                setTimeout(() => {
                  window.location.reload();
                }, 1500);
              } else if (status === 'failed' || status === 'aborted') {
                nextStatus = 'failed';
                clearInterval(interval);
              }
              return {
                ...m,
                discoveryStatus: nextStatus,
                discoveryLogs: currentLogs
              };
            }
            return m;
          }));
        }
      } catch {
        clearInterval(interval);
      }
    }, 2000);
  };

  // Helper for clicking suggested queries
  const handleSendSampleQuestion = (question: string) => {
    setChatInput(question);
    // Submit in next tick
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }, 50);
  };

  // Navigation structure based on mock roles
  const currentPersona = PERSONAS[role];

  const navStructure: SidebarItem[] = [
    {
      type: 'link',
      name: 'Home Dashboard',
      href: '/',
      icon: Home,
      roles: ['ADMIN', 'USER']
    },
    {
      type: 'section',
      title: 'Insights Hub',
      items: [
        { name: 'Newsletter Library', href: '/newsletter', icon: Globe, roles: ['ADMIN', 'USER'] },
        { name: 'Oracle Ball Predictions', href: '/oracle', icon: TrendingUp, roles: ['ADMIN', 'USER'] },
      ]
    },
    {
      type: 'section',
      title: 'Sources & Operations',
      items: [
        { name: 'Sources & Streams Hub', href: '/sources', icon: Link2, roles: ['ADMIN', 'USER'] },
        { name: 'Ingestion Operations', href: '/operations', icon: Activity, roles: ['ADMIN', 'USER'] },
        { name: 'Triage / Ingestion', href: '/intake', icon: FilePlus, roles: ['ADMIN', 'USER'] },
        { name: 'Trend Archive', href: '/archive', icon: Archive, roles: ['ADMIN', 'USER'] },
      ]
    },
    {
      type: 'section',
      title: 'Support',
      items: [
        { name: 'Help & Documentation', href: '/help', icon: HelpCircle, roles: ['ADMIN', 'USER'] }
      ]
    }
  ];

  // ==================== MAIN PLATFORM VIEW ====================
  return (
    <PersonaContext.Provider value={{ currentPersona, currentUser, role, setPersona, weights, saveWeights, signOutUser }}>
      <div className="h-screen flex flex-col bg-[#fffaf0] text-slate-950 font-sans selection:bg-pink-500 selection:text-white relative overflow-hidden">
        
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-200 bg-[#fffaf0]/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-900/5 transition-colors cursor-pointer"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#0a0a0a] flex items-center justify-center font-bold text-[#fffaf0] shadow-sm">
                Ω
              </div>
              <span className="font-extrabold tracking-tight text-md text-[#0a0a0a]">
                AI <span className="font-normal text-slate-500">Oracle & Commentary</span>
              </span>
            </Link>
          </div>

          {/* User management profile dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
            >
              <div className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${currentUser.role === 'EDITOR' ? 'from-emerald-500 to-teal-500' : 'from-blue-500 to-cyan-500'} flex items-center justify-center font-bold text-white text-[11px] shadow-sm`}>
                {getUserInitials(currentUser.name)}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-bold text-slate-800 leading-tight truncate max-w-[100px]">{currentUser.name}</span>
                <span className="text-[8px] text-slate-500 font-semibold mt-0.5">{currentUser.role === 'EDITOR' ? 'Editor' : 'Reader'}</span>
              </div>
              <ChevronDown size={12} className="text-slate-400" />
            </button>

            {showProfileMenu && (
              <>
                <div 
                  onClick={() => setShowProfileMenu(false)}
                  className="fixed inset-0 z-40 bg-transparent"
                ></div>
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200 shadow-2xl p-4 z-50 space-y-4 animate-slideIn">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${currentUser.role === 'EDITOR' ? 'from-emerald-500 to-teal-500' : 'from-blue-500 to-cyan-500'} flex items-center justify-center font-bold text-white text-xs shadow-md`}>
                      {getUserInitials(currentUser.name)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 leading-tight">{currentUser.name}</h4>
                      <p className="text-[9px] text-slate-400 truncate max-w-[180px]">{currentUser.email}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-[10px] text-slate-600 font-medium">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Access Mode:</span>
                      <span className="text-emerald-600 font-bold">Direct Access</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Database Role:</span>
                      <span className={`font-bold uppercase ${currentUser.role === 'EDITOR' ? 'text-emerald-600' : 'text-blue-600'}`}>
                        {currentUser.role}
                      </span>
                    </div>
                  </div>

                  {/* Sandbox role switcher */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-150 space-y-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Role Switcher</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => {
                          setPersona('USER');
                          setShowProfileMenu(false);
                        }}
                        className={`py-1.5 rounded-lg text-[9px] font-bold transition-all border ${role === 'USER' ? 'bg-blue-500/10 border-blue-500 text-blue-600' : 'bg-white border-slate-200 text-slate-600'}`}
                      >
                        Reader
                      </button>
                      <button
                        onClick={() => {
                          setPersona('ADMIN');
                          setShowProfileMenu(false);
                        }}
                        className={`py-1.5 rounded-lg text-[9px] font-bold transition-all border ${role === 'ADMIN' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600' : 'bg-white border-slate-200 text-slate-600'}`}
                      >
                        Editor
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Main Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <aside 
            className={`fixed md:relative top-16 md:top-auto bottom-0 md:bottom-auto bg-[#faf5e8] md:bg-[#faf5e8]/80 border-r border-slate-200 w-64 shrink-0 transition-all duration-300 flex flex-col z-30 ${
              isSidebarOpen 
                ? 'translate-x-0 md:ml-0' 
                : '-translate-x-full md:-ml-64 md:translate-x-0'
            }`}
          >
            {/* User Profile display in sidebar */}
            <div className="p-4 border-b border-slate-200 bg-[#f5f0e0]/40">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${currentUser.role === 'EDITOR' ? 'from-emerald-500 to-teal-500' : 'from-blue-500 to-cyan-500'} flex items-center justify-center font-bold text-white text-xs shadow-md`}>
                  {getUserInitials(currentUser.name)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 leading-tight">{currentUser.name}</h4>
                  <p className="text-[9px] text-pink-500 tracking-wider uppercase font-semibold mt-0.5">{role === 'ADMIN' ? 'Editor' : 'Reader'}</p>
                </div>
              </div>
            </div>

            {/* Sidebar Navigation */}
            <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
              {navStructure.map((sectionOrLink) => {
                if (sectionOrLink.type === 'link') {
                  const item = sectionOrLink;
                  const isAllowed = item.roles?.includes(role) ?? false;
                  const isActive = pathname === item.href;
                  
                  if (!isAllowed) return null;
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href || '#'}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        isActive 
                          ? 'bg-slate-900/5 text-slate-900 border-l-2 border-slate-900' 
                          : 'text-slate-550 hover:text-slate-800 hover:bg-slate-900/5'
                      }`}
                    >
                      <item.icon size={16} className={isActive ? 'text-slate-900' : 'text-slate-400'} />
                      <span>{item.name}</span>
                    </Link>
                  );
                } else {
                  const section = sectionOrLink;
                  const allowedItems = (section.items || []).filter(item => item.roles.includes(role));
                  
                  if (allowedItems.length === 0) return null;
                  
                  return (
                    <div key={section.title} className="space-y-1">
                      <div className="px-3 pt-2 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        {section.title}
                      </div>
                      {allowedItems.map((item) => {
                        const isActive = pathname === item.href;
                        
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                              isActive 
                                ? 'bg-slate-900/5 text-slate-900 border-l-2 border-slate-900' 
                                : 'text-slate-550 hover:text-slate-800 hover:bg-slate-900/5'
                            }`}
                          >
                            <item.icon size={16} className={isActive ? 'text-slate-900' : 'text-slate-400'} />
                            <span>{item.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  );
                }
              })}
            </nav>
          </aside>

          {/* Page Content Container */}
          <main className={`flex-1 relative ${
            pathname === '/oracle' 
              ? 'p-0 m-0 overflow-hidden w-full h-full' 
              : 'overflow-y-auto p-4 sm:p-8'
          }`}>
            {pathname === '/oracle' ? (
              children
            ) : (
              <div className="max-w-6xl mx-auto space-y-8">
                {children}
              </div>
            )}
          </main>
        </div>

        {/* Global Floating AI Chat Button */}
        <button
          id="global-floating-chat-button"
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all z-40 cursor-pointer group animate-pulse"
          title="Open Oracle Ball Chat Console"
        >
          <Sparkles className="w-6 h-6 text-pink-400 group-hover:text-pink-300 animate-spin-slow" />
        </button>

        {/* Sliding AI Premium Chat Drawer Overlay */}
        {isChatOpen && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-xs z-50 flex justify-end animate-fadeIn">
            <div className="w-full max-w-md bg-[#fffaf0] h-full shadow-2xl flex flex-col relative animate-slideIn">
              
              {/* Chat Panel */}
              <div className="w-full flex flex-col h-full bg-[#fffaf0] relative">
                
                {/* Header */}
                <div className="p-4 border-b border-slate-200 bg-[#faf5e8]/90 backdrop-blur-sm flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-950 flex items-center justify-center font-bold text-white text-xs shadow-md">
                      Ω
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-[#0a0a0a] flex items-center gap-1.5">
                        <span>Oracle Forecast Console</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      </h3>
                      <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Temporal Agent Co-Pilot</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {saveSessionFlash ? (
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-250 px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 animate-fadeIn shrink-0 shadow-sm">
                        <Check size={10} /> Saved!
                      </span>
                    ) : (
                      <button
                        onClick={handleSaveSessionExplicitly}
                        className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-bold text-slate-700 flex items-center gap-1 cursor-pointer transition-colors shadow-sm shrink-0"
                        title="Explicitly save and rename this session"
                      >
                        <Check size={12} className="text-emerald-600 animate-pulse" />
                        <span>Save Session</span>
                      </button>
                    )}

                    <button
                      onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                      className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-bold text-slate-700 flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                      title="View Saved Chat Sessions"
                    >
                      <History size={12} />
                      <span>Chats ({sessions.length})</span>
                    </button>

                    <button
                      onClick={() => setIsChatOpen(false)}
                      className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* SLIDING SESSIONS OVERLAY */}
                {isHistoryOpen && (
                  <div className="absolute inset-x-0 top-[69px] bottom-0 bg-[#fffaf0] z-20 border-b border-slate-250 p-4 space-y-4 animate-fadeIn overflow-y-auto">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                      <span className="text-xs font-bold text-slate-800">Your Chat History</span>
                      <div className="flex items-center gap-2">
                        {sessions.length > 0 && (
                          <button
                            onClick={handleClearAllHistory}
                            className="px-2 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 text-[9px] rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                            title="Delete all chat history"
                          >
                            <Trash2 size={10} />
                            <span>Delete All</span>
                          </button>
                        )}
                        <button
                          onClick={handleNewSession}
                          className="px-2.5 py-1 bg-[#ff4d8b] text-white hover:bg-pink-600 text-[10px] rounded-lg font-bold flex items-center gap-1 cursor-pointer shadow-sm"
                        >
                          <PlusCircle size={10} />
                          <span>New Session</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {sessions.map((s) => (
                        <div 
                          key={s.id}
                          onClick={() => handleSelectSession(s)}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-4 cursor-pointer transition-colors ${
                            s.id === currentSessionId 
                              ? 'bg-slate-100 border-slate-300 font-bold' 
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <h4 className="text-xs text-slate-800 truncate max-w-[220px]">{s.title || 'Untitled Session'}</h4>
                            <span className="text-[9px] text-slate-400">{new Date(s.timestamp).toLocaleDateString()}</span>
                          </div>
                          <button
                            onClick={(e) => handleDeleteSession(s.id, e)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message Scroll Viewport */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[calc(100vh-170px)] custom-scrollbar">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col gap-1.5 ${
                        msg.role === 'user' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div 
                        onDoubleClick={() => {
                          setEditingMsgId(msg.id);
                          setEditingMsgText(msg.content);
                        }}
                        className={`p-4 rounded-2xl max-w-[85%] text-xs leading-relaxed border transition-all cursor-pointer shadow-sm select-text ${
                          msg.role === 'user'
                            ? 'bg-slate-950 border-slate-950 text-[#fffaf0] rounded-br-none hover:bg-slate-900'
                            : 'bg-white border-slate-200 text-[#0a0a0a] rounded-bl-none hover:bg-slate-50/80'
                        }`}
                        title="Double click to edit message text inline"
                      >
                        {editingMsgId === msg.id ? (
                          <div className="space-y-2 min-w-[280px]" onClick={(e) => e.stopPropagation()}>
                            <textarea
                              value={editingMsgText}
                              onChange={(e) => setEditingMsgText(e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-[#0a0a0a] focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-400 leading-relaxed font-sans"
                              rows={4}
                              autoFocus
                            />
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => setEditingMsgId(null)}
                                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-[10px] rounded-lg font-semibold cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveMessageEdit(msg.id, editingMsgText)}
                                className="px-3 py-1 bg-[#ff4d8b] text-white hover:bg-pink-600 text-[10px] rounded-lg font-bold cursor-pointer"
                              >
                                Save & Reparse
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="leading-relaxed">
                            {parseMarkdownText(msg.content, msg.role === 'user')}
                            
                            {/* In-chat trigger discovery CTA */}
                            {msg.role === 'assistant' && msg.offerDiscovery && msg.discoveryStream && (
                              <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-left" onClick={(e) => e.stopPropagation()}>
                                {msg.discoveryStatus === 'idle' && (
                                  <div className="space-y-1.5">
                                    <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                                      The discovery agent can search the web and automatically ingest new articles matching <strong>{msg.discoveryStream}</strong>.
                                    </p>
                                    <button
                                      onClick={() => handleTriggerDiscoveryFromChat(msg.id, msg.discoveryStream!)}
                                      className="px-3 py-1.5 bg-[#ff4d8b] hover:bg-pink-600 text-white font-bold text-[10px] uppercase rounded-lg transition-all active:scale-95 cursor-pointer shadow-xs inline-flex items-center gap-1"
                                    >
                                      <Sparkles size={10} />
                                      Trigger Agent Ingestion
                                    </button>
                                  </div>
                                )}

                                {msg.discoveryStatus === 'running' && (
                                  <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-150 rounded-xl">
                                    <div className="flex items-center gap-1.5 text-[#ff4d8b] font-bold text-[10px] uppercase tracking-wider">
                                      <Loader2 size={10} className="animate-spin" />
                                      <span>Scanner Ingesting...</span>
                                    </div>
                                    <div className="text-[9px] font-mono text-slate-500 leading-normal max-h-24 overflow-y-auto space-y-0.5 scrollbar-thin">
                                      {(msg.discoveryLogs || []).map((log, idx) => (
                                        <div key={idx}>{log}</div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {msg.discoveryStatus === 'completed' && (
                                  <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[10px] uppercase tracking-wider">
                                    <Check size={12} className="stroke-[3]" />
                                    <span>Ingestion Completed! Reloading...</span>
                                  </div>
                                )}

                                {msg.discoveryStatus === 'failed' && (
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-rose-600 font-bold text-[10px] uppercase tracking-wider">
                                      <X size={12} className="stroke-[3]" />
                                      <span>Ingestion failed.</span>
                                    </div>
                                    <div className="text-[9px] font-mono text-rose-500 leading-normal max-h-20 overflow-y-auto scrollbar-thin">
                                      {(msg.discoveryLogs || []).slice(-2).map((log, idx) => (
                                        <div key={idx}>{log}</div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {msg.id === 'welcome' && (
                        <div className="mt-3 flex flex-col gap-2 w-full max-w-[85%]">
                          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Suggested Queries</div>
                          <div className="flex flex-col gap-2">
                            {[
                              "What is the short-term and long-term outlook for Agentic Architectures?",
                              "Explain what model-on-chip advancements mean for professional services consultants.",
                              "What are the latest predictions for open source vs closed source frontier models?"
                            ].map((q) => (
                              <button
                                key={q}
                                onClick={() => handleSendSampleQuestion(q)}
                                disabled={isSendingChat}
                                className="w-full text-left p-3 rounded-xl border border-slate-200 bg-white hover:bg-pink-50 hover:border-pink-300 hover:text-pink-700 text-xs text-slate-800 font-semibold transition-all duration-200 cursor-pointer shadow-sm active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
                              >
                                ✨ {q}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* citation tags */}
                      {msg.sources && (msg.sources.projects?.length > 0 || msg.sources.experts?.length > 0) && (
                        <div className="pl-1.5 space-y-1 flex flex-col items-start">
                          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Semantic Anchors:</span>
                          <div className="flex flex-wrap gap-1">
                            {msg.sources.projects?.map((p: any) => (
                              <span key={p.id} className="text-[8px] text-pink-600 bg-pink-50 border border-pink-100 px-2 py-0.5 rounded font-medium">
                                📂 {p.title.substring(0, 15)}...
                              </span>
                            ))}
                            {msg.sources.experts?.map((e: any) => (
                              <span key={e.id} className="text-[8px] text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded font-medium">
                                👤 {e.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {isSendingChat && (
                    <div className="flex items-center gap-2 text-slate-400 text-xs pl-2">
                      <Loader2 size={12} className="animate-spin text-pink-500" />
                      <span>{loadingMessage}</span>
                    </div>
                  )}
                </div>

                {/* Input panel */}
                <div className="p-4 border-t border-slate-200 bg-[#faf5e8]/90">
                  <form onSubmit={handleSendChatMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      disabled={isSendingChat}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask the Oracle Ball Advisor anything..."
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-[#0a0a0a] placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors shadow-inner"
                    />
                    <button
                      type="submit"
                      disabled={isSendingChat || !chatInput.trim()}
                      className="w-10 h-10 shrink-0 bg-slate-950 hover:bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl active:scale-95 transition-all flex items-center justify-center shadow-md cursor-pointer"
                    >
                      <Send size={14} />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </PersonaContext.Provider>
  );
}
