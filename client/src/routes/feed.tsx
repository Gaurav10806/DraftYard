import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { slugify } from "./project.$slug";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Bell,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Crown,
  Eye,
  Flame,
  Hand,
  Heart,
  Info,
  LogOut,
  Search,
  Settings,
  Sparkles,
  TrendingUp,
  UserCircle,
  Users,
  X,
  AlertCircle,
} from "lucide-react";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth-context";
import { useDrafts } from "@/hooks/use-drafts";
import { likeDraft, recordView } from "@/lib/api";
import type { FeedPage } from "@/hooks/use-drafts";
import { toast } from "sonner";
import type { Draft } from "@/lib/api";


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
// Utilities
// ————————————————————————————————————————————————————————————————

// Type alias for component props
type FeedDraft = Draft;

type EnrichedDraft = Draft & {
  id: string;
  contributors: number;
  timeAgo: string;
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

function formatTimeAgo(dateString?: string): string {
  if (!dateString) return "recently";
  try {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
  } catch {
    return "recently";
  }
}

function enrichDrafts(drafts: Draft[]): EnrichedDraft[] {
  return drafts.map((d, i) => {
    const h = hashStr(d.projectName);
    return {
      ...d,
      id: d._id || `${i}-${d.projectName}`,
      contributors: 1 + (h % 8),
      timeAgo: formatTimeAgo(d.createdAt),
    };
  });
}

// ————————————————————————————————————————————————————————————————
// Page
// ————————————————————————————————————————————————————————————————

function FeedPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTechStack, setSelectedTechStack] = useState<string[]>([]);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [sortBy, setSortBy] = useState<"newest" | "mostviewed" | "mostliked" | "recentlyupdated">("newest");
  const [tab, setTab] = useState<"all" | "open" | "recent" | "revived">("all");

  // Build filters object
  const filters = {
    search: searchQuery,
    techStack: selectedTechStack.length > 0 ? selectedTechStack : undefined,
    stage: selectedStages.length > 0 ? selectedStages : undefined,
    category: selectedCategory || undefined,
    status: selectedStatus || undefined,
    openForRevival: tab === "open" ? true : undefined,
    sort: tab === "revived" ? "recentlyupdated" : tab === "recent" ? "oldest" : sortBy,
  };

  const {
    data,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useDrafts(filters);

  // Flatten pages into single array
  const allDrafts = useMemo(() => {
    if (!data?.pages) return [];
    const drafts = (data.pages as FeedPage[]).flatMap((page) => page.data || []);
    // De-duplicate by _id
    const seen = new Set<string>();
    return drafts.filter(d => {
      const id = d._id || d.id;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [data]);

  const enriched = useMemo(() => enrichDrafts(allDrafts), [allDrafts]);

  // Calculate dynamic statistics from real data
  const totalDraftsCount = useMemo(() => enriched.length, [enriched]);

  const totalCommunityInteractions = useMemo(() => {
    return enriched.reduce((sum, d) => (sum + (d.likes || 0) + (d.views || 0) + (d.raisedHands?.length || 0)), 0);
  }, [enriched]);

  const totalLikes = useMemo(() => {
    return enriched.reduce((sum, d) => sum + (d.likes || 0), 0);
  }, [enriched]);

  const avgRevivalScore = useMemo(() => {
    if (enriched.length === 0) return 0;
    const totalScore = enriched.reduce((sum, d) => sum + (d.revivalScore || 0), 0);
    return Math.round(totalScore / enriched.length);
  }, [enriched]);

  // Stall patterns derived from failure reasons (top 5)
  const stallPatterns = useMemo(() => {
    const reasonCounts = new Map<string, number>();
    enriched.forEach(d => {
      if (d.failureReason) {
        reasonCounts.set(d.failureReason, (reasonCounts.get(d.failureReason) || 0) + 1);
      }
    });
    const sorted = Array.from(reasonCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, count]) => ({
        label,
        value: Math.round((count / Math.max(enriched.length, 1)) * 100)
      }));
    
    // Ensure at least 5 items for display
    const defaultPatterns = [
      { label: "Unclear Requirements", value: 0 },
      { label: "Resource Constraints", value: 0 },
      { label: "Lack of Time", value: 0 },
      { label: "Scope Creep", value: 0 },
      { label: "Lost Interest", value: 0 },
    ];
    
    return sorted.length > 0 ? sorted : defaultPatterns;
  }, [enriched]);

  // Apply local tab-based sorting only
  const visible = useMemo(() => {
    let list = enriched;
    if (tab === "recent") {
      list = [...list].reverse();
    } else if (tab === "revived") {
      list = [...list].sort((a, b) => b.revivalScore - a.revivalScore);
    }
    return list;
  }, [tab, enriched]);

  const trending = useMemo(() => [...enriched].sort((a, b) => {
    // Sort by likes first (descending)
    if ((b.likes || 0) !== (a.likes || 0)) {
      return (b.likes || 0) - (a.likes || 0);
    }
    // Then by views (descending)
    if ((b.views || 0) !== (a.views || 0)) {
      return (b.views || 0) - (a.views || 0);
    }
    // Then by recency (descending)
    const aDate = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const bDate = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return bDate - aDate;
  }).slice(0, 8), [enriched]);

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

  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [upvoted, setUpvoted] = useState<Set<string>>(new Set());
  const [raiseTarget, setRaiseTarget] = useState<string | null>(null);

  // Ref for infinite scroll sentinel
  const observerTarget = useRef<HTMLDivElement>(null);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <SidebarProvider>
      <div className="feed-page flex min-h-screen w-full bg-background text-foreground leading-[1.5] dark:bg-[#0d0d14]">
        <AppSidebar />
        <SidebarInset className="flex min-w-0 flex-1 flex-col dark:bg-[#0d0d14]">
          <FeedTopBar />

          <motion.main
            className="flex-1 p-4 sm:p-6 overflow-y-auto"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {error && (
              <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <div>
                  <h3 className="font-semibold text-destructive">Failed to load drafts</h3>
                  <p className="text-sm text-destructive/80">Please try refreshing the page</p>
                </div>
              </div>
            )}

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              {/* Left column */}
              <div className="min-w-0">
                <HeroHeader draftsCount={totalDraftsCount} isLoading={isLoading} totalInteractions={totalCommunityInteractions} avgRevival={avgRevivalScore} />
                <div className="h-8" />
                {enriched.length > 0 && (
                  <>
                    <TrendingCarousel
                      drafts={trending}
                      bookmarks={bookmarks}
                      onBookmark={toggleBookmark}
                      isLoading={isLoading}
                    />
                    <div className="h-6" />
                  </>
                )}
                <FilterBar 
                  tab={tab} 
                  onTab={setTab}
                  query={searchQuery} 
                  onQuery={setSearchQuery}
                  selectedTechStack={selectedTechStack}
                  onTechStackChange={setSelectedTechStack}
                  selectedStages={selectedStages}
                  onStagesChange={setSelectedStages}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  selectedStatus={selectedStatus}
                  onStatusChange={setSelectedStatus}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                />
                <div className="h-6" />
                <FeedGrid
                  items={visible}
                  bookmarks={bookmarks}
                  upvoted={upvoted}
                  onBookmark={toggleBookmark}
                  onUpvote={toggleUpvote}
                  onRaise={(projectName) => setRaiseTarget(projectName)}
                  isLoading={isLoading}
                />
                
                {/* Infinite scroll sentinel */}
                {hasNextPage && (
                  <div ref={observerTarget} className="mt-8 flex justify-center">
                    {isFetchingNextPage ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Loading more drafts...
                      </div>
                    ) : (
                      <Button onClick={() => fetchNextPage()} variant="outline" className="rounded-full">
                        Load More
                      </Button>
                    )}
                  </div>
                )}

                {!hasNextPage && allDrafts.length > 0 && (
                  <div className="mt-8 text-center text-sm text-muted-foreground">
                    You've reached the end ({enriched.length} drafts loaded)
                  </div>
                )}
              </div>

              {/* Right sidebar */}
              <aside className="space-y-4">
                <InsightsCard draftsCount={totalDraftsCount} totalInteractions={totalCommunityInteractions} avgRevival={avgRevivalScore} />
                <StallPatternsCard patterns={stallPatterns} />
                <SpotlightCard />
              </aside>
            </div>
          </motion.main>
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

// ————————————————————————————————————————————————————————————————
// Top bar (matches Workspace pattern exactly)
// ————————————————————————————————————————————————————————————————

function FeedTopBar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : user?.name
      ? user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
      : "DY";

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button>
              <Avatar className="h-9 w-9 ring-2 ring-border transition-shadow hover:ring-primary/50">
                <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="truncate">{user?.name || "Account"}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
              <UserCircle className="mr-2 h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
              <Settings className="mr-2 h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                logout();
                toast("Signed out");
                navigate({ to: "/login" });
              }}
            >
              <LogOut className="mr-2 h-4 w-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

// ————————————————————————————————————————————————————————————————
// Hero
// ————————————————————————————————————————————————————————————————

function HeroNetwork() {
  // Deterministic node positions (viewBox 400x300). Right-side network.
  const nodes = [
    { x: 55, y: 45, r: 3 },
    { x: 125, y: 85, r: 2.5 },
    { x: 200, y: 30, r: 3.8 },
    { x: 280, y: 75, r: 2.5 },
    { x: 355, y: 45, r: 3 },
    { x: 85, y: 165, r: 2.5 },
    { x: 165, y: 210, r: 3.2 },
    { x: 250, y: 155, r: 2.5 },
    { x: 335, y: 215, r: 3 },
    { x: 45, y: 250, r: 2.5 },
    { x: 210, y: 120, r: 4.2 },
    { x: 305, y: 255, r: 2.5 },
    { x: 150, y: 55, r: 2 },
    { x: 370, y: 140, r: 2.5 },
    { x: 115, y: 265, r: 2 },
    { x: 230, y: 260, r: 2.2 },
  ];
  const HIGHLIGHTED = new Set([2, 4, 6, 8, 10]);
  const edges: Array<[number, number]> = [
    [0, 1], [1, 2], [2, 3], [3, 4], [1, 10], [2, 10],
    [3, 10], [10, 6], [5, 6], [6, 7], [7, 8], [5, 9],
    [6, 10], [7, 3], [8, 11], [9, 6], [4, 3], [0, 5],
    [12, 2], [12, 0], [13, 4], [13, 8], [14, 9], [14, 6],
    [15, 6], [15, 11], [10, 7], [1, 5],
  ];
  // Traveling-pulse routes (a→b) — staggered for a living network feel.
  const routes: Array<{ a: number; b: number; dur: number; delay: number }> = [
    { a: 10, b: 6, dur: 3.2, delay: 0 },
    { a: 0, b: 2, dur: 3.6, delay: 0.8 },
    { a: 4, b: 3, dur: 3.0, delay: 1.6 },
    { a: 8, b: 11, dur: 3.4, delay: 0.4 },
    { a: 5, b: 9, dur: 3.8, delay: 2.1 },
    { a: 2, b: 10, dur: 2.8, delay: 1.2 },
  ];
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] overflow-hidden md:block"
    >
      {/* Soft lavender radial glow (light mode) */}
      <div className="absolute inset-0 dark:hidden bg-[radial-gradient(ellipse_65%_60%_at_65%_50%,rgba(167,139,250,0.32),transparent_78%)]" />
      {/* Purple radial glow (dark mode) */}
      <div className="absolute inset-0 hidden dark:block bg-[radial-gradient(ellipse_65%_60%_at_65%_50%,rgba(139,92,246,0.22),transparent_78%)]" />
      <svg
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 h-full w-full opacity-[0.7] dark:opacity-[0.55]"
      >
        <defs>
          <radialGradient id="dy-node-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Connection lines with subtle breathing opacity */}
        <g className="text-[#B8A5F5] dark:text-[#8b5cf6]">
          {edges.map(([a, b], i) => {
            const n1 = nodes[a];
            const n2 = nodes[b];
            return (
              <line
                key={i}
                x1={n1.x}
                y1={n1.y}
                x2={n2.x}
                y2={n2.y}
                stroke="currentColor"
                strokeWidth={1}
                strokeLinecap="round"
                strokeOpacity={0.55}
              >
                <animate
                  attributeName="stroke-opacity"
                  values="0.35;0.85;0.35"
                  dur={`${4 + (i % 5)}s`}
                  begin={`${(i % 6) * 0.4}s`}
                  repeatCount="indefinite"
                />
              </line>
            );
          })}
        </g>

        {/* Soft halos behind highlighted nodes */}
        <g>
          {nodes.map((n, i) =>
            HIGHLIGHTED.has(i) ? (
              <circle
                key={`halo-${i}`}
                cx={n.x}
                cy={n.y}
                r={n.r + 8}
                fill="url(#dy-node-glow)"
              >
                <animate
                  attributeName="r"
                  values={`${n.r + 6};${n.r + 12};${n.r + 6}`}
                  dur="5s"
                  begin={`${(i * 0.6) % 3}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.5;1;0.5"
                  dur="5s"
                  begin={`${(i * 0.6) % 3}s`}
                  repeatCount="indefinite"
                />
              </circle>
            ) : null
          )}
        </g>

        {/* Neutral nodes with subtle twinkle */}
        <g className="text-[#B8BECC] dark:text-[#c4b5fd]">
          {nodes.map((n, i) =>
            HIGHLIGHTED.has(i) ? null : (
              <circle key={i} cx={n.x} cy={n.y} r={n.r} fill="currentColor">
                <animate
                  attributeName="opacity"
                  values="0.55;1;0.55"
                  dur={`${3.5 + (i % 4)}s`}
                  begin={`${(i * 0.3) % 4}s`}
                  repeatCount="indefinite"
                />
              </circle>
            )
          )}
        </g>

        {/* Highlighted accent nodes — pulse */}
        <g className="text-[#7C3AED] dark:text-[#c4b5fd]">
          {nodes.map((n, i) =>
            HIGHLIGHTED.has(i) ? (
              <circle key={i} cx={n.x} cy={n.y} r={n.r + 0.6} fill="currentColor">
                <animate
                  attributeName="r"
                  values={`${n.r + 0.4};${n.r + 1.6};${n.r + 0.4}`}
                  dur="4s"
                  begin={`${(i * 0.5) % 2}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.75;1;0.75"
                  dur="4s"
                  begin={`${(i * 0.5) % 2}s`}
                  repeatCount="indefinite"
                />
              </circle>
            ) : null
          )}
        </g>

        {/* Traveling pulse dots along multiple routes */}
        {routes.map(({ a, b, dur, delay }, i) => {
          const n1 = nodes[a];
          const n2 = nodes[b];
          return (
            <circle
              key={`pulse-${i}`}
              r="2.4"
              fill="#7C3AED"
              className="dark:fill-[#c4b5fd]"
            >
              <animate
                attributeName="opacity"
                values="0;1;1;0"
                keyTimes="0;0.15;0.85;1"
                dur={`${dur}s`}
                begin={`${delay}s`}
                repeatCount="indefinite"
              />
              <animateMotion
                dur={`${dur}s`}
                begin={`${delay}s`}
                repeatCount="indefinite"
                path={`M${n1.x},${n1.y} L${n2.x},${n2.y}`}
              />
            </circle>
          );
        })}
      </svg>
    </div>
  );
}

function HeroHeader({ draftsCount, isLoading, totalInteractions, avgRevival }: { draftsCount: number; isLoading: boolean; totalInteractions: number; avgRevival: number }) {
  const stats = [
    { label: "Total Drafts", value: draftsCount.toLocaleString() },
    { label: "Community Interactions", value: totalInteractions.toLocaleString() },
    { label: "Avg. Revival Score", value: avgRevival.toString() },
  ];
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-sm dark:border-[#2a2a3d] dark:bg-[#13131f] sm:p-8">
      <HeroNetwork />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,rgba(124,58,237,0.15),transparent_60%)]" />
      <div className="relative max-w-2xl">
        <h1 className="font-display text-3xl font-bold leading-[1.15] tracking-tight text-foreground dark:text-white sm:text-[48px]">
          Discover unfinished{" "}
          <span className="text-[var(--feed-accent)]">
            ideas.
          </span>
          <br />
          <span className="dark:text-white">Revive what </span>
          <span className="text-[var(--feed-accent)]">
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
  drafts,
  bookmarks,
  onBookmark,
  isLoading,
}: {
  drafts: EnrichedDraft[];
  bookmarks: Set<string>;
  onBookmark: (id: string) => void;
  isLoading: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * 320, behavior: "smooth" });

  if (isLoading || drafts.length === 0) return null;

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
          {drafts.map((d, i) => (
            <TrendingCard
              key={d.id}
              draft={d}
              tint={AVATAR_TINTS[i % AVATAR_TINTS.length]}
              tintIndex={i % AVATAR_TINTS.length}
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

function TrendingArtwork({ tintIndex }: { tintIndex: number }) {
  // Four editorial abstract art variants. Artwork occupies top ~38% of card.
  const variant = tintIndex % 4;
  return (
    <div
      className="feed-trending-art relative h-[110px] w-full overflow-hidden"
      data-variant={variant}
    >
      <div className="feed-trending-art-bg absolute inset-0" />
      <svg
        viewBox="0 0 320 110"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        {variant === 0 && (
          // Orbits — concentric arcs + a bright node (knowledge / focus)
          <g fill="none" stroke="currentColor" strokeLinecap="round">
            <circle cx="230" cy="55" r="70" className="text-white/15" strokeWidth="1" />
            <circle cx="230" cy="55" r="46" className="text-white/25" strokeWidth="1" />
            <circle cx="230" cy="55" r="24" className="text-white/40" strokeWidth="1" />
            <circle cx="230" cy="55" r="6" fill="currentColor" className="text-white/85" stroke="none" />
            <circle cx="176" cy="30" r="3" fill="currentColor" className="text-white/70" stroke="none" />
            <circle cx="284" cy="82" r="2.5" fill="currentColor" className="text-white/60" stroke="none" />
          </g>
        )}
        {variant === 1 && (
          // Overlapping circles — collaboration / union
          <g>
            <circle cx="110" cy="55" r="42" fill="currentColor" className="text-white/25" />
            <circle cx="170" cy="55" r="42" fill="currentColor" className="text-white/25" />
            <circle cx="230" cy="55" r="42" fill="currentColor" className="text-white/15" />
          </g>
        )}
        {variant === 2 && (
          // Layered peaks — progress / momentum
          <g fill="currentColor">
            <path d="M0,110 L0,80 L60,50 L120,72 L180,38 L240,58 L320,32 L320,110 Z" className="text-white/15" />
            <path d="M0,110 L0,92 L70,70 L130,88 L200,60 L260,82 L320,66 L320,110 Z" className="text-white/25" />
            <path d="M0,110 L0,102 L80,90 L160,100 L240,86 L320,96 L320,110 Z" className="text-white/40" />
          </g>
        )}
        {variant === 3 && (
          // Grid of nodes with connections — knowledge graph
          <g>
            <g fill="none" stroke="currentColor" className="text-white/25" strokeWidth="1">
              <line x1="60" y1="30" x2="160" y2="55" />
              <line x1="160" y1="55" x2="260" y2="30" />
              <line x1="60" y1="30" x2="120" y2="85" />
              <line x1="120" y1="85" x2="220" y2="85" />
              <line x1="220" y1="85" x2="260" y2="30" />
              <line x1="160" y1="55" x2="120" y2="85" />
              <line x1="160" y1="55" x2="220" y2="85" />
            </g>
            <g fill="currentColor">
              <circle cx="60" cy="30" r="3.5" className="text-white/70" />
              <circle cx="160" cy="55" r="5" className="text-white/90" />
              <circle cx="260" cy="30" r="3.5" className="text-white/70" />
              <circle cx="120" cy="85" r="3" className="text-white/60" />
              <circle cx="220" cy="85" r="3" className="text-white/60" />
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}

function TrendingCard({
  draft,
  tint: _tint,
  tintIndex,
  bookmarked,
  onBookmark,
}: {
  draft: FeedDraft;
  tint: string;
  tintIndex: number;
  bookmarked: boolean;
  onBookmark: () => void;
}) {
  return (
    <Link
      to="/project/$slug"
      params={{ slug: slugify(draft.projectName) }}
      data-tint={tintIndex}
      className="feed-trending group/tc relative snap-start w-72 shrink-0 flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:border-[var(--feed-accent)] hover:shadow-[0_18px_40px_-18px_var(--feed-glow-rgba)]"
    >
      {/* Artwork header (top ~38%) */}
      <div className="relative">
        <TrendingArtwork tintIndex={tintIndex} />
        <Badge className="absolute left-3 top-3 z-10 rounded-full border-0 bg-black/45 text-[10px] font-medium text-white backdrop-blur">
          <Flame className="mr-1 h-3 w-3" /> Trending
        </Badge>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onBookmark(); }}
          aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
          className="absolute right-3 top-3 z-10 grid h-7 w-7 place-items-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/60"
        >
          {bookmarked ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Info surface */}
      <div className="relative flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-[15px] font-semibold leading-[1.3] tracking-tight text-foreground">
          {draft.projectName}
        </h3>
        <p className="line-clamp-2 text-[12px] leading-[1.5] text-muted-foreground">
          {draft.oneLiner}
        </p>
        <div className="flex flex-wrap gap-1">
          {draft.techStack.slice(0, 3).map((t) => (
            <span
              key={t}
              className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground/80"
            >
              {t}
            </span>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--feed-accent)]/10 px-2.5 py-1 text-[13px] font-bold text-[var(--feed-accent)] ring-1 ring-[var(--feed-accent)]/20">
            <TrendingUp className="h-3.5 w-3.5" />
            {draft.upvotes.toLocaleString()}
          </span>
          {draft.raisedHands && draft.raisedHands.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/12 px-2 py-0.5 text-[10px] font-medium text-emerald-600 ring-1 ring-emerald-500/30 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-300" /> Open
            </span>
          )}
        </div>
      </div>
    </Link>
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
  selectedTechStack,
  onTechStackChange,
  selectedStages,
  onStagesChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  sortBy,
  onSortChange,
}: {
  tab: "all" | "open" | "recent" | "revived";
  onTab: (t: "all" | "open" | "recent" | "revived") => void;
  query: string;
  onQuery: (v: string) => void;
  selectedTechStack: string[];
  onTechStackChange: (v: string[]) => void;
  selectedStages: string[];
  onStagesChange: (v: string[]) => void;
  selectedCategory: string;
  onCategoryChange: (v: string) => void;
  selectedStatus: string;
  onStatusChange: (v: string) => void;
  sortBy: "newest" | "mostviewed" | "mostliked" | "recentlyupdated";
  onSortChange: (v: "newest" | "mostviewed" | "mostliked" | "recentlyupdated") => void;
}) {
  const TABS: { id: typeof tab; label: string }[] = [
    { id: "all", label: "All Drafts" },
    { id: "open", label: "Open for Revival" },
    { id: "recent", label: "Recently Stalled" },
    { id: "revived", label: "Most Revived" },
  ];

  const TECH_OPTIONS = ["React", "Node.js", "Next.js", "Python", "Flutter", "TypeScript", "PostgreSQL", "MongoDB"];
  const STAGE_OPTIONS = ["Idea only", "Prototype", "50% done", "Almost complete", "Launched but abandoned"];
  const CATEGORY_OPTIONS = ["web", "mobile", "ml", "game", "hardware", "other"];
  const SORT_OPTIONS = [
    { id: "newest" as const, label: "Newest" },
    { id: "mostviewed" as const, label: "Most Viewed" },
    { id: "mostliked" as const, label: "Most Liked" },
    { id: "recentlyupdated" as const, label: "Recently Updated" },
  ];

  return (
    <div
      id="feed"
      className="sticky top-2 z-20 space-y-3 rounded-2xl border border-border/60 bg-card/85 dark:border-[#2a2a3d] dark:bg-[#13131f]/85 p-3 shadow-sm backdrop-blur-md"
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => onTab(t.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-[180ms] ${
                tab === t.id
                  ? "feed-tab-active bg-[var(--feed-accent)] text-white shadow-[0_4px_20px_-6px_var(--feed-glow-rgba)]"
                  : "bg-transparent text-muted-foreground hover:bg-[var(--feed-accent)]/10 hover:text-[var(--feed-accent)]"
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
        <MultiSelectDropdown 
          label="Tech Stack" 
          options={TECH_OPTIONS}
          selected={selectedTechStack}
          onChange={onTechStackChange}
        />
        <MultiSelectDropdown 
          label="Stage" 
          options={STAGE_OPTIONS}
          selected={selectedStages}
          onChange={onStagesChange}
        />
        <SingleSelectDropdown 
          label="Category" 
          options={CATEGORY_OPTIONS}
          selected={selectedCategory}
          onChange={onCategoryChange}
        />
        <div className="ml-auto">
          <SingleSelectDropdown 
            label={`Sort: ${SORT_OPTIONS.find(s => s.id === sortBy)?.label || 'Newest'}`}
            options={SORT_OPTIONS.map(s => s.id)}
            selected={sortBy}
            onChange={(v) => onSortChange(v as typeof sortBy)}
          />
        </div>
      </div>
    </div>
  );
}

function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (o: string) => {
    onChange(selected.includes(o) ? selected.filter((x) => x !== o) : [...selected, o]);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 rounded-full border-border/60 bg-background/70 text-xs font-medium"
        >
          {selected.length > 0 ? `${label} (${selected.length})` : label}
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

function SingleSelectDropdown({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string;
  onChange: (v: string) => void;
}) {
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
          <DropdownMenuItem
            key={o}
            onClick={() => onChange(o)}
            className={`text-xs ${selected === o ? 'bg-primary/10' : ''}`}
          >
            {o}
          </DropdownMenuItem>
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
  onRaise,
  isLoading,
}: {
  items: EnrichedDraft[];
  bookmarks: Set<string>;
  upvoted: Set<string>;
  onBookmark: (id: string) => void;
  onUpvote: (id: string) => void;
  onRaise: (projectName: string) => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/60 bg-card p-4 animate-pulse">
            <div className="h-32 bg-muted rounded" />
            <div className="mt-4 h-4 w-24 bg-muted rounded" />
            <div className="mt-2 h-3 w-full bg-muted rounded" />
            <div className="mt-4 h-2 w-full bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="col-span-full rounded-2xl border border-dashed border-border/60 p-12 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
        <h3 className="mt-3 font-semibold">No drafts found</h3>
        <p className="text-sm text-muted-foreground">Try adjusting your filters or search</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((d, i) => (
        <FeedCard
          key={d.id}
          draft={d}
          tint={AVATAR_TINTS[hashStr(d.projectName) % AVATAR_TINTS.length]}
          bookmarked={bookmarks.has(d.id)}
          upvoted={upvoted.has(d.id)}
          onBookmark={() => onBookmark(d.id)}
          onUpvote={() => onUpvote(d.id)}
          onRaise={() => onRaise(d.projectName)}
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
  const r = 24;
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
        <div className={`font-display text-[20px] font-bold leading-none ${c.text}`}>{value}</div>
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
  onRaise,
  index,
}: {
  draft: FeedDraft & { stallPattern?: string; aiInsight?: string; stallAnalyzed?: boolean };
  tint: string;
  bookmarked: boolean;
  upvoted: boolean;
  onBookmark: () => void;
  onUpvote: () => void;
  onRaise: () => void;
  index: number;
}) {
  const { isAuthenticated } = useAuth();
  const [likes, setLikes] = useState(draft.likes || 0);
  const [liked, setLiked] = useState(draft.liked || false);
  const [isLoadingLike, setIsLoadingLike] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const viewedRef = useRef(false);

  // Update local state when draft data changes (e.g., after refresh)
  useEffect(() => {
    setLikes(draft.likes || 0);
    setLiked(draft.liked || false);
  }, [draft.likes, draft.liked, draft._id]);

  // Track view when card becomes visible
  useEffect(() => {
    if (!cardRef.current || viewedRef.current) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting && !viewedRef.current) {
          viewedRef.current = true;
          // Record view asynchronously
          recordView(draft._id || draft.id, `session-${Math.random()}`).catch(() => {
            // Silently fail if view tracking fails
          });
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [draft._id, draft.id]);

  const handleLike = async () => {
    try {
      setIsLoadingLike(true);
      // Optimistic update
      setLiked(!liked);
      setLikes(liked ? likes - 1 : likes + 1);
      
      // Call backend - it will invalidate cache
      await likeDraft(draft._id || draft.id);
    } catch (err) {
      // Revert on error
      setLiked(!liked);
      setLikes(liked ? likes + 1 : likes - 1);
      toast.error("Failed to update like");
    } finally {
      setIsLoadingLike(false);
    }
  };

  return (
    <motion.article
      ref={cardRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.03, ease: [0.22, 1, 0.36, 1] }}
      className={`group/card relative flex flex-col gap-3 overflow-hidden rounded-2xl border bg-card p-5 leading-[1.5] shadow-sm transition-all duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:border-[var(--feed-accent)] hover:shadow-[0_18px_40px_-18px_var(--feed-glow-rgba)] dark:border-[#2a2a3d] dark:bg-[#13131f]`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${tint} font-display text-base font-bold text-white shadow-sm`}
          >
            {draft.projectName.slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <h3 className="text-[16px] font-semibold leading-[1.3] tracking-tight text-foreground">
                {draft.projectName}
              </h3>
              <button
                onClick={onBookmark}
                disabled={!isAuthenticated}
                aria-label="Bookmark"
                title={!isAuthenticated ? "Sign in to bookmark" : ""}
                className="mt-0.5 text-muted-foreground transition-colors hover:text-[var(--feed-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bookmarked ? (
                  <BookmarkCheck className="h-3.5 w-3.5" />
                ) : (
                  <Bookmark className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <p className="mt-1 text-xs leading-[1.5] text-muted-foreground">
              {draft.oneLiner}
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="shrink-0 rounded-full border-border/60 bg-background/60 text-[10px] font-medium dark:border-[#2a2a3d] dark:bg-[#0d0d14]"
        >
          {draft.currentStage}
        </Badge>
      </div>

      {/* Tech pills */}
      <div className="flex flex-wrap items-center gap-1">
        {draft.techStack.slice(0, 4).map((t) => (
          <span
            key={t}
            className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground dark:border-[#2a2a3d] dark:bg-[#0d0d14]"
          >
            {t}
          </span>
        ))}
      </div>

      {/* Tags and metrics */}
      <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Eye className="h-3 w-3" /> {(draft.views || 0).toLocaleString()} views
        </span>
        <span className="flex items-center gap-1">
          <Heart className="h-3 w-3" /> {likes.toLocaleString()} likes
        </span>
        {draft.tags && draft.tags.length > 0 && (
          <span className="line-clamp-1">{draft.tags.join(", ")}</span>
        )}
      </div>

      {/* Bottom: like + bookmark + action buttons */}
      <div className="mt-auto flex flex-col gap-3 pt-1">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={handleLike}
            disabled={isLoadingLike}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold transition-all duration-[180ms] disabled:opacity-50 ${
              liked
                ? "bg-red-500/20 text-red-600 dark:text-red-400"
                : "bg-muted/50 text-muted-foreground hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400"
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${liked ? 'fill-current' : ''}`} /> {likes}
          </button>
          <Button
            onClick={onRaise}
            size="sm"
            className="h-7 gap-1 rounded-full px-2.5 text-[11px] font-semibold"
            disabled={!isAuthenticated}
            title={!isAuthenticated ? "Sign in to raise hand" : ""}
          >
            <Hand className="h-3 w-3" /> Raise Hand
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">{draft.timeAgo}</span>
          <Link
            to="/project/$slug"
            params={{ slug: slugify(draft.projectName) }}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--feed-accent)] transition-all duration-[220ms] hover:gap-1.5"
          >
            View Draft <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

// ————————————————————————————————————————————————————————————————
// Right sidebar cards
// ————————————————————————————————————————————————————————————————

function InsightsCard({ draftsCount, totalInteractions, avgRevival }: { draftsCount: number; totalInteractions: number; avgRevival: number }) {
  const rows = [
    { label: "Projects Available", value: draftsCount.toString(), trend: "Live" },
    { label: "Community Interactions", value: totalInteractions.toString(), trend: "Active" },
    { label: "Avg. Revival Score", value: avgRevival.toString(), trend: "↑" },
  ];
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm dark:border-[#2a2a3d] dark:bg-[#13131f]">
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

function StallPatternsCard({ patterns }: { patterns: Array<{ label: string; value: number }> }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm dark:border-[#2a2a3d] dark:bg-[#13131f]">
      <h3 className="flex items-center gap-1.5 font-display text-sm font-semibold tracking-tight">
        Top Stall Patterns (ML) <Info className="h-3 w-3 text-muted-foreground" />
      </h3>
      <ul className="mt-4 space-y-3">
        {patterns.map((p) => (
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
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm dark:border-[#2a2a3d] dark:bg-[#13131f]">
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


// ————————————————————————————————————————————————————————————————
// Raise Hand Modal (from Revival Board)
// ————————————————————————————————————————————————————————————————

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
      <DialogContent className="max-w-lg overflow-hidden border-none p-0 [&>button]:hidden">
        <div className="relative p-6">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-full border border-border/60 bg-background/60 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <DialogHeader className="text-left">
            <DialogTitle className="flex items-center gap-2 font-display text-lg">
              <Hand className="h-4 w-4 text-[var(--feed-accent)]" />
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
                  className="bg-muted/40"
                />
              </FieldRow>
              <div className="grid grid-cols-2 gap-3">
                <FieldRow label="Your Name">
                  <Input placeholder="Dev Cosmos" />
                </FieldRow>
                <FieldRow label="Contact">
                  <Input placeholder="email / discord / github" />
                </FieldRow>
              </div>
              <FieldRow label="Why do you want to revive this project?">
                <Textarea
                  rows={3}
                  placeholder="Share why this excites you and what you'd bring…"
                  className="resize-none"
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
                            ? "border-[var(--feed-accent)] bg-[var(--feed-accent)]/10 text-[var(--feed-accent)]"
                            : "border-border/60 text-muted-foreground hover:border-[var(--feed-accent)]/40"
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
                  <SelectTrigger>
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
              className="rounded-full px-4"
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
