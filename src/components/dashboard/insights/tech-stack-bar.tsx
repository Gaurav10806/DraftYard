import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { topTechStacks } from "@/lib/drafts-insights";

export function TechStackBar() {
  const data = topTechStacks();
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="font-display text-sm font-semibold">Most-used tech</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">Top stacks across drafts</p>
      <div className="mt-4 h-56">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ left: -8 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} interval={0} angle={-25} textAnchor="end" height={50} />
            <YAxis stroke="var(--muted-foreground)" fontSize={11} />
            <Tooltip
              contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
              cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            />
            <Bar dataKey="value" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
