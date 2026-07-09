import { useRef } from "react";
import { ChevronLeft, ChevronRight, Plus, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { drafts } from "@/data/drafts";
import { stageToProgress } from "@/lib/drafts-insights";

export function DraftShelf() {
  const scroller = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => {
    scroller.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  const items = drafts.slice(0, 12);

  return (
    <div className="min-w-0 rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold tracking-tight">Draft Shelf</h2>
        <a href="#" className="text-sm font-medium text-primary hover:underline">View all drafts →</a>
      </div>


      <div className="relative mt-5">
        <button
          onClick={() => scroll(-1)}
          className="absolute -left-3 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-border bg-background shadow"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div ref={scroller} className="scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2">
          {items.map((d, i) => {
            const progress = stageToProgress(d.stageDied);
            const pinned = i === 1;
            return (
              <div
                key={d.projectName}
                className="group/card relative snap-start shrink-0 w-64 rounded-2xl border border-border/60 bg-background p-4 shadow-sm transition-all duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:shadow-xl hover:border-primary/50 hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_35%,transparent),0_18px_40px_-18px_color-mix(in_oklab,var(--primary)_40%,transparent)]"
              >
                <div className="flex items-center justify-between">
                  {pinned ? (
                    <Badge className="rounded-full bg-tint-peach text-foreground hover:bg-tint-peach">
                      <Star className="mr-1 h-3 w-3" /> Pinned
                    </Badge>
                  ) : i === 0 ? (
                    <Badge variant="secondary" className="rounded-full">Active</Badge>
                  ) : (
                    <Badge variant="outline" className="rounded-full capitalize">{d.domain}</Badge>
                  )}
                  <button className="text-muted-foreground">⋮</button>
                </div>

                <div className="mt-3 grid h-12 w-12 place-items-center rounded-xl bg-primary/15 font-display text-sm font-bold text-primary">
                  {d.projectName.slice(0, 2)}
                </div>

                <h3 className="mt-3 truncate font-display text-base font-semibold tracking-tight">{d.projectName}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{d.stageDied}</p>

                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="font-semibold">{progress}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground">Updated {i + 1}d ago</p>

                {/* Reveal quick actions on hover */}
                <div className="pointer-events-none absolute inset-x-3 bottom-3 flex gap-2 opacity-0 translate-y-2 transition-all duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/card:opacity-100 group-hover/card:translate-y-0 group-hover/card:pointer-events-auto">
                  <button className="flex-1 rounded-lg bg-gradient-to-r from-primary to-primary/85 px-2 py-1.5 text-[11px] font-semibold text-primary-foreground shadow-sm transition hover:brightness-110">Open</button>
                  <button className="flex-1 rounded-lg border border-border bg-background/95 px-2 py-1.5 text-[11px] font-semibold backdrop-blur transition hover:border-primary/50">Revive</button>
                </div>
              </div>

            );

          })}
          <button className="snap-start shrink-0 grid w-64 place-items-center rounded-2xl border-2 border-dashed border-border p-4 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
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
    </div>
  );
}
