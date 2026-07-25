import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Bot, Check, Cloud, HelpCircle, DollarSign, Gift, Layers, Rocket, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type Q = { stage: string; q: string; options: { label: string; icon: LucideIcon }[] };

const QUESTIONS: Q[] = [
  {
    stage: "Backend Development",
    q: "Where will you deploy this project?",
    options: [
      { label: "Railway", icon: Rocket },
      { label: "Render", icon: Cloud },
      { label: "Vercel", icon: Layers },
      { label: "I'll decide later", icon: HelpCircle },
    ],
  },
  {
    stage: "Product Discovery",
    q: "Who is the primary user?",
    options: [
      { label: "Students", icon: Users },
      { label: "Solo devs", icon: Users },
      { label: "Small teams", icon: Users },
      { label: "Not sure yet", icon: HelpCircle },
    ],
  },
  {
    stage: "Business",
    q: "How will this make money?",
    options: [
      { label: "Subscription", icon: DollarSign },
      { label: "One-time", icon: DollarSign },
      { label: "Free / open source", icon: Gift },
      { label: "Undecided", icon: HelpCircle },
    ],
  },
];

export function OpenQuestions() {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<Record<number, string>>({});
  const q = QUESTIONS[i];

  const answer = (opt: string) => {
    setPicked((p) => ({ ...p, [i]: opt }));
    setTimeout(() => setI((n) => (n + 1) % QUESTIONS.length), 420);
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all duration-[220ms] hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Open Questions</span>
        <span className="text-xs text-muted-foreground">{i + 1} of {QUESTIONS.length}</span>
      </div>

      <div className="mt-5 flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Your project is in <span className="font-semibold text-foreground">{q.stage}</span> stage.
        </p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          <h3 className="mt-4 text-center font-display text-[22px] font-semibold leading-snug tracking-tight">
            {q.q}
          </h3>

          <div className="mt-5 grid grid-cols-2 gap-2">
            {q.options.map(({ label, icon: Icon }) => {
              const active = picked[i] === label;
              return (
                <button
                  key={label}
                  onClick={() => answer(label)}
                  className={`group/opt flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-all duration-[180ms] active:scale-[0.98] ${
                    active
                      ? "border-primary bg-primary/10 text-foreground shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_18%,transparent)]"
                      : "border-border bg-background hover:border-primary/50 hover:-translate-y-0.5 hover:shadow-sm hover:bg-primary/[0.03]"
                  }`}
                >
                  <span
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-md transition-colors ${
                      active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover/opt:bg-primary/10 group-hover/opt:text-primary"
                    }`}
                  >
                    {active ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                  </span>
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

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
