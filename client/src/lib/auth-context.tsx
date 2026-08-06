import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authApi, ApiError, type ApiUser } from "./api-client";

const TOKEN_KEY = "draftyard_token";

type AuthContextValue = {
  user: ApiUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<ApiUser>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithToken: (token: string) => Promise<ApiUser>;
  googleLogin: (data: { credential?: string; idToken?: string; code?: string; user?: any }) => Promise<ApiUser>;
  refreshUser: () => Promise<ApiUser | null>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On first load, if a token is saved, verify it and hydrate the user
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setIsLoading(false);
      return;
    }
    authApi
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string): Promise<ApiUser> => {
    const { token, user } = await authApi.login(email, password);
    localStorage.setItem(TOKEN_KEY, token);
    setUser(user);
    return user;
  };

  const register = async (name: string, email: string, password: string) => {
    const { token, user } = await authApi.register(name, email, password);
    localStorage.setItem(TOKEN_KEY, token);
    setUser(user);
  };

  const googleLogin = async (data: { credential?: string; idToken?: string; code?: string; user?: any }): Promise<ApiUser> => {
    const { token, user } = await authApi.googleAuth(data);
    localStorage.setItem(TOKEN_KEY, token);
    setUser(user);
    return user;
  };

  const loginWithToken = async (token: string): Promise<ApiUser> => {
    localStorage.setItem(TOKEN_KEY, token);
    const { user } = await authApi.me();
    setUser(user);
    return user;
  };

  const refreshUser = async (): Promise<ApiUser | null> => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setUser(null);
      return null;
    }
    try {
      const { user } = await authApi.me();
      setUser(user);
      return user;
    } catch {
      return null;
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("authToken");
    try {
      sessionStorage.clear();
    } catch (e) {
      // Ignore if sessionStorage access is restricted
    }
    try {
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
    } catch (e) {
      // Ignore cookie errors if restricted
    }
    setUser(null);
    window.location.replace("/");
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: !!user, login, register, loginWithToken, googleLogin, refreshUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

export { ApiError };
