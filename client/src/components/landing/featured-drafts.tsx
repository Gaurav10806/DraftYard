import { Badge } from "@/components/ui/badge";
import { stageToProgress } from "@/lib/drafts-insights";
import { useDrafts } from "@/hooks/use-drafts";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Zap } from "lucide-react";

export function FeaturedDrafts() {
  const { data, isLoading, error } = useDrafts();

  // Extract drafts array from infinite query response
  const drafts = Array.isArray(data?.pages)
    ? data.pages.flatMap((page: any) => page.data || [])
    : [];

  if (isLoading) {
    return (
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-primary">Recent burials</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">Fresh from the yard.</h2>
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-6">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="mt-4 h-6 w-48" />
              <Skeleton className="mt-1 h-4 w-full" />
              <Skeleton className="mt-5 h-2 w-full" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <div className="rounded-2xl border border-destructive/50 bg-destructive/10 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <div>
            <h3 className="font-semibold text-destructive">Failed to load drafts</h3>
            <p className="text-sm text-destructive/80">Please try refreshing the page</p>
          </div>
        </div>
      </section>
    );
  }

  const featured = drafts.slice(0, 4);

  if (featured.length === 0) {
    return (
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <div className="rounded-2xl border border-border/60 bg-card/50 p-8 text-center">
          <Zap className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-3 font-semibold">No drafts yet</h3>
          <p className="text-sm text-muted-foreground">Be the first to contribute a draft</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-primary">Recent burials</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight">Fresh from the yard.</h2>
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {featured.map((d) => {
          const progress = stageToProgress(d.currentStage);
          const isOpenForRevival = d.openForRevival || (d.raisedHands && d.raisedHands.length > 0);
          const author = typeof d.submittedBy === "object" ? d.submittedBy?.name || "Anonymous" : "Anonymous";
          
          return (
            <article key={d._id} className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/50">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="capitalize">{d.domain}</Badge>
                {d.revivalStatus === 'revived' ? (
                  <span className="inline-flex items-center gap-1 text-xs text-orange-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-500" /> 🔥 Revived
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-purple-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-500" /> 🟣 Open
                  </span>
                )}
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{d.projectName}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{d.oneLiner}</p>
              
              <div className="mt-3 flex flex-wrap gap-1">
                {(d.tags || []).slice(0, 2).map((tag: string) => (
                  <Badge key={tag} variant="outline" className="text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>{d.currentStage}</span>
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {progress}%
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{author}</span>
                <span>{(d.views || 0).toLocaleString()} views</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
