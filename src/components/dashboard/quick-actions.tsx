import { Archive, Edit3, Rocket, Share2, Skull, UserPlus } from "lucide-react";

const actions = [
  { icon: Edit3, label: "Edit Draft", tint: "bg-tint-lilac" },
  { icon: Skull, label: "Open Autopsy Room", tint: "bg-tint-sky" },
  { icon: UserPlus, label: "Invite Teammate", tint: "bg-tint-mint" },
  { icon: Share2, label: "Share Draft", tint: "bg-tint-peach" },
  { icon: Rocket, label: "Publish Draft", tint: "bg-tint-lilac" },
  { icon: Archive, label: "Archive Draft", tint: "bg-tint-mint" },
];

export function QuickActions() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        Quick Actions
      </h2>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {actions.map((a) => (
          <button
            key={a.label}
            className="group flex h-full flex-col items-center gap-2 rounded-xl border border-border bg-background p-4 text-center transition-all duration-300 hover:border-primary/60 hover:bg-primary/5 hover:-translate-y-0.5 hover:shadow-sm"
          >
            <span className={`grid h-10 w-10 place-items-center rounded-xl ${a.tint}`}>
              <a.icon className="h-4 w-4" />
            </span>
            <span className="text-xs font-medium leading-tight">{a.label}</span>
          </button>
        ))}
      </div>

    </div>
  );
}
