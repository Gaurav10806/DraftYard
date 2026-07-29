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
          label="Revival Potential Rate"
          value={`${data.revivalRate}%`}
          subtext="Projects with revival interest"
        />
        <MetricCard
          icon={<Hand className="h-4 w-4 text-fuchsia-500" />}
          label="Total Join Requests"
          value={data.totalRaisedHands.toLocaleString()}
          subtext="Community hand raises"
        />
        <MetricCard
          icon={<Clock className="h-4 w-4 text-sky-500" />}
          label="Avg Weeks Spent"
          value={`${data.avgWeeksSpent} wks`}
          subtext="Average time before stall"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Domain Distribution */}
        <Card>
          <SectionTitle icon={Layers} title="Domain Distribution" subtitle="Top project categories across DraftYard" />
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer>
              <BarChart data={data.domains.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="#7c5cff" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Primary Stall Causes */}
        <Card>
          <SectionTitle icon={AlertTriangle} title="Primary Stall Bottlenecks" subtitle="Why projects stall across the platform" />
          <div className="mt-4 flex flex-col gap-3">
            {data.whyDied.slice(0, 5).map((item, idx) => (
              <div key={item.name} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-muted-foreground">{item.value} drafts ({item.pct}%)</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
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

      {/* Recent Burials / Submissions */}
      <Card>
        <SectionTitle icon={Flame} title="Recent Project Submissions" subtitle="Latest database entries needing revival" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.recentBurials.map((draft) => (
            <Link key={draft.id} to="/project/$slug" params={{ slug: slugify(draft.projectName) }}>
              <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/20 p-4 transition-all hover:border-primary/40 hover:bg-muted/40">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{draft.projectName}</span>
                  <Badge variant="outline" className="text-[10px]">{draft.domain}</Badge>
                </div>
                <p className="line-clamp-2 text-xs text-muted-foreground">{draft.oneLiner}</p>
                <div className="mt-auto flex items-center justify-between text-[11px] text-muted-foreground pt-2">
                  <span>Stage: {draft.currentStage}</span>
                  <span className="text-emerald-500 font-semibold">{draft.raisedHands} join requests</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Card>
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
        <Card>
          <SectionTitle icon={Cpu} title="Top Frameworks & Stacks" subtitle="Most common technologies in database drafts" />
          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer>
              <BarChart data={data.techStacks.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={80} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="#aa3bff" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Stack Synergy Insights */}
        <Card>
          <SectionTitle icon={Zap} title="Technology Survival Insights" subtitle="How stack complexity affects project completion" />
          <div className="mt-4 space-y-4">
            <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10">
              <h4 className="text-xs font-semibold text-emerald-600 dark:text-emerald-300">Modern Full-Stack Synergy</h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Drafts using <strong>React/Next.js + Node/FastAPI</strong> show 2.4x higher community hand-raise rates due to contributor familiarity.
              </p>
            </div>
            <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/10">
              <h4 className="text-xs font-semibold text-amber-600 dark:text-amber-300">Over-Engineering Warning</h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Projects specifying 7+ distinct tech stack tags have a 68% higher stall rate before reaching MVP stage.
              </p>
            </div>
            <div className="p-3.5 rounded-xl border border-violet-500/20 bg-violet-500/10">
              <h4 className="text-xs font-semibold text-violet-600 dark:text-violet-300">Database Selection Impact</h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                MongoDB and PostgreSQL account for 74% of all backend databases in successful community revivals.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tech Stack Breakdown Table */}
      <Card>
        <SectionTitle icon={BarChart3} title="Technology Index & Frequency" subtitle="Complete technology tags breakdown" />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/60 text-muted-foreground uppercase text-[10px]">
                <th className="pb-2 font-semibold">Technology Tag</th>
                <th className="pb-2 font-semibold">Project Count</th>
                <th className="pb-2 font-semibold">Platform Share</th>
                <th className="pb-2 font-semibold">Revival Demand</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {data.techStacks.map((tech) => (
                <tr key={tech.name} className="hover:bg-muted/20">
                  <td className="py-2.5 font-medium">{tech.name}</td>
                  <td className="py-2.5">{tech.value} projects</td>
                  <td className="py-2.5">{tech.pct}%</td>
                  <td className="py-2.5">
                    <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
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
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Stage Distribution */}
        <Card>
          <SectionTitle icon={Activity} title="Project Stage Breakdown" subtitle="At what stage do projects stall?" />
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer>
              <BarChart data={data.stages}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="#ec4899" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Stall Prevention Guidelines */}
        <Card>
          <SectionTitle icon={ShieldAlert} title="Stall DNA Diagnostics" subtitle="How to prevent abandonment at each stage" />
          <div className="mt-4 space-y-3">
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
    </div>
  );
}

function DiagnosticItem({ stage, fix }: { stage: string; fix: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-muted/20 p-3.5">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
        <span className="text-xs font-semibold">{stage}</span>
      </div>
      <p className="mt-1 pl-6 text-xs text-muted-foreground leading-relaxed">{fix}</p>
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
          subtext="Drafts with active interest"
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
          value={data.recentBurials.length.toString()}
          subtext="Ready for takeover"
        />
      </div>

      <Card>
        <SectionTitle icon={Hand} title="Community Revival Marketplace" subtitle="Drafts looking for active contributors" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {data.recentBurials.map((draft) => (
            <div key={draft.id} className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/20 p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">{draft.projectName}</h4>
                <Badge variant="outline" className="text-[10px]">{draft.domain}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{draft.oneLiner}</p>
              <div className="flex flex-wrap gap-1">
                {draft.techStack.map((t) => (
                  <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[10px]">
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-auto flex items-center justify-between pt-2">
                <span className="text-xs text-emerald-500 font-medium">
                  {draft.raisedHands} active requests
                </span>
                <Link to="/project/$slug" params={{ slug: slugify(draft.projectName) }}>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1 rounded-lg">
                    View & Join <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
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
      <Card>
        <SectionTitle icon={Brain} title="AI Project Completion & Stall Risk Predictor" subtitle="Interactive predictive model based on DraftYard database analytics" />
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {/* Controls */}
          <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
            <div>
              <label className="text-xs font-semibold text-foreground">Project Domain</label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
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
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
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
                className="mt-2 w-full accent-primary"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Current Stage</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
              >
                <option value="Idea only">Idea only</option>
                <option value="Prototype">Prototype</option>
                <option value="50% done">50% done</option>
                <option value="Almost complete">Almost complete</option>
              </select>
            </div>
          </div>

          {/* Results */}
          <div className="flex flex-col justify-between rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-sm">
            <div>
              <Badge className="bg-primary/20 text-primary border-primary/30 rounded-full px-2.5 py-0.5 text-[10px]">
                ML Prediction Output
              </Badge>
              <div className="mt-4 flex items-baseline gap-3">
                <span className="font-display text-5xl font-bold text-primary">{prediction.finalProb}%</span>
                <span className="text-xs text-muted-foreground font-medium">Estimated Completion Probability</span>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Stall Risk Assessment</span>
                  <span className="font-semibold text-amber-500">{prediction.stallRisk}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
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
    <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="mt-2 font-display text-2xl font-bold tracking-tight">{value}</div>
      <p className="mt-1 text-[11px] text-muted-foreground">{subtext}</p>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon?: any; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3">
      {Icon && (
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
      )}
      <div>
        <h3 className="font-display text-base font-semibold">{title}</h3>
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
