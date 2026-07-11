import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { ActiveDraftCard } from "@/components/dashboard/active-draft-card";
import { ProjectCompass } from "@/components/dashboard/project-compass";
import { OpenQuestions } from "@/components/dashboard/open-questions";
import { DraftShelf } from "@/components/dashboard/draft-shelf";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { useDrafts } from "@/hooks/use-drafts";

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

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

function Dashboard() {
  const { data: drafts = [], isLoading } = useDrafts();

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading your drafts…</div>;
  }

  return (
    <DashboardLayout>
      <motion.div
        className="flex-1 space-y-6"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
        }}
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <motion.div variants={fadeUp} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
            <ActiveDraftCard drafts={drafts} />
          </motion.div>
          <motion.div variants={fadeUp} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
            <ProjectCompass />
          </motion.div>
          <motion.div variants={fadeUp} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
            <OpenQuestions />
          </motion.div>
        </div>

        <motion.div
          className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px]"
          variants={fadeUp}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <DraftShelf drafts={drafts} />
          <QuickActions />
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
