export type Draft = {
  _id?: string;
  projectName: string;
  oneLiner: string;
  description?: string;
  category?: string;
  domain: string;
  techStack: string[];
  teamSize: string;
  currentStage: string;
  status?: string;
  failureReason: string;
  developmentMethodology?: string;
  timeSpent: { value: number; unit: string };
  estimatedTime?: string;
  difficulty?: string;
  isAnonymous: boolean;
  projectLink?: string;
  upvotes?: number;
  likes?: number;
  liked?: boolean;
  views?: number;
  bookmarks?: number;
  bookmarked?: boolean;
  lastWorkedOn?: Date | null;
  ownerToken?: string | null;
  submittedBy?: {
    _id?: string;
    name?: string;
    username?: string;
    avatar?: string;
  } | null;
  collaborators?: Array<{
    _id?: string;
    name?: string;
    username?: string;
    avatar?: string;
  }>;
  tags?: string[];
  openForRevival?: boolean;
  raisedHands?: {
    name: string;
    message: string;
    contact: string;
    userId?: string | null;
    createdAt: string;
    updatedAt: string;
  }[];
  revivalScore: number;
  createdAt?: string;
  updatedAt?: string;
};

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("draftyard_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchFeed(filters?: {
  search?: string;
  category?: string;
  techStack?: string[];
  stage?: string[];
  status?: string;
  openForRevival?: boolean;
  sort?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: Draft[]; pagination: { page: number; limit: number; total: number; pages: number; hasMore: boolean } }> {
  const params = new URLSearchParams();
  
  if (filters?.search) params.append('search', filters.search);
  if (filters?.category) params.append('category', filters.category);
  if (filters?.techStack?.length) {
    filters.techStack.forEach(tech => params.append('techStack', tech));
  }
  if (filters?.stage?.length) {
    filters.stage.forEach(s => params.append('stage', s));
  }
  if (filters?.status) params.append('status', filters.status);
  if (filters?.openForRevival) params.append('openForRevival', 'true');
  if (filters?.sort) params.append('sort', filters.sort);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const queryString = params.toString();
  const url = queryString ? `${API_BASE}/feed?${queryString}` : `${API_BASE}/feed`;
  
  const res = await fetch(url);
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

export async function fetchUserProfile(): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/user/profile`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to fetch user profile");
  }
  return res.json();
}

// ===== Follow / Unfollow =====

export type PublicUser = {
  _id: string;
  fullName: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
};

export async function followUser(userId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/user/follow/${userId}`, {
    method: "POST",
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to follow user");
  }
}

export async function unfollowUser(userId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/user/unfollow/${userId}`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to unfollow user");
  }
}

export async function fetchFollowers(): Promise<PublicUser[]> {
  const res = await fetch(`${API_BASE}/user/followers`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error("Failed to fetch followers");
  return res.json();
}

export async function fetchFollowing(): Promise<PublicUser[]> {
  const res = await fetch(`${API_BASE}/user/following`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error("Failed to fetch following");
  return res.json();
}

export async function searchUsers(query: string): Promise<PublicUser[]> {
  const res = await fetch(`${API_BASE}/users/search?query=${encodeURIComponent(query)}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error("Failed to search users");
  return res.json();
}

export async function fetchUserSuggestions(): Promise<PublicUser[]> {
  const res = await fetch(`${API_BASE}/users/suggestions`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error("Failed to fetch user suggestions");
  return res.json();
}

// ===== Skills =====

export async function addSkill(skill: string): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/user/skills`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ skill }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to add skill");
  }
  return res.json();
}

export async function removeSkill(skill: string): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/user/skills`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ skill }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to remove skill");
  }
  return res.json();
}

// ===== Draft Actions =====

export async function likeDraft(draftId: string): Promise<Draft> {
  const res = await fetch(`${API_BASE}/draft/${draftId}/like`, {
    method: "PATCH",
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to like draft");
  }
  return res.json();
}

export async function bookmarkDraft(draftId: string): Promise<Draft> {
  const res = await fetch(`${API_BASE}/draft/${draftId}/bookmark`, {
    method: "PATCH",
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to bookmark draft");
  }
  return res.json();
}

export async function recordView(draftId: string, sessionId: string): Promise<Draft> {
  const res = await fetch(`${API_BASE}/draft/${draftId}/view`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ sessionId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to record view");
  }
  return res.json();
}

export async function raiseHandOnDraft(draftId: string, data: { name: string; message: string; contact: string }): Promise<Draft> {
  const res = await fetch(`${API_BASE}/draft/${draftId}/raise-hand`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to raise hand");
  }
  return res.json();
}

export async function toggleOpenForRevival(draftId: string): Promise<Draft> {
  const res = await fetch(`${API_BASE}/draft/${draftId}/open`, {
    method: "PATCH",
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to toggle open for revival");
  }
  return res.json();
}

export async function getDraftStatus(draftId: string): Promise<{ liked: boolean; bookmarked: boolean; raised: boolean }> {
  const res = await fetch(`${API_BASE}/draft/${draftId}/status`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) {
    return { liked: false, bookmarked: false, raised: false };
  }
  return res.json();
}

export async function leaveCollaboration(draftId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/draft/${draftId}/collaborate`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to leave collaboration");
  }
}

export async function fetchUserCollaborations(): Promise<Draft[]> {
  const res = await fetch(`${API_BASE}/user/collaborations`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error("Failed to fetch collaborations");
  return res.json();
}
// ===== User Insights =====

export type UserInsightsData = {
  healthScore: number;
  stallRisk: number;
  completionProbability: number;
  improvements: Array<{
    label: string;
    impact: string;
    description: string;
  }>;
  similarProjects: Array<{
    name: string;
    success: boolean;
    timeToCompletion?: string;
    reason?: string;
  }>;
  revivalPotential: number;
  totalDrafts: number;
};

export async function fetchUserInsights(): Promise<UserInsightsData> {
  const res = await fetch(`${API_BASE}/user/insights`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to load user insights");
  }
  return res.json();
}

// ===== Idea Matching (Django ML backend) =====

const ML_API_BASE = import.meta.env.VITE_ML_API_URL ?? "http://localhost:8000";

export type DraftMatch = {
  id: string;
  projectName: string;
  oneLiner: string;
  domain: string;
  techStack: string[];
  currentStage: string;
  failureReason: string;
  similarity: number;
  similarityPct: number;
  priority: "High" | "Medium" | "Low";
  matchedKeywords: string[];
};

export type IdeaMatchResult = {
  query: string;
  matchCount: number;
  matches: DraftMatch[];
};

export async function matchIdea(input: {
  projectName?: string;
  pitch: string;
  context: string;
}): Promise<IdeaMatchResult> {
  const res = await fetch(`${ML_API_BASE}/api/ml/idea-match/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to match idea against existing drafts");
  }

  return res.json();
}

// ===== AI Idea Analysis =====

export type AiIdeaAnalysis = {
  score: number;
  verdict: "Worth Building" | "Needs Refinement" | "Reconsider";
  summary: string;
  feasibility: { label: "High" | "Medium" | "Low"; note: string };
  competition: { label: "High" | "Medium" | "Low"; note: string };
  complexity: { label: "High" | "Medium" | "Low"; note: string };
  scalability: { label: "High" | "Medium" | "Low"; note: string };
  market: { headline: string; note: string };
  recommendations: string[];
  techStack: {
    frontend: string;
    backend: string;
    database: string;
    ai: string;
    hosting: string;
  };
  roadmap: {
    week: string;
    label: string;
  }[];
  finalNote: string;
};

export async function getIdeaAnalysis(input: {
  projectName?: string;
  pitch: string;
  context: string;
}): Promise<AiIdeaAnalysis> {
  const res = await fetch(`${ML_API_BASE}/api/ml/idea-analysis/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to get AI analysis for this idea");
  }

  const data = await res.json();
  return data.analysis;
}