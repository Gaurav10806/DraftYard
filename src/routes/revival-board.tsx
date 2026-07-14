import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Boxes,
  TrendingUp,
  Trophy,
  Percent,
  Rocket,
  FileText,
  ArrowRight,
  Bookmark,
  Clock,
  ThumbsUp,
  Hand,
  Search,
  Sparkles,
  X,
  Info,
  ChevronRight,
  Award,
} from "lucide-react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { TopBar } from "@/components/dashboard/top-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { drafts } from "@/data/drafts";
import { stageToProgress } from "@/lib/drafts-insights";

export const Route = createFileRoute("/revival-board")({
  head: () => ({
    meta: [
      { title: "Revival Board · DraftYard" },
      {
        name: "description",
        content:
          "Revive unfinished ideas. Discover salvageable projects, raise your hand, and ship something real.",
      },
      { property: "og:title", content: "Revival Board · DraftYard" },
      {
        property: "og:description",
        content: "AI-matched revival opportunities across 100+ unfinished projects.",
      },
    ],
  }),
  component: RevivalBoardPage,
});

// ---------------- Data ----------------

type Success = {
  name: string;
  desc: string;
  stack: string[];
  weeks: number;
  upvotes: number;
  variant: "purple" | "teal" | "amber";
};

const successStories: Success[] = [
  {
    name: "CampusConnect",
    desc: "Student networking platform for college communities",
    stack: ["Next.js", "Tailwind", "Supabase"],
    weeks: 3,
    upvotes: 312,
    variant: "purple",
  },
  {
    name: "Taskly",
    desc: "Smart task management for teams and projects",
    stack: ["React", "Node.js", "MongoDB"],
    weeks: 2,
    upvotes: 198,
    variant: "teal",
  },
  {
    name: "NoteFlow",
    desc: "Collaborative note taking for students",
    stack: ["Vue.js", "Firebase", "TypeScript"],
    weeks: 4,
    upvotes: 256,
    variant: "amber",
  },
];

const stats = [
  { icon: Boxes, value: "392", label: "Open for Revival", tone: "purple" },
  { icon: TrendingUp, value: "57", label: "Revived This Week", tone: "green" },
  { icon: Trophy, value: "23", label: "Success Stories", tone: "amber" },
  { icon: Percent, value: "78%", label: "Avg Revival Rate", tone: "cyan" },
] as const;

const filterTabs = ["All Projects", "Best Match", "Recently Added", "Almost Complete"];

// Deterministic pseudo-random match score based on project name
function matchFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return 28 + (h % 65); // 28..92
}

function stallFor(reason: string): { label: string; color: string } {
  const w = reason.toLowerCase();
  if (w.includes("scope") || w.includes("kept adding"))
    return { label: "Scope Creep", color: "#f59e0b" };
  if (w.includes("burnout") || w.includes("overwhelmed"))
    return { label: "Solo Burnout", color: "#ef4444" };
  if (w.includes("time") || w.includes("exams") || w.includes("job"))
    return { label: "Lack of Time", color: "#eab308" };
  if (w.includes("team") || w.includes("cofounder"))
    return { label: "Team Disbanded", color: "#f97316" };
  if (w.includes("cost") || w.includes("resources") || w.includes("budget"))
    return { label: "Lack of Resources", color: "#f43f5e" };
  if (w.includes("motivation") || w.includes("interest"))
    return { label: "Lost Motivation", color: "#a855f7" };
  return { label: "Stalled", color: "#a855f7" };
}

// ---------------- Page ----------------

function RevivalBoardPage() {
  const [tab, setTab] = useState("All Projects");
  const [query, setQuery] = useState("");
  const [raiseTarget, setRaiseTarget] = useState<string | null>(null);

  const revivalProjects = useMemo(
    () => drafts.filter((d) => d.openForRevival).slice(0, 12),
    []
  );

  const filtered = useMemo(() => {
    let list = revivalProjects.map((d) => ({ ...d, match: matchFor(d.projectName) }));
    if (tab === "Best Match") list = list.sort((a, b) => b.match - a.match);
    else if (tab === "Almost Complete")
      list = list.sort((a, b) => stageToProgress(b.stageDied) - stageToProgress(a.stageDied));
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (d) =>
          d.projectName.toLowerCase().includes(q) ||
          d.oneLiner.toLowerCase().includes(q) ||
          d.techStack.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [revivalProjects, tab, query]);

  return (
    <SidebarProvider>
      <div className="revival-page flex min-h-screen w-full bg-background text-foreground">
        <AppSidebar />
        <SidebarInset className="flex min-w-0 flex-1 flex-col">
          <TopBar showGreeting={false} />
          <main className="flex-1 space-y-6 p-4 sm:p-6">
            {/* Breadcrumb */}
            <nav className="text-xs text-muted-foreground">
              <span>DraftYard</span>
              <ChevronRight className="mx-1 inline h-3 w-3" />
              <span className="text-foreground">Revival Board</span>
            </nav>

            {/* Header row: title + 4 stat cards */}
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
              <div>
                <h1 className="flex items-center gap-2 font-display text-4xl font-semibold tracking-tight">
                  Revival Board
                  <Sparkles className="h-6 w-6 text-[color:var(--rev-accent)]" />
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Revive unfinished ideas. Build something real.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {stats.map((s) => (
                  <div key={s.label} className="rev-stat-card group">
                    <div className={`rev-stat-icon rev-stat-icon--${s.tone}`}>
                      <s.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-display text-2xl font-semibold leading-none">
                        {s.value}
                      </div>
                      <div className="mt-1 truncate text-[11px] text-muted-foreground">
                        {s.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Main + Sidebar */}
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-6">
                {/* Success Stories */}
                <section className="rev-card">
                  <div className="flex items-center justify-between border-b border-border/40 px-5 py-3">
                    <h2 className="flex items-center gap-2 font-display text-sm font-semibold">
                      Revival Success Stories <span>🚀</span>
                    </h2>
                    <button className="flex items-center gap-1 text-xs text-[color:var(--rev-accent)] hover:underline">
                      View all <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="grid gap-3 p-4 md:grid-cols-3">
                    {successStories.map((s) => (
                      <SuccessCard key={s.name} s={s} />
                    ))}
                  </div>
                </section>

                {/* Filter tabs + search */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    {filterTabs.map((t) => (
                      <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                          tab === t ? "rev-tab-active" : "rev-tab"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search within revival projects…"
                      className="rounded-full bg-card pl-9"
                    />
                  </div>
                </div>

                {/* Revival Cards grid */}
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((d) => (
                    <RevivalCard
                      key={d.projectName}
                      draft={d}
                      onRaise={() => setRaiseTarget(d.projectName)}
                    />
                  ))}
                </div>
              </div>

              {/* Right sidebar */}
              <aside className="space-y-4">
                <AIMatchSummary />
                <TopRevivers />
                <CommunityImpact />
              </aside>
            </div>
          </main>
        </SidebarInset>
      </div>

      <RaiseHandModal
        projectName={raiseTarget}
        open={raiseTarget !== null}
        onOpenChange={(o) => !o && setRaiseTarget(null)}
      />
    </SidebarProvider>
  );
}

// ---------------- Success Card ----------------

function SuccessCard({ s }: { s: Success }) {
  return (
    <div className={`rev-success rev-success--${s.variant}`}>
      <div className="rev-success-accent" aria-hidden />
      <div className="relative flex items-center gap-1.5">
        <span className="rev-success-badge inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium">
          ✅ Successfully Revived
        </span>
      </div>
      <h3 className="rev-success-title relative mt-2 font-display text-base font-semibold">
        {s.name}
      </h3>
      <p className="rev-success-desc relative mt-0.5 line-clamp-1 text-[11px]">
        {s.desc}
      </p>
      <div className="rev-success-meta relative mt-2 flex items-center gap-2 text-[11px]">
        <span className="rev-success-chip inline-flex items-center gap-1 rounded-md px-1.5 py-0.5">
          <FileText className="h-3 w-3" /> Draft
        </span>
        <ArrowRight className="h-3 w-3 opacity-70" />
        <span className="rev-success-chip inline-flex items-center gap-1 rounded-md px-1.5 py-0.5">
          <Rocket className="h-3 w-3" /> Revived
        </span>
      </div>
      <div className="relative mt-2 flex flex-wrap gap-1">
        {s.stack.map((t) => (
          <span
            key={t}
            className="rev-success-chip rounded-full px-1.5 py-0.5 text-[10px] font-medium"
          >
            {t}
          </span>
        ))}
      </div>
      <div className="rev-success-foot relative mt-auto pt-2 flex items-center justify-between text-[11px]">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" /> Shipped in {s.weeks} weeks
        </span>
        <span className="inline-flex items-center gap-1">
          <ThumbsUp className="h-3 w-3" /> {s.upvotes}
        </span>
      </div>
    </div>
  );
}

// ---------------- Revival Card ----------------

function RevivalCard({
  draft,
  onRaise,
}: {
  draft: (typeof drafts)[number] & { match: number };
  onRaise: () => void;
}) {
  const stall = stallFor(draft.whyItDied);
  const progress = stageToProgress(draft.stageDied);
  const matchTone = draft.match >= 75 ? "green" : draft.match >= 55 ? "amber" : "red";
  const initials = draft.projectName
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 2)
    .toUpperCase();
  const upvotes = 30 + (draft.projectName.length * 17) % 130;
  const daysAgo = 1 + (draft.projectName.length % 8);

  return (
    <motion.article
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="rev-card group/card relative flex flex-col overflow-hidden"
    >
      <span
        aria-hidden
        className="absolute left-0 top-0 h-full w-1"
        style={{ backgroundColor: stall.color }}
      />
      <div className="flex items-start gap-3 p-4 pl-5">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[color:var(--rev-accent-soft)] font-display text-xs font-semibold text-[color:var(--rev-accent)]">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-display text-sm font-semibold">
              {draft.projectName}
            </h3>
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
              {draft.stageDied.length > 12 ? "Building" : draft.stageDied}
            </span>
          </div>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            {draft.oneLiner}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={`rev-match rev-match--${matchTone}`}>{draft.match}% Match</span>
          <button className="text-muted-foreground hover:text-foreground">
            <Bookmark className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 px-5">
        {draft.techStack.slice(0, 3).map((t) => (
          <span
            key={t}
            className="rounded-md border border-border/60 bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
          >
            {t}
          </span>
        ))}
      </div>

      <div className="mt-3 space-y-2 px-5 text-xs">
        <div>
          <span className="text-muted-foreground">Stall Pattern:</span>{" "}
          <span
            className="ml-1 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium"
            style={{
              backgroundColor: `${stall.color}18`,
              color: stall.color,
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: stall.color }}
            />
            {stall.label}
          </span>
        </div>
        <p className="text-muted-foreground">
          <span className="text-foreground/80">Why it stalled:</span>{" "}
          <span className="line-clamp-2">{draft.whyItDied}</span>
        </p>
        <p className="flex items-start gap-1.5 text-emerald-500 dark:text-emerald-400">
          <span>🧬</span>
          <span className="line-clamp-1">
            <span className="font-medium">Salvageable:</span> {draft.salvageable}
          </span>
        </p>
      </div>

      <div className="mt-3 px-5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">
            {progress}% complete — needs{" "}
            {progress < 40 ? "Backend" : progress < 70 ? "Frontend" : "Polish"}
          </span>
        </div>
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #a855f7, #ec4899)",
            }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border/40 px-5 py-3">
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <ThumbsUp className="h-3 w-3" /> {upvotes}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> {daysAgo}d ago
          </span>
        </div>
        <Button
          size="sm"
          onClick={onRaise}
          className="rev-raise-btn h-7 rounded-full px-3 text-[11px] font-medium"
        >
          <Hand className="mr-1 h-3 w-3" /> Raise Hand
        </Button>
      </div>

      <div className="rev-view-details">
        View Details <ArrowRight className="h-3 w-3" />
      </div>
    </motion.article>
  );
}

// ---------------- Sidebar widgets ----------------

function AIMatchSummary() {
  const techs = ["React", "Node.js", "MongoDB"];
  return (
    <div className="rev-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 font-display text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-[color:var(--rev-accent)]" />
          AI Match Summary
          <Info className="h-3 w-3 text-muted-foreground" />
        </h3>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div>
          <p className="text-[11px] text-muted-foreground">Projects matching you</p>
          <p className="font-display text-3xl font-semibold leading-none">12</p>
        </div>
        <MatchGauge value={82} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border/40 pt-3 text-xs">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Best Category
          </p>
          <p className="mt-0.5 font-medium">Backend APIs</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Highest Match
          </p>
          <p className="mt-0.5 font-medium text-emerald-500 dark:text-emerald-400">94%</p>
        </div>
      </div>
      <div className="mt-3 border-t border-border/40 pt-3">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Recommended Role
        </p>
        <p className="mt-0.5 text-xs font-medium">Backend Developer</p>
      </div>
      <div className="mt-3 border-t border-border/40 pt-3">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Preferred Tech
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {techs.map((t) => (
            <span
              key={t}
              className="rounded-md bg-[color:var(--rev-accent-soft)] px-1.5 py-0.5 text-[10px] font-medium text-[color:var(--rev-accent)]"
            >
              {t}
            </span>
          ))}
          <span className="rounded-md border border-border/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            +2
          </span>
        </div>
      </div>
      <button className="mt-3 flex w-full items-center justify-end gap-1 text-[11px] font-medium text-[color:var(--rev-accent)] hover:underline">
        Improve matches <ArrowRight className="h-3 w-3" />
      </button>
    </div>
  );
}

function MatchGauge({ value }: { value: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <div className="relative grid h-14 w-14 place-items-center">
      <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="4" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke="var(--rev-accent)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-[10px] font-semibold leading-none">{value}%</p>
        <p className="text-[8px] leading-none text-muted-foreground">Avg</p>
      </div>
    </div>
  );
}

function TopRevivers() {
  const list = [
    { name: "Ansh V.", revivals: 8 },
    { name: "Rahul P.", revivals: 6 },
    { name: "Karan P.", revivals: 5 },
    { name: "Dev_Cosmos (You)", revivals: 4 },
    { name: "Aditya L.", revivals: 3 },
  ];
  return (
    <div className="rev-card p-4">
      <h3 className="flex items-center gap-1.5 font-display text-sm font-semibold">
        <Trophy className="h-4 w-4 text-amber-500" /> Top Revivers This Week
      </h3>
      <ul className="mt-3 space-y-2">
        {list.map((r, i) => (
          <li key={r.name} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2">
              <span
                className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-semibold ${
                  i < 3
                    ? "bg-amber-500/15 text-amber-500"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i < 3 ? <Award className="h-3 w-3" /> : i + 1}
              </span>
              <span className="font-medium">{r.name}</span>
            </span>
            <span className="text-muted-foreground">{r.revivals} revivals</span>
          </li>
        ))}
      </ul>
      <button className="mt-3 flex w-full items-center justify-end gap-1 text-[11px] font-medium text-[color:var(--rev-accent)] hover:underline">
        View Leaderboard <ArrowRight className="h-3 w-3" />
      </button>
    </div>
  );
}

function CommunityImpact() {
  return (
    <div className="rev-card p-4">
      <h3 className="flex items-center gap-1.5 font-display text-sm font-semibold">
        <Sparkles className="h-4 w-4 text-[color:var(--rev-accent)]" /> Community Impact
      </h3>
      <ul className="mt-3 space-y-2 text-xs">
        <li className="flex items-center justify-between">
          <span className="text-muted-foreground">Total Projects Revived</span>
          <span className="font-display text-sm font-semibold">234</span>
        </li>
        <li className="flex items-center justify-between">
          <span className="text-muted-foreground">Developers Helped</span>
          <span className="font-display text-sm font-semibold">189</span>
        </li>
        <li className="flex items-center justify-between">
          <span className="text-muted-foreground">Code Saved</span>
          <span className="font-display text-sm font-semibold">~47,000 loc</span>
        </li>
      </ul>
      <button className="mt-3 flex w-full items-center justify-end gap-1 text-[11px] font-medium text-[color:var(--rev-accent)] hover:underline">
        View Impact Report <ArrowRight className="h-3 w-3" />
      </button>
    </div>
  );
}

// ---------------- Raise Hand Modal ----------------

const SKILL_OPTIONS = ["React", "Node", "MongoDB", "Next.js", "Python", "UI/UX"];

function RaiseHandModal({
  projectName,
  open,
  onOpenChange,
}: {
  projectName: string | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [skills, setSkills] = useState<string[]>(["React", "Node"]);

  const toggle = (s: string) =>
    setSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rev-modal max-w-lg overflow-hidden border-none p-0 [&>button]:hidden">
        <div className="relative p-6">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-full border border-border/60 bg-background/60 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <DialogHeader className="text-left">
            <DialogTitle className="flex items-center gap-2 font-display text-lg">
              <Hand className="h-4 w-4 text-[color:var(--rev-accent)]" />
              Raise Your Hand
            </DialogTitle>
            <DialogDescription>
              Show the original creator you want to revive their project.
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="mt-4 space-y-4"
            >
              <FieldRow label="Project">
                <Input
                  readOnly
                  value={projectName ?? ""}
                  className="rev-input bg-muted/40"
                />
              </FieldRow>
              <div className="grid grid-cols-2 gap-3">
                <FieldRow label="Your Name">
                  <Input placeholder="Dev Cosmos" className="rev-input" />
                </FieldRow>
                <FieldRow label="Contact">
                  <Input placeholder="email / discord / github" className="rev-input" />
                </FieldRow>
              </div>
              <FieldRow label="Why do you want to revive this project?">
                <Textarea
                  rows={3}
                  placeholder="Share why this excites you and what you'd bring…"
                  className="rev-input resize-none"
                />
              </FieldRow>
              <FieldRow label="Relevant Skills">
                <div className="flex flex-wrap gap-2">
                  {SKILL_OPTIONS.map((s) => {
                    const on = skills.includes(s);
                    return (
                      <label
                        key={s}
                        className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all ${
                          on
                            ? "border-[color:var(--rev-accent)] bg-[color:var(--rev-accent-soft)] text-[color:var(--rev-accent)]"
                            : "border-border/60 text-muted-foreground hover:border-[color:var(--rev-accent)]/40"
                        }`}
                      >
                        <Checkbox
                          checked={on}
                          onCheckedChange={() => toggle(s)}
                          className="h-3 w-3"
                        />
                        {s}
                      </label>
                    );
                  })}
                </div>
              </FieldRow>
              <FieldRow label="Estimated Time">
                <Select defaultValue="2-4">
                  <SelectTrigger className="rev-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-2">1–2 weeks</SelectItem>
                    <SelectItem value="2-4">2–4 weeks</SelectItem>
                    <SelectItem value="1m">1 month</SelectItem>
                    <SelectItem value="1m+">More than 1 month</SelectItem>
                  </SelectContent>
                </Select>
              </FieldRow>
            </motion.div>
          </AnimatePresence>

          <DialogFooter className="mt-5 flex gap-2 sm:justify-end">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              className="rev-raise-btn rounded-full px-4"
            >
              Raise My Hand <Hand className="ml-1 h-3.5 w-3.5" />
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
