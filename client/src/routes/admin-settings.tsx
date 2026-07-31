import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShieldCheck,
  Activity,
  Users,
  Boxes,
  Save,
  RotateCcw,
  AlertTriangle,
  Bell,
  Sliders,
  UserCheck,
  UserX,
  FileText,
  Megaphone,
} from "lucide-react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { TopBar } from "@/components/dashboard/top-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import {
  fetchAdminSettings,
  updateAdminSettings,
  resetAdminSettings,
  fetchAdminSystemStats,
  AdminSystemSettings,
} from "@/lib/api";

export const Route = createFileRoute("/admin-settings")({
  head: () => ({
    meta: [
      { title: "Admin System Settings · DraftYard" },
      {
        name: "description",
        content:
          "System administration console — configure global maintenance, user signup policy, draft quotas, and active system announcement banners.",
      },
    ],
  }),
  component: AdminSettingsPage,
});

function SectionCard({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-border/80 bg-card/90 p-6 shadow-sm backdrop-blur-sm ${className}`}
    >
      <div className="mb-5 border-b border-border/50 pb-4">
        <h3 className="font-display text-base font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function StatBox({
  icon: Icon,
  label,
  value,
  subtext,
  color = "primary",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subtext: string;
  color?: "primary" | "emerald" | "violet" | "amber";
}) {
  const colorMap = {
    primary: "bg-primary/10 text-primary border-primary/20",
    emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    violet: "bg-violet-500/10 text-violet-500 border-violet-500/20",
    amber: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  };

  return (
    <div className={`rounded-xl border p-4 transition-all duration-200 ${colorMap[color]}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground">
        {value}
      </div>
      <div className="mt-1 text-[11px] opacity-80">{subtext}</div>
    </div>
  );
}

function AdminSettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isAdmin =
    user?.role === "admin" || user?.email?.toLowerCase() === "draftadmin@gmail.com";

  // Safeguard redirect for non-admins
  useEffect(() => {
    if (user && !isAdmin) {
      toast.error("Access denied: Administrative privileges required.");
      navigate({ to: "/settings" });
    }
  }, [user, isAdmin, navigate]);

  // Fetch admin settings & system stats
  const { data: settingsData, isLoading: isSettingsLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: fetchAdminSettings,
    enabled: !!isAdmin,
  });

  const { data: statsData } = useQuery({
    queryKey: ["admin-system-stats"],
    queryFn: fetchAdminSystemStats,
    enabled: !!isAdmin,
    refetchInterval: 30000,
  });

  // Local form state
  const [form, setForm] = useState<Partial<AdminSystemSettings>>({});
  const [activeTab, setActiveTab] = useState<"platform" | "announcement">("platform");

  // Populate local form when query succeeds
  useEffect(() => {
    if (settingsData) {
      setForm(settingsData);
    }
  }, [settingsData]);

  // Update Settings Mutation
  const updateMutation = useMutation({
    mutationFn: () => updateAdminSettings(form),
    onSuccess: (res) => {
      queryClient.setQueryData(["admin-settings"], res.settings);
      queryClient.invalidateQueries({ queryKey: ["public-settings"] });
      setForm(res.settings);
      toast.success("Admin system settings saved & live for all users!");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to save admin settings"),
  });

  // Reset Settings Mutation
  const resetMutation = useMutation({
    mutationFn: resetAdminSettings,
    onSuccess: (res) => {
      queryClient.setQueryData(["admin-settings"], res.settings);
      queryClient.invalidateQueries({ queryKey: ["public-settings"] });
      setForm(res.settings);
      toast.success("Admin settings reset to factory defaults!");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to reset settings"),
  });

  if (!isAdmin) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <SidebarInset>
          <TopBar showGreeting={false} />

          <main className="px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-6xl flex-col gap-6">
              {/* Header Banner */}
              <div className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      <ShieldCheck className="h-3.5 w-3.5" /> ADMINISTRATOR CONSOLE
                    </span>
                  </div>
                  <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground">
                    Admin System Settings
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Manage global user policies, maintenance windows, registration controls, and system announcement banners.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" asChild className="gap-2">
                    <Link to="/settings">
                      <UserCheck className="h-4 w-4 text-muted-foreground" /> Personal Profile Settings
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    className="gap-2 shadow-sm"
                    onClick={() => updateMutation.mutate()}
                    disabled={updateMutation.isPending || isSettingsLoading}
                  >
                    <Save className="h-4 w-4" />
                    {updateMutation.isPending ? "Saving..." : "Save & Apply Settings"}
                  </Button>
                </div>
              </div>

              {/* Maintenance Mode Warning Notice (If Active) */}
              {form.maintenanceMode && (
                <div className="flex items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <div className="min-w-0 flex-1 text-xs">
                    <span className="font-semibold">MAINTENANCE MODE IS CURRENTLY ACTIVE!</span> Users will see a global maintenance banner and draft submissions are restricted.
                  </div>
                </div>
              )}

              {/* System Overview Stats Bar */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatBox
                  icon={Users}
                  label="Total Platform Users"
                  value={statsData?.totalUsers ?? 0}
                  subtext={`${statsData?.adminCount ?? 1} Admin Account(s)`}
                  color="primary"
                />
                <StatBox
                  icon={Boxes}
                  label="Active User Drafts"
                  value={statsData?.totalDrafts ?? 0}
                  subtext={`Quota: ${form.maxDraftsPerUser ?? 50} per user`}
                  color="emerald"
                />
                <StatBox
                  icon={form.allowRegistrations ? UserCheck : UserX}
                  label="User Registrations"
                  value={form.allowRegistrations ? "Open" : "Disabled"}
                  subtext={form.allowRegistrations ? "Public signups enabled" : "New signups blocked"}
                  color={form.allowRegistrations ? "emerald" : "amber"}
                />
                <StatBox
                  icon={Activity}
                  label="Announcement Status"
                  value={form.announcementActive ? "Active" : "Hidden"}
                  subtext={form.announcementActive ? "Live banner displayed" : "Banner disabled"}
                  color={form.announcementActive ? "violet" : "primary"}
                />
              </div>

              {/* Navigation Tabs */}
              <div className="flex overflow-x-auto border-b border-border/80 pb-px scrollbar-none">
                <div className="flex gap-2">
                  {[
                    { id: "platform", label: "Platform & User Rules", icon: Sliders },
                    { id: "announcement", label: "Active Announcement Banner", icon: Megaphone },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-xs font-medium transition-colors ${
                          isActive
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab Contents */}
              {isSettingsLoading ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  Loading system configuration...
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {/* TAB 1: Platform & User Rules */}
                  {activeTab === "platform" && (
                    <div className="grid gap-6 lg:grid-cols-2">
                      <SectionCard
                        title="Registration & Access Enforcement"
                        subtitle="Control platform registration and maintenance state"
                      >
                        <div className="flex flex-col gap-5">
                          <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 p-3.5">
                            <div>
                              <div className="text-sm font-medium">Allow New User Registrations</div>
                              <div className="text-xs text-muted-foreground">
                                Enable or disable new user signups across DraftYard
                              </div>
                            </div>
                            <Switch
                              checked={form.allowRegistrations ?? true}
                              onCheckedChange={(val) =>
                                setForm((prev) => ({ ...prev, allowRegistrations: val }))
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 p-3.5">
                            <div>
                              <div className="text-sm font-medium">Enable Maintenance Mode</div>
                              <div className="text-xs text-muted-foreground">
                                Put DraftYard in read-only maintenance mode for non-admin users
                              </div>
                            </div>
                            <Switch
                              checked={!!form.maintenanceMode}
                              onCheckedChange={(val) =>
                                setForm((prev) => ({ ...prev, maintenanceMode: val }))
                              }
                            />
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <Label className="text-xs font-medium text-muted-foreground">
                              Maintenance Banner Notice Message
                            </Label>
                            <Textarea
                              rows={2}
                              value={form.maintenanceNotice || ""}
                              onChange={(e) =>
                                setForm((prev) => ({ ...prev, maintenanceNotice: e.target.value }))
                              }
                              placeholder="Message shown during maintenance window..."
                            />
                          </div>

                          <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 p-3.5">
                            <div>
                              <div className="text-sm font-medium">Auto-Moderation Engine</div>
                              <div className="text-xs text-muted-foreground">
                                Automatically flag inappropriate drafts & spam submissions
                              </div>
                            </div>
                            <Switch
                              checked={form.autoModeration ?? true}
                              onCheckedChange={(val) =>
                                setForm((prev) => ({ ...prev, autoModeration: val }))
                              }
                            />
                          </div>
                        </div>
                      </SectionCard>

                      <SectionCard
                        title="User Draft Quotas & Upload Limits"
                        subtitle="Define operational limits for standard user accounts"
                      >
                        <div className="flex flex-col gap-5">
                          <div className="flex flex-col gap-2">
                            <Label className="text-xs font-medium text-muted-foreground">
                              Maximum Allowed Drafts Per User
                            </Label>
                            <Input
                              type="number"
                              min={1}
                              max={500}
                              value={form.maxDraftsPerUser ?? 50}
                              onChange={(e) =>
                                setForm((prev) => ({
                                  ...prev,
                                  maxDraftsPerUser: parseInt(e.target.value) || 50,
                                }))
                              }
                            />
                            <p className="text-[11px] text-muted-foreground">
                              Prevents database spam by limiting how many drafts a single user account can publish.
                            </p>
                          </div>

                          <div className="flex flex-col gap-2">
                            <Label className="text-xs font-medium text-muted-foreground">
                              Maximum Upload File Size (MB)
                            </Label>
                            <Input
                              type="number"
                              min={1}
                              max={100}
                              value={form.maxFileUploadMb ?? 25}
                              onChange={(e) =>
                                setForm((prev) => ({
                                  ...prev,
                                  maxFileUploadMb: parseInt(e.target.value) || 25,
                                }))
                              }
                            />
                            <p className="text-[11px] text-muted-foreground">
                              Max allowed size for avatar uploads, attachment files, and project media.
                            </p>
                          </div>

                          <div className="pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full gap-2 text-xs"
                              onClick={() => {
                                if (window.confirm("Reset all admin settings to factory defaults?")) {
                                  resetMutation.mutate();
                                }
                              }}
                              disabled={resetMutation.isPending}
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              {resetMutation.isPending ? "Resetting..." : "Reset Settings to Factory Defaults"}
                            </Button>
                          </div>
                        </div>
                      </SectionCard>
                    </div>
                  )}

                  {/* TAB 2: Active System Announcement Banner */}
                  {activeTab === "announcement" && (
                    <SectionCard
                      title="System Announcement Banner Configuration"
                      subtitle="Display a live alert banner at the top of every user's dashboard"
                    >
                      <div className="grid gap-6 lg:grid-cols-2">
                        <div className="flex flex-col gap-5">
                          <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 p-3.5">
                            <div>
                              <div className="text-sm font-medium">Activate Global Announcement</div>
                              <div className="text-xs text-muted-foreground">
                                Display live announcement banner across all logged-in user pages
                              </div>
                            </div>
                            <Switch
                              checked={!!form.announcementActive}
                              onCheckedChange={(val) =>
                                setForm((prev) => ({ ...prev, announcementActive: val }))
                              }
                            />
                          </div>

                          <div className="flex flex-col gap-2">
                            <Label className="text-xs font-medium text-muted-foreground">
                              Banner Alert Type / Theme
                            </Label>
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                              {(["info", "success", "warning", "destructive"] as const).map(
                                (type) => (
                                  <button
                                    key={type}
                                    type="button"
                                    onClick={() => setForm((prev) => ({ ...prev, announcementType: type }))}
                                    className={`rounded-lg border px-3 py-2 text-center text-xs font-medium capitalize transition-all ${
                                      form.announcementType === type
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-border text-muted-foreground hover:bg-accent"
                                    }`}
                                  >
                                    {type}
                                  </button>
                                )
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <Label className="text-xs font-medium text-muted-foreground">
                              Announcement Message Content
                            </Label>
                            <Textarea
                              rows={3}
                              value={form.announcementText || ""}
                              onChange={(e) =>
                                setForm((prev) => ({ ...prev, announcementText: e.target.value }))
                              }
                              placeholder="Enter broadcast message for all users..."
                            />
                          </div>
                        </div>

                        {/* Live Banner Preview */}
                        <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-accent/20 p-4">
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Live User Panel Banner Preview
                          </span>

                          {form.announcementActive ? (
                            <div
                              className={`rounded-xl border p-4 text-xs font-medium shadow-sm transition-all ${
                                form.announcementType === "warning"
                                  ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                  : form.announcementType === "destructive"
                                  ? "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                  : form.announcementType === "success"
                                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : "border-primary/30 bg-primary/10 text-primary"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Bell className="h-4 w-4 shrink-0" />
                                <span>{form.announcementText || "No announcement text entered."}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                              Banner is currently inactive. Toggle switch on to show this banner to users.
                            </div>
                          )}
                        </div>
                      </div>
                    </SectionCard>
                  )}
                </div>
              )}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
