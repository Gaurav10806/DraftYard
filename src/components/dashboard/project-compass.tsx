import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Target, Info } from "lucide-react";

const POLES = ["Explore", "Learn", "Build", "Collaborate", "Publish"] as const;
type Pole = (typeof POLES)[number];

const POLE_HINT: Record<Pole, string> = {
  Explore: "Research",
  Learn: "Grow",
  Build: "Focus",
  Collaborate: "Team",
  Publish: "Ship",
};

export function ProjectCompass() {
  const [focus, setFocus] = useState<Pole>("Build");

  useEffect(() => {
    const stored = localStorage.getItem("compassFocus") as Pole | null;
    if (stored && POLES.includes(stored)) setFocus(stored);
  }, []);

  const setPole = (p: Pole) => {
    setFocus(p);
    localStorage.setItem("compassFocus", p);
  };

  const angleFor = (p: Pole) => (POLES.indexOf(p) / POLES.length) * 360;
  const needle = angleFor(focus);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
          Project Compass <Info className="h-3 w-3 text-muted-foreground" />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Rotate to set your project focus</p>
      </div>

      <div className="relative mx-auto mt-4 aspect-square w-full max-w-[280px]">
        <div className="absolute inset-0 rounded-full compass-ring opacity-60 blur-2xl" />
        <div className="absolute inset-2 rounded-full compass-ring" />
        <div className="absolute inset-[14px] rounded-full bg-card" />

        <motion.div
          className="absolute inset-0 grid place-items-center"
          animate={{ rotate: needle }}
          transition={{ type: "spring", stiffness: 90, damping: 14 }}
        >
          <svg viewBox="0 0 100 100" className="h-3/5 w-3/5">
            <defs>
              <linearGradient id="dashNeedle" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor="var(--primary)" />
                <stop offset="100%" stopColor="var(--revive)" />
              </linearGradient>
            </defs>
            <polygon points="50,6 58,50 50,55 42,50" fill="url(#dashNeedle)" />
            <polygon points="50,94 58,50 50,45 42,50" fill="var(--muted-foreground)" opacity="0.35" />
            <circle cx="50" cy="50" r="5" fill="var(--foreground)" />
            <circle cx="50" cy="50" r="2" fill="var(--primary-foreground)" />
          </svg>
        </motion.div>

        {POLES.map((p) => {
          const a = (angleFor(p) - 90) * (Math.PI / 180);
          const r = 52;
          const x = 50 + r * Math.cos(a);
          const y = 50 + r * Math.sin(a);
          const active = p === focus;
          return (
            <button
              key={p}
              onClick={() => setPole(p)}
              className="group absolute -translate-x-1/2 -translate-y-1/2 text-center"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div
                className={`mx-auto h-2.5 w-2.5 rounded-full transition-all ${
                  active ? "bg-primary shadow-[0_0_12px_var(--primary)] scale-125" : "bg-muted-foreground/40 group-hover:bg-muted-foreground"
                }`}
              />
              <div className={`mt-1 text-[11px] font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>{p}</div>
              <div className={`text-[10px] ${active ? "text-primary" : "text-muted-foreground/70"}`}>{POLE_HINT[p]}</div>
            </button>
          );
        })}
      </div>

      <div className="mt-auto flex justify-center pt-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm">
          <Target className="h-3.5 w-3.5 text-primary" />
          Current Focus: <span className="font-semibold">{focus}</span>
        </div>
      </div>
    </div>
  );
}
