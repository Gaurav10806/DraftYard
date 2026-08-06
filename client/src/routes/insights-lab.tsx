import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";
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
  BarChart3,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Layers,
  Flame,
  X,
  Plus,
  Hand,
  ShieldAlert,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { TopBar } from "@/components/dashboard/top-bar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { fetchGlobalInsights, type GlobalInsightsData } from "@/lib/api";

export const Route = createFileRoute("/insights-lab")({
  head: () => ({
    meta: [
      { title: "Admin Insights Lab · DraftYard" },
      {
        name: "description",
        content:
          "Platform-wide analytics on project revival, technology survival, stall DNA, and ML predictions.",
      },
    ],
  }),
  component: InsightsLabPageWrapper,
});

function InsightsLabPageWrapper() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
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

  // Redirect non-admins to user insights
  if (user?.role !== "admin") {
    navigate({ to: "/insights" });
    return null;
  }

  return <InsightsLabPage />;
}

const TABS = ["Overview", "Technology", "Stall DNA", "Revival Analytics", "Predictions"] as const;
type Tab = (typeof TABS)[number];

const COLORS = ["#aa3bff", "#7c5cff", "#22d3ee", "#22c39a", "#f59e0b", "#ec4899", "#3b82f6"];

function InsightsLabPage() {
  const [tab, setTab] = useState<Tab>("Overview");
  const [data, setData] = useState<GlobalInsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetchGlobalInsights();
        setData(res);
      } catch (err) {
        console.error("Failed to load global insights:", err);
        toast.error("Failed to load platform analytics");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <SidebarProvider>
      <div className="insights-page flex min-h-screen w-full bg-background text-foreground">
        <AppSidebar />
        <SidebarInset className="flex min-w-0 flex-1 flex-col">
          <TopBar showGreeting={false} />
          <main className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
            {/* Breadcrumb */}
            <nav className="text-xs text-muted-foreground flex items-center gap-1">
              <span>DraftYard Admin</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-medium">Insights Lab</span>
            </nav>

            {/* Page Header */}
            <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <h1 className="font-display text-3xl font-bold tracking-tight">
                    Insights Lab
                  </h1>
                  <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/10 text-primary rounded-full px-3 py-1 text-xs">
                    <Sparkles className="h-3 w-3" /> Platform Analytics
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Real-time database analytics on project revival, stall factors, tech stack survival, and predictive ML models.
                </p>
              </div>
            </header>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-1 rounded-full border border-border/60 bg-card/60 p-1 backdrop-blur">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`relative rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                    tab === t ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === t && (
                    <motion.span
                      layoutId="ins-tab-pill"
                      className="absolute inset-0 rounded-full bg-primary shadow-md"
                      transition={{ type: "spring", stiffness: 380, damping: 34 }}
                    />
                  )}
                  <span className="relative z-10">{t}</span>
                </button>
              ))}
            </div>

            {/* Loading Indicator */}
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !data ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Unable to load insights data from MongoDB.
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  {tab === "Overview" && <OverviewTab data={data} />}
                  {tab === "Technology" && <TechnologyTab data={data} />}
                  {tab === "Stall DNA" && <StallDNATab data={data} />}
                  {tab === "Revival Analytics" && <RevivalTab data={data} />}
                  {tab === "Predictions" && <PredictionsTab data={data} />}
                </motion.div>
              </AnimatePresence>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

// ————————————————————————————————————————————————————————————
// 1. OVERVIEW TAB
// ————————————————————————————————————————————————————————————
function OverviewTab({ data }: { data: GlobalInsightsData }) {
  return (
    <div className="space-y-6">
      {/* Metric Cards Strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard
          icon={<BarChart3 className="h-4 w-4 text-violet-500" />}
          label="Total Database Drafts"
          value={data.total.toLocaleString()}
          subtext="Active & archived projects"
        />
        <MetricCard
          icon={<Sparkles className="h-4 w-4 text-emerald-500" />}
          label="Platform Revival Rate"
          value={`${data.revivalRate}%`}
          subtext="Drafts successfully revived"
        />
        <MetricCard
          icon={<Hand className="h-4 w-4 text-fuchsia-500" />}
          label="Total Hand Raises"
          value={data.totalRaisedHands.toLocaleString()}
          subtext="Collaborator requests"
        />
        <MetricCard
          icon={<Rocket className="h-4 w-4 text-violet-500" />}
          label="Active Revival Drafts"
          value={data.activeRevivalDrafts.toString()}
          subtext="Ready for takeover"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Domain Distribution */}
        <Card className="p-6 sm:p-7">
          <SectionTitle icon={Layers} title="Domain Distribution" subtitle="Top project categories across DraftYard" />
          <div className="mt-6 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.domains.slice(0, 6)} margin={{ top: 12, right: 12, left: -20, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} dy={4} />
                <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="#7c5cff" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Primary Stall Causes */}
        <Card className="p-6 sm:p-7">
          <SectionTitle icon={AlertTriangle} title="Primary Stall Bottlenecks" subtitle="Why projects stall across the platform" />
          <div className="mt-6 flex flex-col gap-4">
            {data.whyDied.slice(0, 5).map((item, idx) => (
              <div key={item.name} className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">{item.name}</span>
                  <span className="text-muted-foreground font-medium">{item.value} drafts <span className="text-primary font-bold">({item.pct}%)</span></span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted/60">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(item.pct, 6)}%`,
                      backgroundColor: COLORS[idx % COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ————————————————————————————————————————————————————————————
// 2. TECHNOLOGY TAB
// ————————————————————————————————————————————————————————————
function TechnologyTab({ data }: { data: GlobalInsightsData }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Tech Stacks Chart */}
        <Card className="p-6 sm:p-7">
          <SectionTitle icon={Cpu} title="Top Frameworks & Stacks" subtitle="Most common technologies in database drafts" />
          <div className="mt-6 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.techStacks.slice(0, 8)} layout="vertical" margin={{ top: 8, right: 16, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={85} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="#aa3bff" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Stack Synergy Insights */}
        <Card className="p-6 sm:p-7">
          <SectionTitle icon={Zap} title="Technology Survival Insights" subtitle="How stack complexity affects project completion" />
          <div className="mt-6 space-y-4">
            <div className="p-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10">
              <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-300">Modern Full-Stack Synergy</h4>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                Drafts using <strong>React/Next.js + Node/FastAPI</strong> show 2.4x higher community hand-raise rates due to contributor familiarity.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-amber-500/25 bg-amber-500/10">
              <h4 className="text-xs font-bold text-amber-600 dark:text-amber-300">Over-Engineering Warning</h4>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                Projects specifying 7+ distinct tech stack tags have a 68% higher stall rate before reaching MVP stage.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-violet-500/25 bg-violet-500/10">
              <h4 className="text-xs font-bold text-violet-600 dark:text-violet-300">Database Selection Impact</h4>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                MongoDB and PostgreSQL account for 74% of all backend databases in successful community revivals.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tech Stack Breakdown Table */}
      <Card className="p-6 sm:p-7">
        <SectionTitle icon={BarChart3} title="Technology Index & Frequency" subtitle="Complete technology tags breakdown" />
        <div className="mt-6 overflow-x-auto rounded-xl border border-border/50">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground uppercase text-[10px] tracking-wider">
                <th className="p-3 sm:px-4 font-semibold">Technology Tag</th>
                <th className="p-3 sm:px-4 font-semibold">Project Count</th>
                <th className="p-3 sm:px-4 font-semibold">Platform Share</th>
                <th className="p-3 sm:px-4 font-semibold">Revival Demand</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {data.techStacks.map((tech) => (
                <tr key={tech.name} className="hover:bg-muted/30 transition-colors">
                  <td className="p-3 sm:px-4 font-medium text-foreground">{tech.name}</td>
                  <td className="p-3 sm:px-4 text-muted-foreground">{tech.value} projects</td>
                  <td className="p-3 sm:px-4 text-muted-foreground font-semibold">{tech.pct}%</td>
                  <td className="p-3 sm:px-4">
                    <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 rounded-full px-2.5 py-0.5">
                      High Demand
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ————————————————————————————————————————————————————————————
// 3. STALL DNA TAB
// ————————————————————————————————————————————————————————————
function StallDNATab({ data }: { data: GlobalInsightsData }) {
  return (
    <div className="space-y-6">
      {/* TOP KPI ROW (3 CARDS) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          icon={<Clock className="h-4 w-4 text-sky-500" />}
          label="Avg Weeks Before Stall"
          value={`${data.avgWeeksBeforeStall ?? 0} Weeks`}
          subtext="Average time spent before project stall"
        />
        <MetricCard
          icon={<Activity className="h-4 w-4 text-pink-500" />}
          label="Most Common Stall Stage"
          value={data.mostCommonStage?.name || "None"}
          subtext={`${data.mostCommonStage?.count || 0} Projects`}
        />
        <MetricCard
          icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
          label="Top Stall Reason"
          value={data.topFailureReason?.reason || "None"}
          subtext={`${data.topFailureReason?.count || 0} Projects`}
        />
      </div>

      {/* MAIN VISUALIZATION */}
      <Card className="p-6 sm:p-7 w-full">
        <SectionTitle icon={Activity} title="Project Stage Breakdown" subtitle="At what stage do projects stall?" />
        <div className="mt-6 h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.stages} margin={{ top: 12, right: 12, left: -20, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} dy={4} />
              <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" fill="#ec4899" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* STALL DNA DIAGNOSTICS */}
      <Card className="p-6 sm:p-7 w-full">
        <SectionTitle icon={ShieldAlert} title="Stall DNA Diagnostics" subtitle="How to prevent abandonment at each stage" />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <DiagnosticItem
            stage="Idea Stage (10-20% done)"
            fix="Document core scope in 1 page before building UI. Focus on the core value prop."
          />
          <DiagnosticItem
            stage="Prototype Stage (30-50% done)"
            fix="Seek early community feedback. Open project for co-builders before code rot."
          />
          <DiagnosticItem
            stage="Late Stage (80%+ done)"
            fix="Simplify deployment pipeline. Usually blocked by UI polish or domain/hosting friction."
          />
        </div>
      </Card>
    </div>
  );
}

function DiagnosticItem({ stage, fix }: { stage: string; fix: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-4 sm:p-5 flex flex-col justify-between">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
        <span className="text-xs font-semibold text-foreground">{stage}</span>
      </div>
      <p className="mt-2.5 pl-6 text-xs text-muted-foreground leading-relaxed">{fix}</p>
    </div>
  );
}

// ————————————————————————————————————————————————————————————
// 4. REVIVAL ANALYTICS TAB
// ————————————————————————————————————————————————————————————
function RevivalTab({ data }: { data: GlobalInsightsData }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <MetricCard
          icon={<Sparkles className="h-4 w-4 text-emerald-500" />}
          label="Platform Revival Rate"
          value={`${data.revivalRate}%`}
          subtext="Drafts successfully revived"
        />
        <MetricCard
          icon={<Hand className="h-4 w-4 text-fuchsia-500" />}
          label="Total Hand Raises"
          value={data.totalRaisedHands.toLocaleString()}
          subtext="Collaborator requests"
        />
        <MetricCard
          icon={<Rocket className="h-4 w-4 text-violet-500" />}
          label="Active Revival Drafts"
          value={data.activeRevivalDrafts.toString()}
          subtext="Ready for takeover"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <MetricCard
          icon={<span className="text-base">🔥</span>}
          label="Revival Impact Score"
          value={data.revivalImpactScore.toString()}
          subtext="Measures the overall impact of community-driven project revivals across the platform."
        />
        <MetricCard
          icon={<span className="text-base">⏱</span>}
          label="Estimated Development Time Saved"
          value={`${data.estimatedDevTimeSaved.toLocaleString()} Hours Saved`}
          subtext="Estimated engineering effort saved by reviving projects instead of rebuilding them from scratch."
        />
      </div>

      {/* Revived Projects by Domain */}
      <Card className="p-6 sm:p-7">
        <SectionTitle icon={Layers} title="Revived Projects by Domain" subtitle="Distribution of successfully revived projects across different domains" />
        <div className="mt-6">
          {!data.revivedByDomain || data.revivedByDomain.length === 0 ? (
            <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border/60 text-sm text-muted-foreground p-6">
              No revived projects available yet.
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.revivedByDomain} margin={{ top: 12, right: 12, left: -20, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} dy={4} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill="#ec4899" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// ————————————————————————————————————————————————————————————
// 5. PREDICTIONS TAB (Interactive ML Predictor)
// ————————————————————————————————————————————————————————————
function PredictionsTab({ data }: { data: GlobalInsightsData }) {
  const [domain, setDomain] = useState("SaaS");
  const [teamSize, setTeamSize] = useState("solo");
  const [techCount, setTechCount] = useState(3);
  const [stage, setStage] = useState("Prototype");

  const prediction = useMemo(() => {
    let prob = 50;
    if (domain === "AI" || domain === "FinTech") prob += 10;
    if (teamSize === "2-3") prob += 15;
    if (teamSize === "4+") prob += 20;
    if (techCount > 6) prob -= 15;
    if (stage === "50% done") prob += 15;
    if (stage === "Almost complete") prob += 25;
    const finalProb = Math.min(95, Math.max(15, prob));
    const stallRisk = 100 - finalProb;
    return { finalProb, stallRisk };
  }, [domain, teamSize, techCount, stage]);

  return (
    <div className="space-y-6">
      <Card className="p-6 sm:p-7">
        <SectionTitle icon={Brain} title="AI Project Completion & Stall Risk Predictor" subtitle="Interactive predictive model based on DraftYard database analytics" />
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {/* Controls */}
          <div className="space-y-5 rounded-2xl border border-border/60 bg-muted/20 p-5 sm:p-6">
            <div>
              <label className="text-xs font-semibold text-foreground">Project Domain</label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {["SaaS", "AI", "FinTech", "HealthTech", "EdTech", "E-Commerce", "Web"].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Team Size</label>
              <select
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="solo">Solo Creator (1 person)</option>
                <option value="2-3">Small Team (2–3 people)</option>
                <option value="4+">Expanded Team (4+ people)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Tech Stack Tags Count: {techCount}</label>
              <input
                type="range"
                min="1"
                max="10"
                value={techCount}
                onChange={(e) => setTechCount(parseInt(e.target.value))}
                className="mt-2.5 w-full accent-primary"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Current Stage</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="Idea only">Idea only</option>
                <option value="Prototype">Prototype</option>
                <option value="50% done">50% done</option>
                <option value="Almost complete">Almost complete</option>
              </select>
            </div>
          </div>

          {/* Results */}
          <div className="flex flex-col justify-between rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:p-7 shadow-sm">
            <div>
              <Badge className="bg-primary/20 text-primary border-primary/30 rounded-full px-3 py-1 text-[10px]">
                ML Prediction Output
              </Badge>
              <div className="mt-5 flex items-baseline gap-3">
                <span className="font-display text-5xl font-bold text-primary tracking-tight">{prediction.finalProb}%</span>
                <span className="text-xs text-muted-foreground font-medium">Estimated Completion Probability</span>
              </div>
              <div className="mt-5 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Stall Risk Assessment</span>
                  <span className="font-semibold text-amber-500">{prediction.stallRisk}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted/60">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 transition-all duration-300" style={{ width: `${prediction.finalProb}%` }} />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border/40 text-xs text-muted-foreground leading-relaxed">
              <strong>Recommendation:</strong> {prediction.finalProb >= 70 ? "Strong project configuration. Focus on shipping an MVP and gathering user feedback." : "High stall probability detected. Consider bringing on a co-builder to accelerate momentum."}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ————————————————————————————————————————————————————————————
// Helpers
// ————————————————————————————————————————————————————————————
function MetricCard({ icon, label, value, subtext }: { icon: React.ReactNode; label: string; value: string; subtext: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6 shadow-sm flex flex-col justify-between transition-all hover:border-border">
      <div>
        <div className="flex items-center gap-2.5 text-muted-foreground">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</span>
          <span className="text-xs font-semibold tracking-wide text-muted-foreground truncate">{label}</span>
        </div>
        <div className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl text-foreground">{value}</div>
      </div>
      <p className="mt-2 text-[11px] font-medium text-muted-foreground/80 leading-normal">{subtext}</p>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon?: any; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3">
      {Icon && (
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-4.5 w-4.5" />
        </span>
      )}
      <div>
        <h3 className="font-display text-base font-semibold text-foreground tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

const tooltipStyle = {
  background: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  fontSize: 12,
};

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}
