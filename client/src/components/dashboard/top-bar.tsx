import { useEffect, useRef, useState } from "react";
import {
  Bell,
  LogOut,
  Search,
  Settings,
  UserCircle,
  CheckCircle,
  XCircle,
  Hand,
  Clock,
  Mail,
  User as UserIcon,
  Loader2,
  Check,
  X,
  AlertCircle,
  AlertTriangle,
  Trash2,
  MapPin,
  Github,
  Linkedin,
  Globe,
  FolderKanban,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ProfilePreviewModal } from "@/components/ProfilePreviewModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { slugify } from "@/routes/project.$slug";
import { useAuth } from "@/lib/auth-context";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  respondToNotification,
  respondToWorkspaceInvite,
  fetchGlobalSearch,
  fetchPublicSettings,
  fetchPublicUserProfile,
  type AppNotification,
  type SearchResultDraft,
} from "@/lib/api";

function formatTimeAgo(ts?: string) {
  if (!ts) return "Just now";
  const ms = new Date(ts).getTime();
  if (isNaN(ms)) return "Recently";
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

interface TopBarProps {
  showGreeting?: boolean;
}

export function TopBar({ showGreeting = true }: TopBarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [greeting, setGreeting] = useState("Good afternoon");
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [selectedNotif, setSelectedNotif] = useState<AppNotification | null>(null);
  const [processingAction, setProcessingAction] = useState<"accept" | "reject" | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResultDraft[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showProfilePreview, setShowProfilePreview] = useState(false);
  const [profilePreviewData, setProfilePreviewData] = useState<any | null>(null);
  const [profilePreviewLoading, setProfilePreviewLoading] = useState(false);
  const [profilePreviewError, setProfilePreviewError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: publicSettings } = useQuery({
    queryKey: ["public-settings"],
    queryFn: fetchPublicSettings,
    refetchInterval: 15000,
  });

  const displayName = user?.name || user?.email?.split("@")[0] || "there";
   const initials = getInitials(user?.name, user?.email);
  
   useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening");
  }, []);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (_) {
      // Silently fail if unauthenticated / network offline
    }
  };

  const loadProfilePreview = async (notif: AppNotification | null) => {
    if (!notif?.sender?._id) {
      setProfilePreviewData(null);
      setProfilePreviewError(null);
      return;
    }

    setProfilePreviewLoading(true);
    setProfilePreviewError(null);
    try {
      const profile = await fetchPublicUserProfile(notif.sender._id);
      setProfilePreviewData(profile);
    } catch (error) {
      setProfilePreviewError(
        error instanceof Error ? error.message : "Could not load profile details"
      );
      setProfilePreviewData(null);
    } finally {
      setProfilePreviewLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleOpenDropdown = async (open: boolean) => {
    if (open && unreadCount > 0) {
      try {
        await markAllNotificationsRead();
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      } catch (_) {}
    }
  };

  const handleSelectNotification = async (n: AppNotification) => {
    setSelectedNotif(n);
    setProfilePreviewData(null);
    setProfilePreviewError(null);
    if (!n.read) {
      try {
        await markNotificationRead(n._id);
        setNotifications((prev) =>
          prev.map((item) => (item._id === n._id ? { ...item, read: true } : item))
        );
      } catch (_) {}
    }
  };

  const handleRespond = async (action: "accept" | "reject") => {
    if (!selectedNotif) return;
    setProcessingAction(action);
    try {
      const result = await respondToNotification(selectedNotif._id, action);
      toast.success(
        action === "accept"
          ? "Request accepted! Collaborator added to project."
          : "Request rejected."
      );
      setSelectedNotif(result.notification);
      await loadNotifications();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to ${action} request`);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleWorkspaceInviteRespond = async (action: "accept" | "decline") => {
    if (!selectedNotif) return;
    setProcessingAction(action as any);
    try {
      const result = await respondToWorkspaceInvite(selectedNotif._id, action);
      toast.success(result.message);
      // Update the local notification state to reflect the new status
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === selectedNotif._id
            ? { ...n, status: action === "accept" ? "accepted" : "rejected", read: true }
            : n
        )
      );
      setSelectedNotif((prev) =>
        prev ? { ...prev, status: action === "accept" ? "accepted" : "rejected", read: true } : prev
      );
      await loadNotifications();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to ${action} invitation`);
    } finally {
      setProcessingAction(null);
    }
  };
  // ⌘K / Ctrl+K focuses the search box
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // State for global search results
  const [globalSearchResults, setGlobalSearchResults] = useState<{ drafts: any[]; users: any[]; technologies: any[] }>({ drafts: [], users: [], technologies: [] });

  // Updated effect to use global search
  useEffect(() => {
    if (!query.trim()) {
      setGlobalSearchResults({ drafts: [], users: [], technologies: [] });
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const timer = setTimeout(async () => {
      try {
        const data = await fetchGlobalSearch(query);
        // Deduplicate by _id across categories (if any overlap)
        const uniqueDrafts = Array.from(new Map(data.drafts.map((d: any) => [d._id, d])).values());
        const uniqueUsers = Array.from(new Map(data.users.map((u: any) => [u._id, u])).values());
        const uniqueTechs = Array.from(new Map(data.technologies.map((t: any) => [t._id, t])).values());
        setGlobalSearchResults({ drafts: uniqueDrafts, users: uniqueUsers, technologies: uniqueTechs });
      } catch (_) {
        setGlobalSearchResults({ drafts: [], users: [], technologies: [] });
      } finally {
        setIsSearching(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  const goToDraft = (target: SearchResultDraft) => {
  navigate({
    to: "/project/$slug",
    params: { slug: target._id || slugify(target.projectName) },
  });
  setQuery("");
  setFocused(false);
  inputRef.current?.blur();
};

  const submitSearch = () => {
    if (globalSearchResults.drafts.length > 0) {
      goToDraft(globalSearchResults.drafts[0]);
    } else if (query.trim()) {
      toast(`No drafts found for "${query.trim()}"`);
    }
  };

  return (
    <div className="flex flex-col w-full">
      {/* Maintenance Mode Notice */}
      {publicSettings?.maintenanceMode && (
        <div className="flex items-center justify-center gap-2 bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{publicSettings.maintenanceNotice || "Platform is currently in maintenance mode. Core services are read-only."}</span>
        </div>
      )}

      {/* Active Global System Announcement Banner */}
      {publicSettings?.announcementActive && publicSettings.announcementText && (
        <div
          className={`flex items-center justify-center gap-2 border-b px-4 py-2 text-xs font-medium ${
            publicSettings.announcementType === "warning"
              ? "border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400"
              : publicSettings.announcementType === "destructive"
              ? "border-rose-500/30 bg-rose-500/15 text-rose-600 dark:text-rose-400"
              : publicSettings.announcementType === "success"
              ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : "border-primary/30 bg-primary/10 text-primary"
          }`}
        >
          <Bell className="h-3.5 w-3.5 shrink-0" />
          <span>{publicSettings.announcementText}</span>
        </div>
      )}

      <header className="flex flex-col gap-4 border-b border-border/60 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
        <SidebarTrigger />
        {showGreeting && (
          <div>
            <h1 className="font-display text-[26px] font-semibold tracking-tight">
              {greeting}, {displayName}! <span className="inline-block">👋</span>
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Let's turn your ideas into incredible projects.
            </p>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="group relative w-72 transition-[width] duration-[220ms] ease-out focus-within:w-96 focus-within:max-w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 120)}
            onKeyDown={(e) => e.key === "Enter" && submitSearch()}
            placeholder="Search drafts, people, resources…"
            className="rounded-full bg-card pl-9 pr-14 transition-shadow duration-[220ms] focus-visible:shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_15%,transparent)]"
          />
          {!query && (
            <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              ⌘K
            </kbd>
          )}

          {focused && query.trim() && (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
              {isSearching ? (
                <div className="flex items-center gap-2 px-3 py-3 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  Searching database...
                </div>
              ) : (globalSearchResults.drafts.length > 0 || globalSearchResults.users.length > 0 || globalSearchResults.technologies.length > 0) ? (
                <div className="max-h-[400px] overflow-y-auto">
                  {globalSearchResults.drafts.length > 0 && (
                    <div className="py-2">
                      <div className="px-3 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Drafts</div>
                      {globalSearchResults.drafts.map((d) => (
                        <button
                          key={`draft-${d._id}`}
                          onMouseDown={() => goToDraft(d)}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-muted/60"
                        >
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/15 text-[10px] font-bold text-primary">
                            {d.projectName?.slice(0, 2) || d.title?.slice(0, 2) || ''}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{d.projectName || d.title}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {d.oneLiner || d.description}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {globalSearchResults.users.length > 0 && (
                    <div className="py-2 border-t border-border">
                      <div className="px-3 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Users</div>
                      {globalSearchResults.users.map((u) => (
                        <button
                          key={`user-${u._id}`}
                          onMouseDown={() => {
                            setQuery("");
                            setFocused(false);
                            inputRef.current?.blur();
                            // Use existing profile route; pass user ID via search param for public profile view
                            navigate({ to: "/profile", search: { userId: u._id } });
                          }}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-muted/60"
                        >
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground overflow-hidden">
                            {u.avatar ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" /> : (u.name?.slice(0, 2) || '')}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{u.name}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              @{u.username}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {globalSearchResults.technologies.length > 0 && (
                    <div className="py-2 border-t border-border">
                      <div className="px-3 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Technologies</div>
                      {globalSearchResults.technologies.map((t) => (
                        <button
                          key={`tech-${t._id}`}
                          onMouseDown={() => {
                            setQuery("");
                            setFocused(false);
                            inputRef.current?.blur();
                            // Use full technology name for navigation; preserve case
                            navigate({ to: "/stack-intelligence", search: { tech: t.name } });
                          }}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-muted/60"
                        >
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded bg-accent text-[10px] font-bold text-accent-foreground">
                            #
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{t.name}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="px-3 py-3 text-xs text-muted-foreground">
                  No results found matching "<span className="font-medium text-foreground">{query}</span>"
                </div>
              )}
            </div>
          )}
        </div>

        <ThemeToggle />

        <DropdownMenu onOpenChange={handleOpenDropdown}>
          <DropdownMenuTrigger asChild>
            <button className="relative grid h-9 w-9 place-items-center rounded-full border border-border bg-card">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-semibold text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 max-h-[420px] overflow-y-auto">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {notifications.length > 0 && (
                <span className="text-[11px] font-normal text-muted-foreground">
                  {notifications.length} total
                </span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length > 0 ? (
              notifications.map((n) => {
                const title =
                  n.type === "join_request"
                    ? `Request to Join: ${n.draftName}`
                    : n.type === "request_accepted"
                    ? `Accepted: ${n.draftName}`
                    : n.type === "request_rejected"
                    ? `Rejected: ${n.draftName}`
                    : n.type === "warning"
                    ? `⚠️ Administrative Warning`
                    : n.type === "draft_deleted"
                    ? `🚨 Draft Removed: ${n.draftName}`
                    : n.draftName || "System Notification";

                const detail =
                  n.type === "join_request"
                    ? `${n.details?.name || n.senderName || "Someone"} raised a hand / requested to join`
                    : n.type === "warning"
                    ? n.details?.message || "You have received an administrative warning."
                    : n.type === "draft_deleted"
                    ? `Reason: ${n.details?.message || "Policy violation"}`
                    : n.details?.message || "Notification update";

                return (
                  <DropdownMenuItem
                    key={n._id}
                    onClick={() => handleSelectNotification(n)}
                    className={`flex flex-col items-start gap-1 whitespace-normal py-2.5 cursor-pointer ${
                      !n.read ? "bg-primary/5 font-medium" : ""
                    }`}
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className={`text-sm font-semibold truncate ${n.type === "warning" ? "text-amber-500" : n.type === "draft_deleted" ? "text-red-500" : ""}`}>{title}</span>
                      <span className="text-[10px] shrink-0 text-muted-foreground">
                        {formatTimeAgo(n.createdAt)}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground line-clamp-2">{detail}</span>
                    {n.type === "join_request" && (
                      <div className="mt-1 flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={`text-[10px] py-0 px-1.5 font-medium ${
                            n.status === "accepted"
                              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                              : n.status === "rejected"
                              ? "border-rose-500/40 bg-rose-500/10 text-rose-500"
                              : "border-amber-500/40 bg-amber-500/10 text-amber-500"
                          }`}
                        >
                          {n.status === "accepted"
                            ? "Accepted"
                            : n.status === "rejected"
                            ? "Rejected"
                            : "Pending Action"}
                        </Badge>
                      </div>
                    )}
                  </DropdownMenuItem>
                );
              })
            ) : (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No notifications yet
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button>
              <Avatar className="h-9 w-9 ring-2 ring-border transition-shadow hover:ring-primary/50">
                <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="truncate">{user?.name || "Account"}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
              <UserCircle className="mr-2 h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
              <Settings className="mr-2 h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-rose-500 focus:text-rose-500">
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Notification Details & Decision Modal */}
      {selectedNotif && (
        <Dialog open={Boolean(selectedNotif)} onOpenChange={(o) => !o && setSelectedNotif(null)}>
          <DialogContent className="max-w-md border-border/80 bg-card p-6 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-display text-base">
                {selectedNotif.type === "warning" ? (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                ) : selectedNotif.type === "draft_deleted" ? (
                  <Trash2 className="h-4 w-4 text-red-500" />
                ) : (
                  <Hand className="h-4 w-4 text-primary" />
                )}
                {selectedNotif.type === "join_request"
                  ? "Join Request Details"
                  : selectedNotif.type === "warning"
                  ? "Administrative Warning"
                  : selectedNotif.type === "draft_deleted"
                  ? "Draft Removal Notice"
                  : "Notification Details"}
              </DialogTitle>
              {selectedNotif.draftName && (
                <DialogDescription>
                  Project: <strong className="text-foreground">{selectedNotif.draftName}</strong>
                </DialogDescription>
              )}
            </DialogHeader>

            <div className="mt-4 space-y-4 text-sm">
              {/* Applicant Info */}
              <div className="rounded-xl border border-border/60 bg-muted/40 p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="h-9 w-9 shrink-0 ring-1 ring-border">
                      <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                        {getInitials(selectedNotif.details?.name || selectedNotif.senderName || "User")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-foreground block text-xs sm:text-sm truncate">
                        {selectedNotif.details?.name || selectedNotif.senderName || "Anonymous User"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">Community Builder</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        await loadProfilePreview(selectedNotif);
                        setShowProfilePreview(true);
                      }}
                      className="h-7 text-xs gap-1.5 rounded-full border-primary/40 text-primary hover:bg-primary/10 font-medium px-2.5"
                    >
                      <UserIcon className="h-3.5 w-3.5" />
                      View Profile
                    </Button>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        selectedNotif.status === "accepted"
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                          : selectedNotif.status === "rejected"
                          ? "border-rose-500/40 bg-rose-500/10 text-rose-500"
                          : "border-amber-500/40 bg-amber-500/10 text-amber-500"
                      }`}
                    >
                      {selectedNotif.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {selectedNotif.details?.contact && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t border-border/40">
                    <Mail className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                    <span className="truncate">{selectedNotif.details.contact}</span>
                  </div>
                )}
              </div>

              {/* Reason / Message */}
              {selectedNotif.details?.message && (
                <div>
                  <span className="block font-medium text-muted-foreground text-xs uppercase tracking-wider mb-1">
                    Why they want to join
                  </span>
                  <p className="rounded-lg border border-border/60 bg-background/60 p-3 text-foreground leading-relaxed text-xs">
                    {selectedNotif.details.message}
                  </p>
                </div>
              )}

              {/* Skills */}
              {selectedNotif.details?.skills && selectedNotif.details.skills.length > 0 && (
                <div>
                  <span className="block font-medium text-muted-foreground text-xs uppercase tracking-wider mb-1.5">
                    Relevant Skills
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedNotif.details.skills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="text-[11px] rounded-full px-2.5 py-0.5"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Time Commitment */}
              {selectedNotif.details?.estimatedTime && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Time Commitment: <strong className="text-foreground">{selectedNotif.details.estimatedTime}</strong></span>
                </div>
              )}
            </div>

            {/* Decision Actions for Pending Requests */}
            <DialogFooter className="mt-6 flex gap-2 sm:justify-end">
              {selectedNotif.type === "join_request" && selectedNotif.status === "pending" ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleRespond("reject")}
                    disabled={Boolean(processingAction)}
                    className="border-rose-500/40 text-rose-500 hover:bg-rose-500/10 hover:text-rose-500 rounded-full px-4"
                  >
                    {processingAction === "reject" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <X className="mr-1.5 h-3.5 w-3.5" /> Reject
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleRespond("accept")}
                    disabled={Boolean(processingAction)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-5"
                  >
                    {processingAction === "accept" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="mr-1.5 h-3.5 w-3.5" /> Accept
                      </>
                    )}
                  </Button>
                </>
             ) : selectedNotif?.type === "workspace_invite" &&
     selectedNotif?.status === "pending" ? (
  <>
    <Button
      variant="outline"
      onClick={() => handleWorkspaceInviteRespond("decline")}
      disabled={Boolean(processingAction)}
      className="border-rose-500/40 text-rose-500 hover:bg-rose-500/10 hover:text-rose-500 rounded-full px-4"
    >
      {processingAction === ("decline" as any) ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <X className="mr-1.5 h-3.5 w-3.5" /> Decline
        </>
      )}
    </Button>

    <Button
      onClick={() => handleWorkspaceInviteRespond("accept")}
      disabled={Boolean(processingAction)}
      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-5"
    >
      {processingAction === ("accept" as any) ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <Check className="mr-1.5 h-3.5 w-3.5" /> Accept Invite
        </>
      )}
    </Button>
  </>
) : (
  <Button
    variant="outline"
    onClick={() => setSelectedNotif(null)}
    className="rounded-full px-5"
  >
    Close
  </Button>
)}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Profile Preview Modal - shows compact profile from notifications */}
      <ProfilePreviewModal
        open={showProfilePreview}
        onOpenChange={setShowProfilePreview}
        profile={profilePreviewData}
        isLoading={profilePreviewLoading}
        error={profilePreviewError}
        notificationActivity={selectedNotif?.details?.message}
      />
    </header>
    </div>
  );
}
