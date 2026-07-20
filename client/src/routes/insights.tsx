import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { TopBar } from "@/components/dashboard/top-bar";
import { DomainDonut } from "@/components/dashboard/insights/domain-donut";
import { TeamVsStageBar } from "@/components/dashboard/insights/team-vs-stage-bar";
import { TechStackBar } from "@/components/dashboard/insights/tech-stack-bar";
import { WhyDiedBar } from "@/components/dashboard/insights/why-died-bar";
import { summaryStats } from "@/lib/drafts-insights";

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
  component: Insights,
});

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

function Insights() {
  const stats = summaryStats();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AppSidebar />
        <SidebarInset className="flex min-w-0 flex-1 flex-col">
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
