import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  TrendingUp,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Star,
  CheckCircle2,
  RefreshCw,
  Layers,
  ChevronRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { TopBar } from "@/components/dashboard/top-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/stack-intelligence")({
  head: () => ({
    meta: [
      { title: "Stack Intelligence · DraftYard" },
      {
        name: "description",
        content:
          "Discover how different technologies perform across the DraftYard ecosystem.",
      },
      { property: "og:title", content: "Stack Intelligence · DraftYard" },
      {
        property: "og:description",
        content: "Compare frameworks, databases, and stacks by completion, revival, and community fit.",
      },
    ],
  }),
  component: StackIntelligencePage,
});

/* ------------------------------ Data ------------------------------ */

type Tech = {
  slug: string;
  name: string;
  icon: string; // emoji / short glyph
  category: string;
  projects: number;
  completion: number;
  revived: number;
  rating: number;
  growth: number; // trending %
  avgRevivalDays: number;
  summary: string;
  bestFor?: string[];
  failureReasons?: string[];
  challenges: string[];
  recommendation: { name: string; slug: string; delta: number; reasons: string[]; domain: string; considerFor?: string[] };
  survival: { stage: string; pct: number }[];
  similar: { name: string; slug: string; survival: number; trend: number[] }[];
  projectsUsing: {
    name: string;
    domain: string;
    stage: "Planning" | "Building" | "Testing" | "Shipped";
    score: number;
    updated: string;
  }[];
};

/** Provide safe defaults so every tech has actionable AI content. */
function withDefaults(t: Partial<Tech> & Pick<Tech, "slug" | "name" | "icon" | "category" | "projects" | "completion" | "revived" | "rating" | "growth" | "avgRevivalDays" | "summary" | "challenges" | "recommendation" | "survival">): Tech {
  return {
    bestFor: ["General-purpose product work", "Small to mid-size teams", "Rapid iteration"],
    failureReasons: ["Weak documentation", "Scope creep", "Poor architecture planning"],
    similar: [],
    projectsUsing: [],
    ...t,
  } as Tech;
}

const SURVIVAL = (a: number, b: number, c: number, d: number) => [
  { stage: "Idea", pct: 100 },
  { stage: "Prototype", pct: a },
  { stage: "Building", pct: b },
  { stage: "Testing", pct: c },
  { stage: "Shipped", pct: d },
];

const trend = (base: number) =>
  Array.from({ length: 10 }, (_, i) => ({ x: i, y: base + Math.sin(i * 0.9) * 3 + (i % 3) - 1 }));

const TECHS: Tech[] = [
  {
    slug: "react",
    name: "React",
    icon: "⚛️",
    category: "Frontend Library",
    projects: 4812,
    completion: 88,
    revived: 22,
    rating: 4.6,
    growth: 12,
    avgRevivalDays: 14,
    summary:
      "React powers the majority of DraftYard's frontend projects. Its component model and ecosystem keep completion rates high even for solo builders.",
    challenges: ["State sprawl in solo projects", "Prop drilling in mid-size apps"],
    recommendation: {
      name: "Next.js",
      slug: "nextjs",
      delta: 6,
      domain: "AI SaaS",
      reasons: ["6% higher completion", "Server components reduce boilerplate", "Faster time to ship", "Great DX for content-heavy apps"],
    },
    survival: SURVIVAL(78, 58, 34, 22),
    similar: [
      { name: "Vue", slug: "vue", survival: 74, trend: [4, 6, 5, 7, 8, 7, 9, 10, 9, 11].map((y, x) => ({ x, y })) as any },
      { name: "Svelte", slug: "svelte", survival: 71, trend: trend(6) as any },
      { name: "Solid", slug: "solid", survival: 68, trend: trend(4) as any },
      { name: "Angular", slug: "angular", survival: 62, trend: trend(3) as any },
    ],
    projectsUsing: [
      { name: "AI LMS Platform", domain: "Education", stage: "Building", score: 82, updated: "2 days ago" },
      { name: "Inventory System", domain: "Business", stage: "Testing", score: 74, updated: "Yesterday" },
      { name: "Clinic Management", domain: "Healthcare", stage: "Building", score: 68, updated: "3 days ago" },
      { name: "CRM Platform", domain: "Business", stage: "Planning", score: 63, updated: "4 days ago" },
      { name: "School ERP", domain: "Education", stage: "Testing", score: 58, updated: "5 days ago" },
    ],
  },
  {
    slug: "django",
    name: "Django",
    icon: "🐍",
    category: "Backend Framework",
    projects: 1284,
    completion: 74,
    revived: 18,
    rating: 4.2,
    growth: 4,
    avgRevivalDays: 21,
    summary:
      "Django is a high-level Python framework known for rapid development and clean design. It performs exceptionally well in enterprise and education projects.",
    challenges: ["Scope creep", "Complex backend logic"],
    recommendation: {
      name: "FastAPI",
      slug: "fastapi",
      delta: 17,
      domain: "AI SaaS",
      reasons: ["17% higher completion rate", "Faster time to ship", "Better performance for ML/AI integrations", "Growing developer community"],
    },
    survival: SURVIVAL(74, 46, 23, 18),
    similar: [
      { name: "FastAPI", slug: "fastapi", survival: 76, trend: trend(7) as any },
      { name: "Flask", slug: "flask", survival: 71, trend: trend(6) as any },
      { name: "Express.js", slug: "express", survival: 69, trend: trend(5) as any },
      { name: "Spring Boot", slug: "spring", survival: 65, trend: trend(4) as any },
    ],
    projectsUsing: [
      { name: "AI LMS Platform", domain: "Education", stage: "Building", score: 82, updated: "2 days ago" },
      { name: "Inventory System", domain: "Business", stage: "Testing", score: 74, updated: "Yesterday" },
      { name: "Clinic Management", domain: "Healthcare", stage: "Building", score: 68, updated: "3 days ago" },
      { name: "CRM Platform", domain: "Business", stage: "Planning", score: 63, updated: "4 days ago" },
      { name: "School ERP", domain: "Education", stage: "Testing", score: 58, updated: "5 days ago" },
    ],
  },
  {
    slug: "nextjs",
    name: "Next.js",
    icon: "▲",
    category: "React Framework",
    projects: 3120,
    completion: 84,
    revived: 20,
    rating: 4.5,
    growth: 15,
    avgRevivalDays: 12,
    summary:
      "Next.js dominates full-stack React work on DraftYard, especially for AI SaaS and content apps. Server components reduce boilerplate and boost ship rate.",
    challenges: ["Caching confusion", "Deploy env drift"],
    recommendation: {
      name: "React",
      slug: "react",
      delta: 4,
      domain: "Consumer apps",
      reasons: ["Simpler surface area", "Less framework churn", "Great for pure client UIs", "Wider hiring pool"],
    },
    survival: SURVIVAL(80, 62, 40, 20),
    similar: [
      { name: "React", slug: "react", survival: 88, trend: trend(8) as any },
      { name: "Remix", slug: "remix", survival: 72, trend: trend(6) as any },
      { name: "Astro", slug: "astro", survival: 70, trend: trend(5) as any },
      { name: "SvelteKit", slug: "sveltekit", survival: 66, trend: trend(4) as any },
    ],
    projectsUsing: [
      { name: "Creator CMS", domain: "Media", stage: "Building", score: 78, updated: "1 day ago" },
      { name: "SaaS Landing", domain: "Business", stage: "Shipped", score: 91, updated: "6 hours ago" },
      { name: "AI Notes", domain: "Productivity", stage: "Testing", score: 72, updated: "3 days ago" },
    ],
  },
  {
    slug: "nodejs",
    name: "Node.js",
    icon: "⬢",
    category: "Runtime",
    projects: 3980,
    completion: 82,
    revived: 21,
    rating: 4.4,
    growth: 6,
    avgRevivalDays: 15,
    summary: "Node.js remains the default runtime for JavaScript backends in the DraftYard ecosystem.",
    challenges: ["Async error handling", "Package sprawl"],
    recommendation: {
      name: "Deno",
      slug: "deno",
      delta: 3,
      domain: "Edge APIs",
      reasons: ["Batteries included", "Secure by default", "Native TypeScript", "Simpler tooling"],
    },
    survival: SURVIVAL(76, 56, 34, 21),
    similar: [
      { name: "Deno", slug: "deno", survival: 70, trend: trend(5) as any },
      { name: "Bun", slug: "bun", survival: 74, trend: trend(7) as any },
    ],
    projectsUsing: [],
  },
  {
    slug: "fastapi",
    name: "FastAPI",
    icon: "🚀",
    category: "Python Framework",
    projects: 1560,
    completion: 79,
    revived: 24,
    rating: 4.6,
    growth: 9,
    avgRevivalDays: 13,
    summary: "FastAPI dominates AI/ML backends with async performance and clean typing.",
    challenges: ["Auth boilerplate", "ORM choice fatigue"],
    recommendation: {
      name: "Django",
      slug: "django",
      delta: 0,
      domain: "Enterprise CRUD",
      reasons: ["Battle-tested admin", "Great for content-heavy apps", "Stable ORM", "Wide plugin ecosystem"],
    },
    survival: SURVIVAL(80, 62, 40, 24),
    similar: [
      { name: "Django", slug: "django", survival: 74, trend: trend(6) as any },
      { name: "Flask", slug: "flask", survival: 71, trend: trend(5) as any },
    ],
    projectsUsing: [],
  },
  {
    slug: "postgres",
    name: "PostgreSQL",
    icon: "🐘",
    category: "Database",
    projects: 4210,
    completion: 81,
    revived: 25,
    rating: 4.7,
    growth: 7,
    avgRevivalDays: 14,
    summary: "The default relational database of DraftYard. Excellent longevity across revived projects.",
    challenges: ["Migration discipline", "Index tuning"],
    recommendation: { name: "Supabase", slug: "supabase", delta: 4, domain: "SaaS", reasons: ["Managed Postgres", "Auth included", "Realtime built-in", "Great DX"] },
    survival: SURVIVAL(80, 60, 38, 25),
    similar: [{ name: "MySQL", slug: "mysql", survival: 74, trend: trend(5) as any }],
    projectsUsing: [],
  },
  { slug: "mongodb", name: "MongoDB", icon: "🍃", category: "Database", projects: 2210, completion: 68, revived: 15, rating: 4.1, growth: 2, avgRevivalDays: 18, summary: "Document store popular for early prototypes.", challenges: ["Schema drift", "Query complexity"], recommendation: { name: "PostgreSQL", slug: "postgres", delta: 13, domain: "SaaS", reasons: ["Higher completion", "Stronger consistency", "SQL familiarity", "Better long-term maintenance"] }, survival: SURVIVAL(70, 48, 26, 15), similar: [], projectsUsing: [] },
  { slug: "express", name: "Express", icon: "🚂", category: "Node Framework", projects: 2870, completion: 75, revived: 19, rating: 4.2, growth: 3, avgRevivalDays: 16, summary: "The minimalist Node.js framework.", challenges: ["Boilerplate", "No opinions"], recommendation: { name: "FastAPI", slug: "fastapi", delta: 4, domain: "APIs", reasons: ["Type-first", "Better docs", "Async by default", "Cleaner validation"] }, survival: SURVIVAL(76, 54, 32, 19), similar: [], projectsUsing: [] },
  { slug: "python", name: "Python", icon: "🐍", category: "Language", projects: 5120, completion: 77, revived: 20, rating: 4.5, growth: 5, avgRevivalDays: 15, summary: "The go-to language for data, ML, and backends.", challenges: ["Env management", "Slow startup"], recommendation: { name: "TypeScript", slug: "typescript", delta: 2, domain: "Web", reasons: ["Unified frontend/backend", "Static typing", "Fast tooling", "Large ecosystem"] }, survival: SURVIVAL(76, 56, 34, 20), similar: [], projectsUsing: [] },
  { slug: "typescript", name: "TypeScript", icon: "🟦", category: "Language", projects: 4650, completion: 86, revived: 23, rating: 4.7, growth: 11, avgRevivalDays: 13, summary: "TypeScript-based projects have the highest revival scores.", challenges: ["Type gymnastics", "Config sprawl"], recommendation: { name: "React", slug: "react", delta: 2, domain: "Web", reasons: ["Best paired with TS", "Great DX", "Wide adoption", "Predictable"] }, survival: SURVIVAL(82, 64, 42, 23), similar: [], projectsUsing: [] },
  { slug: "flutter", name: "Flutter", icon: "🦋", category: "Mobile Framework", projects: 1180, completion: 75, revived: 17, rating: 4.3, growth: 4, avgRevivalDays: 19, summary: "Cross-platform mobile with strong solo-dev output.", challenges: ["Native bridges", "iOS polish"], recommendation: { name: "React Native", slug: "rn", delta: 1, domain: "Mobile", reasons: ["JS ecosystem", "OTA updates", "Wide hiring", "Web reuse"] }, survival: SURVIVAL(74, 52, 30, 17), similar: [], projectsUsing: [] },
  { slug: "java", name: "Java", icon: "☕", category: "Language", projects: 1620, completion: 71, revived: 14, rating: 4.0, growth: 1, avgRevivalDays: 24, summary: "Enterprise backend workhorse.", challenges: ["Verbosity", "Startup time"], recommendation: { name: "Kotlin", slug: "kotlin", delta: 5, domain: "Enterprise", reasons: ["Modern syntax", "Interop with Java", "Coroutines", "Growing ecosystem"] }, survival: SURVIVAL(72, 50, 28, 14), similar: [], projectsUsing: [] },
];

const HIGHEST_COMPLETION = ["react", "nextjs", "typescript", "postgres", "django", "flutter"];
const TRENDING = ["nextjs", "react", "fastapi", "typescript", "postgres", "nodejs"];

/* ------------------------------ Page ------------------------------ */

function StackIntelligencePage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const tech = useMemo(() => TECHS.find((t) => t.slug === selected) ?? null, [selected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TECHS;
    return TECHS.filter(
      (t) => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q),
    );
  }, [query]);

  const openTech = (slug: string) => {
    setSelected(slug);
    setQuery("");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (filtered.length > 0) openTech(filtered[0].slug);
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="stack-page">
        <TopBar showGreeting={false} />
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            {tech ? (
              <motion.div
                key={`detail-${tech.slug}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <TechnologyDetail tech={tech} onBack={() => setSelected(null)} onOpen={openTech} />
              </motion.div>
            ) : (
              <motion.div
                key="explorer"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <TechnologyExplorer
                  query={query}
                  setQuery={setQuery}
                  onSearchSubmit={onSearchSubmit}
                  onOpen={openTech}
                  filtered={filtered}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

/* --------------------------- Level 1 --------------------------- */

function TechnologyExplorer({
  query,
  setQuery,
  onSearchSubmit,
  onOpen,
  filtered,
}: {
  query: string;
  setQuery: (v: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onOpen: (slug: string) => void;
  filtered: Tech[];
}) {
  const popular = ["react", "nextjs", "nodejs", "express", "mongodb", "postgres", "python", "django", "fastapi", "flutter", "java", "typescript"];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Layers className="h-3.5 w-3.5" />
          <span>Stack Intelligence</span>
        </div>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Stack Intelligence
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Discover how different technologies perform across the DraftYard ecosystem.
        </p>
      </div>

      {/* Global search */}
      <form onSubmit={onSearchSubmit} className="stack-search">
        <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search technologies, frameworks, databases..."
          className="h-14 rounded-2xl border border-border/70 bg-card pl-14 pr-28 text-base shadow-sm focus-visible:shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_15%,transparent)]"
        />
        <kbd className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 rounded-md border border-border bg-muted px-2 py-1 text-[11px] text-muted-foreground">
          Enter
        </kbd>
      </form>

      {/* Popular chips */}
      <section>
        <SectionHeader title="Popular Technologies" subtitle="Jump straight into a stack" />
        <div className="mt-4 flex flex-wrap gap-2">
          {popular.map((slug) => {
            const t = TECHS.find((x) => x.slug === slug);
            if (!t) return null;
            return (
              <button
                key={slug}
                onClick={() => onOpen(slug)}
                className="stack-chip group inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
              >
                <span className="text-base">{t.icon}</span>
                {t.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* Trending + Highest completion */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <SectionHeader title="Trending Technologies" subtitle="Momentum over the last 30 days" icon={<TrendingUp className="h-4 w-4 text-emerald-500" />} />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {TRENDING.map((slug) => {
              const t = TECHS.find((x) => x.slug === slug)!;
              return (
                <button
                  key={slug}
                  onClick={() => onOpen(slug)}
                  className="stack-card group flex items-center justify-between rounded-xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-muted text-lg">{t.icon}</span>
                    <div>
                      <div className="font-display text-sm font-semibold">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.category}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="h-3 w-3" /> ↑{t.growth}%
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <SectionHeader title="Highest Completion Rate" subtitle="Where builders actually finish" icon={<CheckCircle2 className="h-4 w-4 text-primary" />} />
          <div className="mt-4 space-y-2">
            {HIGHEST_COMPLETION.map((slug) => {
              const t = TECHS.find((x) => x.slug === slug)!;
              return (
                <button
                  key={slug}
                  onClick={() => onOpen(slug)}
                  className="stack-card group flex w-full items-center gap-4 rounded-xl border border-border bg-card px-4 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-muted text-base">{t.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-sm font-semibold">{t.name}</div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${t.completion}%` }} />
                    </div>
                  </div>
                  <div className="font-display text-sm font-semibold tabular-nums text-foreground">{t.completion}%</div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* AI Recommendation */}
      <section className="stack-ai relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/12 via-primary/5 to-transparent p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <Sparkles className="h-4 w-4" /> AI Recommendation
        </div>
        <h3 className="mt-3 max-w-3xl font-display text-xl font-semibold leading-snug text-foreground">
          Projects using <span className="text-primary">React + Node.js + PostgreSQL</span> show the highest completion rate this month.
        </h3>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          88% of drafts with this stack ship within 6 weeks. Consider it for content-heavy SaaS and dashboards.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {["react", "nodejs", "postgres"].map((slug) => {
            const t = TECHS.find((x) => x.slug === slug)!;
            return (
              <button
                key={slug}
                onClick={() => onOpen(slug)}
                className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card px-3 py-1.5 text-sm font-medium hover:border-primary/60"
              >
                <span>{t.icon}</span>
                {t.name}
                <ArrowRight className="h-3 w-3" />
              </button>
            );
          })}
        </div>
      </section>

      {/* Browse all */}
      <section>
        <SectionHeader title="Browse All Technologies" subtitle={`${filtered.length} technologies`} />
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((t) => (
            <button
              key={t.slug}
              onClick={() => onOpen(t.slug)}
              className="stack-card group relative flex flex-col rounded-2xl border border-border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-muted text-2xl">{t.icon}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <div className="mt-3 font-display text-base font-semibold">{t.name}</div>
              <div className="text-xs text-muted-foreground">{t.category}</div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <div className="font-display text-lg font-semibold tabular-nums">{t.projects.toLocaleString()}</div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Projects</div>
                </div>
                <div className="text-right">
                  <div className="font-display text-lg font-semibold tabular-nums text-primary">{t.completion}%</div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Completion</div>
                </div>
              </div>
            </button>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="mt-6 rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No technologies match "{query}".
          </div>
        )}
      </section>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between">
      <div>
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
          {icon}
          {title}
        </h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

/* --------------------------- Level 2 --------------------------- */

function TechnologyDetail({
  tech,
  onBack,
  onOpen,
}: {
  tech: Tech;
  onBack: () => void;
  onOpen: (slug: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Breadcrumb / back */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Layers className="h-3.5 w-3.5" />
          <button onClick={onBack} className="hover:text-foreground">Stack Intelligence</button>
          <ChevronRight className="h-3 w-3" />
          <button onClick={onBack} className="hover:text-foreground">Technology Explorer</button>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{tech.name}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back to Technology Explorer
        </Button>
      </div>

      {/* Header */}
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-border bg-card text-3xl shadow-sm">
            {tech.icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate font-display text-3xl font-semibold tracking-tight sm:text-4xl">{tech.name}</h1>
              <Star className="h-4 w-4 text-muted-foreground hover:text-amber-400" />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge>{tech.category}</Badge>
              <Badge>{tech.projects.toLocaleString()} Projects</Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Stats row + AI summary */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total Projects" value={tech.projects.toLocaleString()} accent="violet" icon="📁" />
          <StatCard label="Completed" value={`${tech.completion}%`} accent="emerald" icon="✓" />
          <StatCard label="Revived" value={`${tech.revived}%`} accent="amber" icon="↻" />
          <StatCard label="Community Rating" value={`${tech.rating}`} suffix=" / 5" accent="blue" icon="★" />
        </div>

        <div className="stack-card rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" /> AI Summary
          </div>
          <p className="mt-2 text-sm leading-relaxed text-foreground/90">{tech.summary}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border/70 bg-muted/40 p-3">
              <div className="text-xs font-semibold text-primary">Common challenges</div>
              <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                {tech.challenges.map((c) => (
                  <li key={c} className="flex gap-1.5"><span className="text-primary">•</span> {c}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/40 p-3">
              <div className="text-xs font-semibold text-primary">Average revival time</div>
              <div className="mt-1.5 font-display text-lg font-semibold text-emerald-500">{tech.avgRevivalDays} days</div>
            </div>
          </div>
        </div>
      </div>

      {/* Survival + Projects using */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="stack-card rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-semibold">Stack Survival</h3>
              <p className="text-xs text-muted-foreground">% of projects that reach each stage</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[1fr_180px]">
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={tech.survival} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid stroke="var(--stack-grid)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="stage" stroke="var(--stack-axis)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--stack-axis)" fontSize={11} tickLine={false} axisLine={false} unit="%" />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey="pct" stroke="#7c5cff" strokeWidth={2.5} dot={{ r: 4, fill: "#7c5cff" }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col justify-center gap-2 text-sm">
              {tech.survival.slice(1).map((s, i) => {
                const colors = ["text-emerald-500", "text-primary", "text-amber-500", "text-rose-500"];
                return (
                  <div key={s.stage} className="flex items-baseline gap-2">
                    <span className={`font-display text-lg font-semibold tabular-nums ${colors[i]}`}>{s.pct}%</span>
                    <span className="text-xs text-muted-foreground">Reach {s.stage}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="stack-card rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold">Projects Using {tech.name}</h3>
            <button className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              View all projects <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-[1fr_auto_auto_auto] gap-x-3 text-[11px] uppercase tracking-wider text-muted-foreground">
            <span>Project</span><span>Stage</span><span>Score</span><span>Updated</span>
          </div>
          <div className="mt-2 divide-y divide-border/60">
            {(tech.projectsUsing.length ? tech.projectsUsing : PLACEHOLDER_PROJECTS).map((p) => (
              <div key={p.name} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-3 py-3 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium text-foreground">{p.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{p.domain}</div>
                </div>
                <StagePill stage={p.stage} />
                <ScoreRing value={p.score} />
                <div className="text-xs text-muted-foreground whitespace-nowrap">{p.updated}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Similar tech + AI recommendation */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="stack-card rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold">Similar Technologies</h3>
            <button className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              View comparison <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {(tech.similar.length ? tech.similar : []).map((s) => (
              <button
                key={s.slug}
                onClick={() => onOpen(s.slug)}
                className="rounded-xl border border-border bg-muted/30 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card hover:shadow-md"
              >
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-md bg-card text-sm">{TECHS.find((t) => t.slug === s.slug)?.icon ?? "•"}</span>
                  <div className="font-display text-sm font-semibold">{s.name}</div>
                </div>
                <div className="mt-2 font-display text-xl font-semibold tabular-nums">{s.survival}%</div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Survival Rate</div>
                <div className="mt-2 h-10">
                  <ResponsiveContainer>
                    <AreaChart data={s.trend as any}>
                      <defs>
                        <linearGradient id={`sp-${s.slug}`} x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#22c39a" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#22c39a" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="y" stroke="#22c39a" strokeWidth={1.5} fill={`url(#sp-${s.slug})`} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="stack-card relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/25 blur-3xl" />
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-4 w-4" /> AI Recommendation
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Based on your project domain</p>
          <div className="mt-1 inline-flex items-center rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary">
            {tech.recommendation.domain}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Instead of {tech.name}, we recommend</p>
          <div className="mt-1 flex items-center justify-between gap-4">
            <button
              onClick={() => onOpen(tech.recommendation.slug)}
              className="font-display text-3xl font-semibold text-primary hover:underline"
            >
              {tech.recommendation.name}
            </button>
            <ScoreRing value={70 + tech.recommendation.delta} size={64} label={`+${tech.recommendation.delta}%`} />
          </div>
          <div className="mt-4 text-xs font-semibold text-foreground">Why {tech.recommendation.name}?</div>
          <ul className="mt-2 space-y-1.5 text-sm">
            {tech.recommendation.reasons.map((r) => (
              <li key={r} className="flex items-start gap-2 text-foreground/85">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {r}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

const PLACEHOLDER_PROJECTS: Tech["projectsUsing"] = [
  { name: "AI LMS Platform", domain: "Education", stage: "Building", score: 82, updated: "2 days ago" },
  { name: "Inventory System", domain: "Business", stage: "Testing", score: 74, updated: "Yesterday" },
  { name: "Clinic Management", domain: "Healthcare", stage: "Building", score: 68, updated: "3 days ago" },
  { name: "CRM Platform", domain: "Business", stage: "Planning", score: 63, updated: "4 days ago" },
];

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground">
      {children}
    </span>
  );
}

function StatCard({
  label,
  value,
  suffix,
  accent,
  icon,
}: {
  label: string;
  value: string;
  suffix?: string;
  accent: "violet" | "emerald" | "amber" | "blue";
  icon: string;
}) {
  const accentMap: Record<string, string> = {
    violet: "text-primary bg-primary/10",
    emerald: "text-emerald-500 bg-emerald-500/10",
    amber: "text-amber-500 bg-amber-500/10",
    blue: "text-blue-500 bg-blue-500/10",
  };
  return (
    <div className="stack-card flex flex-col justify-between rounded-2xl border border-border bg-card p-4">
      <div className={`grid h-9 w-9 place-items-center rounded-xl ${accentMap[accent]}`}>
        <span className="text-base">{icon}</span>
      </div>
      <div className="mt-3">
        <div className="font-display text-2xl font-semibold tabular-nums text-foreground">
          {value}
          {suffix && <span className="text-sm font-medium text-muted-foreground">{suffix}</span>}
        </div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

function StagePill({ stage }: { stage: Tech["projectsUsing"][number]["stage"] }) {
  const map: Record<string, string> = {
    Planning: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    Building: "bg-primary/15 text-primary",
    Testing: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    Shipped: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${map[stage]}`}>{stage}</span>
  );
}

function ScoreRing({ value, size = 40, label }: { value: number; size?: number; label?: string }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const dash = (value / 100) * c;
  const stroke = value >= 80 ? "#22c39a" : value >= 60 ? "#7c5cff" : "#f59e0b";
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--stack-ring-bg)" strokeWidth={3} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={stroke} strokeWidth={3} fill="none" strokeLinecap="round" strokeDasharray={`${dash} ${c}`} />
      </svg>
      <div className="absolute grid place-items-center text-center">
        <div className="font-display text-[11px] font-semibold tabular-nums leading-none" style={{ color: stroke }}>{label ?? value}</div>
      </div>
    </div>
  );
}
