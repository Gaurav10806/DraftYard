import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Github, Linkedin, Globe, X, Loader2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";
import type { PublicUser } from "@/lib/api";

interface ProfilePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: PublicUser | null;
  isLoading?: boolean;
  error?: string | null;
  notificationActivity?: string;
}

export function ProfilePreviewModal({
  open,
  onOpenChange,
  profile,
  isLoading = false,
  error = null,
  notificationActivity,
}: ProfilePreviewModalProps) {
  const navigate = useNavigate();

  const handleViewFullProfile = () => {
    if (profile?._id) {
      navigate({ to: "/profile", search: { userId: profile._id } });
      onOpenChange(false);
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm border-border/60 bg-card/95 backdrop-blur-xl sm:rounded-2xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !profile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm border-border/60 bg-card/95 backdrop-blur-xl sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">Profile</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground">{error || "Unable to load profile"}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const displayName = profile.fullName || profile.email || "User";
  const displayUsername = profile.username || profile.email?.split("@")[0] || "user";
  const displayInitials = getInitials(profile.fullName || profile.email, profile.email);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm border-border/60 bg-card/95 backdrop-blur-xl sm:rounded-2xl">
        <DialogHeader className="flex flex-row items-start justify-between">
          <DialogTitle className="font-display text-lg">Profile Preview</DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Avatar and basic info */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="relative">
              <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-violet-500/25 to-primary/20 ring-2 ring-background">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.avatar} alt={displayName} />
                  <AvatarFallback className="bg-transparent text-xl font-semibold text-primary">
                    {displayInitials}
                  </AvatarFallback>
                </Avatar>
              </div>
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
            </div>

            <div>
              <h3 className="font-display text-base font-semibold tracking-tight">{displayName}</h3>
              <p className="text-sm text-muted-foreground">@{displayUsername}</p>
            </div>

            {profile.bio && (
              <p className="text-xs leading-relaxed text-muted-foreground">{profile.bio}</p>
            )}
          </div>

          {/* Notification activity */}
          {notificationActivity && (
            <div className="rounded-lg border border-border/60 bg-background/50 p-3">
              <p className="text-[11px] font-medium text-muted-foreground">Activity</p>
              <p className="mt-1 text-sm text-foreground">{notificationActivity}</p>
            </div>
          )}

          {/* Social links */}
          {((profile.github && (typeof profile.github === "string" ? profile.github : profile.github.connected || profile.github.username || profile.github.profileUrl)) || profile.linkedin || profile.portfolio) && (
            <div className="flex flex-wrap justify-center gap-2">
              {profile.github && (() => {
                const ghObj = typeof profile.github === "object" ? profile.github : null;
                const ghUrl = ghObj
                  ? ghObj.profileUrl || (ghObj.username ? `https://github.com/${ghObj.username}` : null)
                  : `https://${profile.github}`;
                const ghDisplay = ghObj ? `@${ghObj.username || 'GitHub'}` : 'GitHub';

                return ghUrl ? (
                  <a
                    href={ghUrl.startsWith('http') ? ghUrl : `https://${ghUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border/40 bg-background/60 px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    <Github className="h-3.5 w-3.5" />
                    {ghDisplay}
                  </a>
                ) : null;
              })()}
              {profile.linkedin && (
                <a
                  href={`https://${profile.linkedin}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/40 bg-background/60 px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <Linkedin className="h-3.5 w-3.5" />
                  LinkedIn
                </a>
              )}
              {profile.portfolio && (
                <a
                  href={`https://${profile.portfolio}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/40 bg-background/60 px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <Globe className="h-3.5 w-3.5" />
                  Portfolio
                </a>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Close
          </Button>
          <Button
            onClick={handleViewFullProfile}
            className="flex-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:from-violet-600 hover:to-fuchsia-600"
          >
            View Full Profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
