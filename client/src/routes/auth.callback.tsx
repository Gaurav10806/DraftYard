import { useEffect } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false });
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token") || (search as any)?.token;
    const error = params.get("error") || (search as any)?.error;

    if (error) {
      toast.error(decodeURIComponent(error));
      navigate({ to: "/login" });
      return;
    }

    if (token) {
      loginWithToken(token)
        .then((user) => {
          toast.success(`Welcome back, ${user.name}!`);
          const isAdmin = user?.role === "admin" || user?.email?.toLowerCase() === "draftadmin@gmail.com";
          navigate({ to: isAdmin ? "/admin-users" : "/dashboard" });
        })
        .catch((err) => {
          toast.error(err instanceof Error ? err.message : "Authentication failed");
          navigate({ to: "/login" });
        });
    } else {
      navigate({ to: "/login" });
    }
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">Completing Google authentication...</p>
      </div>
    </div>
  );
}
