import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { whyDiedBuckets } from "@/lib/drafts-insights";

export function WhyDiedBar() {
  const data = whyDiedBuckets();
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="font-display text-sm font-semibold">Why drafts die</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">Top reasons across all drafts</p>
      <div className="mt-4 h-56">
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} />
            <YAxis type="category" dataKey="name" stroke="var(--muted-foreground)" fontSize={11} width={110} />
            <Tooltip
              contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
              cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            />
            <Bar dataKey="value" fill="var(--chart-1)" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
