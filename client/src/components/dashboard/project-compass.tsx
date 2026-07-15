import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

const CX = 160;
const CY = 160;
const RING_R = 108;
const LABEL_R = 138;

// Evenly spaced around the circle, starting at top (-90°)
const angleFor = (p: Pole) => (POLES.indexOf(p) / POLES.length) * 360;

function polar(angleDeg: number, r: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)] as const;
}

// Arc path for a label centered on `angleDeg`, wide enough for its text.
function labelArcPath(angleDeg: number, span: number, r = LABEL_R) {
  const flip = angleDeg > 90 && angleDeg < 270;
  const a1 = flip ? angleDeg + span / 2 : angleDeg - span / 2;
  const a2 = flip ? angleDeg - span / 2 : angleDeg + span / 2;
  const [x1, y1] = polar(a1, r);
  const [x2, y2] = polar(a2, r);
  const sweep = flip ? 0 : 1;
  return `M ${x1} ${y1} A ${r} ${r} 0 0 ${sweep} ${x2} ${y2}`;
}

// Give each label a span proportional to its length so long words
// (COLLABORATE) don't get clipped. Max span kept < 72° gap between poles.
const spanFor = (p: Pole) => Math.min(64, 10 + p.length * 5.2);

function hexPoints(cx: number, cy: number, r: number) {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = ((i * 60 - 90) * Math.PI) / 180;
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return pts.join(" ");
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
    <div className="flex h-full flex-col rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all duration-[220ms] hover:shadow-md hover:-translate-y-0.5">
      <div className="text-center">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
          Project Compass <Info className="h-3 w-3 text-muted-foreground" />
        </div>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
          Rotate to set your project focus
        </p>
      </div>

      <div className="relative mx-auto mt-3 aspect-square w-full max-w-[320px]">
        <div className="pointer-events-none absolute inset-6 rounded-full compass-ring opacity-35 blur-2xl" />

        <motion.svg
          viewBox="0 0 320 320"
          className="relative h-full w-full overflow-visible"
          initial={{ opacity: 0, rotate: -8, scale: 0.96 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <defs>
            {POLES.map((p) => (
              <path
                key={p}
                id={`compass-arc-${p}`}
                d={labelArcPath(angleFor(p), spanFor(p))}
                fill="none"
              />
            ))}
            {/* Premium needle — vertical gradient tip→shoulder */}
            <linearGradient id="needleGrad" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="1" />
              <stop offset="45%" stopColor="var(--primary)" stopOpacity="0.95" />
              <stop offset="100%" stopColor="var(--revive)" stopOpacity="0.85" />
            </linearGradient>
            {/* Left/right shading for 3D body */}
            <linearGradient id="needleShade" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#000" stopOpacity="0.35" />
              <stop offset="45%" stopColor="#000" stopOpacity="0" />
              <stop offset="55%" stopColor="#fff" stopOpacity="0" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0.28" />
            </linearGradient>
            <linearGradient id="needleGloss" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
              <stop offset="70%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="tailGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--muted-foreground)" stopOpacity="0.55" />
              <stop offset="100%" stopColor="var(--muted-foreground)" stopOpacity="0.15" />
            </radialGradient>
            <filter id="nodeGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feFlood floodColor="var(--primary)" floodOpacity="0.55" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="needleShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="1.8" />
              <feOffset dx="0" dy="1.2" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.55" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="needleGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.9" />
              <stop offset="50%" stopColor="var(--revive)" stopOpacity="0.7" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--primary)" />
              <stop offset="100%" stopColor="var(--revive)" />
            </linearGradient>
          </defs>

          {/* Thicker outer ring like the landing page */}
          <circle cx={CX} cy={CY} r={RING_R + 6} fill="none" stroke="url(#ringGrad)" strokeWidth={7} opacity={0.75} />
          <circle cx={CX} cy={CY} r={RING_R} fill="none" stroke="url(#ringGrad)" strokeWidth={3} opacity={0.5} />
          <circle cx={CX} cy={CY} r={RING_R - 10} fill="none" stroke="var(--border)" strokeWidth={1} opacity={0.55} />

          {/* Classic compass needle — thicker diamond blades (N primary, S muted) */}
          <motion.g
            style={{ transformOrigin: `${CX}px ${CY}px` }}
            initial={{ rotate: needle - 40 }}
            animate={{ rotate: needle }}
            transition={{ type: "spring", stiffness: 140, damping: 12, mass: 0.6 }}
          >
            <g filter="url(#needleShadow)">
              {/* North blade — tip toward selected pole */}
              <polygon
                points={`${CX},${CY - RING_R + 6} ${CX + 14},${CY} ${CX},${CY + 6} ${CX - 14},${CY}`}
                fill="url(#needleGrad)"
                filter="url(#needleGlow)"
              />
              {/* Center highlight for gloss */}
              <polygon
                points={`${CX},${CY - RING_R + 10} ${CX + 3},${CY - 2} ${CX},${CY + 2} ${CX - 3},${CY - 2}`}
                fill="url(#needleGloss)"
              />
              {/* South blade — counterweight */}
              <polygon
                points={`${CX},${CY + RING_R - 6} ${CX + 14},${CY} ${CX},${CY - 6} ${CX - 14},${CY}`}
                fill="var(--muted-foreground)"
                opacity={0.42}
              />
            </g>
          </motion.g>

          {/* Premium hexagonal center hub */}
          <motion.g
            style={{ transformOrigin: `${CX}px ${CY}px` }}
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <polygon
              points={hexPoints(CX, CY, 16)}
              fill="var(--background)"
              stroke="url(#hexGrad)"
              strokeWidth={1.5}
            />
            <polygon
              points={hexPoints(CX, CY, 9)}
              fill="url(#hexGrad)"
            />
            <circle cx={CX} cy={CY} r={2.5} fill="var(--background)" />
          </motion.g>

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

                {active && (
                  <>
                    {/* Soft outer glow ring */}
                    <motion.circle
                      cx={dx}
                      cy={dy}
                      r={18}
                      fill="var(--primary)"
                      opacity={0.12}
                      filter="url(#nodeGlow)"
                      animate={{ scale: [1, 1.25, 1], opacity: [0.12, 0.28, 0.12] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      style={{ transformOrigin: `${dx}px ${dy}px` }}
                    />
                    {/* Ripple 1 */}
                    <motion.circle
                      cx={dx}
                      cy={dy}
                      r={12}
                      fill="none"
                      stroke="var(--primary)"
                      strokeWidth={1.5}
                      animate={{ scale: [1, 2.6], opacity: [0.55, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
                      style={{ transformOrigin: `${dx}px ${dy}px` }}
                    />
                    {/* Ripple 2 (delayed) */}
                    <motion.circle
                      cx={dx}
                      cy={dy}
                      r={12}
                      fill="none"
                      stroke="var(--primary)"
                      strokeWidth={1}
                      animate={{ scale: [1, 2.4], opacity: [0.4, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeOut", delay: 1.5 }}
                      style={{ transformOrigin: `${dx}px ${dy}px` }}
                    />
                  </>
                )}

                <motion.circle
                  cx={dx}
                  cy={dy}
                  r={active ? 8 : 3}
                  fill={active ? "var(--primary)" : "var(--muted-foreground)"}
                  opacity={active ? 1 : 0.45}
                  animate={{
                    r: active ? [7, 8.5, 7] : 3,
                    scale: active ? [1, 1.15, 1] : 1,
                  }}
                  transition={active ? { duration: 3, repeat: Infinity, ease: "easeInOut" } : { duration: 0.25 }}
                  style={{
                    transformOrigin: `${dx}px ${dy}px`,
                    filter: active
                      ? "drop-shadow(0 0 10px color-mix(in oklab, var(--primary) 80%, transparent))"
                      : undefined,
                  }}
                />

                {/* Invisible hit path along the arc */}
                <path
                  d={labelArcPath(a, spanFor(p))}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={26}
                />

                <text
                  className="font-display select-none"
                  fontSize={active ? 13.5 : 12.5}
                  fontWeight={700}
                  letterSpacing="0.14em"
                  fill={active ? "var(--primary)" : "var(--foreground)"}
                  opacity={active ? 1 : 0.72}
                  style={{
                    filter: active
                      ? "drop-shadow(0 0 6px color-mix(in oklab, var(--primary) 55%, transparent))"
                      : undefined,
                    transition: "fill 250ms ease, opacity 250ms ease, font-size 250ms ease",
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
        </motion.svg>
      </div>

      <div className="mt-auto flex justify-center pt-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm shadow-sm">
          <Target className="h-3.5 w-3.5 text-primary" />
          <span>Current Focus:</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={focus}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="font-semibold text-foreground"
            >
              {focus}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
