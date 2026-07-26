import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
  const [fullName, setFullName] = useState("Gaurav Soni");
  const [username, setUsername] = useState("@gauravsoni");
  const [bio, setBio] = useState(
    "Full Stack Developer passionate about building products that solve real world problems.",
  );
  const [email, setEmail] = useState("gauravsoni10806@gmail.com");

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <SidebarInset>
          <TopBar showGreeting={false} />

          <main className="px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-6xl flex-col gap-6">
              <div>
                <h1 className="font-display text-2xl font-semibold tracking-tight">
                  Settings
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage your account, preferences and privacy.
                </p>
              </div>

              {/* Row 1: Profile + Account */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Profile Settings */}
                <SectionCard title="Profile Settings">
                  <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
                    <div className="flex flex-col items-center gap-3 sm:items-start">
                      <div className="relative">
                        <Avatar className="h-28 w-28 ring-4 ring-background">
                          <AvatarImage src="" alt={fullName} />
                          <AvatarFallback className="bg-primary/12 text-2xl font-semibold text-primary">
                            GS
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
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button size="sm" className="gap-1.5">
                          <Save className="h-3.5 w-3.5" /> Save Changes
                        </Button>
                      </div>
                    </div>
                  </div>
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
                      title="Export My Data"
                      description="Download all your data"
                    />
                    <ActionRow
                      icon={FolderDown}
                      title="Download My Projects"
                      description="Download all your projects and data"
                    />
                    <ActionRow
                      icon={MessageSquareOff}
                      title="Clear AI Chat History"
                      description="Clear all AI assistant conversations"
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
