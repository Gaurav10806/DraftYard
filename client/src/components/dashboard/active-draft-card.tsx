import { ArrowRight, Clock } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { drafts } from "@/data/drafts";
import { stageToProgress } from "@/lib/drafts-insights";
import { slugify } from "@/routes/project.$slug";
import { useMyDrafts, useDrafts } from "@/hooks/use-drafts";
import { useAuth } from "@/lib/auth-context";
import { navigateToWorkspace } from "@/lib/api";

export function ActiveDraftCard() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { data: myDrafts, isLoading: myLoading } = useMyDrafts();
  const { data: serverData } = useDrafts();

  // Extract drafts array from infinite query response
  const serverDrafts = Array.isArray(serverData?.pages)
    ? serverData.pages.flatMap((page: any) => page.data || [])
    : [];

  const hasUserDrafts = isAuthenticated && myDrafts && myDrafts.length > 0;

  // Render empty state if user is logged in but has no drafts yet
  if (isAuthenticated && !myLoading && (!myDrafts || myDrafts.length === 0)) {
    return (
      <div className="group flex flex-col justify-between rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all duration-[220ms] hover:shadow-md hover:-translate-y-0.5">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.20em] text-primary/80">Active Draft</span>
          </div>
          <div className="mt-8 flex flex-col items-center justify-center text-center py-8">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 font-display text-sm font-bold text-primary mb-4">
              +
            </div>
            <h3 className="font-display text-base font-semibold">No Active Draft</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-xs leading-relaxed">
              You haven't created any drafts yet. Start your first project to track progress!
            </p>
          </div>
        </div>

        <Button
          onClick={() => navigate({ to: "/new-draft" })}
          className="mt-auto h-10 w-full rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-sm transition-all duration-[180ms] hover:from-primary hover:to-primary/90 hover:shadow-md hover:-translate-y-0.5"
        >
          Create First Draft
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    );
  }

  const storedActiveDraftId = typeof window !== "undefined" ? localStorage.getItem("activeDraftId") : null;

  const foundActive = storedActiveDraftId && myDrafts
    ? myDrafts.find((d: any) => d._id === storedActiveDraftId)
    : null;

  const d = foundActive || (hasUserDrafts
    ? myDrafts[0]
    : (serverDrafts && serverDrafts.length > 0 ? serverDrafts[0] : drafts[0]));

  const progress = stageToProgress(d.currentStage);

  return (
    <div className="group flex h-full flex-col rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all duration-[220ms] hover:shadow-md hover:-translate-y-0.5">
      {/* Card label */}
      <span className="text-[10px] font-semibold uppercase tracking-[0.20em] text-primary/80">Active Draft</span>

      {/* Row 1: Avatar + Title + Badge */}
      <div className="mt-4 flex items-center gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-primary/10 font-display text-sm font-bold text-primary">
          {d.projectName.slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-base font-semibold leading-tight text-foreground">{d.projectName}</h3>
        </div>
        <Badge variant="secondary" className="rounded-full text-[9px] px-2 py-1 shrink-0 h-fit whitespace-nowrap">
          <span className={`mr-1.5 h-1 w-1 rounded-full ${d.revivalStatus === 'revived' ? 'bg-orange-500' : 'bg-purple-500'}`} />
          {d.revivalStatus === 'revived' ? "Revived" : "Revival"}
        </Badge>
      </div>

      {/* Row 2: Description */}
      <p className="mt-4 text-xs leading-snug text-muted-foreground line-clamp-2">{d.oneLiner}</p>

      {/* Row 3: Stage and Progress cards (fixed height, no flex-1) */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="h-20 rounded-lg bg-muted/40 p-3 flex flex-col">
          <div className="text-[8px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">Stage</div>
          <div className="mt-2 text-sm font-semibold text-foreground truncate flex-1 flex items-center">{d.currentStage}</div>
        </div>
        <div className="h-20 rounded-lg bg-muted/40 p-3 flex flex-col">
          <div className="flex items-center justify-between text-[8px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
            <span>Progress</span>
            <span className="text-primary font-semibold">{progress}%</span>
          </div>
          <div className="mt-2 flex-1 flex flex-col justify-center">
            <div className="h-1.5 overflow-hidden rounded-full bg-muted/60">
              <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Last updated */}
      <div className="mt-4 flex items-center gap-2 text-[10px] text-muted-foreground">
        <Clock className="h-2.5 w-2.5 opacity-60 flex-shrink-0" />
        <span>Last updated 2h ago</span>
      </div>

      {/* Row 5: Button pinned to bottom */}
      <Button
        onClick={() => navigateToWorkspace(d._id || d.projectName, d.projectName, navigate, (msg) => toast.error(msg))}
        className="mt-auto mb-0 h-8 w-full rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xs shadow-sm transition-all duration-[180ms] hover:from-primary hover:to-primary/90 hover:shadow-md hover:-translate-y-0.5 group-hover:shadow-lg"
      >
        Open Draft
        <ArrowRight className="ml-1 h-3 w-3 transition-transform duration-[180ms] group-hover:translate-x-0.5" />
      </Button>
    </div>
  );
}
