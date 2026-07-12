import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Bell,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Crown,
  Flame,
  Info,
  Search,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { drafts, type Draft } from "@/data/drafts";
import heroCubePlant from "@/assets/feed-hero-cube-plant.png";

export const Route = createFileRoute("/feed")({
  head: () => ({
    meta: [
      { title: "DraftYard Feed · Discover unfinished ideas" },
      {
        name: "description",
        content:
          "Browse stalled projects, discover ML stall patterns, and help bring great ideas back to life on DraftYard.",
      },
      { property: "og:title", content: "DraftYard Feed" },
      {
        property: "og:description",
        content: "Community discovery for unfinished projects. Revive what matters.",
      },
    ],
  }),
  component: FeedPage,
});

// ————————————————————————————————————————————————————————————————
// Derived demo data (built off the existing drafts dataset)
// ————————————————————————————————————————————————————————————————

type FeedDraft = Draft & {
  id: string;
  upvotes: number;
  contributors: number;
  timeAgo: string;
  aiInsight: string;
  revivalScore: number;
  stallAnalyzed: boolean;
  stage: string;
};

const AVATAR_TINTS = [
  "from-violet-500 to-fuchsia-500",
  "from-emerald-500 to-teal-500",
  "from-orange-500 to-rose-500",
  "from-sky-500 to-indigo-500",
  "from-amber-500 to-orange-500",
  "from-pink-500 to-purple-500",
  "from-cyan-500 to-blue-500",
  "from-lime-500 to-emerald-500",
];

function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function stageLabel(stageDied: string): string {
  const s = stageDied.toLowerCase();
  if (s.includes("idea")) return "Idea";
  if (s.includes("plan")) return "Planning";
  if (s.includes("proto")) return "Prototype";
  if (s.includes("almost")) return "Building";
  if (s.includes("launch")) return "Shipped";
  return "Building";
}

function aiInsightFor(d: Draft): string {
  if (d.salvageable && d.salvageable.length > 4 && !/nothing/i.test(d.salvageable)) {
    return `${d.salvageable}. Needs frontend polish and onboarding flow.`;
  }
  return "Strong concept and early traction. Needs product direction and a small revival team.";
}

const FEED: FeedDraft[] = drafts.map((d, i) => {
  const h = hashStr(d.projectName);
  return {
    ...d,
    id: `${i}-${d.projectName}`,
    upvotes: 40 + (h % 850),
    contributors: 1 + (h % 8),
    timeAgo:
      i % 5 === 0 ? "1 day ago" : i % 4 === 0 ? "3 days ago" : i % 3 === 0 ? "2 months in" : "3 months in",
    aiInsight: aiInsightFor(d),
    revivalScore: 55 + (h % 45),
    stallAnalyzed: h % 3 !== 0,
    stage: stageLabel(d.stageDied),
  };
});

const TRENDING = [...FEED].sort((a, b) => b.upvotes - a.upvotes).slice(0, 8);

const TOTAL_DRAFTS = 1248;
const OPEN_FOR_REVIVAL = FEED.filter((d) => d.openForRevival).length * 20;
const REVIVED_WEEK = 57;
const AVG_REVIVAL = 78;

const STALL_PATTERNS = [
  { label: "Scope Creep Syndrome", value: 34 },
  { label: "Solo Burnout", value: 28 },
  { label: "Lack of Consistency", value: 16 },
  { label: "Waiting on Data", value: 12 },
  { label: "Perfectionism Trap", value: 10 },
];

const TECH_OPTIONS = ["React", "Node.js", "Next.js", "Python", "Flutter", "TypeScript", "PostgreSQL", "MongoDB"];
const STAGE_OPTIONS = ["Idea", "Prototype", "Building", "Almost complete", "Shipped"];
const DOMAIN_OPTIONS = ["web", "mobile", "ml", "gaming", "productivity"];
const TEAM_OPTIONS = ["solo", "2-3", "4+"];
const STALL_OPTIONS = ["Scope Creep", "Solo Burnout", "Lack of Consistency", "Waiting on Data", "Perfectionism"];

// ————————————————————————————————————————————————————————————————
// Page
// ————————————————————————————————————————————————————————————————

function FeedPage() {
  const [tab, setTab] = useState<"all" | "open" | "recent" | "revived">("all");
  const [query, setQuery] = useState("");
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [upvoted, setUpvoted] = useState<Set<string>>(new Set());

  const visible = useMemo(() => {
    let list = FEED;
    if (tab === "open") list = list.filter((d) => d.openForRevival);
    if (tab === "recent") list = [...list].reverse();
    if (tab === "revived") list = [...list].sort((a, b) => b.revivalScore - a.revivalScore);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (d) =>
          d.projectName.toLowerCase().includes(q) ||
          d.oneLiner.toLowerCase().includes(q) ||
          d.techStack.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return list.slice(0, 9);
  }, [tab, query]);

  const toggleBookmark = (id: string) =>
    setBookmarks((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const toggleUpvote = (id: string) =>
    setUpvoted((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <SidebarProvider>
      <div className="feed-page flex min-h-screen w-full bg-background text-foreground leading-[1.5] dark:bg-[#0d0d14]">
        <AppSidebar />
        <SidebarInset className="flex min-w-0 flex-1 flex-col dark:bg-[#0d0d14]">
          <FeedTopBar />

          <motion.main
            className="flex-1 p-4 sm:p-6"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              {/* Left column */}
              <div className="min-w-0">
                <HeroHeader />
                <div className="h-8" />
                <TrendingCarousel
                  bookmarks={bookmarks}
                  onBookmark={toggleBookmark}
                />
                <div className="h-6" />
                <FilterBar tab={tab} onTab={setTab} query={query} onQuery={setQuery} />
                <div className="h-6" />
                <FeedGrid
                  items={visible}
                  bookmarks={bookmarks}
                  upvoted={upvoted}
                  onBookmark={toggleBookmark}
                  onUpvote={toggleUpvote}
                />
                <div className="flex items-center justify-between pt-6 text-sm text-muted-foreground">
                  <span>
                    Showing 1 – {visible.length} of {TOTAL_DRAFTS.toLocaleString()} drafts
                  </span>
                  <Button className="rounded-full">Load more drafts</Button>
                  <span className="hidden md:block" />
                </div>
              </div>

              {/* Right sidebar */}
              <aside className="space-y-4">
                <InsightsCard />
                <StallPatternsCard />
                <SpotlightCard />
              </aside>
            </div>
          </motion.main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

// ————————————————————————————————————————————————————————————————
// Top bar (matches Workspace pattern exactly)
// ————————————————————————————————————————————————————————————————

function FeedTopBar() {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-border/60 px-4 py-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger />
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <span>DraftYard</span>
          <span className="text-muted-foreground/50">/</span>
          <span className="font-medium text-foreground">All Drafts</span>
        </nav>
      </div>
      <div className="flex flex-1 items-center justify-end gap-2">
        <div className="group relative hidden w-[420px] max-w-full md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            placeholder="Search drafts, people, tech…"
            className="rounded-full bg-card pl-9 pr-14 transition-shadow duration-[220ms] focus-visible:shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_15%,transparent)]"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        </div>
        <button className="relative grid h-9 w-9 place-items-center rounded-full border border-border bg-card transition-colors hover:border-primary/50">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-semibold text-primary-foreground">
            4
          </span>
        </button>
        <ThemeToggle />
        <Avatar className="h-9 w-9 ring-2 ring-border">
          <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">DC</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}

// ————————————————————————————————————————————————————————————————
// Hero
// ————————————————————————————————————————————————————————————————

function HeroHeader() {
  const stats = [
    { label: "Total Drafts", value: TOTAL_DRAFTS.toLocaleString() },
    { label: "Open for Revival", value: OPEN_FOR_REVIVAL.toString() },
    { label: "Revived This Week", value: REVIVED_WEEK.toString() },
    { label: "Avg. Revival Rate", value: `${AVG_REVIVAL}%`, trend: "+12%" },
  ];
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-sm sm:p-8">
      <div className="pointer-events-none absolute -right-8 top-1/2 hidden -translate-y-1/2 md:block">
        <img
          src={heroCubePlant}
          alt=""
          width={320}
          height={320}
          className="h-[220px] w-[220px] select-none opacity-95 drop-shadow-[0_20px_40px_color-mix(in_oklab,var(--primary)_35%,transparent)] lg:h-[260px] lg:w-[260px]"
        />
      </div>
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklab,var(--primary)_18%,transparent),transparent_60%)]" />
      <div className="relative max-w-2xl">
        <h1 className="font-display text-3xl font-bold leading-[1.15] tracking-tight text-foreground dark:text-white sm:text-[48px]">
          Discover unfinished{" "}
          <span className="text-[#aa3bff]">
            ideas.
          </span>
          <br />
          <span className="dark:text-white">Revive what </span>
          <span className="text-[#aa3bff]">
            matters.
          </span>
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
          Explore stalled projects, discover ML stall patterns, and help bring great ideas back to life.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-border/60 bg-background/60 p-3 shadow-sm backdrop-blur-sm transition-all duration-[220ms] hover:-translate-y-0.5 hover:border-primary/40"
            >
              <div className="flex items-baseline justify-between">
                <span className="font-display text-xl font-semibold tracking-tight">{s.value}</span>
                {s.trend && (
                  <span className="text-[11px] font-medium text-emerald-500">↑ {s.trend}</span>
                )}
              </div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ————————————————————————————————————————————————————————————————
// Trending carousel
// ————————————————————————————————————————————————————————————————

function TrendingCarousel({
  bookmarks,
  onBookmark,
}: {
  bookmarks: Set<string>;
  onBookmark: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * 320, behavior: "smooth" });

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
          Trending This Week <Flame className="h-4 w-4 text-orange-500" />
        </h2>
        <a
          href="#feed"
          className="text-sm font-medium text-primary transition-colors hover:underline"
        >
          View all →
        </a>
      </div>
      <div className="relative">
        <button
          onClick={() => scroll(-1)}
          aria-label="Scroll left"
          className="absolute -left-3 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-border bg-background/95 shadow backdrop-blur transition-colors hover:border-primary/50"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-[5] w-10 bg-gradient-to-r from-background to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-[5] w-10 bg-gradient-to-l from-background to-transparent"
        />
        <div
          ref={ref}
          className="scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-smooth px-6 pb-2 [-webkit-overflow-scrolling:touch]"
        >
          {TRENDING.map((d, i) => (
            <TrendingCard
              key={d.id}
              draft={d}
              tint={AVATAR_TINTS[i % AVATAR_TINTS.length]}
              bookmarked={bookmarks.has(d.id)}
              onBookmark={() => onBookmark(d.id)}
            />
          ))}
        </div>
        <button
          onClick={() => scroll(1)}
          aria-label="Scroll right"
          className="absolute -right-3 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-border bg-background/95 shadow backdrop-blur transition-colors hover:border-primary/50"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}

function TrendingCard({
  draft,
  tint,
  bookmarked,
  onBookmark,
}: {
  draft: FeedDraft;
  tint: string;
  bookmarked: boolean;
  onBookmark: () => void;
}) {
  return (
    <div className="group/tc relative snap-start w-72 shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:border-primary/50 hover:shadow-[0_18px_40px_-18px_color-mix(in_oklab,var(--primary)_45%,transparent)]">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary via-fuchsia-500 to-primary opacity-80" />
      <div className={`relative h-28 w-full overflow-hidden bg-gradient-to-br ${tint}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.35),transparent_60%)] transition-transform duration-[350ms] ease-out group-hover/tc:scale-110" />
        <Badge className="absolute left-3 top-3 rounded-full border-0 bg-black/40 text-[10px] font-medium text-white backdrop-blur">
          <Flame className="mr-1 h-3 w-3" /> Trending
        </Badge>
        <button
          onClick={onBookmark}
          className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-black/30 text-white backdrop-blur transition-colors hover:bg-black/50"
        >
          {bookmarked ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
        </button>
      </div>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${tint} font-display text-sm font-bold text-white shadow-sm`}
          >
            {draft.projectName.slice(0, 1)}
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-display text-sm font-semibold tracking-tight">
              {draft.projectName}
            </h3>
            <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">{draft.oneLiner}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          {draft.techStack.slice(0, 3).map((t) => (
            <span
              key={t}
              className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              <TrendingUp className="h-3 w-3 text-primary" />
              {draft.upvotes}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" />+{draft.contributors}
            </span>
          </div>
          {draft.openForRevival && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Open for Revival
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ————————————————————————————————————————————————————————————————
// Sticky filter bar
// ————————————————————————————————————————————————————————————————

function FilterBar({
  tab,
  onTab,
  query,
  onQuery,
}: {
  tab: "all" | "open" | "recent" | "revived";
  onTab: (t: "all" | "open" | "recent" | "revived") => void;
  query: string;
  onQuery: (v: string) => void;
}) {
  const TABS: { id: typeof tab; label: string }[] = [
    { id: "all", label: "All Drafts" },
    { id: "open", label: "Open for Revival" },
    { id: "recent", label: "Recently Stalled" },
    { id: "revived", label: "Most Revived" },
  ];

  return (
    <div
      id="feed"
      className="sticky top-2 z-20 space-y-3 rounded-2xl border border-border/60 bg-card/85 p-3 shadow-sm backdrop-blur-md"
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => onTab(t.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-[180ms] ${
                tab === t.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search within drafts…"
            className="h-8 rounded-full bg-background pl-8 text-xs"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <FilterDropdown label="Tech Stack" options={TECH_OPTIONS} />
        <FilterDropdown label="Stage" options={STAGE_OPTIONS} />
        <FilterDropdown label="Domain" options={DOMAIN_OPTIONS} />
        <FilterDropdown label="Team Size" options={TEAM_OPTIONS} />
        <FilterDropdown label="Stall Pattern" options={STALL_OPTIONS} />
        <div className="ml-auto">
          <FilterDropdown label="Sort: Most Upvoted" options={["Most Upvoted", "Newest", "Highest Revival Score"]} single />
        </div>
      </div>
    </div>
  );
}

function FilterDropdown({
  label,
  options,
  single,
}: {
  label: string;
  options: string[];
  single?: boolean;
}) {
  const [selected, setSelected] = useState<string[]>(single ? [options[0]] : []);
  const toggle = (o: string) => {
    if (single) return setSelected([o]);
    setSelected((prev) => (prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o]));
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 rounded-full border-border/60 bg-background/70 text-xs font-medium"
        >
          {label}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuLabel className="text-xs">{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((o) => (
          <DropdownMenuCheckboxItem
            key={o}
            checked={selected.includes(o)}
            onCheckedChange={() => toggle(o)}
            className="text-xs"
          >
            {o}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ————————————————————————————————————————————————————————————————
// Feed grid
// ————————————————————————————————————————————————————————————————

function FeedGrid({
  items,
  bookmarks,
  upvoted,
  onBookmark,
  onUpvote,
}: {
  items: FeedDraft[];
  bookmarks: Set<string>;
  upvoted: Set<string>;
  onBookmark: (id: string) => void;
  onUpvote: (id: string) => void;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {items.map((d, i) => (
        <FeedCard
          key={d.id}
          draft={d}
          tint={AVATAR_TINTS[hashStr(d.projectName) % AVATAR_TINTS.length]}
          bookmarked={bookmarks.has(d.id)}
          upvoted={upvoted.has(d.id)}
          onBookmark={() => onBookmark(d.id)}
          onUpvote={() => onUpvote(d.id)}
          index={i}
        />
      ))}
    </div>
  );
}

function scoreColor(v: number) {
  if (v >= 80) return { stroke: "#22c55e", text: "text-emerald-500" };
  if (v >= 60) return { stroke: "#f59e0b", text: "text-amber-500" };
  return { stroke: "#ef4444", text: "text-red-500" };
}

function RevivalRing({ value }: { value: number }) {
  const c = scoreColor(value);
  const r = 22;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <div className="relative grid h-14 w-14 place-items-center">
      <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90">
        <circle cx="28" cy="28" r={r} strokeWidth="4" className="stroke-muted/60" fill="none" />
        <circle
          cx="28"
          cy="28"
          r={r}
          strokeWidth="4"
          strokeLinecap="round"
          stroke={c.stroke}
          fill="none"
          strokeDasharray={`${dash} ${circ}`}
          className="transition-[stroke-dasharray] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center leading-none">
        <div className="text-center">
          <div className={`font-display text-sm font-bold ${c.text}`}>{value}</div>
          <div className="text-[8px] text-muted-foreground">/100</div>
        </div>
      </div>
    </div>
  );
}

function FeedCard({
  draft,
  tint,
  bookmarked,
  upvoted,
  onBookmark,
  onUpvote,
  index,
}: {
  draft: FeedDraft;
  tint: string;
  bookmarked: boolean;
  upvoted: boolean;
  onBookmark: () => void;
  onUpvote: () => void;
  index: number;
}) {
  const open = draft.openForRevival;
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.03, ease: [0.22, 1, 0.36, 1] }}
      className={`group/card relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm transition-all duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:shadow-[0_22px_50px_-24px_color-mix(in_oklab,var(--primary)_45%,transparent)] ${
        open
          ? "border-emerald-500/30 hover:border-emerald-500/60"
          : "border-border/60 hover:border-primary/40"
      }`}
    >
      {open && (
        <span
          aria-hidden
          className="absolute inset-y-3 left-0 w-[3px] rounded-r-full bg-gradient-to-b from-emerald-400/70 via-emerald-500/60 to-emerald-400/70 shadow-[0_0_18px_2px_rgba(16,185,129,0.35)] group-hover/card:animate-pulse"
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${tint} font-display text-base font-bold text-white shadow-sm`}
          >
            {draft.projectName.slice(0, 1)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-display text-base font-semibold tracking-tight">
                {draft.projectName}
              </h3>
              <button
                onClick={onBookmark}
                aria-label="Bookmark"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                {bookmarked ? (
                  <BookmarkCheck className="h-3.5 w-3.5" />
                ) : (
                  <Bookmark className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground">
              {draft.oneLiner}
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="shrink-0 rounded-full border-border/60 bg-background/60 text-[10px] font-medium"
        >
          {draft.stage}
        </Badge>
      </div>

      {/* Tech pills */}
      <div className="mt-3 flex flex-wrap gap-1">
        {draft.techStack.slice(0, 4).map((t) => (
          <span
            key={t}
            className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
          >
            {t}
          </span>
        ))}
      </div>

      {/* AI Insight + Revival Score */}
      <div className="mt-4 flex items-start gap-3 rounded-xl border border-border/50 bg-background/40 p-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
            <Sparkles className="h-3 w-3" /> AI Insight
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground">
            {draft.aiInsight}
          </p>
        </div>
        <div className="flex flex-col items-center">
          <RevivalRing value={draft.revivalScore} />
          <span className="mt-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
            Revival Score
          </span>
        </div>
      </div>

      {draft.stallAnalyzed && (
        <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
          🧬 Stall DNA analyzed
        </div>
      )}

      {/* Bottom row */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onUpvote}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all duration-[180ms] ${
              upvoted
                ? "bg-primary text-primary-foreground shadow-[0_0_18px_color-mix(in_oklab,var(--primary)_45%,transparent)]"
                : "bg-primary/10 text-primary hover:bg-primary/15 group-hover/card:shadow-[0_0_18px_color-mix(in_oklab,var(--primary)_35%,transparent)]"
            }`}
          >
            ▲ {draft.upvotes + (upvoted ? 1 : 0)}
          </button>
          {open && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-medium text-emerald-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Open for Revival
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span>{draft.timeAgo}</span>
          <span className="inline-flex items-center gap-1 font-medium text-primary opacity-0 -translate-x-1 transition-all duration-[220ms] group-hover/card:opacity-100 group-hover/card:translate-x-0">
            View Draft <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </motion.article>
  );
}

// ————————————————————————————————————————————————————————————————
// Right sidebar cards
// ————————————————————————————————————————————————————————————————

function InsightsCard() {
  const rows = [
    { label: "Projects Today", value: "142", trend: "+18%" },
    { label: "Open Roles", value: OPEN_FOR_REVIVAL.toString(), trend: "+24%" },
    { label: "Most Revived This Week", value: REVIVED_WEEK.toString(), trend: "View" },
    { label: "Avg. Revival Score", value: `71 /100`, trend: "+12%" },
  ];
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 font-display text-sm font-semibold tracking-tight">
          DraftYard Insights <Info className="h-3 w-3 text-muted-foreground" />
        </h3>
      </div>
      <div className="mt-4 space-y-3">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] text-muted-foreground">{r.label}</div>
              <div className="font-display text-sm font-semibold tracking-tight">{r.value}</div>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500">
              ↑ {r.trend}
            </span>
          </div>
        ))}
      </div>
      <Button className="mt-4 w-full rounded-xl" variant="secondary">
        View Full Insights
      </Button>
    </div>
  );
}

function StallPatternsCard() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <h3 className="flex items-center gap-1.5 font-display text-sm font-semibold tracking-tight">
        Top Stall Patterns (ML) <Info className="h-3 w-3 text-muted-foreground" />
      </h3>
      <ul className="mt-4 space-y-3">
        {STALL_PATTERNS.map((p) => (
          <li key={p.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground">{p.label}</span>
              <span className="font-medium text-muted-foreground">{p.value}%</span>
            </div>
            <Progress value={p.value} className="h-1.5" />
          </li>
        ))}
      </ul>
      <Button className="mt-5 w-full rounded-xl">
        Explore Stall DNA Lab
      </Button>
    </div>
  );
}

function SpotlightCard() {
  const items = [
    {
      icon: <Crown className="h-4 w-4 text-amber-500" />,
      title: "Top Reviver",
      subtitle: "Riya Sharma",
      meta: "23 revivals",
    },
    {
      icon: <Flame className="h-4 w-4 text-orange-500" />,
      title: "Most Impactful Revival",
      subtitle: "StreamLink",
      meta: "92% impact",
    },
    {
      icon: <Sparkles className="h-4 w-4 text-primary" />,
      title: "Top Tech Stack",
      subtitle: "React + Node.js",
      meta: "Most revived",
    },
  ];
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <h3 className="font-display text-sm font-semibold tracking-tight">Community Spotlight</h3>
      <ul className="mt-4 space-y-3">
        {items.map((i) => (
          <li
            key={i.title}
            className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/50 p-2.5 transition-colors hover:border-primary/40"
          >
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-muted/60">{i.icon}</div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] text-muted-foreground">{i.title}</div>
              <div className="truncate text-xs font-semibold">{i.subtitle}</div>
            </div>
            <span className="text-[10px] text-muted-foreground">{i.meta}</span>
          </li>
        ))}
      </ul>
      <Button variant="ghost" className="mt-3 w-full justify-between text-xs">
        View Leaderboard <ArrowRight className="h-3 w-3" />
      </Button>
    </div>
  );
}
