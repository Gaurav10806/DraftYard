import { drafts, type Draft } from "@/data/drafts";

export function getDrafts(): Draft[] {
  return drafts;
}

const STAGE_PROGRESS: Record<string, number> = {
  Idea: 8,
  Planning: 18,
  Prototype: 30,
  "50% done": 50,
  "Backend Development": 55,
  "UI/UX Design": 40,
  "Almost complete": 82,
  Shipped: 100,
};

export function stageToProgress(stage: string): number {
  if (STAGE_PROGRESS[stage] != null) return STAGE_PROGRESS[stage];
  const s = stage.toLowerCase();
  if (s.includes("idea")) return 10;
  if (s.includes("plan")) return 20;
  if (s.includes("proto")) return 30;
  if (s.includes("50")) return 50;
  if (s.includes("almost")) return 82;
  if (s.includes("ship")) return 100;
  return 35;
}

export function domainDistribution(list: Draft[] = drafts) {
  const map = new Map<string, number>();
  for (const d of list) map.set(d.domain, (map.get(d.domain) ?? 0) + 1);
  return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

const REASON_BUCKETS: Array<{ label: string; keywords: string[] }> = [
  { label: "Lost motivation", keywords: ["motivation", "interest", "boring", "burnout", "burned"] },
  { label: "Scope creep", keywords: ["scope", "feature", "kept adding"] },
  { label: "Team fell apart", keywords: ["team", "cofounder", "co-founder", "stopped showing"] },
  { label: "Ran out of time", keywords: ["time", "exams", "semester", "job", "internship", "deadline"] },
  { label: "Technical blocker", keywords: ["accuracy", "bug", "technical", "api", "cost", "gpu"] },
  { label: "No users / market", keywords: ["users", "market", "traction", "no one"] },
];

export function whyDiedBuckets(list: Draft[] = drafts) {
  const counts = new Map<string, number>(REASON_BUCKETS.map((b) => [b.label, 0]));
  let other = 0;
  for (const d of list) {
    const why = d.whyItDied.toLowerCase();
    const bucket = REASON_BUCKETS.find((b) => b.keywords.some((k) => why.includes(k)));
    if (bucket) counts.set(bucket.label, (counts.get(bucket.label) ?? 0) + 1);
    else other++;
  }
  const arr = Array.from(counts, ([name, value]) => ({ name, value }));
  if (other > 0) arr.push({ name: "Other", value: other });
  return arr.sort((a, b) => b.value - a.value).slice(0, 6);
}

export function topTechStacks(list: Draft[] = drafts, limit = 8) {
  const map = new Map<string, number>();
  for (const d of list) for (const t of d.techStack) map.set(t, (map.get(t) ?? 0) + 1);
  return Array.from(map, ([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export function teamSizeVsStage(list: Draft[] = drafts) {
  const sizes = ["solo", "2-3", "4+"];
  const stages = Array.from(new Set(list.map((d) => d.stageDied)));
  return stages.map((stage) => {
    const row: Record<string, string | number> = { stage };
    for (const size of sizes) row[size] = list.filter((d) => d.stageDied === stage && d.teamSize === size).length;
    return row;
  });
}

export function summaryStats(list: Draft[] = drafts) {
  const revival = list.filter((d) => d.openForRevival).length;
  const domains = domainDistribution(list);
  const totalDays = list.reduce((sum, d) => {
    const m = d.timeSpent.unit === "months" ? 30 : d.timeSpent.unit === "weeks" ? 7 : 1;
    return sum + d.timeSpent.value * m;
  }, 0);
  return {
    total: list.length,
    revivalPct: Math.round((revival / list.length) * 100),
    topDomain: domains[0]?.name ?? "—",
    avgWeeks: Math.round(totalDays / list.length / 7),
  };
}
