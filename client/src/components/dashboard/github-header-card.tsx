import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Github, Loader2, ExternalLink, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import { githubApi } from "@/lib/api-client";
import { toast } from "sonner";

export function GithubHeaderCard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [connecting, setConnecting] = useState(false);

  const isConnected = user?.github?.connected;
  const username = user?.github?.username;
  const avatarUrl = user?.github?.avatarUrl;
  const connectedAt = user?.github?.connectedAt;

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const { url } = await githubApi.getAuthUrl();
      if (url) {
        window.location.href = url;
      } else {
        toast.error("Failed to retrieve GitHub authorization URL.");
        setConnecting(false);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to initiate GitHub OAuth");
      setConnecting(false);
    }
  };

  const handleManage = () => {
    navigate({ to: "/settings" });
  };

  const formattedDate = connectedAt
    ? new Date(connectedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="hidden lg:flex items-center gap-3.5 rounded-2xl border border-border/80 bg-card/60 px-4 py-2.5 shadow-sm backdrop-blur-sm max-w-md w-full shrink-0">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-foreground">
        <Github className="h-5 w-5" />
      </div>

      {!isConnected ? (
        <div className="flex flex-1 items-center justify-between gap-3 min-w-0">
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-semibold text-foreground tracking-tight">GitHub Integration</h4>
            <p className="truncate text-[11px] text-muted-foreground leading-snug">
              Connect your account for future repo import & AI features
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleConnect}
            disabled={connecting}
            className="h-8 shrink-0 gap-1.5 rounded-xl text-xs font-medium px-3 shadow-none"
          >
            {connecting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Github className="h-3.5 w-3.5" />
            )}
            Connect
          </Button>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-between gap-3 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar className="h-7 w-7 ring-1 ring-border shrink-0">
              <AvatarImage src={avatarUrl || ""} alt={username || "GitHub user"} />
              <AvatarFallback className="text-[10px]">
                {username ? username.slice(0, 2).toUpperCase() : "GH"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-foreground truncate">@{username}</span>
                <Badge
                  variant="outline"
                  className="h-4 gap-1 border-emerald-500/30 bg-emerald-500/10 px-1.5 text-[9px] font-medium text-emerald-600 dark:text-emerald-400"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Connected
                </Badge>
              </div>
              {formattedDate && (
                <p className="text-[10px] text-muted-foreground truncate">
                  Connected {formattedDate}
                </p>
              )}
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleManage}
            className="h-8 shrink-0 text-xs font-medium rounded-xl border-border px-3 hover:bg-accent"
          >
            Manage
          </Button>
        </div>
      )}
    </div>
  );
}
