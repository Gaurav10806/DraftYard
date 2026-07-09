import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { teamSizeVsStage } from "@/lib/drafts-insights";

export function TeamVsStageBar() {
  const data = teamSizeVsStage();
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="font-display text-sm font-semibold">Team size vs stage died</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">Where different team sizes get stuck</p>
      <div className="mt-4 h-56">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ left: -8 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="stage" stroke="var(--muted-foreground)" fontSize={10} interval={0} angle={-20} textAnchor="end" height={50} />
            <YAxis stroke="var(--muted-foreground)" fontSize={11} />
            <Tooltip
              contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
              cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="solo" stackId="a" fill="var(--chart-1)" />
            <Bar dataKey="2-3" stackId="a" fill="var(--chart-2)" />
            <Bar dataKey="4+" stackId="a" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
