import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { topTechStacks } from "@/lib/drafts-insights";
import { AXIS, CHART_COLORS } from "./colors";

export function TechStackBar() {
  const data = topTechStacks();
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="font-display text-sm font-semibold">Most-used tech</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">Top stacks across drafts</p>
      <div className="mt-4 h-56">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ left: -8 }}>
            <CartesianGrid stroke="rgba(148,163,184,0.15)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" stroke={AXIS} fontSize={10} interval={0} angle={-25} textAnchor="end" height={50} />
            <YAxis stroke={AXIS} fontSize={11} />
            <Tooltip cursor={{ fill: "rgba(148,163,184,0.1)" }} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="value" fill={CHART_COLORS[1]} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
