import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Target, Info } from "lucide-react";

const POLES = ["Explore", "Learn", "Build", "Collaborate", "Publish"] as const;
type Pole = (typeof POLES)[number];

const POLE_HINT: Record<Pole, string> = {
  Explore: "Research new directions",
  Learn: "Grow skills & understanding",
  Build: "Deep focus on shipping",
  Collaborate: "Work with your team",
  Publish: "Ready to ship & share",
};

const CX = 150;
const CY = 150;
const RING_R = 118;
const LABEL_R = 142;

const angleFor = (p: Pole) => (POLES.indexOf(p) / POLES.length) * 360;

function polar(angleDeg: number, r: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)] as const;
}

function labelArcPath(angleDeg: number, r = LABEL_R, span = 44) {
  const flip = angleDeg > 90 && angleDeg < 270;
  const a1 = flip ? angleDeg + span / 2 : angleDeg - span / 2;
  const a2 = flip ? angleDeg - span / 2 : angleDeg + span / 2;
  const [x1, y1] = polar(a1, r);
  const [x2, y2] = polar(a2, r);
  const sweep = flip ? 0 : 1;
  return `M ${x1} ${y1} A ${r} ${r} 0 0 ${sweep} ${x2} ${y2}`;
}

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

  const needle = angleFor(focus);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border/70 bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
      <div className="text-center">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
          Project Compass <Info className="h-3 w-3 text-muted-foreground" />
        </div>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
          Rotate to set your project focus
        </p>
      </div>

      <div className="relative mx-auto mt-3 aspect-square w-full max-w-[320px]">
        {/* Softer ambient glow (reduced ~20%) */}
        <div className="pointer-events-none absolute inset-4 rounded-full compass-ring opacity-40 blur-2xl" />

        <svg viewBox="0 0 300 300" className="relative h-full w-full">
          <defs>
            {POLES.map((p) => (
              <path
                key={p}
                id={`compass-arc-${p}`}
                d={labelArcPath(angleFor(p))}
                fill="none"
              />
            ))}
            <linearGradient id="dashNeedle" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="var(--primary)" />
              <stop offset="100%" stopColor="var(--revive)" />
            </linearGradient>
            <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.9" />
              <stop offset="50%" stopColor="var(--revive)" stopOpacity="0.7" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          {/* The ring */}
          <circle
            cx={CX}
            cy={CY}
            r={RING_R}
            fill="none"
            stroke="url(#ringGrad)"
            strokeWidth={3}
            opacity={0.65}
          />
          <circle
            cx={CX}
            cy={CY}
            r={RING_R - 8}
            fill="none"
            stroke="var(--border)"
            strokeWidth={1}
            opacity={0.6}
          />

          {/* Needle */}
          <motion.g
            style={{ transformOrigin: `${CX}px ${CY}px` }}
            animate={{ rotate: needle }}
            transition={{ type: "tween", duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <polygon
              points={`${CX},38 ${CX + 10},${CY} ${CX},${CY + 8} ${CX - 10},${CY}`}
              fill="url(#dashNeedle)"
            />
            <polygon
              points={`${CX},262 ${CX + 8},${CY} ${CX},${CY - 6} ${CX - 8},${CY}`}
              fill="var(--muted-foreground)"
              opacity={0.32}
            />
          </motion.g>

          {/* Center hub with breathing */}
          <motion.circle
            cx={CX}
            cy={CY}
            r={13}
            fill="var(--foreground)"
            animate={{ scale: [1, 1.06, 1], opacity: [0.95, 1, 0.95] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: `${CX}px ${CY}px` }}
          />
          <circle cx={CX} cy={CY} r={4.5} fill="var(--primary-foreground)" />

          {/* Poles */}
          {POLES.map((p) => {
            const a = angleFor(p);
            const [dx, dy] = polar(a, RING_R);
            const active = p === focus;
            return (
              <g
                key={p}
                onClick={() => setPole(p)}
                className="cursor-pointer"
                style={{ pointerEvents: "all" }}
              >
                <title>{POLE_HINT[p]}</title>

                {/* Selected glow behind dot */}
                {active && (
                  <>
                    <motion.circle
                      cx={dx}
                      cy={dy}
                      r={14}
                      fill="var(--primary)"
                      opacity={0.22}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.28, 0, 0.28] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
                      style={{ transformOrigin: `${dx}px ${dy}px` }}
                    />
                    <circle cx={dx} cy={dy} r={10} fill="var(--primary)" opacity={0.18} />
                  </>
                )}

                <circle
                  cx={dx}
                  cy={dy}
                  r={active ? 5.5 : 3.5}
                  fill={active ? "var(--primary)" : "var(--muted-foreground)"}
                  opacity={active ? 1 : 0.5}
                  className="transition-all"
                />

                {/* Invisible hit target */}
                <path
                  d={labelArcPath(a, LABEL_R, 48)}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={22}
                />

                <text
                  className="font-display select-none"
                  fontSize={active ? 14.5 : 13.5}
                  fontWeight={active ? 700 : 600}
                  letterSpacing="0.06em"
                  fill={active ? "var(--primary)" : "var(--muted-foreground)"}
                  style={{
                    filter: active
                      ? "drop-shadow(0 0 6px color-mix(in oklab, var(--primary) 55%, transparent))"
                      : undefined,
                    transition: "fill 250ms ease, font-size 250ms ease",
                  }}
                >
                  <textPath
                    href={`#compass-arc-${p}`}
                    startOffset="50%"
                    textAnchor="middle"
                  >
                    {p.toUpperCase()}
                  </textPath>
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-auto flex justify-center pt-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm shadow-sm">
          <Target className="h-3.5 w-3.5 text-primary" />
          Current Focus:{" "}
          <span className="font-semibold text-foreground">{focus}</span>
        </div>
      </div>
    </div>
  );
}
