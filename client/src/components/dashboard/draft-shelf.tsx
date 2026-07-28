import { useRef } from "react";
import { ChevronLeft, ChevronRight, Plus, Star, AlertCircle, Zap } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { stageToProgress } from "@/lib/drafts-insights";
import { slugify } from "@/routes/project.$slug";
import { useDrafts, useMyDrafts } from "@/hooks/use-drafts";
import { useAuth } from "@/lib/auth-context";
import { navigateToWorkspace } from "@/lib/api";

export function DraftShelf() {
  const navigate = useNavigate();
  const scroller = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => {
    scroller.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  const { isAuthenticated } = useAuth();
  const { data: myDrafts, isLoading: myLoading } = useMyDrafts();
  const { data: serverData, isLoading: serverLoading, error: feedError } = useDrafts();

  // Extract drafts array from infinite query response
  const serverDrafts = Array.isArray(serverData?.pages)
    ? serverData.pages.flatMap((page: any) => page.data || [])
    : [];

  // Show the user's own drafts first when logged in, fall back to feed
  const items = (
    isAuthenticated && myDrafts && myDrafts.length > 0
      ? myDrafts
      : serverDrafts && serverDrafts.length > 0
        ? serverDrafts
        : []
  ).slice(0, 12);

  const isLoading = myLoading || serverLoading;

  const openDraft = (id: string, name: string) => {
    if (!id) return;
    navigateToWorkspace(id, name, navigate, (msg) => toast.error(msg));
  };

  return (
    <div className="min-w-0 rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all duration-[220ms] hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold tracking-tight">Draft Shelf</h2>
        <Link to="/feed" className="text-sm font-medium text-primary hover:underline">
          View all drafts →
        </Link>
      </div>

      {feedError && (
        <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>Failed to load drafts</span>
        </div>
      )}

      {isLoading && (
        <div className="relative mt-5">
          <div className="flex gap-4 overflow-hidden px-6 pb-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="shrink-0 w-64 rounded-2xl border border-border/60 bg-background p-4 animate-pulse"
              >
                <div className="h-8 w-20 bg-muted rounded" />
                <div className="mt-3 h-12 w-12 bg-muted rounded-xl" />
                <div className="mt-3 h-4 w-32 bg-muted rounded" />
                <div className="mt-2 h-2 w-full bg-muted rounded-full" />
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div className="mt-6 rounded-lg border border-dashed border-border/60 p-8 text-center">
          <Zap className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">No drafts available</p>
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <div className="relative mt-5">
          <button
            onClick={() => scroll(-1)}
            className="absolute -left-3 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-border bg-background shadow"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 z-[5] w-8 bg-gradient-to-r from-card to-transparent"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 z-[5] w-8 bg-gradient-to-l from-card to-transparent"
          />
          <div
            ref={scroller}
            className="scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-smooth px-6 pb-2 [-webkit-overflow-scrolling:touch]"
          >
            {items.map((d, i) => {
              const progress = stageToProgress(d.currentStage);
              const pinned = i === 1;
              const isOpenForRevival = d.openForRevival || (d.raisedHands && d.raisedHands.length > 0);
              const author = typeof d.submittedBy === "object" ? d.submittedBy?.name || "Anonymous" : "Anonymous";

              return (
                <div
                  key={d._id || d.projectName}
                  onClick={() => openDraft(d._id || d.projectName, d.projectName)}
                  className="group/card relative snap-start shrink-0 w-64 cursor-pointer rounded-2xl border border-border/60 bg-background p-4 shadow-sm transition-all duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:shadow-xl hover:border-primary/50 hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_35%,transparent),0_18px_40px_-18px_color-mix(in_oklab,var(--primary)_40%,transparent)]"
                >
                  <div className="flex items-center justify-between">
                    {pinned ? (
                      <Badge className="rounded-full bg-tint-peach text-foreground hover:bg-tint-peach">
                        <Star className="mr-1 h-3 w-3" /> Pinned
                      </Badge>
                    ) : i === 0 ? (
                      <Badge variant="secondary" className="rounded-full">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="rounded-full capitalize">
                        {d.domain}
                      </Badge>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          ⋮
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onClick={() => openDraft(d._id || d.projectName, d.projectName)}>
                          Open
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => toast(`${d.projectName} marked open for revival`)}
                        >
                          Mark for revival
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            const url = `${window.location.origin}/project/${d._id || slugify(d.projectName)}`;
                            navigator.clipboard?.writeText(url);
                            toast("Link copied to clipboard");
                          }}
                        >
                          Copy link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast(`${d.projectName} archived`)}>
                          Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-3 grid h-12 w-12 place-items-center rounded-xl bg-primary/15 font-display text-sm font-bold text-primary">
                    {d.projectName.slice(0, 2).toUpperCase()}
                  </div>

                  <h3 className="mt-3 truncate font-display text-base font-semibold tracking-tight">
                    {d.projectName}
                  </h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">{d.currentStage}</p>

                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="font-semibold">{progress}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="truncate">{author}</span>
                    <span>{isOpenForRevival ? "Open" : `${(d.views || 0).toLocaleString()} views`}</span>
                  </div>

                  {/* Reveal quick actions on hover */}
                  <div className="pointer-events-none absolute inset-x-3 bottom-3 flex gap-2 opacity-0 translate-y-2 transition-all duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/card:opacity-100 group-hover/card:translate-y-0 group-hover/card:pointer-events-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDraft(d._id || d.projectName, d.projectName);
                      }}
                      className="flex-1 rounded-lg bg-gradient-to-r from-primary to-primary/85 px-2 py-1.5 text-[11px] font-semibold text-primary-foreground shadow-sm transition hover:brightness-110"
                    >
                      Open
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toast(`${d.projectName} marked open for revival`);
                      }}
                      className="flex-1 rounded-lg border border-border bg-background/95 px-2 py-1.5 text-[11px] font-semibold backdrop-blur transition hover:border-primary/50"
                    >
                      Revive
                    </button>
                  </div>
                </div>
              );
            })}
            <button
              onClick={() => navigate({ to: "/new-draft" })}
              className="snap-start shrink-0 grid w-64 place-items-center rounded-2xl border-2 border-dashed border-border p-4 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <div className="text-center">
                <Plus className="mx-auto h-6 w-6" />
                <div className="mt-2 font-semibold">New Draft</div>
                <div className="text-xs">Start a new idea</div>
              </div>
            </button>
          </div>
          <button
            onClick={() => scroll(1)}
            className="absolute -right-3 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-border bg-background shadow"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
