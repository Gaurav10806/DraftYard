import { motion } from "framer-motion";
import { TrendingUp, AlertTriangle, Target, Zap, Repeat2, Lightbulb, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { TopBar } from "@/components/dashboard/top-bar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchUserInsights, type UserInsightsData, fetchMyDrafts, updateDraftInsights, type Draft } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

export function UserInsights() {
  const [insights, setInsights] = useState<UserInsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const [dummyDraft, setDummyDraft] = useState<Draft>({
    _id: "temp-user-insights",
    projectName: "Project Insights",
    description: "",
    status: "abandoned",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const handleModalClose = () => {
    setShowModal(false);
    localStorage.setItem("insights-data-collected", "true");
    setShowBanner(true);
  };

  useEffect(() => {
    const loadInsights = async () => {
      try {
        setLoading(true);
        const data = await fetchUserInsights();
        setInsights(data);
      } catch (err) {
        console.error("Failed to load user insights:", err);
        toast.error("Failed to load insights");
      } finally {
        setLoading(false);
      }
    };

    loadInsights();
  }, []);

  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background text-foreground">
          <AppSidebar />
          <SidebarInset className="flex min-w-0 flex-1 flex-col items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  if (!insights) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background text-foreground">
          <AppSidebar />
          <SidebarInset className="flex min-w-0 flex-1 flex-col items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">Unable to load insights</p>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AppSidebar />
        <SidebarInset className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <motion.main
            className="flex-1 space-y-6 p-4 sm:p-6"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }}
          >
            {/* Page Header */}
            <motion.div variants={fadeUp} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
              <h1 className="font-display text-2xl font-semibold tracking-tight">Your Insights</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Analytics about your {insights.totalDrafts} draft{insights.totalDrafts !== 1 ? "s" : ""} and project patterns.
              </p>
            </motion.div>

            {/* Analytics Cards Grid */}
            <motion.div
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              variants={fadeUp}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <DraftHealthScoreCard healthScore={insights.healthScore} />
              <StallRiskCard stallRisk={insights.stallRisk} />
              <CompletionProbabilityCard probability={insights.completionProbability} />
              <TopImprovementCard improvements={insights.improvements} />
              <SimilarProjectsCard similarProjects={insights.similarProjects} />
              <RevivalPotentialCard revivalPotential={insights.revivalPotential} />
            </motion.div>
          </motion.main>
        </SidebarInset>
      </div>

      {/* Insights Data Collection Modal */}
      <InsightsDataCollectionModal
        draft={dummyDraft}
        open={showModal}
        onOpenChange={(open) => {
          if (!open) handleModalClose();
          else setShowModal(open);
        }}
        onSuccess={() => {
          setShowModal(false);
          localStorage.setItem("insights-data-collected", "true");
          setShowBanner(false);
          toast.success("Project information saved!");
        }}
      />
    </SidebarProvider>
  );
}

// ————————————————————————————————————————————————————————————
// Card 1: Draft Health Score
// ————————————————————————————————————————————————————————————
function DraftHealthScoreCard({ healthScore }: { healthScore: number }) {
  const healthStatus = healthScore >= 80 ? "Excellent" : healthScore >= 60 ? "Good" : "Needs attention";
  const healthColor = healthScore >= 80 ? "text-emerald-500" : healthScore >= 60 ? "text-blue-500" : "text-amber-500";

  return (
    <Card className="rounded-2xl border-border/60 bg-card shadow-sm transition-all duration-[220ms] hover:shadow-md hover:-translate-y-0.5">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="font-display text-base font-semibold">Draft Health Score</CardTitle>
            <CardDescription className="text-xs">Overall project vitality</CardDescription>
          </div>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-3">
          <span className={`font-display text-4xl font-bold ${healthColor}`}>{healthScore}</span>
          <span className="text-sm text-muted-foreground mb-1">/100</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Status</span>
            <span className={`font-medium ${healthColor}`}>{healthStatus}</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${healthScore}%` }}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground pt-2">
          Based on project completion rate and momentum.
        </p>
      </CardContent>
    </Card>
  );
}

// ————————————————————————————————————————————————————————————
// Card 2: Stall Risk
// ————————————————————————————————————————————————————————————
function StallRiskCard({ stallRisk }: { stallRisk: number }) {
  const riskLevel = stallRisk >= 70 ? "Critical" : stallRisk >= 50 ? "Moderate" : "Low";
  const riskColor = stallRisk >= 70 ? "text-red-500" : stallRisk >= 50 ? "text-amber-500" : "text-emerald-500";

  return (
    <Card className="rounded-2xl border-border/60 bg-card shadow-sm transition-all duration-[220ms] hover:shadow-md hover:-translate-y-0.5">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="font-display text-base font-semibold">Stall Risk</CardTitle>
            <CardDescription className="text-xs">Probability of project stalling</CardDescription>
          </div>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-3">
          <span className={`font-display text-4xl font-bold ${riskColor}`}>{stallRisk}</span>
          <span className="text-sm text-muted-foreground mb-1">%</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Risk Level</span>
            <span className={`font-medium ${riskColor}`}>{riskLevel}</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-red-500 transition-all duration-500"
              style={{ width: `${stallRisk}%` }}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground pt-2">
          Factors: inactivity, declining commits, team size.
        </p>
      </CardContent>
    </Card>
  );
}

// ————————————————————————————————————————————————————————————
// Card 3: Completion Probability
// ————————————————————————————————————————————————————————————
function CompletionProbabilityCard({ probability }: { probability: number }) {
  const probabilityStatus =
    probability >= 75 ? "Very likely" : probability >= 50 ? "Moderately likely" : "Unlikely";
  const probColor =
    probability >= 75 ? "text-emerald-500" : probability >= 50 ? "text-blue-500" : "text-amber-500";

  return (
    <Card className="rounded-2xl border-border/60 bg-card shadow-sm transition-all duration-[220ms] hover:shadow-md hover:-translate-y-0.5">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="font-display text-base font-semibold">Completion Probability</CardTitle>
            <CardDescription className="text-xs">Likelihood of project success</CardDescription>
          </div>
          <Target className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-3">
          <span className={`font-display text-4xl font-bold ${probColor}`}>{probability}</span>
          <span className="text-sm text-muted-foreground mb-1">%</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Outlook</span>
            <span className={`font-medium ${probColor}`}>{probabilityStatus}</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${probability}%` }}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground pt-2">
          Based on similar projects and your track record.
        </p>
      </CardContent>
    </Card>
  );
}

// ————————————————————————————————————————————————————————————
// Card 4: Top Improvement
// ————————————————————————————————————————————————————————————
interface Improvement {
  label: string;
  impact: string;
  description: string;
}

function TopImprovementCard({ improvements }: { improvements: Improvement[] }) {
  return (
    <Card className="rounded-2xl border-border/60 bg-card shadow-sm transition-all duration-[220ms] hover:shadow-md hover:-translate-y-0.5">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="font-display text-base font-semibold">Top Improvement</CardTitle>
            <CardDescription className="text-xs">Suggestions for your projects</CardDescription>
          </div>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.isArray(improvements) && improvements.map((item, idx) => (
          <div key={idx} className="p-3 rounded-lg bg-secondary/40 border border-border/40">
            <div className="flex items-start justify-between mb-1">
              <span className="text-xs font-semibold text-foreground">{item.label}</span>
              <span
                className={`text-xs font-medium ${
                  item.impact === "High" ? "text-emerald-500" : "text-blue-500"
                }`}
              >
                {item.impact} impact
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{item.description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ————————————————————————————————————————————————————————————
// Card 5: Similar Projects
// ————————————————————————————————————————————————————————————
interface SimilarProject {
  name: string;
  success: boolean;
  timeToCompletion?: string;
  reason?: string;
}

function SimilarProjectsCard({ similarProjects }: { similarProjects: SimilarProject[] }) {
  return (
    <Card className="rounded-2xl border-border/60 bg-card shadow-sm transition-all duration-[220ms] hover:shadow-md hover:-translate-y-0.5">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="font-display text-base font-semibold">Similar Projects</CardTitle>
            <CardDescription className="text-xs">Projects like yours in the community</CardDescription>
          </div>
          <Repeat2 className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {Array.isArray(similarProjects) && similarProjects.map((project, idx) => (
          <div key={idx} className="flex items-start gap-2 pb-2 border-b border-border/30 last:pb-0 last:border-0">
            <div className="mt-0.5">
              {project.success ? (
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
              ) : (
                <div className="h-2 w-2 rounded-full bg-red-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground">{project.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {project.success ? `✓ Completed in ${project.timeToCompletion}` : `✗ Failed: ${project.reason}`}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ————————————————————————————————————————————————————————————
// Card 6: Revival Potential
// ————————————————————————————————————————————————————————————
function RevivalPotentialCard({ revivalPotential }: { revivalPotential: number }) {
  const revivalStatus = revivalPotential >= 80 ? "Highly Revivable" : revivalPotential >= 60 ? "Potentially Revivable" : "Low Potential";
  const revivalColor = revivalPotential >= 80 ? "text-emerald-500" : revivalPotential >= 60 ? "text-violet-500" : "text-slate-500";

  return (
    <Card className="rounded-2xl border-border/60 bg-card shadow-sm transition-all duration-[220ms] hover:shadow-md hover:-translate-y-0.5">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="font-display text-base font-semibold">Revival Potential</CardTitle>
            <CardDescription className="text-xs">Can your draft be salvaged?</CardDescription>
          </div>
          <Lightbulb className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-3">
          <span className={`font-display text-4xl font-bold ${revivalColor}`}>{revivalPotential}</span>
          <span className="text-sm text-muted-foreground mb-1">/100</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Status</span>
            <span className={`font-medium ${revivalColor}`}>{revivalStatus}</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-slate-500 to-violet-500 transition-all duration-500"
              style={{ width: `${revivalPotential}%` }}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground pt-2">
          Salvageable code, learnings worth sharing.
        </p>
      </CardContent>
    </Card>
  );
}


// ————————————————————————————————————————————————————————————
// Insights Data Collection Modal
// ————————————————————————————————————————————————————————————
interface InsightsDataCollectionModalProps {
  draft: Draft;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function InsightsDataCollectionModal({
  draft,
  open,
  onOpenChange,
  onSuccess,
}: InsightsDataCollectionModalProps) {
  const [failureReason, setFailureReason] = useState(draft.failureReason || "");
  const [developmentMethodology, setDevelopmentMethodology] = useState(draft.developmentMethodology || "");
  const [timeValue, setTimeValue] = useState(draft.timeSpent?.value.toString() || "");
  const [timeUnit, setTimeUnit] = useState(draft.timeSpent?.unit || "weeks");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!failureReason.trim() || !developmentMethodology || !timeValue) {
      toast.error("Please fill in all fields");
      return;
    }

    setSubmitting(true);
    try {
      if (!draft._id) throw new Error("Draft ID not found");

      await updateDraftInsights(draft._id, {
        failureReason: failureReason.trim(),
        developmentMethodology,
        timeSpent: { value: parseInt(timeValue, 10), unit: timeUnit },
      });

      onSuccess();
    } catch (err) {
      console.error("Failed to update insights:", err);
      toast.error(err instanceof Error ? err.message : "Failed to save project information");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border/60 bg-card/95 backdrop-blur-xl sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-semibold">Complete Project Information</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Help us understand what happened with {draft.projectName}. This will unlock accurate insights.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Failure Reason */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Why did the project fail?</label>
            <Textarea
              placeholder="e.g., Team lost interest, lack of time, technical challenges..."
              value={failureReason}
              onChange={(e) => setFailureReason(e.target.value)}
              className="min-h-20 rounded-lg border border-border/60 bg-background/50 text-sm"
            />
          </div>

          {/* Development Methodology */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Development methodology</label>
            <Select value={developmentMethodology} onValueChange={setDevelopmentMethodology}>
              <SelectTrigger className="rounded-lg border border-border/60 bg-background/50">
                <SelectValue placeholder="Select methodology" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="agile">Agile</SelectItem>
                <SelectItem value="waterfall">Waterfall</SelectItem>
                <SelectItem value="scrum">Scrum</SelectItem>
                <SelectItem value="kanban">Kanban</SelectItem>
                <SelectItem value="lean">Lean</SelectItem>
                <SelectItem value="none">None / Informal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Time Spent */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Time spent on project</label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Value"
                value={timeValue}
                onChange={(e) => setTimeValue(e.target.value)}
                className="rounded-lg border border-border/60 bg-background/50"
                min="1"
              />
              <Select value={timeUnit} onValueChange={setTimeUnit}>
                <SelectTrigger className="w-32 rounded-lg border border-border/60 bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="days">Days</SelectItem>
                  <SelectItem value="weeks">Weeks</SelectItem>
                  <SelectItem value="months">Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-lg"
            disabled={submitting}
          >
            Skip for now
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:from-violet-600 hover:to-fuchsia-600"
            disabled={submitting}
          >
            {submitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
