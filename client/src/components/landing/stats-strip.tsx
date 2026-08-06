import { useGlobalFeedStats } from "@/hooks/use-drafts";

export function StatsStrip() {
  const { data: stats } = useGlobalFeedStats();

  const items = [
    { label: "Drafts submitted", value: stats?.totalProjects ?? 100 },
    { label: "Open for revival", value: "56%" },
    { label: "Top domain", value: "web" },
    { label: "Avg time invested", value: "10 wk" },
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
