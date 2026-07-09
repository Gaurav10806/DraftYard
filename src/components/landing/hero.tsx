import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="hero-glow relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 md:grid-cols-2 md:py-28 md:gap-8 items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            The graveyard for unfinished projects
          </div>
          <h1 className="mt-6 text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            Every unfinished project
            <br />
            <span className="bg-gradient-to-r from-primary via-primary to-[color:var(--revive)] bg-clip-text text-transparent">
              has a lesson.
            </span>
          </h1>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground">
            Submit your abandoned drafts and startups. We turn them into insights — what killed them, what's
            salvageable, and who might revive them.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full">
              <Link to="/dashboard">
                Open dashboard <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full">
              <a href="#how">Submit a draft</a>
            </Button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotate: -8 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative mx-auto aspect-square w-full max-w-md"
        >
          <div className="absolute inset-0 rounded-full compass-ring opacity-80 blur-xl" />
          <div className="absolute inset-4 rounded-full compass-ring" />
          <div className="absolute inset-8 rounded-full bg-card shadow-2xl" />
          <div className="absolute inset-0 grid place-items-center">
            <motion.div
              animate={{ rotate: [0, 72, 144, 216, 288, 360] }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
              className="h-2/3 w-2/3"
            >
              <svg viewBox="0 0 100 100" className="h-full w-full">
                <defs>
                  <linearGradient id="needle" x1="50%" y1="0%" x2="50%" y2="100%">
                    <stop offset="0%" stopColor="var(--primary)" />
                    <stop offset="100%" stopColor="var(--revive)" />
                  </linearGradient>
                </defs>
                <polygon points="50,8 56,50 50,55 44,50" fill="url(#needle)" />
                <polygon points="50,92 56,50 50,45 44,50" fill="var(--muted-foreground)" opacity="0.4" />
                <circle cx="50" cy="50" r="4" fill="var(--foreground)" />
              </svg>
            </motion.div>
          </div>
          {["Explore", "Learn", "Build", "Collaborate", "Publish"].map((label, i) => {
            const angle = (i / 5) * 2 * Math.PI - Math.PI / 2;
            const r = 48;
            const x = 50 + r * Math.cos(angle);
            const y = 50 + r * Math.sin(angle);
            return (
              <span
                key={label}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground backdrop-blur"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                {label}
              </span>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
