import { motion } from "framer-motion";
import {
  TrendingUp,
  AlertTriangle,
  Target,
  Zap,
  Repeat2,
  Lightbulb,
  Loader2,
  Plus,
  Hand,
  Sparkles,
  BarChart3,
  Layers,
  Code2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { TopBar } from "@/components/dashboard/top-bar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { fetchUserInsights, type UserInsightsData } from "@/lib/api";
import { toast } from "sonner";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

export function UserInsights() {
  const { data: insights = null, isLoading: loading } = useQuery({
    queryKey: ["user-insights"],
    queryFn: fetchUserInsights,
  });

  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background text-foreground">
          <AppSidebar />
          <SidebarInset className="flex min-w-0 flex-1 flex-col items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
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

  const isZeroState = insights.totalDrafts === 0;

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
            <motion.div variants={fadeUp} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl font-semibold tracking-tight">Your Insights</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Real analytics across your {insights.totalDrafts} project draft{insights.totalDrafts !== 1 ? "s" : ""} and community benchmarks.
                </p>
              </div>
              <Link to="/new-draft">
                <Button className="gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-sm hover:brightness-110">
                  <Plus className="h-4 w-4" /> Create New Draft
                </Button>
              </Link>
            </motion.div>

            {/* Zero State Callout Banner */}
            {isZeroState && (
              <motion.div
                variants={fadeUp}
                className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-card to-card p-6 shadow-sm"
              >
                <div className="relative z-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <h2 className="text-base font-semibold">No Drafts Analyzed Yet</h2>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground max-w-xl">
                      Submit your first abandoned startup idea or project draft. Our AI analytics engine will calculate real vitality scores, stall risk factors, and connect you with interested community revival partners.
                    </p>
                  </div>
                  <Link to="/new-draft">
                    <Button size="sm" className="gap-2 rounded-lg bg-primary text-primary-foreground font-medium">
                      <Plus className="h-3.5 w-3.5" /> Submit First Draft
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}

            {/* Summary Stat Strip */}
            <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile
                icon={<BarChart3 className="h-4 w-4 text-violet-500" />}
                label="Total Projects"
                value={insights.totalDrafts.toString()}
              />
              <StatTile
                icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
                label="Upvotes Earned"
                value={(insights.totalUpvotes ?? 0).toString()}
              />
              <StatTile
                icon={<Hand className="h-4 w-4 text-fuchsia-500" />}
                label="Join Requests"
                value={(insights.totalRaisedHands ?? 0).toString()}
              />
              <StatTile
                icon={<Layers className="h-4 w-4 text-sky-500" />}
                label="Top Domain"
                value={insights.topDomain || "General"}
              />
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
    </SidebarProvider>
  );
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted/60">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-display text-xl font-bold">{value}</div>
        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</div>
      </div>
    </div>
  );
}

// ————————————————————————————————————————————————————————————
// Card 1: Draft Health Score
// ————————————————————————————————————————————————————————————
function DraftHealthScoreCard({ healthScore }: { healthScore: number }) {
  const healthStatus = healthScore >= 80 ? "Excellent Vitality" : healthScore >= 50 ? "Moderate Progress" : "Needs Attention";
  const healthColor = healthScore >= 80 ? "text-emerald-500" : healthScore >= 50 ? "text-blue-500" : "text-amber-500";

  return (
    <Card className="rounded-2xl border-border/60 bg-card shadow-sm transition-all duration-[220ms] hover:shadow-md hover:-translate-y-0.5">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="font-display text-base font-semibold">Draft Health Score</CardTitle>
            <CardDescription className="text-xs">Overall project vitality index</CardDescription>
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
          Calculated from real project completion rate, engagement, and upvote momentum.
        </p>
      </CardContent>
    </Card>
  );
}

// ————————————————————————————————————————————————————————————
// Card 2: Stall Risk
// ————————————————————————————————————————————————————————————
function StallRiskCard({ stallRisk }: { stallRisk: number }) {
  const riskLevel = stallRisk >= 70 ? "Critical Risk" : stallRisk >= 40 ? "Moderate Inactivity" : "Low Risk";
  const riskColor = stallRisk >= 70 ? "text-rose-500" : stallRisk >= 40 ? "text-amber-500" : "text-emerald-500";

  return (
    <Card className="rounded-2xl border-border/60 bg-card shadow-sm transition-all duration-[220ms] hover:shadow-md hover:-translate-y-0.5">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="font-display text-base font-semibold">Stall Risk Factor</CardTitle>
            <CardDescription className="text-xs">Inactivity probability analysis</CardDescription>
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
              className="h-full bg-gradient-to-r from-emerald-500 to-rose-500 transition-all duration-500"
              style={{ width: `${stallRisk}%` }}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground pt-2">
          Evaluates days inactive, commit frequency, and team availability.
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
    probability >= 75 ? "High Success Rate" : probability >= 45 ? "Moderately Likely" : "Under Developed";
  const probColor =
    probability >= 75 ? "text-emerald-500" : probability >= 45 ? "text-blue-500" : "text-amber-500";

  return (
    <Card className="rounded-2xl border-border/60 bg-card shadow-sm transition-all duration-[220ms] hover:shadow-md hover:-translate-y-0.5">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="font-display text-base font-semibold">Completion Probability</CardTitle>
            <CardDescription className="text-xs">Likelihood of reaching launch</CardDescription>
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
          Weighted by your project stage progress and community benchmarks.
        </p>
      </CardContent>
    </Card>
  );
}

// ————————————————————————————————————————————————————————————
// Card 4: Top Improvements
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
            <CardTitle className="font-display text-base font-semibold">Actionable Recommendations</CardTitle>
            <CardDescription className="text-xs">AI suggestions for project growth</CardDescription>
          </div>
          <Zap className="h-4 w-4 text-amber-500" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.isArray(improvements) && improvements.map((item, idx) => (
          <div key={idx} className="p-3 rounded-xl bg-muted/40 border border-border/40">
            <div className="flex items-start justify-between mb-1">
              <span className="text-xs font-semibold text-foreground">{item.label}</span>
              <Badge
                variant="outline"
                className={`text-[10px] ${
                  item.impact === "High" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                }`}
              >
                {item.impact} impact
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ————————————————————————————————————————————————————————————
// Card 5: Similar Community Projects
// ————————————————————————————————————————————————————————————
interface SimilarProject {
  name: string;
  domain?: string;
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
            <CardTitle className="font-display text-base font-semibold">Similar Community Drafts</CardTitle>
            <CardDescription className="text-xs">Real database matches from community</CardDescription>
          </div>
          <Repeat2 className="h-4 w-4 text-violet-500" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {Array.isArray(similarProjects) && similarProjects.map((project, idx) => (
          <div key={idx} className="flex items-start gap-2.5 pb-2.5 border-b border-border/40 last:pb-0 last:border-0">
            <div className="mt-1">
              {project.success ? (
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
              ) : (
                <div className="h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-rose-500/20" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className="text-xs font-semibold text-foreground truncate">{project.name}</p>
                {project.domain && (
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {project.domain}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {project.success ? `✓ Completed in ${project.timeToCompletion}` : `✗ Stalled: ${project.reason}`}
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
  const revivalStatus = revivalPotential >= 75 ? "High Revival Demand" : revivalPotential >= 50 ? "Potentially Revivable" : "Moderate Interest";
  const revivalColor = revivalPotential >= 75 ? "text-emerald-500" : revivalPotential >= 50 ? "text-violet-500" : "text-slate-500";

  return (
    <Card className="rounded-2xl border-border/60 bg-card shadow-sm transition-all duration-[220ms] hover:shadow-md hover:-translate-y-0.5">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="font-display text-base font-semibold">Community Revival Score</CardTitle>
            <CardDescription className="text-xs">Community interest & collaboration score</CardDescription>
          </div>
          <Lightbulb className="h-4 w-4 text-fuchsia-500" />
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
              className="h-full bg-gradient-to-r from-slate-500 to-fuchsia-500 transition-all duration-500"
              style={{ width: `${revivalPotential}%` }}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground pt-2">
          Driven by community raised hands, upvotes, and tech stack clarity.
        </p>
      </CardContent>
    </Card>
  );
}
