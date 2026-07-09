import { ArrowRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { drafts } from "@/data/drafts";
import { stageToProgress } from "@/lib/drafts-insights";

export function ActiveDraftCard() {
  const d = drafts[0];
  const progress = stageToProgress(d.stageDied);
  return (
    <div className="group flex h-full flex-col rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all duration-[220ms] hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Active Draft</span>
        <button className="text-muted-foreground hover:text-foreground">•••</button>
      </div>

      <div className="mt-6 flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/15 font-display text-sm font-bold text-primary">
          {d.projectName.slice(0, 2)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-[22px] font-semibold leading-tight tracking-tight">{d.projectName}</h3>
            <Badge variant="secondary" className="rounded-full text-[10px]">
              <span className="mr-1 h-1.5 w-1.5 rounded-full bg-[color:var(--revive)]" />
              {d.openForRevival ? "Open for revival" : "Buried"}
            </Badge>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d.oneLiner}</p>
        </div>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-muted/50 p-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Stage</div>
          <div className="mt-1 text-sm font-medium">{d.stageDied}</div>
        </div>
        <div className="rounded-xl bg-muted/50 p-3">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <span>Progress</span>
            <span className="text-foreground">{progress}%</span>

          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background">
            <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-7 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          Last updated 2h ago
        </div>
        <div className="flex -space-x-2">
          {["AK", "MP", "JS"].map((n) => (
            <Avatar key={n} className="h-6 w-6 ring-2 ring-card">
              <AvatarFallback className="bg-primary/20 text-[9px] font-semibold text-primary">{n}</AvatarFallback>
            </Avatar>
          ))}
          <span className="grid h-6 w-6 place-items-center rounded-full bg-muted text-[9px] font-semibold ring-2 ring-card">+2</span>
        </div>
      </div>

      <Button
        className="mt-7 h-10 w-full rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-sm transition-all duration-[180ms] hover:from-primary hover:to-primary/90 hover:shadow-md hover:-translate-y-0.5 group-hover:shadow-lg"
      >
        Open Draft
        <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-[180ms] group-hover:translate-x-0.5" />
      </Button>
    </div>
  );
}
