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
import { fetchCompassFeed } from "@/lib/api";

export type CompassMode = "Explore" | "Learn" | "Build" | "Collaborate" | "Publish";

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
    tagline: "Discover opportunities",
    accentHex: "#22c55e",
    glowClass: "shadow-[0_0_28px_-4px_rgba(34,197,94,0.35)]",
    itemIcons: [TrendingUp, Lightbulb, BarChart3],
  },
  Learn: {
    icon: BookOpen,
    tagline: "Learn from the community",
    accentHex: "#3b82f6",
    glowClass: "shadow-[0_0_28px_-4px_rgba(59,130,246,0.35)]",
    itemIcons: [BarChart3, MessageSquare, AlertTriangle],
  },
  Build: {
    icon: Hammer,
    tagline: "See what the community is building",
    accentHex: "#f97316",
    glowClass: "shadow-[0_0_28px_-4px_rgba(249,115,22,0.35)]",
    itemIcons: [Zap, RefreshCw, Trophy],
  },
  Collaborate: {
    icon: Users,
    tagline: "Connect, contribute & build together",
    accentHex: "#a855f7",
    glowClass: "shadow-[0_0_28px_-4px_rgba(168,85,247,0.35)]",
    itemIcons: [GitBranch, UserPlus, Users],
  },
  Publish: {
    icon: Rocket,
    tagline: "Celebrate wins & inspire others",
    accentHex: "#eab308",
    glowClass: "shadow-[0_0_28px_-4px_rgba(234,179,8,0.35)]",
    itemIcons: [Globe, RefreshCw, Star],
  },
};

// ── Static fallbacks (shown while loading or on API error) ──────────────────

const FALLBACK_ITEMS: Record<CompassMode, { key: string; title: string; sub: string; route: string }[]> = {
  Explore: [
    { key: 'trending', title: 'Trending Drafts', sub: 'Browse hot drafts', route: '/feed' },
    { key: 'featured', title: 'Featured Ideas', sub: 'Community top picks', route: '/feed' },
    { key: 'stacks', title: 'Rising Tech Stacks', sub: 'React, Node.js & more', route: '/feed' },
  ],
  Learn: [
    { key: 'weekly', title: 'Weekly Highlights', sub: 'Top lessons this week', route: '/insights' },
    { key: 'insights', title: 'Community Insights', sub: 'Browse all insights', route: '/insights' },
    { key: 'mistakes', title: 'Common Mistakes', sub: 'Why projects stall', route: '/insights-lab' },
  ],
  Build: [
    { key: 'activity', title: 'Live Build Activity', sub: 'Active projects this week', route: '/feed' },
    { key: 'resumed', title: 'In Progress', sub: 'Community projects', route: '/feed' },
    { key: 'milestones', title: 'Milestones Hit', sub: 'Almost complete projects', route: '/feed' },
  ],
  Collaborate: [
    { key: 'openCollabs', title: 'Open Collaborations', sub: 'Projects seeking help', route: '/feed' },
    { key: 'newContributors', title: 'New Contributors', sub: 'Recently joined members', route: '/feed' },
    { key: 'teamFormations', title: 'Top Revival Projects', sub: 'Browse revival projects', route: '/feed' },
  ],
  Publish: [
    { key: 'launches', title: 'Recent Launches', sub: 'Projects launched', route: '/feed' },
    { key: 'revivals', title: 'Revival Stories', sub: 'Projects with revival interest', route: '/feed' },
    { key: 'top', title: 'Top Performers', sub: 'See top drafts', route: '/feed' },
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

  // Use real data when available, fall back to static items so buttons always render
  const items = (data?.items && data.items.length > 0) ? data.items : FALLBACK_ITEMS[mode];
  const cta = data?.cta ?? { label: mode === 'Collaborate' ? 'Open Revival Board' : mode === 'Learn' ? 'Open Insights' : 'View More', route: mode === 'Learn' ? '/insights' : '/feed' };

  return (
    <div
      className={`flex h-full flex-col rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all duration-[220ms] hover:-translate-y-0.5 hover:shadow-md ${cfg.glowClass}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          Compass Feed
        </span>
        <AnimatePresence mode="wait">
          <motion.span
            key={mode + "-badge"}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.2 }}
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
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
          className="mt-4 flex items-center gap-3"
        >
          <motion.div
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
            style={{ background: cfg.accentHex + "22" }}
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Icon className="h-5 w-5" style={{ color: cfg.accentHex }} />
          </motion.div>
          <div>
            <p className="font-display text-base font-semibold leading-tight" style={{ color: cfg.accentHex }}>
              {mode}
            </p>
            <p className="text-[12px] text-muted-foreground">{cfg.tagline}</p>
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
          className="mt-5 flex flex-col gap-2"
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
                  onClick={() => navigate({ to: item.route as "/" })}
                  className="group flex w-full cursor-pointer items-center gap-3 rounded-xl border border-border/50 bg-muted/30 px-3 py-2.5 text-left transition-all duration-150 hover:bg-muted/60 hover:-translate-y-0.5 hover:border-border/80 hover:shadow-sm active:scale-[0.98]"
                >
                  <span
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-lg transition-transform duration-150 group-hover:scale-110"
                    style={{ background: cfg.accentHex + "18" }}
                  >
                    <ItemIcon className="h-3.5 w-3.5" style={{ color: cfg.accentHex }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold leading-tight text-foreground">
                      {isLoading ? item.title : item.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {isLoading ? <span className="inline-block h-2.5 w-24 rounded bg-muted/60 animate-pulse" /> : item.sub}
                    </p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-transform duration-150 group-hover:translate-x-1 group-hover:text-muted-foreground" />
                </button>
              </motion.li>
            );
          })}
        </motion.ul>
      </AnimatePresence>

      {/* CTA */}
      <div className="mt-auto pt-5">
        <AnimatePresence mode="wait">
          <motion.button
            key={mode + "-cta"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => cta && navigate({ to: cta.route as "/" })}
            className="inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ color: cfg.accentHex }}
          >
            {cta?.label ?? "View More"} <ArrowRight className="h-3.5 w-3.5" />
          </motion.button>
        </AnimatePresence>
      </div>
    </div>
  );
}
