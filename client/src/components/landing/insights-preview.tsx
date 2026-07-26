import { Lightbulb, Target, Users } from "lucide-react";

const cards = [
  {
    tint: "bg-tint-lilac",
    icon: Lightbulb,
    title: "Nothing wasted",
    body: "Every abandoned draft becomes a data point in a growing autopsy dataset.",
  },
  {
    tint: "bg-tint-mint",
    icon: Target,
    title: "Patterns, not vibes",
    body: "See exactly what stage projects die at and which reasons repeat.",
  },
  {
    tint: "bg-tint-peach",
    icon: Users,
    title: "Someone else's turn",
    body: "Mark your project open for revival — let the community take it further.",
  },
];

export function InsightsPreview() {
  return (
    <section id="insights" className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
      <div className="grid gap-6 md:grid-cols-3">
        {cards.map((c) => (
          <div key={c.title} className={`${c.tint} rounded-2xl p-8`}>
            <c.icon className="h-6 w-6 text-foreground" />
            <h3 className="mt-6 font-display text-xl font-semibold">{c.title}</h3>
            <p className="mt-2 text-sm text-foreground/70">{c.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
