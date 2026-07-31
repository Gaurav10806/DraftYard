import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getInitials } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  Save,
  Users,
  Handshake,
  RefreshCw,
  Trash2,
  ChevronRight,
  Sparkles,
  FolderKanban,
  Lightbulb,
  Download,
  FolderDown,
  MessageSquareOff,
  Bell,
  Mail,
  FileEdit,
  UsersRound,
  RotateCcw,
  Brain,
  ShieldCheck,
  Sliders,
} from "lucide-react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { TopBar } from "@/components/dashboard/top-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchUserProfile, updateUserProfile } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("draftyard_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Helper: fetch a JSON file download and trigger browser save
async function downloadJSON(url: string, filename: string) {
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · DraftYard" },
      {
        name: "description",
        content:
          "Manage your DraftYard account, preferences and privacy — profile, notifications, AI preferences and data controls.",
      },
      { property: "og:title", content: "DraftYard Settings" },
      {
        property: "og:description",
        content: "Manage your DraftYard account, preferences and privacy.",
      },
    ],
  }),
  component: SettingsPage,
});

// ---------------- Reusable pieces ----------------

function SectionCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-border bg-card p-6 shadow-sm ${className}`}
    >
      <h3 className="mb-5 font-display text-base font-semibold tracking-tight">
        {title}
      </h3>
      {children}
    </section>
  );
}

function ToggleRow({
  icon: Icon,
  title,
  description,
  defaultChecked = false,
  tint = "primary",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  defaultChecked?: boolean;
  tint?: "primary" | "emerald" | "violet" | "amber" | "sky" | "rose";
}) {
  const [checked, setChecked] = useState(defaultChecked);
  const tintClass: Record<string, string> = {
    primary: "bg-primary/12 text-primary",
    emerald: "bg-emerald-500/12 text-emerald-500",
    violet: "bg-violet-500/12 text-violet-500",
    amber: "bg-amber-500/12 text-amber-500",
    sky: "bg-sky-500/12 text-sky-500",
    rose: "bg-rose-500/12 text-rose-500",
  };
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${tintClass[tint]}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{title}</div>
        <div className="truncate text-xs text-muted-foreground">
          {description}
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={setChecked} />
    </div>
  );
}

function ActionRow({
  icon: Icon,
  title,
  description,
  danger = false,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  danger?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-background/60 ${
        danger ? "text-destructive" : ""
      }`}
    >
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
          danger ? "bg-destructive/12 text-destructive" : "bg-primary/12 text-primary"
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div
          className={`text-sm font-medium ${danger ? "text-destructive" : ""}`}
        >
          {title}
        </div>
        <div className="truncate text-xs text-muted-foreground">
          {description}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

// ---------------- Page ----------------

function SettingsPage() {
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: userProfile, isLoading } = useQuery({
    queryKey: ["user-profile"],
    queryFn: fetchUserProfile,
    enabled: !!authUser,
  });

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");

  // Populate fields once profile loads
  useEffect(() => {
    if (userProfile) {
      setFullName(userProfile.fullName || "");
      setUsername(userProfile.username || "");
      setBio(userProfile.bio || "");
      setEmail((userProfile as any).email || authUser?.email || "");
    }
  }, [userProfile, authUser]);

  const saveMutation = useMutation({
    mutationFn: () => updateUserProfile({ fullName, username, bio }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["user-profile"], updated);
      toast.success("Profile updated successfully!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

 const initials = getInitials(fullName, email);

  // Data & Privacy handlers
  const [exporting, setExporting] = useState(false);
  const [exportingProjects, setExportingProjects] = useState(false);
  const [clearingChat, setClearingChat] = useState(false);

  const handleExportData = async () => {
    setExporting(true);
    try {
      await downloadJSON(`${API_BASE}/user/export`, "draftyard-my-data.json");
      toast.success("Your data has been downloaded!");
    } catch {
      toast.error("Failed to export data. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadProjects = async () => {
    setExportingProjects(true);
    try {
      await downloadJSON(`${API_BASE}/user/export-projects`, "draftyard-my-projects.json");
      toast.success("Your projects have been downloaded!");
    } catch {
      toast.error("Failed to download projects. Please try again.");
    } finally {
      setExportingProjects(false);
    }
  };

  const handleClearAIChat = async () => {
    setClearingChat(true);
    try {
      // Clear all AI chat keys from localStorage
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes("ai-chat") || key.includes("aiChat") || key.includes("chat-history"))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));

      // Also notify server
      await fetch(`${API_BASE}/user/ai-chat-history`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      toast.success("AI chat history cleared!");
    } catch {
      toast.error("Failed to clear chat history.");
    } finally {
      setClearingChat(false);
    }
  };

  const isAdmin = authUser?.role === "admin" || authUser?.email?.toLowerCase() === "draftadmin@gmail.com";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <SidebarInset>
          <TopBar showGreeting={false} />

          <main className="px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-6xl flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-semibold tracking-tight">
                    Settings
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Manage your account, preferences and privacy.
                  </p>
                </div>

                {isAdmin && (
                  <Button size="sm" asChild className="gap-2 shadow-sm">
                    <Link to="/admin-settings">
                      <Sliders className="h-4 w-4" /> Admin System Settings
                    </Link>
                  </Button>
                )}
              </div>

              {isAdmin && (
                <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 p-4 text-xs font-medium text-primary">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold">Administrator Privileges Active:</span> Looking for platform-wide configurations, system announcements, AI engine parameters, or diagnostic tools?
                  </div>
                  <Button size="sm" variant="outline" asChild className="shrink-0 gap-1 text-xs border-primary/40 hover:bg-primary/20">
                    <Link to="/admin-settings">
                      Open Admin Settings →
                    </Link>
                  </Button>
                </div>
              )}

              {/* Row 1: Profile + Account */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Profile Settings */}
                <SectionCard title="Profile Settings">
                  {isLoading ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">Loading profile...</div>
                  ) : (
                  <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
                    <div className="flex flex-col items-center gap-3 sm:items-start">
                      <div className="relative">
                        <Avatar className="h-28 w-28 ring-4 ring-background">
                          <AvatarImage src="" alt={fullName} />
                          <AvatarFallback className="bg-primary/12 text-2xl font-semibold text-primary">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <Camera className="h-3.5 w-3.5" /> Change photo
                      </Button>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="fullName" className="text-xs font-medium text-muted-foreground">
                          Full Name
                        </Label>
                        <Input
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Your full name"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="username" className="text-xs font-medium text-muted-foreground">
                          Username
                        </Label>
                        <Input
                          id="username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="your_username"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="bio" className="text-xs font-medium text-muted-foreground">
                          Bio
                        </Label>
                        <Textarea
                          id="bio"
                          rows={3}
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          className="resize-none"
                          placeholder="Tell us about yourself..."
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          disabled
                          className="opacity-60 cursor-not-allowed"
                        />
                        <p className="text-[11px] text-muted-foreground">Email cannot be changed.</p>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          className="gap-1.5"
                          onClick={() => saveMutation.mutate()}
                          disabled={saveMutation.isPending}
                        >
                          <Save className="h-3.5 w-3.5" />
                          {saveMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </div>
                  </div>
                  )}
                </SectionCard>

                {/* Account */}
                <SectionCard title="Account">
                  <div className="flex flex-col divide-y divide-border">
                    <ToggleRow
                      icon={Users}
                      title="Public Profile"
                      description="Allow others to view your profile"
                      defaultChecked
                      tint="primary"
                    />
                    <ToggleRow
                      icon={Handshake}
                      title="Open for Collaborations"
                      description="Allow others to send collaboration requests"
                      defaultChecked
                      tint="emerald"
                    />
                    <ToggleRow
                      icon={RefreshCw}
                      title="Open for Revival Requests"
                      description="Allow others to request revival of your drafts"
                      defaultChecked
                      tint="violet"
                    />
                  </div>

                  <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/[0.04] p-1">
                    <ActionRow
                      icon={Trash2}
                      title="Delete Account"
                      description="Permanently delete your account and data"
                      danger
                    />
                  </div>
                </SectionCard>
              </div>

              {/* Row 2: Notifications + AI Preferences + Data & Privacy */}
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Notifications */}
                <SectionCard title="Notifications">
                  <div className="flex flex-col divide-y divide-border">
                    <ToggleRow
                      icon={FileEdit}
                      title="Project Updates"
                      description="Get notified about project activities"
                      defaultChecked
                      tint="primary"
                    />
                    <ToggleRow
                      icon={UsersRound}
                      title="Collaboration Requests"
                      description="Get notified about new collaboration requests"
                      defaultChecked
                      tint="emerald"
                    />
                    <ToggleRow
                      icon={RotateCcw}
                      title="Revival Requests"
                      description="Get notified about revival requests"
                      defaultChecked
                      tint="violet"
                    />
                    <ToggleRow
                      icon={Bell}
                      title="AI Insights"
                      description="Get notified when new AI insights are available"
                      defaultChecked
                      tint="amber"
                    />
                    <ToggleRow
                      icon={Mail}
                      title="Email Notifications"
                      description="Receive email notifications"
                      defaultChecked
                      tint="sky"
                    />
                  </div>
                </SectionCard>

                {/* AI Preferences */}
                <SectionCard title="AI Preferences">
                  <div className="flex flex-col divide-y divide-border">
                    <ToggleRow
                      icon={Sparkles}
                      title="Enable AI Suggestions"
                      description="Get smart suggestions in your workspace"
                      defaultChecked
                      tint="primary"
                    />
                    <ToggleRow
                      icon={FolderKanban}
                      title="Enable Project Context"
                      description="Allow AI to use your project context"
                      defaultChecked
                      tint="violet"
                    />
                    <ToggleRow
                      icon={Lightbulb}
                      title="Enable Community Insights"
                      description="Show insights based on DraftYard community data"
                      defaultChecked
                      tint="amber"
                    />
                  </div>
                </SectionCard>

                {/* Data & Privacy */}
                <SectionCard title="Data & Privacy">
                  <div className="flex flex-col gap-1">
                    <ActionRow
                      icon={Download}
                      title={exporting ? "Exporting..." : "Export My Data"}
                      description="Download all your data"
                      onClick={handleExportData}
                    />
                    <ActionRow
                      icon={FolderDown}
                      title={exportingProjects ? "Downloading..." : "Download My Projects"}
                      description="Download all your projects and data"
                      onClick={handleDownloadProjects}
                    />
                    <ActionRow
                      icon={MessageSquareOff}
                      title={clearingChat ? "Clearing..." : "Clear AI Chat History"}
                      description="Clear all AI assistant conversations"
                      onClick={handleClearAIChat}
                    />
                  </div>
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-background/40 p-3 text-xs text-muted-foreground">
                    <Brain className="h-4 w-4 shrink-0 text-primary" />
                    Your data stays yours. Exports are delivered as portable JSON.
                  </div>
                </SectionCard>
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
