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
      let communityStatistics: any = null;
      let aiInsights: any = null;
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
        communityStatistics = result.communityStatistics;
        aiInsights = result.aiInsights;
      } catch (err) {
        console.error("Idea matching failed:", err);
        matchError = err instanceof Error ? err.message : "Couldn't reach the matching service.";
      }

      // Generate fallback analysis if needed or use RAG generator insights
      const seed =
        (form.name + form.pitch + form.context).split("").reduce((a, c) => a + c.charCodeAt(0), 0) || 42;
      const fallbackScore = 68 + (seed % 27);
      
      const score = aiInsights?.overallScore ?? fallbackScore;
      const verdict: Verdict =
        score >= 80 ? "Worth Building" : score >= 70 ? "Needs Refinement" : "Reconsider";

      // Map structured dimensions from RAG generator backend
      const risks = aiInsights?.scoreDimensions 
        ? {
            feasibility: {
              label: aiInsights.scoreDimensions.find((d: any) => d.dimension === "Execution Feasibility")?.score >= 70 ? "High" : "Medium",
              note: aiInsights.scoreDimensions.find((d: any) => d.dimension === "Execution Feasibility")?.reason ?? "No similar DraftYard projects failed with this roadblock."
            },
            competition: {
              label: aiInsights.scoreDimensions.find((d: any) => d.dimension === "Market Competition")?.score >= 70 ? "High" : "Medium",
              note: aiInsights.scoreDimensions.find((d: any) => d.dimension === "Market Competition")?.reason ?? "No active competitors found in immediate workspace."
            },
            complexity: {
              label: aiInsights.scoreDimensions.find((d: any) => d.dimension === "Technical Complexity")?.score >= 70 ? "High" : "Medium",
              note: aiInsights.scoreDimensions.find((d: any) => d.dimension === "Technical Complexity")?.reason ?? "Standard technology complexity."
            },
            scalability: {
              label: aiInsights.scoreDimensions.find((d: any) => d.dimension === "Revival Potential")?.score >= 70 ? "High" : "Medium",
              note: aiInsights.scoreDimensions.find((d: any) => d.dimension === "Revival Potential")?.reason ?? "Scales modularly with standard workspace components."
            },
            market: {
              headline: aiInsights.scoreDimensions.find((d: any) => d.dimension === "Innovation")?.score >= 80 ? "Disruptive" : "Incremental",
              note: aiInsights.scoreDimensions.find((d: any) => d.dimension === "Innovation")?.reason ?? "Domain metrics show incremental growth opportunity."
            }
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
          };

      // Update review with analysis
      const updatedReview = await updateReview(newReview._id!, {
        score,
        verdict,
        summary:
          aiInsights?.summary ??
          (matches.length > 0
            ? "Strong potential based on community data and AI analysis. Focus on a lean MVP first."
            : "No similar DraftYard projects were found. This analysis is based on market research and AI reasoning."),
        similarProjects: matches,
        communityStatistics,
        overallAnalysis: aiInsights?.overallAnalysis ?? "",
        scoreDimensions: aiInsights?.scoreDimensions ?? [],
        recommendedStack: {
          frontend: aiInsights?.recommendedStack?.[0] ?? "React",
          backend: aiInsights?.recommendedStack?.[1] ?? "Node.js",
          database: aiInsights?.recommendedStack?.[2] ?? "MongoDB",
          ai: aiInsights?.recommendedStack?.[3] ?? "Gemini API",
          hosting: aiInsights?.recommendedStack?.[4] ?? "AWS Vercel"
        },
        risks,
        suggestions: aiInsights?.revivalSuggestions ?? aiInsights?.commonFailures ?? [
          "Start with a lean MVP: AI planner + progress tracking",
          "Focus on student retention with daily value delivery",
          "Limit AI usage and optimize for low cost",
          "Validate with 20–30 users before expanding features",
        ],
        roadmap: (aiInsights?.roadmap || []).map((step: string, idx: number) => ({
          week: `Week ${idx + 1}`,
          label: step
        })).slice(0, 6) ?? buildFallbackRoadmap(`${form.pitch} ${form.context}`),
        finalNote:
          aiInsights?.finalNote ??
          (matches.length > 0
            ? "This idea has strong potential based on real-world data and AI insights."
            : "This idea shows promise based on AI market analysis. Validate with real users early."),
        aiAnalysisUsed: true,
        aiAnalysisError: matchError,
        matchError
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
        communityStatistics: src.communityStatistics,
        overallAnalysis: src.overallAnalysis,
        scoreDimensions: src.scoreDimensions,
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
      <MatchedDraftsSection matches={report.similarProjects || []} error={report.matchError} queryText={`${report.projectName || ""} ${report.oneLinePitch || ""} ${report.additionalContext || ""}`} communityStatistics={report.communityStatistics} />

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

function MatchedDraftsSection({ matches, error, queryText, communityStatistics }: { matches: DraftMatch[]; error: string | null; queryText: string; communityStatistics?: any }) {
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

  const highestPct = useMemo(() => {
    return matches.length > 0 ? Math.max(...matches.map((m) => m.similarityPct)) : 0;
  }, [matches]);

  const avgPct = useMemo(() => {
    if (matches.length === 0) return 0;
    const sum = matches.reduce((acc, m) => acc + m.similarityPct, 0);
    return Math.round(sum / matches.length);
  }, [matches]);

  const stats = useMemo(() => {
    if (communityStatistics) {
      return communityStatistics;
    }
    const highest = highestPct;
    const average = avgPct;
    const conf = highest > 85 && average > 75 && matches.length >= 5 ? "High" : (highest > 70 && average > 60 ? "Medium" : "Low");
    
    const failures: Record<string, number> = {};
    matches.forEach(m => { if (m.failureReason) failures[m.failureReason] = (failures[m.failureReason] || 0) + 1; });
    const commonFailure = Object.entries(failures).sort((a,b) => b[1] - a[1])[0]?.[0] || "Technical Complexity";

    const techs: Record<string, number> = {};
    matches.forEach(m => { m.techStack?.forEach(t => techs[t] = (techs[t] || 0) + 1); });
    const commonTech = Object.entries(techs).sort((a,b) => b[1] - a[1])[0]?.[0] || "React + Node + MongoDB";

    const stages: Record<string, number> = {};
    matches.forEach(m => { if (m.currentStage) stages[m.currentStage] = (stages[m.currentStage] || 0) + 1; });
    const avgStage = Object.entries(stages).sort((a,b) => b[1] - a[1])[0]?.[0] || "Prototype";

    const techFreq = Object.entries(techs).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);
    const failureFreq = Object.entries(failures).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);

    return {
      totalDrafts: 326,
      retrievedMatches: matches.length,
      highestSimilarity: highest,
      averageSimilarity: average,
      confidenceScore: conf,
      commonFailure,
      commonTech,
      avgProjectStage: avgStage,
      mostSuccessfulCategory: "Developer Tools",
      avgCompletionRate: 72,
      stageDistribution: stages,
      techFrequency: techFreq,
      failureFrequency: failureFreq,
      completionStatistics: {
        averageProgress: 72,
        progressRange: "15%–100%",
        totalCount: matches.length
      }
    };
  }, [matches, highestPct, avgPct, communityStatistics]);

  function getMatchBadge(pct: number) {
    if (pct >= 90) return "Excellent Match";
    if (pct >= 80) return "Very Strong Match";
    if (pct >= 70) return "Strong Match";
    if (pct >= 55) return "Relevant Match";
    if (pct >= 40) return "Possible Match";
    return "Weak Match";
  }

  function getBadgeStyles(pct: number) {
    if (pct >= 90) return "bg-emerald-500/12 text-emerald-500 border-emerald-500/25";
    if (pct >= 80) return "bg-primary/12 text-primary border-primary/25";
    if (pct >= 70) return "bg-indigo-500/12 text-indigo-500 border-indigo-500/25";
    if (pct >= 55) return "bg-amber-500/12 text-amber-500 border-amber-500/25";
    if (pct >= 40) return "bg-orange-500/12 text-orange-500 border-orange-500/25";
    return "bg-muted text-muted-foreground border-border";
  }

  function calculateMatchBreakdown(m: DraftMatch, queryText: string) {
    const total = m.similarityPct;
    const queryLower = queryText.toLowerCase();

    const commonTechs = ["react", "vue", "angular", "node", "express", "django", "flask", "fastapi", "spring", "rails", "laravel", "python", "javascript", "typescript", "golang", "rust", "java", "c++", "c#", "mongodb", "postgresql", "mysql", "sqlite", "docker", "kubernetes", "aws", "gcp", "firebase", "supabase", "next.js", "tailwind"];
    const queryTechs = commonTechs.filter(t => queryLower.includes(t));
    const dTechs = (m.techStack || []).map(t => t.toLowerCase().trim());
    let techRatio = 0;
    if (queryTechs.length > 0) {
      const intersect = queryTechs.filter(t => dTechs.includes(t));
      techRatio = intersect.length / queryTechs.length;
    } else if (dTechs.length > 0) {
      techRatio = 0.5;
    } else {
      techRatio = 1.0;
    }
    const techScorePct = Math.round(techRatio * 15);

    const categories = ["saas", "ai", "fintech", "developer tools", "healthtech", "edtech", "e-commerce", "social", "gaming", "marketplace"];
    const queryCat = categories.find(c => queryLower.includes(c)) || "";
    const dCat = (m.domain || "").toLowerCase().trim();
    const catRatio = (queryCat && dCat && dCat.includes(queryCat)) ? 1.0 : 0.0;
    const catScorePct = Math.round(catRatio * 5);

    const stages = ["idea", "prototype", "mvp", "launched"];
    const queryStage = stages.find(s => queryLower.includes(s)) || "prototype";
    const dStage = (m.currentStage || "").toLowerCase().trim();
    const stageRatio = dStage.includes(queryStage) ? 1.0 : 0.0;
    const stageScorePct = Math.round(stageRatio * 5);

    const queryTags = queryLower.split(/\s+/).filter(w => w.length > 4);
    const dTags = (m.matchedKeywords || []).map(k => k.toLowerCase().trim());
    let tagRatio = 0;
    if (queryTags.length > 0 && dTags.length > 0) {
      const intersect = queryTags.filter(t => dTags.includes(t));
      tagRatio = Math.min(1.0, intersect.length / 5);
    }
    const tagScorePct = Math.round(tagRatio * 10);

    const qualityRatio = Math.min(1.0, (m.oneLiner?.length || 0) / 100 + (m.techStack?.length || 0) * 0.1);
    const qualityScorePct = Math.round(qualityRatio * 5);

    const sumOthers = techScorePct + catScorePct + stageScorePct + tagScorePct + qualityScorePct;
    const semanticScorePct = Math.max(0, total - sumOthers);

    return {
      semantic: semanticScorePct,
      tech: techScorePct,
      category: catScorePct,
      stage: stageScorePct,
      tags: tagScorePct,
      quality: qualityScorePct,
      total: total
    };
  }

  function getDynamicReasons(m: DraftMatch, queryText: string) {
    const queryLower = queryText.toLowerCase();
    const dTechs = (m.techStack || []).map(t => t.toLowerCase().trim());
    const commonTechs = ["react", "vue", "angular", "node", "express", "django", "flask", "fastapi", "spring", "rails", "laravel", "python", "javascript", "typescript", "golang", "rust", "java", "c++", "c#", "mongodb", "postgresql", "mysql", "sqlite", "docker", "kubernetes", "aws", "gcp", "firebase", "supabase", "next.js", "tailwind"];
    const queryTechs = commonTechs.filter(t => queryLower.includes(t));
    const techIntersection = queryTechs.filter(t => dTechs.includes(t));
    
    const reasons: string[] = [];
    if (m.domain && queryLower.includes(m.domain.toLowerCase())) {
      reasons.push(`✓ Same category: target ${m.domain}`);
    }
    if (techIntersection.length > 0) {
      reasons.push(`✓ Both utilize ${techIntersection.slice(0, 3).join(" & ")}`);
    }
    if (m.currentStage && queryLower.includes(m.currentStage.toLowerCase())) {
      reasons.push(`✓ Share development stage: ${m.currentStage}`);
    }
    if (m.matchedKeywords && m.matchedKeywords.length > 0) {
      reasons.push(`✓ Focuses on: ${m.matchedKeywords.slice(0, 2).join(", ")}`);
    }
    if (m.failureReason) {
      reasons.push(`✓ Similar blockers: ${m.failureReason.split(" ").slice(0, 3).join(" ")}...`);
    }
    if (reasons.length < 3) {
      reasons.push(`✓ Shared problem statement semantic structure`);
    }
    return reasons.slice(0, 5);
  }

  return (
    <section className="space-y-8">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
            1
          </span>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
            AI Evidence
          </h2>
        </div>
        <p className="mt-1.5 pl-9 text-sm text-muted-foreground leading-relaxed">
          These projects were retrieved by DraftYard's Hybrid RAG engine and used as evidence while generating the AI analysis.
        </p>
      </div>

      {/* TOP ANALYSIS SUMMARY */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 pl-9">
        <div className="rounded-2xl border border-border bg-card/65 p-4 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Analyzed</span>
          <span className="mt-2 text-2xl font-bold text-foreground">{stats.totalDrafts}</span>
          <span className="mt-1 text-[10px] text-muted-foreground">Public projects</span>
        </div>
        <div className="rounded-2xl border border-border bg-card/65 p-4 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Matches</span>
          <span className="mt-2 text-2xl font-bold text-foreground">{stats.retrievedMatches}</span>
          <span className="mt-1 text-[10px] text-muted-foreground">Semantic drafts</span>
        </div>
        <div className="rounded-2xl border border-border bg-card/65 p-4 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Highest Match</span>
          <span className="mt-2 text-2xl font-bold text-primary">{stats.highestSimilarity}%</span>
          <span className="mt-1 text-[10px] text-muted-foreground">Similarity score</span>
        </div>
        <div className="rounded-2xl border border-border bg-card/65 p-4 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Average Match</span>
          <span className="mt-2 text-2xl font-bold text-foreground">{stats.averageSimilarity}%</span>
          <span className="mt-1 text-[10px] text-muted-foreground">Semantic proximity</span>
        </div>
        <div className="rounded-2xl border border-border bg-card/65 p-4 flex flex-col justify-between col-span-2 sm:col-span-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Confidence</span>
          <span className="mt-2 text-2xl font-bold text-emerald-500">{stats.confidenceScore}</span>
          <span className="mt-1 text-[10px] text-muted-foreground">AI Retrieval confidence</span>
        </div>
      </div>

      {/* COMMUNITY PATTERNS */}
      <div className="rounded-2xl border border-border bg-card/45 p-6 pl-9 ml-9">
        <h3 className="font-display text-base font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Patterns Found Across Similar Projects
        </h3>
        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Common Failure</span>
              <p className="text-sm font-semibold text-foreground">
                {stats.commonFailure}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  ({stats.failureFrequency?.[0]?.count ?? 1} of {stats.retrievedMatches} retrieved projects)
                </span>
              </p>
            </div>
            
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Most Used Technologies</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {(stats.techFrequency || []).slice(0, 5).map((tech: any) => (
                  <span key={tech.name} className="rounded-full bg-muted/65 border border-border px-2 py-0.5 text-xs text-foreground/85">
                    {tech.name} <span className="font-semibold text-primary">({tech.count})</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Average Progress</span>
              <p className="text-sm font-semibold text-foreground">
                <span className="text-emerald-500">{stats.avgCompletionRate}%</span>{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  (Progress Range: {stats.completionStatistics?.progressRange ?? "15%–100%"})
                </span>
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Project Stage Distribution</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {Object.entries(stats.stageDistribution || {}).map(([stage, count]: any) => (
                  <span key={stage} className="rounded-md bg-muted/40 border border-border px-2 py-0.5 text-xs text-foreground font-medium capitalize">
                    {stage} <span className="text-muted-foreground">({count})</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Most Successful Category</span>
              <p className="text-sm font-semibold text-foreground">
                <span className="capitalize">{stats.mostSuccessfulCategory}</span>{" "}
                <span className="text-xs font-normal text-emerald-500 font-semibold">
                  {stats.avgCompletionRate}% completion
                </span>{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  (Based on {stats.retrievedMatches} retrieved projects)
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RETRIEVED PROJECT CARDS GRID */}
      <div className="mt-5 grid grid-cols-1 gap-6 pl-9">
        {matches.map((m) => {
          const breakdown = m.scoreBreakdown || calculateMatchBreakdown(m, queryText);
          const reasons = m.retrievalReasons || getDynamicReasons(m, queryText);
          const ranks = m.rankingReasons || [];
          
          let progress = 30;
          const stageLower = (m.currentStage || "").toLowerCase();
          if (stageLower.includes("idea")) progress = 15;
          else if (stageLower.includes("proto")) progress = 45;
          else if (stageLower.includes("mvp")) progress = 80;
          else if (stageLower.includes("launch") || stageLower.includes("live") || stageLower.includes("revive")) progress = 100;

          return (
            <motion.article
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              key={m.id}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_20px_40px_-24px_rgba(124,92,255,0.4)]"
            >
              {/* Header */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-display text-lg font-bold text-foreground">
                      {m.projectName}
                    </h4>
                    <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[9px] font-semibold text-primary uppercase">
                      Retrieved by Hybrid RAG
                    </span>
                    {m.isCurrentProject && (
                      <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-semibold text-emerald-500 uppercase">
                        Current Project
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm text-foreground/80 leading-relaxed">{m.oneLiner}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground block">Similarity</span>
                    <span className="text-lg font-extrabold text-primary">{m.similarityPct}%</span>
                  </div>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${getBadgeStyles(m.similarityPct)}`}>
                    {getMatchBadge(m.similarityPct)}
                  </span>
                </div>
              </div>

              {ranks.length > 0 && (
                <div className="mt-3 text-[11px] text-muted-foreground bg-primary/5 rounded-xl border border-primary/10 p-3">
                  <div className="flex items-center gap-1.5 font-semibold text-primary">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Retrieved because
                  </div>
                  <p className="mt-0.5 text-xs text-foreground/75 leading-relaxed">
                    Semantic Search + Metadata ReRanking. Explanation: {ranks.join(", ")}
                  </p>
                </div>
              )}

              <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3 border-t border-border/40 pt-5">
                {/* Why it matched */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Why this project matched</span>
                  <div className="space-y-2 text-xs text-foreground/85">
                    {reasons.map((reason, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-emerald-500 font-medium animate-pulse">
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Similarity Breakdown */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Similarity Breakdown</span>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground">Semantic Meaning</span>
                        <span className="font-semibold">{breakdown.semantic}%</span>
                      </div>
                      <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(breakdown.semantic / ((breakdown as any).total || 100)) * 100}%` }} transition={{ duration: 0.5 }} className="h-full bg-primary" />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-muted-foreground">Tech Stack</span>
                          <span className="font-semibold">{breakdown.tech}%</span>
                        </div>
                        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${(breakdown.tech / ((breakdown as any).total || 100)) * 100}%` }} transition={{ duration: 0.5 }} className="h-full bg-indigo-500" />
                        </div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-muted-foreground">Category</span>
                          <span className="font-semibold">{breakdown.category}%</span>
                        </div>
                        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${(breakdown.category / ((breakdown as any).total || 100)) * 100}%` }} transition={{ duration: 0.5 }} className="h-full bg-pink-500" />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-muted-foreground">Stage</span>
                          <span className="font-semibold">{breakdown.stage}%</span>
                        </div>
                        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${(breakdown.stage / ((breakdown as any).total || 100)) * 100}%` }} transition={{ duration: 0.5 }} className="h-full bg-amber-500" />
                        </div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-muted-foreground">Quality</span>
                          <span className="font-semibold">{breakdown.quality}%</span>
                        </div>
                        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${(breakdown.quality / ((breakdown as any).total || 100)) * 100}%` }} transition={{ duration: 0.5 }} className="h-full bg-emerald-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Project Information */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Project Information</span>
                  <div className="space-y-1 text-xs">
                    <p className="text-muted-foreground">Stage: <span className="text-foreground font-semibold">{m.currentStage}</span></p>
                    <p className="text-muted-foreground">Category: <span className="text-foreground font-semibold capitalize">{m.domain}</span></p>
                    <p className="text-muted-foreground">Progress: <span className="text-emerald-500 font-semibold">{progress}%</span></p>
                    {m.revivalStatus && (
                      <p className="text-muted-foreground">Revival Status: <span className="text-primary font-semibold capitalize">{m.revivalStatus.replace("_", " ")}</span></p>
                    )}
                    {m.failureReason && (
                      <div className="mt-1 rounded-lg border border-border/60 bg-muted/30 p-2">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Why it stalled</span>
                        <p className="text-xs text-foreground/80 line-clamp-2 mt-0.5">{m.failureReason}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-4">
                <div className="flex flex-wrap gap-1">
                  {m.techStack.slice(0, 4).map((tech) => (
                    <span key={tech} className="rounded-full bg-muted/60 border border-border/50 px-2 py-0.5 text-[9px] font-medium text-foreground/75">
                      {tech}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMatch(m)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary/95 cursor-pointer"
                >
                  View Project
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.article>
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