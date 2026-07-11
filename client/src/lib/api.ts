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
  projectLink?: string;
  openForRevival: boolean;
  isAnonymous: boolean;
  deathCategory?: string | null;
  upvotes?: number;
  ownerToken?: string | null;
  raisedHands?: { name: string; message: string; contact: string; createdAt: string }[];
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
  projectLink: string;
  openForRevival: boolean;
  isAnonymous: boolean;
  ownerToken: string;
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

export async function fetchRevivalBoard(): Promise<Draft[]> {
  const res = await fetch(`${API_BASE}/revival-board`);
  if (!res.ok) throw new Error("Failed to load revival board");
  return res.json();
}

export type RaiseHandInput = {
  id: string;
  name: string;
  message: string;
  contact: string;
};

export async function raiseHand({ id, ...body }: RaiseHandInput): Promise<Draft> {
  const res = await fetch(`${API_BASE}/bury/${id}/raise-hand`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to raise hand");
  }
  return res.json();
}