import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { TopBar } from "@/components/dashboard/top-bar";
import { DomainDonut } from "@/components/dashboard/insights/domain-donut";
import { TeamVsStageBar } from "@/components/dashboard/insights/team-vs-stage-bar";
import { TechStackBar } from "@/components/dashboard/insights/tech-stack-bar";
import { WhyDiedBar } from "@/components/dashboard/insights/why-died-bar";
import { summaryStats } from "@/lib/drafts-insights";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchMyDrafts, updateDraftInsights, type Draft } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { UserInsights } from "@/pages/UserInsights";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Insights · DraftYard" },
      {
        name: "description",
        content: "Patterns across abandoned drafts — domains, tech stacks, team sizes, and why projects die.",
      },
    ],
  }),
  component: InsightsPage,
});

function InsightsPage() {
  const { user, isLoading } = useAuth();

  // Show loading state while user data is being fetched
  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background text-foreground">
          <AppSidebar />
          <SidebarInset className="flex min-w-0 flex-1 flex-col items-center justify-center">
            <div className="text-muted-foreground">Loading...</div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  // Route to appropriate insights page based on user role
  if (user?.role === "user") {
    return <UserInsights />;
  }

  // Default to admin insights (for admin role or no role specified)
  return <Insights />;
}

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

function Insights() {
  const stats = summaryStats();
  const [showModal, setShowModal] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const [dummyDraft, setDummyDraft] = useState<Draft>({
    projectName: "Current Project",
    oneLiner: "Project information",
    domain: "general",
    techStack: [],
    teamSize: "1-3",
    currentStage: "idea",
    failureReason: "unknown",
    timeSpent: { value: 0, unit: "weeks" },
    isAnonymous: false,
  });

  // Load first draft on mount
  useEffect(() => {
    console.log("Insights page mounted");
    const loadDrafts = async () => {
      try {
        const data = await fetchMyDrafts();
        if (data.length > 0) {
          setDummyDraft(data[0]);
        }
      } catch (err) {
        console.error("Failed to load drafts:", err);
      }
    };
    loadDrafts();
  }, []);

  const handleModalClose = () => {
    setShowModal(false);
    setShowBanner(true);
  };

  console.log("Rendering Insights modal");
  console.log("Modal open state:", showModal);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AppSidebar />
        <SidebarInset className="flex min-w-0 flex-1 flex-col">
          {showBanner && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center justify-between gap-3 border-b border-amber-500/30 bg-amber-500/5 px-4 py-3 sm:px-6"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                <p className="text-sm text-amber-700 dark:text-amber-200">
                  Complete project information to unlock accurate insights.
                </p>
              </div>
              <button
                onClick={() => setShowBanner(false)}
                className="text-amber-600 hover:text-amber-700 dark:text-amber-300 dark:hover:text-amber-200"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <TopBar />
          </motion.div>

          <motion.main
            className="flex-1 space-y-6 p-4 sm:p-6"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }}
          >
            <motion.div variants={fadeUp} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
              <h1 className="font-display text-2xl font-semibold tracking-tight">Insights</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Patterns learned from {stats.total} shelved drafts on DraftYard.
              </p>
            </motion.div>

            <motion.div
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
              variants={fadeUp}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <StatCard label="Total drafts" value={stats.total.toString()} />
              <StatCard label="Open for revival" value={`${stats.revivalPct}%`} />
              <StatCard label="Top domain" value={stats.topDomain} capitalize />
              <StatCard label="Avg. time invested" value={`${stats.avgWeeks} wks`} />
            </motion.div>

            <motion.div
              className="grid gap-6 lg:grid-cols-2"
              variants={fadeUp}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <DomainDonut />
              <WhyDiedBar />
              <TechStackBar />
              <TeamVsStageBar />
            </motion.div>
          </motion.main>

          {/* Insights Data Collection Modal - Always Rendered */}
          <InsightsDataCollectionModal
            draft={dummyDraft}
            open={showModal}
            onOpenChange={(open) => {
              if (!open) handleModalClose();
              else setShowModal(open);
            }}
            onSuccess={() => {
              setShowModal(false);
              setShowBanner(false);
              toast.success("Project information saved!");
            }}
          />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function StatCard({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all duration-[220ms] hover:shadow-md hover:-translate-y-0.5">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className={`mt-1.5 font-display text-2xl font-semibold tracking-tight ${capitalize ? "capitalize" : ""}`}>
        {value}
      </div>
    </div>
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
