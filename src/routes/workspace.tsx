import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState, type ReactNode } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Circle,
  Clock,
  Edit3,
  Flag,
  Github,
  GitPullRequest,
  Globe2,
  LayoutList,
  Lightbulb,
  LineChart,
  Link2,
  Lock,
  MoreHorizontal,
  Paperclip,
  Plus,
  Rocket,
  Send,
  Share2,
  Shield,
  Sparkles,
  UploadCloud,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { ProjectCompass } from "@/components/dashboard/project-compass";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export const Route = createFileRoute("/workspace")({
  head: () => ({
    meta: [
      { title: "Workspace · DraftYard" },
      {
        name: "description",
        content:
          "Execute on your project — tasks, stall DNA and team, all in one focused DraftYard workspace.",
      },
      { property: "og:title", content: "DraftYard Workspace" },
      {
        property: "og:description",
        content: "The place where developers actually build software on DraftYard.",
      },
    ],
  }),
  component: WorkspacePage,
});

// ————————————————————————————————————————————————————————————————
// Static demo data (mirrors the reference)
// ————————————————————————————————————————————————————————————————

const STAGES = ["Idea", "Prototype", "Building", "Testing", "Shipped"] as const;
type Stage = (typeof STAGES)[number];

const contributors = [
  { name: "Dev Cosmos", handle: "devcosmos@gmail.com", role: "Owner", initials: "DC" },
  { name: "Ansh Vekariya", handle: "ansh@example.com", role: "Contributor", initials: "AV" },
  { name: "Aditya Lodhiya", handle: "aditya@example.com", role: "Contributor", initials: "AL" },
  { name: "Rahul Patel", handle: "rahul@example.com", role: "Viewer", initials: "RP" },
];

type TaskStatus = "Todo" | "In Progress" | "Done";
type Priority = "High" | "Medium" | "Low";

const tasks: {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  assignee: string;
}[] = [
  { id: "T-01", title: "Implement Login API", status: "In Progress", priority: "High", assignee: "AV" },
  { id: "T-02", title: "Connect Frontend to API", status: "In Progress", priority: "Medium", assignee: "AL" },
  { id: "T-03", title: "Design Dashboard UI", status: "In Progress", priority: "Medium", assignee: "DC" },
  { id: "T-04", title: "JWT Authentication", status: "Todo", priority: "High", assignee: "AV" },
  { id: "T-05", title: "Protected Routes", status: "Todo", priority: "Medium", assignee: "RP" },
  { id: "T-06", title: "User Profile Page", status: "Todo", priority: "Low", assignee: "AL" },
  { id: "T-07", title: "Email Verification", status: "Todo", priority: "Low", assignee: "DC" },
  { id: "T-08", title: "Database schema", status: "Done", priority: "Medium", assignee: "AV" },
  { id: "T-09", title: "Repo bootstrap", status: "Done", priority: "Low", assignee: "DC" },
];

const activity = [
  { who: "Ansh V.", what: "updated stage to Building", when: "2h ago", initials: "AV" },
  { who: "Aditya L.", what: "pushed 3 commits", when: "5h ago", initials: "AL" },
  { who: "Gaurav S.", what: "joined as contributor", when: "1d ago", initials: "GS" },
  { who: "Rahul P.", what: "commented on Login API", when: "2d ago", initials: "RP" },
  { who: "AI Assistant", what: "refreshed Stall DNA", when: "2d ago", initials: "AI" },
];

// ————————————————————————————————————————————————————————————————
// Page
// ————————————————————————————————————————————————————————————————

function WorkspacePage() {
  const [tab, setTab] = useState<"overview" | "tasks" | "stall-dna" | "team">("overview");
  const [available, setAvailable] = useState(true);
  const [stage, setStage] = useState<Stage>("Building");
  const [pendingStage, setPendingStage] = useState<Stage | null>(null);
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AppSidebar />
        <SidebarInset className="flex min-w-0 flex-1 flex-col">
          <WorkspaceTopBar />

          <motion.main
            className="flex-1 space-y-6 p-4 sm:p-6"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <ProjectHeader
              stage={stage}
              onStageClick={(s) => setPendingStage(s)}
              available={available}
              onAvailableChange={setAvailable}
            />

            <TabBar tab={tab} onChange={setTab} />

            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                {tab === "overview" && <OverviewTab />}
                {tab === "tasks" && <TasksTab />}
                {tab === "stall-dna" && <StallDNATab />}
                {tab === "team" && <TeamTab />}
              </motion.div>
            </AnimatePresence>
          </motion.main>
        </SidebarInset>
      </div>

      {/* Stage change dialog */}
      <Dialog open={!!pendingStage} onOpenChange={(o) => !o && setPendingStage(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update stage</DialogTitle>
            <DialogDescription>
              Move StudyBuddy to <span className="font-medium text-foreground">{pendingStage}</span>.
              Contributors will be notified.
            </DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Add an optional note about this stage change…" rows={3} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPendingStage(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (pendingStage) setStage(pendingStage);
                setPendingStage(null);
              }}
            >
              Update stage
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating AI */}
      <FloatingAI open={aiOpen} onOpenChange={setAiOpen} />
    </SidebarProvider>
  );
}

// ————————————————————————————————————————————————————————————————
// Top Bar (matches dashboard language, no duplicate controls)
// ————————————————————————————————————————————————————————————————

function WorkspaceTopBar() {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-border/60 px-4 py-3 sm:px-6">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <span>Workspace</span>
          <span className="text-muted-foreground/50">/</span>
          <span className="font-medium text-foreground">StudyBuddy</span>
        </nav>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Avatar className="h-9 w-9 ring-2 ring-border">
          <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">DC</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}

// ————————————————————————————————————————————————————————————————
// Persistent project header
// ————————————————————————————————————————————————————————————————

function ProjectHeader({
  stage,
  onStageClick,
  available,
  onAvailableChange,
}: {
  stage: Stage;
  onStageClick: (s: Stage) => void;
  available: boolean;
  onAvailableChange: (v: boolean) => void;
}) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
      {/* row 1: identity + actions */}
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex min-w-0 items-start gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary/15 font-display text-base font-bold text-primary">
            SB
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-[24px] font-semibold leading-tight tracking-tight">
                StudyBuddy
              </h1>
              <button className="text-muted-foreground transition-colors duration-[180ms] hover:text-foreground">
                <Edit3 className="h-3.5 w-3.5" />
              </button>
              <Badge variant="secondary" className="rounded-full text-[10px]">
                <span className="mr-1 h-1.5 w-1.5 rounded-full bg-primary" />
                {stage}
              </Badge>
              <Badge variant="outline" className="gap-1 rounded-full text-[10px]">
                <Globe2 className="h-3 w-3" /> Public
              </Badge>
              <Badge variant="outline" className="gap-1 rounded-full text-[10px]">
                <Github className="h-3 w-3" /> Connected
              </Badge>
            </div>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
              AI-powered study planner for college students.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5">
            <span className="grid h-4 w-4 place-items-center">
              <span className="h-2 w-2 rounded-full bg-[color:var(--revive)]" />
            </span>
            <span className="text-xs font-medium">Available for Revival</span>
            <Switch checked={available} onCheckedChange={onAvailableChange} />
          </div>
          <Button variant="outline" size="sm" className="rounded-full">
            <Share2 className="mr-1.5 h-3.5 w-3.5" /> Share
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-full">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <Link2 className="mr-2 h-4 w-4" /> Copy project link
              </DropdownMenuItem>
              <DropdownMenuItem>
                <UploadCloud className="mr-2 h-4 w-4" /> Export
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                Archive project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Separator className="my-6" />

      {/* row 2: revival score + stage tracker + contributors */}
      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)_auto]">
        <RevivalScore />
        <StageTracker current={stage} onSelect={onStageClick} />
        <div className="flex flex-col items-start gap-2 lg:items-end">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Contributors
          </span>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {contributors.slice(0, 4).map((c) => (
                <Avatar key={c.initials} className="h-7 w-7 ring-2 ring-card">
                  <AvatarFallback className="bg-primary/15 text-[10px] font-semibold text-primary">
                    {c.initials}
                  </AvatarFallback>
                </Avatar>
              ))}
              <span className="grid h-7 w-7 place-items-center rounded-full bg-muted text-[10px] font-semibold ring-2 ring-card">
                +3
              </span>
            </div>
            <Button size="sm" variant="ghost" className="h-8 rounded-full text-xs">
              <UserPlus className="mr-1 h-3.5 w-3.5" /> Invite
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function RevivalScore() {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        <span>Revival Score</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--revive)]/15 px-1.5 py-0.5 text-[10px] font-semibold tracking-normal text-[color:var(--revive)]">
          <ArrowUpRight className="h-3 w-3" /> +4
        </span>
      </div>
      <div className="mt-2 flex items-end gap-2">
        <span className="font-display text-4xl font-semibold leading-none tracking-tight">72</span>
        <span className="pb-1 text-xs text-muted-foreground">/100</span>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Status</span>
        <span className="font-medium text-[color:var(--revive)]">Good</span>
      </div>
    </div>
  );
}

function StageTracker({ current, onSelect }: { current: Stage; onSelect: (s: Stage) => void }) {
  const currentIndex = STAGES.indexOf(current);
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        <span>Stage Tracker</span>
        <span className="tracking-normal text-muted-foreground/80 normal-case">Click to update</span>
      </div>
      <div className="mt-3 flex items-center">
        {STAGES.map((s, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          return (
            <div key={s} className="flex flex-1 items-center">
              <button
                onClick={() => onSelect(s)}
                className="group flex flex-col items-center gap-1.5 focus:outline-none"
              >
                <span
                  className={`grid h-7 w-7 place-items-center rounded-full border transition-all duration-[220ms] ${
                    active
                      ? "border-primary bg-primary text-primary-foreground shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_15%,transparent)]"
                      : done
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground group-hover:border-primary/50 group-hover:text-foreground"
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <span className="text-[10px] font-semibold">{i + 1}</span>
                  )}
                </span>
                <span
                  className={`text-[11px] font-medium transition-colors duration-[180ms] ${
                    active ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {s}
                </span>
              </button>
              {i < STAGES.length - 1 && (
                <span
                  className={`mx-2 h-px flex-1 transition-colors duration-[220ms] ${
                    i < currentIndex ? "bg-primary/40" : "bg-border"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ————————————————————————————————————————————————————————————————
// Tab bar
// ————————————————————————————————————————————————————————————————

function TabBar({
  tab,
  onChange,
}: {
  tab: "overview" | "tasks" | "stall-dna" | "team";
  onChange: (t: "overview" | "tasks" | "stall-dna" | "team") => void;
}) {
  const items: { id: typeof tab; label: string; icon: typeof LayoutList }[] = [
    { id: "overview", label: "Overview", icon: LineChart },
    { id: "tasks", label: "Tasks", icon: LayoutList },
    { id: "stall-dna", label: "Stall DNA", icon: Sparkles },
    { id: "team", label: "Team", icon: Users },
  ];
  return (
    <div className="flex items-center gap-1 border-b border-border/60">
      {items.map((it) => {
        const active = tab === it.id;
        return (
          <button
            key={it.id}
            onClick={() => onChange(it.id)}
            className={`group relative flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors duration-[180ms] ${
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <it.icon className="h-3.5 w-3.5" />
            {it.label}
            <span
              className={`absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary transition-all duration-[220ms] ${
                active ? "opacity-100 scale-x-100" : "opacity-0 scale-x-50"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

// ————————————————————————————————————————————————————————————————
// Card primitive to match dashboard exactly
// ————————————————————————————————————————————————————————————————

function Card({
  title,
  action,
  className = "",
  children,
}: {
  title?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all duration-[220ms] hover:shadow-md ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between">
          {title && (
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      <div className={title ? "mt-4" : ""}>{children}</div>
    </div>
  );
}

// ————————————————————————————————————————————————————————————————
// OVERVIEW
// ————————————————————————————————————————————————————————————————

function OverviewTab() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Why It Stalled">
          <div className="flex items-start gap-2">
            <Badge className="rounded-full bg-destructive/10 text-destructive hover:bg-destructive/15">
              Scope Creep
            </Badge>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            The project grew beyond initial scope, leading to delayed progress and lost focus.
          </p>
          <div className="mt-5">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <span>Confidence</span>
              <span className="text-foreground">91%</span>
            </div>
            <Progress value={91} className="mt-2 h-1.5" />
          </div>
        </Card>

        <Card title="What's Next (AI)">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-tint-lilac">
              <Lightbulb className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-display text-base font-semibold leading-tight">
                Implement Login API
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Connect the frontend to the API and deploy the backend to unblock testing.
              </p>
            </div>
          </div>
          <Button className="mt-5 h-9 w-full rounded-full">
            View Full Suggestion <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Card>

        <Card title="Project Snapshot">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Tasks", value: "23", sub: "8 done" },
              { label: "Contributors", value: "4", sub: "3 active" },
              { label: "Files", value: "18" },
              { label: "Commits", value: "132" },
            ].map((m) => (
              <div key={m.label} className="rounded-xl bg-muted/50 p-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {m.label}
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="font-display text-xl font-semibold leading-none">{m.value}</span>
                  {m.sub && <span className="text-[11px] text-muted-foreground">{m.sub}</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" /> Updated 2h ago
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card title="Draft Compass">
          <p className="-mt-1 text-sm leading-relaxed text-muted-foreground">
            Set the focus that guides how contributors and AI prioritize this draft.
          </p>
          <div className="mt-4">
            <ProjectCompass />
          </div>
        </Card>

        <Card title="Focus Insights">
          <ul className="space-y-3 text-sm">
            {[
              { label: "Build momentum", value: "High", tone: "text-[color:var(--revive)]" },
              { label: "Open questions", value: "3 unresolved", tone: "text-foreground" },
              { label: "Last activity", value: "2h ago", tone: "text-muted-foreground" },
              { label: "Contributors online", value: "2 of 4", tone: "text-foreground" },
            ].map((r) => (
              <li key={r.label} className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0">
                <span className="text-muted-foreground">{r.label}</span>
                <span className={`font-medium ${r.tone}`}>{r.value}</span>
              </li>
            ))}
          </ul>
          <Button variant="outline" size="sm" className="mt-5 w-full rounded-full">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Ask AI for next focus
          </Button>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px]">

        <Card title="Recent Activity">
          <ul className="divide-y divide-border/60">
            {activity.map((a, i) => (
              <li key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <Avatar className="h-7 w-7 ring-2 ring-card">
                  <AvatarFallback className="bg-primary/15 text-[10px] font-semibold text-primary">
                    {a.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    <span className="font-medium">{a.who}</span>{" "}
                    <span className="text-muted-foreground">{a.what}</span>
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{a.when}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Quick Actions">
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Plus, label: "Create Task", tint: "bg-tint-lilac" },
              { icon: UserPlus, label: "Invite Contributor", tint: "bg-tint-mint" },
              { icon: Github, label: "Open GitHub", tint: "bg-tint-sky" },
              { icon: UploadCloud, label: "Upload File", tint: "bg-tint-peach" },
            ].map((a) => (
              <button
                key={a.label}
                className="group flex h-full flex-col items-center gap-2 rounded-xl border border-border bg-background p-4 text-center transition-all duration-[220ms] hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/5 hover:shadow-sm"
              >
                <span className={`grid h-10 w-10 place-items-center rounded-xl ${a.tint}`}>
                  <a.icon className="h-4 w-4" />
                </span>
                <span className="text-xs font-medium leading-tight">{a.label}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ————————————————————————————————————————————————————————————————
// TASKS
// ————————————————————————————————————————————————————————————————

function TasksTab() {
  const [view, setView] = useState<"list" | "board">("list");
  const [selectedId, setSelectedId] = useState("T-01");
  const selected = tasks.find((t) => t.id === selectedId) ?? tasks[0];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
      {/* LEFT — task list */}
      <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Tasks</h2>
          <div className="flex items-center gap-1 rounded-full border border-border bg-background p-0.5 text-[11px]">
            {(["list", "board"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded-full px-2.5 py-1 font-medium capitalize transition-colors duration-[180ms] ${
                  view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-5">
          {(["In Progress", "Todo", "Done"] as TaskStatus[]).map((section) => {
            const items = tasks.filter((t) => t.status === section);
            return (
              <div key={section}>
                <div className="flex items-center justify-between px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <span>{section}</span>
                  <span>{items.length}</span>
                </div>
                <ul className="mt-2 space-y-1">
                  {items.map((t) => {
                    const active = t.id === selectedId;
                    return (
                      <li key={t.id}>
                        <button
                          onClick={() => setSelectedId(t.id)}
                          className={`group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-all duration-[180ms] ${
                            active
                              ? "bg-primary/8 ring-1 ring-primary/30"
                              : "hover:bg-muted/60"
                          }`}
                        >
                          <span
                            className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
                              t.status === "Done"
                                ? "border-[color:var(--revive)] bg-[color:var(--revive)] text-white"
                                : t.status === "In Progress"
                                ? "border-primary text-primary"
                                : "border-border"
                            }`}
                          >
                            {t.status === "Done" ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : t.status === "In Progress" ? (
                              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                            ) : (
                              <Circle className="h-2.5 w-2.5 opacity-0" />
                            )}
                          </span>
                          <span
                            className={`flex-1 truncate text-sm ${
                              t.status === "Done" ? "text-muted-foreground line-through" : ""
                            }`}
                          >
                            {t.title}
                          </span>
                          <PriorityChip p={t.priority} />
                          <Avatar className="h-5 w-5 ring-1 ring-card">
                            <AvatarFallback className="bg-primary/15 text-[8px] font-semibold text-primary">
                              {t.assignee}
                            </AvatarFallback>
                          </Avatar>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        <Button variant="outline" size="sm" className="mt-4 w-full rounded-full">
          <Plus className="mr-1 h-3.5 w-3.5" /> New task
        </Button>
      </div>

      {/* RIGHT — task detail */}
      <TaskDetail task={selected} />
    </div>
  );
}

function PriorityChip({ p }: { p: Priority }) {
  const cls =
    p === "High"
      ? "bg-destructive/10 text-destructive"
      : p === "Medium"
      ? "bg-tint-peach text-foreground"
      : "bg-muted text-muted-foreground";
  return (
    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${cls}`}>
      {p}
    </span>
  );
}

function TaskDetail({ task }: { task: (typeof tasks)[number] }) {
  const [checks, setChecks] = useState<Record<string, boolean>>({
    a: true,
    b: true,
    c: true,
    d: true,
    e: false,
    f: false,
    g: false,
  });
  const checklist = [
    { id: "a", label: "Setup /login endpoint" },
    { id: "b", label: "Validate user input" },
    { id: "c", label: "Check user in database" },
    { id: "d", label: "Compare password with hashed password" },
    { id: "e", label: "Generate JWT token" },
    { id: "f", label: "Handle errors properly" },
    { id: "g", label: "Write unit tests" },
  ];
  const done = Object.values(checks).filter(Boolean).length;

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-[22px] font-semibold leading-tight tracking-tight">
              {task.title}
            </h2>
            <PriorityChip p={task.priority} />
            <Badge variant="secondary" className="rounded-full text-[10px]">
              {task.status}
            </Badge>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {task.id} · Due 20 May · Backend
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-full">
            <Edit3 className="mr-1 h-3.5 w-3.5" /> Edit
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Separator className="my-5" />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="space-y-6">
          <section>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Description
            </div>
            <p className="mt-2 text-sm leading-relaxed text-foreground">
              Build a secure login API using email and password. Use bcrypt for hashing and generate a
              JWT token on successful login.
            </p>
          </section>

          <section>
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Checklist
              </div>
              <span className="text-xs text-muted-foreground">
                {done}/{checklist.length}
              </span>
            </div>
            <Progress value={(done / checklist.length) * 100} className="mt-2 h-1.5" />
            <ul className="mt-3 space-y-1.5">
              {checklist.map((c) => {
                const on = checks[c.id];
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => setChecks((s) => ({ ...s, [c.id]: !s[c.id] }))}
                      className="group flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1 text-left transition-colors duration-[180ms] hover:bg-muted/60"
                    >
                      <span
                        className={`grid h-4 w-4 place-items-center rounded border transition-colors duration-[180ms] ${
                          on ? "border-primary bg-primary text-primary-foreground" : "border-border"
                        }`}
                      >
                        {on && <CheckCircle2 className="h-3 w-3" />}
                      </span>
                      <span
                        className={`text-sm ${on ? "text-muted-foreground line-through" : ""}`}
                      >
                        {c.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Comments
            </div>
            <div className="mt-3 space-y-3">
              <div className="flex items-start gap-2.5">
                <Avatar className="h-7 w-7 ring-2 ring-card">
                  <AvatarFallback className="bg-primary/15 text-[10px] font-semibold text-primary">
                    AV
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 rounded-xl bg-muted/50 p-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium">Ansh V.</span>
                    <span className="text-muted-foreground">1h ago</span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed">
                    Hashing works locally. Blocked on JWT secret rotation strategy.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Avatar className="h-7 w-7 ring-2 ring-card">
                  <AvatarFallback className="bg-primary/15 text-[10px] font-semibold text-primary">
                    DC
                  </AvatarFallback>
                </Avatar>
                <Input placeholder="Write a comment…" className="rounded-full" />
              </div>
            </div>
          </section>
        </div>

        {/* Right meta */}
        <aside className="space-y-4">
          <MetaRow label="Assignee">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-primary/15 text-[10px] font-semibold text-primary">
                  {task.assignee}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">Ansh V.</span>
            </div>
          </MetaRow>
          <MetaRow label="Labels">
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="rounded-full text-[10px]">Backend</Badge>
              <Badge variant="secondary" className="rounded-full text-[10px]">Auth</Badge>
            </div>
          </MetaRow>
          <MetaRow label="Due">
            <span className="text-sm">20 May 2026</span>
          </MetaRow>
          <MetaRow label="Linked PR">
            <a className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline" href="#">
              <GitPullRequest className="h-3.5 w-3.5" /> #45 Implement login API
            </a>
          </MetaRow>
          <MetaRow label="Dependencies">
            <span className="text-sm">Database Schema</span>
          </MetaRow>
          <MetaRow label="Attachments">
            <button className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <Paperclip className="h-3.5 w-3.5" /> Attach
            </button>
          </MetaRow>

          <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
              <Sparkles className="h-3 w-3" /> AI Suggestion
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Add refresh-token rotation before shipping. Similar stalled projects failed here.
            </p>
            <Button variant="ghost" size="sm" className="mt-2 h-7 rounded-full px-2 text-xs">
              Ask AI <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function MetaRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

// ————————————————————————————————————————————————————————————————
// STALL DNA
// ————————————————————————————————————————————————————————————————

function StallDNATab() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card title="Primary Stall Pattern" className="lg:col-span-1">
        <h3 className="font-display text-lg font-semibold tracking-tight">Scope Creep Syndrome</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Strong signals of expanding scope beyond core value, causing delayed progress and context
          switching.
        </p>
        <div className="mt-5 rounded-xl bg-muted/50 p-4">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <span>Confidence</span>
            <span className="text-foreground">91%</span>
          </div>
          <Progress value={91} className="mt-2 h-1.5" />
        </div>
      </Card>

      <Card title="Similar Stalled Projects" className="lg:col-span-1">
        <ul className="space-y-3">
          {[
            { name: "CampusConnect", stack: "React, Node.js, MongoDB", match: 91 },
            { name: "QuizMaster", stack: "Flutter, Firebase", match: 87 },
            { name: "EventHub", stack: "Next.js, PostgreSQL", match: 85 },
          ].map((p) => (
            <li
              key={p.name}
              className="flex items-center gap-3 rounded-xl border border-border bg-background p-3"
            >
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-tint-lilac font-display text-[11px] font-bold">
                {p.name.slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="truncate text-xs text-muted-foreground">{p.stack}</p>
              </div>
              <Badge variant="secondary" className="rounded-full text-[10px]">
                {p.match}% match
              </Badge>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Most Successful Recovery" className="lg:col-span-1">
        <h3 className="font-display text-base font-semibold tracking-tight">Lock the MVP scope</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Projects that defined a strict MVP and cut non-essential features had the highest success
          rate.
        </p>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="font-display text-3xl font-semibold tracking-tight">78%</span>
          <span className="text-xs text-muted-foreground">success rate</span>
        </div>
        <Button variant="outline" size="sm" className="mt-4 w-full rounded-full">
          See Action Plan <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </Card>

      <Card title="Predicted Stall Factors" className="lg:col-span-2">
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[
            { label: "Scope Creep", level: "Very High" },
            { label: "Vague Requirements", level: "High" },
            { label: "Tech Overthinking", level: "Medium" },
            { label: "Lack of Consistency", level: "Medium" },
            { label: "Resource Constraints", level: "Low" },
          ].map((f) => (
            <li
              key={f.label}
              className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2 text-sm"
            >
              <span>{f.label}</span>
              <Badge variant="secondary" className="rounded-full text-[10px]">
                {f.level}
              </Badge>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Revival Probability">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-4xl font-semibold tracking-tight">67%</span>
          <span className="text-xs text-muted-foreground">if action taken now</span>
        </div>
        <Progress value={67} className="mt-3 h-1.5" />
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Based on 4 similar projects that made it past this stage.
        </p>
      </Card>

      <Card title="Recovery Suggestions" className="lg:col-span-3">
        <ul className="grid gap-3 md:grid-cols-3">
          {[
            {
              icon: Flag,
              title: "Define MVP boundary",
              body: "List 3 features. Everything else is v2.",
            },
            {
              icon: Rocket,
              title: "Ship the login flow",
              body: "Unblock testing and get end-to-end feedback.",
            },
            {
              icon: Users,
              title: "Weekly async standup",
              body: "Short written updates to prevent context switching.",
            },
          ].map((s) => (
            <li
              key={s.title}
              className="rounded-xl border border-border bg-background p-4 transition-all duration-[220ms] hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-sm"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-tint-mint">
                <s.icon className="h-4 w-4" />
              </span>
              <p className="mt-3 text-sm font-medium">{s.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

// ————————————————————————————————————————————————————————————————
// TEAM
// ————————————————————————————————————————————————————————————————

function TeamTab() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <Card
          title="Contributors"
          action={
            <Button size="sm" className="h-8 rounded-full">
              <UserPlus className="mr-1 h-3.5 w-3.5" /> Invite
            </Button>
          }
        >
          <ul className="divide-y divide-border/60">
            {contributors.map((c) => (
              <li key={c.handle} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <Avatar className="h-9 w-9 ring-2 ring-card">
                  <AvatarFallback className="bg-primary/15 text-[11px] font-semibold text-primary">
                    {c.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.handle}</p>
                </div>
                <Badge variant="secondary" className="rounded-full text-[10px]">
                  {c.role}
                </Badge>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Pending Join Requests">
          <ul className="space-y-2">
            <li className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/15 text-[10px] font-semibold text-primary">
                  RV
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">ravi@example.com</p>
                <p className="text-xs text-muted-foreground">Requested 2 days ago</p>
              </div>
              <Button variant="ghost" size="sm" className="h-8 rounded-full">
                Decline
              </Button>
              <Button size="sm" className="h-8 rounded-full">
                Approve
              </Button>
            </li>
          </ul>
        </Card>
      </div>

      <div className="space-y-6">
        <Card title="Roles">
          <ul className="space-y-2 text-sm">
            {[
              { role: "Owner", count: 1 },
              { role: "Contributor", count: 2 },
              { role: "Viewer", count: 1 },
            ].map((r) => (
              <li key={r.role} className="flex items-center justify-between">
                <span>{r.role}</span>
                <span className="text-muted-foreground">{r.count}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Permissions">
          <ul className="space-y-2 text-sm">
            {[
              { icon: Shield, text: "Owners manage project settings" },
              { icon: UserPlus, text: "Owners invite / remove members" },
              { icon: Edit3, text: "Contributors edit tasks and files" },
              { icon: Lock, text: "Viewers have read-only access" },
            ].map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-muted-foreground">
                <p.icon className="mt-0.5 h-3.5 w-3.5 text-primary" />
                <span>{p.text}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Recent Team Activity">
          <ul className="space-y-3 text-sm">
            {activity.slice(0, 3).map((a, i) => (
              <li key={i} className="flex items-start gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="bg-primary/15 text-[9px] font-semibold text-primary">
                    {a.initials}
                  </AvatarFallback>
                </Avatar>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  <span className="font-medium text-foreground">{a.who}</span> {a.what}
                  <span className="ml-1 text-muted-foreground/70">· {a.when}</span>
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

// ————————————————————————————————————————————————————————————————
// Floating AI (button + drawer)
// ————————————————————————————————————————————————————————————————

function FloatingAI({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <>
      <motion.button
        onClick={() => onOpenChange(true)}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="fixed bottom-6 right-6 z-40 grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg transition-all duration-[180ms] hover:-translate-y-0.5 hover:shadow-xl"
        aria-label="Open AI Assistant"
      >
        <Bot className="h-5 w-5" />
      </motion.button>

      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/15 text-primary">
                <Bot className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold leading-tight">AI Assistant</p>
                <p className="text-[11px] text-muted-foreground">Context: StudyBuddy</p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors duration-[180ms] hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            <div className="flex items-start gap-2.5">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/15 text-primary">
                <Bot className="h-3.5 w-3.5" />
              </span>
              <div className="rounded-2xl rounded-tl-sm bg-muted/60 px-3 py-2 text-sm leading-relaxed">
                Hi Dev — StudyBuddy is stalled on <span className="font-medium">Scope Creep</span>.
                Want me to draft a locked MVP scope?
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {["Draft MVP scope", "Summarize open tasks", "Suggest next PR"].map((s) => (
                <button
                  key={s}
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium transition-colors duration-[180ms] hover:border-primary/60 hover:bg-primary/5"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-border/60 p-3">
            <div className="flex items-center gap-2 rounded-full border border-border bg-background pl-3 pr-1 py-1 focus-within:ring-2 focus-within:ring-primary/30">
              <input
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                placeholder="Ask about this project…"
              />
              <button className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground transition-transform duration-[180ms] hover:-translate-y-0.5">
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

