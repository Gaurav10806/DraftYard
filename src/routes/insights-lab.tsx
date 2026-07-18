import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
  AlertTriangle,
  Rocket,
  Award,
  Brain,
  Target,
  Activity,
  Clock,
  Trophy,
  BarChart3,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Database,
  Layers,
  Flame,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  Legend,
} from "recharts";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { TopBar } from "@/components/dashboard/top-bar";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/insights-lab")({
  head: () => ({
    meta: [
      { title: "Insights Lab · DraftYard" },
      {
        name: "description",
        content:
          "Learn from thousands of unfinished projects. AI-powered analytics on stack survival, stall patterns, and revival predictions.",
      },
      { property: "og:title", content: "Insights Lab · DraftYard" },
      {
        property: "og:description",
        content: "AI-powered analytics on why projects stall and how they get revived.",
      },
    ],
  }),
  component: InsightsLabPage,
});

const TABS = ["Overview", "Technology", "Stall DNA", "Revival Analytics", "Predictions"] as const;
type Tab = (typeof TABS)[number];

const ACCENT = "#aa3bff";
const VIOLET = "#7c5cff";
const CYAN = "#22d3ee";
const EMERALD = "#22c39a";
const AMBER = "#f59e0b";
const PINK = "#ec4899";
const BLUE = "#3b82f6";
const RED = "#ef4444";

const PALETTE = [ACCENT, VIOLET, CYAN, EMERALD, AMBER, PINK];

function InsightsLabPage() {
  const [tab, setTab] = useState<Tab>("Overview");

  return (
    <SidebarProvider>
      <div className="insights-page flex min-h-screen w-full bg-background text-foreground">
        <AppSidebar />
        <SidebarInset className="flex min-w-0 flex-1 flex-col">
          <TopBar showGreeting={false} />
          <main className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
            {/* Breadcrumb */}
            <nav className="text-xs text-muted-foreground">
              <span>DraftYard</span>
              <ChevronRight className="mx-1 inline h-3 w-3" />
              <span className="text-foreground">Insights Lab</span>
            </nav>

            {/* Page Header */}
            <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <h1 className="font-display text-[34px] font-semibold leading-tight tracking-tight">
                    Insights Lab
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                    <Sparkles className="h-3 w-3" /> AI Powered
                  </span>
                </div>
                <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
                  Learn from thousands of unfinished projects using AI-powered analytics.
                </p>
              </div>
            </header>

            {/* Tabs */}
            <div className="ins-tabs flex flex-wrap items-center gap-1 rounded-full border border-border/60 bg-card/60 p-1 backdrop-blur">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`relative rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                    tab === t
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === t && (
                    <motion.span
                      layoutId="ins-tab-pill"
                      className="absolute inset-0 rounded-full bg-primary shadow-[0_6px_20px_-6px_rgba(170,59,255,0.6)]"
                      transition={{ type: "spring", stiffness: 380, damping: 34 }}
                    />
                  )}
                  <span className="relative z-10">{t}</span>
                </button>
              ))}
            </div>

            {/* Tab body */}
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.24, ease: "easeOut" }}
              >
                {tab === "Overview" && <OverviewTab />}
                {tab === "Technology" && <TechnologyTab />}
                {tab === "Stall DNA" && <StallDNATab />}
                {tab === "Revival Analytics" && <RevivalTab />}
                {tab === "Predictions" && <PredictionsTab />}
              </motion.div>
            </AnimatePresence>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

/* ================== Shared UI ================== */

function Card({
  children,
  className = "",
  glow = false,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={`ins-card group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 transition-all duration-[220ms] hover:border-primary/40 hover:shadow-[0_10px_40px_-15px_rgba(170,59,255,0.35)] ${className}`}
    >
      {glow && <div className="ins-card-glow pointer-events-none absolute inset-0" aria-hidden />}
      <div className="relative">{children}</div>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  subtitle,
  badge,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  badge?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-[15px] font-semibold">{title}</h3>
            {badge && (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-500">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

const tooltipStyle = {
  background: "hsl(var(--popover, 240 6% 10%))",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10,
  fontSize: 12,
  padding: "8px 10px",
};

/* ================== OVERVIEW ================== */

function OverviewTab() {
  const funnel = [
    { stage: "Idea", count: 12840, pct: 100 },
    { stage: "Prototype", count: 7194, pct: 56 },
    { stage: "Building", count: 5265, pct: 41 },
    { stage: "Testing", count: 3080, pct: 24 },
    { stage: "Shipped", count: 1412, pct: 11 },
  ];

  const stageDist = [
    { stage: "Idea", value: 3210 },
    { stage: "Proto", value: 2680 },
    { stage: "Build", value: 3540 },
    { stage: "Test", value: 1998 },
    { stage: "Ship", value: 1412 },
  ];

  const fastestCategories = [
    { name: "UI / Web Apps", days: 19, growth: "+12%" },
    { name: "Developer Tools", days: 24, growth: "+8%" },
    { name: "AI / ML", days: 28, growth: "+22%" },
    { name: "Mobile Apps", days: 31, growth: "+4%" },
  ];

  const aiDiscoveries = [
    {
      title: "Solo founders finish 3x faster with AI copilots",
      tag: "Behavioral",
      time: "2h ago",
    },
    {
      title: "Projects with docs first ship 41% more often",
      tag: "Process",
      time: "8h ago",
    },
    {
      title: "React + Node stacks have 62% higher revival rate",
      tag: "Stack",
      time: "1d ago",
    },
    {
      title: "Scope creep kills 34% of projects at Build stage",
      tag: "Pattern",
      time: "2d ago",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Rotating AI Hero */}
      <RotatingAIHero />

      {/* Compact AI insight cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <AIMicroInsight
          tag="Hidden Opportunity"
          icon={Sparkles}
          tone={EMERALD}
          title="AI + Developer Tools is undervalued"
          desc="Projects mixing these domains ship 46% faster than average, but only 6% of new drafts pursue it."
        />
        <AIMicroInsight
          tag="Risk Alert"
          icon={AlertTriangle}
          tone={AMBER}
          title="Build stage is stalling faster"
          desc="Median time-to-stall in the Build phase dropped from 34 → 22 days over the last quarter."
        />
        <AIMicroInsight
          tag="Emerging Trend"
          icon={TrendingUp}
          tone={CYAN}
          title="TypeScript adoption crossed 74%"
          desc="TS projects now overtake JS in survival rate for the first time — a signal shift, not noise."
        />
      </div>

      {/* Funnel + Community Health */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle
            icon={BarChart3}
            title="Project Survival Funnel"
            subtitle="Only 11% of projects reach shipped stage — where do they fall off?"
            badge="Key Insight"
          />
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={funnel} layout="vertical" margin={{ left: 20, right: 40 }}>
                <defs>
                  <linearGradient id="fnl" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor={ACCENT} />
                    <stop offset="100%" stopColor={VIOLET} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--ins-grid)" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="stage"
                  stroke="var(--ins-axis)"
                  tickLine={false}
                  axisLine={false}
                  width={80}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(170,59,255,0.06)" }} />
                <Bar dataKey="count" fill="url(#fnl)" radius={[0, 10, 10, 0]} barSize={26}>
                  {funnel.map((_, i) => (
                    <Cell key={i} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <SectionTitle icon={Activity} title="Community Health" subtitle="30-day rolling average" />
          <div className="grid place-items-center py-6">
            <div className="relative grid h-32 w-32 place-items-center">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" stroke="var(--ins-ring-bg)" strokeWidth="8" fill="none" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke={ACCENT}
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={264}
                  strokeDashoffset={264 - 264 * 0.87}
                  strokeLinecap="round"
                />
              </svg>
              <div className="text-center">
                <div className="font-display text-3xl font-semibold">A−</div>
                <div className="text-[10px] text-muted-foreground">Health Score</div>
              </div>
            </div>
          </div>
          <div className="mt-3 space-y-2 text-xs">
            <HealthRow label="Projects Created" value="12,840" delta="+18%" up />
            <HealthRow label="Projects Revived" value="1,412" delta="+27%" up />
            <HealthRow label="Avg Revival Score" value="78/100" delta="+6%" up />
          </div>
        </Card>
      </div>

      {/* Stage Distribution + Stall Pattern */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle icon={Layers} title="Stage Distribution" subtitle="Where projects currently sit" />
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={stageDist}>
                <defs>
                  <linearGradient id="stgd" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={ACCENT} stopOpacity={0.95} />
                    <stop offset="100%" stopColor={VIOLET} stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--ins-grid)" vertical={false} />
                <XAxis dataKey="stage" stroke="var(--ins-axis)" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis stroke="var(--ins-axis)" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(170,59,255,0.06)" }} />
                <Bar dataKey="value" fill="url(#stgd)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <SectionTitle
            icon={AlertTriangle}
            title="Most Common Stall Pattern"
            subtitle="Across all analyzed projects"
          />
          <div className="flex items-center gap-6 py-4">
            <div className="relative grid h-32 w-32 shrink-0 place-items-center">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" stroke="var(--ins-ring-bg)" strokeWidth="10" fill="none" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke={AMBER}
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray={264}
                  strokeDashoffset={264 - 264 * 0.34}
                  strokeLinecap="round"
                />
              </svg>
              <div className="text-center">
                <div className="font-display text-2xl font-semibold">34%</div>
                <div className="text-[10px] text-muted-foreground">of projects</div>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-amber-500">Scope Creep</div>
              <h4 className="mt-1 font-display text-lg font-semibold">Kept adding features</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                The #1 killer of projects at the Build stage. Teams add features without shipping the core.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                <MetricPill label="Avg revival" value="48%" />
                <MetricPill label="Fix time" value="~2 wks" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Fastest Revived + AI Discoveries */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle icon={Rocket} title="Fastest Revived Categories" subtitle="Median days from claim to ship" />
          <ul className="space-y-3">
            {fastestCategories.map((c, i) => (
              <li
                key={c.name}
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/40 p-3 transition hover:border-primary/40"
              >
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 font-display text-sm font-semibold text-primary">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{c.name}</div>
                  <div className="text-[11px] text-muted-foreground">Avg {c.days} days</div>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-500">
                  {c.growth}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <SectionTitle icon={Brain} title="Recent AI Discoveries" subtitle="What our engine noticed this week" />
          <ul className="space-y-2.5">
            {aiDiscoveries.map((d) => (
              <li
                key={d.title}
                className="group/item flex items-start gap-3 rounded-xl border border-border/50 bg-background/40 p-3 transition hover:border-primary/40"
              >
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Lightbulb className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium leading-snug">{d.title}</div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">{d.tag}</span>
                    <span>{d.time}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function HealthRow({ label, value, delta, up }: { label: string; value: string; delta: string; up?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2">
        <span className="font-display text-sm font-semibold">{value}</span>
        <span className={`text-[10px] font-semibold ${up ? "text-emerald-500" : "text-red-500"}`}>{delta}</span>
      </span>
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-background/40 px-2.5 py-1.5">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="font-display text-sm font-semibold">{value}</div>
    </div>
  );
}

/* ---- Rotating AI hero + micro insight cards ---- */

const HERO_INSIGHTS = [
  {
    label: "Hidden Pattern",
    number: "#42",
    headline: (
      <>
        Projects with 3+ contributors are{" "}
        <span className="text-primary">2.4× more likely</span> to be revived than solo projects.
      </>
    ),
    detail:
      "Based on 12,840 projects analyzed across the last 90 days. Collaboration boosts completion, but only when documentation is present in the first two weeks.",
  },
  {
    label: "Biggest Discovery",
    number: "#118",
    headline: (
      <>
        Drafts that ship a working prototype in <span className="text-primary">14 days</span> reach production 3.1× more often.
      </>
    ),
    detail:
      "The 14-day prototype window is the strongest single predictor of shipping. Momentum, not scope, is what carries a project across the line.",
  },
  {
    label: "AI Insight",
    number: "#24",
    headline: (
      <>
        <span className="text-primary">Scope Creep</span> silently causes 34% of Build-stage stalls — more than burnout and technical debt combined.
      </>
    ),
    detail:
      "Teams that lock scope at kickoff and enforce a 5-day feature timebox reduce stall risk by 48%. It's the highest-leverage intervention we've measured.",
  },
  {
    label: "Emerging Signal",
    number: "#77",
    headline: (
      <>
        TypeScript projects overtook JavaScript in <span className="text-primary">survival rate</span> for the first time.
      </>
    ),
    detail:
      "Adoption crossed 74% in June and correlates with an 18% reduction in production regressions across matched projects.",
  },
];

function RotatingAIHero() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % HERO_INSIGHTS.length), 6000);
    return () => clearInterval(t);
  }, []);
  const item = HERO_INSIGHTS[i];
  return (
    <Card glow className="!p-0">
      <div className="relative flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between md:p-8">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-fuchsia-500 text-white shadow-lg shadow-primary/40">
            <Sparkles className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-primary">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              {item.label} <span className="text-muted-foreground/70">·</span> <span className="text-muted-foreground/80">{item.number}</span>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <h2 className="mt-1 font-display text-xl font-semibold leading-tight md:text-2xl">
                  {item.headline}
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{item.detail}</p>
              </motion.div>
            </AnimatePresence>
            <div className="mt-4 flex items-center gap-1.5">
              {HERO_INSIGHTS.map((_, idx) => (
                <button
                  key={idx}
                  aria-label={`Insight ${idx + 1}`}
                  onClick={() => setI(idx)}
                  className={`h-1.5 rounded-full transition-all ${idx === i ? "w-8 bg-primary" : "w-3 bg-border hover:bg-muted-foreground/40"}`}
                />
              ))}
            </div>
          </div>
        </div>
        <Button className="shrink-0 rounded-full bg-primary hover:bg-primary/90">
          See analysis <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

function AIMicroInsight({
  tag,
  icon: Icon,
  tone,
  title,
  desc,
}: {
  tag: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  title: string;
  desc: string;
}) {
  return (
    <div
      className="ins-card group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 transition-all duration-[220ms] hover:-translate-y-0.5"
      style={{ boxShadow: `inset 0 1px 0 0 ${tone}22` }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-40 blur-2xl transition-opacity duration-300 group-hover:opacity-70"
        style={{ background: `radial-gradient(circle, ${tone}44, transparent 70%)` }}
        aria-hidden
      />
      <div className="relative flex items-center gap-2">
        <span
          className="grid h-8 w-8 place-items-center rounded-lg"
          style={{ background: `${tone}1a`, color: tone }}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{ background: `${tone}1a`, color: tone }}
        >
          {tag}
        </span>
      </div>
      <div className="relative mt-3 font-display text-sm font-semibold leading-snug">{title}</div>
      <p className="relative mt-1.5 text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}

/* ================== TECHNOLOGY ================== */

function TechnologyTab() {
  const stackSurvival = [
    { name: "React", rate: 83 },
    { name: "Next.js", rate: 80 },
    { name: "Vue.js", rate: 67 },
    { name: "Flutter", rate: 63 },
    { name: "Angular", rate: 52 },
    { name: "Django", rate: 45 },
    { name: "Svelte", rate: 41 },
    { name: "Unity", rate: 26 },
  ];

  const frameworks = [
    { rank: 1, name: "React", value: 83 },
    { rank: 2, name: "Next.js", value: 80 },
    { rank: 3, name: "Vue.js", value: 67 },
    { rank: 4, name: "Flutter", value: 63 },
    { rank: 5, name: "Angular", value: 52 },
  ];

  const databases = [
    { name: "MongoDB", value: 38 },
    { name: "PostgreSQL", value: 24 },
    { name: "MySQL", value: 18 },
    { name: "Firebase", value: 12 },
    { name: "Others", value: 8 },
  ];

  const trending = [
    { month: "Jan", TypeScript: 40, JavaScript: 60, Python: 32 },
    { month: "Feb", TypeScript: 48, JavaScript: 58, Python: 36 },
    { month: "Mar", TypeScript: 55, JavaScript: 55, Python: 40 },
    { month: "Apr", TypeScript: 62, JavaScript: 52, Python: 42 },
    { month: "May", TypeScript: 68, JavaScript: 50, Python: 45 },
    { month: "Jun", TypeScript: 74, JavaScript: 48, Python: 48 },
  ];

  return (
    <div className="space-y-6">
      {/* Hero: Stack Survival */}
      <Card glow>
        <SectionTitle
          icon={Cpu}
          title="Stack Survival Rate"
          subtitle="React and Next.js projects have the highest completion rate across 12,840 projects."
          badge="Key Insight"
        />
        <div className="h-80">
          <ResponsiveContainer>
            <BarChart data={stackSurvival} margin={{ left: 20, right: 20 }}>
              <defs>
                <linearGradient id="ssr" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={ACCENT} />
                  <stop offset="100%" stopColor={VIOLET} stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--ins-grid)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--ins-axis)" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--ins-axis)" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} unit="%" />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(170,59,255,0.06)" }} formatter={(v) => `${v}%`} />
              <Bar dataKey="rate" fill="url(#ssr)" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Frameworks + Databases */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle icon={Award} title="Framework Success Ranking" subtitle="Ranked by ship rate" />
          <ul className="space-y-2.5">
            {frameworks.map((f) => (
              <li
                key={f.name}
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/40 p-3"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/15 font-display text-xs font-semibold text-primary">
                  {f.rank}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{f.name}</span>
                <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-fuchsia-500"
                    style={{ width: `${f.value}%` }}
                  />
                </div>
                <span className="w-10 text-right font-display text-sm font-semibold">{f.value}%</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <SectionTitle icon={Database} title="Database Usage" subtitle="Ranked by share across all projects" />
          <ul className="space-y-2.5">
            {databases.map((d, i) => (
              <li
                key={d.name}
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/40 p-3"
              >
                <span
                  className="grid h-7 w-7 place-items-center rounded-full font-display text-xs font-semibold"
                  style={{ background: `${PALETTE[i % PALETTE.length]}1a`, color: PALETTE[i % PALETTE.length] }}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{d.name}</span>
                <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(d.value / 40) * 100}%`,
                      background: `linear-gradient(90deg, ${PALETTE[i % PALETTE.length]}, ${PALETTE[i % PALETTE.length]}80)`,
                    }}
                  />
                </div>
                <span className="w-10 text-right font-display text-sm font-semibold">{d.value}%</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Trending + Recommendation */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle icon={TrendingUp} title="Trending Technologies" subtitle="Adoption over the last 6 months" />
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={trending}>
                <CartesianGrid stroke="var(--ins-grid)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--ins-axis)" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--ins-axis)" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="TypeScript" stroke={ACCENT} strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="JavaScript" stroke={AMBER} strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="Python" stroke={CYAN} strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card glow>
          <SectionTitle
            icon={Lightbulb}
            title="AI Tech Recommendations"
            subtitle="Optimal stack for your next build"
          />
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <TechChip>React</TechChip>
              <span className="text-muted-foreground">+</span>
              <TechChip>Node.js</TechChip>
              <span className="text-muted-foreground">+</span>
              <TechChip>MongoDB</TechChip>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              This combination gives <span className="font-semibold text-primary">3.1× higher revival probability</span>{" "}
              than the average stack, with the fastest median ship time (24 days).
            </p>
          </div>
          <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
            <RecItem>Add TypeScript for 18% fewer production bugs</RecItem>
            <RecItem>Use Tailwind CSS — 2.4× faster to prototype UI</RecItem>
            <RecItem>Deploy on Vercel for automatic preview branches</RecItem>
          </ul>
        </Card>
      </div>
    </div>
  );
}

function TechChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 font-display text-sm font-semibold text-primary">
      {children}
    </span>
  );
}

function RecItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
      <span>{children}</span>
    </li>
  );
}

/* ================== STALL DNA ================== */

type StallPattern = {
  id: string;
  name: string;
  pct: number;
  count: number;
  revival: number; // %
  fix: number; // weeks
  color: string;
};

const STALL_PATTERNS: StallPattern[] = [
  { id: "scope",     name: "Scope Creep",         pct: 26, count: 412, revival: 41, fix: 4, color: ACCENT },
  { id: "burnout",   name: "Solo Burnout",        pct: 21, count: 338, revival: 33, fix: 5, color: PINK },
  { id: "data",      name: "Waiting on Data",     pct: 9,  count: 146, revival: 58, fix: 2, color: CYAN },
  { id: "motiv",     name: "Lack of Motivation",  pct: 8,  count: 108, revival: 22, fix: 6, color: AMBER },
  { id: "tech",      name: "Technical Debt",      pct: 7,  count:  96, revival: 47, fix: 3, color: BLUE },
  { id: "market",    name: "No Market Fit",       pct: 6,  count:  72, revival: 51, fix: 2, color: EMERALD },
  { id: "team",      name: "Team Fell Apart",     pct: 3,  count:  38, revival: 19, fix: 7, color: VIOLET },
  { id: "perfect",   name: "Perfectionism",       pct: 6,  count:  74, revival: 44, fix: 3, color: "#f472b6" },
  { id: "cost",      name: "Cost / Funding",      pct: 5,  count:  62, revival: 36, fix: 4, color: "#22c55e" },
  { id: "distract",  name: "Distraction",         pct: 4,  count:  54, revival: 30, fix: 3, color: "#eab308" },
  { id: "paralysis", name: "Analysis Paralysis",  pct: 3,  count:  42, revival: 39, fix: 3, color: "#38bdf8" },
  { id: "platform",  name: "Platform Change",     pct: 2,  count:  28, revival: 55, fix: 2, color: "#a855f7" },
];

// Similarity (0..1) drives spring rest length: higher = closer.
const STALL_EDGES: Array<[string, string, number]> = [
  ["scope",     "burnout",   0.82],
  ["scope",     "tech",      0.68],
  ["scope",     "motiv",     0.55],
  ["scope",     "perfect",   0.72],
  ["scope",     "paralysis", 0.6],
  ["burnout",   "motiv",     0.78],
  ["burnout",   "team",      0.7],
  ["burnout",   "distract",  0.55],
  ["burnout",   "cost",      0.42],
  ["data",      "tech",      0.62],
  ["data",      "paralysis", 0.5],
  ["data",      "platform",  0.55],
  ["motiv",     "market",    0.5],
  ["motiv",     "distract",  0.6],
  ["motiv",     "cost",      0.48],
  ["market",    "data",      0.45],
  ["market",    "cost",      0.62],
  ["market",    "platform",  0.5],
  ["tech",      "burnout",   0.4],
  ["tech",      "perfect",   0.58],
  ["tech",      "platform",  0.6],
  ["team",      "motiv",     0.5],
  ["team",      "cost",      0.5],
  ["perfect",   "paralysis", 0.75],
  ["perfect",   "motiv",     0.5],
  ["distract",  "paralysis", 0.55],
  ["cost",      "platform",  0.48],
];

function StallDNATab() {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const active = hoverId ?? selectedId;
  const selected = STALL_PATTERNS.find((p) => p.id === selectedId) ?? null;

  const neighbors = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    STALL_PATTERNS.forEach((p) => (map[p.id] = new Set()));
    STALL_EDGES.forEach(([a, b]) => {
      map[a].add(b);
      map[b].add(a);
    });
    return map;
  }, []);

  const isDim = (id: string) => active !== null && active !== id && !neighbors[active]?.has(id);

  const dangerZone = [
    { stage: "Idea", risk: 8 },
    { stage: "Prototype", risk: 34 },
    { stage: "Building", risk: 41 },
    { stage: "Testing", risk: 13 },
    { stage: "Shipped", risk: 4 },
  ];

  const fixesByPattern: Record<string, string[]> = {
    scope:   ["Freeze scope at kickoff; use a milestone lock", "Cut features aggressively — ship the 20% users need", "Timebox each feature to ≤ 5 days"],
    burnout: ["Add at least one collaborator — solo burnout drops 62%", "Enforce a weekly cadence, not daily grind", "Publish progress publicly for accountability"],
    data:    ["Ship a stub dataset first, refine later", "Buy or synthesize data instead of waiting", "Move to a dependency-free MVP path"],
    motiv:   ["Validate with 5 users before more code", "Attach a small deadline (demo day)", "Rewrite the elevator pitch — is it still exciting?"],
    tech:    ["Refactor the smallest painful path first", "Delete abandoned branches to reduce weight", "Introduce tests only around the change surface"],
    market:  ["Interview 10 potential users this week", "Reframe as a feature, not a product", "Pivot audience before pivoting product"],
    team:    ["Split ownership by module, not by task", "Weekly 15-min sync — nothing longer", "Define who ships the final build"],
  };

  const genericFixes = [
    "Break features into smaller milestones",
    "Add collaborators early — solo burnout drops 62%",
    "Ship a working prototype in 2 weeks",
    "Validate the idea with 5 real users before coding",
    "Lock the MVP under 4 weeks to preserve momentum",
  ];

  const displayedFixes = selected ? fixesByPattern[selected.id] : genericFixes;

  return (
    <div className="space-y-6">
      {/* Force-directed hero */}
      <Card glow className="!p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 p-5">
          <SectionTitle
            icon={Sparkles}
            title="Stall DNA · Cluster Map"
            subtitle="Force-directed clustering of stall patterns. Node size = projects, distance = similarity."
            badge="Interactive"
          />
          {selected && (
            <button
              onClick={() => setSelectedId(null)}
              className="rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground transition hover:border-border hover:text-foreground"
            >
              Filtered: <span style={{ color: selected.color }}>{selected.name}</span> · clear ×
            </button>
          )}
        </div>
        <StallNetworkGraph
          patterns={STALL_PATTERNS}
          edges={STALL_EDGES}
          hoverId={hoverId}
          selectedId={selectedId}
          onHover={setHoverId}
          onSelect={(id) => setSelectedId((prev) => (prev === id ? null : id))}
        />
      </Card>

      {/* Top patterns + Danger zone */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle icon={Flame} title="Top Stall Patterns" subtitle="Ranked by frequency" />
          <ul className="space-y-3">
            {STALL_PATTERNS.slice(0, 6).map((p) => {
              const dim = isDim(p.id);
              const highlighted = active === p.id || selectedId === p.id;
              return (
                <li
                  key={p.id}
                  onMouseEnter={() => setHoverId(p.id)}
                  onMouseLeave={() => setHoverId(null)}
                  onClick={() => setSelectedId((prev) => (prev === p.id ? null : p.id))}
                  className="cursor-pointer transition-opacity duration-200"
                  style={{ opacity: dim ? 0.35 : 1 }}
                >
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-medium">
                      <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color, boxShadow: highlighted ? `0 0 0 3px ${p.color}33` : "none" }} />
                      {p.name}
                    </span>
                    <span className="font-display font-semibold" style={{ color: p.color }}>{p.pct}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${p.pct * 2.8}%` }}
                      transition={{ duration: 0.9, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${p.color}, ${p.color}80)` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card>
          <SectionTitle icon={AlertTriangle} title="Stage Danger Zone" subtitle="Where projects are most likely to stall" />
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={dangerZone}>
                <defs>
                  <linearGradient id="dz" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={RED} />
                    <stop offset="100%" stopColor={AMBER} stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--ins-grid)" vertical={false} />
                <XAxis dataKey="stage" stroke="var(--ins-axis)" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis stroke="var(--ins-axis)" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v}%`} cursor={{ fill: "rgba(239,68,68,0.06)" }} />
                <Bar dataKey="risk" fill="url(#dz)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Fixes + breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle
            icon={Lightbulb}
            title="AI Fix Suggestions"
            subtitle={selected ? `Tailored to ${selected.name}` : "Proven interventions across all clusters"}
          />
          <ul className="space-y-2.5">
            {displayedFixes.map((f, i) => (
              <li
                key={f}
                className="flex items-start gap-3 rounded-xl border border-border/50 bg-background/40 p-3"
              >
                <span
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-white"
                  style={{ background: (selected?.color ?? EMERALD) + "22", color: selected?.color ?? EMERALD }}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </span>
                <div className="text-sm">
                  <span className="text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>{" "}
                  <span className="font-medium">{f}</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <SectionTitle icon={Target} title="Pattern Breakdown" subtitle="Revival rate & avg fix time per cluster" />
          <ul className="space-y-2.5">
            {STALL_PATTERNS.slice(0, 5).map((p) => {
              const dim = isDim(p.id);
              return (
                <li
                  key={p.id}
                  onMouseEnter={() => setHoverId(p.id)}
                  onMouseLeave={() => setHoverId(null)}
                  onClick={() => setSelectedId((prev) => (prev === p.id ? null : p.id))}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/50 bg-background/40 p-3 transition-opacity duration-200"
                  style={{ opacity: dim ? 0.35 : 1 }}
                >
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white"
                    style={{ background: `linear-gradient(135deg, ${p.color}, ${p.color}80)` }}
                  >
                    <span className="text-xs font-semibold">{p.pct}%</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      Revival {p.revival}% · Avg fix ~{p.fix} wks · {p.count} projects
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      {/* CTA */}
      <Card glow className="!p-0">
        <div className="flex flex-col items-start gap-4 p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <h3 className="font-display text-xl font-semibold">Ready to see your project's Stall DNA?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Get a personalized breakdown of stall risk, patterns, and AI-recommended fixes.
            </p>
          </div>
          <Button size="lg" className="rounded-full bg-primary shadow-lg shadow-primary/30 hover:bg-primary/90">
            Analyze My Project <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

/* ---------- Force-directed graph ---------- */

type SimNode = {
  id: string;
  kind: "cluster" | "satellite";
  clusterId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  ref: StallPattern;
};

const GRAPH_W = 1400;
const GRAPH_H = 780;
const SAT_MIN = 15;
const SAT_MAX = 25;

// Simple deterministic PRNG for stable initial placement.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function StallNetworkGraph({
  patterns,
  edges,
  hoverId,
  selectedId,
  onHover,
  onSelect,
}: {
  patterns: StallPattern[];
  edges: Array<[string, string, number]>;
  hoverId: string | null;
  selectedId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  // Use the top 6 patterns by count as cluster centers.
  const clusters = useMemo(
    () => [...patterns].sort((a, b) => b.count - a.count).slice(0, 6),
    [patterns],
  );
  const clusterIds = useMemo(() => new Set(clusters.map((c) => c.id)), [clusters]);
  const clusterEdges = useMemo(
    () => edges.filter(([a, b]) => clusterIds.has(a) && clusterIds.has(b)),
    [edges, clusterIds],
  );

  const nodesRef = useRef<SimNode[]>([]);
  const [, force] = useState(0);
  const rafRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Initialize once
  if (nodesRef.current.length === 0) {
    const cx = GRAPH_W / 2;
    const cy = GRAPH_H / 2;
    const rand = mulberry32(9137);

    // Randomized (non-symmetric) initial cluster placement across canvas.
    const clusterNodes: SimNode[] = clusters.map((p) => {
      return {
        id: p.id,
        kind: "cluster",
        clusterId: p.id,
        x: cx + (rand() - 0.5) * GRAPH_W * 0.7,
        y: cy + (rand() - 0.5) * GRAPH_H * 0.7,
        vx: 0,
        vy: 0,
        r: 26 + Math.sqrt(p.count) * 1.35,
        ref: p,
      };
    });

    // 15-25 satellites per cluster (deterministic).
    const satNodes: SimNode[] = [];
    clusters.forEach((c, i) => {
      const center = clusterNodes[i];
      const count = SAT_MIN + Math.floor(rand() * (SAT_MAX - SAT_MIN + 1));
      for (let k = 0; k < count; k++) {
        const a = rand() * Math.PI * 2;
        const rr = 50 + rand() * 90;
        satNodes.push({
          id: `${c.id}-sat-${k}`,
          kind: "satellite",
          clusterId: c.id,
          x: center.x + Math.cos(a) * rr,
          y: center.y + Math.sin(a) * rr,
          vx: 0,
          vy: 0,
          r: 3.2 + rand() * 3.2,
          ref: c,
        });
      }
    });

    nodesRef.current = [...clusterNodes, ...satNodes];
  }

  useEffect(() => {
    const nodes = nodesRef.current;
    const clusterIdxById = new Map<string, number>();
    nodes.forEach((n, i) => {
      if (n.kind === "cluster") clusterIdxById.set(n.id, i);
    });

    const edgeMap = clusterEdges.map(([a, b, s]) => ({
      a: clusterIdxById.get(a)!,
      b: clusterIdxById.get(b)!,
      s,
    }));

    // For each satellite, cache its cluster index.
    const satToCluster = nodes.map((n) =>
      n.kind === "satellite" ? clusterIdxById.get(n.clusterId)! : -1,
    );

    let alpha = 1;
    const tick = () => {
      const cx = GRAPH_W / 2;
      const cy = GRAPH_H / 2;

      // Pairwise repulsion (weaker for satellites)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          let dx = b.x - a.x, dy = b.y - a.y;
          let d2 = dx * dx + dy * dy;
          if (d2 < 1) d2 = 1;
          const d = Math.sqrt(d2);
          const bothCluster = a.kind === "cluster" && b.kind === "cluster";
          const anyCluster = a.kind === "cluster" || b.kind === "cluster";
          const strength = bothCluster ? 6800 : anyCluster ? 900 : 260;
          const f = (strength / d2) * alpha;
          const fx = (dx / d) * f;
          const fy = (dy / d) * f;
          a.vx -= fx; a.vy -= fy;
          b.vx += fx; b.vy += fy;
        }
      }

      // Cluster-cluster springs
      edgeMap.forEach(({ a, b, s }) => {
        const na = nodes[a], nb = nodes[b];
        const dx = nb.x - na.x, dy = nb.y - na.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const rest = 320 - s * 140;
        const k = 0.018;
        const f = (d - rest) * k * alpha;
        const fx = (dx / d) * f, fy = (dy / d) * f;
        na.vx += fx; na.vy += fy;
        nb.vx -= fx; nb.vy -= fy;
      });

      // Satellite → cluster tether (strong short spring)
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (n.kind !== "satellite") continue;
        const c = nodes[satToCluster[i]];
        const dx = c.x - n.x, dy = c.y - n.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const rest = 72;
        const k = 0.05;
        const f = (d - rest) * k * alpha;
        n.vx += (dx / d) * f;
        n.vy += (dy / d) * f;
      }

      // Gentle centering
      nodes.forEach((n) => {
        const c = n.kind === "cluster" ? 0.004 : 0.0015;
        n.vx += (cx - n.x) * c * alpha;
        n.vy += (cy - n.y) * c * alpha;
      });

      // Damping + integrate
      nodes.forEach((n) => {
        n.vx *= 0.82;
        n.vy *= 0.82;
        n.x += n.vx;
        n.y += n.vy;
        const pad = n.r + 8;
        n.x = Math.max(pad, Math.min(GRAPH_W - pad, n.x));
        n.y = Math.max(pad, Math.min(GRAPH_H - pad, n.y));
      });

      alpha = Math.max(0.05, alpha * 0.995);
      force((v) => (v + 1) % 1000000);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active = hoverId ?? selectedId;
  const neighborSet = useMemo(() => {
    const s = new Set<string>();
    if (!active) return s;
    clusterEdges.forEach(([a, b]) => {
      if (a === active) s.add(b);
      if (b === active) s.add(a);
    });
    return s;
  }, [active, clusterEdges]);

  const nodes = nodesRef.current;
  const activeNode = active ? nodes.find((n) => n.id === active && n.kind === "cluster") : null;

  const isDimmed = (n: SimNode) => {
    if (!active) return false;
    if (n.kind === "cluster") return n.id !== active && !neighborSet.has(n.id);
    return n.clusterId !== active;
  };

  return (
    <div>
      <div ref={containerRef} className="dna-net relative overflow-hidden" style={{ height: GRAPH_H * 0.5 }}>
        <div className="dna-net-bg absolute inset-0" aria-hidden />
        <svg
          viewBox={`0 0 ${GRAPH_W} ${GRAPH_H}`}
          preserveAspectRatio="xMidYMid meet"
          className="relative h-full w-full"
          onMouseLeave={() => { onHover(null); setTooltipPos(null); }}
        >
          <defs>
            {clusters.map((p) => (
              <radialGradient key={p.id} id={`dna-fill-${p.id}`} cx="35%" cy="30%" r="75%">
                <stop offset="0%" stopColor={p.color} stopOpacity="0.95" />
                <stop offset="60%" stopColor={p.color} stopOpacity="0.5" />
                <stop offset="100%" stopColor={p.color} stopOpacity="0.15" />
              </radialGradient>
            ))}
          </defs>

          {/* Cluster-to-cluster edges */}
          <g>
            {clusterEdges.map(([a, b, s], i) => {
              const na = nodes.find((n) => n.id === a && n.kind === "cluster")!;
              const nb = nodes.find((n) => n.id === b && n.kind === "cluster")!;
              const highlighted = !!active && (a === active || b === active);
              const dimmed = !!active && !highlighted;
              const stroke = highlighted ? na.ref.color : "var(--dna-edge)";
              return (
                <line
                  key={i}
                  x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
                  stroke={stroke}
                  strokeWidth={highlighted ? 1.6 : 0.9}
                  strokeOpacity={dimmed ? 0.05 : highlighted ? 0.85 : 0.2 + s * 0.15}
                  style={{
                    transition: "stroke-opacity 200ms ease, stroke-width 200ms ease",
                    animation: highlighted ? "dna-edge-flow 1.6s linear infinite" : undefined,
                  }}
                />
              );
            })}
          </g>

          {/* Satellite tethers */}
          <g>
            {nodes.map((n) => {
              if (n.kind !== "satellite") return null;
              const c = nodes.find((m) => m.kind === "cluster" && m.id === n.clusterId)!;
              const highlighted = active === n.clusterId;
              const dimmed = !!active && !highlighted;
              return (
                <line
                  key={`t-${n.id}`}
                  x1={c.x} y1={c.y} x2={n.x} y2={n.y}
                  stroke={highlighted ? c.ref.color : "var(--dna-edge)"}
                  strokeWidth={0.7}
                  strokeOpacity={dimmed ? 0.04 : highlighted ? 0.55 : 0.16}
                  style={{ transition: "stroke-opacity 200ms ease" }}
                />
              );
            })}
          </g>

          {/* Satellite nodes */}
          <g>
            {nodes.map((n) => {
              if (n.kind !== "satellite") return null;
              const highlighted = active === n.clusterId;
              const dimmed = !!active && !highlighted;
              return (
                <circle
                  key={n.id}
                  cx={n.x}
                  cy={n.y}
                  r={n.r * (highlighted ? 1.25 : 1)}
                  fill={n.ref.color}
                  fillOpacity={dimmed ? 0.18 : highlighted ? 0.95 : 0.7}
                  stroke={n.ref.color}
                  strokeOpacity={dimmed ? 0.15 : 0.6}
                  strokeWidth={0.6}
                  style={{ transition: "r 200ms ease, fill-opacity 200ms ease" }}
                />
              );
            })}
          </g>

          {/* Cluster nodes */}
          <g>
            {nodes.map((n) => {
              if (n.kind !== "cluster") return null;
              const isActive = active === n.id;
              const dimmed = isDimmed(n);
              const r = n.r * (isActive ? 1.12 : 1);
              return (
                <g
                  key={n.id}
                  style={{
                    cursor: "pointer",
                    opacity: dimmed ? 0.3 : 1,
                    transition: "opacity 200ms ease",
                  }}
                  onMouseEnter={() => {
                    onHover(n.id);
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (rect) {
                      const scaleX = rect.width / GRAPH_W;
                      const scaleY = rect.height / GRAPH_H;
                      setTooltipPos({ x: n.x * scaleX, y: n.y * scaleY - r * scaleY - 12 });
                    }
                  }}
                  onMouseLeave={() => setTooltipPos(null)}
                  onClick={() => onSelect(n.id)}
                >
                  {isActive && (
                    <circle cx={n.x} cy={n.y} r={r + 16} fill={n.ref.color} opacity={0.15} />
                  )}
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={r}
                    fill={`url(#dna-fill-${n.id})`}
                    stroke={n.ref.color}
                    strokeOpacity={isActive ? 0.9 : 0.55}
                    strokeWidth={isActive ? 1.6 : 1}
                    style={{ transition: "r 200ms ease" }}
                  />
                  <text
                    x={n.x}
                    y={n.y + r + 18}
                    textAnchor="middle"
                    className="dna-net-label"
                    style={{ fontSize: 12, fontWeight: 600, pointerEvents: "none" }}
                  >
                    {n.ref.name}
                  </text>
                  <text
                    x={n.x}
                    y={n.y + 5}
                    textAnchor="middle"
                    fill="#fff"
                    style={{ fontSize: r > 40 ? 16 : 13, fontWeight: 700, pointerEvents: "none" }}
                  >
                    {n.ref.count}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {activeNode && tooltipPos && (
          <div
            className="dna-net-tooltip pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-xl border border-border/60 bg-popover/95 px-3 py-2 text-xs shadow-xl backdrop-blur"
            style={{ left: tooltipPos.x, top: tooltipPos.y }}
          >
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: activeNode.ref.color }} />
              <span className="font-display font-semibold">{activeNode.ref.name}</span>
            </div>
            <div className="mt-1 grid grid-cols-3 gap-3 text-[11px] text-muted-foreground">
              <div><div className="text-foreground font-semibold">{activeNode.ref.count}</div>projects</div>
              <div><div className="text-foreground font-semibold">{activeNode.ref.revival}%</div>avg revival</div>
              <div><div className="text-foreground font-semibold">~{activeNode.ref.fix}w</div>avg fix</div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/60 px-5 py-3 text-[11px] text-muted-foreground">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {clusters.map((c) => (
            <button
              key={c.id}
              onMouseEnter={() => onHover(c.id)}
              onMouseLeave={() => onHover(null)}
              onClick={() => onSelect(c.id)}
              className="flex items-center gap-1.5 transition hover:text-foreground"
            >
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
              <span className="font-medium">{c.name}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>◦ Node size = project count</span>
          <span>— Distance = similarity</span>
          <span>● Color = stall category</span>
        </div>
      </div>
    </div>
  );
}


/* ================== REVIVAL ANALYTICS ================== */

function RevivalTab() {
  const revivalTrend = [
    { pattern: "Technical Debt", rate: 72 },
    { pattern: "Scope Creep", rate: 46 },
    { pattern: "Waiting on Data", rate: 42 },
    { pattern: "Lack of Motivation", rate: 30 },
    { pattern: "Solo Burnout", rate: 18 },
  ];

  const overTime = [
    { m: "Jan", v: 120 },
    { m: "Feb", v: 165 },
    { m: "Mar", v: 210 },
    { m: "Apr", v: 240 },
    { m: "May", v: 305 },
    { m: "Jun", v: 372 },
    { m: "Jul", v: 412 },
  ];

  const domains = [
    { name: "Web Development", value: 38 },
    { name: "AI / ML", value: 21 },
    { name: "Mobile Apps", value: 15 },
    { name: "Developer Tools", value: 12 },
    { name: "Others", value: 14 },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Hero Insight */}
      <Card glow className="!p-0">
        <div className="relative flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-fuchsia-500 text-white shadow-lg shadow-primary/40">
              <Rocket className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-primary">
                Revival Hero Insight
              </div>
              <h2 className="mt-1 font-display text-xl font-semibold leading-tight md:text-2xl">
                <span className="text-primary">1,412 drafts</span> were revived this quarter — the fastest{" "}
                <span className="text-primary">1 in 6</span> shipped in under 10 days.
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Momentum, not scope, is the strongest predictor of revival. Small teams claiming clearly-scoped
                drafts consistently outperform larger takeovers.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 md:min-w-[280px]">
            <SummaryStat value="1,412" label="Revived" tone={ACCENT} />
            <SummaryStat value="78%" label="Score" tone={EMERALD} />
            <SummaryStat value="26.4d" label="Time" tone={CYAN} />
          </div>
        </div>
      </Card>

      {/* 2. Revival Probability */}
      <Card>
        <SectionTitle
          icon={TrendingUp}
          title="Revival Probability"
          subtitle="How likely each stall pattern is to be revived once claimed."
          badge="Key Insight"
        />
        <div className="h-80">
          <ResponsiveContainer>
            <BarChart data={revivalTrend} margin={{ left: 20, right: 20 }}>
              <defs>
                {revivalTrend.map((_, i) => (
                  <linearGradient id={`rvt-${i}`} key={i} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={PALETTE[i % PALETTE.length]} />
                    <stop offset="100%" stopColor={PALETTE[i % PALETTE.length]} stopOpacity={0.4} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid stroke="var(--ins-grid)" vertical={false} />
              <XAxis dataKey="pattern" stroke="var(--ins-axis)" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
              <YAxis stroke="var(--ins-axis)" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} unit="%" />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v}%`} cursor={{ fill: "rgba(170,59,255,0.06)" }} />
              <Bar dataKey="rate" radius={[10, 10, 0, 0]}>
                {revivalTrend.map((_, i) => (
                  <Cell key={i} fill={`url(#rvt-${i})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 3. Revival Trend */}
      <Card>
        <SectionTitle icon={Activity} title="Revival Trend" subtitle="Cumulative revivals over the last 7 months" />
        <div className="h-72">
          <ResponsiveContainer>
            <AreaChart data={overTime}>
              <defs>
                <linearGradient id="rov" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={ACCENT} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--ins-grid)" vertical={false} />
              <XAxis dataKey="m" stroke="var(--ins-axis)" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
              <YAxis stroke="var(--ins-axis)" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="v" stroke={ACCENT} strokeWidth={2.5} fill="url(#rov)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 4. Fastest Revived Domains + 5. Average Revival Time */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle icon={Layers} title="Fastest Revived Domains" subtitle="Ranked by share of revivals shipped fastest" />
          <ul className="mt-2 space-y-3">
            {domains.map((d, i) => (
              <li key={d.name} className="flex items-center gap-3">
                <span
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full font-display text-xs font-semibold"
                  style={{ background: `${PALETTE[i % PALETTE.length]}1a`, color: PALETTE[i % PALETTE.length] }}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium">{d.name}</span>
                    <span className="font-display font-semibold">{d.value}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${d.value * 2.5}%`,
                        background: `linear-gradient(90deg, ${PALETTE[i % PALETTE.length]}, ${PALETTE[i % PALETTE.length]}66)`,
                      }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <SectionTitle icon={Clock} title="Average Revival Time" />
          <div className="grid place-items-center py-4">
            <div className="font-display text-5xl font-semibold text-primary">26.4</div>
            <div className="mt-1 text-xs text-muted-foreground">days from claim to ship</div>
          </div>
          <div className="mt-3 space-y-2 text-xs">
            <HealthRow label="Down from last month" value="12%" delta="faster" up />
            <HealthRow label="Fastest revival" value="6 days" delta="—" up />
            <HealthRow label="Team avg" value="19 days" delta="+3%" up />
          </div>
        </Card>
      </div>

      {/* 6. Key Takeaways */}
      <Card glow>
        <SectionTitle
          icon={Lightbulb}
          title="Key Takeaways"
          subtitle="What the model surfaced from this quarter's revivals"
        />
        <div className="grid gap-3 md:grid-cols-2">
          <RecCard title="Claim narrow, ship fast" desc="Drafts with a 2-week scope lock revive 2.9× more often than open-ended ones." />
          <RecCard title="Web + AI is the fastest lane" desc="Combined-domain revivals ship 41% faster than single-domain claims." />
          <RecCard title="Momentum beats team size" desc="Solo revivers who post weekly progress outperform silent 3-person teams." />
          <RecCard title="Technical Debt is the sweet spot" desc="72% revival rate — the highest of any stall pattern once claimed." />
        </div>
      </Card>
    </div>
  );
}

function SummaryStat({ value, label, tone }: { value: string; label: string; tone: string }) {
  return (
    <div
      className="rounded-2xl border border-border/60 bg-background/40 p-4"
      style={{ boxShadow: `inset 0 0 0 1px ${tone}22` }}
    >
      <div className="font-display text-2xl font-semibold" style={{ color: tone }}>
        {value}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

/* ================== PREDICTIONS ================== */

function PredictionsTab() {
  const trends = [
    { rank: 1, name: "AI Projects", growth: "High Growth", tone: "text-emerald-500 bg-emerald-500/10" },
    { rank: 2, name: "Cybersecurity", growth: "High Growth", tone: "text-emerald-500 bg-emerald-500/10" },
    { rank: 3, name: "EdTech", growth: "High Growth", tone: "text-emerald-500 bg-emerald-500/10" },
    { rank: 4, name: "Developer Tools", growth: "Medium Growth", tone: "text-amber-500 bg-amber-500/10" },
    { rank: 5, name: "IoT / Hardware", growth: "Medium Growth", tone: "text-amber-500 bg-amber-500/10" },
  ];

  const successFactors = [
    { name: "Active Contributors", value: 86 },
    { name: "Weekly Updates", value: 72 },
    { name: "Clear Documentation", value: 61 },
    { name: "Working Prototype", value: 58 },
    { name: "Using Popular Stack", value: 47 },
  ];

  const forecast = [
    { m: "Aug", ai: 62, tools: 48, mobile: 40 },
    { m: "Sep", ai: 70, tools: 52, mobile: 42 },
    { m: "Oct", ai: 78, tools: 55, mobile: 45 },
    { m: "Nov", ai: 83, tools: 58, mobile: 48 },
    { m: "Dec", ai: 88, tools: 60, mobile: 50 },
    { m: "Jan", ai: 92, tools: 63, mobile: 53 },
  ];

  const gauge = [{ name: "prob", value: 87, fill: ACCENT }];

  return (
    <div className="space-y-6">
      {/* Hero: Prediction Engine */}
      <Card glow className="!p-0">
        <div className="grid gap-6 p-6 md:grid-cols-[minmax(0,1fr)_260px] md:p-8">
          <div>
            <SectionTitle
              icon={Zap}
              title="AI Prediction Engine"
              subtitle="Build what has the highest chance of success next month."
              badge="Live Model"
            />
            <div className="mt-2 rounded-2xl border border-primary/30 bg-primary/5 p-5">
              <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Recommended stack</div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <TechChip>React</TechChip>
                <span className="text-muted-foreground">+</span>
                <TechChip>Node.js</TechChip>
                <span className="text-muted-foreground">+</span>
                <TechChip>AI APIs</TechChip>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Highest predicted revival probability for new projects next month, based on stall data and
                trending domains.
              </p>
            </div>
          </div>
          <div className="grid place-items-center">
            <div className="relative h-52 w-52">
              <ResponsiveContainer>
                <RadialBarChart innerRadius="70%" outerRadius="100%" data={gauge} startAngle={220} endAngle={-40}>
                  <RadialBar background={{ fill: "var(--ins-ring-bg)" }} dataKey="value" cornerRadius={20} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <div className="font-display text-4xl font-semibold text-primary">87%</div>
                  <div className="text-[10px] text-muted-foreground">Predicted revival</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle icon={Flame} title="Emerging Tech Trends" subtitle="Next 3 months" />
          <ul className="space-y-2.5">
            {trends.map((t) => (
              <li
                key={t.name}
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/40 p-3"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/15 font-display text-xs font-semibold text-primary">
                  {t.rank}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{t.name}</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${t.tone}`}>
                  {t.growth}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <SectionTitle icon={Target} title="Success Probability Factors" subtitle="What moves the needle most" />
          <ul className="space-y-3">
            {successFactors.map((s) => (
              <li key={s.name}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium">{s.name}</span>
                  <span className="font-display font-semibold">{s.value}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-fuchsia-500"
                    style={{ width: `${s.value}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Full-width forecast */}
      <Card>
        <SectionTitle icon={TrendingUp} title="Forecast Timeline" subtitle="Predicted revival volume by domain over 6 months" />
        <div className="h-80">
          <ResponsiveContainer>
            <AreaChart data={forecast}>
              <defs>
                <linearGradient id="ai-a" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={ACCENT} stopOpacity={0.55} />
                  <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="tools-a" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={CYAN} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={CYAN} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="mob-a" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={AMBER} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={AMBER} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--ins-grid)" vertical={false} />
              <XAxis dataKey="m" stroke="var(--ins-axis)" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
              <YAxis stroke="var(--ins-axis)" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="ai" name="AI" stroke={ACCENT} strokeWidth={2.5} fill="url(#ai-a)" />
              <Area type="monotone" dataKey="tools" name="Dev Tools" stroke={CYAN} strokeWidth={2.5} fill="url(#tools-a)" />
              <Area type="monotone" dataKey="mobile" name="Mobile" stroke={AMBER} strokeWidth={2.5} fill="url(#mob-a)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Personalized recs */}
      <Card glow>
        <SectionTitle
          icon={Sparkles}
          title="Personalized AI Recommendations"
          subtitle="Tailored to your recent activity on DraftYard"
        />
        <div className="grid gap-3 md:grid-cols-2">
          <RecCard
            title="Focus on Web + AI projects"
            desc="Your revival probability rises 41% when combining these domains."
          />
          <RecCard title="Add at least one collaborator" desc="Solo projects have a 2.4× higher stall risk." />
          <RecCard title="Ship an MVP under 4 weeks" desc="Momentum locks in when you release under 30 days." />
          <RecCard title="Document progress weekly" desc="Weekly updates correlate with 72% higher revival rate." />
        </div>
        <div className="mt-5">
          <Button size="lg" className="rounded-full bg-primary shadow-lg shadow-primary/30 hover:bg-primary/90">
            Get Custom Plan <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

function RecCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 p-4 transition hover:border-primary/40">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="mt-1 text-xs text-muted-foreground">{desc}</div>
        </div>
      </div>
    </div>
  );
}
