import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { useDrafts } from "@/hooks/use-drafts";
import { DomainDonut } from "@/components/dashboard/insights/domain-donut";
import { TechStackBar } from "@/components/dashboard/insights/tech-stack-bar";
import { WhyDiedBar } from "@/components/dashboard/insights/why-died-bar";
import { TeamVsStageBar } from "@/components/dashboard/insights/team-vs-stage-bar";

export const Route = createFileRoute("/insights")({
  component: InsightsPage,
});

function InsightsPage() {
  const { data: drafts = [], isLoading } = useDrafts();

  return (
    <DashboardLayout>
      <div>
        <h1 className="font-display text-2xl font-semibold">Autopsy Room</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          What the graveyard says about how projects die.
        </p>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading insights…</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <DomainDonut drafts={drafts} />
          <TechStackBar drafts={drafts} />
          <WhyDiedBar drafts={drafts} />
          <TeamVsStageBar drafts={drafts} />
        </div>
      )}
    </DashboardLayout>
  );
}