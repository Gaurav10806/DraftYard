import { Lightbulb, Target, Users, Archive } from "lucide-react";

const items = [
  {
    icon: Lightbulb,
    title: "Stay organized",
    desc: "All your ideas and progress, in one place.",
    tint: "bg-primary/10 text-primary",
  },
  {
    icon: Target,
    title: "Make consistent progress",
    desc: "Small steps today, big impact tomorrow.",
    tint: "bg-emerald-500/10 text-emerald-500",
  },
  {
    icon: Users,
    title: "Build together",
    desc: "Collaborate, share and grow with your team.",
    tint: "bg-sky-500/10 text-sky-400",
  },
  {
    icon: Archive,
    title: "Never lose an idea",
    desc: "Every draft is safe and easily accessible.",
    tint: "bg-amber-500/10 text-amber-400",
  },
];

export function BenefitsRow() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map(({ icon: Icon, title, desc, tint }) => (
        <div
          key={title}
          className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-4"
        >
          <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tint}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold">{title}</p>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
