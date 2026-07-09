import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { teamSizeVsStage } from "@/lib/drafts-insights";
import { AXIS, CHART_COLORS } from "./colors";

export function TeamVsStageBar() {
  const data = teamSizeVsStage();
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="font-display text-sm font-semibold">Team size vs stage died</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">Where different team sizes get stuck</p>
      <div className="mt-4 h-56">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ left: -8 }}>
            <CartesianGrid stroke="rgba(148,163,184,0.15)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="stage" stroke={AXIS} fontSize={10} interval={0} angle={-20} textAnchor="end" height={50} />
            <YAxis stroke={AXIS} fontSize={11} />
            <Tooltip cursor={{ fill: "rgba(148,163,184,0.1)" }} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar isAnimationActive={false} dataKey="solo" stackId="a" fill={CHART_COLORS[0]} />
            <Bar isAnimationActive={false} dataKey="2-3" stackId="a" fill={CHART_COLORS[1]} />
            <Bar isAnimationActive={false} dataKey="4+" stackId="a" fill={CHART_COLORS[2]} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
