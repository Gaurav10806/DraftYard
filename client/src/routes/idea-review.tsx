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
  AlertTriangle,
} from "lucide-react";
import { slugify } from "@/routes/project.$slug";

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
import { matchIdea, fetchAiIdeaAnalysis, type DraftMatch, type AiIdeaAnalysis, createReview, updateReview, fetchReviews, deleteReview, renameReview, type Review } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

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
type FormState = {
  name?: string;
  pitch: string;
  context: string;
};

const emptyForm: FormState = {
  name: "",
  pitch: "",
  context: "",
};

// ---------------- Fallback analysis (only used when the live Gemini call fails) ----------------
// These used to be fixed objects, so every idea showed the exact same
// "Recommended Tech Stack" and "Development Roadmap" whenever AI analysis
// (see fetchAiIdeaAnalysis) didn't come back. They now read the pitch +
// context text so the fallback is at least idea-specific instead of
// identical for every submission. This is only a safety net — when the AI
// call succeeds, aiAnalysis.techStack / aiAnalysis.roadmap (already
// generated per-idea by the prompt in idea_analysis_views.py) are used
// instead, see handleAnalyze below.

function buildFallbackStack(text: string) {
  const t = text.toLowerCase();
  const has = (...words: string[]) => words.some((w) => t.includes(w));

  const frontend = has("mobile app", "ios", "android", "react native")
    ? "React Native"
    : has("landing page", "marketing site", "blog", "content site")
    ? "Next.js"
    : has("dashboard", "admin panel", "analytics")
    ? "React + Tailwind"
    : "React";

  const backend = has("realtime", "real-time", "live chat", "socket", "multiplayer")
    ? "Node.js + Socket.io"
    : has("ml", "machine learning", "recommendation", "prediction", "classification", "model")
    ? "Django (Python)"
    : has("microservice", "high scale", "high-scale", "enterprise")
    ? "Node.js (Express, microservices)"
    : "Node.js (Express)";

  const database = has("graph", "social network", "relationship")
    ? "Neo4j"
    : has("transaction", "payment", "finance", "banking", "inventory", "order", "booking")
    ? "PostgreSQL"
    : "MongoDB";

  const ai = has("chatbot", "gpt", "llm", "generative", "nlp", "chat assistant", "conversational")
    ? "OpenAI / Gemini API"
    : has("recommendation", "prediction", "classification", "ml model", "machine learning")
    ? "scikit-learn / TensorFlow"
    : has("image", "vision", "photo", "ocr", "scan")
    ? "OpenCV + Vision API"
    : "OpenAI API";

  const hosting = has("mobile app", "ios", "android")
    ? "Expo EAS"
    : has("high scale", "enterprise", "high-scale")
    ? "AWS (EC2/ECS)"
    : "Vercel";

  return { frontend, backend, database, ai, hosting };
}

function buildFallbackRoadmap(text: string) {
  const t = text.toLowerCase();
  const complex = /\b(ml|ai|machine learning|blockchain|realtime|real-time|recommendation)\b/.test(t);
  return complex
    ? [
        { week: "Week 1", label: "Research & Scoping" },
        { week: "Week 2", label: "UI/UX Design" },
        { week: "Week 3–4", label: "Core Backend Setup" },
        { week: "Week 5–6", label: "AI/ML Integration" },
        { week: "Week 7", label: "Testing & Refinement" },
        { week: "Week 8", label: "Beta Launch" },
      ]
    : [
        { week: "Week 1", label: "Research" },
        { week: "Week 2", label: "UI/UX Design" },
        { week: "Week 3", label: "Backend Setup" },
        { week: "Week 4", label: "Core Features" },
        { week: "Week 5", label: "Testing" },
        { week: "Week 6", label: "Launch MVP" },
      ];
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
  const { user } = useAuth();
  const [reports, setReports] = useState<Review[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [emptyHistoryOpen, setEmptyHistoryOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReviews = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const reviews = await fetchReviews();
        setReports(reviews);
      } catch (err) {
        console.error("Failed to load reviews:", err);
        toast.error("Failed to load review history");
      } finally {
        setLoading(false);
      }
    };
    loadReviews();
  }, [user]);

  const active = useMemo(
    () => reports.find((r) => r._id === activeId) ?? null,
    [reports, activeId],
  );

  async function handleAnalyze() {
    if (!form.pitch.trim() || !form.context.trim()) return;
    if (!user) {
      toast.error("You must be logged in to analyze ideas");
      return;
    }

    setAnalyzing(true);
    try {
      // Create initial review document
      const newReview = await createReview({
        projectName: form.name || "Untitled Idea",
        oneLinePitch: form.pitch,
        additionalContext: form.context,
      });

      let matches: DraftMatch[] = [];
      let matchError: string | null = null;
      try {
        const result = await matchIdea({
          projectName: form.name,
          pitch: form.pitch,
          context: form.context,
        });
        const priorityRank = { High: 0, Medium: 1, Low: 2 } as const;
        matches = [...result.matches].sort(
          (a, b) => priorityRank[a.priority] - priorityRank[b.priority] || b.similarity - a.similarity,
        );
      } catch (err) {
        console.error("Idea matching failed:", err);
        matchError = err instanceof Error ? err.message : "Couldn't reach the matching service.";
      }

      let aiAnalysis: AiIdeaAnalysis | null = null;
      let aiAnalysisError: string | null = null;
      try {
        aiAnalysis = await  fetchAiIdeaAnalysis({
          projectName: form.name,
          pitch: form.pitch,
          context: form.context,
        });
      } catch (err) {
        console.error("AI analysis failed:", err);
        aiAnalysisError =
          err instanceof Error ? err.message : "Couldn't reach the AI analysis service.";
      }

      // Generate fallback analysis if needed
      const seed =
        (form.name + form.pitch + form.context).split("").reduce((a, c) => a + c.charCodeAt(0), 0) || 42;
      const fallbackScore = 68 + (seed % 27);
      const score = aiAnalysis?.score ?? fallbackScore;
      const verdict: Verdict =
        aiAnalysis?.verdict ??
        (score >= 80 ? "Worth Building" : score >= 70 ? "Needs Refinement" : "Reconsider");

      // Update review with analysis
      const updatedReview = await updateReview(newReview._id!, {
        score,
        verdict,
        summary:
          aiAnalysis?.summary ??
          (matches.length > 0
            ? "Strong potential based on community data and AI analysis. Focus on a lean MVP first."
            : "No similar DraftYard projects were found. This analysis is based on market research and AI reasoning."),
        similarProjects: matches,
        recommendedStack: aiAnalysis?.techStack ?? buildFallbackStack(`${form.pitch} ${form.context}`),
        risks: aiAnalysis
          ? {
              feasibility: aiAnalysis.feasibility,
              competition: aiAnalysis.competition,
              complexity: aiAnalysis.complexity,
              scalability: aiAnalysis.scalability,
              market: aiAnalysis.market,
            }
          : {
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
        suggestions: aiAnalysis?.recommendations ?? [
          "Start with a lean MVP: AI planner + progress tracking",
          "Focus on student retention with daily value delivery",
          "Limit AI usage and optimize for low cost",
          "Validate with 20–30 users before expanding features",
        ],
        roadmap: aiAnalysis?.roadmap ?? buildFallbackRoadmap(`${form.pitch} ${form.context}`),
        finalNote:
          aiAnalysis?.finalNote ??
          (matches.length > 0
            ? "This idea has strong potential based on real-world data and AI insights."
            : "This idea shows promise based on AI market analysis. Validate with real users early."),
        aiAnalysisUsed: Boolean(aiAnalysis),
        aiAnalysisError,
        matchError,
      });

      setReports([updatedReview, ...reports]);
      setActiveId(updatedReview._id!);
      setAnalyzing(false);
    } catch (err) {
      console.error("Analysis failed:", err);
      toast.error(err instanceof Error ? err.message : "Failed to analyze idea");
      setAnalyzing(false);
    }
  }

  function handleNewReview() {
    setActiveId(null);
    setForm(emptyForm);
  }

  function openHistory() {
    if (reports.length === 0) setEmptyHistoryOpen(true);
    else setHistoryOpen(true);
  }

  async function handleDelete(id: string) {
    try {
      await deleteReview(id);
      const next = reports.filter((r) => r._id !== id);
      setReports(next);
      if (activeId === id) setActiveId(null);
      toast.success("Review deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete review");
    }
  }

  async function handleDuplicate(id: string) {
    try {
      const src = reports.find((r) => r._id === id);
      if (!src) return;
      const copy = await createReview({
        projectName: (src.projectName || "Untitled") + " (copy)",
        oneLinePitch: src.oneLinePitch,
        additionalContext: src.additionalContext,
      });
      const reviewWithAnalysis = await updateReview(copy._id!, {
        score: src.score,
        verdict: src.verdict,
        summary: src.summary,
        similarProjects: src.similarProjects,
        recommendedStack: src.recommendedStack,
        risks: src.risks,
        suggestions: src.suggestions,
        roadmap: src.roadmap,
        finalNote: src.finalNote,
        aiAnalysisUsed: src.aiAnalysisUsed,
        aiAnalysisError: src.aiAnalysisError,
        matchError: src.matchError,
      });
      setReports([reviewWithAnalysis, ...reports]);
      toast.success("Review duplicated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to duplicate review");
    }
  }

  async function handleRename(id: string, name: string) {
    try {
      const updated = await renameReview(id, name);
      setReports(reports.map((r) => (r._id === id ? updated : r)));
      toast.success("Review renamed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to rename review");
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1240px] px-4 pb-24 pt-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
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
  const canSubmit = form.pitch.trim().length > 0 && form.context.trim().length > 0;

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

      <div className="grid grid-cols-1 gap-6">
        <Field label="Project Name" hint="Optional">
          <Input
            value={form.name || ""}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. AI Study Planner"
            className="h-10 rounded-lg"
          />
        </Field>

        <Field label="One-line Pitch" required>
          <Input
            value={form.pitch}
            onChange={(e) => setForm({ ...form, pitch: e.target.value })}
            placeholder="e.g. An AI that creates adaptive study plans"
            className="h-10 rounded-lg"
          />
        </Field>

        <Field label="Additional Context" required>
          <Textarea
            value={form.context}
            onChange={(e) => setForm({ ...form, context: e.target.value })}
            placeholder="Tell us more about the idea, why you want to build it, and any specific context…"
            rows={4}
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

function ReportView({ report }: { report: Review }) {
  const verdictTone =
    report.verdict === "Worth Building"
      ? "text-emerald-500"
      : report.verdict === "Needs Refinement"
      ? "text-amber-500"
      : "text-rose-500";

  // Build metrics from risks object
  const metrics = report.risks
    ? {
        feasibility: report.risks.feasibility || { label: "Medium", note: "To be determined" },
        competition: report.risks.competition || { label: "Medium", note: "To be determined" },
        complexity: report.risks.complexity || { label: "Medium", note: "To be determined" },
        scalability: report.risks.scalability || { label: "High", note: "To be determined" },
        market: report.risks.market || { headline: "Market TBD", note: "To be determined" },
      }
    : {
        feasibility: { label: "Medium", note: "To be determined" },
        competition: { label: "Medium", note: "To be determined" },
        complexity: { label: "Medium", note: "To be determined" },
        scalability: { label: "High", note: "To be determined" },
        market: { headline: "Market TBD", note: "To be determined" },
      };

  // Get stack from recommendedStack
  const stack = report.recommendedStack || {
    frontend: "React",
    backend: "Node.js",
    database: "MongoDB",
    ai: "OpenAI API",
    hosting: "Vercel",
  };

  return (
    <div className="space-y-10">
      {/* Summary card */}
      <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm sm:p-7">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,1fr)] lg:items-center">
          <div className="flex items-center gap-5">
            <ScoreDial score={report.score ?? 0} />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Overall Verdict
              </p>
              <h3 className={`font-display text-2xl font-semibold ${verdictTone}`}>
                {report.verdict || "Pending Analysis"}
              </h3>
              <div className="mt-1 flex items-center gap-0.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${
                      i < Math.round((report.score ?? 0) / 20) ? "fill-current" : "opacity-30"
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
              value={report.similarProjects && report.similarProjects.length > 0 ? "AI + Community" : report.aiAnalysisUsed ? "Live AI" : "AI only"}
            />
            <MetaRow
              icon={<Layers3 className="h-4 w-4" />}
              label="Similar Projects Found"
              value={String(report.similarProjects?.length ?? 0)}
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
              {report.projectName || "Untitled Idea"}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">
              {report.oneLinePitch}
            </p>
          </div>
        </div>
      </section>

      {/* Matched Drafts (real DraftYard data) */}
      <MatchedDraftsSection matches={report.similarProjects || []} error={report.matchError} />

      {/* AI Analysis */}
      <section>
        <SectionTitle number={2} title="AI Analysis" subtitle={report.similarProjects && report.similarProjects.length > 0 ? "Enhanced by DraftYard project data." : "Based on market research and AI reasoning."} />
        {report.aiAnalysisError && (
          <div className="mt-3 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 px-4 py-3">
            <p className="text-sm font-medium text-amber-600">
              Live AI analysis unavailable — showing a generic estimate instead.
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {report.aiAnalysisError} Check that GEMINI_API_KEY is set correctly in ml-backend/.env
              and that the ML backend can reach the Gemini API.
            </p>
          </div>
        )}
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          <MetricCard
            title="Feasibility"
            status={metrics.feasibility.label}
            note={metrics.feasibility.note}
            tone="emerald"
            icon={<ShieldCheck className="h-4 w-4" />}
          />
          <MetricCard
            title="Competition"
            status={metrics.competition.label}
            note={metrics.competition.note}
            tone="amber"
            icon={<Users className="h-4 w-4" />}
          />
          <MetricCard
            title="Complexity"
            status={metrics.complexity.label}
            note={metrics.complexity.note}
            tone="violet"
            icon={<Wrench className="h-4 w-4" />}
          />
          <MetricCard
            title="Scalability"
            status={metrics.scalability.label}
            note={metrics.scalability.note}
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
                {metrics.market.headline}
              </span>
            </div>
            <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground line-clamp-2">
              {metrics.market.note}
            </p>
          </div>
        </div>
      </section>

      {/* Recommendations + Stack + Roadmap */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1.2fr)]">
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <SectionHeading number={2} icon={<Lightbulb className="h-4 w-4" />} title="AI Recommendations" />
          <ul className="mt-4 space-y-2.5 text-sm">
            {(report.suggestions || []).map((r) => (
              <li key={r} className="flex items-start gap-2 text-foreground/85">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <h4 className="text-sm font-semibold text-foreground">Recommended Tech Stack</h4>
          <div className="mt-4 grid grid-cols-6 gap-2 text-center">
            {(
              [
                [stack.frontend || "React", "Frontend", 2],
                [stack.backend || "Node.js", "Backend", 2],
                [stack.database || "MongoDB", "Database", 2],
                [stack.ai || "Gemini API", "AI", 3],
                [stack.hosting || "Vercel", "Hosting", 3],
              ] as const
            ).map(([name, role, span]) => (
              <div
                key={name}
                className={`rounded-lg border border-border/60 bg-background/40 p-2 ${span === 3 ? "col-span-3" : "col-span-2"}`}
              >
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
              {(report.roadmap || []).map((r, i) => (
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
          <Link to="/workspace" search={{ draftId: undefined }}>
            Create Draft Project <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

// ---------------- Matched Drafts (real backend matching) ----------------

const PRIORITY_STYLES: Record<
  DraftMatch["priority"],
  { chip: string; bar: string }
> = {
  High: {
    chip: "bg-emerald-500/12 text-emerald-500 border-emerald-500/25",
    bar: "bg-emerald-500",
  },
  Medium: {
    chip: "bg-primary/12 text-primary border-primary/25",
    bar: "bg-primary",
  },
  Low: {
    chip: "bg-muted text-muted-foreground border-border",
    bar: "bg-muted-foreground/50",
  },
};

function MatchedDraftsSection({ matches, error }: { matches: DraftMatch[]; error: string | null }) {
  const [selectedMatch, setSelectedMatch] = useState<DraftMatch | null>(null);

  if (error) {
    return (
      <section className="rounded-2xl border border-dashed border-rose-500/40 bg-rose-500/5 p-6 text-center">
        <p className="font-display text-base font-semibold text-rose-500">
          Couldn't check for matching drafts.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {error} — this is not the same as "no matches found." Check that the ML backend is
          running and reachable, then try again.
        </p>
      </section>
    );
  }

  if (matches.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center">
        <p className="font-display text-base font-semibold text-foreground">
          No matching drafts found on DraftYard.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Nothing in the community database — even loosely — resembles this idea yet.
        </p>
      </section>
    );
  }

  return (
    <section>
      <SectionTitle
        number={1}
        title="Matching Drafts"
        subtitle={`${matches.length} draft${matches.length === 1 ? "" : "s"} on DraftYard resemble this idea, ranked by priority.`}
      />
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {matches.map((m) => {
          const s = PRIORITY_STYLES[m.priority];
          return (
            <article
              key={m.id}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_20px_40px_-24px_rgba(124,92,255,0.35)]"
            >
              <div className="relative flex items-start justify-between gap-2">
                <h4 className="font-display text-base font-semibold text-foreground">
                  {m.projectName}
                </h4>
                <span
                  className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${s.chip}`}
                >
                  {m.priority}
                </span>
              </div>

              <div className="relative mt-4">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Match strength</span>
                  <span className="font-medium text-foreground/80">{m.similarityPct}%</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${s.bar}`}
                    style={{ width: `${Math.max(4, m.similarityPct)}%` }}
                  />
                </div>
              </div>

              <p className="relative mt-4 text-sm text-foreground/85">{m.oneLiner}</p>

              {m.matchedKeywords?.length > 0 && (
                <div className="relative mt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Matched words
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {m.matchedKeywords.map((w) => (
                      <span
                        key={w}
                        className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {m.techStack.length > 0 && (
                <div className="relative mt-3 flex flex-wrap gap-1.5">
                  {m.techStack.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-foreground/80"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {m.failureReason && (
                <div className="relative mt-3 rounded-lg border border-border/70 bg-muted/40 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Why it stalled
                  </p>
                  <p className="mt-1 text-xs text-foreground/85">{m.failureReason}</p>
                </div>
              )}

              <div className="relative mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{m.currentStage}</span>
                <button
                  type="button"
                  onClick={() => setSelectedMatch(m)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 cursor-pointer"
                >
                  View Draft
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Draft Details Dialog */}
      <Dialog open={!!selectedMatch} onOpenChange={(open) => !open && setSelectedMatch(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedMatch && (
            <div>
              <DialogHeader>
                <div className="flex items-center justify-between gap-2 pr-6">
                  <DialogTitle className="font-display text-xl font-bold text-foreground">
                    {selectedMatch.projectName}
                  </DialogTitle>
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${PRIORITY_STYLES[selectedMatch.priority].chip}`}
                  >
                    {selectedMatch.priority} Priority
                  </span>
                </div>
                <DialogDescription className="mt-1 text-xs text-muted-foreground">
                  Domain: <span className="font-medium text-foreground capitalize">{selectedMatch.domain}</span> • Stage: <span className="font-medium text-foreground">{selectedMatch.currentStage}</span>
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-4 text-sm">
                {/* Match strength */}
                <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5">
                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span>Similarity Match</span>
                    <span className="font-bold text-foreground">{selectedMatch.similarityPct}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${PRIORITY_STYLES[selectedMatch.priority].bar}`}
                      style={{ width: `${Math.max(5, selectedMatch.similarityPct)}%` }}
                    />
                  </div>
                </div>

                {/* One-liner */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description / Pitch</h4>
                  <p className="mt-1 text-sm text-foreground/90 leading-relaxed">{selectedMatch.oneLiner}</p>
                </div>

                {/* Reason why it died */}
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400">
                    <AlertTriangle className="h-4 w-4" />
                    Reason Why It Died (Failure Reason)
                  </div>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-foreground">
                    {selectedMatch.failureReason || "No specific failure reason recorded."}
                  </p>
                </div>

                {/* Matched Keywords */}
                {selectedMatch.matchedKeywords?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Matched Keywords</h4>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {selectedMatch.matchedKeywords.map((w) => (
                        <span
                          key={w}
                          className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                        >
                          {w}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tech Stack */}
                {selectedMatch.techStack?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tech Stack</h4>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {selectedMatch.techStack.map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-border/80 bg-muted/60 px-2.5 py-0.5 text-xs font-medium text-foreground/80"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-border/60 pt-4">
                <Button variant="outline" size="sm" onClick={() => setSelectedMatch(null)}>
                  Close
                </Button>
                <Button asChild size="sm" className="gap-1.5">
                  <Link to="/project/$slug" params={{ slug: selectedMatch.id }}>
                    View Full Project Page <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function NoCommunityBanner({ used, error }: { used: boolean; error: string | null }) {
  return (
    <section className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center">
      <p className="font-display text-base font-semibold text-foreground">
        No similar DraftYard projects were found.
      </p>
      {used ? (
        <p className="mt-1 text-sm text-muted-foreground">
          The analysis below was generated live by AI for this specific idea, since there's no
          community data to compare against.
        </p>
      ) : error ? (
        <p className="mt-1 text-sm text-rose-500">
          Couldn't reach the AI analysis service ({error}). Showing a generic estimate instead —
          try again in a moment.
        </p>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">
          This analysis is based on market research and AI reasoning.
        </p>
      )}
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
  reports: Review[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string, name: string) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () => reports.filter((r) => r.projectName.toLowerCase().includes(q.trim().toLowerCase())),
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
            <li key={r._id}>
              <div className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-muted/60">
                <button
                  type="button"
                  onClick={() => onSelect(r._id!)}
                  className="flex flex-1 items-center gap-3 text-left"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{r.projectName || "Untitled Idea"}</p>
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
                        const name = window.prompt("Rename review", r.projectName || "Untitled Idea");
                        if (name && name.trim()) onRename(r._id!, name.trim());
                      }}
                    >
                      <Pencil className="mr-2 h-3.5 w-3.5" /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDuplicate(r._id!)}>
                      <Copy className="mr-2 h-3.5 w-3.5" /> Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-rose-500 focus:text-rose-500"
                      onClick={() => onDelete(r._id!)}
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

function relTime(ts?: string | Date | number | null) {
  if (!ts) return "Just now";
  let ms: number;
  if (typeof ts === "string") {
    ms = new Date(ts).getTime();
  } else if (ts instanceof Date) {
    ms = ts.getTime();
  } else {
    ms = ts;
  }
  
  const diff = Date.now() - ms;
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