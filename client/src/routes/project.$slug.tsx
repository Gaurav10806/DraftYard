import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  type Draft,
  navigateToWorkspace,
  updateDraftInsights,
  raiseHand,
  getRevivalEligibility,
  markProjectRevived,
} from "@/lib/api";
import { useBookmarkDraftMutation } from "@/hooks/use-drafts";
import { getInitials } from "@/lib/utils";
import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
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
  Edit3,
  LogOut,
  UserCircle,
  Settings,
  Hand,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { drafts } from "@/data/drafts";
import { fetchFeed } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { getOwnerToken } from "@/lib/owner-token";
import { JoinRequestModal } from "@/components/JoinRequestModal";

export const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const Route = createFileRoute("/project/$slug")({
  head: () => ({
  meta: [
    { title: "DraftYard Project" },
    {
      name: "description",
      content:
        "Explore projects on DraftYard — discussions, contributors, activity and AI insights.",
    },
    { property: "og:title", content: "DraftYard Project" },
  ],
}),
  loader: async ({ params }) => {
    try {
      // Try to fetch from feed first to get the draft ID
      let allDrafts: Draft[] = [];
      let page = 1;
      let hasMore = true;
      
      while (hasMore) {
        const result = await fetchFeed({ page, limit: 50 });
        allDrafts = allDrafts.concat(result.data);
        hasMore = result.pagination.hasMore;
        page++;
      }
      
      const draft = allDrafts.find((d) => slugify(d.projectName) === params.slug || d._id === params.slug || (d as any).id === params.slug);
      if (draft) {
        // Now fetch the enriched data from the backend endpoint
        try {
          const draftId = (draft._id || (draft as any).id)?.toString();
          
          // Get auth token from localStorage if available
          const token = typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') : null;
          const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
          
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/draft/${draftId}`, {
            headers
          });
          if (response.ok) {
            const overview = await response.json();
            // Attach the backend data to the draft
            const enrichedDraft = overview.project as Draft & { __projectOverview: any };
            enrichedDraft.__projectOverview = {
              stallDNA: overview.stallDNA,
              similarProjects: overview.similarProjects,
              strengths: overview.strengths,
            };
            return { draft: enrichedDraft };
          }
        } catch (e) {
          console.warn("Failed to fetch enriched project data:", e);
        }
        return { draft };
      }
    } catch (e) {
      console.warn("Failed to load drafts from server, falling back to static:", e);
    }
    const staticDraft = drafts.find((d) => slugify(d.projectName) === params.slug || (d as any).id === params.slug || (d as any)._id === params.slug);
    if (!staticDraft) throw notFound();
    // Cast static draft to API Draft shape (no _id/submittedBy — ownership check will be false)
    return { draft: staticDraft as Draft };
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
type TabId = "overview" | "discussions" | "collaboration";

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

const AI_SUGGESTIONS = [
  "Improve state management using Zustand or Redux Toolkit.",
  "Add dark mode to enhance user experience.",
  "Fix dashboard responsiveness on mobile devices.",
  "Introduce end-to-end testing with Playwright or Cypress.",
  "Add role-based access control for different team members.",
  "Implement optimistic UI updates to improve perceived performance.",
  "Set up a CI/CD pipeline using GitHub Actions.",
  "Add API rate limiting and error boundary handling.",
];

const DISCUSSION_TAGS = ["Idea", "Problem", "Question", "General"] as const;
// ————————————————————————————————————————————————————————————
// Stall DNA Computation
// ————————————————————————————————————————————————————————————
type StallDNAResult = {
  frontend: number;
  stateManagement: number;
  performance: number;
  consistency: number;
} | null;

function computeStallDNA(draft: Draft): StallDNAResult {
  try {
    // Check if we have sufficient data
    if (!draft.techStack || !Array.isArray(draft.techStack) || draft.techStack.length === 0) {
      return null;
    }

    const techStack = draft.techStack.map((t) => t.toLowerCase());
    const totalTechs = techStack.length;

    // ———————— HELPER: Normalize scores to 0-100 ————————
    const normalize = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

    // ———————— DATA EXTRACTION ————————
    // Frontend & State Management tech ratios
    const frontendTechs = ["react", "next.js", "next", "vue", "angular", "svelte", "html", "css", "tailwind", "bootstrap"];
    const frontendCount = techStack.filter((t) => frontendTechs.some((ft) => t.includes(ft))).length;
    const frontendTechRatio = (frontendCount / totalTechs) * 100;

    const stateLibs = ["redux", "zustand", "mobx", "context api", "context", "recoil", "jotai", "xstate"];
    const stateCount = techStack.filter((t) => stateLibs.some((sl) => t.includes(sl))).length;
    const stateLibRatio = (stateCount / totalTechs) * 100;

    // Contributor activity - Fixed: use correct field names
    const contributorCount = draft.collaborators?.length || 0;
    const raisedHandsCount = draft.raisedHands?.length || 0;
    const hasActivity = contributorCount > 0 || raisedHandsCount > 0;

    // Documentation score
    const descLength = draft.description?.length || 0;
    const hasDescription = descLength > 0;
    const documentationScore = Math.min(100, (descLength / 500) * 100); // 500 chars = 100%

    // Recency/Update frequency - Fixed: handle missing dates gracefully
    const lastUpdated = draft.updatedAt || draft.createdAt;
    let inactivityDays = 365; // Default to 1 year if no date
    if (lastUpdated) {
      try {
        const lastUpdateDate = new Date(lastUpdated);
        if (!isNaN(lastUpdateDate.getTime())) {
          const now = new Date();
          inactivityDays = (now.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60 * 24);
        }
      } catch (e) {
        inactivityDays = 365; // Default on date parsing error
      }
    }
    // Inactivity penalty: 5% per month inactive, max 50%
    const inactivityPenalty = Math.min(50, Math.max(0, (inactivityDays / 30) * 5));

    // Stage completion proxy
    const stageMap: Record<string, number> = {
      "idea": 15,
      "planning": 30,
      "prototype": 40,
      "50% done": 50,
      "backend development": 60,
      "ui/ux design": 50,
      "almost complete": 85,
      "shipped": 100,
    };
    const stage = (draft.currentStage || "").toLowerCase();
    let completionPercentage = stageMap[stage] || 35;

    // Failure reason analysis - Fixed: handle missing failureReason
    const stallReasonLower = (draft.failureReason || "").toLowerCase();
    const performanceIssues = ["performance", "slow", "optimization", "latency", "memory", "cpu", "render", "bundle", "api bottleneck"].some(
      (kw) => stallReasonLower.includes(kw)
    );
    const frontendIssues = ["ui", "ux", "design", "frontend", "polish", "responsive", "css", "styling"].some((kw) => stallReasonLower.includes(kw));
    const architectureIssues = ["architecture", "technical debt", "refactor", "structure", "complexity"].some((kw) => stallReasonLower.includes(kw));

    // Revival potential
    const isOpenForRevival = draft.openForRevival || draft.revivalStatus === "open_for_revival";

    // ———————— WEIGHTED SCORING ————————
    // FRONTEND SCORE (40% tech ratio + 30% frontend issues penalty + 30% documentation)
    let frontendScore = frontendTechRatio * 0.4; // 40% from tech ratio
    if (frontendIssues) {
      frontendScore += 0; // Penalty applied below
    } else {
      frontendScore += 15; // Bonus if no frontend issues
    }
    frontendScore += documentationScore * 0.3; // 30% from documentation (proxy for frontend task clarity)
    frontendScore = frontendScore - (frontendIssues ? 20 : 0); // Penalty for frontend issues

    // STATE MANAGEMENT SCORE (40% lib ratio + 30% architecture complexity + 30% collaboration)
    let stateManagementScore = stateLibRatio * 0.4; // 40% from state lib ratio
    // Architecture complexity: deduct if many unrelated techs (high complexity)
    const architectureComplexity = Math.min(50, Math.max(0, (totalTechs - 2) * 5)); // Penalty for tech diversity
    stateManagementScore += (100 - architectureComplexity) * 0.3; // 30% from architecture simplicity
    stateManagementScore += Math.min(100, (contributorCount + raisedHandsCount) * 10) * 0.3; // 30% from collaboration (FIXED: use contributorCount)

    // PERFORMANCE SCORE (100 - weighted penalties - inactivity - low completion)
    let performanceScore = 100;
    performanceScore -= performanceIssues ? 25 : 0; // Penalty for performance issues
    performanceScore -= architectureIssues ? 15 : 0; // Penalty for arch issues
    performanceScore -= inactivityPenalty; // Penalty for inactivity
    performanceScore -= Math.max(0, (100 - completionPercentage) * 0.3); // Penalty for low completion

    // CONSISTENCY SCORE (25% docs + 25% activity + 25% completion + 25% recency)
    let consistencyScore = 0;
    consistencyScore += documentationScore * 0.25; // 25% documentation
    consistencyScore += (hasActivity ? 25 : 0); // 25% contributor activity presence
    consistencyScore += completionPercentage * 0.25; // 25% task/stage completion
    consistencyScore += (100 - inactivityPenalty) * 0.25; // 25% update frequency (inverse of inactivity)

    // If not open for revival, apply a modest penalty to consistency
    if (!isOpenForRevival) {
      consistencyScore *= 0.85; // 15% consistency penalty for closed projects
    }

    // ———————— NORMALIZE AND RETURN ————————
    return {
      frontend: normalize(frontendScore),
      stateManagement: normalize(stateManagementScore),
      performance: normalize(performanceScore),
      consistency: normalize(consistencyScore),
    };
  } catch (error) {
    // Fault tolerance: log error but don't crash
    console.warn("Error computing Stall DNA:", error);
    return null;
  }
}

// Stall DNA display data with colors
function getStallDNADisplay(dna: StallDNAResult) {
  if (!dna) return null;
  return [
    { label: "Frontend", value: dna.frontend, color: "#a78bfa" },
    { label: "State Mgmt", value: dna.stateManagement, color: "#f472b6" },
    { label: "Performance", value: dna.performance, color: "#f59e0b" },
    { label: "Consistency", value: dna.consistency, color: "#22d3ee" },
  ];
}

// ————————————————————————————————————————————————————————————
// Page
// ————————————————————————————————————————————————————————————
function ProjectPage() {
  const loaderData = Route.useLoaderData() as { draft: Draft };
  const draft = loaderData.draft;
  if (!draft) return null;
  const [tab, setTab] = useState<TabId>("overview");
  const [bookmarked, setBookmarked] = useState(draft.bookmarked === true);
  const bookmarkMutation = useBookmarkDraftMutation();
  const { user } = useAuth();

  // Update bookmarked state when mutation succeeds
  useEffect(() => {
    if (bookmarkMutation.isSuccess && bookmarkMutation.data) {
      setBookmarked(bookmarkMutation.data.bookmarked === true);
    }
  }, [bookmarkMutation.isSuccess, bookmarkMutation.data]);

  // Ownership: logged-in user matches submittedBy._id, OR ownerToken matches
  const isOwner =
    (user && draft.submittedBy && typeof draft.submittedBy === 'object' && '_id' in draft.submittedBy && draft.submittedBy._id === user._id) ||
    (draft.ownerToken && draft.ownerToken === getOwnerToken());

  const isCollaborator = Boolean(
    user &&
      draft.collaborators &&
      Array.isArray(draft.collaborators) &&
      draft.collaborators.some((c) =>
        typeof c === "object" && c !== null ? c._id === user._id : String(c) === String(user._id)
      )
  );

  const canManage = isOwner || isCollaborator;

  const hasRequestedJoin = Boolean(
    user &&
      draft.raisedHands &&
      Array.isArray(draft.raisedHands) &&
      draft.raisedHands.some((rh: any) =>
        rh.userId === user._id || (rh.userId && typeof rh.userId === 'object' && rh.userId._id === user._id)
      )
  );

  // Request to Join modal state
  const [joinOpen, setJoinOpen] = useState(false);

  const handleRequestJoinSubmit = async (data: {
    name: string;
    contact: string;
    message: string;
    skills: string[];
    estimatedTime: string;
  }) => {
    if (!draft._id) {
      toast.error("Project ID missing.");
      return;
    }
    await raiseHand({
      id: draft._id,
      name: data.name,
      contact: data.contact,
      message: data.message,
      skills: data.skills,
      estimatedTime: data.estimatedTime,
    });
    toast.success("Request sent! The project owner will receive a notification.");
  };

  return (
    <SidebarProvider>
      <JoinRequestModal
        projectName={draft.projectName}
        open={joinOpen}
        onOpenChange={setJoinOpen}
        onSubmit={handleRequestJoinSubmit}
        title="Request to Join Project"
        subtitle={`Tell the owner of ${draft.projectName} why you want to collaborate and what skills you bring.`}
      />

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
                onBookmark={() => {
                  if (draft._id) {
                    bookmarkMutation.mutate(draft._id);
                  }
                }}
                onRequestJoin={() => setJoinOpen(true)}
                onShare={() => {
                  const url = window.location.href;
                  if (navigator.share) {
                    navigator.share({ title: draft.projectName, url }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(url).then(() => {
                      toast.success("Link copied to clipboard!");
                    }).catch(() => {
                      toast.error("Could not copy link.");
                    });
                  }
                }}
                isOwner={!!isOwner}
                canManage={canManage}
              />
              <ProjectTabs tab={tab} onTab={setTab} />
              <div className="h-6" />
              {tab === "overview" && <OverviewTab draft={draft} onViewDiscussions={() => setTab("discussions")} />}
              {tab === "discussions" && <DiscussionsTab />}
              {tab === "collaboration" && <CollaborationTab draft={draft} onApply={() => setJoinOpen(true)} />}
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();

 const initials = getInitials(user?.name, user?.email);

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
              }}
              className="text-rose-500 focus:text-rose-500"
            >
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function getOwnerName(submittedBy: any): string {
  if (!submittedBy) return "Project Owner";
  if (typeof submittedBy === "object" && submittedBy.name) return submittedBy.name;
  if (typeof submittedBy === "string" && submittedBy.trim()) return submittedBy;
  return "Project Owner";
}

// ————————————————————————————————————————————————————————————
// Hero (logo, meta, revival score, actions, dotted node graphic)
// ————————————————————————————————————————————————————————————
function ProjectHero({
  draft,
  bookmarked,
  onBookmark,
  onShare,
  onRequestJoin,
  canManage,
  isOwner,
}: {
  draft: Draft;
  bookmarked: boolean;
  onBookmark: () => void;
  onShare: () => void;
  onRequestJoin: () => void;
  canManage: boolean;
  isOwner: boolean;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isCollaborator = Boolean(
    user &&
      draft.collaborators &&
      Array.isArray(draft.collaborators) &&
      draft.collaborators.some((c) =>
        typeof c === "object" && c !== null ? c._id === user._id : String(c) === String(user._id)
      )
  );

  const hasRequestedJoin = Boolean(
    user &&
      draft.raisedHands &&
      Array.isArray(draft.raisedHands) &&
      draft.raisedHands.some((rh: any) =>
        rh.userId === user._id || (rh.userId && typeof rh.userId === 'object' && rh.userId._id === user._id)
      )
  );

  const [localRevivalStatus, setLocalRevivalStatus] = useState(draft.revivalStatus || 'open_for_revival');
  const [isMarkingRevived, setIsMarkingRevived] = useState(false);

  const { data: eligibility } = useQuery({
    queryKey: ["revival-eligibility", draft._id],
    queryFn: () => getRevivalEligibility(draft._id || ""),
    enabled: !!draft._id && !!isOwner && localRevivalStatus !== 'revived',
  });

  const handleMarkRevived = async () => {
    if (!draft._id) return;
    setIsMarkingRevived(true);
    try {
      await markProjectRevived(draft._id);
      setLocalRevivalStatus('revived');
      toast.success("Congratulations! Project has been successfully marked as Revived! 🔥");
    } catch (err: any) {
      toast.error(err.message || "Failed to mark project as revived");
    } finally {
      setIsMarkingRevived(false);
    }
  };

  const raisedHandsCount = draft.raisedHands?.length || 0;
  const communityLikes = draft.likes || 0;
  const bookmarks = draft.bookmarks || 0;
  const revivalScore = Math.min(99, Math.max(35, 45 + communityLikes * 2 + raisedHandsCount * 15 + bookmarks * 3));

  const handleContinueEditing = async () => {
    if (!draft._id) {
      toast.error("Invalid draft. Please refresh and try again.");
      return;
    }

    await navigateToWorkspace(draft._id, draft.projectName, navigate, (msg) => toast.error(msg));
  };

  const ownerName = getOwnerName(draft.submittedBy);

  const ownerInitials = ownerName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "PO";

  const createdDate = (draft as any).createdAt
    ? new Date((draft as any).createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "Recently";

  const updatedDate = (draft as any).updatedAt || draft.lastWorkedOn
    ? new Date((draft as any).updatedAt || draft.lastWorkedOn!).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "Recently";

  return (
    <section className="project-hero relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
      <ProjectNodeNetwork variant="hero" />
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
            {localRevivalStatus === 'revived' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/12 px-2.5 py-1 text-xs font-medium text-orange-600 ring-1 ring-orange-500/30 dark:text-orange-300">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500 dark:bg-orange-300" />
                🔥 Revived
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/12 px-2.5 py-1 text-xs font-medium text-purple-600 ring-1 ring-purple-500/30 dark:text-purple-300">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-500 dark:bg-purple-300" />
                🟣 Open for Revival
              </span>
            )}
            {isOwner && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary ring-1 ring-primary/20">
                Your Project
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
                  {ownerInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-muted-foreground">By {ownerName}</div>
                <div className="font-medium">Project Owner</div>
              </div>
            </div>
            <MetaCol label="Category" value={draft.category || "General"} />
            <MetaCol label="Domain" value={draft.domain || "N/A"} />
            <MetaCol label="Buried" value={createdDate} />
            <MetaCol label="Activity" value={updatedDate} />
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

        {/* Actions — owner/collaborator vs public */}
        <div className="flex w-full flex-col gap-2 lg:w-52">
          {isOwner ? (
            <Button
              onClick={handleContinueEditing}
              className="w-full gap-2 rounded-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-[0_10px_30px_-10px_color-mix(in_oklab,var(--primary)_60%,transparent)] hover:brightness-110"
            >
              <Edit3 className="h-4 w-4" /> Manage Workspace
            </Button>
          ) : isCollaborator ? (
            <Button
              onClick={handleContinueEditing}
              className="w-full gap-2 rounded-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-[0_10px_30px_-10px_color-mix(in_oklab,var(--primary)_60%,transparent)] hover:brightness-110"
            >
              <Edit3 className="h-4 w-4" /> Open Workspace
            </Button>
          ) : hasRequestedJoin ? (
            <Button
              disabled
              className="w-full gap-2 rounded-lg bg-muted text-muted-foreground cursor-not-allowed border border-border/40"
            >
              <Send className="h-4 w-4" /> Request Pending
            </Button>
          ) : (
            <Button
              onClick={onRequestJoin}
              className="w-full gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-[0_10px_30px_-10px_rgba(139,92,246,0.55)] hover:from-violet-600 hover:to-fuchsia-600"
            >
              <Send className="h-4 w-4" /> Request to Join
            </Button>
          )}

          {isOwner && localRevivalStatus !== 'revived' && eligibility?.isEligible && (
            <Button
              onClick={handleMarkRevived}
              disabled={isMarkingRevived}
              className="w-full gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-[0_10px_30px_-10px_rgba(249,115,22,0.55)] hover:brightness-110"
            >
              🔥 Mark as Revived
            </Button>
          )}

          <Button variant="outline" onClick={onBookmark} className="w-full gap-2 rounded-lg">
            <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-current" : ""}`} /> Bookmark
          </Button>
          <Button variant="outline" onClick={onShare} className="w-full gap-2 rounded-lg">
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
    { id: "collaboration", label: "Collaboration", icon: Users },
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
// Similar Projects Similarity Scoring
// ————————————————————————————————————————————————————————————

/**
 * Calculate Jaccard similarity between two tech stacks
 * Jaccard = (intersection / union) × 100
 */
function calcTechStackSimilarity(stack1: string[] = [], stack2: string[] = []): number {
  if (!stack1.length || !stack2.length) return 0;
  
  const set1 = new Set(stack1.map((t) => t.toLowerCase()));
  const set2 = new Set(stack2.map((t) => t.toLowerCase()));
  
  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  if (union.size === 0) return 0;
  return (intersection.size / union.size) * 100;
}

/**
 * Calculate domain similarity
 * Same domain = 100, related domains = 60, different = 0
 */
function calcDomainSimilarity(domain1: string = "", domain2: string = ""): number {
  if (!domain1 || !domain2) return 0;
  
  const d1 = domain1.toLowerCase();
  const d2 = domain2.toLowerCase();
  
  // Exact match
  if (d1 === d2) return 100;
  
  // Related domains mapping
  const relatedDomains: Record<string, string[]> = {
    "web": ["frontend", "backend", "fullstack", "saas"],
    "mobile": ["ios", "android", "cross-platform"],
    "ml": ["ai", "data-science", "nlp", "computer-vision"],
    "devtools": ["cli", "ide", "build-tool"],
  };
  
  // Check if domains are related
  for (const [key, related] of Object.entries(relatedDomains)) {
    if ((d1 === key && related.includes(d2)) || (d2 === key && related.includes(d1))) {
      return 60;
    }
  }
  
  return 0;
}

/**
 * Calculate stage similarity
 * Same stage = 100, adjacent = 70, otherwise = 30
 */
function calcStageSimilarity(stage1: string = "", stage2: string = ""): number {
  if (!stage1 || !stage2) return 30;
  
  const s1 = stage1.toLowerCase();
  const s2 = stage2.toLowerCase();
  
  // Exact match
  if (s1 === s2) return 100;
  
  // Stage progression order
  const stageOrder = [
    "idea",
    "planning",
    "prototype",
    "50% done",
    "backend development",
    "ui/ux design",
    "almost complete",
    "shipped",
  ];
  
  const idx1 = stageOrder.findIndex((s) => s1.includes(s));
  const idx2 = stageOrder.findIndex((s) => s2.includes(s));
  
  if (idx1 === -1 || idx2 === -1) return 30;
  
  // Adjacent stages
  if (Math.abs(idx1 - idx2) === 1) return 70;
  
  return 30;
}

/**
 * Calculate failure reason similarity
 * Keyword overlap normalized to 0-100
 */
function calcFailureReasonSimilarity(reason1: string = "", reason2: string = ""): number {
  if (!reason1 || !reason2) return 0;
  
  const r1 = reason1.toLowerCase();
  const r2 = reason2.toLowerCase();
  
  // Extract words (length > 3 chars to avoid common words)
  const words1 = new Set(r1.split(/\s+/).filter((w) => w.length > 3));
  const words2 = new Set(r2.split(/\s+/).filter((w) => w.length > 3));
  
  if (words1.size === 0 && words2.size === 0) return 0;
  
  const intersection = new Set([...words1].filter((x) => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  if (union.size === 0) return 0;
  return (intersection.size / union.size) * 100;
}

/**
 * Calculate project size similarity
 * Based on collaborators, description length, and tech stack complexity
 */
function calcProjectSizeSimilarity(project1: Draft, project2: Draft): number {
  // Size metrics
  const getSize = (p: Draft) => {
    const collaboratorScore = (p.collaborators?.length || 0) * 15; // Max 60 for team size
    const descScore = Math.min(40, ((p.description?.length || 0) / 500) * 40); // Max 40 for doc
    const techScore = Math.min(20, (p.techStack?.length || 0) * 2.5); // Max 20 for tech variety
    return collaboratorScore + descScore + techScore;
  };
  
  const size1 = getSize(project1);
  const size2 = getSize(project2);
  
  // Normalize to 0-100 based on difference
  const maxSize = 120; // Max possible size score
  const normalizedSize1 = Math.min(100, (size1 / maxSize) * 100);
  const normalizedSize2 = Math.min(100, (size2 / maxSize) * 100);
  
  // Similarity: inverse of difference
  const difference = Math.abs(normalizedSize1 - normalizedSize2);
  return 100 - difference;
}

/**
 * Calculate weighted similarity score between two projects
 * Weights: 35% tech, 25% domain, 20% stage, 10% failure reason, 10% project size
 */
function calcProjectSimilarity(baseProject: Draft, candidateProject: Draft): number {
  const techScore = calcTechStackSimilarity(baseProject.techStack, candidateProject.techStack);
  const domainScore = calcDomainSimilarity(baseProject.domain, candidateProject.domain);
  const stageScore = calcStageSimilarity(baseProject.currentStage, candidateProject.currentStage);
  const failureScore = calcFailureReasonSimilarity(baseProject.failureReason, candidateProject.failureReason);
  const sizeScore = calcProjectSizeSimilarity(baseProject, candidateProject);
  
  // Weighted combination
  const finalScore =
    techScore * 0.35 +
    domainScore * 0.25 +
    stageScore * 0.2 +
    failureScore * 0.1 +
    sizeScore * 0.1;
  
  return Math.round(finalScore);
}

// ————————————————————————————————————————————————————————————
// OVERVIEW TAB
// ————————————————————————————————————————————————————————————
function OverviewTab({ draft, onViewDiscussions }: { draft: Draft; onViewDiscussions: () => void }) {
  // Use backend-provided data if available from ProjectOverview
  const projectOverview = (draft as any).__projectOverview || null;
  const backendStallDNA = projectOverview?.stallDNA || null;
  const backendSimilarProjects = projectOverview?.similarProjects || [];

  // Stall DNA display data
  const getStallDNADisplay = (dna: any) => {
    if (!dna) return null;
    return [
      { label: "Frontend", value: dna.frontend, color: "#a78bfa" },
      { label: "State Mgmt", value: dna.stateManagement, color: "#f472b6" },
      { label: "Performance", value: dna.performance, color: "#f59e0b" },
      { label: "Consistency", value: dna.consistency, color: "#22d3ee" },
    ];
  };

  // Animate progress bars on mount
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    setAnimated(true);
  }, []);

  // Similar projects display format with gradient tints
  const similarProjectsDisplay = useMemo(() => {
    return backendSimilarProjects.slice(0, 3).map((p: any, idx: number) => {
      const tints = [
        "from-violet-500 to-fuchsia-500",
        "from-sky-500 to-cyan-500",
        "from-emerald-500 to-teal-500",
      ];
      return {
        id: p.id,
        projectName: p.projectName,
        match: p.score,
        tint: tints[idx % tints.length],
      };
    });
  }, [backendSimilarProjects]);

// ————————————————————————————————————————————————————————————
// Project Strengths (Gold) Analytics
// ————————————————————————————————————————————————————————————

type ProjectStrength = {
  title: string;
  explanation: string;
  confidence: number;
};

/**
 * Calculate Documentation Quality Score (0-100)
 * Based on: description length, README availability, tags count
 */
function calcDocumentationQuality(draft: Draft): number {
  let score = 0;
  
  // Description length: 0-40 points
  const descLength = draft.description?.length || 0;
  const descScore = Math.min(40, (descLength / 500) * 40); // 500 chars = 100%
  score += descScore;
  
  // README indicator (mapped from description): 0-30 points
  if (descLength > 200) {
    score += 30; // Substantial documentation
  } else if (descLength > 50) {
    score += 15; // Basic documentation
  }
  
  // Tags/metadata: 0-30 points
  const tagScore = Math.min(30, (draft.tags?.length || 0) * 6);
  score += tagScore;
  
  return Math.min(100, score);
}

/**
 * Calculate Technical Foundation Score (0-100)
 * Based on: tech stack diversity, modern technologies, architecture quality
 */
function calcTechnicalFoundation(draft: Draft): number {
  let score = 0;
  
  // Tech stack diversity: 0-40 points
  const techCount = draft.techStack?.length || 0;
  const diversityScore = Math.min(40, techCount * 5); // 8+ technologies = 40 points
  score += diversityScore;
  
  // Modern technologies bonus: 0-30 points
  const modernTechs = ["react", "vue", "typescript", "node", "nextjs", "rust", "go", "python"];
  const modernCount = (draft.techStack || []).filter((t) =>
    modernTechs.some((m) => t.toLowerCase().includes(m))
  ).length;
  const modernScore = Math.min(30, modernCount * 4); // 8+ modern techs = 30 points
  score += modernScore;
  
  // Architecture indicators: 0-30 points (from failure reason absence)
  const stallReason = (draft.failureReason || "").toLowerCase();
  const hasArchIssues = ["technical debt", "architecture", "refactor"].some((k) => stallReason.includes(k));
  if (!hasArchIssues) {
    score += 30; // No architecture problems
  } else {
    score += 10; // Has known issues
  }
  
  return Math.min(100, score);
}

/**
 * Calculate Collaboration Readiness Score (0-100)
 * Based on: contributors, openForRevival, raisedHands, activity
 */
function calcCollaborationReadiness(draft: Draft): number {
  let score = 0;
  
  // Existing contributors: 0-35 points
  const collaboratorCount = draft.collaborators?.length || 0;
  const collabScore = Math.min(35, collaboratorCount * 7); // 5+ = 35 points
  score += collabScore;
  
  // Open for revival status: 0-30 points
  if (draft.openForRevival || draft.revivalStatus === "open_for_revival") {
    score += 30;
  }
  
  // Community interest (raised hands): 0-25 points
  const raisedHandsCount = draft.raisedHands?.length || 0;
  const interestScore = Math.min(25, raisedHandsCount * 5); // 5+ = 25 points
  score += interestScore;
  
  // Activity indicators: 0-10 points
  if (collaboratorCount > 0 || raisedHandsCount > 0) {
    score += 10; // Has active community
  }
  
  return Math.min(100, score);
}

/**
 * Calculate Development Maturity Score (0-100)
 * Based on: current stage, completion %, milestones/tasks
 */
function calcDevelopmentMaturity(draft: Draft): number {
  let score = 0;
  
  // Stage progression: 0-50 points
  const stageMap: Record<string, number> = {
    "idea": 5,
    "planning": 15,
    "prototype": 25,
    "50% done": 40,
    "backend development": 45,
    "ui/ux design": 40,
    "almost complete": 50,
    "shipped": 50,
  };
  
  const stage = (draft.currentStage || "").toLowerCase();
  const stageScore = stageMap[stage] || 20;
  score += stageScore;
  
  // Time investment: 0-25 points
  const timeSpent = draft.timeSpent?.value || 0;
  const timeUnit = draft.timeSpent?.unit || "weeks";
  const monthsSpent = timeUnit === "months" ? timeSpent : timeSpent / 4;
  const timeScore = Math.min(25, monthsSpent * 5); // 5+ months = 25 points
  score += timeScore;
  
  // Estimated hours indicator: 0-25 points
  const estimatedHours = draft.estimatedHours || 0;
  if (estimatedHours > 0) {
    const hoursScore = Math.min(25, (estimatedHours / 200) * 25); // 200 hours = 25 points
    score += hoursScore;
  }
  
  return Math.min(100, score);
}

/**
 * Calculate Maintainability Score (0-100)
 * Based on: modular stack, project organization, consistency
 */
function calcMaintainability(draft: Draft): number {
  let score = 0;
  
  // Modular stack assessment: 0-35 points
  const techStack = draft.techStack || [];
  const hasPackageManager = techStack.some((t) =>
    ["npm", "yarn", "bun", "cargo", "pip", "maven"].some((pm) => t.toLowerCase().includes(pm))
  );
  const hasModernFramework = techStack.some((t) =>
    ["react", "vue", "angular", "nextjs", "fastapi", "django"].some((fw) => t.toLowerCase().includes(fw))
  );
  
  if (hasPackageManager && hasModernFramework) {
    score += 35; // Modern, organized tech
  } else if (hasModernFramework) {
    score += 20;
  }
  
  // Code organization: 0-35 points (from description indicators)
  const descLower = (draft.description || "").toLowerCase();
  const orgIndicators = ["modular", "reusable", "clean", "organized", "structured", "components"];
  const orgScore = orgIndicators.filter((ind) => descLower.includes(ind)).length * 5;
  score += Math.min(35, orgScore);
  
  // Consistency indicators: 0-30 points
  if (draft.tags && draft.tags.length > 0) {
    score += 15; // Has consistent tagging
  }
  if ((draft.description?.length || 0) > 150) {
    score += 15; // Substantial documentation = consistent approach
  }
  
  return Math.min(100, score);
}

/**
 * Generate project strengths from analytics
 * Returns only strengths with confidence >= 70, max 5 strengths
 */
function generateProjectStrengths(draft: Draft): ProjectStrength[] {
  try {
    const strengths: ProjectStrength[] = [];
    
    // Documentation Quality
    const docQuality = calcDocumentationQuality(draft);
    if (docQuality >= 70) {
      strengths.push({
        title: "Well-Documented Foundation",
        explanation: `Comprehensive documentation with ${draft.tags?.length || 0} metadata tags.`,
        confidence: docQuality,
      });
    }
    
    // Technical Foundation
    const techFoundation = calcTechnicalFoundation(draft);
    if (techFoundation >= 70) {
      const modernCount = (draft.techStack || []).filter((t) =>
        ["react", "vue", "typescript", "node", "nextjs", "rust", "go", "python"].some((m) =>
          t.toLowerCase().includes(m)
        )
      ).length;
      strengths.push({
        title: "Modern Tech Stack",
        explanation: `Built with ${modernCount}+ modern technologies for scalability.`,
        confidence: techFoundation,
      });
    }
    
    // Collaboration Readiness
    const collabReadiness = calcCollaborationReadiness(draft);
    if (collabReadiness >= 70) {
      const context = draft.openForRevival
        ? `Open for revival with ${draft.raisedHands?.length || 0} interested builders.`
        : `Strong team of ${draft.collaborators?.length || 0}+ collaborators.`;
      strengths.push({
        title: "Community-Ready",
        explanation: context,
        confidence: collabReadiness,
      });
    }
    
    // Development Maturity
    const maturity = calcDevelopmentMaturity(draft);
    if (maturity >= 70) {
      const stageLabel = draft.currentStage || "Advanced";
      strengths.push({
        title: "Mature Development Stage",
        explanation: `Progressed to ${stageLabel} with significant time investment.`,
        confidence: maturity,
      });
    }
    
    // Maintainability
    const maintainability = calcMaintainability(draft);
    if (maintainability >= 70) {
      const techCount = draft.techStack?.length || 0;
      strengths.push({
        title: "Maintainable Architecture",
        explanation: `${techCount} organized technologies with clear structure.`,
        confidence: maintainability,
      });
    }
    
    // Sort by confidence descending and return top 5
    return strengths.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  } catch (error) {
    console.warn("Error generating project strengths:", error);
    return [];
  }
}

/**
 * Convert strengths to simple string format for UI compatibility
 */
function formatGoldItems(strengths: ProjectStrength[]): string[] {
  return strengths.map((s) => `${s.title}: ${s.explanation}`);
}

// ————————————————————————————————————————————————————————————
// Gold section generation (for UI display)
// ————————————————————————————————————————————————————————————
  // Use backend strengths if available, otherwise empty array
  const projectOverviewStrengths = projectOverview?.strengths || [];
  
  const goldItems = useMemo(() => {
    // Format strengths for display
    return projectOverviewStrengths.map((s: any) => ({
      title: s.title,
      explanation: s.explanation,
      score: s.score,
      confidence: s.confidence,
    }));
  }, [projectOverviewStrengths]);

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

      {/* Why it stalled */}
      <Card>
        <CardTitle icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}>Why It Stalled</CardTitle>
        {draft.failureReason ? (
          <div className="mt-3 rounded-lg border border-rose-500/25 bg-rose-500/10 p-3 text-sm text-foreground">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-500 dark:text-rose-400 mb-1">
              Reason from Drafts DB
            </p>
            <p className="text-muted-foreground">{draft.failureReason}</p>
          </div>
        ) : (
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
        )}
        <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-600 ring-1 ring-rose-500/30 dark:text-rose-300">
          <AlertTriangle className="h-3 w-3" /> {draft.failureReason ? "Database Record" : "Detected by AI"}
        </div>
      </Card>

      {/* Stall DNA */}
      {(() => {
        const stallDNA = backendStallDNA;
        const displayData = getStallDNADisplay(stallDNA);
        if (!displayData) return null;
        return (
          <Card>
            <CardTitle icon={<Brain className="h-4 w-4 text-fuchsia-500" />}>Stall DNA</CardTitle>
            <div className="mt-3 space-y-2.5">
              {displayData.map((s) => (
                <div key={s.label}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className="font-semibold">{s.value}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: animated ? `${s.value}%` : "0%",
                        background: `linear-gradient(90deg, ${s.color}, ${s.color}aa)`,
                        boxShadow: `0 0 10px ${s.color}66`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        );
      })()}

      {/* Gold */}
      <Card>
        <CardTitle icon={<Sparkles className="h-4 w-4 text-amber-500" />}>Gold</CardTitle>
        <ul className="mt-3 space-y-2 text-sm">
          {goldItems.map((strength: any) => (
            <li key={strength.title} className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span className="text-muted-foreground">{strength.title}: {strength.explanation}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Similar projects */}
      <Card className="lg:col-span-2">
        <div className="flex items-center justify-between">
          <CardTitle>Similar Projects</CardTitle>
          <Link to="/feed" className="text-xs font-medium text-[var(--project-accent)]">
            Explore Feed →
          </Link>
        </div>
        {similarProjectsDisplay.length > 0 ? (
          <ul className="mt-3 grid gap-3 sm:grid-cols-3 text-sm">
            {similarProjectsDisplay.map((p: any) => (
              <li key={p.id}>
                <Link
                  to="/project/$slug"
                  params={{ slug: slugify(p.projectName) }}
                  className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/30 p-3 transition-colors hover:border-primary/40 hover:bg-muted/60"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${p.tint} text-xs font-bold text-white`}
                    >
                      {p.projectName.slice(0, 1)}
                    </span>
                    <span className="font-medium truncate text-xs">{p.projectName}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-[var(--project-accent)] shrink-0">
                    {p.match}% Match
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-3 rounded-lg border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
            No similar projects found.
          </div>
        )}
      </Card>

      {/* Discussion preview */}
      <Card className="lg:col-span-3">
        <div className="flex items-center justify-between">
          <CardTitle icon={<MessageCircle className="h-4 w-4 text-violet-500" />}>
            Discussion Preview
          </CardTitle>
          <button
            onClick={onViewDiscussions}
            className="text-xs font-medium text-[var(--project-accent)]"
          >
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
  const [sortBy, setSortBy] = useState<"Latest" | "Most Upvoted" | "Most Replies">("Latest");
  const [newDiscussionOpen, setNewDiscussionOpen] = useState(false);
  const [discussions, setDiscussions] = useState(DISCUSSIONS);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);

  // New discussion form state
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newTag, setNewTag] = useState<(typeof DISCUSSION_TAGS)[number]>("Idea");

  const tagToneMap: Record<string, string> = {
    Idea: "violet",
    Problem: "rose",
    Question: "amber",
    General: "sky",
  };

  const handleSubmitDiscussion = () => {
    if (!newTitle.trim() || !newBody.trim()) {
      toast.error("Please fill in both the title and description.");
      return;
    }
    setDiscussions((prev) => [
      {
        tag: newTag,
        tagTone: tagToneMap[newTag],
        title: newTitle.trim(),
        body: newBody.trim(),
        author: "You",
        replies: 0,
        comments: 0,
        upvotes: 0,
        time: "just now",
      },
      ...prev,
    ]);
    toast.success("Discussion posted!");
    setNewTitle("");
    setNewBody("");
    setNewTag("Idea");
    setNewDiscussionOpen(false);
  };

  const visibleSuggestions = showAllSuggestions ? AI_SUGGESTIONS : AI_SUGGESTIONS.slice(0, 3);

  // Normalise filter: tabs say "Ideas" but tags are "Idea" etc.
  const tagFromFilter: Record<string, string> = {
    Ideas: "Idea",
    Problems: "Problem",
    Questions: "Question",
    General: "General",
  };

  const filtered =
    filter === "All"
      ? discussions
      : discussions.filter((d) => d.tag === (tagFromFilter[filter] ?? filter));

  const filteredDiscussions = [...filtered].sort((a, b) => {
    if (sortBy === "Most Upvoted") return b.upvotes - a.upvotes;
    if (sortBy === "Most Replies") return b.replies - a.replies;
    // "Latest" — keep insertion order (newest first already since new posts are prepended)
    return 0;
  });

  return (
    <>
      {/* New Discussion Dialog */}
      <Dialog open={newDiscussionOpen} onOpenChange={setNewDiscussionOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Start a Discussion</DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-4">
            {/* Tag selector */}
            <div className="flex flex-wrap gap-2">
              {DISCUSSION_TAGS.map((t) => (
                <button
                  key={t}
                  onClick={() => setNewTag(t)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    newTag === t
                      ? "bg-[var(--project-accent)]/15 text-[var(--project-accent)] ring-1 ring-[var(--project-accent)]/30"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <Input
              placeholder="Discussion title..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <Textarea
              placeholder="Share your idea, problem, or question..."
              rows={4}
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNewDiscussionOpen(false)}>
                Cancel
              </Button>
              <Button
                className="gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                onClick={handleSubmitDiscussion}
              >
                <Send className="h-4 w-4" /> Post Discussion
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-semibold">All Discussions</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                Sort by: {sortBy} <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {(["Latest", "Most Upvoted", "Most Replies"] as const).map((opt) => (
                <DropdownMenuItem
                  key={opt}
                  onClick={() => setSortBy(opt)}
                  className={sortBy === opt ? "font-medium text-[var(--project-accent)]" : ""}
                >
                  {sortBy === opt && <Check className="mr-2 h-3 w-3" />}
                  {opt}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
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
          {filteredDiscussions.length > 0 ? (
            filteredDiscussions.map((d) => (
              <DiscussionRow key={d.title + d.time} d={d} />
            ))
          ) : (
            <p className="py-6 text-center text-xs text-muted-foreground">
              No discussions in this category yet.
            </p>
          )}
        </div>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardTitle>Start a Discussion</CardTitle>
          <p className="mt-2 text-xs text-muted-foreground">
            Share your ideas, ask questions or discuss how we can revive this project.
          </p>
          <Button
            className="mt-3 w-full gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
            onClick={() => setNewDiscussionOpen(true)}
          >
            <Plus className="h-4 w-4" /> Write something...
          </Button>
        </Card>

        <Card>
          <CardTitle icon={<Sparkles className="h-4 w-4 text-violet-500" />}>AI Suggestions</CardTitle>
          <ul className="mt-3 space-y-2.5 text-xs text-muted-foreground">
            {visibleSuggestions.map((s) => (
              <li key={s} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--project-accent)]" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
          <button
            onClick={() => setShowAllSuggestions((prev) => !prev)}
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--project-accent)]"
          >
            {showAllSuggestions ? "Show fewer" : "View more suggestions"}{" "}
            <ArrowRight className={`h-3 w-3 transition-transform ${showAllSuggestions ? "rotate-90" : ""}`} />
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
    </>
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
// COLLABORATION TAB (Merged Contributors + Activity)
// ————————————————————————————————————————————————————————————
function CollaborationTab({ draft, onApply }: { draft: Draft; onApply: (role: string) => void }) {
  const ownerName = getOwnerName(draft.submittedBy);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  // Fetch real activity logs from the API
  useEffect(() => {
    const fetchActivityLogs = async () => {
      if (!draft._id) return;
      setLoadingActivity(true);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("draftyard_token") : null;
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        
        const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";
        const res = await fetch(`${apiBase}/team/${draft._id}`, { headers });
        
        if (res.ok) {
          const data = await res.json();
          setActivityLogs(data.activity || []);
        }
      } catch (error) {
        console.error('Failed to fetch activity logs:', error);
      } finally {
        setLoadingActivity(false);
      }
    };
    fetchActivityLogs();
  }, [draft._id]);

  const ownerInitials = ownerName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "PO";

  // CORE TEAM
  const dynamicTeam = [
    {
      name: ownerName,
      role: "Project Creator & Owner",
      initials: ownerInitials,
      tint: "from-violet-500 to-fuchsia-500",
    },
    ...(draft.collaborators || []).map((c, i) => {
      const cName = typeof c === "object" && c.name ? c.name : "Collaborator";
      const cInitials = cName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "CB";
      return {
        name: cName,
        role: "Contributor",
        initials: cInitials,
        tint: i % 2 === 0 ? "from-emerald-500 to-teal-500" : "from-sky-500 to-indigo-500",
      };
    }),
  ];

  const totalContributors = dynamicTeam.length;
  const totalRevivalRequests = (draft.raisedHands || []).length;
  const totalCommunityLikes = draft.likes || 0;

  // CONTRIBUTION OVERVIEW - Real dynamic analytics from database
  const { chartData, timePeriodLabel, hasActivityData } = useMemo(() => {
    const now = Date.now();
    const createdTime = draft.createdAt ? new Date(draft.createdAt).getTime() : now - 12 * 7 * 24 * 3600 * 1000;
    const projectAgeWeeks = Math.max(1, Math.ceil((now - createdTime) / (7 * 24 * 3600 * 1000)));
    const totalWeeks = Math.min(12, Math.max(1, projectAgeWeeks));

    const timePeriodLabel = totalWeeks === 1 ? "Last 1 week" : `Last ${totalWeeks} weeks`;

    const oneWeekMs = 7 * 24 * 3600 * 1000;
    const weeklyBuckets = Array.from({ length: totalWeeks }, (_, index) => {
      const weekIndexFromEnd = totalWeeks - 1 - index;
      const startTime = now - (weekIndexFromEnd + 1) * oneWeekMs;
      const endTime = now - weekIndexFromEnd * oneWeekMs;
      return {
        weekLabel: `W${index + 1}`,
        startTime,
        endTime,
        activity: 0,
      };
    });

    let totalEventsCount = 0;

    // 1. Activity log events
    if (activityLogs && activityLogs.length > 0) {
      activityLogs.forEach((log: any) => {
        const logTime = log.createdAt ? new Date(log.createdAt).getTime() : null;
        if (logTime) {
          const bucket = weeklyBuckets.find((b) => logTime >= b.startTime && logTime <= b.endTime);
          if (bucket) {
            bucket.activity += 1;
            totalEventsCount += 1;
          }
        }
      });
    }

    // 2. Revival request events
    if (draft.raisedHands && draft.raisedHands.length > 0) {
      draft.raisedHands.forEach((rh: any) => {
        const rhTime = rh.createdAt ? new Date(rh.createdAt).getTime() : null;
        if (rhTime) {
          const bucket = weeklyBuckets.find((b) => rhTime >= b.startTime && rhTime <= b.endTime);
          if (bucket) {
            bucket.activity += 1;
            totalEventsCount += 1;
          }
        }
      });
    }

    // 3. Project creation event
    if (createdTime) {
      const bucket = weeklyBuckets.find((b) => createdTime >= b.startTime && createdTime <= b.endTime);
      if (bucket) {
        bucket.activity += 1;
        totalEventsCount += 1;
      }
    }

    const formattedData = weeklyBuckets.map((b) => ({
      week: b.weekLabel,
      activity: b.activity,
    }));

    return {
      chartData: formattedData,
      timePeriodLabel,
      hasActivityData: totalEventsCount > 0,
    };
  }, [draft.createdAt, draft.raisedHands, activityLogs]);

  // ACTIVITY TIMELINE - Real events from database
  const dynamicTimeline = useMemo(() => {
    const events: any[] = [];

    // Add project creation event
    if (draft.createdAt) {
      const createdDate = new Date(draft.createdAt).toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric", 
        year: "numeric" 
      });
      events.push({
        icon: "flag",
        title: `Project created by ${ownerName}`,
        date: createdDate,
        tone: "violet",
      });
    }

    // Add activity log events from database
    if (activityLogs && activityLogs.length > 0) {
      activityLogs.slice(0, 4).forEach((log: any) => {
        const logDate = log.createdAt 
          ? new Date(log.createdAt).toLocaleDateString("en-US", { 
              month: "short", 
              day: "numeric" 
            })
          : "Recently";

        events.push({
          icon: "activity",
          title: log.action || "Team activity",
          body: `by ${log.who || 'Team member'}`,
          date: logDate,
          tone: "violet",
        });
      });
    }

    // Add stage change event if available
    if (draft.currentStage) {
      events.push({
        icon: "board",
        title: `Project stage: ${draft.currentStage}`,
        date: "Current",
        tone: "violet",
      });
    }

    // Add stall/revival events based on status
    if (draft.failureReason) {
      events.push({
        icon: "warn",
        title: "Stall reason recorded",
        body: draft.failureReason,
        date: "Recently",
        tone: "amber",
      });
    }

    if (draft.openForRevival) {
      events.push({
        icon: "revive",
        title: "Marked open for revival",
        body: "Looking for contributors to join and build",
        date: "Active",
        tone: "emerald",
      });
    }

    return events;
  }, [draft, activityLogs, ownerName]);

  // ACTIVITY INSIGHTS
  const activityInsights = useMemo(() => {
    const insights: string[] = [];
    insights.push(`Project is currently in the "${draft.currentStage}" stage.`);
    const revivalCount = draft.raisedHands?.length || 0;
    if (revivalCount > 0) {
      insights.push(`${revivalCount} active revival request${revivalCount > 1 ? "s" : ""} submitted by community developers.`);
    } else {
      insights.push("Open for community revival and developer contributions.");
    }
    const upvotes = draft.likes || 0;
    const views = draft.views || 0;
    if (upvotes > 0 || views > 0) {
      insights.push(`Supported by ${upvotes} community like${upvotes !== 1 ? "s" : ""} and ${views} view${views !== 1 ? "s" : ""}.`);
    } else {
      insights.push("High potential modular codebase ready for extension.");
    }
    const teamSize = (draft.collaborators?.length || 0) + 1;
    insights.push(`${teamSize} active member${teamSize > 1 ? "s" : ""} in ${draft.domain || "tech"} project team.`);
    if (activityLogs.length > 0) {
      insights.push(`${activityLogs.length} recent team activity log${activityLogs.length > 1 ? "s" : ""} recorded.`);
    }
    return insights;
  }, [draft, activityLogs]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* TOP ROW */}
      {/* Core Team */}
      <Card>
        <CardTitle icon={<Users className="h-4 w-4 text-violet-500" />}>Core Team</CardTitle>
        <ul className="mt-3 space-y-3">
          {dynamicTeam.map((m) => (
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

      {/* Contribution Overview */}
      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>Contribution Overview</CardTitle>
          <span className="text-[10px] text-muted-foreground">{timePeriodLabel}</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <StatTile label="Total Contributors" value={String(totalContributors)} />
          <StatTile label="Revival Requests" value={String(totalRevivalRequests)} />
        </div>
        <div className="relative mt-3 h-36 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
              <XAxis
                dataKey="week"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "currentColor" }}
                className="text-muted-foreground"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "currentColor" }}
                className="text-muted-foreground"
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "hsl(var(--foreground))",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
                formatter={(val: any) => [`${val} activities`, "Activity"]}
                labelFormatter={(label: any) => `Time Period: ${label}`}
              />
              <Bar dataKey="activity" radius={[3, 3, 0, 0]} fill="url(#contrib-grad)" />
              <defs>
                <linearGradient id="contrib-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
          {!hasActivityData && (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-card/60 border border-dashed border-border/60">
              <span className="text-[11px] font-medium text-muted-foreground">No recorded activity in this timeframe</span>
            </div>
          )}
        </div>
        <div className="mt-1 text-right text-[10px] font-medium text-emerald-600 dark:text-emerald-300">
          {totalRevivalRequests > 0 ? `${totalRevivalRequests} active revival request${totalRevivalRequests > 1 ? "s" : ""}` : `${totalCommunityLikes} community like${totalCommunityLikes !== 1 ? "s" : ""}`}
        </div>
      </Card>

      {/* BOTTOM ROW */}
      {/* Activity Timeline */}
      <Card>
        <CardTitle icon={<ActivityIcon className="h-4 w-4 text-violet-500" />}>
          Activity Timeline
        </CardTitle>
        <div className="relative mt-4 pl-6">
          <span className="absolute inset-y-1 left-2 w-px bg-gradient-to-b from-violet-500/60 via-fuchsia-500/40 to-emerald-500/60" />
          <ul className="space-y-5">
            {dynamicTimeline.length > 0 ? (
              dynamicTimeline.map((t) => (
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
              ))
            ) : (
              <li className="text-xs text-muted-foreground">No activity recorded yet.</li>
            )}
          </ul>
        </div>
      </Card>

      {/* Activity Insights */}
      <Card>
        <CardTitle icon={<Brain className="h-4 w-4 text-fuchsia-500" />}>Activity Insights</CardTitle>
        <ul className="mt-3 space-y-3 text-base leading-7 text-muted-foreground">
          {activityInsights.map((s) => {
            // Make dynamic values bold
            const formattedText = s
              .replace(/the "([^"]+)" stage/g, 'the "<strong>$1</strong>" stage')
              .replace(/(\d+) active revival request/g, '<strong>$1</strong> active revival request')
              .replace(/(\d+) community like/g, '<strong>$1</strong> community like')
              .replace(/(\d+) view/g, '<strong>$1</strong> view')
              .replace(/(\d+) recent team activity/g, '<strong>$1</strong> recent team activity')
              .replace(/(\d+) active member/g, '<strong>$1</strong> active member');
            
            return (
              <li key={s} className="flex items-start gap-3">
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--project-accent)]" />
                <span dangerouslySetInnerHTML={{ __html: formattedText }} className="[&_strong]:font-semibold [&_strong]:text-foreground" />
              </li>
            );
          })}
        </ul>
        <div className="pointer-events-none absolute -bottom-6 -right-6 grid h-24 w-24 place-items-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500/40 to-fuchsia-500/40 blur-2xl" />
          <div className="relative grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-[0_0_30px_rgba(139,92,246,0.55)]">
            <Brain className="h-6 w-6" />
          </div>
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
