import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { TopBar } from "@/components/dashboard/top-bar";
import { ActiveDraftCard } from "@/components/dashboard/active-draft-card";
import { ProjectCompass } from "@/components/dashboard/project-compass";
import { OpenQuestions } from "@/components/dashboard/open-questions";
import { DraftShelf } from "@/components/dashboard/draft-shelf";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { ProtectedRoute } from "@/components/auth/protected-route";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · DraftYard" },
      {
        name: "description",
        content:
          "Your DraftYard dashboard — active drafts, project compass, and insights across 100+ unfinished projects.",
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

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

function Dashboard() {
  return (
    <ProtectedRoute>
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
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
              }}
            >
              <div className="grid gap-6 lg:grid-cols-3">
                <motion.div
                  variants={fadeUp}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <ActiveDraftCard />
                </motion.div>
                <motion.div
                  variants={fadeUp}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <ProjectCompass />
                </motion.div>
                <motion.div
                  variants={fadeUp}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <OpenQuestions />
                </motion.div>
              </div>

              <motion.div
                className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px]"
                variants={fadeUp}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <DraftShelf />
                <QuickActions />
              </motion.div>
            </motion.main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
