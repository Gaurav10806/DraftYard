import { AnimatePresence, motion } from "framer-motion";
import {
  Compass,
  Rocket,
  BookOpen,
  Hammer,
  Users,
  Star,
  ArrowRight,
  TrendingUp,
  Lightbulb,
  Gem,
  BarChart3,
  MessageSquare,
  AlertTriangle,
  Zap,
  RefreshCw,
  Trophy,
  UserPlus,
  GitBranch,
  Globe,
  Loader2,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchCompassFeed, type CompassRoute, fetchMyDrafts, fetchFeed } from "@/lib/api";

export type CompassMode = "Explore" | "Collaborate" | "Build" | "Learn" | "Level Up";

interface CompassFeedProps {
  mode: CompassMode;
}

// ── Per-mode static config (icons, colours, fallback) ────────────────────────

const MODE_CONFIG: Record<
  CompassMode,
  {
    icon: React.ElementType;
    tagline: string;
    accentHex: string;
    glowClass: string;
    itemIcons: React.ElementType[];
  }
> = {
  Explore: {
    icon: Compass,
    tagline: "Trending, open for revival, and featured ideas",
    accentHex: "#22c55e",
    glowClass: "shadow-[0_0_28px_-4px_rgba(34,197,94,0.35)]",
    itemIcons: [TrendingUp, Lightbulb, BarChart3],
  },
  Collaborate: {
    icon: Users,
    tagline: "Connect, collaborate, and build together",
    accentHex: "#a855f7",
    glowClass: "shadow-[0_0_28px_-4px_rgba(168,85,247,0.35)]",
    itemIcons: [GitBranch, Globe, UserPlus],
  },
  Build: {
    icon: Hammer,
    tagline: "Continue, track tasks, and start fresh",
    accentHex: "#f97316",
    glowClass: "shadow-[0_0_28px_-4px_rgba(249,115,22,0.35)]",
    itemIcons: [RefreshCw, Zap, BookOpen],
  },
  Learn: {
    icon: BookOpen,
    tagline: "AI insights and community knowledge",
    accentHex: "#3b82f6",
    glowClass: "shadow-[0_0_28px_-4px_rgba(59,130,246,0.35)]",
    itemIcons: [MessageSquare, BarChart3, AlertTriangle],
  },
  "Level Up": {
    icon: Rocket,
    tagline: "AI assistance, challenges, and growth",
    accentHex: "#eab308",
    glowClass: "shadow-[0_0_28px_-4px_rgba(234,179,8,0.35)]",
    itemIcons: [Zap, Trophy, TrendingUp],
  },
};

// ── Static fallbacks (shown while loading or on API error) ──────────────────

const FALLBACK_ITEMS: Record<CompassMode, { key: string; title: string; sub: string; meta?: string; route: CompassRoute}[]> = {
  Explore: [
    { key: 'trending', title: 'Trending Drafts', sub: 'Discover popular projects gaining momentum\nthis week from active builders.', route: '/feed' },
    { key: 'revival', title: 'Open for Revival', sub: 'Projects seeking collaborators and fresh\nperspectives to get back on track.', route: '/feed' },
    { key: 'featured', title: 'Featured Ideas', sub: 'Handpicked highlights from the community\nrecommended by top builders.', route: '/feed' },
  ],
  Collaborate: [
    { key: 'myCollabs', title: 'My Collaborations', sub: 'Your active partnerships and ongoing\ncollaborative projects at a glance.', route: '/feed' },
    { key: 'community', title: 'Community Projects', sub: 'Find builders and projects to connect with\nand collaborate on exciting ideas.', route: '/feed' },
    { key: 'contributors', title: 'Top Contributors', sub: 'Learn from and connect with the most active\nand influential builders in the community.', route: '/feed' },
  ],
  Build: [
    { key: 'continue', title: 'Continue Workspace', sub: 'Resume your active draft exactly where you\nleft off without losing any progress.', route: '/feed' },
    { key: 'tasks', title: 'Manage Tasks', sub: 'Track priorities, deadlines, and organize your\nwork into manageable milestones.', route: '/feed' },
    { key: 'newDraft', title: 'New Draft', sub: 'Start a fresh project and break your vision\ninto smaller, achievable pieces.', route: '/feed' },
  ],
  Learn: [
    { key: 'aiReview', title: 'AI Idea Review', sub: 'Get intelligent feedback and insights on your\ndrafts powered by advanced AI analysis.', route: '/insights' },
    { key: 'insights', title: 'Your Insights', sub: 'See personalized analytics on your growth,\npatterns, and development progress.', route: '/insights' },
    { key: 'stackIntel', title: 'Stack Intelligence', sub: 'Deep dive into technology trends and insights\nabout the tools and languages you use.', route: '/insights-lab' },
  ],
  "Level Up": [
    { key: 'aiAssistant', title: 'AI Assistant', sub: 'Get AI suggestions, fix blockers, review\narchitecture, and receive coding guidance.', route: '/feed' },
    { key: 'challenge', title: 'Weekly Challenge', sub: 'Complete community challenges, earn badges,\nimprove your skills, and stay consistent.', route: '/feed' },
    { key: 'progress', title: 'Developer Progress', sub: 'Track your learning streak, project milestones,\nproductivity, and overall growth.', route: '/feed' },
  ],
};

export function CompassFeed({ mode }: CompassFeedProps) {
  const navigate = useNavigate();
  const cfg = MODE_CONFIG[mode];
  const Icon = cfg.icon;

  const { data, isLoading } = useQuery({
    queryKey: ["compass-feed", mode],
    queryFn: () => fetchCompassFeed(mode),
    staleTime: 60_000,
  });

  // Fetch user's drafts for navigation logic
  const { data: userDrafts = [] } = useQuery({
    queryKey: ["my-drafts"],
    queryFn: () => fetchMyDrafts(),
    staleTime: 30_000,
  });

  // Use real data when available, fall back to static items so buttons always render
  const items = (data?.items && data.items.length > 0) ? data.items : FALLBACK_ITEMS[mode];
  const cta = data?.cta ?? { label: mode === 'Collaborate' ? 'Explore Collaborations' : mode === 'Learn' ? 'Open Insights' : mode === 'Level Up' ? 'Level Up' : 'View More', route: mode === 'Learn' ? '/insights' : '/feed' };

  const handleCompassAction = async (key: string) => {
    try {
      // ─────────────────────────────────────────────────────────────────────
      // EXPLORE MODE
      // ─────────────────────────────────────────────────────────────────────
      if (mode === 'Explore') {
        if (key === 'trending') {
          navigate({ to: '/feed', state: { compassFilter: 'trending' } as any });
        } else if (key === 'revival') {
          navigate({ to: '/feed', state: { compassFilter: 'open' } as any });
        } else if (key === 'featured') {
          navigate({ to: '/feed', state: { compassFilter: 'featured' } as any });
        }
      }

      // ─────────────────────────────────────────────────────────────────────
      // COLLABORATE MODE
      // ─────────────────────────────────────────────────────────────────────
      else if (mode === 'Collaborate') {
        if (key === 'myCollabs') {
          // Always open Workspace page with "Shared With Me" filter selected
          // Works whether user has collabs or not
          navigate({ to: '/workspace', search: { draftId: undefined }, state: { compassTab: 'shared' } as any });
        } else if (key === 'community') {
          // If no Open for Revival projects exist, simply open Feed normally
          navigate({ to: '/feed', state: { compassFilter: 'open' } as any });
        } else if (key === 'contributors') {
          // Find latest active draft and open Team tab
          if (userDrafts.length > 0) {
            const latestDraft = userDrafts[0]; // Already sorted by most recent
            navigate({ to: '/workspace', search: { draftId: latestDraft._id }, state: { compassTab: 'team' } as any });
          } else {
            navigate({ to: '/new-draft' });
          }
        }
      }

      // ─────────────────────────────────────────────────────────────────────
      // BUILD MODE
      // ─────────────────────────────────────────────────────────────────────
      else if (mode === 'Build') {
        if (key === 'continue') {
          // Open latest active draft Workspace (Overview tab)
          if (userDrafts.length > 0) {
            const latestDraft = userDrafts[0]; // Already sorted by most recent
            navigate({ to: '/workspace', search: { draftId: latestDraft._id } });
          } else {
            navigate({ to: '/new-draft' });
          }
        } else if (key === 'tasks') {
          // Find latest active draft and open Tasks tab
          if (userDrafts.length > 0) {
            const latestDraft = userDrafts[0]; // Already sorted by most recent
            navigate({ to: '/workspace', search: { draftId: latestDraft._id }, state: { compassTab: 'tasks' } as any });
          } else {
            navigate({ to: '/new-draft' });
          }
        } else if (key === 'newDraft') {
          navigate({ to: '/new-draft' });
        }
      }

      // ─────────────────────────────────────────────────────────────────────
      // LEARN MODE
      // ─────────────────────────────────────────────────────────────────────
      else if (mode === 'Learn') {
        if (key === 'aiReview') {
          navigate({ to: '/idea-review' });
        } else if (key === 'insights') {
          navigate({ to: '/insights' });
        } else if (key === 'stackIntel') {
          navigate({ to: '/stack-intelligence' });
        }
      }

      // ─────────────────────────────────────────────────────────────────────
      // LEVEL UP MODE
      // ─────────────────────────────────────────────────────────────────────
      else if (mode === 'Level Up') {
        if (key === 'aiAssistant') {
          navigate({ to: '/ai-assistant' });
        } else if (key === 'challenge') {
          // Open the existing Weekly Challenge modal
          // Emit custom event to parent dashboard to open modal
          window.dispatchEvent(new CustomEvent('openWeeklyChallenge'));
          toast.success("Opening Weekly Challenge...");
        } else if (key === 'progress') {
          // Do not navigate - show toast
          toast.success("🚀 Developer Progress is coming soon!", {
            description: "This feature will be available in the next update.",
          });
        }
      }
    } catch (error) {
      toast.error("Navigation failed", {
        description: "Unable to navigate to this section.",
      });
    }
  };

  return (
    <div
      className={`flex h-full flex-col rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all duration-[220ms] hover:-translate-y-0.5 hover:shadow-md ${cfg.glowClass}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.20em] text-primary/80">
          Compass Feed
        </span>
        <AnimatePresence mode="wait">
          <motion.span
            key={mode + "-badge"}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.2 }}
            className="rounded-full px-2 py-0.5 text-[9px] font-semibold"
            style={{
              background: cfg.accentHex + "22",
              color: cfg.accentHex,
              border: `1px solid ${cfg.accentHex}44`,
            }}
          >
            {mode}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Mode title + tagline */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mode + "-header"}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="mt-3 flex items-center gap-2"
        >
          <motion.div
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
            style={{ background: cfg.accentHex + "22" }}
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Icon className="h-4 w-4" style={{ color: cfg.accentHex }} />
          </motion.div>
          <div className="min-w-0">
            <p className="font-display text-sm font-semibold leading-tight" style={{ color: cfg.accentHex }}>
              {mode}
            </p>
            <p className="text-[11px] text-muted-foreground leading-snug">{cfg.tagline}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Feed items */}
      <AnimatePresence mode="wait">
        <motion.ul
          key={mode + "-items"}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="mt-3.5 flex flex-col gap-2"
        >
          {items.map((item, idx) => {
            const ItemIcon = cfg.itemIcons[idx] ?? ArrowRight;
            return (
              <motion.li
                key={item.key}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.07, duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                <button
                  type="button"
                  onClick={() => handleCompassAction(item.key)}
                  className="group flex w-full cursor-pointer flex-col gap-1.5 rounded-lg border border-border/50 bg-muted/30 px-2.5 py-2.5 text-left transition-all duration-150 hover:bg-muted/60 hover:-translate-y-0.5 hover:border-border/80 hover:shadow-sm active:scale-[0.98]"
                >
                  <div className="flex items-start gap-2">
                    <span
                      className="grid h-6 w-6 shrink-0 place-items-center rounded transition-transform duration-150 group-hover:scale-110 mt-0.5 flex-shrink-0"
                      style={{ background: cfg.accentHex + "18" }}
                    >
                      <ItemIcon className="h-3 w-3" style={{ color: cfg.accentHex }} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold leading-tight text-foreground">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground leading-snug mt-1 whitespace-pre-line">
                        {isLoading ? <span className="inline-block h-2 w-20 rounded bg-muted/60 animate-pulse" /> : item.sub}
                      </p>
                    </div>
                  </div>
                </button>
              </motion.li>
            );
          })}
        </motion.ul>
      </AnimatePresence>

      {/* CTA */}
      <div className="mt-auto pt-3">
        <AnimatePresence mode="wait">
          <motion.button
            key={mode + "-cta"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
           onClick={() => {
  if (!cta?.route) return;

  if (typeof cta.route === "object") {
    navigate({
      to: cta.route.to as any,
      search: cta.route.search as any,
    });
  } else {
    navigate({ to: cta.route as any });
  }
}}
            className="inline-flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-80"
            style={{ color: cfg.accentHex }}
          >
            {cta?.label ?? "View More"} <ArrowRight className="h-2.5 w-2.5" />
          </motion.button>
        </AnimatePresence>
      </div>
    </div>
  );
}
