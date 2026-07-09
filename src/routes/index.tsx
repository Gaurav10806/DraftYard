import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/landing/hero";
import { StatsStrip } from "@/components/landing/stats-strip";
import { HowItWorks } from "@/components/landing/how-it-works";
import { InsightsPreview } from "@/components/landing/insights-preview";
import { FeaturedDrafts } from "@/components/landing/featured-drafts";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DraftYard — The graveyard for unfinished projects" },
      {
        name: "description",
        content:
          "Submit your abandoned drafts and startups. DraftYard turns unfinished projects into insights — why they died, what's salvageable, and who might revive them.",
      },
      { property: "og:title", content: "DraftYard — The graveyard for unfinished projects" },
      {
        property: "og:description",
        content: "Every unfinished project has a lesson. Submit yours to DraftYard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <Hero />
        <StatsStrip />
        <HowItWorks />
        <InsightsPreview />
        <FeaturedDrafts />
      </main>
      <SiteFooter />
    </div>
  );
}
