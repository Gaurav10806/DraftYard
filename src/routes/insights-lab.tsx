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
      {/* Hero AI Insight */}
      <Card glow className="!p-0">
        <div className="relative flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-fuchsia-500 text-white shadow-lg shadow-primary/40">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-primary">
                AI Insight of the Week
              </div>
              <h2 className="mt-1 font-display text-xl font-semibold leading-tight md:text-2xl">
                Projects with 3+ contributors are{" "}
                <span className="text-primary">2.4× more likely</span> to be revived than solo projects.
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Based on 12,840 projects analyzed across the last 90 days. Collaboration boosts
                completion, but only when documentation is present in the first two weeks.
              </p>
            </div>
          </div>
          <Button className="shrink-0 rounded-full bg-primary hover:bg-primary/90">
            See analysis <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </Card>

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
          <SectionTitle icon={Database} title="Database Usage" subtitle="Distribution across all projects" />
          <div className="flex items-center gap-6">
            <div className="h-56 w-56 shrink-0">
              <ResponsiveContainer>
                <PieChart>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v}%`} />
                  <Pie data={databases} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {databases.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="transparent" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex-1 space-y-2 text-xs">
              {databases.map((d, i) => (
                <li key={d.name} className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
                    <span className="text-foreground">{d.name}</span>
                  </span>
                  <span className="font-display font-semibold">{d.value}%</span>
                </li>
              ))}
            </ul>
          </div>
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

function StallDNATab() {
  const patterns = [
    { name: "Scope Creep", pct: 34, color: ACCENT },
    { name: "Solo Burnout", pct: 28, color: PINK },
    { name: "Waiting on Data", pct: 12, color: CYAN },
    { name: "Lack of Motivation", pct: 9, color: AMBER },
    { name: "Technical Roadblocks", pct: 8, color: BLUE },
    { name: "No Market Fit", pct: 6, color: EMERALD },
  ];

  const dangerZone = [
    { stage: "Idea", risk: 8 },
    { stage: "Prototype", risk: 34 },
    { stage: "Building", risk: 41 },
    { stage: "Testing", risk: 13 },
    { stage: "Shipped", risk: 4 },
  ];

  const fixes = [
    "Break features into smaller milestones",
    "Add collaborators early — solo burnout drops 62%",
    "Build a working prototype in 2 weeks",
    "Validate the idea with 5 real users before coding",
    "Ship an MVP under 4 weeks to lock momentum",
  ];

  return (
    <div className="space-y-6">
      {/* Galaxy hero */}
      <Card glow className="!p-0">
        <div className="border-b border-border/60 p-5">
          <SectionTitle
            icon={Sparkles}
            title="Stall DNA Galaxy"
            subtitle="AI discovers hidden patterns behind project abandonment. Larger = more common."
            badge="Interactive"
          />
        </div>
        <div className="relative h-[440px] overflow-hidden">
          {/* Galaxy backdrop */}
          <div className="absolute inset-0 dna-galaxy-bg" aria-hidden />
          {/* Central node */}
          <StallOrb
            pattern={patterns[0]}
            size={180}
            style={{ left: "50%", top: "50%", transform: "translate(-50%,-50%)" }}
            main
          />
          {/* Orbit patterns */}
          <StallOrb pattern={patterns[1]} size={130} style={{ left: "20%", top: "26%" }} />
          <StallOrb pattern={patterns[2]} size={100} style={{ left: "16%", top: "62%" }} />
          <StallOrb pattern={patterns[3]} size={92} style={{ left: "78%", top: "22%" }} />
          <StallOrb pattern={patterns[4]} size={100} style={{ left: "80%", top: "60%" }} />
          <StallOrb pattern={patterns[5]} size={82} style={{ left: "48%", top: "82%" }} />
        </div>
      </Card>

      {/* Top patterns + Danger zone */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle icon={Flame} title="Top Stall Patterns" subtitle="Ranked by frequency" />
          <ul className="space-y-3">
            {patterns.map((p) => (
              <li key={p.name}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium">{p.name}</span>
                  <span className="font-display font-semibold" style={{ color: p.color }}>
                    {p.pct}%
                  </span>
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
            ))}
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
          <SectionTitle icon={Lightbulb} title="AI Fix Suggestions" subtitle="Proven interventions" />
          <ul className="space-y-2.5">
            {fixes.map((f, i) => (
              <li
                key={f}
                className="flex items-start gap-3 rounded-xl border border-border/50 bg-background/40 p-3"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-500">
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
          <SectionTitle icon={Target} title="Pattern Breakdown" subtitle="Avg revival rate by pattern" />
          <ul className="space-y-2.5">
            {patterns.slice(0, 4).map((p) => (
              <li
                key={p.name}
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/40 p-3"
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
                    Avg revival: {Math.max(20, 60 - p.pct)}% · Fix time ~{2 + Math.round(p.pct / 20)} wks
                  </div>
                </div>
              </li>
            ))}
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

function StallOrb({
  pattern,
  size,
  style,
  main,
}: {
  pattern: { name: string; pct: number; color: string };
  size: number;
  style: React.CSSProperties;
  main?: boolean;
}) {
  return (
    <motion.div
      className="dna-orb absolute grid place-items-center rounded-full text-center"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 30% 30%, ${pattern.color}55, ${pattern.color}12 60%, transparent 75%)`,
        border: `1px solid ${pattern.color}55`,
        boxShadow: `0 0 40px -8px ${pattern.color}66`,
        ...style,
      }}
      animate={{ y: [0, main ? -6 : -4, 0] }}
      transition={{ duration: main ? 5 : 4 + Math.random(), repeat: Infinity, ease: "easeInOut" }}
      whileHover={{ scale: 1.06 }}
    >
      <div>
        <div
          className="font-display font-semibold"
          style={{ color: pattern.color, fontSize: main ? 28 : 18 }}
        >
          {pattern.pct}%
        </div>
        <div className="mt-0.5 px-3 text-[11px] font-medium leading-tight text-foreground">{pattern.name}</div>
      </div>
    </motion.div>
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
      <Card glow>
        <SectionTitle
          icon={TrendingUp}
          title="Revival Probability Trend"
          subtitle="Some stall patterns are much easier to revive than others."
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

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle icon={Activity} title="Projects Revived Over Time" subtitle="Cumulative revivals" />
          <div className="h-64">
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle icon={Layers} title="Most Revived Domains" subtitle="By share of revivals" />
          <ul className="mt-2 space-y-3">
            {domains.map((d, i) => (
              <li key={d.name}>
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
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <SectionTitle icon={Users} title="Contributor Growth" subtitle="Net new contributors" />
          <div className="grid place-items-center py-2">
            <div className="font-display text-5xl font-semibold text-emerald-500">+31%</div>
            <div className="mt-1 text-xs text-muted-foreground">contributors joining revived projects</div>
          </div>
          <div className="mt-4 h-32">
            <ResponsiveContainer>
              <LineChart data={overTime}>
                <Line type="monotone" dataKey="v" stroke={EMERALD} strokeWidth={2.5} dot={false} />
                <XAxis dataKey="m" hide />
                <YAxis hide />
                <Tooltip contentStyle={tooltipStyle} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle icon={Trophy} title="Revival Success Summary" subtitle="This quarter's headline numbers" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <SummaryStat value="1,412" label="Total revived" tone={ACCENT} />
          <SummaryStat value="78%" label="Avg revival score" tone={EMERALD} />
          <SummaryStat value="26.4d" label="Avg time to ship" tone={CYAN} />
          <SummaryStat value="+31%" label="Contributor growth" tone={AMBER} />
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
