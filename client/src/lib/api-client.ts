const API_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/api$/, "")
  : "http://localhost:5000";

export type ApiUser = {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  avatar?: string;
  googleId?: string;
  provider?: "local" | "google";
  
  emailVerified?: boolean;
  lastLogin?: string;
  github?: {
    connected?: boolean;
    githubId?: string;
    username?: string;
    displayName?: string;
    avatarUrl?: string;
    profileUrl?: string;
    connectedAt?: string | Date;
  };
  createdAt: string;
  updatedAt?: string;
};

export type AuthResponse = {
  token: string;
  user: ApiUser;
};

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("draftyard_token") : null;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(data.error || "Something went wrong", res.status);
  }

  return data as T;
}

export const authApi = {
  register: (name: string, email: string, password: string) =>
    request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email: string, password: string) =>
    request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
 
  googleAuth: (data: { credential?: string; idToken?: string; code?: string; user?: any }) =>
    request<AuthResponse>("/api/auth/google", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getGoogleAuthUrl: () => request<{ url: string }>("/api/auth/google/url"),

  me: () => request<{ user: ApiUser }>("/api/auth/me"),
};

export const githubApi = {
  getAuthUrl: () => request<{ url: string }>("/auth/github"),
  getStatus: () =>
    request<{
      connected: boolean;
      githubId?: string;
      username?: string;
      displayName?: string;
      avatarUrl?: string;
      profileUrl?: string;
      connectedAt?: string;
    }>("/auth/github/status"),
  disconnect: () =>
    request<{
      success: boolean;
      message: string;
      github: {
        connected: boolean;
      };
    }>("/auth/github/disconnect", {
      method: "POST",
    }),
  getRepos: () =>
    request<
      Array<{
        id: number | string;
        name: string;
        description: string;
        html_url: string;
        language: string;
        languages_url: string;
        topics: string[];
        private: boolean;
        default_branch: string;
        updated_at: string;
        owner: string;
        stargazers_count: number;
      }>
    >("/github/repos"),
  importRepo: (repoId: number | string) =>
    request<{
      success: boolean;
      draft: any;
      workspace: any;
      error?: string;
      alreadyImported?: boolean;
      draftId?: string;
    }>("/github/import", {
      method: "POST",
      body: JSON.stringify({ repoId }),
    }),
};

export { ApiError };
