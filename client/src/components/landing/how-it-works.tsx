import { FileText, LineChart, Sprout } from "lucide-react";

const steps = [
  {
    icon: FileText,
    title: "Submit a draft",
    body: "Tell us what you built, how far you got, and why it stalled. Anonymous is fine.",
  },
  {
    icon: LineChart,
    title: "We analyze it",
    body: "Your project joins a growing dataset. We surface why projects die and what survives.",
  },
  {
    icon: Sprout,
    title: "Get insights or revived",
    body: "Learn from patterns across 100+ drafts. Open your project for someone else to pick up.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
      <div className="max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-widest text-primary">How it works</p>
        <h2 className="mt-3 text-4xl font-semibold tracking-tight">From dead code to data.</h2>
      </div>
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {steps.map((s, i) => (
          <div key={s.title} className="relative rounded-2xl border border-border bg-card p-8">
            <div className="text-xs font-semibold text-muted-foreground">0{i + 1}</div>
            <s.icon className="mt-4 h-6 w-6 text-primary" />
            <h3 className="mt-4 text-xl font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
