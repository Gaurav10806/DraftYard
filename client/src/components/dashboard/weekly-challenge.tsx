import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Star, Medal, LayoutGrid, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ── Challenge data ────────────────────────────────────────────────────────────

const CHALLENGE = {
  title: "AI Productivity Challenge",
  description:
    "Build a tool that helps developers save at least 30 minutes every day.",
  endsAt: (() => {
    // Always end 6d 12h from now so the countdown feels live
    const d = new Date();
    d.setDate(d.getDate() + 6);
    d.setHours(d.getHours() + 12);
    return d;
  })(),
  rewards: [
    { icon: Star,       label: "Featured on Homepage" },
    { icon: Medal,      label: "Exclusive Challenge Badge" },
    { icon: Trophy,     label: "Top 3 Community Showcase" },
  ],
};

// ── Countdown hook ────────────────────────────────────────────────────────────

function useCountdown(target: Date) {
  const calc = () => {
    const diff = Math.max(0, target.getTime() - Date.now());
    const days    = Math.floor(diff / 86_400_000);
    const hours   = Math.floor((diff % 86_400_000) / 3_600_000);
    const minutes = Math.floor((diff % 3_600_000)  / 60_000);
    return { days, hours, minutes };
  };

  const [time, setTime] = useState(calc);

  useEffect(() => {
    const id = setInterval(() => setTime(calc), 60_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.getTime()]);

  return time;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function WeeklyChallenge() {
  const { days, hours } = useCountdown(CHALLENGE.endsAt);
  const [participating, setParticipating] = useState(false);

  const handleParticipate = () => {
    setParticipating(true);
    toast.success("You've joined the challenge! Good luck 🏆");
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all duration-[220ms] hover:shadow-md hover:-translate-y-0.5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          Weekly Challenge
        </span>

        {/* Time remaining badge */}
        <motion.div
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-500 dark:text-amber-400"
        >
          <Clock className="h-3 w-3" />
          {days}D {hours}H Left
        </motion.div>
      </div>

      {/* ── Trophy icon + challenge label ── */}
      <div className="mt-5 flex items-center gap-3">
        <motion.div
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500/15"
          animate={{ scale: [1, 1.07, 1] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Trophy className="h-5 w-5 text-amber-500" />
        </motion.div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          This Week's Challenge
        </p>
      </div>

      {/* ── Title + description ── */}
      <div className="mt-3">
        <h3 className="font-display text-[20px] font-semibold leading-snug tracking-tight">
          {CHALLENGE.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {CHALLENGE.description}
        </p>
      </div>

      {/* ── Rewards ── */}
      <div className="mt-5">
        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Rewards
        </p>
        <div className="flex flex-wrap gap-2">
          {CHALLENGE.rewards.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/40 px-2.5 py-1.5 text-[11px] font-medium text-foreground"
            >
              <Icon className="h-3.5 w-3.5 text-amber-500" />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="mt-auto pt-5 space-y-3">
        {participating ? (
          <div className="flex h-10 w-full items-center justify-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            <LayoutGrid className="h-4 w-4" /> Joined — good luck!
          </div>
        ) : (
          <Button
            onClick={handleParticipate}
            className="h-10 w-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 font-semibold text-white shadow-[0_8px_24px_-8px_rgba(245,158,11,0.5)] transition-all duration-[180ms] hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-8px_rgba(245,158,11,0.6)]"
          >
            Participate Now
          </Button>
        )}

        <button
          onClick={() => toast("Challenge board coming soon")}
          className="inline-flex w-full items-center justify-center gap-1 text-sm font-medium text-primary transition-opacity hover:opacity-70"
        >
          View All Challenges <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
