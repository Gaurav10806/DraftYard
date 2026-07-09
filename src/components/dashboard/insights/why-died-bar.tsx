import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { whyDiedBuckets } from "@/lib/drafts-insights";
import { AXIS, CHART_COLORS } from "./colors";

export function WhyDiedBar() {
  const data = whyDiedBuckets();
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="font-display text-sm font-semibold">Why drafts die</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">Top reasons across all drafts</p>
      <div className="mt-4 h-56">
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid stroke="rgba(148,163,184,0.15)" strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" stroke={AXIS} fontSize={11} />
            <YAxis type="category" dataKey="name" stroke={AXIS} fontSize={11} width={110} />
            <Tooltip cursor={{ fill: "rgba(148,163,184,0.1)" }} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="value" fill={CHART_COLORS[0]} radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
