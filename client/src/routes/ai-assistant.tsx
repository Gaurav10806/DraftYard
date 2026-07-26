import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Send,
  Paperclip,
  Mic,
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
} from "lucide-react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { TopBar } from "@/components/dashboard/top-bar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/ai-assistant")({
  head: () => ({
    meta: [
      { title: "AI Assistant · DraftYard" },
      {
        name: "description",
        content:
          "Context-aware AI teammate that understands your DraftYard project, tech stack, and current stage.",
      },
      { property: "og:title", content: "DraftYard AI Assistant" },
      {
        property: "og:description",
        content: "Your AI teammate for every step of your project.",
      },
    ],
  }),
  component: AiAssistantPage,
});

// ---------------- Types & seed data ----------------

type ChatMsg = {
  id: string;
  role: "user" | "ai";
  time: string;
  content: React.ReactNode;
  followUps?: string[];
};

const PINNED = [{ id: "p1", title: "StudyBuddy Architecture", when: "2 days ago" }];

const RECENT = [
  { id: "r1", title: "Authentication Flow", when: "1 hour ago" },
  { id: "r2", title: "MongoDB Connection Error", when: "Yesterday" },
  { id: "r3", title: "README Generation", when: "2 days ago" },
  { id: "r4", title: "API Documentation", when: "3 days ago" },
  { id: "r5", title: "Project Roadmap Help", when: "3 days ago" },
  { id: "r6", title: "Deployment on Vercel", when: "5 days ago" },
  { id: "r7", title: "Socket.io Integration", when: "1 week ago" },
];

const QUICK_ACTIONS = [
  { icon: Sparkles, tint: "text-amber-400 bg-amber-500/10", title: "Analyze My Project", sub: "Get AI insights about your draft" },
  { icon: Wand2, tint: "text-emerald-400 bg-emerald-500/10", title: "Suggest Next Step", sub: "What should you build next?" },
  { icon: Layers, tint: "text-sky-400 bg-sky-500/10", title: "Review My Tech Stack", sub: "Is your stack the right choice?" },
  { icon: MapIcon, tint: "text-primary bg-primary/10", title: "Generate Roadmap", sub: "Get a step-by-step roadmap" },
  { icon: FileText, tint: "text-yellow-400 bg-yellow-500/10", title: "Generate README", sub: "Create a professional README" },
  { icon: Network, tint: "text-fuchsia-400 bg-fuchsia-500/10", title: "Explain Architecture", sub: "Get architecture explanation" },
  { icon: Users, tint: "text-cyan-400 bg-cyan-500/10", title: "Find Collaborators", sub: "Developers who can help" },
  { icon: SearchIcon, tint: "text-teal-400 bg-teal-500/10", title: "Find Similar Stalled Projects", sub: "Learn from others' experiences" },
];

const SUGGESTED_PROMPTS = [
  "What should I build next in my draft?",
  "Why do projects like mine usually stall?",
  "How can I increase my revival score?",
  "Review my tech stack choices",
  "Help me debug my backend issue",
];

const INITIAL_MESSAGES: ChatMsg[] = [
  {
    id: "m1",
    role: "user",
    time: "10:30 AM",
    content: "How should I structure authentication in my project?",
  },
  {
    id: "m2",
    role: "ai",
    time: "10:30 AM",
    content: (
      <>
        <p>
          Based on your <b>StudyBuddy</b> project (React + Node.js + MongoDB), here's the
          recommended authentication structure:
        </p>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm">
          <li>Use <b>JWT (JSON Web Tokens)</b> for stateless authentication</li>
          <li>Store refresh tokens in <b>httpOnly cookies</b></li>
          <li><b>Bcrypt</b> for password hashing</li>
          <li>Protect routes using middleware</li>
        </ol>
        <p className="mt-3">Here's a basic folder structure:</p>
        <CodeBlock
          code={`backend
├── controllers
├── models
├── routes
├── middleware
├── utils
└── config`}
        />
      </>
    ),
    followUps: ["Show me JWT setup", "How to protect routes?", "Add email verification"],
  },
];

// ---------------- Page ----------------

function AiAssistantPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AppSidebar />
        <SidebarInset className="flex min-w-0 flex-1 flex-col">
          <TopBar showGreeting={false} />
          <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3 sm:px-6">
            <Link
              to="/dashboard"
              className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition hover:text-foreground"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="font-display text-lg font-semibold tracking-tight">AI Assistant</h1>
            <span className="text-sm text-muted-foreground">
              Your AI teammate for every step of your project
            </span>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 p-4 sm:p-6 lg:grid-cols-[260px_minmax(0,1fr)_300px]">
            <ChatHistoryPanel />
            <ChatCenter />
            <QuickActionsPanel />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

// ---------------- Left: Chat History ----------------

function ChatHistoryPanel() {
  return (
    <aside className="flex min-h-0 flex-col rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold">New Chat</h3>
        <button
          className="grid h-7 w-7 place-items-center rounded-md border border-border text-muted-foreground transition hover:text-foreground"
          aria-label="New chat"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1 scrollbar-none">
        <SectionLabel>Pinned Chats</SectionLabel>
        <div className="mt-2 space-y-1">
          {PINNED.map((c) => (
            <ChatRow key={c.id} title={c.title} when={c.when} active pinned />
          ))}
        </div>

        <SectionLabel className="mt-5">Recent Chats</SectionLabel>
        <div className="mt-2 space-y-1">
          {RECENT.map((c) => (
            <ChatRow key={c.id} title={c.title} when={c.when} />
          ))}
        </div>

        <Link
          to="/ai-assistant"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          View all chats <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <CurrentProjectCard />
    </aside>
  );
}

function SectionLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80 ${className}`}>
      {children}
    </p>
  );
}

function ChatRow({
  title,
  when,
  active,
  pinned,
}: {
  title: string;
  when: string;
  active?: boolean;
  pinned?: boolean;
}) {
  return (
    <button
      className={`group flex w-full items-start gap-2.5 rounded-xl border px-2.5 py-2 text-left transition-all ${
        active
          ? "border-primary/40 bg-primary/5"
          : "border-transparent hover:border-border hover:bg-muted/40"
      }`}
    >
      <MessageSquare className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium">{title}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{when}</p>
      </div>
      {pinned && <Pin className="h-3 w-3 shrink-0 text-primary" />}
    </button>
  );
}

function CurrentProjectCard() {
  return (
    <div className="mt-4 rounded-2xl border border-border/70 bg-background/60 p-3.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Current Project
      </p>
      <div className="mt-2 flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
          <Layers className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">StudyBuddy</p>
          <p className="flex items-center gap-1 text-[11px] text-emerald-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Connected
          </p>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-medium">62% Complete</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: "62%" }} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {["React", "Node.js", "MongoDB"].map((t) => (
          <Badge key={t} variant="secondary" className="rounded-md px-2 py-0.5 text-[10px]">
            {t}
          </Badge>
        ))}
      </div>

      <Button asChild size="sm" variant="outline" className="mt-3 w-full justify-between rounded-lg">
        <Link to="/workspace" search={{ draftId: undefined }}>
          Open Workspace <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </Button>
    </div>
  );
}

// ---------------- Center: Chat ----------------

function ChatCenter() {
  const [messages, setMessages] = useState<ChatMsg[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg: ChatMsg = { id: `u-${Date.now()}`, role: "user", time, content: trimmed };
    const aiMsg: ChatMsg = {
      id: `a-${Date.now() + 1}`,
      role: "ai",
      time,
      content: (
        <p>
          Great question — based on your <b>StudyBuddy</b> project context and current stage, here's a
          tailored suggestion. I'll keep answers grounded in your actual stack and progress rather
          than generic advice.
        </p>
      ),
      followUps: ["Show a concrete example", "Which files should I edit?", "What are common pitfalls?"],
    };
    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setInput("");
  }

  return (
    <section className="flex min-h-0 flex-col rounded-2xl border border-border/70 bg-card shadow-sm">
      <ContextBanner />

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6 scrollbar-none">
        {messages.map((m) => (
          <MessageBubble key={m.id} msg={m} onFollowUp={send} />
        ))}
      </div>

      <Composer
        value={input}
        onChange={setInput}
        onSend={() => send(input)}
      />

      <p className="border-t border-border/60 px-6 py-2.5 text-center text-[11px] text-muted-foreground">
        AI responses may include suggestions based on DraftYard data and general knowledge.
      </p>
    </section>
  );
}

function ContextBanner() {
  return (
    <div className="m-4 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 sm:m-6 sm:mb-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative grid h-14 w-14 place-items-center rounded-full">
            <svg viewBox="0 0 36 36" className="absolute inset-0 h-full w-full -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/40" />
              <circle
                cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3"
                strokeDasharray={`${62 * 0.974} 200`} strokeLinecap="round"
                className="text-primary"
              />
            </svg>
            <span className="text-xs font-bold text-primary">62%</span>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" /> Currently helping with
            </p>
            <h2 className="font-display text-xl font-semibold leading-tight">StudyBuddy</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              62% Complete · Last updated 2 hours ago
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Tech Stack
            </p>
            <div className="mt-1.5 flex items-center gap-1.5">
              {[
                { l: "R", c: "bg-sky-500/15 text-sky-500" },
                { l: "N", c: "bg-emerald-500/15 text-emerald-500" },
                { l: "M", c: "bg-green-600/15 text-green-600" },
              ].map((t, i) => (
                <span key={i} className={`grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold ${t.c}`}>
                  {t.l}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Stage</p>
            <Badge className="mt-1.5 rounded-md bg-primary/15 text-primary hover:bg-primary/15">Building</Badge>
          </div>
          <Button asChild size="sm" variant="outline" className="rounded-lg">
            <Link to="/project/$slug" params={{ slug: "studybuddy" }}>
              View Project <ExternalLink className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg, onFollowUp }: { msg: ChatMsg; onFollowUp: (t: string) => void }) {
  const isUser = msg.role === "user";
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <span
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${
            isUser ? "bg-muted text-foreground" : "bg-primary/15 text-primary"
          }`}
        >
          {isUser ? "G" : <Bot className="h-4 w-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold">{isUser ? "You" : "DraftYard AI"}</span>
            <span className="text-[11px] text-muted-foreground">{msg.time}</span>
          </div>
          <div className="mt-1.5 text-sm leading-relaxed text-foreground/90">{msg.content}</div>
        </div>
      </div>

      {msg.followUps && (
        <div className="ml-11 flex flex-wrap gap-2">
          {msg.followUps.map((f) => (
            <button
              key={f}
              onClick={() => onFollowUp(f)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground/80 transition hover:border-primary/50 hover:bg-primary/5 hover:text-foreground"
            >
              <Sparkles className="h-3 w-3 text-primary" /> {f}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-border/70 bg-background/70">
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-1.5">
        <span className="text-[11px] font-medium text-muted-foreground">backend</span>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3 text-[12.5px] leading-relaxed text-foreground/85">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Composer({
  value,
  onChange,
  onSend,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
}) {
  return (
    <div className="px-4 pb-4 sm:px-6">
      <div className="relative flex items-end gap-2 rounded-2xl border border-border bg-background/60 p-2 shadow-sm transition focus-within:border-primary/50 focus-within:shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_15%,transparent)]">
        <button className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground" aria-label="Attach">
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
          placeholder="Ask anything about your project..."
          rows={1}
          className="min-h-[40px] flex-1 resize-none border-0 bg-transparent px-1 py-2 text-sm shadow-none focus-visible:ring-0"
        />
        <button className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground" aria-label="Voice">
          <Mic className="h-4 w-4" />
        </button>
        <Button
          onClick={onSend}
          size="icon"
          className="h-9 w-9 shrink-0 rounded-lg"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ---------------- Right: Quick Actions ----------------

function QuickActionsPanel() {
  return (
    <aside className="flex min-h-0 flex-col gap-4">
      <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
        <Button size="sm" className="w-full justify-center gap-1.5 rounded-lg">
          <Plus className="h-3.5 w-3.5" /> New Chat
        </Button>

        <div className="mt-4 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <h3 className="text-sm font-semibold">Quick Actions</h3>
        </div>
        <div className="mt-3 space-y-1.5">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.title}
              className="group flex w-full items-center gap-2.5 rounded-xl border border-transparent px-2 py-2 text-left transition hover:border-border hover:bg-muted/40"
            >
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${a.tint}`}>
                <a.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-semibold">{a.title}</p>
                <p className="truncate text-[10.5px] text-muted-foreground">{a.sub}</p>
              </div>
              <ArrowRight className="h-3 w-3 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <h3 className="text-sm font-semibold">Suggested Prompts</h3>
        </div>
        <div className="mt-3 space-y-1.5">
          {SUGGESTED_PROMPTS.map((p) => (
            <button
              key={p}
              className="w-full rounded-xl border border-border/70 bg-background/40 px-3 py-2 text-left text-[12.5px] leading-snug text-foreground/85 transition hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
