import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { domainDistribution } from "@/lib/drafts-insights";

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

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
              contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
              itemStyle={{ color: "var(--foreground)" }}
            />
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="var(--card)" strokeWidth={2} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {data.map((d, i) => (
          <span key={d.name} className="inline-flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="capitalize text-foreground">{d.name}</span> · {d.value}
          </span>
        ))}
      </div>
    </div>
  );
}
