import { useState } from "react";
import { ArrowRight, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

const QUESTIONS = [
  {
    stage: "Backend Development",
    q: "Where will you deploy this project?",
    options: ["Railway", "Render", "Vercel", "I'll decide later"],
  },
  {
    stage: "Product Discovery",
    q: "Who is the primary user?",
    options: ["Students", "Solo devs", "Small teams", "Not sure yet"],
  },
  {
    stage: "Business",
    q: "How will this make money?",
    options: ["Subscription", "One-time", "Free / open source", "Undecided"],
  },
];

export function OpenQuestions() {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<Record<number, string>>({});
  const q = QUESTIONS[i];

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-primary">Open Questions</span>
        <span className="text-xs text-muted-foreground">{i + 1} of {QUESTIONS.length}</span>
      </div>

      <div className="mt-5 flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">
          Your project is in <span className="font-semibold text-foreground">{q.stage}</span> stage.
        </p>
      </div>

      <h3 className="mt-4 text-center font-display text-xl font-semibold">{q.q}</h3>

      <div className="mt-5 grid grid-cols-2 gap-2">
        {q.options.map((opt) => {
          const active = picked[i] === opt;
          return (
            <button
              key={opt}
              onClick={() => setPicked({ ...picked, [i]: opt })}
              className={`rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-background hover:border-primary/50"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>

      <div className="mt-auto flex justify-end pt-5">
        <Button
          variant="ghost"
          size="sm"
          className="text-primary"
          onClick={() => setI((n) => (n + 1) % QUESTIONS.length)}
        >
          Skip for now <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
