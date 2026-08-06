import { useState } from "react";
import { Github, Loader2, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { githubApi } from "@/lib/api-client";
import { toast } from "sonner";

export function ConnectedAccountsCard() {
  const { user, refreshUser } = useAuth();
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const isConnected = user?.github?.connected;
  const username = user?.github?.username;
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

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const res = await githubApi.disconnect();
      if (res.success) {
        toast.success("GitHub account disconnected successfully.");
        await refreshUser();
      } else {
        toast.error(res.message || "Failed to disconnect GitHub account.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to disconnect GitHub account.");
    } finally {
      setDisconnecting(false);
    }
  };

  const formattedDate = connectedAt
    ? new Date(connectedAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h3 className="mb-5 font-display text-base font-semibold tracking-tight">
        Connected Accounts
      </h3>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 rounded-xl border border-border/80 bg-background/50 p-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-foreground">
              <Github className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-foreground">GitHub</span>
                {isConnected ? (
                  <Badge
                    variant="outline"
                    className="gap-1 border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    Not Connected
                  </Badge>
                )}
              </div>
              {isConnected ? (
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  <span>
                    Username: <strong className="text-foreground">@{username}</strong>
                  </span>
                  {formattedDate && (
                    <span>
                      Connected: <strong className="text-foreground">{formattedDate}</strong>
                    </span>
                  )}
                </div>
              ) : (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Connect your GitHub account to enable developer features.
                </p>
              )}
            </div>
          </div>

          <div>
            {!isConnected ? (
              <Button
                size="sm"
                onClick={handleConnect}
                disabled={connecting}
                className="gap-2 rounded-xl text-xs font-medium px-4 shadow-sm"
              >
                {connecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Github className="h-4 w-4" />
                )}
                Connect GitHub
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="gap-1.5 rounded-xl border-destructive/30 text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive px-3.5"
              >
                {disconnecting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Unlink className="h-3.5 w-3.5" />
                )}
                Disconnect
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
