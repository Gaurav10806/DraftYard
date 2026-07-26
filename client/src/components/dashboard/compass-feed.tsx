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
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export type CompassMode = "Explore" | "Learn" | "Build" | "Collaborate" | "Publish";

interface CompassFeedProps {
  mode: CompassMode;
}

// ── Per-mode configuration ───────────────────────────────────────────────────

const MODE_CONFIG: Record<
  CompassMode,
  {
    icon: React.ElementType;
    label: string;
    tagline: string;
    accent: string;          // Tailwind arbitrary colour string
    accentHex: string;       // For inline glow
    glowClass: string;       // Tailwind ring / shadow class
    cta: string;
    ctaRoute: string;
    items: { icon: React.ElementType; title: string; sub: string }[];
  }
> = {
  Explore: {
    icon: Compass,
    label: "Explore",
    tagline: "Discover opportunities",
    accent: "#22c55e",
    accentHex: "#22c55e",
    glowClass: "shadow-[0_0_28px_-4px_rgba(34,197,94,0.35)]",
    cta: "Explore More",
    ctaRoute: "/feed",
    items: [
      { icon: TrendingUp,  title: "Trending Drafts",       sub: "12 hot drafts this week" },
      { icon: Lightbulb,   title: "Featured Ideas",        sub: "Community top picks" },
      { icon: BarChart3,   title: "Rising Tech Stacks",    sub: "Next.js, Bun & Rust trending" },
    ],
  },
  Learn: {
    icon: BookOpen,
    label: "Learn",
    tagline: "Learn from the community",
    accent: "#3b82f6",
    accentHex: "#3b82f6",
    glowClass: "shadow-[0_0_28px_-4px_rgba(59,130,246,0.35)]",
    cta: "Open Insights",
    ctaRoute: "/insights",
    items: [
      { icon: BarChart3,      title: "Weekly Highlights",    sub: "Top lessons this week" },
      { icon: MessageSquare,  title: "Community Insights",   sub: "10 new insights added" },
      { icon: AlertTriangle,  title: "Common Mistakes",      sub: "Why 64% of projects stall" },
    ],
  },
  Build: {
    icon: Hammer,
    label: "Build",
    tagline: "See what the community is building",
    accent: "#f97316",
    accentHex: "#f97316",
    glowClass: "shadow-[0_0_28px_-4px_rgba(249,115,22,0.35)]",
    cta: "View Activity",
    ctaRoute: "/feed",
    items: [
      { icon: Zap,         title: "Live Build Activity",      sub: "287 commits across 124 drafts" },
      { icon: RefreshCw,   title: "Recently Continued",       sub: "91 drafts resumed today" },
      { icon: Trophy,      title: "Milestones Hit",           sub: "14 drafts reached a milestone" },
    ],
  },
  Collaborate: {
    icon: Users,
    label: "Collaborate",
    tagline: "Connect, contribute & build together",
    accent: "#a855f7",
    accentHex: "#a855f7",
    glowClass: "shadow-[0_0_28px_-4px_rgba(168,85,247,0.35)]",
    cta: "Open Revival Board",
    ctaRoute: "/feed",
    items: [
      { icon: GitBranch,  title: "Open Collaborations",  sub: "73 projects seeking help" },
      { icon: UserPlus,   title: "New Contributors",     sub: "164 joined this week" },
      { icon: Users,      title: "Team Formations",      sub: "28 new teams formed" },
    ],
  },
  Publish: {
    icon: Rocket,
    label: "Publish",
    tagline: "Celebrate wins & inspire others",
    accent: "#eab308",
    accentHex: "#eab308",
    glowClass: "shadow-[0_0_28px_-4px_rgba(234,179,8,0.35)]",
    cta: "View Showcase",
    ctaRoute: "/feed",
    items: [
      { icon: Globe,  title: "Recent Launches",        sub: "21 projects launched this week" },
      { icon: RefreshCw, title: "Revival Success Stories", sub: "78% avg success rate" },
      { icon: Star,   title: "Top Performers",         sub: "See this week's top drafts" },
    ],
  },
};

// ── Component ────────────────────────────────────────────────────────────────

export function CompassFeed({ mode }: CompassFeedProps) {
  const navigate = useNavigate();
  const cfg = MODE_CONFIG[mode];
  const Icon = cfg.icon;

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
            {cfg.label}
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
              {cfg.label}
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
          {cfg.items.map((item, idx) => {
            const ItemIcon = item.icon;
            return (
              <motion.li
                key={item.title}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.07, duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/30 px-3 py-2.5 transition-colors duration-150 hover:bg-muted/60"
              >
                <span
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
                  style={{ background: cfg.accentHex + "18" }}
                >
                  <ItemIcon className="h-3.5 w-3.5" style={{ color: cfg.accentHex }} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold leading-tight text-foreground">{item.title}</p>
                  <p className="text-[11px] text-muted-foreground">{item.sub}</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
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
            onClick={() => navigate({ to: cfg.ctaRoute as "/" })}
            className="inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ color: cfg.accentHex }}
          >
            {cfg.cta} <ArrowRight className="h-3.5 w-3.5" />
          </motion.button>
        </AnimatePresence>
      </div>
    </div>
  );
}
