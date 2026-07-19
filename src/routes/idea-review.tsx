import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  History as HistoryIcon,
  Plus,
  Sparkles,
  X,
  Search,
  MoreHorizontal,
  Inbox,
  Users,
  Lightbulb,
  Rocket,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  Copy,
  Pencil,
  Star,
  TrendingUp,
  Wrench,
  Scale,
  ShieldCheck,
  Layers3,
  Radar,
  Clock,
  FileText,
} from "lucide-react";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { TopBar } from "@/components/dashboard/top-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/idea-review")({
  head: () => ({
    meta: [
      { title: "Idea Review · DraftYard" },
      {
        name: "description",
        content:
          "Validate your software idea using AI and real-world DraftYard project insights before you build.",
      },
      { property: "og:title", content: "Idea Review · DraftYard" },
      {
        property: "og:description",
        content:
          "Community + AI intelligence to help you decide what's worth building.",
      },
    ],
  }),
  component: IdeaReviewPage,
});

// ---------------- Types ----------------

type Verdict = "Worth Building" | "Needs Refinement" | "Reconsider";
type Level = "High" | "Medium" | "Low";

type CommunityInsights = {
  similarCount: number;
  outcomes: { completed: number; active: number; abandoned: number };
  stoppingPoints: { label: string; pct: number }[];
  avgCompletion: number;
  topStack: { name: string; pct: number }[];
  successPatterns: string[];
  failurePatterns: string[];
};

type Report = {
  id: string;
  name: string;
  pitch: string;
  createdAt: number;
  score: number;
  verdict: Verdict;
  summary: string;
  community: CommunityInsights | null;
  metrics: {
    feasibility: { label: Level; note: string };
    competition: { label: Level; note: string };
    complexity: { label: Level; note: string };
    scalability: { label: Level; note: string };
    market: { headline: string; note: string };
  };
  recommendations: string[];
  stack: { frontend: string; backend: string; database: string; ai: string; hosting: string };
  roadmap: { week: string; label: string }[];
  finalNote: string;
};

type FormState = {
  name: string;
  pitch: string;
  problem: string;
  audience: string;
  features: string[];
  stack: string;
  notes: string;
};

const emptyForm: FormState = {
  name: "",
  pitch: "",
  problem: "",
  audience: "",
  features: [],
  stack: "",
  notes: "",
};

const STORAGE_KEY = "draftyard.idea-reviews.v2";

function loadReports(): Report[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Report[]) : [];
  } catch {
    return [];
  }
}

function saveReports(list: Report[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* noop */
  }
}

function generateReport(form: FormState): Report {
  const seed =
    (form.name + form.pitch + form.problem).split("").reduce((a, c) => a + c.charCodeAt(0), 0) || 42;
  const score = 68 + (seed % 27);
  const verdict: Verdict =
    score >= 80 ? "Worth Building" : score >= 70 ? "Needs Refinement" : "Reconsider";

  // Simulate DB match: hide community if seed is very small (rare)
  const hasCommunity = seed % 7 !== 0;

  const community: CommunityInsights | null = hasCommunity
    ? {
        similarCount: 14,
        outcomes: { completed: 5, active: 3, abandoned: 6 },
        stoppingPoints: [
          { label: "Authentication", pct: 29 },
          { label: "AI Cost / Limits", pct: 21 },
          { label: "User Retention", pct: 21 },
          { label: "Payment Integration", pct: 14 },
          { label: "Deployment", pct: 14 },
        ],
        avgCompletion: 62,
        topStack: [
          { name: "React", pct: 86 },
          { name: "Node.js", pct: 71 },
          { name: "MongoDB", pct: 64 },
          { name: "Firebase", pct: 29 },
          { name: "Supabase", pct: 21 },
        ],
        successPatterns: [
          "Started with a core planner only",
          "Focused on a single student segment",
          "Introduced AI recommendations early",
          "Kept UI simple for higher retention",
        ],
        failurePatterns: [
          "Too many features shipped at once",
          "Skipped early user validation",
          "Complex auth and payments upfront",
          "High AI usage without cost limits",
        ],
      }
    : null;

  return {
    id: crypto.randomUUID?.() ?? String(Date.now()),
    name: form.name || "Untitled Idea",
    pitch: form.pitch || "—",
    createdAt: Date.now(),
    score,
    verdict,
    summary:
      hasCommunity
        ? "Strong potential based on community data and AI analysis. Focus on a lean MVP first."
        : "No similar DraftYard projects were found. This analysis is based on market research and AI reasoning.",
    community,
    metrics: {
      feasibility: {
        label: score >= 78 ? "High" : "Medium",
        note: "Can be built in 2–3 months with the right stack.",
      },
      competition: {
        label: score % 2 === 0 ? "Medium" : "High",
        note: "Some competitors exist, but room for personalization.",
      },
      complexity: {
        label: score >= 82 ? "Medium" : "High",
        note: "AI integration and user retention are key challenges.",
      },
      scalability: {
        label: "High",
        note: "Strong scalability with cloud and modular architecture.",
      },
      market: {
        headline: "$25.7B by 2030",
        note: "The global AI in education market is projected to grow at 45% CAGR.",
      },
    },
    recommendations: [
      "Start with a lean MVP: AI planner + progress tracking",
      "Focus on student retention with daily value delivery",
      "Limit AI usage and optimize for low cost",
      "Validate with 20–30 users before expanding features",
    ],
    stack: {
      frontend: "React",
      backend: "Node.js",
      database: "MongoDB",
      ai: "OpenAI API",
      hosting: "Vercel",
    },
    roadmap: [
      { week: "Week 1", label: "Research" },
      { week: "Week 2", label: "UI/UX Design" },
      { week: "Week 3–4", label: "Backend Setup" },
      { week: "Week 5–6", label: "AI Integration" },
      { week: "Week 7", label: "Testing" },
      { week: "Week 8", label: "Launch MVP" },
    ],
    finalNote:
      hasCommunity
        ? "This idea has strong potential based on real-world data and AI insights."
        : "This idea shows promise based on AI market analysis. Validate with real users early.",
  };
}

// ---------------- Page ----------------

function IdeaReviewPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <SidebarInset>
          <TopBar showGreeting={false} />
          <IdeaReviewShell />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function IdeaReviewShell() {
  const [reports, setReports] = useState<Report[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [emptyHistoryOpen, setEmptyHistoryOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    setReports(loadReports());
  }, []);

  const active = useMemo(
    () => reports.find((r) => r.id === activeId) ?? null,
    [reports, activeId],
  );

  function persist(next: Report[]) {
    setReports(next);
    saveReports(next);
  }

  async function handleAnalyze() {
    if (!form.name.trim() || !form.pitch.trim() || !form.problem.trim()) return;
    setAnalyzing(true);
    await new Promise((r) => setTimeout(r, 1600));
    const report = generateReport(form);
    const next = [report, ...reports];
    persist(next);
    setActiveId(report.id);
    setAnalyzing(false);
  }

  function handleNewReview() {
    setActiveId(null);
    setForm(emptyForm);
  }

  function openHistory() {
    if (reports.length === 0) setEmptyHistoryOpen(true);
    else setHistoryOpen(true);
  }

  function handleDelete(id: string) {
    const next = reports.filter((r) => r.id !== id);
    persist(next);
    if (activeId === id) setActiveId(null);
  }
  function handleDuplicate(id: string) {
    const src = reports.find((r) => r.id === id);
    if (!src) return;
    const copy: Report = {
      ...src,
      id: crypto.randomUUID?.() ?? String(Date.now()),
      createdAt: Date.now(),
      name: src.name + " (copy)",
    };
    persist([copy, ...reports]);
  }
  function handleRename(id: string, name: string) {
    persist(reports.map((r) => (r.id === id ? { ...r, name } : r)));
  }

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="flex flex-col gap-4 pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-[28px] font-semibold tracking-tight text-foreground">
              Idea Review
            </h1>
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {active
              ? "AI + Community insights to help you build what works."
              : "Validate your software idea using AI and real-world developer insights."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={openHistory}
            className="h-9 gap-2 rounded-lg border-border/70 bg-card"
          >
            <HistoryIcon className="h-3.5 w-3.5" />
            History{reports.length > 0 ? ` (${reports.length})` : ""}
          </Button>
          {active && (
            <Button size="sm" onClick={handleNewReview} className="h-9 gap-2 rounded-lg">
              <Plus className="h-3.5 w-3.5" /> New Review
            </Button>
          )}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {active ? (
          <motion.div
            key="report"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <ReportView report={active} />
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <IdeaForm form={form} setForm={setForm} onSubmit={handleAnalyze} analyzing={analyzing} />
          </motion.div>
        )}
      </AnimatePresence>

      <HistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        reports={reports}
        onSelect={(id) => {
          setActiveId(id);
          setHistoryOpen(false);
        }}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onRename={handleRename}
      />

      <Dialog open={emptyHistoryOpen} onOpenChange={(v) => (v ? null : setEmptyHistoryOpen(false))}>
        <DialogContent className="max-w-sm rounded-2xl border border-border/70 bg-card p-6 text-center shadow-2xl">
          <DialogHeader>
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-muted/60 text-muted-foreground">
              <Inbox className="h-5 w-5" />
            </div>
            <DialogTitle className="mt-3 text-base font-semibold">No Reviews Yet</DialogTitle>
            <DialogDescription>
              Analyze your first idea to start building your review history.
            </DialogDescription>
          </DialogHeader>
          <Button className="mt-4 w-full rounded-lg" onClick={() => setEmptyHistoryOpen(false)}>
            Got it
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------- Form ----------------

function IdeaForm({
  form,
  setForm,
  onSubmit,
  analyzing,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  onSubmit: () => void;
  analyzing: boolean;
}) {
  const [featureDraft, setFeatureDraft] = useState("");

  function addFeature() {
    const v = featureDraft.trim();
    if (!v || form.features.includes(v)) return;
    setForm({ ...form, features: [...form.features, v] });
    setFeatureDraft("");
  }

  const canSubmit =
    form.name.trim().length > 0 && form.pitch.trim().length > 0 && form.problem.trim().length > 0;

  return (
    <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
      <div className="mb-6">
        <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
          Tell us about your idea
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We combine DraftYard's community data with AI reasoning to help you validate before you build.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Field label="Project Name" required>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. AI Study Planner"
            className="h-10 rounded-lg"
          />
        </Field>

        <Field label="Key Features" hint="Press Enter to add">
          <div className="rounded-lg border border-border bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-primary/30">
            <div className="flex flex-wrap items-center gap-1.5">
              {form.features.map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                >
                  {f}
                  <button
                    type="button"
                    aria-label={`Remove ${f}`}
                    onClick={() =>
                      setForm({ ...form, features: form.features.filter((x) => x !== f) })
                    }
                    className="opacity-70 transition hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                value={featureDraft}
                onChange={(e) => setFeatureDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addFeature();
                  } else if (e.key === "Backspace" && !featureDraft && form.features.length) {
                    setForm({ ...form, features: form.features.slice(0, -1) });
                  }
                }}
                placeholder={form.features.length ? "" : "e.g. AI schedule, progress tracking"}
                className="min-w-[8rem] flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </Field>

        <Field label="One-line Pitch" required>
          <Input
            value={form.pitch}
            onChange={(e) => setForm({ ...form, pitch: e.target.value })}
            placeholder="e.g. An AI that creates adaptive study plans"
            className="h-10 rounded-lg"
          />
        </Field>

        <Field label="Preferred Tech Stack" hint="Optional">
          <Input
            value={form.stack}
            onChange={(e) => setForm({ ...form, stack: e.target.value })}
            placeholder="e.g. React, Node.js, MongoDB, OpenAI"
            className="h-10 rounded-lg"
          />
        </Field>

        <Field label="Problem Statement" required>
          <Input
            value={form.problem}
            onChange={(e) => setForm({ ...form, problem: e.target.value })}
            placeholder="e.g. Students don't know what to study daily"
            className="h-10 rounded-lg"
          />
        </Field>

        <Field label="Target Audience">
          <Input
            value={form.audience}
            onChange={(e) => setForm({ ...form, audience: e.target.value })}
            placeholder="e.g. College students, JEE aspirants"
            className="h-10 rounded-lg"
          />
        </Field>

        <Field label="Additional Context" hint="Optional">
          <Textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Any specific constraints, goals, or context?"
            rows={2}
            className="resize-none rounded-lg"
          />
        </Field>
      </div>

      <div className="mt-10 flex flex-col items-center gap-2">
        <Button
          size="lg"
          onClick={onSubmit}
          disabled={!canSubmit || analyzing}
          className="h-12 min-w-[280px] gap-2 rounded-xl px-8 text-sm font-semibold"
        >
          {analyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing your idea…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Analyze Idea
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground">Analysis usually takes 30–60 seconds.</p>
      </div>
    </section>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="flex items-center justify-between">
        <span className="font-medium text-foreground">
          {label}
          {required && <span className="ml-0.5 text-primary">*</span>}
        </span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

// ---------------- Report ----------------

function ReportView({ report }: { report: Report }) {
  const verdictTone =
    report.verdict === "Worth Building"
      ? "text-emerald-500"
      : report.verdict === "Needs Refinement"
      ? "text-amber-500"
      : "text-rose-500";

  return (
    <div className="space-y-10">
      {/* Summary card */}
      <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm sm:p-7">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,1fr)] lg:items-center">
          <div className="flex items-center gap-5">
            <ScoreDial score={report.score} />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Overall Verdict
              </p>
              <h3 className={`font-display text-2xl font-semibold ${verdictTone}`}>
                {report.verdict}
              </h3>
              <div className="mt-1 flex items-center gap-0.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${
                      i < Math.round(report.score / 20) ? "fill-current" : "opacity-30"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                {report.summary}
              </p>
            </div>
          </div>

          <ul className="space-y-3 border-y border-border/60 py-4 lg:border-y-0 lg:border-x lg:px-6 lg:py-0">
            <MetaRow
              icon={<Radar className="h-4 w-4" />}
              label="Analysis Type"
              value={report.community ? "AI + Community" : "AI only"}
            />
            <MetaRow
              icon={<Layers3 className="h-4 w-4" />}
              label="Similar Projects Found"
              value={report.community ? String(report.community.similarCount) : "0"}
            />
            <MetaRow
              icon={<Clock className="h-4 w-4" />}
              label="Analysis Completed"
              value={relTime(report.createdAt)}
            />
          </ul>

          <div className="rounded-xl border border-border/60 bg-background/40 p-4">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <FileText className="h-3.5 w-3.5 text-primary" />
              Your Idea
            </div>
            <p className="mt-1.5 font-display text-lg font-semibold leading-tight text-foreground">
              {report.name}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">
              {report.pitch}
            </p>
          </div>
        </div>
      </section>

      {/* Community Insights */}
      {report.community ? (
        <CommunitySection c={report.community} />
      ) : (
        <NoCommunityBanner />
      )}

      {/* AI Analysis */}
      <section>
        <SectionTitle number={2} title="AI Analysis" subtitle={report.community ? "Enhanced by DraftYard project data." : "Based on market research and AI reasoning."} />
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          <MetricCard
            title="Feasibility"
            status={report.metrics.feasibility.label}
            note={report.metrics.feasibility.note}
            tone="emerald"
            icon={<ShieldCheck className="h-4 w-4" />}
          />
          <MetricCard
            title="Competition"
            status={report.metrics.competition.label}
            note={report.metrics.competition.note}
            tone="amber"
            icon={<Users className="h-4 w-4" />}
          />
          <MetricCard
            title="Complexity"
            status={report.metrics.complexity.label}
            note={report.metrics.complexity.note}
            tone="violet"
            icon={<Wrench className="h-4 w-4" />}
          />
          <MetricCard
            title="Scalability"
            status={report.metrics.scalability.label}
            note={report.metrics.scalability.note}
            tone="sky"
            icon={<Scale className="h-4 w-4" />}
          />
          <div className="rounded-xl border border-border/70 bg-card px-3.5 py-3 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-emerald-500/10 text-emerald-500">
                <TrendingUp className="h-4 w-4" />
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">Market Opportunity</span>
              <span className="ml-auto text-[11px] font-semibold text-primary truncate max-w-[55%]">
                {report.metrics.market.headline}
              </span>
            </div>
            <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground line-clamp-2">
              {report.metrics.market.note}
            </p>
          </div>
        </div>
      </section>

      {/* Recommendations + Stack + Roadmap */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1.2fr)]">
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <SectionHeading number={3} icon={<Lightbulb className="h-4 w-4" />} title="AI Recommendations" />
          <ul className="mt-4 space-y-2.5 text-sm">
            {report.recommendations.map((r) => (
              <li key={r} className="flex items-start gap-2 text-foreground/85">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <h4 className="text-sm font-semibold text-foreground">Recommended Tech Stack</h4>
          <div className="mt-4 grid grid-cols-5 gap-2 text-center">
            {(
              [
                ["React", "Frontend"],
                ["Node.js", "Backend"],
                ["MongoDB", "Database"],
                ["OpenAI API", "AI"],
                ["Vercel", "Hosting"],
              ] as const
            ).map(([name, role]) => (
              <div key={name} className="rounded-lg border border-border/60 bg-background/40 p-2">
                <div className="mx-auto grid h-8 w-8 place-items-center rounded-md bg-primary/10 text-primary text-[10px] font-bold">
                  {name.slice(0, 2)}
                </div>
                <p className="mt-1.5 text-[11px] font-semibold text-foreground">{name}</p>
                <p className="text-[10px] text-muted-foreground">{role}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
          <h4 className="text-sm font-semibold text-foreground">Development Roadmap</h4>
          <p className="mt-0.5 text-xs text-muted-foreground">Suggested milestones from week zero to launch.</p>
          <div className="relative mt-7 pb-1">
            <div className="absolute left-5 right-5 top-5 h-0.5 rounded-full bg-gradient-to-r from-primary/40 via-primary/25 to-primary/10" aria-hidden />
            <ol className="relative flex justify-between gap-3">
              {report.roadmap.map((r, i) => (
                <li key={r.week} className="flex min-w-0 flex-1 flex-col items-center gap-2.5 text-center">
                  <span className="relative z-10 grid h-10 w-10 place-items-center rounded-full border border-primary/30 bg-card text-sm font-semibold text-primary shadow-[0_2px_10px_-4px_rgba(124,92,255,0.5)]">
                    {i + 1}
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-primary/90">
                    {r.week}
                  </span>
                  <span className="text-xs font-medium leading-snug text-foreground">
                    {r.label}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Final Recommendation */}
      <div className="sticky bottom-4 z-10 flex flex-col items-start justify-between gap-4 rounded-2xl border border-border/70 bg-card/95 p-5 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:p-6">
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Rocket className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-base font-semibold text-foreground">
              Final Recommendation
            </p>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Based on historical DraftYard projects and AI analysis, this idea has strong potential.
              Start with an MVP focused on solving one problem well.
            </p>
          </div>
        </div>
        <Button asChild size="lg" className="h-11 shrink-0 gap-2 rounded-xl px-6">
          <Link to="/workspace">
            Create Draft Project <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

// ---------------- Community section ----------------

function CommunitySection({ c }: { c: CommunityInsights }) {
  const mvpPct = Math.round(((c.outcomes.completed + c.outcomes.active) / c.similarCount) * 100);
  const topStackCount = Math.round((c.topStack[0]?.pct ?? 0) / 100 * c.similarCount);
  return (
    <section>
      <SectionTitle
        number={1}
        title="DraftYard Insights"
        subtitle="Real-world insights from similar DraftYard projects."
      />

      {/* Row 1 — Outcomes + Stopping Points */}
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <CommunityCard title="Project Outcomes">
          <div className="mt-1 flex items-center gap-5">
            <OutcomeDonut
              completed={c.outcomes.completed}
              active={c.outcomes.active}
              abandoned={c.outcomes.abandoned}
            />
            <ul className="space-y-2 text-xs">
              <LegendDot color="#22C55E" label="Completed" value={c.outcomes.completed} total={c.similarCount} />
              <LegendDot color="#7C5CFF" label="Active" value={c.outcomes.active} total={c.similarCount} />
              <LegendDot color="#EF4444" label="Abandoned" value={c.outcomes.abandoned} total={c.similarCount} />
            </ul>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-border/70 bg-muted/40 px-3 py-2">
            <span className="font-display text-lg font-semibold text-primary">{mvpPct}%</span>
            <span className="text-[11px] text-muted-foreground">reached at least MVP</span>
          </div>
        </CommunityCard>

        <CommunityCard title="Common Stopping Points">
          <ul className="mt-1 space-y-3">
            {c.stoppingPoints.map((s) => (
              <li key={s.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-foreground/80">{s.label}</span>
                  <span className="font-medium text-muted-foreground">{s.pct}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary/80"
                    style={{ width: `${Math.min(100, s.pct * 3)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </CommunityCard>
      </div>

      {/* Row 2 — What Worked + Common Mistakes */}
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <CommunityCard title="What Worked">
          <ul className="mt-1 space-y-2.5 text-sm">
            {c.successPatterns.map((p) => (
              <li key={p} className="flex items-start gap-2 text-foreground/85">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </CommunityCard>

        <CommunityCard title="Common Mistakes">
          <ul className="mt-1 space-y-2.5 text-sm">
            {c.failurePatterns.map((p) => (
              <li key={p} className="flex items-start gap-2 text-foreground/85">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </CommunityCard>
      </div>

      {/* Row 3 — Most Successful Tech Stack (full width) */}
      <div className="mt-4">
        <CommunityCard title="Most Successful Tech Stack">
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Technologies most common across shipped projects.
          </p>
          <div className="mt-4 flex flex-col gap-2.5">
            {[
              [
                { name: "React", category: "Frontend", icon: "⚛️" },
                { name: "Node.js", category: "Backend", icon: "🟢" },
                { name: "MongoDB", category: "Database", icon: "🍃" },
              ],
              [
                { name: "Gemini API", category: "AI", icon: "✨" },
                { name: "Vercel", category: "Hosting", icon: "▲" },
              ],
            ].map((row, ri) => (
              <div key={ri} className="flex flex-wrap gap-2.5">
                {row.map((t) => (
                  <div
                    key={t.name}
                    className="flex min-w-[150px] items-center gap-2.5 rounded-xl border border-border/70 bg-background/40 px-3 py-2 shadow-sm transition hover:border-primary/40"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-base">
                      {t.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{t.name}</p>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        {t.category}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <p className="mt-3.5 text-[11px] text-muted-foreground">
            Used by {topStackCount} of the {c.similarCount} successful projects.
          </p>
        </CommunityCard>
      </div>
    </section>
  );
}

// ---------------- Similar Projects ----------------

type SimilarStatus = "Completed" | "Active" | "Abandoned";

type SimilarProject = {
  name: string;
  status: SimilarStatus;
  completion: number;
  summary: string;
  learning: string;
};

const SIMILAR_POOL: SimilarProject[] = [
  {
    name: "StudyPilot",
    status: "Completed",
    completion: 100,
    summary: "AI planner that turns a syllabus into daily study blocks.",
    learning: "A single-feature MVP shipped in 6 weeks drove first retention.",
  },
  {
    name: "FocusForge",
    status: "Active",
    completion: 62,
    summary: "Pomodoro + AI recap for solo student sessions.",
    learning: "Adding AI recaps late kept scope tight and users engaged.",
  },
  {
    name: "GradeGuru",
    status: "Abandoned",
    completion: 34,
    summary: "Full LMS clone with AI tutoring, payments, and community.",
    learning: "Trying to ship auth, payments and AI at once stalled progress.",
  },
  {
    name: "PlanPal",
    status: "Completed",
    completion: 100,
    summary: "Weekly study planner for CS undergrads with reminders.",
    learning: "Picking one segment before building beat generic planners.",
  },
  {
    name: "SyllabusAI",
    status: "Active",
    completion: 48,
    summary: "Parses PDFs into structured study timelines.",
    learning: "Caching parsed syllabi cut AI cost enough to keep going.",
  },
  {
    name: "CramDeck",
    status: "Abandoned",
    completion: 22,
    summary: "AI flashcard generator with spaced repetition and social feed.",
    learning: "Social features pulled focus away from the core learning loop.",
  },
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h || 42;
}

function pickSimilar(seed: string): SimilarProject[] {
  const h = hashString(seed);
  const start = h % SIMILAR_POOL.length;
  // Ensure a mix of statuses when possible: try to pick one of each.
  const desired: SimilarStatus[] = ["Completed", "Active", "Abandoned"];
  const picks: SimilarProject[] = [];
  for (const status of desired) {
    const candidates = SIMILAR_POOL.filter(
      (p) => p.status === status && !picks.includes(p),
    );
    if (candidates.length) {
      picks.push(candidates[(start + picks.length) % candidates.length]);
    }
  }
  while (picks.length < 3) {
    const cand = SIMILAR_POOL[(start + picks.length) % SIMILAR_POOL.length];
    if (!picks.includes(cand)) picks.push(cand);
  }
  return picks.slice(0, 3);
}

const STATUS_STYLES: Record<
  SimilarStatus,
  { chip: string; bar: string; cta: string; ctaLabel: string; accent: string }
> = {
  Completed: {
    chip: "bg-emerald-500/12 text-emerald-500 border-emerald-500/25",
    bar: "bg-emerald-500",
    cta: "bg-emerald-500 text-white hover:bg-emerald-500/90",
    ctaLabel: "View Project",
    accent: "from-emerald-500/12 to-transparent",
  },
  Active: {
    chip: "bg-primary/12 text-primary border-primary/25",
    bar: "bg-primary",
    cta: "bg-primary text-primary-foreground hover:bg-primary/90",
    ctaLabel: "Open Project",
    accent: "from-primary/12 to-transparent",
  },
  Abandoned: {
    chip: "bg-rose-500/12 text-rose-500 border-rose-500/25",
    bar: "bg-rose-500",
    cta: "bg-rose-500 text-white hover:bg-rose-500/90",
    ctaLabel: "View Autopsy",
    accent: "from-rose-500/12 to-transparent",
  },
};

function SimilarProjectsSection({ seed }: { seed: string }) {
  const projects = useMemo(() => pickSimilar(seed), [seed]);
  return (
    <section>
      <SectionTitle
        number={2}
        title="Similar Projects"
        subtitle="Projects in DraftYard with ideas most similar to yours."
      />
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        {projects.map((p) => {
          const s = STATUS_STYLES[p.status];
          return (
            <article
              key={p.name}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_20px_40px_-24px_rgba(124,92,255,0.35)]"
            >
              <div
                className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br ${s.accent} blur-2xl`}
                aria-hidden
              />
              <div className="relative flex items-start justify-between gap-2">
                <h4 className="font-display text-base font-semibold text-foreground">{p.name}</h4>
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${s.chip}`}
                >
                  {p.status}
                </span>
              </div>

              <div className="relative mt-4">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Completion</span>
                  <span className="font-medium text-foreground/80">{p.completion}%</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full ${s.bar}`} style={{ width: `${p.completion}%` }} />
                </div>
              </div>

              <p className="relative mt-4 text-sm text-foreground/85">{p.summary}</p>

              <div className="relative mt-3 rounded-lg border border-border/70 bg-muted/40 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Primary learning
                </p>
                <p className="mt-1 text-xs text-foreground/85">{p.learning}</p>
              </div>

              <div className="relative mt-4 flex justify-end">
                <button
                  type="button"
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${s.cta}`}
                >
                  {s.ctaLabel}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}



function NoCommunityBanner() {
  return (
    <section className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center">
      <p className="font-display text-base font-semibold text-foreground">
        No similar DraftYard projects were found.
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        This analysis is based on market research and AI reasoning.
      </p>
    </section>
  );
}

// ---------------- Small UI pieces ----------------

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </li>
  );
}

function SectionTitle({
  number,
  title,
  subtitle,
}: {
  number: number;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">
        {number}
      </span>
      <h3 className="font-display text-lg font-semibold tracking-tight text-foreground">{title}</h3>
      {subtitle && <span className="ml-1 text-xs text-muted-foreground">{subtitle}</span>}
    </div>
  );
}

function SectionHeading({
  number,
  icon,
  title,
}: {
  number?: number;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {typeof number === "number" ? (
        <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">
          {number}
        </span>
      ) : (
        <span className="grid h-7 w-7 place-items-center rounded-md bg-primary/10 text-primary">
          {icon}
        </span>
      )}
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
    </div>
  );
}

function CommunityCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground/90">{title}</h4>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function MetricCard({
  icon,
  title,
  status,
  note,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  status: string;
  note: string;
  tone: "emerald" | "amber" | "violet" | "sky";
}) {
  const toneMap: Record<string, string> = {
    emerald: "text-emerald-500 bg-emerald-500/10",
    amber: "text-amber-500 bg-amber-500/10",
    violet: "text-primary bg-primary/10",
    sky: "text-sky-500 bg-sky-500/10",
  };
  const statusTone: Record<string, string> = {
    High: "text-emerald-500",
    Medium: "text-amber-500",
    Low: "text-rose-500",
  };
  return (
    <div className="rounded-xl border border-border/70 bg-card px-3.5 py-3 shadow-sm">
      <div className="flex items-center gap-2">
        <span className={`grid h-6 w-6 place-items-center rounded-md ${toneMap[tone]}`}>{icon}</span>
        <span className="text-[11px] font-medium text-muted-foreground">{title}</span>
        <span className={`ml-auto text-xs font-semibold ${statusTone[status] ?? "text-foreground"}`}>
          {status}
        </span>
      </div>
      <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground line-clamp-2">{note}</p>
    </div>
  );
}

function OutcomeDonut({
  completed,
  active,
  abandoned,
}: {
  completed: number;
  active: number;
  abandoned: number;
}) {
  const total = completed + active + abandoned || 1;
  const R = 28;
  const C = 2 * Math.PI * R;
  const parts = [
    { v: completed, color: "#22C55E" },
    { v: active, color: "#7C5CFF" },
    { v: abandoned, color: "#EF4444" },
  ];
  let offset = 0;
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
      {parts.map((p, i) => {
        const len = (p.v / total) * C;
        const el = (
          <circle
            key={i}
            cx="36"
            cy="36"
            r={R}
            fill="none"
            stroke={p.color}
            strokeWidth="10"
            strokeDasharray={`${len} ${C - len}`}
            strokeDashoffset={-offset}
          />
        );
        offset += len;
        return el;
      })}
    </svg>
  );
}

function LegendDot({
  color,
  label,
  value,
  total,
}: {
  color: string;
  label: string;
  value: number;
  total: number;
}) {
  const pct = Math.round((value / total) * 100);
  return (
    <li className="flex items-center gap-2">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      <span className="text-foreground/80">{label}</span>
      <span className="ml-auto tabular-nums text-muted-foreground">
        {value} ({pct}%)
      </span>
    </li>
  );
}

function ScoreDial({ score }: { score: number }) {
  const size = 120;
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const dash = c * pct;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="currentColor"
          strokeOpacity={0.1}
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#dial)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${dash} ${c - dash}`}
        />
        <defs>
          <linearGradient id="dial" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#7C5CFF" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-[30px] font-semibold leading-none text-foreground">
          {score}
        </span>
        <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          / 100
        </span>
      </div>
    </div>
  );
}

// ---------------- History modal ----------------

function HistoryModal({
  open,
  onClose,
  reports,
  onSelect,
  onDelete,
  onDuplicate,
  onRename,
}: {
  open: boolean;
  onClose: () => void;
  reports: Report[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string, name: string) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () => reports.filter((r) => r.name.toLowerCase().includes(q.trim().toLowerCase())),
    [reports, q],
  );

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? null : onClose())}>
      <DialogContent className="max-w-md rounded-2xl border border-border/70 bg-card p-0 shadow-2xl">
        <DialogHeader className="px-5 pb-3 pt-5">
          <DialogTitle className="flex items-center justify-between text-base font-semibold">
            <span>History{reports.length ? ` (${reports.length})` : ""}</span>
          </DialogTitle>
          <DialogDescription className="sr-only">Past idea reviews</DialogDescription>
        </DialogHeader>

        <div className="px-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search reviews…"
              className="h-9 rounded-lg pl-9"
            />
          </div>
        </div>
        <ul className="max-h-[420px] overflow-y-auto px-2 py-2">
          {filtered.map((r) => (
            <li key={r.id}>
              <div className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-muted/60">
                <button
                  type="button"
                  onClick={() => onSelect(r.id)}
                  className="flex flex-1 items-center gap-3 text-left"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{relTime(r.createdAt)}</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {r.score}
                    <span className="text-xs text-muted-foreground">/100</span>
                  </span>
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground opacity-0 transition hover:bg-muted group-hover:opacity-100"
                      aria-label="More"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                      onClick={() => {
                        const name = window.prompt("Rename review", r.name);
                        if (name && name.trim()) onRename(r.id, name.trim());
                      }}
                    >
                      <Pencil className="mr-2 h-3.5 w-3.5" /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDuplicate(r.id)}>
                      <Copy className="mr-2 h-3.5 w-3.5" /> Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-rose-500 focus:text-rose-500"
                      onClick={() => onDelete(r.id)}
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
              No reviews match “{q}”.
            </li>
          )}
        </ul>
        <div className="border-t border-border/70 px-5 py-3">
          <Button variant="outline" className="w-full rounded-lg" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function relTime(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} day${d === 1 ? "" : "s"} ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w} week${w === 1 ? "" : "s"} ago`;
  const mo = Math.floor(d / 30);
  return `${mo} month${mo === 1 ? "" : "s"} ago`;
}
