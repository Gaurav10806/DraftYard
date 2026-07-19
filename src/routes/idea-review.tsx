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
  Gauge,
  Users,
  ShieldAlert,
  Lightbulb,
  Server,
  Compass,
  Rocket,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Copy,
  Pencil,
  Star,
  Layers,
  TrendingUp,
  Wrench,
  Scale,
} from "lucide-react";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { TopBar } from "@/components/dashboard/top-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
          "Validate your software idea before writing a single line of code. AI-powered feasibility, competition, and roadmap analysis.",
      },
      { property: "og:title", content: "Idea Review · DraftYard" },
      {
        property: "og:description",
        content: "An AI product consultant for your next build.",
      },
    ],
  }),
  component: IdeaReviewPage,
});

// ---------------- Types & mock analysis ----------------

type Verdict = "Worth Building" | "Needs Refinement" | "Reconsider";

type Report = {
  id: string;
  name: string;
  pitch: string;
  createdAt: number;
  score: number;
  verdict: Verdict;
  summary: string;
  metrics: {
    feasibility: { label: string; note: string };
    competition: { label: string; note: string };
    complexity: { label: string; note: string };
    scalability: { label: string; note: string };
  };
  competitors: { product: string; strength: string; weakness: string }[];
  audience: string[];
  risks: string[];
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

const STORAGE_KEY = "draftyard.idea-reviews.v1";

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
  // Deterministic pseudo-analysis so the demo feels alive without a network call.
  const seed =
    (form.name + form.pitch + form.problem).split("").reduce((a, c) => a + c.charCodeAt(0), 0) || 42;
  const score = 68 + (seed % 27); // 68..94
  const verdict: Verdict =
    score >= 80 ? "Worth Building" : score >= 70 ? "Needs Refinement" : "Reconsider";

  return {
    id: crypto.randomUUID?.() ?? String(Date.now()),
    name: form.name || "Untitled Idea",
    pitch: form.pitch || "—",
    createdAt: Date.now(),
    score,
    verdict,
    summary:
      verdict === "Worth Building"
        ? "Strong potential with the right execution and focus. Clear problem, credible audience, and a lean path to a first version."
        : verdict === "Needs Refinement"
        ? "Solid direction, but the scope needs tightening before you invest weeks of work."
        : "The current framing has weak signals. Sharpen the problem or reconsider the audience before building.",
    metrics: {
      feasibility: {
        label: score >= 78 ? "High" : "Medium",
        note: "A small team can ship a working prototype in 4–6 weeks.",
      },
      competition: {
        label: score % 2 === 0 ? "Medium" : "High",
        note: "Established players exist, but most miss your specific audience.",
      },
      complexity: {
        label: score >= 82 ? "Medium" : "High",
        note: "Core logic is standard; the AI layer is the main unknown.",
      },
      scalability: {
        label: "High",
        note: "Stateless workloads and cheap storage give you room to grow.",
      },
    },
    competitors: [
      { product: "Notion", strength: "Powerful", weakness: "Complex to onboard" },
      { product: "Motion", strength: "Automation", weakness: "Expensive at scale" },
      { product: "Todoist", strength: "Simplicity", weakness: "No AI features" },
      { product: "StudyQuest", strength: "Student focused", weakness: "Limited features" },
    ],
    audience:
      form.audience.trim().length > 0
        ? form.audience.split(/[,\n]/).map((s) => s.trim()).filter(Boolean).slice(0, 5)
        : ["College Students", "JEE / NEET Aspirants", "UPSC Aspirants", "Working Professionals"],
    risks: [
      "AI API operational cost may erode margins early",
      "Strong existing competitors with distribution",
      "Data privacy & compliance for user-generated content",
      "User retention beyond the first 4 weeks",
    ],
    recommendations: [
      "Focus on one wedge audience first — don't try to serve everyone",
      "Keep the first release simple (5–7 core features)",
      "Validate with a small user group before scaling paid ads",
      "Avoid adding chat features until v2",
    ],
    stack: {
      frontend: "React + Tailwind",
      backend: "Node.js + Express",
      database: "MongoDB",
      ai: "Gemini / OpenAI",
      hosting: "Vercel / Render",
    },
    roadmap: [
      { week: "Week 1", label: "Research" },
      { week: "Week 2", label: "UI / UX" },
      { week: "Week 3", label: "Backend" },
      { week: "Week 4", label: "AI Integration" },
      { week: "Week 5", label: "Testing & Launch" },
    ],
    finalNote:
      verdict === "Worth Building"
        ? "This idea has strong potential. Start small, validate fast, and iterate."
        : "Refine your positioning, then revisit this analysis before you commit weeks of work.",
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

  function handleDelete(id: string) {
    const next = reports.filter((r) => r.id !== id);
    persist(next);
    if (activeId === id) setActiveId(null);
  }

  function handleDuplicate(id: string) {
    const src = reports.find((r) => r.id === id);
    if (!src) return;
    const copy: Report = { ...src, id: crypto.randomUUID?.() ?? String(Date.now()), createdAt: Date.now(), name: src.name + " (copy)" };
    persist([copy, ...reports]);
  }

  function handleRename(id: string, name: string) {
    persist(reports.map((r) => (r.id === id ? { ...r, name } : r)));
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
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
              ? "AI analysis complete. Here's what we found for your idea."
              : "Validate your software idea before writing a single line of code."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHistoryOpen(true)}
            className="h-9 gap-2 rounded-lg border-border/70 bg-card"
          >
            <HistoryIcon className="h-3.5 w-3.5" />
            History{reports.length > 0 ? ` (${reports.length})` : ""}
          </Button>
          {active && (
            <Button
              size="sm"
              onClick={handleNewReview}
              className="h-9 gap-2 rounded-lg"
            >
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
            <IdeaForm
              form={form}
              setForm={setForm}
              onSubmit={handleAnalyze}
              analyzing={analyzing}
            />
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
    if (!v) return;
    if (form.features.includes(v)) return;
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
          The more details you provide, the better our AI analysis will be.
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

        <Field label="Key Features" hint="Press Enter to add a tag">
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
            placeholder="e.g. React, Node.js, MongoDB, Gemini API"
            className="h-10 rounded-lg"
          />
        </Field>

        <Field label="Problem" required>
          <Input
            value={form.problem}
            onChange={(e) => setForm({ ...form, problem: e.target.value })}
            placeholder="e.g. Students don't know what to study daily"
            className="h-10 rounded-lg"
          />
        </Field>

        <Field label="Anything else we should know?" hint="Optional">
          <Textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Any specific context, constraints or goals?"
            rows={2}
            className="resize-none rounded-lg"
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
      </div>

      <div className="mt-10 flex flex-col items-center gap-2">
        <Button
          size="lg"
          onClick={onSubmit}
          disabled={!canSubmit || analyzing}
          className="group h-12 min-w-[280px] gap-2 rounded-xl px-8 text-sm font-semibold"
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
        <p className="text-xs text-muted-foreground">
          Analysis usually takes 30–60 seconds.
        </p>
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
    <div className="space-y-6">
      {/* Verdict + metrics */}
      <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:items-center">
          <div className="flex items-center gap-5">
            <ScoreDial score={report.score} />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Overall Verdict
              </p>
              <h3 className={`font-display text-xl font-semibold ${verdictTone}`}>
                {report.verdict}
              </h3>
              <div className="mt-1 flex items-center gap-0.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${i < Math.round(report.score / 20) ? "fill-current" : "opacity-30"}`}
                  />
                ))}
              </div>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                {report.summary}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <MetricCard
              icon={<Gauge className="h-3.5 w-3.5" />}
              title="Feasibility"
              status={report.metrics.feasibility.label}
              note={report.metrics.feasibility.note}
              tone="emerald"
            />
            <MetricCard
              icon={<TrendingUp className="h-3.5 w-3.5" />}
              title="Competition"
              status={report.metrics.competition.label}
              note={report.metrics.competition.note}
              tone="amber"
            />
            <MetricCard
              icon={<Wrench className="h-3.5 w-3.5" />}
              title="Complexity"
              status={report.metrics.complexity.label}
              note={report.metrics.complexity.note}
              tone="violet"
            />
            <MetricCard
              icon={<Scale className="h-3.5 w-3.5" />}
              title="Scalability"
              status={report.metrics.scalability.label}
              note={report.metrics.scalability.note}
              tone="sky"
            />
          </div>
        </div>
      </section>

      {/* Competition */}
      <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
        <SectionHeading icon={<Layers className="h-4 w-4" />} title="Competition Snapshot" />
        <div className="mt-4 overflow-hidden rounded-xl border border-border/60">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Product</th>
                <th className="px-4 py-2 font-medium">Strength</th>
                <th className="px-4 py-2 font-medium">Weakness</th>
              </tr>
            </thead>
            <tbody>
              {report.competitors.map((c, i) => (
                <tr
                  key={c.product}
                  className={i % 2 ? "bg-transparent" : "bg-muted/20"}
                >
                  <td className="px-4 py-2.5 font-medium text-foreground">{c.product}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{c.strength}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{c.weakness}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/[0.06] px-3 py-2.5 text-sm">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="text-foreground/80">
            <span className="font-medium text-foreground">Opportunity:</span>{" "}
            Few products offer adaptive AI planning tailored to your specific audience.
          </span>
        </div>
      </section>

      {/* Audience / risks / recommendations */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <InfoCard icon={<Users className="h-4 w-4" />} title="Target Audience">
          <ul className="space-y-2 text-sm text-foreground/80">
            {report.audience.map((a) => (
              <li key={a} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {a}
              </li>
            ))}
          </ul>
        </InfoCard>
        <InfoCard icon={<ShieldAlert className="h-4 w-4 text-rose-500" />} title="Risks & Challenges">
          <ul className="space-y-2 text-sm text-foreground/80">
            {report.risks.map((r) => (
              <li key={r} className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500/80" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </InfoCard>
        <InfoCard icon={<Lightbulb className="h-4 w-4 text-amber-500" />} title="AI Recommendations">
          <ul className="space-y-2 text-sm text-foreground/80">
            {report.recommendations.map((r) => (
              <li key={r} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </InfoCard>
      </div>

      {/* Stack + roadmap */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <InfoCard icon={<Server className="h-4 w-4" />} title="Recommended Tech Stack">
          <dl className="divide-y divide-border/60 text-sm">
            {(
              [
                ["Frontend", report.stack.frontend],
                ["Backend", report.stack.backend],
                ["Database", report.stack.database],
                ["AI", report.stack.ai],
                ["Hosting", report.stack.hosting],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between py-2.5">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="font-medium text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
        </InfoCard>

        <InfoCard icon={<Compass className="h-4 w-4" />} title="Development Roadmap">
          <div className="relative pt-4">
            <div className="absolute left-4 right-4 top-[34px] h-px bg-border" aria-hidden />
            <ol className="relative flex justify-between gap-2">
              {report.roadmap.map((r, i) => (
                <li key={r.week} className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
                  <span className="relative z-10 grid h-7 w-7 place-items-center rounded-full border border-border bg-card text-[11px] font-semibold text-foreground">
                    {i + 1}
                  </span>
                  <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {r.week}
                  </span>
                  <span className="text-xs font-medium text-foreground">{r.label}</span>
                </li>
              ))}
            </ol>
          </div>
        </InfoCard>
      </div>

      {/* Sticky CTA */}
      <div className="sticky bottom-4 z-10 flex flex-col items-start justify-between gap-3 rounded-2xl border border-border/70 bg-card/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Rocket className="h-4 w-4" />
          </span>
          <div>
            <p className="font-display text-sm font-semibold text-foreground">
              {report.finalNote}
            </p>
            <p className="text-xs text-muted-foreground">
              This will prefill your project details in Workspace.
            </p>
          </div>
        </div>
        <Button asChild size="lg" className="h-11 gap-2 rounded-xl px-6">
          <Link to="/workspace">
            Create Draft Project <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function ScoreDial({ score }: { score: number }) {
  const size = 108;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const dash = c * pct;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="currentColor"
          strokeOpacity={0.12}
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
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--primary) / 0.6)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-[26px] font-semibold leading-none text-foreground">
          {score}
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          / 100
        </span>
      </div>
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
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 p-3">
      <div className="flex items-center gap-2">
        <span className={`grid h-6 w-6 place-items-center rounded-md ${toneMap[tone]}`}>{icon}</span>
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
      </div>
      <div className="mt-2 text-sm font-semibold text-foreground">{status}</div>
      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{note}</p>
    </div>
  );
}

function SectionHeading({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-7 w-7 place-items-center rounded-md bg-primary/10 text-primary">
        {icon}
      </span>
      <h3 className="font-display text-base font-semibold tracking-tight text-foreground">
        {title}
      </h3>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      <SectionHeading icon={icon} title={title} />
      <div className="mt-4">{children}</div>
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
    () =>
      reports.filter((r) =>
        r.name.toLowerCase().includes(q.trim().toLowerCase()),
      ),
    [reports, q],
  );

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? null : onClose())}>
      <DialogContent className="max-w-md rounded-2xl border border-border/70 bg-card p-0 shadow-2xl">
        <DialogHeader className="px-5 pb-3 pt-5">
          <DialogTitle className="flex items-center justify-between text-base font-semibold">
            <span>History{reports.length ? ` (${reports.length})` : ""}</span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Past idea reviews
          </DialogDescription>
        </DialogHeader>

        {reports.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 pb-8 pt-2 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-xl bg-muted/60 text-muted-foreground">
              <Inbox className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">No reviews yet.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Analyze your first idea to start building history.
              </p>
            </div>
            <Button className="mt-2 w-full rounded-lg" onClick={onClose}>
              Got it
            </Button>
          </div>
        ) : (
          <>
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
            <ul className="max-h-[360px] overflow-y-auto px-2 py-2">
              {filtered.map((r) => (
                <li key={r.id}>
                  <div className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-muted/60">
                    <button
                      type="button"
                      onClick={() => onSelect(r.id)}
                      className="flex flex-1 items-center gap-3 text-left"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                        <Sparkles className="h-4 w-4" />
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function relTime(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
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
