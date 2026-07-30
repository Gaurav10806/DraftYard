import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Send,
  Paperclip,
  Mic,
  MicOff,
  Copy,
  Check,
  Pencil,
  Pin,
  MessageSquare,
  Plus,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Wand2,
  Layers,
  Map as MapIcon,
  FileText,
  Network,
  Users,
  Search as SearchIcon,
  ExternalLink,
  Bot,
  Trash2,
  ChevronDown,
  Download,
  Loader2,
  RefreshCw,
  AlertCircle,
  BarChart2,
  CheckCircle2,
  X,
} from "lucide-react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { TopBar } from "@/components/dashboard/top-bar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  fetchFeed,
  fetchMyDrafts,
  sendAiChatMessage,
  fetchAiIdeaAnalysis,
  type Draft,
  type AiChatMessage,
} from "@/lib/api";
import { drafts as staticDrafts } from "@/data/drafts";

export const Route = createFileRoute("/ai-assistant")({
  head: () => ({
    meta: [
      { title: "AI Assistant · DraftYard" },
      {
        name: "description",
        content:
          "Context-aware AI teammate powered by Gemini that understands your DraftYard project, tech stack, and stage.",
      },
      { property: "og:title", content: "DraftYard AI Assistant" },
    ],
  }),
  component: AiAssistantPage,
});

// ---------------- Data Models & Types ----------------

export type ChatMessageItem = {
  id: string;
  role: "user" | "ai";
  time: string;
  content: string;
  analysisData?: any; // Structured output from idea-analysis
  followUps?: string[];
};

export type ChatSession = {
  id: string;
  title: string;
  draftId?: string;
  createdAt: string;
  pinned: boolean;
  messages: ChatMessageItem[];
};

const QUICK_ACTIONS = [
  {
    id: "analyze",
    icon: Sparkles,
    tint: "text-amber-400 bg-amber-500/10",
    title: "Analyze My Project",
    sub: "Deep AI viability & risk analysis",
    prompt: "Perform a detailed viability and risk analysis of my project. Evaluate market competition, feasibility, complexity, and give recommendations.",
  },
  {
    id: "next_step",
    icon: Wand2,
    tint: "text-emerald-400 bg-emerald-500/10",
    title: "Suggest Next Step",
    sub: "What should you build next?",
    prompt: "Based on my current stage and tech stack, what are the top 3 high-impact features or tasks I should focus on right now?",
  },
  {
    id: "review_stack",
    icon: Layers,
    tint: "text-sky-400 bg-sky-500/10",
    title: "Review Tech Stack",
    sub: "Evaluate tech choices & risks",
    prompt: "Review my current tech stack choice. What are the pros, potential bottlenecks, and alternatives I should consider?",
  },
  {
    id: "roadmap",
    icon: MapIcon,
    tint: "text-primary bg-primary/10",
    title: "Generate Roadmap",
    sub: "Step-by-step milestone plan",
    prompt: "Create a 6-week step-by-step execution roadmap for my project, from initial setup to MVP release.",
  },
  {
    id: "readme",
    icon: FileText,
    tint: "text-yellow-400 bg-yellow-500/10",
    title: "Generate README",
    sub: "Professional README.md draft",
    prompt: "Generate a comprehensive, professional GitHub README.md for my project including overview, feature highlights, tech stack, and setup guide.",
  },
  {
    id: "architecture",
    icon: Network,
    tint: "text-fuchsia-400 bg-fuchsia-500/10",
    title: "Explain Architecture",
    sub: "Folder & system structure",
    prompt: "Explain the recommended system architecture, database schema, and folder hierarchy for my project.",
  },
  {
    id: "collaborators",
    icon: Users,
    tint: "text-cyan-400 bg-cyan-500/10",
    title: "Find Collaborators",
    sub: "Skills needed & pitch advice",
    prompt: "What contributor roles or skills does my project need right now, and how should I pitch my project to get developers excited?",
  },
  {
    id: "similar_projects",
    icon: SearchIcon,
    tint: "text-teal-400 bg-teal-500/10",
    title: "Similar Projects",
    sub: "Learn from stalled projects",
    prompt: "What are common pitfalls or reasons why projects in my domain or tech stack stall, and how can I avoid them?",
  },
];

const SUGGESTED_PROMPTS = [
  "What should I build next in my project?",
  "How can I improve my project's revival score?",
  "Write an API authentication handler for my stack",
  "How do I structure my database models?",
  "Help me pitch this project to potential contributors",
];

const LOCAL_STORAGE_KEY = "draftyard_ai_chats_v2";

function createDefaultInitialSession(): ChatSession {
  return {
    id: "init-session",
    title: "New AI Conversation",
    createdAt: "Just now",
    pinned: false,
    messages: [
      {
        id: "m-init-default",
        role: "ai",
        time: "Just now",
        content: "Hi! I'm your DraftYard AI assistant. I'm connected to your project context and ready to help with code, architecture, roadmap, or strategy. What are we building today?",
        followUps: [
          "Analyze My Project",
          "Suggest Next Step",
          "Review Tech Stack",
        ],
      },
    ],
  };
}

// ---------------- Page Component ----------------

function AiAssistantPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);

  // Chat sessions state
  const [sessions, setSessions] = useState<ChatSession[]>(() => [createDefaultInitialSession()]);
  const [activeSessionId, setActiveSessionId] = useState<string>("init-session");

  // Load user drafts from API
  useEffect(() => {
    async function loadData() {
      try {
        setLoadingDrafts(true);
        let myData: Draft[] = [];
        try {
          myData = await fetchMyDrafts();
        } catch {
          // fallback to feed
        }
        if (!myData || myData.length === 0) {
          const feedRes = await fetchFeed({ limit: 10 });
          myData = feedRes.data;
        }

        // Fallback to static drafts if API yields nothing
        if (!myData || myData.length === 0) {
          myData = staticDrafts as Draft[];
        }

        setDrafts(myData);
        if (myData.length > 0) {
          setSelectedDraft(myData[0]);
        }
      } catch (err) {
        console.error("Failed to load drafts for AI Assistant:", err);
      } finally {
        setLoadingDrafts(false);
      }
    }
    loadData();
  }, []);

  // Load saved sessions from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed: ChatSession[] = JSON.parse(saved);
        if (parsed.length > 0) {
          setSessions(parsed);
          setActiveSessionId(parsed[0].id);
          return;
        }
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Save sessions to localStorage
  useEffect(() => {
    if (sessions.length > 0) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sessions));
      } catch (e) {
        console.error("Failed to save AI sessions:", e);
      }
    }
  }, [sessions]);

  function createNewSession() {
    const newId = `session-${Date.now()}`;
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const initialSession: ChatSession = {
      id: newId,
      title: "New AI Conversation",
      createdAt: "Just now",
      pinned: false,
      messages: [
        {
          id: `m-init-${Date.now()}`,
          role: "ai",
          time: timeStr,
          content: `Hi! I'm your DraftYard AI assistant. I'm connected to your project context and ready to help with code, architecture, roadmap, or strategy. What are we building today?`,
          followUps: [
            "Analyze My Project",
            "Suggest Next Step",
            "Review Tech Stack",
          ],
        },
      ],
    };
    setSessions((prev) => [initialSession, ...prev]);
    setActiveSessionId(newId);
  }

  function deleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (next.length === 0) {
        setTimeout(createNewSession, 0);
      } else if (activeSessionId === id) {
        setActiveSessionId(next[0].id);
      }
      return next;
    });
    toast.success("Chat deleted");
  }

  function togglePinSession(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, pinned: !s.pinned } : s))
    );
  }

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AppSidebar />
        <SidebarInset className="flex min-w-0 flex-1 flex-col">
          <TopBar showGreeting={false} />

          {/* Subheader */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <Link
                to="/dashboard"
                className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition hover:text-foreground"
                aria-label="Back"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <h1 className="font-display text-lg font-semibold tracking-tight">AI Assistant</h1>
                <p className="text-xs text-muted-foreground">
                  Powered by Gemini · Real context from your projects
                </p>
              </div>
            </div>

            {/* Project Selector Dropdown */}
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-muted-foreground sm:inline">Active Context:</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-2 rounded-xl border-border bg-card px-3 text-xs font-semibold">
                    <Layers className="h-3.5 w-3.5 text-primary" />
                    <span className="max-w-[150px] truncate sm:max-w-[200px]">
                      {selectedDraft ? selectedDraft.projectName : "General Context"}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 rounded-xl">
                  <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Select Project Context
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {loadingDrafts ? (
                    <div className="p-3 text-center text-xs text-muted-foreground">
                      <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                      Loading projects...
                    </div>
                  ) : (
                    drafts.map((d) => (
                      <DropdownMenuItem
                        key={d._id || (d as any).id || d.projectName}
                        onClick={() => setSelectedDraft(d)}
                        className="flex items-center justify-between py-2 cursor-pointer"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold">{d.projectName}</p>
                          <p className="truncate text-[10px] text-muted-foreground">{d.oneLiner || d.domain}</p>
                        </div>
                        {selectedDraft?.projectName === d.projectName && (
                          <Check className="h-3.5 w-3.5 text-primary" />
                        )}
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 p-4 sm:p-6 lg:grid-cols-[270px_minmax(0,1fr)_300px]">
            {/* Left Sidebar */}
            <ChatHistoryPanel
              sessions={sessions}
              activeSessionId={activeSessionId}
              onSelectSession={setActiveSessionId}
              onNewSession={createNewSession}
              onDeleteSession={deleteSession}
              onTogglePin={togglePinSession}
              selectedDraft={selectedDraft}
            />

            {/* Main Chat Center */}
            <ChatCenter
              session={activeSession}
              selectedDraft={selectedDraft}
              onUpdateSession={(updatedMessages, newTitle) => {
                setSessions((prev) =>
                  prev.map((s) =>
                    s.id === activeSession.id
                      ? {
                          ...s,
                          messages: updatedMessages,
                          title: newTitle || s.title,
                        }
                      : s
                  )
                );
              }}
            />

            {/* Right Quick Actions */}
            <QuickActionsPanel
              selectedDraft={selectedDraft}
              onTriggerAction={(prompt, isAnalysis) => {
                // Dispatch prompt to chat
                const event = new CustomEvent("ai-assistant-trigger", {
                  detail: { prompt, isAnalysis },
                });
                window.dispatchEvent(event);
              }}
            />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

// ---------------- Left Panel: Chat History ----------------

function ChatHistoryPanel({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onTogglePin,
  selectedDraft,
}: {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onTogglePin: (id: string, e: React.MouseEvent) => void;
  selectedDraft: Draft | null;
}) {
  const pinnedSessions = sessions.filter((s) => s.pinned);
  const recentSessions = sessions.filter((s) => !s.pinned);

  return (
    <aside className="flex min-h-0 flex-col rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-base font-semibold">Chats</h3>
        <Button
          onClick={onNewSession}
          size="sm"
          className="h-8 gap-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" /> New Chat
        </Button>
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1 scrollbar-none space-y-4">
        {pinnedSessions.length > 0 && (
          <div>
            <SectionLabel>Pinned Chats</SectionLabel>
            <div className="mt-2 space-y-1">
              {pinnedSessions.map((s) => (
                <ChatRow
                  key={s.id}
                  session={s}
                  active={s.id === activeSessionId}
                  onClick={() => onSelectSession(s.id)}
                  onDelete={(e) => onDeleteSession(s.id, e)}
                  onPin={(e) => onTogglePin(s.id, e)}
                />
              ))}
            </div>
          </div>
        )}

        <div>
          <SectionLabel>Recent Chats</SectionLabel>
          <div className="mt-2 space-y-1">
            {recentSessions.length === 0 ? (
              <p className="py-2 text-center text-xs text-muted-foreground">No recent chats</p>
            ) : (
              recentSessions.map((s) => (
                <ChatRow
                  key={s.id}
                  session={s}
                  active={s.id === activeSessionId}
                  onClick={() => onSelectSession(s.id)}
                  onDelete={(e) => onDeleteSession(s.id, e)}
                  onPin={(e) => onTogglePin(s.id, e)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Active Project Card */}
      {selectedDraft && <CurrentProjectCard draft={selectedDraft} />}
    </aside>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  );
}

function ChatRow({
  session,
  active,
  onClick,
  onDelete,
  onPin,
}: {
  session: ChatSession;
  active: boolean;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onPin: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`group relative flex w-full cursor-pointer items-center justify-between rounded-xl border px-3 py-2 text-left transition-all ${
        active
          ? "border-primary/40 bg-primary/10 text-foreground font-semibold"
          : "border-transparent text-foreground/80 hover:border-border hover:bg-muted/40"
      }`}
    >
      <div className="flex min-w-0 items-center gap-2 flex-1 pr-2">
        <MessageSquare className={`h-3.5 w-3.5 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />
        <p className="truncate text-xs">{session.title || "Untitled Chat"}</p>
      </div>

      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={onPin}
          title={session.pinned ? "Unpin" : "Pin"}
          className="p-1 text-muted-foreground hover:text-primary transition"
        >
          <Pin className={`h-3 w-3 ${session.pinned ? "fill-primary text-primary" : ""}`} />
        </button>
        <button
          onClick={onDelete}
          title="Delete Chat"
          className="p-1 text-muted-foreground hover:text-destructive transition"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function CurrentProjectCard({ draft }: { draft: Draft }) {
  const score = draft.revivalScore || 70;
  const techList = draft.techStack || ["React", "Node.js"];

  return (
    <div className="mt-4 rounded-2xl border border-border/70 bg-muted/30 p-3.5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Active Context
        </p>
        <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30">
          Connected
        </Badge>
      </div>

      <div className="mt-2.5 flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary">
          <Layers className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold">{draft.projectName}</p>
          <p className="truncate text-[11px] text-muted-foreground">{draft.currentStage || "In Development"}</p>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">Revival Score</span>
          <span className="font-bold text-primary">{score}%</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${score}%` }} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1">
        {techList.slice(0, 3).map((t) => (
          <Badge key={t} variant="secondary" className="rounded-md px-1.5 py-0.5 text-[10px]">
            {t}
          </Badge>
        ))}
        {techList.length > 3 && (
          <span className="text-[10px] text-muted-foreground">+{techList.length - 3}</span>
        )}
      </div>

      <Button asChild size="sm" variant="outline" className="mt-3 w-full justify-between rounded-lg h-8 text-xs">
        <Link
          to="/project/$slug"
          params={{ slug: draft._id || (draft as any).id || draft.projectName.toLowerCase() }}
        >
          View Project <ArrowRight className="h-3 w-3" />
        </Link>
      </Button>
    </div>
  );
}

// ---------------- Center Panel: AI Chat ----------------

function ChatCenter({
  session,
  selectedDraft,
  onUpdateSession,
}: {
  session?: ChatSession;
  selectedDraft: Draft | null;
  onUpdateSession: (messages: ChatMessageItem[], newTitle?: string) => void;
}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [attachedContext, setAttachedContext] = useState<string>("");
  const [showAttachDialog, setShowAttachDialog] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [session?.messages, loading]);

  // Listen for custom trigger events from Quick Actions
  useEffect(() => {
    const handleTrigger = (e: any) => {
      const { prompt, isAnalysis } = e.detail;
      if (prompt) {
        handleSend(prompt, isAnalysis);
      }
    };
    window.addEventListener("ai-assistant-trigger", handleTrigger);
    return () => window.removeEventListener("ai-assistant-trigger", handleTrigger);
  }, [session, selectedDraft]);

  async function handleSend(textToSend?: string, forceAnalysis?: boolean) {
    const queryText = (textToSend || input).trim();
    if (!queryText || loading) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg: ChatMessageItem = {
      id: `u-${Date.now()}`,
      role: "user",
      time: timeStr,
      content: queryText,
    };

    const currentMessages = session?.messages || [];
    const updatedMessages = [...currentMessages, userMsg];
    
    // Auto title if first user prompt
    let newTitle = session?.title || "New AI Conversation";
    if (currentMessages.length <= 1 && userMsg.content) {
      newTitle = userMsg.content.slice(0, 30) + (userMsg.content.length > 30 ? "..." : "");
    }

    onUpdateSession(updatedMessages, newTitle);
    if (!textToSend) setInput("");
    setLoading(true);

    // Build project context string
    const projContext = selectedDraft
      ? `Project Name: ${selectedDraft.projectName}
Pitch: ${selectedDraft.oneLiner}
Domain: ${selectedDraft.domain || "Web"}
Tech Stack: ${selectedDraft.techStack ? selectedDraft.techStack.join(", ") : "Not specified"}
Current Stage: ${selectedDraft.currentStage || "In Development"}
Team Size: ${selectedDraft.teamSize || "Solo"}
Failure Reason / Challenge: ${selectedDraft.failureReason || "None"}
Time Spent: ${selectedDraft.timeSpent ? `${selectedDraft.timeSpent.value} ${selectedDraft.timeSpent.unit}` : "N/A"}
${attachedContext ? `Additional User Attachment: ${attachedContext}` : ""}`
      : `General Developer Context. ${attachedContext ? `Attachment: ${attachedContext}` : ""}`;

    try {
      if (forceAnalysis && selectedDraft) {
        // Call structured idea analysis
        const analysis = await fetchAiIdeaAnalysis(
          selectedDraft.projectName,
          selectedDraft.oneLiner,
          projContext
        );

        const aiMsg: ChatMessageItem = {
          id: `a-${Date.now()}`,
          role: "ai",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          content: analysis.summary || "Here is the structured viability and risk analysis of your project.",
          analysisData: analysis,
          followUps: [
            "How to improve my score?",
            "Show me the recommended tech stack",
            "Generate a detailed 6-week roadmap",
          ],
        };
        onUpdateSession([...updatedMessages, aiMsg], newTitle);
      } else {
        // Call general AI chat endpoint
        const historyPayload: AiChatMessage[] = (session?.messages || []).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const responseText = await sendAiChatMessage({
  message: queryText,
  context: projContext,
  history: historyPayload,
});

        const aiMsg: ChatMessageItem = {
          id: `a-${Date.now()}`,
          role: "ai",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          content: responseText,
          followUps: [
            "Explain in more detail",
            "Give me code example",
            "What are common pitfalls?",
          ],
        };
        onUpdateSession([...updatedMessages, aiMsg], newTitle);
      }
    } catch (err: any) {
      console.error("AI Error:", err);
      toast.error(err.message || "Failed to reach AI service");
      const errorMsg: ChatMessageItem = {
        id: `err-${Date.now()}`,
        role: "ai",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        content: `Sorry, I ran into an issue processing your request (${err.message || "Network error"}). Please ensure the ML backend is running and GEMINI_API_KEY is set.`,
      };
      onUpdateSession([...updatedMessages, errorMsg], newTitle);
    } finally {
      setLoading(false);
      setAttachedContext("");
    }
  }

  // Voice recognition toggle
  function toggleVoice() {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      toast.error("Speech recognition is not supported in your browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      toast.info("Listening... Speak your prompt");
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast.error("Could not capture audio");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }

  function handleDownloadChat() {
    if (!session || session.messages.length === 0) return;
    const content = session.messages
      .map((m) => `### ${m.role === "user" ? "User" : "DraftYard AI"} (${m.time})\n${m.content}\n`)
      .join("\n---\n\n");
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `draftyard-chat-${session.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Chat downloaded as markdown!");
  }

  return (
    <section className="flex min-h-0 flex-col rounded-2xl border border-border/70 bg-card shadow-sm overflow-hidden">
      {/* Top Banner Context Header */}
      <ContextBanner selectedDraft={selectedDraft} onDownloadChat={handleDownloadChat} />

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-6 scrollbar-none">
        {(session?.messages || []).map((m) => (
          <MessageBubble key={m.id} msg={m} onFollowUp={(f) => handleSend(f)} />
        ))}

        {loading && (
          <div className="flex items-center gap-3 text-muted-foreground animate-pulse">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-primary">
              <Bot className="h-4 w-4" />
            </span>
            <div className="flex items-center gap-2 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5 text-primary animate-spin" />
              DraftYard AI is thinking...
            </div>
          </div>
        )}
      </div>

      {/* Composer Input Bar */}
      <Composer
        value={input}
        onChange={setInput}
        onSend={() => handleSend()}
        loading={loading}
        isListening={isListening}
        onToggleVoice={toggleVoice}
        onOpenAttach={() => setShowAttachDialog(true)}
        attached={Boolean(attachedContext)}
      />

      {/* File Attachment Dialog */}
      <Dialog open={showAttachDialog} onOpenChange={setShowAttachDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Attach Context or Code</DialogTitle>
            <DialogDescription>
              Paste code snippets or text to provide extra context to the AI assistant.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-3">
            <Textarea
              placeholder="Paste code snippet, error log, or notes here..."
              rows={6}
              value={attachedContext}
              onChange={(e) => setAttachedContext(e.target.value)}
              className="font-mono text-xs"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setAttachedContext("")}>
                Clear
              </Button>
              <Button size="sm" onClick={() => setShowAttachDialog(false)}>
                Attach Context
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function ContextBanner({
  selectedDraft,
  onDownloadChat,
}: {
  selectedDraft: Draft | null;
  onDownloadChat: () => void;
}) {
  if (!selectedDraft) {
    return (
      <div className="border-b border-border/60 bg-muted/20 px-6 py-3 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">General AI Developer Assistant</p>
        <Button size="sm" variant="ghost" onClick={onDownloadChat} className="h-7 gap-1 text-xs">
          <Download className="h-3 w-3" /> Export Chat
        </Button>
      </div>
    );
  }

  const score = selectedDraft.revivalScore || 75;

  return (
    <div className="border-b border-border/60 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 py-3.5 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-card border border-primary/30 shadow-sm">
            <span className="text-xs font-bold text-primary">{score}%</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-base font-bold leading-tight">{selectedDraft.projectName}</h2>
              <Badge variant="secondary" className="text-[10px] font-semibold">
                {selectedDraft.currentStage || "Building"}
              </Badge>
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground max-w-md">
              {selectedDraft.oneLiner || "Developer draft in progress"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={onDownloadChat} className="h-8 gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
          <Button asChild size="sm" variant="outline" className="h-8 gap-1.5 text-xs rounded-xl">
            <Link
              to="/project/$slug"
              params={{ slug: selectedDraft._id || (selectedDraft as any).id || selectedDraft.projectName.toLowerCase() }}
            >
              Open Project <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg, onFollowUp }: { msg: ChatMessageItem; onFollowUp: (t: string) => void }) {
  const isUser = msg.role === "user";

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <span
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${
            isUser ? "bg-muted text-foreground" : "bg-primary/15 text-primary"
          }`}
        >
          {isUser ? "You" : <Bot className="h-4 w-4" />}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-bold">{isUser ? "You" : "DraftYard AI"}</span>
            <span className="text-[10px] text-muted-foreground">{msg.time}</span>
          </div>

          <div className="mt-1.5 text-sm leading-relaxed text-foreground/90 space-y-2">
            <FormattedContent content={msg.content} />
          </div>

          {/* Render Structured Idea Analysis Card if available */}
          {msg.analysisData && <AnalysisCard data={msg.analysisData} />}
        </div>
      </div>

      {msg.followUps && msg.followUps.length > 0 && (
        <div className="ml-11 flex flex-wrap gap-2 pt-1">
          {msg.followUps.map((f) => (
            <button
              key={f}
              onClick={() => onFollowUp(f)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground/80 transition hover:border-primary/50 hover:bg-primary/5 hover:text-foreground"
            >
              <Sparkles className="h-3 w-3 text-primary" /> {f}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Visual Card for Structured AI Analysis
function AnalysisCard({ data }: { data: any }) {
  if (!data) return null;

  return (
    <div className="mt-3 rounded-2xl border border-primary/30 bg-card p-4 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Badge className="bg-primary text-primary-foreground font-bold">
            Score: {data.score}/100
          </Badge>
          <Badge variant="outline" className="font-semibold text-emerald-500 border-emerald-500/40">
            Verdict: {data.verdict}
          </Badge>
        </div>
        <span className="text-xs font-medium text-muted-foreground">AI Viability Audit</span>
      </div>

      {data.summary && <p className="text-xs text-foreground/90 italic">{data.summary}</p>}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs">
        {data.feasibility && (
          <div className="rounded-xl border border-border/60 bg-muted/30 p-2.5">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Feasibility</span>
            <p className="font-bold text-foreground">{data.feasibility.label}</p>
            <p className="text-[10px] text-muted-foreground truncate">{data.feasibility.note}</p>
          </div>
        )}
        {data.competition && (
          <div className="rounded-xl border border-border/60 bg-muted/30 p-2.5">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Competition</span>
            <p className="font-bold text-foreground">{data.competition.label}</p>
            <p className="text-[10px] text-muted-foreground truncate">{data.competition.note}</p>
          </div>
        )}
        {data.complexity && (
          <div className="rounded-xl border border-border/60 bg-muted/30 p-2.5">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Complexity</span>
            <p className="font-bold text-foreground">{data.complexity.label}</p>
            <p className="text-[10px] text-muted-foreground truncate">{data.complexity.note}</p>
          </div>
        )}
        {data.scalability && (
          <div className="rounded-xl border border-border/60 bg-muted/30 p-2.5">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Scalability</span>
            <p className="font-bold text-foreground">{data.scalability.label}</p>
            <p className="text-[10px] text-muted-foreground truncate">{data.scalability.note}</p>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {data.recommendations && data.recommendations.length > 0 && (
        <div>
          <p className="text-xs font-bold text-foreground mb-1">Key Actionable Recommendations:</p>
          <ul className="space-y-1 text-xs">
            {data.recommendations.map((rec: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2 text-foreground/80">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Roadmap milestones */}
      {data.roadmap && data.roadmap.length > 0 && (
        <div className="pt-2 border-t border-border/60">
          <p className="text-xs font-bold text-foreground mb-2">Suggested Execution Roadmap:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {data.roadmap.map((m: any, i: number) => (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-muted/40 px-2.5 py-1.5">
                <span className="font-bold text-primary shrink-0">{m.week}:</span>
                <span className="truncate text-foreground/80">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Markdown parser & renderer
function FormattedContent({ content }: { content: string }) {
  if (!content) return null;

  // Split content by codeblocks ``` lang \n code ```
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: content.slice(lastIndex, match.index) });
    }
    parts.push({ type: "code", lang: match[1] || "code", value: match[2] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: "text", value: content.slice(lastIndex) });
  }

  return (
    <>
      {parts.map((p, idx) => {
        if (p.type === "code") {
          return <CodeBlock key={idx} code={p.value} lang={p.lang || "code"} />;
        }

        // Process bold and paragraph breaks
        const paragraphs = p.value.split("\n\n");
        return (
          <div key={idx} className="space-y-2">
            {paragraphs.map((para, pIdx) => {
              const lines = para.split("\n");
              return (
                <div key={pIdx}>
                  {lines.map((line, lIdx) => {
                    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
                      return (
                        <li key={lIdx} className="ml-4 list-disc text-foreground/90">
                          {renderInlineMarkdown(line.replace(/^[-*]\s+/, ""))}
                        </li>
                      );
                    }
                    if (/^\d+\.\s+/.test(line.trim())) {
                      return (
                        <li key={lIdx} className="ml-4 list-decimal text-foreground/90">
                          {renderInlineMarkdown(line.replace(/^\d+\.\s+/, ""))}
                        </li>
                      );
                    }
                    return (
                      <p key={lIdx} className="leading-relaxed">
                        {renderInlineMarkdown(line)}
                      </p>
                    );
                  })}
                </div>
              );
            })}
          </div>
        );
      })}
    </>
  );
}

function renderInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12px] text-primary">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-border/70 bg-muted/60">
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/80 px-3 py-1.5">
        <span className="text-[11px] font-mono font-medium text-muted-foreground">{lang}</span>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition hover:bg-background hover:text-foreground"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3.5 font-mono text-[12px] leading-relaxed text-foreground/90">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Composer({
  value,
  onChange,
  onSend,
  loading,
  isListening,
  onToggleVoice,
  onOpenAttach,
  attached,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  loading: boolean;
  isListening: boolean;
  onToggleVoice: () => void;
  onOpenAttach: () => void;
  attached: boolean;
}) {
  return (
    <div className="p-4 sm:px-6 border-t border-border/60 bg-card">
      <div className="relative flex items-end gap-2 rounded-2xl border border-border bg-background p-2 shadow-sm focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20">
        <button
          onClick={onOpenAttach}
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg transition ${
            attached
              ? "bg-primary/20 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
          title={attached ? "Attachment added" : "Attach code or context"}
        >
          <Paperclip className="h-4 w-4" />
        </button>

        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder="Ask anything about your project, code, or architecture..."
          rows={1}
          className="min-h-[40px] flex-1 resize-none border-0 bg-transparent px-1 py-2 text-sm shadow-none focus-visible:ring-0"
        />

        <button
          onClick={onToggleVoice}
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg transition ${
            isListening
              ? "bg-destructive text-destructive-foreground animate-pulse"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
          title="Dictate with voice"
        >
          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>

        <Button
          onClick={onSend}
          disabled={loading || !value.trim()}
          size="icon"
          className="h-9 w-9 shrink-0 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

// ---------------- Right Panel: Quick Actions & Prompts ----------------

function QuickActionsPanel({
  selectedDraft,
  onTriggerAction,
}: {
  selectedDraft: Draft | null;
  onTriggerAction: (prompt: string, isAnalysis?: boolean) => void;
}) {
  return (
    <aside className="flex min-h-0 flex-col gap-4">
      {/* Quick Actions Card */}
      <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
        <div className="flex items-center gap-1.5 border-b border-border/60 pb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider">AI Quick Tools</h3>
        </div>

        <div className="mt-3 space-y-1.5">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.id}
              onClick={() => onTriggerAction(a.prompt, a.id === "analyze")}
              className="group flex w-full items-center gap-2.5 rounded-xl border border-transparent px-2.5 py-2 text-left transition hover:border-border hover:bg-muted/50"
            >
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${a.tint}`}>
                <a.icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">{a.title}</p>
                <p className="truncate text-[10px] text-muted-foreground">{a.sub}</p>
              </div>
              <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 transition group-hover:opacity-100 group-hover:translate-x-0.5" />
            </button>
          ))}
        </div>
      </div>

      {/* Suggested Prompts Card */}
      <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
        <div className="flex items-center gap-1.5 border-b border-border/60 pb-3">
          <Bot className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider">Suggested Questions</h3>
        </div>

        <div className="mt-3 space-y-1.5">
          {SUGGESTED_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => onTriggerAction(p)}
              className="w-full rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-left text-xs text-foreground/85 transition hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
