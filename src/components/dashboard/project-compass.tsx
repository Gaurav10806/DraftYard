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
    <div className="flex h-full flex-col rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
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
            {/* Premium needle gradient */}
            <linearGradient id="needleGrad" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="1" />
              <stop offset="55%" stopColor="var(--primary)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="var(--revive)" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="needleHighlight" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
              <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <filter id="needleShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="1.4" />
              <feOffset dx="0" dy="0.6" result="off" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.55" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
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

          <circle cx={CX} cy={CY} r={RING_R} fill="none" stroke="url(#ringGrad)" strokeWidth={3} opacity={0.65} />
          <circle cx={CX} cy={CY} r={RING_R - 8} fill="none" stroke="var(--border)" strokeWidth={1} opacity={0.55} />

          {/* Needle — thicker body, sharper tip, gradient + highlight + shadow, bounce on arrival */}
          <motion.g
            style={{ transformOrigin: `${CX}px ${CY}px` }}
            initial={{ rotate: needle - 30 }}
            animate={{ rotate: needle }}
            transition={{ type: "spring", stiffness: 120, damping: 11, mass: 0.55 }}
            filter="url(#needleShadow)"
          >
            {/* Main body */}
            <polygon
              points={`${CX},${CY - RING_R + 4} ${CX + 7},${CY - 6} ${CX + 4},${CY + 10} ${CX - 4},${CY + 10} ${CX - 7},${CY - 6}`}
              fill="url(#needleGrad)"
            />
            {/* Highlight sliver for subtle inner shadow / gloss */}
            <polygon
              points={`${CX - 1.5},${CY - RING_R + 8} ${CX + 1.5},${CY - RING_R + 8} ${CX + 1},${CY - 6} ${CX - 1},${CY - 6}`}
              fill="url(#needleHighlight)"
            />
            {/* Counterweight tail */}
            <polygon
              points={`${CX},${CY + RING_R - 22} ${CX + 5},${CY + 8} ${CX - 5},${CY + 8}`}
              fill="var(--muted-foreground)"
              opacity={0.28}
            />
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
                    <motion.circle
                      cx={dx}
                      cy={dy}
                      r={12}
                      fill="var(--primary)"
                      animate={{ scale: [1, 2.2, 1], opacity: [0.35, 0, 0.35] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
                      style={{ transformOrigin: `${dx}px ${dy}px` }}
                    />
                    <motion.circle
                      cx={dx}
                      cy={dy}
                      r={16}
                      fill="var(--primary)"
                      opacity={0.14}
                      animate={{ scale: [1, 1.35, 1] }}
                      transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                      style={{ transformOrigin: `${dx}px ${dy}px` }}
                    />
                  </>
                )}

                <motion.circle
                  cx={dx}
                  cy={dy}
                  r={active ? 6 : 3.5}
                  fill={active ? "var(--primary)" : "var(--muted-foreground)"}
                  opacity={active ? 1 : 0.55}
                  animate={{ r: active ? 6 : 3.5 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    filter: active
                      ? "drop-shadow(0 0 8px color-mix(in oklab, var(--primary) 70%, transparent))"
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
