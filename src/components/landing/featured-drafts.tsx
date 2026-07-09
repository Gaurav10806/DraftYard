import { Badge } from "@/components/ui/badge";
import { drafts } from "@/data/drafts";
import { stageToProgress } from "@/lib/drafts-insights";

export function FeaturedDrafts() {
  const featured = drafts.slice(0, 4);
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
          const progress = stageToProgress(d.stageDied);
          return (
            <article key={d.projectName} className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/50">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="capitalize">{d.domain}</Badge>
                {d.openForRevival && (
                  <span className="inline-flex items-center gap-1 text-xs text-[color:var(--revive)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--revive)]" /> Open
                  </span>
                )}
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{d.projectName}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{d.oneLiner}</p>
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{d.stageDied}</span>
                  <span>{progress}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
