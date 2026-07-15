import { summaryStats } from "@/lib/drafts-insights";

export function StatsStrip() {
  const s = summaryStats();
  const items = [
    { label: "Drafts submitted", value: s.total },
    { label: "Open for revival", value: `${s.revivalPct}%` },
    { label: "Top domain", value: s.topDomain },
    { label: "Avg time invested", value: `${s.avgWeeks} wk` },
  ];
  return (
    <section className="border-y border-border/60 bg-card/40">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px overflow-hidden bg-border/60 md:grid-cols-4">
        {items.map((it) => (
          <div key={it.label} className="bg-background px-6 py-8">
            <div className="font-display text-3xl font-semibold">{it.value}</div>
            <div className="mt-1 text-sm text-muted-foreground">{it.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
