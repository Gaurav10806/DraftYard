import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { domainDistribution } from "@/lib/drafts-insights";
import { CHART_COLORS } from "./colors";

export function DomainDonut() {
  const data = domainDistribution();
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="font-display text-sm font-semibold">Where drafts live</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">Domain distribution</p>
      <div className="mt-4 h-56">
        <ResponsiveContainer>
          <PieChart>
            <Tooltip
              contentStyle={{ background: "hsl(var(--popover, 240 6% 10%))", borderRadius: 8, fontSize: 12, border: "1px solid rgba(255,255,255,0.1)" }}
            />
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="transparent" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {data.map((d, i) => (
          <span key={d.name} className="inline-flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
            <span className="capitalize text-foreground">{d.name}</span> · {d.value}
          </span>
        ))}
      </div>
    </div>
  );
}
