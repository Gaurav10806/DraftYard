export type Draft = {
  _id?: string;
  projectName: string;
  oneLiner: string;
  domain: string;
  techStack: string[];
  teamSize: string;
  stageDied: string;
  whyItDied: string;
  timeSpent: { value: number; unit: string };
  salvageable: string;
  openForRevival: boolean;
  isAnonymous: boolean;
  deathCategory?: string | null;
  upvotes?: number;
};

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

export async function fetchFeed(): Promise<Draft[]> {
  const res = await fetch(`${API_BASE}/feed`);
  if (!res.ok) throw new Error("Failed to load feed");
  return res.json();
}

export type NewBurial = {
  projectName: string;
  oneLiner: string;
  domain: string;
  techStack: string[];
  teamSize: string;
  stageDied: string;
  whyItDied: string;
  timeSpent: { value: number; unit: string };
  salvageable: string;
  openForRevival: boolean;
  isAnonymous: boolean;
};

export async function createBurial(data: NewBurial): Promise<Draft> {
  const res = await fetch(`${API_BASE}/bury`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to submit draft");
  }
  return res.json();
}