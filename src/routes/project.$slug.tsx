import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  Share2,
  Send,
  Sparkles,
  Users,
  MessageSquare,
  Activity as ActivityIcon,
  LayoutGrid,
  Lightbulb,
  HelpCircle,
  AlertTriangle,
  MessageCircle,
  Check,
  Bot,
  Brain,
  ArrowRight,
  Clock,
  ChevronDown,
  Plus,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { drafts, type Draft } from "@/data/drafts";

export const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const Route = createFileRoute("/project/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} · DraftYard Project` },
      {
        name: "description",
        content: `Explore ${params.slug} on DraftYard — its stall DNA, AI revival prediction, discussions, contributors, and activity timeline.`,
      },
      { property: "og:title", content: `${params.slug} · DraftYard` },
    ],
  }),
  loader: ({ params }) => {
    const draft = drafts.find((d) => slugify(d.projectName) === params.slug);
    if (!draft) throw notFound();
    return { draft };
  },
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center bg-background p-8 text-center">
      <div>
        <h1 className="font-display text-2xl font-bold">Project not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The draft you're looking for doesn't exist.
        </p>
        <Link to="/feed" className="mt-4 inline-block text-sm font-medium text-primary">
          ← Back to Feed
        </Link>
      </div>
    </div>
  ),
  component: ProjectPage,
});

// ————————————————————————————————————————————————————————————
// Types + demo data derivations
// ————————————————————————————————————————————————————————————
type TabId = "overview" | "discussions" | "contributors" | "activity";

const TEAM = [
  { name: "Ansh Vekariya", role: "Project Owner", initials: "AV", tint: "from-violet-500 to-fuchsia-500" },
  { name: "Rohit Singh", role: "Frontend Developer", initials: "RS", tint: "from-sky-500 to-indigo-500" },
  { name: "Aarav Mehta", role: "Backend Developer", initials: "AM", tint: "from-emerald-500 to-teal-500" },
  { name: "Simran Kaur", role: "UI/UX Designer", initials: "SK", tint: "from-pink-500 to-purple-500" },
];

const DISCUSSIONS = [
  { tag: "Idea", tagTone: "violet", title: "Add mobile app support", body: "We can use React Native to build cross-platform mobile apps.", author: "Rohit Singh", replies: 6, comments: 12, upvotes: 24, time: "2h ago" },
  { tag: "Problem", tagTone: "rose", title: "State management issues in boards", body: "Facing re-rendering issues when tasks are updated frequently.", author: "Aarav Mehta", replies: 8, comments: 16, upvotes: 18, time: "5h ago" },
  { tag: "Question", tagTone: "amber", title: "Which chart library was used?", body: "What is the chart library was used for the analytics dashboard?", author: "Simran Kaur", replies: 4, comments: 6, upvotes: 9, time: "1d ago" },
  { tag: "Idea", tagTone: "violet", title: "Integrate AI for task suggestions", body: "We can suggest tasks based on team activity and past data.", author: "Dev Mehta", replies: 3, comments: 9, upvotes: 14, time: "1d ago" },
  { tag: "General", tagTone: "sky", title: "Project roadmap and next steps", body: "What are the next big things to do if someone takes over?", author: "Neeraj Patel", replies: 2, comments: 5, upvotes: 7, time: "2d ago" },
];

const OPEN_POSITIONS = [
  { role: "Frontend Developer", tech: "React, TypeScript, Tailwind CSS", match: 92, tone: "emerald" },
  { role: "Backend Developer", tech: "Node.js, Express, MongoDB", match: 88, tone: "emerald" },
  { role: "DevOps Engineer", tech: "Docker, CI/CD, Nginx", match: 75, tone: "amber" },
  { role: "Mobile Developer", tech: "React Native, Expo", match: 70, tone: "amber" },
];

const OPPORTUNITIES = [
  { title: "Fix Board Rendering Bug", body: "Fix re-render issues when tasks are updated.", diff: "Medium", hours: "4–6 hrs" },
  { title: "Add Dark Mode", body: "Implement dark mode across the application.", diff: "Easy", hours: "3–5 hrs" },
  { title: "Optimize API Calls", body: "Reduce unnecessary API calls in dashboard.", diff: "Medium", hours: "5–8 hrs" },
  { title: "Improve Mobile View", body: "Improve responsiveness for mobile screens.", diff: "Easy", hours: "2–4 hrs" },
];

const TIMELINE = [
  { icon: "flag", title: "Project created by Ansh Vekariya", date: "Jan 12, 2026", tone: "violet" },
  { icon: "git", title: "Initial commit", body: "Setup project structure and added core features", date: "Jan 13, 2026", tone: "violet" },
  { icon: "board", title: "Kanban board module added", body: "Implemented drag & drop and real-time updates", date: "Jan 20, 2026", tone: "violet" },
  { icon: "chart", title: "Analytics dashboard added", body: "Added charts and basic analytics", date: "Feb 1, 2026", tone: "violet" },
  { icon: "warn", title: "Stall detected by AI", body: "Inactivity for more than 30 days", date: "Jun 18, 2026", tone: "amber" },
  { icon: "revive", title: "Project marked open for revival", body: "Now looking for contributors to bring it back", date: "Jul 10, 2026", tone: "emerald" },
];

const HEALTH_DATA = [
  { m: "Jan", v: 40 },
  { m: "Feb", v: 55 },
  { m: "Mar", v: 62 },
  { m: "Apr", v: 45 },
  { m: "May", v: 35 },
  { m: "Jun", v: 30 },
  { m: "Jul", v: 78 },
];

const STALL_DNA = [
  { label: "Frontend", value: 70, color: "#a78bfa" },
  { label: "State Mgmt", value: 60, color: "#f472b6" },
  { label: "Performance", value: 45, color: "#f59e0b" },
  { label: "Consistency", value: 30, color: "#22d3ee" },
];

// ————————————————————————————————————————————————————————————
// Page
// ————————————————————————————————————————————————————————————
function ProjectPage() {
  const { draft } = Route.useLoaderData();
  const [tab, setTab] = useState<TabId>("overview");
  const [bookmarked, setBookmarked] = useState(false);

  return (
    <SidebarProvider>
      <div className="project-page flex min-h-screen w-full bg-background text-foreground">
        <AppSidebar />
        <SidebarInset className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="pointer-events-none absolute inset-0 z-0 opacity-60">
            <ProjectNodeNetwork variant="page" />
          </div>
          <div className="relative z-10 flex min-w-0 flex-1 flex-col">
            <ProjectTopBar />
            <motion.main
              className="flex-1 p-4 sm:p-6"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <ProjectHero
                draft={draft}
                bookmarked={bookmarked}
                onBookmark={() => setBookmarked((b) => !b)}
              />
              <ProjectTabs tab={tab} onTab={setTab} />
              <div className="h-6" />
              {tab === "overview" && <OverviewTab draft={draft} />}
              {tab === "discussions" && <DiscussionsTab />}
              {tab === "contributors" && <ContributorsTab />}
              {tab === "activity" && <ActivityTab />}
            </motion.main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

// ————————————————————————————————————————————————————————————
// Top bar
// ————————————————————————————————————————————————————————————
function ProjectTopBar() {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-border/60 px-4 py-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger />
        <Link
          to="/feed"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Feed
        </Link>
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

// ————————————————————————————————————————————————————————————
// Hero (logo, meta, revival score, actions, dotted node graphic)
// ————————————————————————————————————————————————————————————
function ProjectHero({
  draft,
  bookmarked,
  onBookmark,
}: {
  draft: Draft;
  bookmarked: boolean;
  onBookmark: () => void;
}) {
  const revivalScore = 78;
  return (
    <section className="project-hero relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
      <HeroDotWave />
      <div className="relative z-10 grid gap-6 lg:grid-cols-[auto_1fr_auto_auto]">
        {/* Logo */}
        <div className="project-hero-logo grid h-24 w-24 shrink-0 place-items-center rounded-2xl">
          <span className="font-display text-4xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
            {draft.projectName.slice(0, 1)}
          </span>
        </div>

        {/* Info */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-3xl font-bold tracking-tight">
              {draft.projectName}
            </h1>
            {draft.openForRevival && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/12 px-2.5 py-1 text-xs font-medium text-emerald-600 ring-1 ring-emerald-500/30 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-300" />
                Open for Revival
              </span>
            )}
          </div>
          <p className="mt-1 max-w-xl text-sm leading-[1.6] text-muted-foreground">
            {draft.oneLiner}. A modern {draft.domain} project that helps teams plan, track and
            collaborate efficiently.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-[10px] font-semibold text-white">
                  AV
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-muted-foreground">By Ansh Vekariya</div>
                <div className="font-medium">Project Owner</div>
              </div>
            </div>
            <MetaCol label="Created" value="Jan 12, 2026" />
            <MetaCol label="Last Active" value="Jun 18, 2026" />
            <MetaCol label="Category" value={draft.domain.charAt(0).toUpperCase() + draft.domain.slice(1)} />
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {draft.techStack.slice(0, 6).map((t) => (
              <span
                key={t}
                className="rounded-md border border-border/60 bg-muted/60 px-2 py-1 text-[11px] font-medium text-foreground/80"
              >
                {t}
              </span>
            ))}
            {draft.techStack.length > 6 && (
              <span className="rounded-md border border-border/60 bg-muted/60 px-2 py-1 text-[11px] font-medium text-muted-foreground">
                +{draft.techStack.length - 6}
              </span>
            )}
          </div>
        </div>

        {/* Revival score dial */}
        <div className="flex flex-col items-center justify-center gap-2">
          <RevivalDial value={revivalScore} />
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            High Potential
          </div>
        </div>

        {/* Actions */}
        <div className="flex w-full flex-col gap-2 lg:w-52">
          <Button className="w-full gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-[0_10px_30px_-10px_rgba(139,92,246,0.55)] hover:from-violet-600 hover:to-fuchsia-600">
            <Send className="h-4 w-4" /> Request to Join
          </Button>
          <Button variant="outline" onClick={onBookmark} className="w-full gap-2 rounded-lg">
            <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-current" : ""}`} /> Bookmark
          </Button>
          <Button variant="outline" className="w-full gap-2 rounded-lg">
            <Share2 className="h-4 w-4" /> Share Project
          </Button>
        </div>
      </div>
    </section>
  );
}

function MetaCol({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function RevivalDial({ value }: { value: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative grid h-28 w-28 place-items-center">
      <svg viewBox="0 0 80 80" className="absolute inset-0 -rotate-90 h-full w-full">
        <defs>
          <linearGradient id="revival-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          strokeWidth="6"
          className="stroke-border/60"
        />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          strokeWidth="6"
          stroke="url(#revival-grad)"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ filter: "drop-shadow(0 0 6px rgba(139,92,246,0.55))" }}
        />
      </svg>
      <div className="relative flex flex-col items-center justify-center leading-none">
        <div className="text-[8px] font-medium uppercase tracking-wider text-muted-foreground">
          Revival Score
        </div>
        <div className="font-display text-[26px] font-bold leading-none mt-0.5">{value}</div>
        <div className="text-[9px] text-muted-foreground mt-0.5">/100</div>
      </div>
    </div>
  );
}

// Dotted node network background (matches reference aesthetic)
function ProjectNodeNetwork({
  variant = "hero",
}: {
  variant?: "hero" | "page";
}) {
  const nodes = useMemo(() => {
    const arr: { x: number; y: number; r: number; b?: boolean }[] = [];
    const rand = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };
    const count = variant === "page" ? 26 : 14;
    const height = variant === "page" ? 900 : 260;
    for (let i = 0; i < count; i++) {
      arr.push({
        x: 30 + rand(i * 3.1) * 760,
        y: 20 + rand(i * 7.7) * (height - 40),
        r: 1.3 + rand(i * 11.3) * 1.8,
        b: i % 4 === 0,
      });
    }
    return arr;
  }, [variant]);
  const viewH = variant === "page" ? 900 : 260;
  return (
    <svg
      viewBox={`0 0 800 ${viewH}`}
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden
    >
      <g className="project-node-lines">
        {nodes.slice(0, -1).map((n, i) => {
          const m = nodes[(i + 3) % nodes.length];
          const dx = m.x - n.x;
          const dy = m.y - n.y;
          if (Math.hypot(dx, dy) > 260) return null;
          return (
            <line
              key={i}
              x1={n.x}
              y1={n.y}
              x2={m.x}
              y2={m.y}
              strokeDasharray="2 5"
              strokeWidth="0.7"
            />
          );
        })}
      </g>
      <g className="project-node-dots">
        {nodes.map((n, i) => (
          <circle
            key={i}
            cx={n.x}
            cy={n.y}
            r={n.r}
            className={n.b ? "project-node-bright" : ""}
          >
            {n.b && (
              <>
                <animate
                  attributeName="opacity"
                  values="0.25;1;0.25"
                  dur={`${4.5 + (i % 4) * 0.8}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="r"
                  values={`${n.r};${n.r * 1.9};${n.r}`}
                  dur={`${4.5 + (i % 4) * 0.8}s`}
                  repeatCount="indefinite"
                />
              </>
            )}
          </circle>
        ))}
      </g>
    </svg>
  );
}

// Premium decorative constellation — top-right 40% of hero
function HeroDotWave() {
  const { nodes, edges } = useMemo(() => {
    const rand = (seed: number) => {
      const x = Math.sin(seed * 999.1) * 10000;
      return x - Math.floor(x);
    };
    type N = {
      x: number;
      y: number;
      r: number;
      kind: "small" | "glow-purple" | "glow-cyan";
      delay: number;
      dur: number;
      dx: number;
      dy: number;
    };
    const list: N[] = [];
    const count = 22;
    // Constellation lives in the top-right region: x in [430, 780], y in [15, 220]
    for (let i = 0; i < count; i++) {
      const x = 430 + rand(i * 1.7) * 350;
      const y = 15 + rand(i * 3.3 + 0.5) * 205;
      const roll = rand(i * 5.9 + 7);
      let kind: N["kind"] = "small";
      let r = 1.4 + rand(i * 2.1) * 1.4; // 1.4 - 2.8
      if (i < 4) {
        kind = roll > 0.5 ? "glow-purple" : "glow-cyan";
        r = 3.2 + rand(i * 4.1) * 2.6; // 3.2 - 5.8
      }
      list.push({
        x,
        y,
        r,
        kind,
        delay: rand(i * 8.7) * 4,
        dur: 5 + rand(i * 11.1) * 4,
        dx: (rand(i * 13.3) - 0.5) * 6,
        dy: (rand(i * 17.7) - 0.5) * 6,
      });
    }
    // Build curved bezier edges between near neighbors (organic, not full mesh)
    const edges: { a: N; b: N; cx: number; cy: number; key: string }[] = [];
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      // pick 1-2 nearest that aren't already connected too much
      const dists = list
        .map((b, j) => ({ b, j, d: Math.hypot(a.x - b.x, a.y - b.y) }))
        .filter((o) => o.j !== i && o.d < 130)
        .sort((x, y) => x.d - y.d)
        .slice(0, 2);
      for (const o of dists) {
        const key = i < o.j ? `${i}-${o.j}` : `${o.j}-${i}`;
        if (edges.find((e) => e.key === key)) continue;
        const mx = (a.x + o.b.x) / 2;
        const my = (a.y + o.b.y) / 2;
        // organic curve offset perpendicular to segment
        const nx = -(o.b.y - a.y);
        const ny = o.b.x - a.x;
        const nl = Math.hypot(nx, ny) || 1;
        const curve = (rand(i * 19 + o.j) - 0.5) * 40;
        edges.push({
          a,
          b: o.b,
          cx: mx + (nx / nl) * curve,
          cy: my + (ny / nl) * curve,
          key,
        });
      }
    }
    return { nodes: list, edges };
  }, []);
  return (
    <svg
      viewBox="0 0 800 240"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden
    >
      <defs>
        <radialGradient id="hero-const-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--project-glow-core, rgba(139,92,246,0.55))" />
          <stop offset="60%" stopColor="var(--project-glow-mid, rgba(139,92,246,0.12))" />
          <stop offset="100%" stopColor="rgba(139,92,246,0)" />
        </radialGradient>
        <linearGradient id="hero-const-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--constellation-line, #a78bfa)" stopOpacity="0" />
          <stop offset="50%" stopColor="var(--constellation-line, #a78bfa)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--constellation-line, #a78bfa)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Blurred radial glow behind */}
      <ellipse
        cx="640"
        cy="120"
        rx="230"
        ry="150"
        fill="url(#hero-const-glow)"
        style={{ filter: "blur(24px)" }}
      />

      {/* Curved bezier edges */}
      <g fill="none" stroke="url(#hero-const-line)" strokeWidth="1" strokeLinecap="round">
        {edges.map((e) => (
          <path
            key={e.key}
            d={`M ${e.a.x} ${e.a.y} Q ${e.cx} ${e.cy} ${e.b.x} ${e.b.y}`}
            className="constellation-edge"
          />
        ))}
      </g>

      {/* Nodes */}
      <g>
        {nodes.map((n, i) => {
          const cls =
            n.kind === "glow-purple"
              ? "constellation-node constellation-node--purple"
              : n.kind === "glow-cyan"
              ? "constellation-node constellation-node--cyan"
              : "constellation-node constellation-node--small";
          return (
            <g
              key={i}
              style={{
                transformOrigin: `${n.x}px ${n.y}px`,
                animation: `constellation-float ${n.dur}s ease-in-out ${n.delay}s infinite alternate`,
                ["--fx" as string]: `${n.dx}px`,
                ["--fy" as string]: `${n.dy}px`,
              }}
            >
              <circle cx={n.x} cy={n.y} r={n.r} className={cls}>
                {n.kind !== "small" && (
                  <>
                    <animate
                      attributeName="opacity"
                      values="0.55;1;0.55"
                      dur={`${4 + (i % 4)}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="r"
                      values={`${n.r};${n.r * 1.35};${n.r}`}
                      dur={`${4 + (i % 4)}s`}
                      repeatCount="indefinite"
                    />
                  </>
                )}
              </circle>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

// ————————————————————————————————————————————————————————————
// Tabs
// ————————————————————————————————————————————————————————————
function ProjectTabs({ tab, onTab }: { tab: TabId; onTab: (t: TabId) => void }) {
  const items: { id: TabId; label: string; icon: typeof LayoutGrid }[] = [
    { id: "overview", label: "Overview", icon: LayoutGrid },
    { id: "discussions", label: "Discussions", icon: MessageSquare },
    { id: "contributors", label: "Contributors", icon: Users },
    { id: "activity", label: "Activity", icon: ActivityIcon },
  ];
  return (
    <div className="mt-6 flex items-center gap-1 border-b border-border/60">
      {items.map((it) => {
        const Icon = it.icon;
        const active = tab === it.id;
        return (
          <button
            key={it.id}
            onClick={() => onTab(it.id)}
            className={`relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors ${
              active ? "text-[var(--project-accent)]" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {it.label}
            {active && (
              <motion.span
                layoutId="project-tab-underline"
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--project-accent)] shadow-[0_0_8px_var(--project-glow)]"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ————————————————————————————————————————————————————————————
// OVERVIEW TAB
// ————————————————————————————————————————————————————————————
function OverviewTab({ draft }: { draft: Draft }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* About */}
      <Card>
        <CardTitle icon={<LayoutGrid className="h-4 w-4 text-violet-500" />}>About This Project</CardTitle>
        <p className="mt-3 text-sm leading-[1.6] text-muted-foreground">
          {draft.projectName} was built to simplify {draft.domain} management for teams. It
          includes real-time updates, kanban boards, analytics and team collaboration. The core
          features are working, but we need help improving UI, performance and mobile
          responsiveness.
        </p>
      </Card>

      {/* AI prediction */}
      <Card>
        <CardTitle icon={<Sparkles className="h-4 w-4 text-violet-500" />}>AI Prediction</CardTitle>
        <div className="mt-3 flex items-center gap-4">
          <p className="flex-1 text-sm leading-[1.6] text-muted-foreground">
            If revived with active contributors, this project has a{" "}
            <span className="font-semibold text-foreground">62% chance</span> of being completed.
          </p>
          <ProbabilityRing value={62} />
        </div>
        <button className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--project-accent)]">
          View Full Analysis <ArrowRight className="h-3 w-3" />
        </button>
      </Card>

      {/* Why it stalled */}
      <Card>
        <CardTitle icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}>Why It Stalled</CardTitle>
        <ul className="mt-3 space-y-2 text-sm">
          {["Lack of frontend polish", "State management issues", "Team busy with college placements"].map(
            (r) => (
              <li key={r} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                <span className="text-muted-foreground">{r}</span>
              </li>
            ),
          )}
        </ul>
        <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-600 ring-1 ring-rose-500/30 dark:text-rose-300">
          <AlertTriangle className="h-3 w-3" /> Detected by AI
        </div>
      </Card>

      {/* Stall DNA */}
      <Card>
        <CardTitle icon={<Brain className="h-4 w-4 text-fuchsia-500" />}>Stall DNA</CardTitle>
        <div className="mt-3 space-y-2.5">
          {STALL_DNA.map((s) => (
            <div key={s.label}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{s.label}</span>
                <span className="font-semibold">{s.value}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${s.value}%`,
                    background: `linear-gradient(90deg, ${s.color}, ${s.color}aa)`,
                    boxShadow: `0 0 10px ${s.color}66`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Salvageable Gold */}
      <Card>
        <CardTitle icon={<Sparkles className="h-4 w-4 text-amber-500" />}>Salvageable Gold</CardTitle>
        <ul className="mt-3 space-y-2 text-sm">
          {[
            "Authentication & Authorization",
            "Real-time with Socket.io",
            "Analytics Dashboard",
            "Clean API Structure",
          ].map((r) => (
            <li key={r} className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-muted-foreground">{r}</span>
            </li>
          ))}
        </ul>
        <button className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--project-accent)]">
          Explore Opportunities <ArrowRight className="h-3 w-3" />
        </button>
      </Card>

      {/* Similar projects */}
      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>Similar Projects</CardTitle>
          <button className="text-xs font-medium text-[var(--project-accent)]">View all (6)</button>
        </div>
        <ul className="mt-3 space-y-2.5 text-sm">
          {[
            { n: "WorkHive", m: 78, tint: "from-violet-500 to-fuchsia-500" },
            { n: "FocusFlow", m: 71, tint: "from-sky-500 to-cyan-500" },
            { n: "TeamSync", m: 68, tint: "from-emerald-500 to-teal-500" },
          ].map((p) => (
            <li key={p.n} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br ${p.tint} text-[11px] font-bold text-white`}
                >
                  {p.n.slice(0, 1)}
                </span>
                <span className="font-medium">{p.n}</span>
              </div>
              <span className="text-xs font-semibold text-[var(--project-accent)]">
                {p.m}% Match
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Project snapshots */}
      <Card className="lg:col-span-2">
        <CardTitle>Project Snapshots</CardTitle>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <SnapshotThumb key={i} idx={i} />
          ))}
        </div>
      </Card>

      {/* Discussion preview */}
      <Card className="lg:col-span-3">
        <div className="flex items-center justify-between">
          <CardTitle icon={<MessageCircle className="h-4 w-4 text-violet-500" />}>
            Discussion Preview
          </CardTitle>
          <button className="text-xs font-medium text-[var(--project-accent)]">
            View all discussions →
          </button>
        </div>
        <div className="mt-3 space-y-2">
          {DISCUSSIONS.slice(0, 3).map((d) => (
            <div
              key={d.title}
              className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 p-3"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-[10px] font-semibold text-white">
                  {d.author
                    .split(" ")
                    .map((w) => w[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold">{d.author}</div>
                <div className="text-xs text-muted-foreground">{d.body}</div>
              </div>
              <span className="text-[10px] text-muted-foreground">{d.time}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function SnapshotThumb({ idx }: { idx: number }) {
  const gradients = [
    "linear-gradient(135deg, #8b5cf6, #ec4899)",
    "linear-gradient(135deg, #06b6d4, #3b82f6)",
    "linear-gradient(135deg, #f59e0b, #f43f5e)",
    "linear-gradient(135deg, #10b981, #06b6d4)",
    "linear-gradient(135deg, #6366f1, #a855f7)",
  ];
  return (
    <div className="project-snapshot relative aspect-[4/3] overflow-hidden rounded-lg border border-border/60">
      <div className="absolute inset-0" style={{ background: gradients[idx % gradients.length], opacity: 0.9 }} />
      <svg viewBox="0 0 120 90" className="relative h-full w-full">
        <g fill="none" stroke="white" strokeOpacity="0.4" strokeWidth="1">
          <rect x="8" y="8" width="104" height="12" rx="2" />
          <rect x="8" y="26" width="48" height="56" rx="2" />
          <rect x="62" y="26" width="50" height="26" rx="2" />
          <rect x="62" y="56" width="50" height="26" rx="2" />
        </g>
        <g fill="white" fillOpacity="0.75">
          <rect x="14" y="34" width="30" height="4" rx="1" />
          <rect x="14" y="42" width="24" height="4" rx="1" />
          <rect x="14" y="50" width="28" height="4" rx="1" />
          <rect x="68" y="32" width="20" height="3" rx="1" />
          <rect x="68" y="40" width="30" height="6" rx="1" />
        </g>
      </svg>
    </div>
  );
}

function ProbabilityRing({ value }: { value: number }) {
  const r = 24;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative grid h-16 w-16 place-items-center">
      <svg viewBox="0 0 60 60" className="absolute inset-0 -rotate-90">
        <circle cx="30" cy="30" r={r} fill="none" strokeWidth="5" className="stroke-border/60" />
        <circle
          cx="30"
          cy="30"
          r={r}
          fill="none"
          strokeWidth="5"
          stroke="var(--project-accent)"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="relative text-center">
        <div className="font-display text-sm font-bold">{value}%</div>
        <div className="text-[8px] uppercase text-muted-foreground">Success</div>
      </div>
    </div>
  );
}

// ————————————————————————————————————————————————————————————
// DISCUSSIONS TAB
// ————————————————————————————————————————————————————————————
function DiscussionsTab() {
  const [filter, setFilter] = useState("All");
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-semibold">All Discussions</h3>
          <button className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            Sort by: Latest <ChevronDown className="h-3 w-3" />
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {["All", "Ideas", "Problems", "Questions", "General"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-[var(--project-accent)]/15 text-[var(--project-accent)] ring-1 ring-[var(--project-accent)]/30"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-2.5">
          {DISCUSSIONS.map((d) => (
            <DiscussionRow key={d.title} d={d} />
          ))}
        </div>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardTitle>Start a Discussion</CardTitle>
          <p className="mt-2 text-xs text-muted-foreground">
            Share your ideas, ask questions or discuss how we can revive this project.
          </p>
          <Button className="mt-3 w-full gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white">
            <Plus className="h-4 w-4" /> Write something...
          </Button>
        </Card>

        <Card>
          <CardTitle icon={<Sparkles className="h-4 w-4 text-violet-500" />}>AI Suggestions</CardTitle>
          <ul className="mt-3 space-y-2.5 text-xs text-muted-foreground">
            {[
              "Improve state management using Zustand or Redux Toolkit.",
              "Add dark mode to enhance user experience.",
              "Fix dashboard responsiveness on mobile devices.",
            ].map((s) => (
              <li key={s} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--project-accent)]" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
          <button className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--project-accent)]">
            View more suggestions <ArrowRight className="h-3 w-3" />
          </button>

          {/* AI orb decoration */}
          <div className="pointer-events-none absolute -bottom-6 -right-6 grid h-24 w-24 place-items-center opacity-90">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500/40 to-fuchsia-500/40 blur-2xl" />
            <div className="relative grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-[0_0_30px_rgba(139,92,246,0.55)]">
              <Bot className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function DiscussionRow({ d }: { d: (typeof DISCUSSIONS)[number] }) {
  const toneMap: Record<string, string> = {
    violet: "bg-violet-500/15 text-violet-600 ring-violet-500/30 dark:text-violet-300",
    rose: "bg-rose-500/15 text-rose-600 ring-rose-500/30 dark:text-rose-300",
    amber: "bg-amber-500/15 text-amber-600 ring-amber-500/30 dark:text-amber-300",
    sky: "bg-sky-500/15 text-sky-600 ring-sky-500/30 dark:text-sky-300",
  };
  const icon: Record<string, typeof Lightbulb> = {
    Idea: Lightbulb,
    Problem: AlertTriangle,
    Question: HelpCircle,
    General: MessageCircle,
  };
  const Icon = icon[d.tag] ?? MessageCircle;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 p-3 transition-colors hover:bg-muted/40">
      <span
        className={`inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${
          toneMap[d.tagTone]
        }`}
      >
        <Icon className="h-3 w-3" /> {d.tag}
      </span>
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-semibold">{d.title}</h4>
        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{d.body}</p>
        <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Avatar className="h-4 w-4">
              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-[7px] font-semibold text-white">
                {d.author.split(" ").map((w) => w[0]).join("")}
              </AvatarFallback>
            </Avatar>
            {d.author}
          </span>
          <span>·</span>
          <span>{d.replies} replies</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="h-3 w-3" /> {d.comments}
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-[var(--project-accent)]">
            ▲ {d.upvotes}
          </span>
        </div>
        <span>{d.time}</span>
      </div>
    </div>
  );
}

// ————————————————————————————————————————————————————————————
// CONTRIBUTORS TAB
// ————————————————————————————————————————————————————————————
function ContributorsTab() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1fr)]">
      {/* Core team */}
      <Card>
        <CardTitle icon={<Users className="h-4 w-4 text-violet-500" />}>Core Team</CardTitle>
        <ul className="mt-3 space-y-3">
          {TEAM.map((m) => (
            <li key={m.name} className="flex items-center gap-3">
              <div
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br ${m.tint} text-xs font-semibold text-white`}
              >
                {m.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{m.name}</div>
                <div className="text-[11px] text-muted-foreground">{m.role}</div>
              </div>
              <Badge variant="outline" className="rounded-full text-[10px]">
                {m.role.split(" ").pop()}
              </Badge>
            </li>
          ))}
        </ul>
      </Card>

      {/* AI Compatibility */}
      <Card>
        <div className="flex items-center justify-between">
          <CardTitle icon={<Sparkles className="h-4 w-4 text-violet-500" />}>
            AI Compatibility
          </CardTitle>
          <Badge className="rounded-full bg-violet-500/15 text-[10px] text-violet-600 ring-1 ring-violet-500/30 dark:text-violet-300">
            BETA
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          We analyzed your profile and skills.
        </p>
        <div className="mt-4 flex items-center gap-5">
          <CompatibilityRing value={91} />
          <div className="min-w-0 flex-1 space-y-3 text-sm">
            <div>
              <div className="mb-1.5 font-semibold text-[13px]">Why you're a great fit</div>
              <ul className="space-y-1.5 text-[12.5px] text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> Strong in React & TypeScript
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> Experience with Node.js & APIs
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> Interest in productivity tools
                </li>
              </ul>
            </div>
            <div>
              <div className="mb-1.5 font-semibold text-[13px]">Skills you can grow</div>
              <ul className="space-y-1.5 text-[12.5px] text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" /> Real-time systems (Socket.io)
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" /> MongoDB Aggregations
                </li>
              </ul>
            </div>
          </div>
        </div>
        <button className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--project-accent)]">
          Update your skills in your profile for better matches →
        </button>
      </Card>

      {/* Open positions */}
      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>Open Positions</CardTitle>
          <button className="text-xs font-medium text-[var(--project-accent)]">
            View all ({OPEN_POSITIONS.length})
          </button>
        </div>
        <ul className="mt-3 space-y-3">
          {OPEN_POSITIONS.map((p) => (
            <li key={p.role} className="rounded-lg border border-border/60 bg-muted/20 p-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{p.role}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{p.tech}</div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    p.tone === "emerald"
                      ? "bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/30 dark:text-emerald-300"
                      : "bg-amber-500/15 text-amber-600 ring-1 ring-amber-500/30 dark:text-amber-300"
                  }`}
                >
                  {p.match}% Match
                </span>
              </div>
              <Button
                size="sm"
                className="mt-2 h-7 w-full rounded-md bg-gradient-to-r from-violet-500 to-fuchsia-500 text-[11px] text-white"
              >
                Apply
              </Button>
            </li>
          ))}
        </ul>
      </Card>

      {/* Contribution opportunities */}
      <Card className="lg:col-span-2">
        <div className="flex items-center justify-between">
          <CardTitle icon={<Lightbulb className="h-4 w-4 text-amber-500" />}>
            Contribution Opportunities
          </CardTitle>
          <button className="text-xs font-medium text-[var(--project-accent)]">
            View all opportunities →
          </button>
        </div>
        <p className="text-xs text-muted-foreground">Claim tasks and start contributing</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {OPPORTUNITIES.map((o) => (
            <div
              key={o.title}
              className="flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/20 p-3"
            >
              <h4 className="text-sm font-semibold">{o.title}</h4>
              <p className="text-[11px] leading-[1.5] text-muted-foreground">{o.body}</p>
              <div className="mt-auto flex items-center gap-1.5 text-[10px]">
                <span
                  className={`rounded-full px-1.5 py-0.5 font-semibold ring-1 ${
                    o.diff === "Easy"
                      ? "bg-emerald-500/15 text-emerald-600 ring-emerald-500/30 dark:text-emerald-300"
                      : "bg-amber-500/15 text-amber-600 ring-amber-500/30 dark:text-amber-300"
                  }`}
                >
                  {o.diff}
                </span>
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" /> {o.hours}
                </span>
              </div>
              <Button
                size="sm"
                className="h-7 w-full rounded-md bg-gradient-to-r from-violet-500 to-fuchsia-500 text-[11px] text-white"
              >
                Claim
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Contribution overview */}
      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>Contribution Overview</CardTitle>
          <span className="text-[10px] text-muted-foreground">Last 12 weeks</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <StatTile label="Total Contributors" value="24" />
          <StatTile label="Total Commits" value="185" />
        </div>
        <div className="mt-3 h-24 w-full">
          <ResponsiveContainer>
            <BarChart data={Array.from({ length: 20 }, (_, i) => ({ i, v: 4 + Math.round(Math.sin(i * 0.9) * 4 + i / 3) }))}>
              <Bar dataKey="v" radius={[3, 3, 0, 0]} fill="url(#contrib-grad)" />
              <defs>
                <linearGradient id="contrib-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-1 text-right text-[10px] font-medium text-emerald-600 dark:text-emerald-300">
          +23% vs last month
        </div>
      </Card>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
      <div className="font-display text-xl font-bold">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function CompatibilityRing({ value }: { value: number }) {
  const r = 40;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative grid h-28 w-28 shrink-0 place-items-center">
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
        <defs>
          <linearGradient id="compat-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="8" className="stroke-border/50" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="8"
          stroke="url(#compat-grad)"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ filter: "drop-shadow(0 0 6px rgba(139,92,246,0.5))" }}
        />
      </svg>
      <div className="relative text-center">
        <div className="font-display text-2xl font-bold">{value}%</div>
        <div className="text-[10px] font-medium text-emerald-600 dark:text-emerald-300">
          Great Match
        </div>
      </div>
    </div>
  );
}

// ————————————————————————————————————————————————————————————
// ACTIVITY TAB
// ————————————————————————————————————————————————————————————
function ActivityTab() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      {/* Timeline */}
      <Card>
        <CardTitle icon={<ActivityIcon className="h-4 w-4 text-violet-500" />}>
          Activity Timeline
        </CardTitle>
        <div className="relative mt-4 pl-6">
          <span className="absolute inset-y-1 left-2 w-px bg-gradient-to-b from-violet-500/60 via-fuchsia-500/40 to-emerald-500/60" />
          <ul className="space-y-5">
            {TIMELINE.map((t) => (
              <li key={t.title} className="relative">
                <span
                  className={`absolute -left-[18px] top-1 grid h-3.5 w-3.5 place-items-center rounded-full ring-4 ring-background ${
                    t.tone === "amber"
                      ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]"
                      : t.tone === "emerald"
                      ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]"
                      : "bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.6)]"
                  }`}
                />
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4
                      className={`text-sm font-semibold ${
                        t.tone === "amber"
                          ? "text-amber-600 dark:text-amber-300"
                          : t.tone === "emerald"
                          ? "text-emerald-600 dark:text-emerald-300"
                          : ""
                      }`}
                    >
                      {t.title}
                    </h4>
                    {t.body && <p className="text-xs text-muted-foreground">{t.body}</p>}
                  </div>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{t.date}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      {/* Right column */}
      <div className="space-y-4">
        <Card>
          <div className="flex items-center justify-between">
            <CardTitle>Project Health</CardTitle>
            <button className="text-xs font-medium text-[var(--project-accent)]">
              View full report
            </button>
          </div>
          <div className="mt-3 h-40 w-full">
            <ResponsiveContainer>
              <LineChart data={HEALTH_DATA} margin={{ top: 6, right: 6, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="health-grad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#22d3ee" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="m" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke="url(#health-grad)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#a78bfa" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <CardTitle>Milestones</CardTitle>
            <button className="text-xs font-medium text-[var(--project-accent)]">View all</button>
          </div>
          <div className="mt-3 space-y-3">
            {[
              { l: "MVP Features", v: 60 },
              { l: "UI/UX Improvements", v: 60 },
              { l: "Performance Optimization", v: 30 },
              { l: "Mobile App Support", v: 0 },
            ].map((m) => (
              <div key={m.l}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{m.l}</span>
                  <span className="font-semibold">{m.v}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                    style={{ width: `${m.v}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle icon={<Brain className="h-4 w-4 text-fuchsia-500" />}>Activity Insights</CardTitle>
          <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
            {[
              "Performance score improved by 12% compared to last month.",
              "82% of core features are still functional.",
              "Project has high revival potential.",
            ].map((s) => (
              <li key={s} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--project-accent)]" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
          <div className="pointer-events-none absolute -bottom-6 -right-6 grid h-24 w-24 place-items-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500/40 to-fuchsia-500/40 blur-2xl" />
            <div className="relative grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-[0_0_30px_rgba(139,92,246,0.55)]">
              <Brain className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ————————————————————————————————————————————————————————————
// Shared primitives
// ————————————————————————————————————————————————————————————
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`project-card relative overflow-hidden rounded-2xl border border-border/60 bg-card p-4 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function CardTitle({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 font-display text-sm font-semibold tracking-tight">
      {icon}
      {children}
    </h3>
  );
}
