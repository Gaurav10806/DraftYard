export type Draft = {
  _id?: string;
  projectName: string;
  oneLiner: string;
  domain: string;
  techStack: string[];
  teamSize: string;
  currentStage: string;
  failureReason: string;
  developmentMethodology?: string;
  timeSpent: { value: number; unit: string };
  isAnonymous: boolean;
  projectLink?: string;
  upvotes?: number;
  views?: number;
  bookmarks?: number;
  lastWorkedOn?: Date | null;
  ownerToken?: string | null;
  submittedBy?: string | null;
  raisedHands?: { name: string; message: string; contact: string; createdAt: string }[];
};

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("draftyard_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchFeed(): Promise<Draft[]> {
  const res = await fetch(`${API_BASE}/feed`);
  if (!res.ok) throw new Error("Failed to load feed");
  return res.json();
}

export async function fetchMyDrafts(): Promise<Draft[]> {
  const res = await fetch(`${API_BASE}/drafts/mine`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error("Failed to load your drafts");
  return res.json();
}

export type NewDraft = {
  projectName: string;
  oneLiner: string;
  domain: string;
  techStack: string[];
  teamSize: string;
  currentStage: string;
  failureReason: string;
  developmentMethodology?: string;
  timeSpent: { value: number; unit: string };
  projectLink: string;
  isAnonymous: boolean;
  ownerToken: string;
};

export async function createDraft(data: NewDraft): Promise<Draft> {
  const res = await fetch(`${API_BASE}/draft`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
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
  const res = await fetch(`${API_BASE}/draft/${id}/raise-hand`, {
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

// ===== Workspace APIs =====

export type WorkspaceData = {
  _id?: string;
  draftId: string;
  longDescription: string;
  featuresCompleted: string;
  currentBlockers: string;
  externalLinks: string;
  tasks: Array<{
    id: string;
    title: string;
    status: "Todo" | "In Progress" | "Done";
    priority: "High" | "Medium" | "Low";
    assignee: string;
  }>;
  milestones: Array<{
    id: string;
    label: string;
    progress: number;
  }>;
  attachments: string[];
  createdAt?: string;
  updatedAt?: string;
};

export async function createWorkspace(data: WorkspaceData): Promise<WorkspaceData> {
  const res = await fetch(`${API_BASE}/workspace`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to create workspace");
  }
  return res.json();
}

export async function fetchWorkspace(draftId: string): Promise<WorkspaceData | null> {
  try {
    const res = await fetch(`${API_BASE}/workspace/${draftId}`, {
      headers: { ...getAuthHeaders() },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Failed to load workspace");
    return res.json();
  } catch (err) {
    console.error("Failed to fetch workspace:", err);
    return null;
  }
}

export async function updateWorkspace(draftId: string, data: Partial<WorkspaceData>): Promise<WorkspaceData> {
  const res = await fetch(`${API_BASE}/workspace/${draftId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to update workspace");
  }
  return res.json();
}


// ===== Workspace Navigation Helper =====

/**
 * Navigate to workspace detail after checking if workspace exists.
 * If workspace exists, opens detail page. Otherwise, opens setup wizard.
 * This is the single source of truth for opening a workspace.
 */
export async function navigateToWorkspace(
  draftId: string,
  projectName: string,
  navigate: any,
  showError?: (msg: string) => void
): Promise<void> {
  try {
    const workspace = await fetchWorkspace(draftId);
    if (workspace) {
      navigate({ to: "/workspace", search: { draftId } });
    } else {
      // Slugify project name for setup page
      const slug = projectName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      navigate({ to: "/workspace-setup/$slug", params: { slug } });
    }
  } catch (err) {
    console.error("Failed to navigate to workspace:", err);
    if (showError) showError("Failed to navigate to workspace");
  }
}


// ===== Draft Insights Data Collection =====

export type InsightsData = {
  failureReason: string;
  developmentMethodology: string;
  timeSpent: { value: number; unit: string };
};

export async function updateDraftInsights(draftId: string, data: Partial<InsightsData>): Promise<Draft> {
  const res = await fetch(`${API_BASE}/draft/${draftId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to update draft insights");
  }
  return res.json();
}

// ===== User Profile Data =====

export type UserProfile = {
  _id?: string;
  fullName: string;
  username: string;
  bio?: string;
  avatar?: string;
  github?: string;
  linkedin?: string;
  portfolio?: string;
  createdAt?: string;
  updatedAt?: string;
};

export async function updateUserProfile(data: Partial<UserProfile>): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/user/profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to update profile");
  }
  return res.json();
}
