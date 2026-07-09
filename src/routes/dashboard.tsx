import { createFileRoute } from "@tanstack/react-router";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { TopBar } from "@/components/dashboard/top-bar";
import { ActiveDraftCard } from "@/components/dashboard/active-draft-card";
import { ProjectCompass } from "@/components/dashboard/project-compass";
import { OpenQuestions } from "@/components/dashboard/open-questions";
import { DraftShelf } from "@/components/dashboard/draft-shelf";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { BenefitsRow } from "@/components/dashboard/benefits-row";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · DraftYard" },
      {
        name: "description",
        content: "Your DraftYard dashboard — active drafts, project compass, and insights across 100+ unfinished projects.",
      },
      { property: "og:title", content: "DraftYard Dashboard" },
      {
        property: "og:description",
        content: "Track drafts, set focus, and learn from the graveyard of unfinished projects.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AppSidebar />
        <SidebarInset className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="flex-1 space-y-6 p-4 sm:p-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <ActiveDraftCard />
              <ProjectCompass />
              <OpenQuestions />
            </div>

            <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px]">
              <DraftShelf />
              <QuickActions />
            </div>

            <BenefitsRow />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
